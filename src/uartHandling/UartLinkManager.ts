import SerialPort from 'serialport'
import {UartLink} from "./UartLink";
import {getSnapSerialList} from "./snapDiscovery";
import {CONFIG} from "../config/config";
import {Util} from "crownstone-core";
import {Logger} from "../Logger";
import {UartWrapperV2} from "./uartPackets/UartWrapperV2";
import {UartTransferOverhead} from "./containers/UartTransferOverhead";
const log = Logger(__filename);

let UPDATE_PORTS;

if (CONFIG.useSearchById) {
  UPDATE_PORTS = function() {
    return getSnapSerialList()
  }
}
else {
  UPDATE_PORTS = function() {
    return new Promise((resolve, reject) => {
      let availablePorts = {};
      SerialPort.list().then((ports) => {
        ports.forEach((port) => {
          availablePorts[port.path] = {port: port, connected: false};
        });
        resolve(availablePorts);
      });
    })
  }
}

export class UartLinkManager {
  autoReconnect = false;

  transferOverhead: UartTransferOverhead;
  port : UartLink = null;
  connected = false;
  triedPorts = [];

  forcedPort = null;

  constructor(autoReconnect, transferOverhead: UartTransferOverhead) {
    this.transferOverhead = transferOverhead;
    this.autoReconnect = autoReconnect;
  }

  start(forcedPort = null) : Promise<void> {
    this.forcedPort = forcedPort;
    return this.initiateConnection();
  }

  async restart() : Promise<void> {
    this.connected = false;

    if (this.autoReconnect) {
      this.port = null;
      this.triedPorts = [];
      await Util.wait(250);
      return this.initiateConnection();
    }
  }

  close() : Promise<void> {
    return this.port.destroy();
  }


  initiateConnection() : Promise<void> {
    let promise;
    if (this.forcedPort) {
      promise = this.tryConnectingToPort(this.forcedPort);
    }
    else {
      promise = UPDATE_PORTS()
        .then((available) => {
          log.debug("Available ports on the system", available);
          let ports = available;
          let portIds = Object.keys(ports);
          return Util.promiseBatchPerformer(portIds, (portId) => {
            // we found a match. Do not try further
            if (this.connected) { return Promise.resolve(); }

            let port = ports[portId].port?.path || portId;

            if (CONFIG.useManufacturer === false || CONFIG.useSearchById) {
              if (this.triedPorts.indexOf(port) === -1) {
                return this.tryConnectingToPort(port);
              }
            }
            else {
              let manufacturer = ports[portId].port?.manufacturer;
              // we use indexOf to check if a part of this string is in the manufacturer. It can possibly differ between platforms.
              if (manufacturer && (manufacturer.indexOf("Silicon Lab") !== -1 || manufacturer.indexOf("SEGGER") !== -1)) {
                if (this.triedPorts.indexOf(port) === -1) {
                  return this.tryConnectingToPort(port);
                }
              }
            }
            return Promise.resolve();
          })
        })
        .then(() => {
          // Handle the case where none of the connected devices match.
          if (this.port === null) {
            log.info("Could not find a Crownstone USB connected.");
            throw "COULD_NOT_OPEN_CONNECTION_TO_UART";
          }
        })
    }

    return promise.catch((err) => {
      log.info("initiateConnection error", err)
      if (err && err.message && err.message.indexOf('Cannot lock port') !== -1) {
        // Do not clear the list here. This bus is already in use. Try another. It will wrap back around due to the COULD_NOT_OPEN_CONNECTION_TO_UART.
      }
      else {
        this.triedPorts = [];
      }
      if (this.autoReconnect) {
        Util.wait(500)
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
      this.connected = false;
      log.info("Trying port", port);
      this.triedPorts.push(port);
      let link = new UartLink(() => { this.restart(); }, this.transferOverhead);
      link.tryConnectingToPort(port)
        .then(() => {
          log.info("Successful connection to ", port);
          this.port = link;
          this.connected = true;

          resolve();
        })
        .catch((err) => {
          log.notice("Failed connection", port, err);
          reject(err);
        })
    })
  }




  async write(uartMessage: UartWrapperV2) {
    return this.port.write(uartMessage).catch();
  }

}