interface keyMap {
  adminKey        : string,
  memberKey       : string,
  basicKey        : string,
  serviceDataKey  : string,
  localizationKey : string,
  meshNetworkKey  : string,
  meshAppKey      : string,
}

type SwitchData = toggleData | dimmerData;

interface toggleData {
  type: "TURN_ON" | "TURN_OFF"
  crownstoneId: number,
}

interface dimmerData {
  type: "DIMMING"
  crownstoneId: number,
  switchState: number // 0 ... 100
}



