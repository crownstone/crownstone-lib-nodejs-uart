import {
  ControlPacket,
  ControlType,
  StoneMultiSwitchPacket,
  MeshMultiSwitchPacket,
  ControlPacketsGenerator, Util, SessionData
} from "crownstone-core";

import {UartTxType} from "../declarations/enums";
import {UartLinkManager} from "./UartLinkManager";
import {UartWrapperV2} from "./uartPackets/UartWrapperV2";
import {UartEncryptionContainer} from "./UartEncryptionContainer";


export class UartManager {

  link : UartLinkManager;
  encryptionContainer: UartEncryptionContainer;
  deviceId: number = 42;


  constructor(autoReconnect = true) {
    this.encryptionContainer = new UartEncryptionContainer()
    this.link = new UartLinkManager(autoReconnect, this.encryptionContainer);
  }


  setKey(key : string | Buffer) {
    this.encryptionContainer.setKey(key);
  }

  refreshSessionData() {
    this.encryptionContainer.refreshSessionData();
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
    await Util.wait(100);
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
    await Util.wait(100);
  }


  async setTime(customTimeInSeconds?: number) {
    if (!customTimeInSeconds) {
      customTimeInSeconds = Util.nowToCrownstoneTime();
    }
    let setTimePacket = ControlPacketsGenerator.getSetTimePacket(customTimeInSeconds);
    let uartPacket = new UartWrapperV2(UartTxType.CONTROL, setTimePacket)

    await this.write(uartPacket)
    await Util.wait(100);
  }

  async echo(string: string) {
    let echoCommandPacket = ControlPacketsGenerator.getUartMessagePacket(string)
    let uartPacket = new UartWrapperV2(UartTxType.CONTROL, echoCommandPacket)

    await this.write(uartPacket)
    await Util.wait(100);
  }


  async write(uartMessage: UartWrapperV2) {
    uartMessage.setDeviceId(this.deviceId)
    if (this.encryptionContainer.encryptionKey !== null) {
      // ENCRYPT
      let packet = uartMessage.getEncryptedPacket(
        this.encryptionContainer.outgoingSessionData,
        this.encryptionContainer.encryptionKey
      );
      return this.link.write(packet).catch();
    }
    else {
      return this.link.write(uartMessage.getPacket()).catch();
    }
  }

}