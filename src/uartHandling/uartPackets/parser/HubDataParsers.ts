import {HubDataParser} from "./HubData";
import {DataStepper} from "crownstone-core";

export type HubData = HubData_setup;
export interface HubData_setup {
  type: 0,
  token: string,
  sphereId: string;
}

export function parseHubSetup(dataRef: HubDataParser, stepper: DataStepper) {
  try {
    let tokenLength = stepper.getUInt16();
    let tokenBuffer = stepper.getBuffer(tokenLength);
    let token = tokenBuffer.toString();

    let sphereIdLength = stepper.getUInt16()
    let sphereIdBuffer = stepper.getBuffer(sphereIdLength)
    let sphereId = sphereIdBuffer.toString();

    dataRef.result = {type: dataRef.dataType as any, token, sphereId};
  }
  catch (e) {
    dataRef.valid = false;
  }
}