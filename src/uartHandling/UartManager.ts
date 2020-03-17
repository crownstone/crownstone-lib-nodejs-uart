import SerialPort from 'serialport'
import {UartReadBuffer} from "./UartReadBuffer";
import {UartPacket} from "./uartPackets/UartWrapperPacket";
import {UartParser} from "./UartParser";
import {eventBus} from "../singletons/EventBus";
import {ControlPacket, ControlType, StoneMultiSwitchPacket, MeshMultiSwitchPacket, Util} from "bluenet-nodejs-lib-core";
import {UartWrapper} from "./uartPackets/UartWrapper";
import {UartTxType} from "../declarations/enums";

function updatePorts() {
  return new Promise((resolve, reject) => {
    let availablePorts = {};
    SerialPort.list().then((ports) => {
      ports.forEach((port) => {
        availablePorts[port.path] = {port:port, connected:false};
      });
      resolve(availablePorts);
    });
  })
}


export class UartManager {
  ports = {};
  port : SerialPort = null;

  readBuffer : UartReadBuffer = null
  triedPaths = [];

  constructor() {
    this.readBuffer = new UartReadBuffer((data : UartPacket) => { UartParser.parse(data) });

  }

  start() : Promise<void> {
    return this._openPort();
  }


  close() : Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.port !== null) {
        this.port.close(() => {
          // clean up
          this.ports = {};
          this.port = null;
          this.triedPaths = [];

          // finished!
          resolve();
        })
      }
      else {
        resolve();
      }
    })
  }


  _openPort() : Promise<void> {
    return updatePorts().then((available) => {
      this.ports = available;

      let portPaths = Object.keys(this.ports);

      return Util.promiseBatchPerformer(portPaths, (path) => {
        // we use indexOf to check if a part of this string is in the manufacturer. It cah possibly differ between platforms.
        if (this.ports[path].port?.manufacturer.indexOf("Silicon Lab") !== -1 || this.ports[path].port?.manufacturer.indexOf("SEGGER") !== -1) {
          if (this.triedPaths.indexOf(path) === -1) {
            return this._tryPath(path);
          }
        }
        return Promise.resolve();
      })
    })
      .then(() => {
        // Handle the case where none of the connected devices match.
        if (this.port === null) {
          throw "COULD_NOT_OPEN_CONNECTION_TO_UART"
        }
      });
  }

  _tryPath(path)  : Promise<void> {
    return new Promise((resolve, reject) => {
      this.triedPaths.push(path);
      this.port = new SerialPort(path,{ baudRate: 230400 });

      const ByteLength = SerialPort.parsers.ByteLength;
      const parser = new ByteLength({length: 1});
      this.port.pipe(parser)

      parser.on('data', (response) => { this.readBuffer.addByteArray(response); });
      this.port.on("open", () => {
        let HANDSHAKE = "HelloCrownstone";
        let success = false;
        let unsubscribe = eventBus.on("UartMessage", (data) => {
          if (data?.string === HANDSHAKE) {
            success = true;
            clearTimeout(closeTimeout);
            unsubscribe();
            resolve();
          }})
        let closeTimeout = setTimeout(() => {
          if (!success) {
            unsubscribe();
            this.port.close(() => {
              // try another.
              this.port = null;
              this._openPort()
                .then(() => { resolve(); })
                .catch((err) => { reject(err); })
            })
          }
        }, 200);
        this.echo(HANDSHAKE);
      })
    })
  }


  echo(string) {
    let controlPacket = new ControlPacket(ControlType.UART_MESSAGE).loadString(string).getPacket()

    // finally wrap it in an Uart packet
    let uartPacket = new UartWrapper(UartTxType.CONTROL, controlPacket).getPacket()

    this.port.write(uartPacket);
  }

  switchCrownstone(crownstoneId: number, switchState: number) : Promise<void> {
    // create a stone switch state packet to go into the multi switch
    let stoneSwitchPacket     = new StoneMultiSwitchPacket(crownstoneId, switchState)

    // wrap it in a mesh multi switch packet
    let meshMultiSwitchPacket = new MeshMultiSwitchPacket([stoneSwitchPacket]).getPacket()

    // wrap that in a control packet
    let controlPacket         = new ControlPacket(ControlType.MULTISWITCH).loadByteArray(meshMultiSwitchPacket).getPacket()


    // finally wrap it in an Uart packet
    let uartPacket = new UartWrapper(UartTxType.CONTROL, controlPacket).getPacket()

    this.port.write(uartPacket);

    return new Promise((resolve, reject) => { setTimeout(() => { resolve() }, 100); })
  }

}