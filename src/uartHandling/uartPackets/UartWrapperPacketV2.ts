/**
 * Wrapper for all relevant data of the object
 *
 */
import {DataStepper} from "crownstone-core/dist/util/DataStepper";
import {CrownstoneError, EncryptionHandler} from "crownstone-core";
import {Logger, LogThrottle} from "../../Logger";
import {UartErrorType} from "../../declarations/enums";
const log = Logger(__filename);

export class UartWrapperPacketV2 {
  protocolMajor : number;
  protocolMinor : number;
  messageType   : number;
  messageSize   : number;

  encrypted : boolean;
  dataType  : number;

  sessionData : Buffer | null = null;
  key: Buffer | null = null;

  crc     : number;
  payload : Buffer;

  valid : boolean = false;

  constructor(data : Buffer, sessionData: Buffer = null, key: Buffer = null) {
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
      this.encrypted   = (this.messageType & 128) === 128;
      this.messageType =  this.messageType & 127; // this will remove the encrypted flag and keep the actual type number

      let innerMessageSize = this.messageSize - 3 - 2; // 3 = protocol major, minor, type, 2 = crc
      let uartMessage = null;
      if (this.messageSize > 0) {
        if (this.encrypted) {
          if (!this.sessionData) {
            throw new CrownstoneError(UartErrorType.ENCRYPTION_FAILED_SESSION_DATA, "No SessionData Loaded");
          }
          if (!this.key)         {
            throw new CrownstoneError(UartErrorType.ENCRYPTION_FAILED_MISSING_KEY, "No Encryption Key Loaded");
          }

          let encryptedmessage         = stepper.getBuffer(innerMessageSize);
          let decryptedBytes           = EncryptionHandler.decryptCTR(encryptedmessage, this.sessionData, this.key);
          let decryptedDataWithPadding = EncryptionHandler.verifyAndExtractDecryption(decryptedBytes);
          let decryptedStepper         = new DataStepper(decryptedDataWithPadding);
          let payloadSize              = decryptedStepper.getUInt16();
          uartMessage                  = decryptedStepper.getBuffer(payloadSize);
          LogThrottle.clearGroup("encryption");
        }
        else {
          uartMessage = stepper.getBuffer(innerMessageSize);
        }
        this.crc = stepper.getUInt16();

        let uartMessageStepper = new DataStepper(uartMessage);
        this.dataType = uartMessageStepper.getUInt16();
        this.payload  = uartMessageStepper.getRemainingBuffer();

      }
    }
    catch (err) {
      if (err && err.type) {
        if (LogThrottle.check(err.type, 'encryption')) {
          log.warn("Something went wrong during parsing UartWrapperPacketV2", err);
        } else {
          log.debug("THROTTLED: Something went wrong during parsing UartWrapperPacketV2", err);
        }
      }
      this.valid = false;
    }
  }
}


