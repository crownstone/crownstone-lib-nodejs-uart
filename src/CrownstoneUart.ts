import {UartManager} from "./uartHandling/UartManager";
import {eventBus} from "./singletons/EventBus";
import {Logger} from './Logger'
const log = Logger(__filename);

export class CrownstoneUart {
  uart : UartManager
  log = log;

  constructor() {
    this.uart = new UartManager();
  }

  async start(forcedPort = null) : Promise<void> {
    log.info("Starting Link.")
    return this.uart.link.start(forcedPort);
  }

  async close() : Promise<void> {
    log.info("Closing CrownstoneUART.");
    return this.uart.link.close();
  }

  uartEcho(string : string) {
    log.info("Sending uart echo", string);
    this.uart.echo(string)
  }

  on(topic : string, callback : (data: any) => void) : () => void {
    return eventBus.on(topic,callback)
  }

  async turnOnCrownstone(stoneId: number) : Promise<void> {
    log.info("turn on Crownstone", stoneId);
    return this.uart.switchCrownstones([{ type:"TURN_ON", stoneId }]);
  }

  async turnOffCrownstone(stoneId: number) : Promise<void> {
    log.info("turn off Crownstone", stoneId);
    return this.uart.switchCrownstones([{ type:"TURN_OFF", stoneId }]);
  }

  /**
   * @param crownstoneId
   * @param switchState   0...100
   */
  async dimCrownstone(stoneId: number, percentage: number) : Promise<void> {
    log.info("dimCrownstone", stoneId, percentage);
    return this.uart.switchCrownstones([{ type:"PERCENTAGE", stoneId, percentage: percentage }]);
  }

  async switchCrownstones(switchData : SwitchData[]) : Promise<void> {
    log.info("switch Crownstones", switchData);
    return this.uart.switchCrownstones(switchData);
  }

  async switchCrownstone(stoneUID: number, percentage: number) : Promise<void> {
    return this.switchCrownstones([{
      type: "PERCENTAGE",
      stoneId: stoneUID,
      percentage: percentage // 0 ... 100
    }]);
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
    log.info("registerTrackedDevice", arguments);
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

  async setTime(customTimeInSeconds?: number) {
    log.info("setTime", customTimeInSeconds);
    return await this.uart.setTime(customTimeInSeconds);
  }

  async getMacAddress() {
    log.info("Get MacAddress");
    return await this.uart.getMacAddress();
  }

}