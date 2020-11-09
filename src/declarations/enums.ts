
export const UartTxType = {
  HELLO:                            0,
  SESSION_NONCE:                    1,
  HEARTBEAT:                        2,
  STATUS:                           3,
  CONTROL:                          10,

  ENABLE_ADVERTISEMENT:             50000,
  ENABLE_MESH:                      50001,

  GET_CROWNSTONE_ID:                50002,
  GET_MAC_ADDRESS:                  50003,

  ADC_CONFIG_INC_RANGE_CURRENT:     50103,
  ADC_CONFIG_DEC_RANGE_CURRENT:     50104,
  ADC_CONFIG_INC_RANGE_VOLTAGE:     50105,
  ADC_CONFIG_DEC_RANGE_VOLTAGE:     50106,
  ADC_CONFIG_DIFFERENTIAL_CURRENT:  50108,
  ADC_CONFIG_DIFFERENTIAL_VOLTAGE:  50109,
  ADC_CONFIG_VOLTAGE_PIN:           50110,

  POWER_LOG_CURRENT:                50200,
  POWER_LOG_VOLTAGE:                50201,
  POWER_LOG_FILTERED_CURRENT:       50202,
  POWER_LOG_CALCULATED_POWER:       50204,

  INJECT_INTERNAL_EVENT:            60000,
};


export const UartRxType = {
  HELLO:                            0,
  SESSION_NONCE:                    1,
  HEARTBEAT:                        2,
  STATUS:                           3,
  RESULT_PACKET:                    10,

  UART_MESSAGE:                     10000,
  NO_SESSION_NONCE_AVAILABLE:       10001,
  OWN_SERVICE_DATA:                 10002,
  PRESENCE_CHANGE_PACKET:           10004,
  FACTORY_RESET:                    10005,
  BOOT:                             10006,

  MESH_SERVICE_DATA:                10102,
  EXTERNAL_STATE_PART_0:    	      10103,
  EXTERNAL_STATE_PART_1:    	      10104,
  MESH_RESULT:              	      10105,
  MESH_ACK_ALL_RESULT:              10106,

  EVENT_BUS:                        40000,
  TIME:                             40103,
  PROFILE_LOCATION:                 40110,
  BEHAVIOUR_SETTINGS:               40111,
  TRACKED_DEVICE_REGISTER:          40112,
  TRACKED_DEVICE_TOKEN:             40113,
  SYNC_REQUEST:                     40114,
  TRACKED_DEVICE_HEARTBEAT:         40120,

  ADVERTISING_ENABLED:              50000,
  MESH_ENABLED:                     50001,
  CROWNSTONE_ID:                    50002,
  MAC_ADDRESS:                      50003,

  ADC_CONFIG:                       50100,
  ADC_RESTART:                      50101,

  POWER_LOG_CURRENT:                50200,
  POWER_LOG_VOLTAGE:                50201,
  POWER_LOG_FILTERED_CURRENT:       50202,
  POWER_LOG_FILTERED_VOLTAGE:       50203,
  POWER_LOG_POWER:                  50204,

  ASCII_LOG:                        60000,

  TEST_STRINGS:                     60001,
};

