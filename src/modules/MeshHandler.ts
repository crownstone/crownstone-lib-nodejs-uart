import {UartManager} from "../uartHandling/UartManager";
import {Logger} from "../Logger";
import {ControlPacketsGenerator, ResultPacket, ResultValue} from "crownstone-core";
import {UartWrapperV2} from "../uartHandling/uartPackets/UartWrapperV2";
import {UartTxType} from "../declarations/enums";

const log = Logger(__filename);

export class MeshHandler {
  uartRef : UartManager;

  constructor(uart: UartManager) {
    this.uartRef = uart;
  }

  async refreshTopology() {
    let controlPacket     = ControlPacketsGenerator.getRefreshTopologyPacket();
    let meshControlPacket = ControlPacketsGenerator.getMeshCommandBroadcastPacket(controlPacket)
    let result = await this.write(meshControlPacket);
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