import {UartManager} from "./uartHandling/UartManager";


export class BluenetUart {
  uart : UartManager

  constructor() {
    this.uart = new UartManager();
    console.log("started")
  }

  async start() : Promise<void> {
    return this.uart.start();
  }

  async close() : Promise<void> {
    return this.uart.close();
  }

  uartEcho(string) {
    this.uart.echo(string)
  }

  async switchCrownstone(crownstoneId: number, switchState: number) : Promise<void> {
    return this.uart.switchCrownstone(crownstoneId,switchState);
  }

  async delay(ms: number = 200) : Promise<void> {
    return new Promise((resolve, reject) => { setTimeout(() => { resolve() }, ms); });
  }
}