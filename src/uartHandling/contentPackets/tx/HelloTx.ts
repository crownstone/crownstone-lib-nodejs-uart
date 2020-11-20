import {UartWrapperV2} from "../../uartPackets/UartWrapperV2";
import {UartTxType} from "../../../declarations/enums";

/**
 * Wrapper for all relevant data of the object
 *
 */

export class HelloTXPacket {
  encryptionRequired : boolean = false;
  clientIsSetup      : boolean = false;
  hasInteret         : boolean = false;
  hasError           : boolean = false;

  getWrapper() {

    let statusByte = 0;

    statusByte += !this.encryptionRequired ? 0 : 1 << 0;
    statusByte += !this.clientIsSetup      ? 0 : 1 << 1;
    statusByte += !this.hasInteret         ? 0 : 1 << 2;
    statusByte += !this.hasError           ? 0 : 1 << 3;

    return new UartWrapperV2(UartTxType.HELLO, [statusByte])
  }
}


