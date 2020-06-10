import {UartManager} from "./uartHandling/UartManager";
import {eventBus} from "./singletons/EventBus";



export class CrownstoneUart {
  uart : UartManager

  constructor() {
    this.uart = new UartManager();
  }

  async start() : Promise<void> {
    return this.uart.link.start();
  }

  async close() : Promise<void> {
    return this.uart.link.close();
  }

  uartEcho(string : string) {
    this.uart.link.echo(string)
  }

  on(topic : string, callback : (data: any) => void) : () => void {
    return eventBus.on(topic,callback)
  }

  async switchCrownstone(crownstoneId: number, switchState: number) : Promise<void> {
    return this.uart.switchCrownstones([{ crownstoneId, switchState }]);
  }

  async switchCrownstones(switchPairs : SwitchPair[]) : Promise<void> {
    return this.uart.switchCrownstones(switchPairs);
  }

  async registerTrackedDevice(
    trackingNumber:number,
    locationUID:number,
    profileId:number,
    rssiOffset:number,
    ignoreForPresence:boolean,
    tapToToggleEnabled:boolean,
    deviceToken:number,
    ttlMinutes:number
  ) {
    return this.uart.registerTrackedDevice(
      trackingNumber,
      locationUID,
      profileId,
      rssiOffset,
      ignoreForPresence,
      tapToToggleEnabled,
      deviceToken,
      ttlMinutes,
    )
  }

  async delay(ms: number = 200) : Promise<void> {
    return new Promise((resolve, reject) => { setTimeout(() => { resolve() }, ms); });
  }
}