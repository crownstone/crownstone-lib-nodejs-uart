export class UartUtil {

	static UART_START_CHAR =       0x7E;
	static UART_ESCAPE_CHAR =      0x5C;
	static UART_ESCAPE_FLIP_MASK = 0x40;

  static uartEscape(val) {
		if (Array.isArray(val)) {
			// # Escape special chars:
			let escapedMsg = [];
			for (let i = 0; i < val.length; i++) {
			  let c = val[i];
				if (c == UartUtil.UART_ESCAPE_CHAR || c == UartUtil.UART_START_CHAR) {
          escapedMsg.push(UartUtil.UART_ESCAPE_CHAR);
          c = UartUtil.uartEscape(c)
        }
				escapedMsg.push(c)
      }
			return escapedMsg
    }
		else {
			return val ^ UartUtil.UART_ESCAPE_FLIP_MASK
    }
  }

  static uartUnescape(val) {
    return val ^ UartUtil.UART_ESCAPE_FLIP_MASK
  }

	// Copied implementation of nordic
	static crc16_ccitt(arr8 : Buffer | number[]) {
		let crc = 0xFFFF;
		for (let i = 0; i < arr8.length; i++) {
      crc = (crc >> 8 & 0xFF) | (crc << 8 & 0xFFFF);
      crc ^= arr8[i];
      crc ^= (crc & 0xFF) >> 4;
      crc ^= (crc << 8 & 0xFFFF) << 4 & 0xFFFF;
      crc ^= ((crc & 0xFF) << 4 & 0xFFFF) << 1 & 0xFFFF
    }
		return crc
  }
}