const fs = require('fs')

export const getSnapSerialList = function() {
  return new Promise((resolve, reject) => {
    let serialDevices = fs.readdirSync(process.env.CS_UART_SEARCH_BY_ID_PATH);
    let availablePorts = {};
    let regexp = RegExp(process.env.CS_UART_SEARCH_BY_ID_PATTERN);

    for (let i = 0; i < serialDevices.length; i++) {
      let item = serialDevices[i]
      if (regexp.test(item)) {
        availablePorts[item] = {port: {path: item}, connected: false}
      }
    }
    resolve(availablePorts);
  })
}

