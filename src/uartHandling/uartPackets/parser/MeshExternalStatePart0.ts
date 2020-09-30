import {DataStepper, reconstructTimestamp} from "crownstone-core";

export class MeshExternalStatePart0 {
  switchState : number;
  flags : number;
  powerFactor : number;
  powerUsageReal : number;
  timestamp : number;

  valid = false;

  constructor(data : Buffer) {
    this.load(data);
  }

  load(data : Buffer) {
    let minSize = 7;

    if (data.length >= minSize) {
      this.valid = true;

      let stepper = new DataStepper(data);

      this.switchState = stepper.getUInt8();
      this.flags = stepper.getUInt8();
      this.powerFactor = stepper.getUInt8();
      this.powerUsageReal = stepper.getUInt16() / 8;
      this.timestamp = reconstructTimestamp(Date.now()*0.001,stepper.getUInt16());
    }
    else {
      this.valid = false
    }
  }

  getJSON() {
    return {
      switchState: this.switchState,
      flags: this.flags,
      powerFactor: this.powerFactor,
      powerUsageReal: this.powerUsageReal,
      timestamp: this.timestamp
    }
  }
}

