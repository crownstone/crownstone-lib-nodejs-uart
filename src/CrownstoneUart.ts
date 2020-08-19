import {UartManager} from "./uartHandling/UartManager";
import {eventBus} from "./singletons/EventBus";

const log = require('debug-level')('crownstone-uart')

export class CrownstoneUart {
  uart : UartManager

  constructor() {
    this.uart = new UartManager();
  }

  async start() : Promise<void> {
    log.info("Starting Link.")
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

  async turnOnCrownstone(crownstoneId: number) : Promise<void> {
    return this.uart.switchCrownstones([{ type:"TURN_ON", crownstoneId }]);
  }
  async turnOffCrownstone(crownstoneId: number) : Promise<void> {
    return this.uart.switchCrownstones([{ type:"TURN_OFF", crownstoneId }]);
  }

  /**
   * @param crownstoneId
   * @param switchState   0...100
   */
  async dimCrownstone(crownstoneId: number, switchState: number) : Promise<void> {
    return this.uart.switchCrownstones([{ type:"DIMMING", crownstoneId, switchState: switchState }]);
  }

  async switchCrownstones(switchData : SwitchData[]) : Promise<void> {
    return this.uart.switchCrownstones(switchData);
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