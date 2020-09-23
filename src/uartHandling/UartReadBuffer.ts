import {UartUtil} from "../util/UartUtil";
import {eventBus} from "../singletons/EventBus";
import {UartWrapperPacketV2} from "./uartPackets/UartWrapperPacketV2";
import {Logger} from "../Logger";
import {UartTransferOverhead} from "./containers/UartTransferOverhead";

const log = Logger(__filename, true);

const ESCAPE_TOKEN  = 0x5c;
const BIT_FLIP_MASK = 0x40;
const START_TOKEN   = 0x7e;

const LENGTH_SIZE  = 2;
const CRC_SIZE     = 2;

export class UartReadBuffer {
  buffer : number[];
  escapingNextToken = false;
  active = false;
  reportedSize = 0;

  transferOverhead : UartTransferOverhead;

  callback = null;

  constructor(callback, transferOverhead) {
    this.buffer = [];
    this.escapingNextToken = false;
    this.active = false;
    this.transferOverhead = transferOverhead;

    this.callback = callback;

    this.reportedSize = 0
  }

  addByteArray(rawByteArray : Buffer) {
    for (let i = 0; i < rawByteArray.length; i++) {
      this.add(rawByteArray[i]);
    }
  }

  add(byte) {
    log.silly("Received byte", byte);
    // if (we have a start token and we are not active
    if (byte === START_TOKEN) {
      if (this.active) {
        log.warn("MULTIPLE START TOKENS");
        eventBus.emit("UartNoise", "multiple start token")
        // console.log("buf:", this.buffer)
        this.reset();
        return
      }
      else {
        this.active = true;
        return
      }
    }


    if (!this.active) {
      log.verbose("not active!", byte);
      return
    }
    if (byte === ESCAPE_TOKEN) {
      if (this.escapingNextToken) {
        log.warn("DOUBLE ESCAPE");
        eventBus.emit("UartNoise", "double escape token")
        this.reset();
        return
      }
      this.escapingNextToken = true;
      return
    }

    // first get the escaping out of the way to avoid any double checks later on
    if (this.escapingNextToken) {
      byte ^= BIT_FLIP_MASK;
      this.escapingNextToken = false
    }
    this.buffer.push(byte);
    log.verbose("adding byte to buffer:", byte, this.buffer)
    let bufferSize = this.buffer.length;

    if (bufferSize == LENGTH_SIZE) {
      let sizeBuffer = Buffer.from(this.buffer);
      this.reportedSize = sizeBuffer.readUInt16LE(0); // Size of all data after this field, including CRC.
    }
    if (bufferSize > LENGTH_SIZE) {
      if (bufferSize == (this.reportedSize + LENGTH_SIZE)) {
        this.process();
        return
      }
      else if (bufferSize > (this.reportedSize + LENGTH_SIZE)) {
        log.warn("OVERFLOW");
        this.reset()
      }
    }
  }


  process() {
    log.verbose("Processing buffer", this.buffer);
    let payload = this.buffer.slice(LENGTH_SIZE, this.buffer.length - CRC_SIZE);
    let calculatedCrc = UartUtil.crc16_ccitt(payload);
    let crcBuffer = Buffer.from(this.buffer.slice(this.buffer.length - CRC_SIZE, this.buffer.length));
    let sourceCrc = crcBuffer.readUInt16LE(0);

    if (calculatedCrc != sourceCrc) {
      log.warn("Failed CRC");
      eventBus.emit("UartNoise", "crc mismatch");
      this.reset();
      return
    }

    let packet = new UartWrapperPacketV2(
      Buffer.from(this.buffer),
      this.transferOverhead.encryption.incomingSessionData,
      this.transferOverhead.encryption.key
    );
    this.callback(packet);
    this.reset()
  }

  reset() {
    this.buffer = [];
    this.escapingNextToken = false;
    this.active = false;
    this.reportedSize = 0;
  }
}