import SerialPort from 'serialport'
import {UartReadBuffer} from "./UartReadBuffer";
import {UartParser} from "./UartParser";
import {eventBus} from "../singletons/EventBus";

import {Logger} from "../Logger";
import {UartWrapperPacketV2} from "./uartPackets/UartWrapperPacketV2";
import {UartWrapperV2} from "./uartPackets/UartWrapperV2";
import {UartRxType, UartTxType} from "../declarations/enums";
import {UartTransferOverhead} from "./containers/UartTransferOverhead";
import {UartMessageQueue} from "./containers/UartMessageQueue";
const log = Logger(__filename);

export class UartLink {
  port    : SerialPort = null;
  success : boolean    = false;

  readBuffer : UartReadBuffer = null;

  parser;
  resolver;
  rejecter;
  pingInterval;

  unsubscribeEvents : (() => void)[] = [];
  unsubscribeHello = () => {};
  reconnectionCallback;
  heartBeatInterval = null;

  transferOverhead: UartTransferOverhead;
  queue : UartMessageQueue;

  constructor(reconnectionCallback, transferOverhead : UartTransferOverhead) {
    this.queue = new UartMessageQueue((data) => { return this._write(data); })
    this.transferOverhead = transferOverhead;
    this.reconnectionCallback = reconnectionCallback;

    // the read buffer will parse the message's outer container (start, end, crc);
    let parseCallback = (data : UartWrapperPacketV2) => { UartParser.parse(data) };
    this.readBuffer = new UartReadBuffer(parseCallback, transferOverhead);

    // load new, updated session nonce data into the container.
    this.unsubscribeEvents.push(
      eventBus.on(
        "SessionNonceReceived",
        (data: Buffer) => { transferOverhead.setIncomingSessionData(data); }
    ));
  }

  destroy() : Promise<void> {
    clearInterval(this.heartBeatInterval);
    return new Promise((resolve, reject) => {
      this.cleanup();
      this.port.close(() => { resolve(); });
    })
  }

  cleanup() {
    clearInterval(this.heartBeatInterval);
    this.unsubscribeHello();
    this.unsubscribeEvents.forEach((unsub) => { unsub(); });

    if (this.port) { this.port.removeAllListeners(); }
    if (this.parser) { this.parser.removeAllListeners(); }

    clearInterval(this.pingInterval);
    this.queue.cleanup();
  }

  tryConnectingToPort(port)  : Promise<void> {
    return new Promise((resolve, reject) => {
      this.resolver = resolve;
      this.rejecter = reject;

      this.port   = new SerialPort(port,{ baudRate: 230400 });
      this.parser = new SerialPort.parsers.ByteLength({length: 1});
      this.port.pipe(this.parser);

      // bind all the events
      this.parser.on('data',(response) => { this.readBuffer.addByteArray(response); });
      this.port.on("open",  ()         => { this.handleNewConnection();             });
      this.port.on("close", ()         => { this.closeConnection();                 });
      this.port.on("error", (err)      => { this.handleError(err);                  });
    })
  }


  async handleNewConnection() {
    log.info("Setting up new connection...")
    // we will try a handshake.
    let closeTimeout = setTimeout(() => { if (!this.success) {
      log.info("Failed setting up connection, timeout");
      this.closeConnection();
      this.rejecter();
    }}, 1000);

    this.unsubscribeHello = eventBus.on("HelloReceived", () => {
      clearTimeout(closeTimeout);
      this.success = true;
      this.unsubscribeHello();
      this.heartBeatInterval = setInterval(() => { this.heartBeat()}, 2000);
      this.resolver();
    });

    await this.write(new UartWrapperV2(UartTxType.HELLO))
  }


  closeConnection() {
    clearInterval(this.heartBeatInterval);
    let connectionHasBeenSuccessful = this.success;
    this.port.close(() => { this.cleanup(); });
    if (connectionHasBeenSuccessful) {
      this.reconnectionCallback();
      this.reconnectionCallback = () => {};
    }
  }


  handleError(err) {
    this.destroy()
      .then(() => {
        log.info("Connection error", err)
        this.reconnectionCallback();
        this.reconnectionCallback = () => {};
      })
  }

  async heartBeat() {
    let timeout = Buffer.alloc(2); timeout.writeUInt16LE(4,0);
    await this.write(new UartWrapperV2(UartTxType.HEARTBEAT, timeout));
  }

  // echo(string) {
  //   let controlPacket = new ControlPacket(ControlType.UART_MESSAGE).loadString(string).getPacket();
  //   let uartPacket    = new UartWrapper(  UartTxType.CONTROL, controlPacket).getPacket();
  //
  //   this.write(uartPacket);
  // }

  async write(uartMessage: UartWrapperV2) : Promise<void> {
    // handle encryption here.
    uartMessage.setDeviceId(this.transferOverhead.deviceId);
    let dataType = uartMessage.dataType
    let packet;
    if (this.transferOverhead.encryption.key !== null && dataType !== UartRxType.HELLO) {
      // ENCRYPT
      log.verbose("Encrypting packet...", uartMessage.getPacket())
      let encryptedPacket = uartMessage.getEncryptedPacket(
        this.transferOverhead.encryption.outgoingSessionData,
        this.transferOverhead.encryption.key
      );
      packet = encryptedPacket;
    }
    else {
      packet = uartMessage.getPacket();
    }

    return new Promise((resolve, reject) => {
      this.queue.add(uartMessage.dataType, packet, resolve, reject);
    });
  }

  _write(data) : Promise<void> {
    return new Promise((resolve, reject) => {
      log.verbose("Writing packet");
      this.port.write(data, (err) => {
        if (err) {
          this.handleError(err);
          reject(err);
        }
        else {
          resolve()
        }
      });
    });
  }

}
