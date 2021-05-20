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

      this.macAddress   = stepper.getBuffer(6).reverse();
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
      macAddress:   macAddressToString(this.macAddress),
      crownstoneId: this.crownstoneId,
      rssi:         this.rssi,
      channel:      this.channel,
    }
  }
}

function macAddressToString(macBuffer) {
  let str = macBuffer.toString('hex');
  let resultingStr = '';
  let index = 0;
  for (let char of str) {
    resultingStr += char;
    if (index % 2 == 1) {
      resultingStr += ":"
    }
    index++;
  }
  return resultingStr.substr(0,17).toUpperCase();
}

