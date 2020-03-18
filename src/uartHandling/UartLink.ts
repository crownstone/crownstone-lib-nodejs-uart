import SerialPort from 'serialport'
import {UartReadBuffer} from "./UartReadBuffer";
import {UartPacket} from "./uartPackets/UartWrapperPacket";
import {UartParser} from "./UartParser";
import {eventBus} from "../singletons/EventBus";
import { ControlPacket, ControlType }  from "bluenet-nodejs-lib-core";
import {UartTxType} from "../declarations/enums";
import {UartWrapper} from "./uartPackets/UartWrapper";

const HANDSHAKE = "HelloCrownstone";

export class UartLink {
  port    : SerialPort = null;
  success : boolean    = false;

  readBuffer : UartReadBuffer = null;

  parser;
  resolver;
  rejecter;

  unsubscribe;
  reconnectionCallback;

  constructor(reconnectionCallback) {
    this.reconnectionCallback = reconnectionCallback;
    this.readBuffer = new UartReadBuffer((data : UartPacket) => { UartParser.parse(data) });
  }


  destroy() : Promise<void> {
    return new Promise((resolve, reject) => {
      this.port.close(() => { this.cleanup(); resolve(); });
    })
  }


  cleanup() {
    this.unsubscribe();
    this.port.removeAllListeners();
    this.parser.removeAllListeners();
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


  handleNewConnection() {
    // we will try a handshake.
    this.echo(HANDSHAKE);

    let closeTimeout = setTimeout(() => { if (!this.success) { this.closeConnection(); this.rejecter(); }}, 200);

    this.unsubscribe = eventBus.on("UartMessage", (message) => {
      if (message?.string === HANDSHAKE) {
        clearTimeout(closeTimeout);
        this.success = true;
        this.unsubscribe();
        this.resolver();
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
    this.reconnectionCallback();
    this.reconnectionCallback = () => {};
  }


  echo(string) {
    let controlPacket = new ControlPacket(ControlType.UART_MESSAGE).loadString(string).getPacket();
    let uartPacket    = new UartWrapper(  UartTxType.CONTROL, controlPacket).getPacket();

    this.write(uartPacket);
  }


  write(data) {
    this.port.write(data);
  }

}