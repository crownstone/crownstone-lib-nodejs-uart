import {DataStepper} from "crownstone-core";
import {HubDataType} from "../../../declarations/enums";
import {HubData, parseHubSetup} from "./HubDataParsers";


export class HubDataParser {

  dataType: number;
  valid:    boolean = false;
  result:   HubData;
  raw:      Buffer

  constructor(data: Buffer) {
    this.raw = data;
    this.parse();
  }

  parse() {
    let stepper = new DataStepper(this.raw);
    this.dataType = stepper.getUInt8();
    switch (this.dataType) {
      case HubDataType.SETUP:
        return parseHubSetup(this, stepper);

    }
  }

}