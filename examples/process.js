const CrownstoneUart = require("../dist/index")
let crownstone = new CrownstoneUart.CrownstoneUart()

let asyncInit = async function() {
  await crownstone.start()
  setTimeout(async () => {
    await crownstone.close()
  }, 40000)
}

asyncInit()
