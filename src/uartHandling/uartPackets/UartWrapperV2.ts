import {UartUtil} from "../../util/UartUtil";
import {DataWriter, EncryptionHandler, SessionData} from "crownstone-core";

const ESCAPE_TOKEN = 0x5c;
const BIT_FLIP_MASK = 0x40;
const START_TOKEN = 0x7e;

const UART_TYPES = {
	UART_MESSAGE: 0
}

const PROTOCOL_MAJOR = 1;
const PROTOCOL_MINOR = 0;

const LENGTH_SIZE = 2;

const WRAPPER_PREFIX_SIZE = 3;
const ENCRYPTION_PREFIX_SIZE = 5;

const DEVICE_ID_SIZE = 1;
const DATA_TYPE_SIZE = 2;

/**
 * WRAP_PACKET(PREFIX - WRAP_UART_PACKET(payload))
 */
export class UartWrapperV2 {


	dataType: number
	deviceId: number = 0;
	payload: Buffer

	constructor(dataType : number, payload : Buffer = Buffer.from([])) {
    this.dataType  = dataType
    this.payload = payload;
  }

	setDeviceId(deviceId : number) {
		this.deviceId = deviceId;
	}


  getEncryptedPacket(sessionData: SessionData, key: Buffer) : Buffer {
		let writer = new DataWriter(ENCRYPTION_PREFIX_SIZE);
		this._addPrefixes(writer, UART_TYPES.UART_MESSAGE | 128);
		let uartMessage = this._getUartPacket()

		let encryptedBuffer = EncryptionHandler.encryptCTR(uartMessage, sessionData, key, 0);

		writer.putBuffer(encryptedBuffer);
		return this._wrapPacket(writer.getBuffer());
	}


	_escapeCharacters(payload: Buffer) : Buffer {
		let escapedPayload = []
	  for (let i = 0; i < payload.length; i++) {
			let byte = payload[i];
	    if (byte === ESCAPE_TOKEN || byte === START_TOKEN) {
        escapedPayload.push(ESCAPE_TOKEN)
        let escapedByte = byte ^ BIT_FLIP_MASK
        escapedPayload.push(escapedByte)
      }
			else {
				escapedPayload.push(byte)
      }
    }

		return Buffer.from(escapedPayload);
  }


	getPacket() : Buffer {
		// construct the basePacket, which is used for CRC calculation
		let writer = new DataWriter(WRAPPER_PREFIX_SIZE);
		this._addPrefixes(writer, UART_TYPES.UART_MESSAGE);

		writer.putBuffer(this._getUartPacket())

		return this._wrapPacket(writer.getBuffer());
  }


	_addPrefixes(writer: DataWriter, messageType) {
		writer.putUInt8(PROTOCOL_MAJOR)
		writer.putUInt8(PROTOCOL_MINOR)
		writer.putUInt8(messageType);
	}



  _getUartPacket() : Buffer {
		let writer = new DataWriter(DEVICE_ID_SIZE + DATA_TYPE_SIZE );
		writer.putUInt8(this.deviceId);
		writer.putUInt16(this.dataType);

		writer.putBuffer(this.payload);

		return writer.getBuffer();
	}


	_wrapPacket(packet : Buffer) : Buffer {
		// calculate the CRC of the packet for everything after the size
		let baseCrc = UartUtil.crc16_ccitt(packet);
		let crcBuffer = Buffer.alloc(2 );
		crcBuffer.writeUInt16LE(baseCrc,0);
		// append the CRC to the base packet to escape the entire thing
		packet = Buffer.concat([packet,crcBuffer]);

		// escape everything except the START_TOKEN
		let escapedPayload = this._escapeCharacters(packet);
		let size = Buffer.alloc(LENGTH_SIZE);
		size.writeUInt16LE(packet.length, 0)


		return Buffer.concat( [Buffer.from([START_TOKEN]), size, escapedPayload]);
	}
}