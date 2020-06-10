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
import {UartLinkManager} from "./UartLinkManager";

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

  link : UartLinkManager;

  constructor(autoReconnect = true) {
    this.link = new UartLinkManager(autoReconnect);
  }

  switchCrownstones(switchPairs : SwitchPair[]) : Promise<void> {
    // create a stone switch state packet to go into the multi switch
    let packets : StoneMultiSwitchPacket[] = [];
    switchPairs.forEach((pair) => {
      packets.push(new StoneMultiSwitchPacket(pair.crownstoneId, pair.switchState));
    });

    // wrap it in a mesh multi switch packet
    let meshMultiSwitchPacket = new MeshMultiSwitchPacket(packets).getPacket();

    // wrap that in a control packet
    let controlPacket = new ControlPacket(ControlType.MULTISWITCH).loadByteArray(meshMultiSwitchPacket).getPacket();


    // finally wrap it in an Uart packet
    let uartPacket = new UartWrapper(UartTxType.CONTROL, controlPacket).getPacket();

    this.link.write(uartPacket);

    return new Promise((resolve, reject) => { setTimeout(() => { resolve() }, 100); });
  }

  registerTrackedDevice(
    trackingNumber:number,
    locationUID:number,
    profileId:number,
    rssiOffset:number,
    ignoreForPresence:boolean,
    tapToToggleEnabled:boolean,
    deviceToken:number,
    ttlMinutes:number
  ) : Promise< void > {
    // create a stone switch state packet to go into the multi switch
    let registrationPacket = ControlPacketsGenerator.getRegisterTrackedDevicesPacket(
      trackingNumber,
      locationUID,
      profileId,
      rssiOffset,
      ignoreForPresence,
      tapToToggleEnabled,
      deviceToken,
      ttlMinutes
    );

    let uartPacket = new UartWrapper(UartTxType.CONTROL, registrationPacket).getPacket();

    this.link.write(uartPacket);

    return new Promise((resolve, reject) => { setTimeout(() => { resolve() }, 100); });
  }

}