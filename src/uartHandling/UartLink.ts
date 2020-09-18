import SerialPort from 'serialport'
import {UartReadBuffer} from "./UartReadBuffer";
import {UartPacket} from "./uartPackets/UartWrapperPacket";
import {UartParser} from "./UartParser";
import {eventBus} from "../singletons/EventBus";

const log = require('debug-level')('crownstone-uart-link')

export class UartLink {
  port    : SerialPort = null;
  success : boolean    = false;

  readBuffer : UartReadBuffer = null;

  parser;
  resolver;
  rejecter;
  pingInterval;

  unsubscribe = () => {};
  reconnectionCallback;

  constructor(reconnectionCallback) {
    this.reconnectionCallback = reconnectionCallback;
    this.readBuffer = new UartReadBuffer((data : UartPacket) => { UartParser.parse(data) });
  }

  destroy() : Promise<void> {
    return new Promise((resolve, reject) => {
      this.cleanup();
      this.port.close(() => { resolve(); });
    })
  }

  cleanup() {
    this.unsubscribe();

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
    // we will try a handshake.
    this.sayHello();

    let closeTimeout = setTimeout(() => { if (!this.success) { this.closeConnection(); this.rejecter(); }}, 1000);

    // TODO: handle handshake.
    this.unsubscribe = eventBus.on("UartMessage", (message) => {
      if (message?.string === HANDSHAKE) {
        clearTimeout(closeTimeout);
        this.success = true;
        this.unsubscribe();
        this.resolver();
      }
      else {
        // handle failure
      }
    })
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

  write(data : Buffer) {
    this.port.write(data, (err) => {
      if (err) { this.handleError(err); }
    });
  }

}
