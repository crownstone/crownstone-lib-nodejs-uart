/**
 * Wrapper for all relevant data of the object
 *
 */
import {DataStepper} from "crownstone-core";

export class HelloPacket {
  sphereUID;
  status;

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
      this.status = stepper.getUInt8();
    }
    else {
      this.valid = false
    }
  }
}


