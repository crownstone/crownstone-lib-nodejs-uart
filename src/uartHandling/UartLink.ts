import SerialPort from 'serialport'
import {UartReadBuffer} from "./UartReadBuffer";
import {UartPacket} from "./uartPackets/UartWrapperPacket";
import {UartParser} from "./UartParser";
import {eventBus} from "../singletons/EventBus";
import { ControlPacket, ControlType }  from "crownstone-core";
import {UartTxType} from "../declarations/enums";
import {UartWrapper} from "./uartPackets/UartWrapper";

const HANDSHAKE = "HelloCrownstone";
const log = require('debug-level')('uart-link')

export class UartLink {
  port    : SerialPort = null;
  success : boolean    = false;

  readBuffer : UartReadBuffer = null;

  parser;
  resolver;
  rejecter;
  pingInterval;

  unsubscribe;
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
    this.port.removeAllListeners();
    this.parser.removeAllListeners();
    clearInterval(this.pingInterval);
  }

  tryConnectingToPort(port)  : Promise<void> {
    return new Promise((resolve, reject) => {
      this.resolver = resolve;
      this.rejecter = reject;

      this.port   = new SerialPort(port,{ baudRate: 230400 });
      this.parser = new SerialPort.parsers.ByteLength({length: 1});
      this.port.pipe(this.parser);

      this.pingInterval = setInterval(() => { this.echo("ping")}, 500)

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

    let closeTimeout = setTimeout(() => { if (!this.success) { this.closeConnection(); this.rejecter(); }}, 1000);

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
        log.debug("Connection error", err)
        this.reconnectionCallback();
        this.reconnectionCallback = () => {};
      })
  }


  echo(string) {
    let controlPacket = new ControlPacket(ControlType.UART_MESSAGE).loadString(string).getPacket();
    let uartPacket    = new UartWrapper(  UartTxType.CONTROL, controlPacket).getPacket();

    this.write(uartPacket);
  }

  write(data : Buffer) {
    this.port.write(data, (err) => {
      if (err) { this.handleError(err); }
    });
  }

}

//
// 126, 1, 0, 20, 0, 5, 50, 0, 15, 0, 72, 101, 108, 108, 111, 67, 114, 111, 119, 110, 115, 116, 111, 110, 101, 33, 204
// 126, 1, 0, 19, 0, 50, 0, 15, 0, 72, 101, 108, 108, 111, 67, 114, 111, 119, 110, 115, 116, 111, 110, 101, 123, 174,