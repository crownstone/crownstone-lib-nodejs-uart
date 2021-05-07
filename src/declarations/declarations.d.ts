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

interface HubStatusData {
  encryptionRequired? : boolean,
  clientHasBeenSetup? : boolean,
  clientHasInternet? : boolean,
  clientHasError?    : boolean,
}

interface AssetMacReportData {
  macAddress:   string,
  crownstoneId: number,
  rssi:         number,
  channel:      number,
}

interface NearestCrownstoneUpdateData {
  assetId:      string,
  crownstoneId: number,
  rssi:         number,
  channel:      number,
}

interface NearestCrownstoneTimeoutData {
  assetId:      string,
}