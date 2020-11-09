import { Util, SessionData } from "crownstone-core";
import {UartEncryptionContainer} from "./UartEncryptionContainer";


export class UartTransferOverhead {

  deviceId: number
  encryption: UartEncryptionContainer


  constructor(deviceId: number) {
    this.deviceId = deviceId;
    this.encryption =  new UartEncryptionContainer();
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
    this.encryption.outgoingSessionData.generate();
  }

  reset() {
    this.encryption.reset();
  }

  setIncomingSessionData(buffer: Buffer) {
    try {
      this.encryption.incomingSessionData.load(buffer)
    }
    catch(e) {
      console.log("INVALID INCOMING SESSION DATA");
    }
  }

}