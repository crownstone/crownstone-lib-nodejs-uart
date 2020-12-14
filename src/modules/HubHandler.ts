import {UartManager} from "../uartHandling/UartManager";
import {Logger} from "../Logger";
import {UartWrapperV2} from "../uartHandling/uartPackets/UartWrapperV2";
import {UartTxType} from "../declarations/enums";
const log = Logger(__filename);

export class HubHandler {
  uartRef : UartManager;

  constructor(uart: UartManager) {
    this.uartRef = uart;
  }


  async setMode(mode: UartDeviceMode) : Promise<void> {
    this.uartRef.transferOverhead.setMode(mode);
    if (this.uartRef.link.port && this.uartRef.link.connected) {
      await this.uartRef.link.port.setHubMode(true);
    }
  }


  async setStatus(hubStatus: HubStatusData) : Promise<void> {
    this.uartRef.transferOverhead.setStatus(hubStatus);
    if (this.uartRef.link.port && this.uartRef.link.connected) {
      await this.uartRef.link.port.setStatus();
    }
  }


  /**
   * ResultValue is a resultValue from crownstone-core/src/protocol/CrownstoneTypes.ts
   * @param dataBuffer
   * @param resultValue
   */
  async dataReply(dataBuffer: Buffer, resultValue: number) {
    let uartPacket = new UartWrapperV2(UartTxType.HUB_DATA_REPLY, dataBuffer)
    await this.uartRef.write(uartPacket)
  }


}