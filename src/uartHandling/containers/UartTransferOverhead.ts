import {UartEncryptionContainer} from "./UartEncryptionContainer";


export class UartTransferOverhead {

  deviceId: number
  encryption: UartEncryptionContainer
  mode : UartDeviceMode = "CROWNSTONE"
  status: HubStatus;

  constructor(deviceId: number) {
    this.deviceId = deviceId;
    this.status = new HubStatus()
    this.encryption =  new UartEncryptionContainer();
  }

  setMode(mode: UartDeviceMode) {
    this.mode = mode;
  }

  setStatus(status: HubStatusData) {
    this.status.load(status);
  }

  setKey(key : string | Buffer) {
    this.encryption.setKey(key);
  }

  removeKey() {
    this.encryption.removeKey();
  }

  refreshSessionData() {
    this.encryption.refreshSessionData();
  }

  reset() {
    this.encryption.resetSessionData();
    this.encryption.enabled = false;
  }

  setIncomingSessionData(buffer: Buffer) {
    this.encryption.setIncomingSessionData(buffer);
  }

}

export class HubStatus {
  encryptionRequired : boolean = false;
  clientHasBeenSetup : boolean = false;
  clientHasInternet  : boolean = false;
  clientHasError     : boolean = false;

  load(data: HubStatusData) {
    this.encryptionRequired = data.encryptionRequired ?? this.encryptionRequired;
    this.clientHasBeenSetup = data.clientHasBeenSetup ?? this.clientHasBeenSetup;
    this.clientHasInternet  = data.clientHasInternet  ?? this.clientHasInternet;
    this.clientHasError     = data.clientHasError     ?? this.clientHasError;
  }
}