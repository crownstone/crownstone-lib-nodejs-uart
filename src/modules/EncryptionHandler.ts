import {UartManager} from "../uartHandling/UartManager";
import {Logger} from "../Logger";
const log = Logger(__filename);

export class EncryptionHandler {
  uartRef : UartManager;

  constructor(uart: UartManager) {
    this.uartRef = uart;
  }

  async setKey(key : string | Buffer) {
    this.uartRef.transferOverhead.setKey(key);
    if (this.uartRef.link.port && this.uartRef.link.connected) {
      // refresh the mode in case we set a new key
      await this.uartRef.link.port.setHubMode();
    }
  }


  removeKey() {
    this.uartRef.transferOverhead.removeKey();
  }


  async refreshSessionData() {
    if (this.uartRef.link.port && this.uartRef.link.connected) {
      await this.uartRef.link.port.refreshSessionData();
    }
  }
}