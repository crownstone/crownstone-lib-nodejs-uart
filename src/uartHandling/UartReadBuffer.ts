import {UartUtil} from "../util/UartUtil";
import {UartWrapperPacket} from "./uartPackets/UartWrapperPacket";
import {eventBus} from "../singletons/EventBus";
import {UartWrapperPacketV2} from "./uartPackets/UartWrapperPacketV2";
import {UartEncryptionContainer} from "./UartEncryptionContainer";

const ESCAPE_TOKEN  = 0x5c;
const BIT_FLIP_MASK = 0x40;
const START_TOKEN   = 0x7e;

const OPCODE_SIZE = 2;
const LENGTH_SIZE = 2;
const CRC_SIZE    = 2;

const PREFIX_SIZE  = OPCODE_SIZE + LENGTH_SIZE;
const WRAPPER_SIZE = PREFIX_SIZE + CRC_SIZE;

export class UartReadBuffer {
  buffer : number[];
  escapingNextToken = false;
  active = false;
  opCode = 0;
  reportedSize = 0;

  encryptionContainer : UartEncryptionContainer;

  callback = null;

  constructor(callback, encryptionContainer) {
    this.buffer = [];
    this.escapingNextToken = false;
    this.active = false;
    this.opCode = 0;

    this.encryptionContainer = encryptionContainer;

    this.callback = callback;

    this.reportedSize = 0
  }

  addByteArray(rawByteArray : Buffer) {
    for (let i = 0; i < rawByteArray.length; i++) {
      this.add(rawByteArray[i]);
    }
  }

  add(byte) {
    // if (we have a start token and we are not active
    if (byte === START_TOKEN) {
      if (this.active) {
        console.log("WARN: MULTIPLE START TOKENS");
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
      console.log("not active!", byte);
      return
    }
    if (byte === ESCAPE_TOKEN) {
      if (this.escapingNextToken) {
        console.log("WARN: DOUBLE ESCAPE");
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
    let bufferSize = this.buffer.length;

    if (bufferSize == PREFIX_SIZE) {
      let sizeBuffer = Buffer.from(this.buffer.slice(OPCODE_SIZE, PREFIX_SIZE));
      this.reportedSize = sizeBuffer.readUInt16LE(0)
    }
    if (bufferSize > PREFIX_SIZE) {
      if (bufferSize == (this.reportedSize + WRAPPER_SIZE)) {
        this.process();
        return
      }
      else if (bufferSize > this.reportedSize + WRAPPER_SIZE) {
        console.log("WARN: OVERFLOW");
        this.reset()
      }
    }
  }


  process() {
    let payload = this.buffer.slice(0, this.buffer.length - CRC_SIZE);
    let calculatedCrc = UartUtil.crc16_ccitt(payload);
    let crcBuffer = Buffer.from(this.buffer.slice(this.buffer.length - CRC_SIZE, this.buffer.length));
    let sourceCrc = crcBuffer.readUInt16LE(0);

    if (calculatedCrc != sourceCrc) {
      console.log("WARN: Failed CRC");
      eventBus.emit("UartNoise", "crc mismatch");
      this.reset();
      return
    }

    let packet = new UartWrapperPacketV2(
      Buffer.from(this.buffer),
      this.encryptionContainer.incomingSessionData,
      this.encryptionContainer.encryptionKey
    );
    this.callback(packet);
    this.reset()
  }

  reset() {
    this.buffer = [];
    this.escapingNextToken = false;
    this.active = false;
    this.opCode = 0;
    this.reportedSize = 0
  }
}