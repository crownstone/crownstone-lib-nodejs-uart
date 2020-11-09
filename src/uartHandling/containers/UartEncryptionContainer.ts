import { Util, SessionData } from "crownstone-core";


export class UartEncryptionContainer {

  enabled = false;
  key : Buffer = null;
  outgoingSessionData : SessionData = null;
  incomingSessionData : SessionData = null;


  constructor() {
    // create initial guesses for the session data;
    this.reset();
  }

  reset() {
    // create initial guesses for the session data;
    this.enabled = false;
    this.key = null;
    this.incomingSessionData = new SessionData();
    this.incomingSessionData.generate();
    this.outgoingSessionData = new SessionData();
    this.outgoingSessionData.generate();
  }

  setKey(key : string | Buffer) {
    if (typeof key === 'string') {
      this.key = Util.prepareKey(key);
    }
    else {
      this.key = key;
    }
  }

  refreshSessionData() {
    this.outgoingSessionData.generate();
  }

  setIncomingSessionData(buffer: Buffer) {
    try {
      this.incomingSessionData.load(buffer)
    }
    catch(e) {
      console.log("INVALID INCOMING SESSION DATA");
    }
  }

}