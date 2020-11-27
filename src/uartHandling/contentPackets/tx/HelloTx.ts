import {UartWrapperV2} from "../../uartPackets/UartWrapperV2";
import {UartTxType} from "../../../declarations/enums";
import {HubStatusTx} from "./HubStatusTx";

/**
 * Wrapper for all relevant data of the object
 *
 */

export class HelloTXPacket extends HubStatusTx {
  getWrapper() {
    let statusByte = this.getStatusByte()

    return new UartWrapperV2(UartTxType.HELLO, [statusByte])
  }
}


