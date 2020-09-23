/**
 * Wrapper for all relevant data of the object
 *
 */
import {DataStepper} from "crownstone-core/dist/util/DataStepper";

export class UartWrapperPacket {
  opCode  : number;
  size    : number;
  crc     : number;
  payload : Buffer;

  valid = false;

  constructor(data : Buffer) {
    this.load(data);
  }

  load(data : Buffer) {
    let minSize = 6; // opcode, size and crc
    if (data.length >= minSize) {
      this.valid = true;

      let stepper = new DataStepper(data);
      try {
        this.opCode = stepper.getUInt16();
        this.size = stepper.getUInt16();

        let totalSize = minSize + this.size;
        if (data.length >= totalSize) {
          this.payload = stepper.getBuffer(this.size);
          this.crc = stepper.getUInt16();
        }
        else {
          this.valid = false;
        }
      }
      catch (err) {
        this.valid = false;
      }
    }
    else {
      this.valid = false
    }
  }
}


