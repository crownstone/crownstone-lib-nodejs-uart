import {DataStepper, reconstructTimestamp} from "crownstone-core";

export class MeshExternalStatePart1 {
  crownstoneId : number;
  temperature : number;
  accumulatedEnergy : number;
  timestamp : number;
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
      this.temperature = stepper.getUInt8();
      this.accumulatedEnergy = stepper.getUInt32() * 64;
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
      temperature: this.temperature,
      accumulatedEnergy: this.accumulatedEnergy,
      timestamp: this.timestamp,
      uniqueIdentifier: this.uniqueIdentifier
    }
  }
}

