import {
  ControlPacket,
  ControlType,
  StoneMultiSwitchPacket,
  MeshMultiSwitchPacket,
  ControlPacketsGenerator, Util
} from "crownstone-core";

import {UartTxType} from "../declarations/enums";
import {UartLinkManager} from "./UartLinkManager";
import {UartWrapperV2} from "./uartPackets/UartWrapperV2";
import {Logger} from "../Logger";
import {UartTransferOverhead} from "./containers/UartTransferOverhead";
import {eventBus} from "../singletons/EventBus";
import {topics} from "../declarations/topics";

const log = Logger(__filename);

export class UartManager {

  link : UartLinkManager;
  transferOverhead: UartTransferOverhead;
  deviceId: number = 42;


  constructor(autoReconnect = true) {
    this.transferOverhead = new UartTransferOverhead(this.deviceId)
    this.link = new UartLinkManager(autoReconnect, this.transferOverhead);
  }


  setKey(key : string | Buffer) {
    this.transferOverhead.setKey(key);
  }

  setMode(mode: UartDeviceMode) {
    this.transferOverhead.setMode(mode);
  }

  async refreshSessionData() {
    if (this.link.port && this.link.connected) {
      await this.link.port.refreshSessionData();
    }
  }


  async switchCrownstones(switchData : SwitchData[]) : Promise<void> {
    // create a stone switch state packet to go into the multi switch
    let packets : StoneMultiSwitchPacket[] = [];
    switchData.forEach((data) => {
      switch (data.type) {
        case "TURN_ON":
          return packets.push(new StoneMultiSwitchPacket(data.stoneId, 255));
        case "TURN_OFF":
          return packets.push(new StoneMultiSwitchPacket(data.stoneId, 0));
        case "PERCENTAGE":
          return packets.push(new StoneMultiSwitchPacket(data.stoneId, data.percentage));
      }
    });

    // wrap it in a mesh multi switch packet
    let meshMultiSwitchPacket = new MeshMultiSwitchPacket(packets).getPacket();

    // wrap that in a control packet
    let controlPacket = new ControlPacket(ControlType.MULTISWITCH).loadByteArray(meshMultiSwitchPacket).getPacket();

    // finally wrap it in an Uart packet
    let uartPacket = new UartWrapperV2(UartTxType.CONTROL, controlPacket)

    await this.write(uartPacket)
  }


  async registerTrackedDevice(
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

    let uartPacket = new UartWrapperV2(UartTxType.CONTROL, registrationPacket);

    await this.write(uartPacket)
  }


  async setTime(customTimeInSeconds?: number) {
    if (!customTimeInSeconds) {
      customTimeInSeconds = Util.nowToCrownstoneTime();
    }
    let setTimePacket = ControlPacketsGenerator.getSetTimePacket(customTimeInSeconds);
    let uartPacket = new UartWrapperV2(UartTxType.CONTROL, setTimePacket)
    await this.write(uartPacket)
  }

  async echo(string: string) {
    let echoCommandPacket = ControlPacketsGenerator.getUartMessagePacket(string)
    let uartPacket = new UartWrapperV2(UartTxType.CONTROL, echoCommandPacket)

    await this.write(uartPacket)
  }

  async getMacAddress() : Promise<string> {
    return new Promise(async (resolve, reject) => {
      let uartPacket  = new UartWrapperV2(UartTxType.GET_MAC_ADDRESS)
      let unsubscribe = eventBus.on(topics.IncomingMacAddress, (data) => {
        unsubscribe();
        function padd(st) { if (st.length == 1) { return `0${st}`; } return st; }
        let str = padd(data[0].toString(16));
        for (let i = 1; i < data.length; i++) {
          str += ':' + padd(data[i].toString(16))
        }
        resolve(str.toUpperCase());
      })
      try {
        await this.write(uartPacket)
      }
      catch (e) {
        unsubscribe();
        throw e;
      }
    })
  }


  async hubDataReply(dataBuffer: Buffer) {
    let uartPacket = new UartWrapperV2(UartTxType.HUB_DATA_REPLY, dataBuffer)
    await this.write(uartPacket)
  }


  async write(uartMessage: UartWrapperV2) {
    return this.link.write(uartMessage).catch((e) => { console.error(e)});
  }

}