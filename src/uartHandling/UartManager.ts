import {
  ControlPacket,
  ControlType,
  StoneMultiSwitchPacket,
  MeshMultiSwitchPacket,
  ControlPacketsGenerator
} from "crownstone-core";

import {UartTxType} from "../declarations/enums";
import {UartWrapper} from "./uartPackets/UartWrapper";
import {UartLinkManager} from "./UartLinkManager";


export class UartManager {

  link : UartLinkManager;

  constructor(autoReconnect = true) {
    this.link = new UartLinkManager(autoReconnect);
  }

  switchCrownstones(switchData : SwitchData[]) : Promise<void> {
    // create a stone switch state packet to go into the multi switch
    let packets : StoneMultiSwitchPacket[] = [];
    switchData.forEach((data) => {
      switch (data.type) {
        case "TURN_ON":
          return packets.push(new StoneMultiSwitchPacket(data.crownstoneId, 255));
        case "TURN_OFF":
          return packets.push(new StoneMultiSwitchPacket(data.crownstoneId, 0));
        case "DIMMING":
          return packets.push(new StoneMultiSwitchPacket(data.crownstoneId, data.switchState));
      }
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