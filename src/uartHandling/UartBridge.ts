import SerialPort from 'serialport'

function updatePorts() {
  return new Promise((resolve, reject) => {
    let availablePorts = {};
    SerialPort.list().then((ports) => {
      ports.forEach((port) => {
        availablePorts[port.path] = {port:port, connected:false};
      });
      resolve(availablePorts);
    });
  })
}


updatePorts().then((R) => { console.log(R)});

export class UartBridge {

  baudrate = 230400
  path = ''
  serialController = null
  parser = null
  eventId = 0
  running = true

  constructor(path, baudrate) {
    this.baudrate = baudrate
    this.path = path


    this.serialController = null
    this.parser = null
    this.eventId = 0

    this.running = true

    this.startSerial()
    // threading.Thread.__init__()
  }

  run() {
    // this.eventId = BluenetEventBus.subscribe(SystemTopics.uartWriteData, this.writeToUart)
    //
    // BluenetEventBus.subscribe(SystemTopics.cleanUp, this.stop())
    // this.parser = UartParser()
    // this.startReading()
  }

  stop() {
    // print("Stopping UartBridge")
    // this.running = False
    // BluenetEventBus.unsubscribe(eventId)
  }


  startSerial() {
    // print("Initializing serial on port ", this.port, ' with baudrate ', this.baudrate)
    // this.serialController = serial.Serial()
    // this.serialController.port = this.port
    // this.serialController.baudrate = int(baudrate)
    // this.serialController.timeout = null
    // this.serialController.open()
  }

  startReading() {
    // readBuffer = UartReadBuffer()
    // print("Read starting on serial port.")
    // while this.running:
    // bytes = this.serialController.read()
    // if bytes:
    // // clear out the entire read buffer
    // if this.serialController.in_waiting > 0:
    // additionalBytes = this.serialController.read(serialController.in_waiting)
    // bytes = bytes + additionalBytes
    // readBuffer.addByteArray(bytes)
    //
    // print("Cleaning up")
    // this.serialController.close()
  }

  writeToUart(data) {
    // this.serialController.write(data)
  }


}

