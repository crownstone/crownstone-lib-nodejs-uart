import {DataStepper} from "crownstone-core";

export class AssetMacReport {
  macAddress       : Buffer;
  crownstoneId     : number;
  rssi             : number;
  channel          : number;

  valid = false;

  constructor(data : Buffer) {
    this.load(data);
  }

  load(data : Buffer) {
    let minSize = 9;

    if (data.length >= minSize) {
      this.valid = true;

      let stepper = new DataStepper(data);

      this.macAddress   = stepper.getBuffer(6);
      this.crownstoneId = stepper.getUInt8();
      this.rssi         = stepper.getInt8();
      this.channel      = stepper.getUInt8(); // 37, 38, 39
    }
    else {
      this.valid = false
    }
  }

  getJSON() : AssetMacReportData {
    return {
      macAddress:   this.macAddress.toString('hex'),
      crownstoneId: this.crownstoneId,
      rssi:         this.rssi,
      channel:      this.channel,
    }
  }
}

