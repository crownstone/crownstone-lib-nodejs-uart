import { ControlPacketsGenerator } from "crownstone-core";

import {UartTxType} from "../declarations/enums";
import {UartLinkManager} from "./UartLinkManager";
import {UartWrapperV2} from "./uartPackets/UartWrapperV2";
import {Logger} from "../Logger";
import {UartTransferOverhead} from "./containers/UartTransferOverhead";

const log = Logger(__filename);

export class UartManager {

  link : UartLinkManager;
  transferOverhead: UartTransferOverhead;
  deviceId: number = 42;


  constructor(autoReconnect = true) {
    this.transferOverhead = new UartTransferOverhead(this.deviceId)
    this.link = new UartLinkManager(autoReconnect, this.transferOverhead);
  }

  async echo(string: string) {
    let echoCommandPacket = ControlPacketsGenerator.getUartMessagePacket(string)
    let uartPacket = new UartWrapperV2(UartTxType.CONTROL, echoCommandPacket)

    await this.write(uartPacket)
  }

  async write(uartMessage: UartWrapperV2) {
    return this.link.write(uartMessage).catch((e) => { console.error(e)});
  }

}