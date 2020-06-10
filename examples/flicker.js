const CrownstoneUart = require("../dist/index")
let crownstone = new CrownstoneUart.CrownstoneUart()

let asyncInit = async function() {
  await crownstone.start()
  await crownstone.switchCrownstone(8, 1);
  await crownstone.delay(400);
  await crownstone.switchCrownstone(8, 0);
  await crownstone.close()
}

asyncInit()
