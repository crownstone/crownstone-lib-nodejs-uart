import { Util } from "crownstone-core";
import {UartEncryptionContainer} from "./UartEncryptionContainer";


export class UartTransferOverhead {

  deviceId: number
  encryption: UartEncryptionContainer
  mode : UartDeviceMode = "CROWNSTONE"

  constructor(deviceId: number) {
    this.deviceId = deviceId;
    this.encryption =  new UartEncryptionContainer();
  }

  setMode(mode: UartDeviceMode) {
    this.mode = mode;
  }

  setKey(key : string | Buffer) {
    if (typeof key === 'string') {
      this.encryption.key = Util.prepareKey(key);
    }
    else {
      this.encryption.key = key;
    }
  }

  refreshSessionData() {
    this.encryption.refreshSessionData();
  }

  reset() {
    this.encryption.resetSessionData();
  }

  setIncomingSessionData(buffer: Buffer) {
    this.encryption.setIncomingSessionData(buffer);
  }

}