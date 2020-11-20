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
  stoneId: number,
}

interface dimmerData {
  type: "PERCENTAGE"
  stoneId: number,
  percentage: number // 0 ... 100
}


type UartDeviceMode = "HUB" | "CROWNSTONE"
