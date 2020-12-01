import {generateProjectLogger} from "crownstone-logger";

export const Logger : LogGetter = generateProjectLogger("crownstone:uart");


const globalGroup = "UNGROUPED"
class LogThrottleClass {
  logs = {}
  groups = {}


  check(type: string, group: string = globalGroup, throttleThreshold = 10000) {
    if (this.groups[group] === undefined) {
      this.groups[group] = {};
    }

    this.groups[group][type] = Date.now();

    if (this.logs[type] === undefined) {
      this.logs[type] = Date.now();
      return true;
    }


    let dt = Date.now() - this.logs[type];

    if (dt > throttleThreshold) { // throttle every 10 seconds
      this.logs[type] = Date.now();
      return true;
    }
    return false;
  }

  clearGroup(group: string) {
    if (group !== globalGroup && this.groups[group]) {
      Object.keys(this.groups[group]).forEach((type) => {
        delete this.logs[type];
      })
      delete this.groups[group];
    }
  }

  reset() {
    this.logs = {};
    this.groups = {};
  }

}

export const LogThrottle = new LogThrottleClass()
