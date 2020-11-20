/**
 * Wrapper for all relevant data of the object
 *
 */
import {DataStepper, Util} from "crownstone-core";

export class HelloPacket {
  sphereUID;
  status;

  encryptionRequired : boolean = false;
  crownstoneIsSetup  : boolean = false;
  hubMode            : boolean = false;
  hasError           : boolean = false;



  valid = false;

  constructor(data : Buffer) {
    this.load(data);
  }

  load(data : Buffer) {
    let minSize = 2;

    if (data.length >= minSize) {
      this.valid = true;

      let stepper = new DataStepper(data);

      this.sphereUID = stepper.getUInt8();
      this.status    = stepper.getUInt8();

      // bitmask states
      let bitmaskArray = Util.getBitMaskUInt8(this.status);

      this.encryptionRequired   = bitmaskArray[0];
      this.crownstoneIsSetup    = bitmaskArray[1];
      this.hubMode              = bitmaskArray[2];
      this.hasError             = bitmaskArray[3];
    }
    else {
      this.valid = false
    }
  }
}


