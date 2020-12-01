import {EncryptionHandler, Util} from "crownstone-core";


export class UartEncryptionContainer {

  enabled = false;
  keyIsSet = false;
  key : Buffer = null;
  outgoingSessionData : Buffer = null
  incomingSessionData : Buffer = null


  constructor() {
    // create initial guesses for the session data;
    this.resetSessionData();
  }

  resetSessionData() {
    // create initial guesses for the session data;
    this.incomingSessionData = Buffer.alloc(5)
    EncryptionHandler.fillWithRandomNumbers(this.incomingSessionData);
    this.outgoingSessionData = Buffer.alloc(5);
    EncryptionHandler.fillWithRandomNumbers(this.incomingSessionData);
  }

  removeKey() {
    this.key      = null;
    this.keyIsSet = false;
    this.enabled  = false;
  }

  setKey(key : string | Buffer) {
    this.keyIsSet = true;
    if (typeof key === 'string') {
      this.key = Util.prepareKey(key);
    }
    else {
      this.key = key;
    }
  }

  refreshSessionData() {
    EncryptionHandler.fillWithRandomNumbers(this.incomingSessionData);
  }

  setIncomingSessionData(buffer: Buffer) {
    try {
      this.incomingSessionData = buffer;
    }
    catch(e) {
      console.log("INVALID INCOMING SESSION DATA");
    }
  }

}