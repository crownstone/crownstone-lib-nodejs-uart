const BluenetUart = require("../dist/index")
let bluenet = new BluenetUart.BluenetUart()

let asyncInit = async function() {
  await bluenet.start()
  await bluenet.switchCrownstone(8, 1);
  await bluenet.delay(400);
  await bluenet.switchCrownstone(8, 0);
  await bluenet.close()
}

asyncInit()
