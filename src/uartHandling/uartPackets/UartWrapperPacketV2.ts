/**
 * Wrapper for all relevant data of the object
 *
 */
import {DataStepper} from "crownstone-core/dist/util/DataStepper";
import {EncryptionHandler, SessionData} from "crownstone-core";
import {Logger} from "../../Logger";
const log = Logger(__filename);

export class UartWrapperPacketV2 {
  protocolMajor : number;
  protocolMinor : number;
  messageType   : number;
  messageSize   : number;

  encrypted : boolean;
  deviceId  : number;
  dataType  : number;

  sessionData : SessionData | null = null;
  key: Buffer | null = null;

  crc     : number;
  payload : Buffer;

  valid : boolean = false;

  constructor(data : Buffer, sessionData: SessionData = null, key: Buffer = null) {
    this.sessionData = sessionData;
    this.key         = key;
    this.load(data);
  }

  load(data : Buffer) {
    this.valid = true;

    let stepper = new DataStepper(data);
    try {
      this.messageSize   = stepper.getUInt16();
      this.protocolMajor = stepper.getUInt8();
      this.protocolMinor = stepper.getUInt8();
      this.messageType   = stepper.getUInt8();

      // the MSB bit of the message type means it this message is encrypted
      this.encrypted = (this.messageType & 128) === 128;
      this.messageType = this.messageType & 127; // this will remove the encrypted flag and keep the actual type number

      let uartMessage = null;
      if (this.messageSize > 0) {
        if (this.encrypted) {
          if (!this.sessionData) { throw "No SessionData Loaded"; }
          if (!this.key)         { throw "No Encryption Key Loaded"; }

          let encryptedmessage = stepper.getBuffer(this.messageSize);
          let decryptedBytes = EncryptionHandler.decryptCTR(encryptedmessage, this.sessionData, this.key);
          let decryptedDataWithPadding = EncryptionHandler.verifyAndExtractDecryption(decryptedBytes, this.sessionData);
          let decryptedStepper = new DataStepper(decryptedDataWithPadding);
          let payloadSize = decryptedStepper.getUInt16();
          uartMessage = decryptedStepper.getBuffer(payloadSize);
        }
        else {
          uartMessage = stepper.getBuffer(this.messageSize);
        }
        this.crc = stepper.getUInt16();

        let uartMessageStepper = new DataStepper(uartMessage);
        this.deviceId = uartMessageStepper.getUInt8();
        this.dataType = uartMessageStepper.getUInt16();
        this.payload  = uartMessageStepper.getRemainingBuffer();
      }
    }
    catch (err) {
      log.warn("Something went wrong during parsing UartWrapperPacketV2", err);
      this.valid = false;
    }
  }
}


