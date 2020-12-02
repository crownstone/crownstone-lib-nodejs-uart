import {UartManager} from "../uartHandling/UartManager";
import {Logger} from "../Logger";
import {
  ControlPacket,
  ControlPacketsGenerator, ControlType,
  MeshMultiSwitchPacket,
  StoneMultiSwitchPacket,
  Util
} from "crownstone-core";
import {UartWrapperV2} from "../uartHandling/uartPackets/UartWrapperV2";
import {UartTxType} from "../declarations/enums";
const log = Logger(__filename);

export class ControlHandler {
  uartRef : UartManager;

  constructor(uart: UartManager) {
    this.uartRef = uart;
  }


  async factoryResetCommand() {
    let factoryResetPacket = ControlPacketsGenerator.getCommandFactoryResetPacket();
    return this.write(factoryResetPacket);
  }


  async rebootCrownstone() {
    let rebootPacket = ControlPacketsGenerator.getResetPacket();
    return this.write(rebootPacket);
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
  ) {
    log.info("registerTrackedDevice", arguments);
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

    return this.write(registrationPacket);
  }


  async setTime(customTimeInSeconds?: number) {
    log.info("setTime", customTimeInSeconds);
    if (!customTimeInSeconds) {
      customTimeInSeconds = Util.nowToCrownstoneTime();
    }
    let setTimePacket = ControlPacketsGenerator.getSetTimePacket(customTimeInSeconds);
    return this.write(setTimePacket);
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

    return this.write(controlPacket);
  }


  async write(controlPacket : Buffer) {
    let uartPacket = new UartWrapperV2(UartTxType.CONTROL, controlPacket)
    await this.uartRef.write(uartPacket)
  }

}