import {UartWrapperV2} from "../../uartPackets/UartWrapperV2";
import {UartTxType} from "../../../declarations/enums";


export function getSessionNonceTx(timeoutMinutes: number, sessionNonce: Buffer) {

  let timeoutBuffer = Buffer.from([timeoutMinutes]);
  let data = Buffer.concat([timeoutBuffer, sessionNonce]);

  return new UartWrapperV2(UartTxType.SESSION_NONCE, data);
}


