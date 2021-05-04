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


  async uploadFilter(filterId: number, metaData: FilterMetaData, filterData: Buffer) {
    let maxIterations = 5;
    let fullData = Buffer.concat([metaData.getPacket(), filterData])

    let chunker = new FilterChunker(filterId, fullData);
    let iteration = 0;
    let finished = false;
    while (finished === false && iteration < maxIterations) {
      iteration++;
      let chunkData = chunker.getChunk();
      finished = chunkData.finished;

      let chunkPacket   = ControlPacketsGenerator.getUploadFilterPacket(chunkData.packet);
      let controlPacket = new ControlPacket(ControlType.UPLOAD_FILTER).loadBuffer(chunkPacket).getPacket();

      let result = await this.write(controlPacket);
      if (resultChecker(result)) { continue; }
    }
  }

  async removeFilter(filterId : number) {
    let chunkPacket   = ControlPacketsGenerator.getRemoveFilterPacket(filterId);
    let controlPacket = new ControlPacket(ControlType.REMOVE_FILTER).loadBuffer(chunkPacket).getPacket();
    let result = await this.write(controlPacket);
    resultChecker(result);
  }

  async getFilterSummaries() : Promise<FilterSummaries> {
    let chunkPacket   = ControlPacketsGenerator.getGetFilterSummariesPacket();
    let controlPacket = new ControlPacket(ControlType.GET_FILTER_SUMMARIES).loadBuffer(chunkPacket).getPacket();
    let result = await this.write(controlPacket);
    resultChecker(result);

    // @ts-ignore
    return new FilterSummaries(result.payload);
  }

  async commitFilterChanges(masterVersion: number, masterCRC: number) : Promise<void> {
    let chunkPacket   = ControlPacketsGenerator.getCommitFilterChangesPacket(masterVersion, masterCRC);
    let controlPacket = new ControlPacket(ControlType.COMMIT_FILTER_CHANGES).loadBuffer(chunkPacket).getPacket();
    let result = await this.write(controlPacket);
    resultChecker(result);
  }


  async write(controlPacket : Buffer) : Promise<ResultPacket | void> {
    let uartPacket = new UartWrapperV2(UartTxType.CONTROL, controlPacket)
    await this.uartRef.write(uartPacket)
  }
}

function resultChecker(result: ResultPacket | void) {
  if (result) {
    if (result.resultCode === ResultValue.SUCCESS) {
      return true;
    }
    throw result.resultCode
  }
  throw "NO_RESULT_RECEIVED"
}