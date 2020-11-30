import {UartWrapperV2} from "../../uartPackets/UartWrapperV2";
import {UartTxStatusType, UartTxType} from "../../../declarations/enums";
import {HubStatus} from "../../containers/UartTransferOverhead";


export class HubStatusTx {
  encryptionRequired : boolean = false;
  clientIsSetup      : boolean = false;
  hasInteret         : boolean = false;
  hasError           : boolean = false;


  getStatusByte() {
    let statusByte = 0;

    statusByte += !this.encryptionRequired ? 0 : 1 << 0;
    statusByte += !this.clientIsSetup      ? 0 : 1 << 1;
    statusByte += !this.hasInteret         ? 0 : 1 << 2;
    statusByte += !this.hasError           ? 0 : 1 << 3;

    return statusByte;
  }

  putStatus(data: HubStatus) {
    this.encryptionRequired = data.encryptionRequired ?? this.encryptionRequired;
    this.clientIsSetup      = data.clientHasBeenSetup ?? this.clientIsSetup;
    this.hasInteret         = data.clientHasInternet  ?? this.hasInteret;
    this.hasError           = data.clientHasError     ?? this.hasError;
  }


  getWrapper() {
    let payload = [];
    payload.push(UartTxStatusType.NO_DATA);
    payload.push(this.getStatusByte());
    payload = payload.concat([0,0,0,0,0,0,0,0,0])
    return new UartWrapperV2(UartTxType.STATUS, payload)
  }
}


