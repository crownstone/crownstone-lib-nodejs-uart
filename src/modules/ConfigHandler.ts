import {UartManager} from "../uartHandling/UartManager";
import {Logger} from "../Logger";
import {UartWrapperV2} from "../uartHandling/uartPackets/UartWrapperV2";
import {UartTxType} from "../declarations/enums";
import {eventBus} from "../singletons/EventBus";
import {topics} from "../declarations/topics";
const log = Logger(__filename);

export class ConfigHandler {
  uartRef : UartManager;

  constructor(uart: UartManager) {
    this.uartRef = uart;
  }


  async getMacAddress() {
    log.info("Get MacAddress");
    return new Promise(async (resolve, reject) => {
      let uartPacket  = new UartWrapperV2(UartTxType.GET_MAC_ADDRESS)
      let unsubscribe = eventBus.on(topics.IncomingMacAddress, (data: Buffer) => {
        unsubscribe();

        data.reverse();
        function padd(st) { if (st.length == 1) { return `0${st}`; } return st; }
        let str = padd(data[0].toString(16));
        for (let i = 1; i < data.length; i++) {
          str += ':' + padd(data[i].toString(16))
        }
        resolve(str.toUpperCase());
      })
      try {
        await this.uartRef.write(uartPacket)
      }
      catch (e) {
        unsubscribe();
        throw e;
      }
    })
  }

}