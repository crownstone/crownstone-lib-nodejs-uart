import {DataStepper, reconstructTimestamp} from "crownstone-core";

export class MeshExternalStatePart1 {
  temperature : number;
  accumulatedEnergy : number;
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

      this.temperature = stepper.getUInt8();
      this.accumulatedEnergy = stepper.getUInt32() * 64;
      this.timestamp = reconstructTimestamp(Date.now()*0.001,stepper.getUInt16());
    }
    else {
      this.valid = false
    }
  }

  getJSON() {
    return {
      temperature: this.temperature,
      accumulatedEnergy: this.accumulatedEnergy,
      timestamp: this.timestamp
    }
  }
}

