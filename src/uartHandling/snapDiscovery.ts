import {CONFIG} from "../config/config";

const fs = require('fs')

export const getSnapSerialList = function() {
  return new Promise((resolve, reject) => {
    let serialDevices = [];
    try {
      serialDevices = fs.readdirSync(CONFIG.uartSearchPath);
    }
    catch (e) {
      console.log("ERR: presumably missing dongle!", e);
      return reject(e);
    }
    let availablePorts = {};
    let regexp = RegExp(CONFIG.uartPortSearchPattern);

    for (let i = 0; i < serialDevices.length; i++) {
      let item = serialDevices[i]
      if (regexp.test(item)) {
        let fullPath = ensureTrailingSlash(CONFIG.uartSearchPath) + item;
        availablePorts[item] = {port: {path: fullPath}, connected: false}
      }
    }
    resolve(availablePorts);
  })
}

function ensureTrailingSlash(value) {
  if (!value) { return value; }
  if (value[value.length-1] !== '/') {
    return value + '/';
  }
  else {
    return value;
  }
}
