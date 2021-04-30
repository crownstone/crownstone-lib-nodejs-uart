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
}

export async function delay(ms: number = 200) : Promise<void> {
  return new Promise<void>((resolve, reject) => { setTimeout(() => { resolve() }, ms); });
}