export const CONFIG = {
  uartSearchPath:        process.env.CS_UART_SEARCH_BY_ID_PATH,
  uartPortSearchPattern: process.env.CS_UART_SEARCH_BY_ID_PATTERN,
  useSearchById:         process.env.CS_UART_SEARCH_BY_ID,
  useManufacturer:       process.env.CS_UART_USE_MANUFACTURER ?? true
}

