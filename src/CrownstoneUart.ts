import {UartManager} from "./uartHandling/UartManager";
import {eventBus} from "./singletons/EventBus";
import {Logger} from './Logger'
import {ControlHandler} from "./modules/ControlHandler";
import {EncryptionHandler} from "./modules/EncryptionHandler";
import {HubHandler} from "./modules/HubHandler";
import {ConfigHandler} from "./modules/ConfigHandler";
const log = Logger(__filename);

export class CrownstoneUart {

  control    : ControlHandler
  encryption : EncryptionHandler
  hub        : HubHandler
  config     : ConfigHandler


  uart : UartManager
  log = log;

  constructor() {
    this.uart       = new UartManager();
    this.control    = new ControlHandler(this.uart);
    this.encryption = new EncryptionHandler(this.uart);
    this.hub        = new HubHandler(this.uart);
    this.config     = new ConfigHandler(this.uart);
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
    return this.control.switchCrownstones([{ type:"TURN_ON", stoneId }]);
  }


  async turnOffCrownstone(stoneId: number) : Promise<void> {
    log.info("turn off Crownstone", stoneId);
    return this.control.switchCrownstones([{ type:"TURN_OFF", stoneId }]);
  }

  /**
   * @param crownstoneId
   * @param switchState   0...100
   */
  async dimCrownstone(stoneId: number, percentage: number) : Promise<void> {
    log.info("dimCrownstone", stoneId, percentage);
    return this.control.switchCrownstones([{ type:"PERCENTAGE", stoneId, percentage: percentage }]);
  }


  async switchCrownstones(switchData : SwitchData[]) : Promise<void> {
    log.info("switch Crownstones", switchData);
    return this.control.switchCrownstones(switchData);
  }


  async switchCrownstone(stoneUID: number, percentage: number) : Promise<void> {
    return this.switchCrownstones([{
      type: "PERCENTAGE",
      stoneId: stoneUID,
      percentage: percentage // 0 ... 100
    }]);
  }
}