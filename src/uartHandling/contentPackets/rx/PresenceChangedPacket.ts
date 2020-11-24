/**
 * Wrapper for all relevant data of the object
 *
 */
import {DataStepper, Util} from "crownstone-core";

export type PresenceChangeType = 'FIRST_SPHERE_ENTER' | 'LAST_SPHERE_EXIT' | 'PROFILE_SPHERE_ENTER' | 'PROFILE_SPHERE_EXIT' | 'PROFILE_LOCATION_ENTER' | 'PROFILE_LOCATION_EXIT';
const presenceChangeArray : PresenceChangeType[] = [
  'FIRST_SPHERE_ENTER',
  'LAST_SPHERE_EXIT',
  'PROFILE_SPHERE_ENTER',
  'PROFILE_SPHERE_EXIT',
  'PROFILE_LOCATION_ENTER',
  'PROFILE_LOCATION_EXIT',
]


export class PresenceChangedPacket {

  type       : PresenceChangeType;
  profileId  : number;
  locationId : number;

  valid = false;

  constructor(data : Buffer) {
    this.load(data);
  }

  load(data : Buffer) {
    let minSize = 3;

    if (data.length >= minSize) {
      this.valid = true;

      let stepper = new DataStepper(data);

      let index = stepper.getUInt8();
      if (index >= presenceChangeArray.length) {
        this.valid = false;
        return;
      }

      this.type       = presenceChangeArray[index];
      this.profileId  = stepper.getUInt8();
      this.locationId = stepper.getUInt8();
    }
    else {
      this.valid = false
    }
  }

  getJSON() {
    return {
      type:       this.type,
      profileId:  this.profileId,
      locationId: this.locationId
    }
  }
}


