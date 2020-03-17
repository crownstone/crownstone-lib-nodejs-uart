const Bluenet = require("../dist/BluenetUart")

let bluenet = new Bluenet.BluenetUart()

let asyncInit = async function() {
  await bluenet.start()
  await bluenet.switchCrownstone(37, 1);
  await bluenet.delay(1000);
  await bluenet.switchCrownstone(37, 0);
  await bluenet.close();
}

asyncInit()
