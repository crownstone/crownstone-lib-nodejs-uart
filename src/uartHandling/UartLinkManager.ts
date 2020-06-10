import SerialPort from 'serialport'
import {UartReadBuffer} from "./UartReadBuffer";
import {UartPacket} from "./uartPackets/UartWrapperPacket";
import {UartParser} from "./UartParser";
import {eventBus} from "../singletons/EventBus";
import {
  ControlPacket,
  ControlType,
  StoneMultiSwitchPacket,
  MeshMultiSwitchPacket,
  Util,
  ControlPacketsGenerator
} from "crownstone-core";
import {UartTxType} from "../declarations/enums";
import {UartWrapper} from "./uartPackets/UartWrapper";
import {UartLink} from "./UartLink";

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


export class UartLinkManager {
  autoReconnect = false;

  port : UartLink = null;
  triedPorts = [];

  constructor(autoReconnect = true) {
    this.autoReconnect = autoReconnect;
  }

  start() : Promise<void> {
    return this.initiateConnection();
  }

  restart() : Promise<void> {
    if (this.autoReconnect) {
      this.port = null;
      this.triedPorts = [];
      return this.initiateConnection();
    }
  }

  close() : Promise<void> {
    return this.port.destroy();
  }


  initiateConnection() : Promise<void> {
    return updatePorts()
      .then((available) => {
        let ports = available;
        let portPaths = Object.keys(ports);

        return Util.promiseBatchPerformer(portPaths, (port) => {
          // we use indexOf to check if a part of this string is in the manufacturer. It cah possibly differ between platforms.
          if (ports[port].port?.manufacturer.indexOf("Silicon Lab") !== -1 || ports[port].port?.manufacturer.indexOf("SEGGER") !== -1) {
            if (this.triedPorts.indexOf(port) === -1) {
              return this.tryConnectingToPort(port);
            }
          }
          return Promise.resolve();
        })
      })
      .then(() => {
        // Handle the case where none of the connected devices match.
        if (this.port === null) {
          throw "COULD_NOT_OPEN_CONNECTION_TO_UART";
        }
      })
      .catch((err) => {
        this.triedPorts = [];
        if (this.autoReconnect) {
          return new Promise((resolve, reject) => {
            setTimeout(() => { resolve(); }, 500);
          })
            .then(() => {
              return this.initiateConnection();
            })
        }
        else {
          throw err;
        }
      })
  }

  tryConnectingToPort(port)  : Promise<void> {
    return new Promise((resolve, reject) => {
      this.triedPorts.push(port);
      let link = new UartLink(() => { this.restart(); });
      link.tryConnectingToPort(port)
        .then(() => {
          this.port = link;
          resolve();
        })
        .catch((err) => {
          reject(err);
        })
    })
  }

  echo(data) {
    this.port.echo(data);
  }
  write(data) {
    this.port.write(data);
  }

}