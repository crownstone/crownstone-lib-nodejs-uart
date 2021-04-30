import {DataStepper} from "crownstone-core";

export class NearestCrownstoneTrackingUpdate {
  assetId      : Buffer;
  crownstoneId : number;
  rssi         : number;
  channel      : number;

  valid = false;

  constructor(data : Buffer) {
    this.load(data);
  }

  load(data : Buffer) {
    let minSize = 6;

    if (data.length >= minSize) {
      this.valid = true;

      let stepper = new DataStepper(data);

      this.assetId      = stepper.getBuffer(3);
      this.crownstoneId = stepper.getUInt8();
      this.rssi         = stepper.getInt8();
      this.channel      = stepper.getUInt8(); // 37, 38, 39
    }
    else {
      this.valid = false
    }
  }

  getJSON() {
    return {
      assetId:      [...this.assetId],
      crownstoneId: this.crownstoneId,
      rssi:         this.rssi,
      channel:      this.channel,
    }
  }
}


export class NearestCrownstoneTrackingTimeout {
  assetId : Buffer;
  
  valid = false;

  constructor(data : Buffer) {
    this.load(data);
  }

  load(data : Buffer) {
    let minSize = 3;

    if (data.length >= minSize) {
      this.valid = true;

      let stepper  = new DataStepper(data);
      this.assetId = stepper.getBuffer(3);
    }
    else {
      this.valid = false
    }
  }

  getJSON() {
    return {
      assetId: [...this.assetId],
    }
  }
}

