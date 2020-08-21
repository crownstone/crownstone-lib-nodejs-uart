import SerialPort from 'serialport'
import {
  Util,
} from "crownstone-core";
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


const log = require('debug-level')('crownstone-uart-manager')

export class UartLinkManager {
  autoReconnect = false;

  port : UartLink = null;
  connected = false;
  triedPorts = [];

  forcedPort = null;

  constructor(autoReconnect = true) {
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
      await Util.wait(100);
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
      promise = updatePorts()
        .then((available) => {
          log.debug("Available ports on the system", available);
          let ports = available;
          let portPaths = Object.keys(ports);
          return Util.promiseBatchPerformer(portPaths, (port) => {
            // we found a match. Do not try further
            if (this.connected) { return Promise.resolve(); }

            let manufacturer = ports[port].port?.manufacturer;
            // we use indexOf to check if a part of this string is in the manufacturer. It cah possibly differ between platforms.
            if (manufacturer && (manufacturer.indexOf("Silicon Lab") !== -1 || manufacturer.indexOf("SEGGER") !== -1)) {
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
            log.info("Could not find a Crownstone USB connected.");
            throw "COULD_NOT_OPEN_CONNECTION_TO_UART";
          }
        })
    }

    return promise.catch((err) => {
      log.debug("initiateConnection error", err)
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
      this.connected = false;
      log.debug("Trying port", port);
      this.triedPorts.push(port);
      let link = new UartLink(() => { this.restart(); });
      link.tryConnectingToPort(port)
        .then(() => {
          log.info("Successful connection to ", port);
          this.port = link;
          this.connected = true;
          resolve();
        })
        .catch((err) => {
          log.debug("Failed connection", port, err);
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