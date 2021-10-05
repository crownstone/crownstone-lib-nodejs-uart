import {UartManager} from "../uartHandling/UartManager";
import {Logger} from "../Logger";
import {
  ControlPacket,
  ControlPacketsGenerator, ControlType, FilterChunker, FilterMetaData, FilterSummaries,
  MeshMultiSwitchPacket, ResultPacket, ResultValue,
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
    let controlPacket = new ControlPacket(ControlType.MULTISWITCH).loadBuffer(meshMultiSwitchPacket).getPacket();

    await this.write(controlPacket);
  }


  async uploadFilter(filterId: number, filterData: Buffer, filterCommandProtocol: number) {
    let maxIterations = 5;

    let chunker = new FilterChunker(filterId, filterData);
    let iteration = 0;
    let finished = false;
    while (finished === false && iteration < maxIterations) {
      iteration++;
      let chunkData = chunker.getChunk(filterCommandProtocol);
      finished = chunkData.finished;

      let controlPacket = ControlPacketsGenerator.getUploadFilterPacket(chunkData.packet, filterCommandProtocol);

      let result = await this.write(controlPacket);
      if (resultChecker(result)) { continue; }
    }
  }


  async removeFilter(filterId : number, filterCommandProtocol: number) {
    let controlPacket   = ControlPacketsGenerator.getRemoveFilterPacket(filterId, filterCommandProtocol);
    let result = await this.write(controlPacket);
    resultChecker(result);
  }


  async getFilterSummaries(filterCommandProtocol: number) : Promise<FilterSummaries> {
    let controlPacket = ControlPacketsGenerator.getGetFilterSummariesPacket(filterCommandProtocol);
    let result        = await this.write(controlPacket);
    resultChecker(result);

    // @ts-ignore
    return new FilterSummaries(result.payload);
  }


  async commitFilterChanges(masterVersion: number, masterCRC: number, filterCommandProtocol: number) : Promise<void> {
    let controlPacket   = ControlPacketsGenerator.getCommitFilterChangesPacket(masterVersion, masterCRC, filterCommandProtocol);
    let result = await this.write(controlPacket);
    resultChecker(result);
  }


  async write(controlPacket : Buffer) : Promise<ResultPacket | void> {
    let uartPacket = new UartWrapperV2(UartTxType.CONTROL, controlPacket)
    return await this.uartRef.write(uartPacket)
  }
}

function resultChecker(result: ResultPacket | void) {
  if (result) {
    if (result.resultCode === ResultValue.SUCCESS || result.resultCode === ResultValue.SUCCESS_NO_CHANGE) {
      return true;
    }
    throw result.resultCode
  }
  throw "NO_RESULT_RECEIVED"
}