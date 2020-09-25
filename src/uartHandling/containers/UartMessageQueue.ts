import {eventBus} from "../../singletons/EventBus";
import Timeout = NodeJS.Timeout;
import {Logger} from "../../Logger";

const log = Logger(__filename);

interface ActiveWrite {
  dataType: number,
  data: Buffer
  resolver: () => void,
  rejector: (err) => void
}

const WRITE_TIMEOUT = 150; // ms


export class UartMessageQueue {

  queue : ActiveWrite[] = [];
  writeCallback : (data: Buffer) => Promise<void>;
  eventListeners = [];

  _writeTimeout : Timeout = null;

  _activeWrite : ActiveWrite | null = null;

  constructor(writeCallback) {
    this.writeCallback = writeCallback;
    this.eventListeners.push(eventBus.on("RxTypeReceived", (rxType) => { this._handleRxType(rxType) }));
  }

  cleanup() {
    clearTimeout(this._writeTimeout)
    this.queue.forEach((queueItem) => {
      queueItem.rejector({code: 500, message:"Connection lost"});
    })
    this.eventListeners.forEach((unsubscribe) => { unsubscribe(); })
  }


  add(dataType: number, data: Buffer, resolver, rejector) {
    let writeCommandItem = { dataType: dataType, data: data, resolver: resolver, rejector: rejector };
    this.queue.push(writeCommandItem);
    this._next();
  }

  cleanActiveWrite() {
    if (this._activeWrite) {
      clearTimeout(this._writeTimeout);
      this._activeWrite = null;
      if (this.queue.length > 0) {
        this.queue.splice(0, 1);
      }
      this._next();
    }
  }


  _next() {
    if (this.queue.length == 0) {
      log.debug("Uart queue finished!");
      return;
    }

    log.debug("Handling next item in queue");
    if (this._activeWrite === null) {
      this._activeWrite = this.queue[0];
      this._writeTimeout = setTimeout(() => {
        this._activeWrite.rejector({code: 500, message:"Timeout"});
        this.cleanActiveWrite();
      }, WRITE_TIMEOUT);
      this.writeCallback(this._activeWrite.data).catch((err) => {
        if (this._activeWrite) {
          this._activeWrite.rejector(err);
        }
        this.cleanActiveWrite();
      });
    }
  }


  _handleRxType(rxType) {
    if (rxType < 10000) {
      if (this._activeWrite) {
        if (this._activeWrite.dataType === rxType) {
          this._activeWrite.resolver();
          this.cleanActiveWrite();
        }
      }
    }
  }
}