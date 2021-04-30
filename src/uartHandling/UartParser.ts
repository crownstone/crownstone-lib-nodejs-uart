import {eventBus} from "../singletons/EventBus";
import {ServiceData} from "crownstone-core/dist/packets/ServiceData";
import {UartRxType} from "../declarations/enums";
import {ControlType, ResultPacket} from "crownstone-core";
import {HelloPacket} from "./contentPackets/rx/Hello";

import {Logger} from "../Logger";
import {UartWrapperPacketV2} from "./uartPackets/UartWrapperPacketV2";
import {MeshExternalStatePart0} from "./uartPackets/parser/MeshExternalStatePart0";
import {MeshExternalStatePart1} from "./uartPackets/parser/MeshExternalStatePart1";
import {topics} from "../declarations/topics";
import {PresenceChangedPacket} from "./contentPackets/rx/PresenceChangedPacket";
import {AssetMacReport} from "./uartPackets/parser/AssetMacReport";
import {
  NearestCrownstoneTrackingTimeout,
  NearestCrownstoneTrackingUpdate
} from "./uartPackets/parser/NearestCrownstone";

const log = Logger(__filename, true);

const MeshDataUniquenessChecker = {};
const MeshDataUniquenessChecker_part0 = {};
const MeshDataUniquenessChecker_part1 = {};

export class UartParser {

  static parse(dataPacket : UartWrapperPacketV2) {
    let dataType = dataPacket.dataType;
    let parsedData = null;

    if (dataPacket.valid === false) {
      log.warn("Invalid packet, maybe wrong protocol?");
      return;
    }

    eventBus.emit(topics.RxReceived, dataPacket);

    if (dataPacket.dataType < 60000) {
      log.verbose("Handling packet:", dataPacket.dataType);
    }

    if (dataType === UartRxType.HELLO) {
      let hello = new HelloPacket(dataPacket.payload);
      if (hello.valid) {
        eventBus.emit(topics.HelloReceived, hello);
      }
      else {
        console.log("invalid hello packet", dataPacket.payload)
      }
    }
    else if (dataType === UartRxType.SESSION_NONCE) {
      if (dataPacket.payload.length === 5) {
        eventBus.emit(topics.SessionNonceReceived, dataPacket.payload);
      }
      else {
        console.log("invalid session nonce packet", dataPacket.payload)
      }
    }
    else if (dataType === UartRxType.HEARTBEAT) {
      eventBus.emit(topics.HeartBeat, null);
    }
    else if (dataType === UartRxType.STATUS) {
      if (dataPacket.payload.length === 1) {
        eventBus.emit(topics.Status, {timeout: dataPacket.payload.readUInt8(0)});
      }
      else {
        console.log("invalid STATUS packet", dataPacket.payload)
      }
    }
    else if (dataType === UartRxType.MAC_ADDRESS) {
      eventBus.emit(topics.IncomingMacAddress, dataPacket.payload)
    }
    else if (dataType === UartRxType.RESULT_PACKET) {
      let packet = new ResultPacket(dataPacket.payload);
      if (packet.commandType === ControlType.UART_MESSAGE) {
        log.verbose("resultPacket", packet);
      }
      else {
        log.debug("resultPacket", packet);
      }
      eventBus.emit(topics.ResultPacket, packet);
    }
    else if (dataType === UartRxType.PARSING_FAILED) {
      log.error("PARSING IN FIRMWARE FAILED......")
    }
    else if (dataType === UartRxType.ERROR_REPLY) {
      console.log("ERROR REPLY......")
    }
    else if (dataType === UartRxType.SESSION_NONCE_MISSING_REPLY) {
      log.warn("NO_SESSION_NONCE_AVAILABLE")
      eventBus.emit(topics.SessionNonceMissing);
    }
    else if (dataType === UartRxType.DECRYPTION_FAILED) {
      log.warn("DECRYPTION FAILED......");
      eventBus.emit(topics.DecryptionFailed);
    }
    else if (dataType === UartRxType.UART_MESSAGE) {
      let string =  dataPacket.payload.toString();
      log.verbose("UartMessage", string);
      eventBus.emit(topics.UartMessage, {string: string, data: dataPacket.payload})
    }
    else if (dataType === UartRxType.SESSION_NONCE_MISSING) {
      log.warn("NO_SESSION_NONCE_AVAILABLE")
      eventBus.emit(topics.SessionNonceMissing);
    }
    else if (dataType === UartRxType.OWN_SERVICE_DATA) {
      // console.log("Got Own service data")
      let serviceData = new ServiceData(dataPacket.payload);
      serviceData.parse();
      if (serviceData.validData) {
        eventBus.emit(topics.SelfServiceData, serviceData.getJSON());
      }
    }
    else if (dataType === UartRxType.PRESENCE_CHANGE_PACKET) {
      // This might have to be handled in the future.
      let presenceChangePacket = new PresenceChangedPacket(dataPacket.payload);
      if (presenceChangePacket.valid) {
        eventBus.emit(topics.PresenceChanged, presenceChangePacket.getJSON())
      }
      else {
        log.error("Could nog parse the presence change packet", dataPacket.payload);
      }
    }
    else if (dataType === UartRxType.FACTORY_RESET) {
      // This might have to be handled in the future.
      eventBus.emit(topics.FactoryReset)
    }
    else if (dataType === UartRxType.BOOT) {
      // This might have to be handled in the future.
    }
    else if (dataType === UartRxType.HUB_DATA) {
      eventBus.emit(topics.HubDataReceived, {payload: dataPacket.payload, wasEncrypted: dataPacket.encrypted} );
    }
    else if (dataType === UartRxType.HUB_DATA_REPLY_ACK) {

    }
    else if (dataType === UartRxType.MESH_SERVICE_DATA) {
      let serviceData = new ServiceData(dataPacket.payload, true);
      serviceData.parse()
      if (serviceData.validData) {
        if (MeshDataUniquenessChecker[serviceData.crownstoneId] !== serviceData.uniqueIdentifier) {
          MeshDataUniquenessChecker[serviceData.crownstoneId] = serviceData.uniqueIdentifier;
          log.verbose("MeshServiceData", serviceData.getJSON())
          eventBus.emit(topics.MeshServiceData, serviceData.getJSON())
        }
      }
      else {
        console.log(new Date().toLocaleString(), "Invalid mesh data from:", serviceData.crownstoneId)
      }
    }
    else if (dataType === UartRxType.EXTERNAL_STATE_PART_0) {
      let serviceData = new MeshExternalStatePart0(dataPacket.payload);
      if (serviceData.valid) {
        if (MeshDataUniquenessChecker_part0[serviceData.crownstoneId] !== serviceData.uniqueIdentifier) {
          MeshDataUniquenessChecker_part0[serviceData.crownstoneId] = serviceData.uniqueIdentifier;
          log.silly("MeshServiceData_part0", serviceData.getJSON())
          eventBus.emit(topics.MeshServiceData_part0, serviceData.getJSON())
        }
      }
    }
    else if (dataType === UartRxType.EXTERNAL_STATE_PART_1) {
      let serviceData = new MeshExternalStatePart1(dataPacket.payload);
      if (serviceData.valid) {
        if (MeshDataUniquenessChecker_part1[serviceData.crownstoneId] !== serviceData.uniqueIdentifier) {
          MeshDataUniquenessChecker_part1[serviceData.crownstoneId] = serviceData.uniqueIdentifier;
          log.silly("MeshServiceData", serviceData.getJSON())
          eventBus.emit(topics.MeshServiceData_part1, serviceData.getJSON())
        }
      }
    }
    else if (dataType === UartRxType.ASSET_MAC_RSSI_REPORT) {
      let macReport = new AssetMacReport(dataPacket.payload);
      if (macReport.valid) {
        log.silly("AssetMacReport", macReport.getJSON());
        eventBus.emit(topics.AssetMacReport, macReport.getJSON());
      }
    }
    else if (dataType === UartRxType.NEAREST_CROWNSTONE_TRACKING_UPDATE) {
      let update = new NearestCrownstoneTrackingUpdate(dataPacket.payload);
      if (update.valid) {
        log.silly("NearestCrownstoneTrackingUpdate", update.getJSON());
        eventBus.emit(topics.NearstCrownstoneTrackingUpdate, update.getJSON());
      }
    }
    else if (dataType === UartRxType.NEAREST_CROWNSTONE_TRACKING_TIMEOUT) {
      let timeoutData = new NearestCrownstoneTrackingTimeout(dataPacket.payload);
      if (timeoutData.valid) {
        log.silly("AssetMacReport", timeoutData.getJSON());
        eventBus.emit(topics.NearstCrownstoneTrackingTimeout, timeoutData.getJSON());
      }
    }
    else if (dataType === UartRxType.MESH_RESULT) {
    }
    else if (dataType === UartRxType.MESH_ACK_ALL_RESULT) {
    }
    else if (dataType === UartRxType.EVENT_BUS) {
    }
    else if (dataType === UartRxType.MESH_COMMAND_TIME) {
    }
    else if (dataType === UartRxType.PROFILE_LOCATION) {
    }
    else if (dataType === UartRxType.BEHAVIOUR_SETTINGS) {
    }
    else if (dataType === UartRxType.TRACKED_DEVICE_REGISTER) {
    }
    else if (dataType === UartRxType.TRACKED_DEVICE_TOKEN) {
    }
    else if (dataType === UartRxType.SYNC_REQUEST) {
    }
    else if (dataType === UartRxType.TRACKED_DEVICE_HEARTBEAT) {
    }
    else if (dataType === UartRxType.ADVERTISING_ENABLED) {
    }
    else if (dataType === UartRxType.MESH_ENABLED) {
    }
    else if (dataType === UartRxType.CROWNSTONE_ID) {
    }
    else if (dataType === UartRxType.ADC_CONFIG) {
    }
    else if (dataType === UartRxType.ADC_RESTART) {
    }
    else if (dataType === UartRxType.POWER_LOG_CURRENT) {
    }
    else if (dataType === UartRxType.POWER_LOG_VOLTAGE) {
    }
    else if (dataType === UartRxType.POWER_LOG_FILTERED_CURRENT) {
    }
    else if (dataType === UartRxType.POWER_LOG_FILTERED_VOLTAGE) {
    }
    else if (dataType === UartRxType.POWER_LOG_POWER) {
    }
    else if (dataType === UartRxType.ASCII_LOG) {
      let stringResult = ""
      for (let i = 0; i< dataPacket.payload.length; i++) {
        let byte = dataPacket.payload[i];
        if (byte < 128) {
          stringResult += String.fromCharCode(byte);
        }
      }
      log.debug("UartMessage", stringResult);
    }
    else if (dataType === UartRxType.TEST_STRINGS) {
      let string =  dataPacket.payload.toString();
      log.silly("TEST_STRINGS", string);
    }
    else {
      log.notice("Unknown OpCode", dataType)
    }

    parsedData = null;
  }

}