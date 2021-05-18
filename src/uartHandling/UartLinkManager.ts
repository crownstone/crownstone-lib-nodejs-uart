import SerialPort from 'serialport'
import {UartLink} from "./UartLink";
import {getSnapSerialList} from "./snapDiscovery";
import {CONFIG} from "../config/config";
import {ResultPacket, Util} from "crownstone-core";
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


  async initiateConnection() : Promise<void> {
    try {
      if (this.forcedPort) {
        await this.tryConnectingToPort(this.forcedPort);
      }
      else {
        let availablePorts = await UPDATE_PORTS();
        log.debug("Available ports on the system", availablePorts);
        let ports = availablePorts;
        // let portIds = Object.keys(ports);

        for (let portId in ports) {
          // we found a match. Do not try further
          if (this.connected) { return }

          let port = ports[portId].port?.path || portId;

          if (CONFIG.useManufacturer === false || CONFIG.useSearchById) {
            if (this.triedPorts.indexOf(port) === -1) {
              await this.tryConnectingToPort(port);
            }
          }
          else {
            let manufacturer = ports[portId].port?.manufacturer;
            // we use indexOf to check if a part of this string is in the manufacturer. It can possibly differ between platforms.
            if (manufacturer && (manufacturer.indexOf("Silicon Lab") !== -1 || manufacturer.indexOf("SEGGER") !== -1)) {
              if (this.triedPorts.indexOf(port) === -1) {
                await this.tryConnectingToPort(port);
              }
            }
          }
        }
        // Handle the case where none of the connected devices match.
        if (this.port === null) {
          log.info("Could not find a Crownstone USB connected.");
          throw "COULD_NOT_OPEN_CONNECTION_TO_UART";
        }
      }
    }
    catch (err) {
      log.info("initiateConnection error", err)
      if (err && err.message && err.message.indexOf('Cannot lock port') !== -1) {
        // Do not clear the list here. This bus is already in use. Try another. It will wrap back around due to the COULD_NOT_OPEN_CONNECTION_TO_UART.
      }
      else {
        this.triedPorts = [];
      }
      if (this.autoReconnect) {
        log.info("Retrying connection...")
        await Util.wait(500)
        return this.initiateConnection().catch((err) => { log.warn("Failed to initiate Connection", err)})

      }
      else {
        log.notice("initiateConnection error will not auto-retry. Escalating error...");
        throw err;
      }
    }
  }


  async tryConnectingToPort(port) : Promise<void> {
    this.connected = false;
    log.info("Trying port", port);
    this.triedPorts.push(port);
    let link = new UartLink(() => { this.restart(); }, this.transferOverhead);
    try {
      await link.tryConnectingToPort(port)
      log.info("Successful connection to ", port);
      this.port = link;
      this.connected = true;
    }
    catch(err)  {
      log.notice("Failed connection", port, err);
      throw err;
    }
  }


  async write(uartMessage: UartWrapperV2) : Promise<ResultPacket | void> {
    return this.port.write(uartMessage).catch();
  }

}