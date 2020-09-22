import SerialPort from 'serialport'
import {UartReadBuffer} from "./UartReadBuffer";
import {UartParser} from "./UartParser";
import {eventBus} from "../singletons/EventBus";
import {UartEncryptionContainer} from "./UartEncryptionContainer";

import {Logger} from "../Logger";
import {UartWrapperPacketV2} from "./uartPackets/UartWrapperPacketV2";
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

  constructor(reconnectionCallback, encryptionContainer : UartEncryptionContainer) {
    this.reconnectionCallback = reconnectionCallback;

    // the read buffer will parse the message's outer container (start, end, crc);
    let parseCallback = (data : UartWrapperPacketV2) => { UartParser.parse(data) };
    this.readBuffer = new UartReadBuffer(parseCallback, encryptionContainer);

    // load new, updated session nonce data into the container.
    this.unsubscribeEvents.push(
      eventBus.on(
        "SessionNonceReceived",
        (data: Buffer) => { encryptionContainer.setIncomingSessionData(data); }
    ));
  }

  destroy() : Promise<void> {
    return new Promise((resolve, reject) => {
      this.cleanup();
      this.port.close(() => { resolve(); });
    })
  }

  cleanup() {
    this.unsubscribeHello();
    this.unsubscribeEvents.forEach((unsub) => { unsub(); });

    if (this.port) { this.port.removeAllListeners(); }
    if (this.parser) { this.parser.removeAllListeners(); }

    clearInterval(this.pingInterval);
  }

  tryConnectingToPort(port)  : Promise<void> {
    return new Promise((resolve, reject) => {
      this.resolver = resolve;
      this.rejecter = reject;

      this.port   = new SerialPort(port,{ baudRate: 230400 });
      this.parser = new SerialPort.parsers.ByteLength({length: 1});
      this.port.pipe(this.parser);

      this.pingInterval = setInterval(() => { this.heartBeat()}, 2000)

      // bind all the events
      this.parser.on('data',(response) => { this.readBuffer.addByteArray(response); });
      this.port.on("open",  ()         => { this.handleNewConnection();             });
      this.port.on("close", ()         => { this.closeConnection();                 });
      this.port.on("error", (err)      => { this.handleError(err);                  });
    })
  }


  handleNewConnection() {
    log.info("Setting up new connection...")
    // we will try a handshake.
    this.sayHello();

    let closeTimeout = setTimeout(() => { if (!this.success) {
      log.info("Failed setting up connection, timeout");
      this.closeConnection();
      this.rejecter();
    }}, 1000);

    this.unsubscribeHello = eventBus.on("HelloReceived", (message) => {
      clearTimeout(closeTimeout);
      this.success = true;
      this.unsubscribeHello();
      this.resolver();
    });
  }


  closeConnection() {
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


  heartBeat() {

  }

  sayHello() {

  }

  // echo(string) {
  //   let controlPacket = new ControlPacket(ControlType.UART_MESSAGE).loadString(string).getPacket();
  //   let uartPacket    = new UartWrapper(  UartTxType.CONTROL, controlPacket).getPacket();
  //
  //   this.write(uartPacket);
  // }

  write(data : Buffer) : Promise<void> {
    return new Promise((resolve, reject) => {
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
