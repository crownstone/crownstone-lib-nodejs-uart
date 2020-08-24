import {UartPacket} from "./uartPackets/UartWrapperPacket";
import {eventBus} from "../singletons/EventBus";
import {ServiceData} from "crownstone-core/dist/packets/ServiceData";
import {UartRxType} from "../declarations/enums";
import {ResultPacket} from "crownstone-core";

const verboseLog = require('debug-level')('crownstone-verbose-uart-service-data');
const MeshDataUniquenessChecker = {};

export class UartParser {

  static parse(dataPacket : UartPacket) {
    let opCode = dataPacket.opCode;
    let parsedData = null;

    // console.log("DATA", opCode)

    if (opCode == UartRxType.SERVICE_DATA) {
      // console.log("Got Own service data")
      let serviceData = new ServiceData(dataPacket.payload);
      serviceData.parse();
      if (serviceData.validData) {
        eventBus.emit("SelfServiceData", serviceData.getJSON());
      }
    }
    else if (opCode == UartRxType.RESULT_PACKET) {
      let packet = new ResultPacket(dataPacket.payload);
      verboseLog.debug("resultPacket", packet);
      eventBus.emit("resultPacket", packet);
    }
    else if (opCode == UartRxType.MESH_SERVICE_DATA) {
      let serviceData = new ServiceData(dataPacket.payload, true);
      serviceData.parse()
      if (serviceData.validData) {
        if (MeshDataUniquenessChecker[serviceData.crownstoneId] !== serviceData.uniqueIdentifier) {
          MeshDataUniquenessChecker[serviceData.crownstoneId] = serviceData.uniqueIdentifier;
          verboseLog.debug("MeshServiceData", serviceData.getJSON())
          eventBus.emit("MeshServiceData", serviceData.getJSON())
        }
      }
      else {
        console.log(new Date().toLocaleString(), "Invalid mesh data from:", serviceData.crownstoneId)
      }

      // serviceData = ServiceData(dataPacket.payload)
      // if (serviceData.validData) {
      // CrownstoneEventBus.emit(DevTopics.newServiceData, serviceData.getDictionary())
      // }
    }
    else if (opCode == UartRxType.CROWNSTONE_ID) {
      console.log("Got Crownstone Id")
      // id = Conversion.int8_to_uint8(dataPacket.payload)
      // CrownstoneEventBus.emit(DevTopics.ownCrownstoneId, id)
    }
    else if (opCode == UartRxType.MAC_ADDRESS) {
      console.log("Got MAC address")
      // if (addr !== "") {
      //     // CrownstoneEventBus.emit(DevTopics.ownMacAddress, addr)
      // }
      // else {
      //     // console.log("invalid address) {", dataPacket.payload)
      // }
    }
    else if (opCode == UartRxType.POWER_LOG_CURRENT) {
      console.log("Got MAC address")
      // type is CurrentSamples
      // parsedData = CurrentSamplesPacket(dataPacket.payload)
      // CrownstoneEventBus.emit(DevTopics.newCurrentData, parsedData.getDict())
    }
    else if (opCode == UartRxType.POWER_LOG_VOLTAGE) {
      // type is VoltageSamplesPacket
      // parsedData = VoltageSamplesPacket(dataPacket.payload)
      // CrownstoneEventBus.emit(DevTopics.newVoltageData, parsedData.getDict())
    }
    else if (opCode == UartRxType.POWER_LOG_FILTERED_CURRENT) {
      // type is CurrentSamples
      // parsedData = CurrentSamplesPacket(dataPacket.payload)
      // CrownstoneEventBus.emit(DevTopics.newFilteredCurrentData, parsedData.getDict())
    }
    else if (opCode == UartRxType.POWER_LOG_FILTERED_VOLTAGE) {
      // type is VoltageSamplesPacket
      // parsedData = VoltageSamplesPacket(dataPacket.payload)
      // CrownstoneEventBus.emit(DevTopics.newFilteredVoltageData, parsedData.getDict())
    }
    else if (opCode == UartRxType.POWER_LOG_POWER) {
      // type is PowerCalculationsPacket
      // parsedData = PowerCalculationPacket(dataPacket.payload)
      // CrownstoneEventBus.emit(DevTopics.newCalculatedPowerData, parsedData.getDict())
    }
    else if (opCode == UartRxType.ADC_CONFIG) {
      // type is PowerCalculationsPacket
      // parsedData = AdcConfigPacket(dataPacket.payload)
      // CrownstoneEventBus.emit(DevTopics.newAdcConfigPacket, parsedData.getDict())
    }
    else if (opCode == UartRxType.ADC_RESTART) {
      // CrownstoneEventBus.emit(DevTopics.adcRestarted, null)
    }
    else if (opCode == UartRxType.EXTERNAL_STATE_PART_0) {
      // CrownstoneEventBus.emit(DevTopics.adcRestarted, null)
    }
    else if (opCode == UartRxType.EXTERNAL_STATE_PART_1) {
      // CrownstoneEventBus.emit(DevTopics.adcRestarted, null)
    }
    else if (opCode == UartRxType.ASCII_LOG) {
      let stringResult = ""
      for (let i = 0; i< dataPacket.payload.length; i++) {
        let byte = dataPacket.payload[i];
        if (byte < 128) {
          stringResult += String.fromCharCode(byte);
        }
      }
      console.log("LOG:", new Date().valueOf(),":"+stringResult)
    }
    else if (opCode == UartRxType.UART_MESSAGE) {
      if (dataPacket.payload.toString() !== 'ping') {
        verboseLog.verboseLog("UartMessage", dataPacket.payload.toString())
        eventBus.emit("UartMessage", {string: dataPacket.payload.toString(), data: dataPacket.payload})
      }
    }
    else {
      console.log("Unknown OpCode", opCode)
    }

    parsedData = null;
  }

}