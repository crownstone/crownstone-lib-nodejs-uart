import {DataStepper, reconstructTimestamp} from "crownstone-core";

export class MeshExternalStatePart0 {
  crownstoneId     : number;
  switchState      : number;
  flags            : number;
  powerFactor      : number;
  powerUsageReal   : number;
  timestamp        : number;
  uniqueIdentifier : number;

  valid = false;

  constructor(data : Buffer) {
    this.load(data);
  }

  load(data : Buffer) {
    let minSize = 8;

    if (data.length >= minSize) {
      this.valid = true;

      let stepper = new DataStepper(data);

      this.crownstoneId = stepper.getUInt8();
      this.switchState = stepper.getUInt8();
      this.flags = stepper.getUInt8();
      this.powerFactor = stepper.getUInt8();
      this.powerUsageReal = stepper.getUInt16() / 8;
      this.uniqueIdentifier = stepper.getUInt16();
      this.timestamp = reconstructTimestamp(Date.now()*0.001,this.uniqueIdentifier);
    }
    else {
      this.valid = false
    }
  }

  getJSON() {
    return {
      crownstoneId: this.crownstoneId,
      switchState: this.switchState,
      flags: this.flags,
      powerFactor: this.powerFactor,
      powerUsageReal: this.powerUsageReal,
      timestamp: this.timestamp,
      uniqueIdentifier: this.uniqueIdentifier
    }
  }
}

