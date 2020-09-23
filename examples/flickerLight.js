const Crownstone = require("../dist/CrownstoneUart")

let asyncInit = async function() {
  let crownstone = new Crownstone.CrownstoneUart()
  await crownstone.start()
  await crownstone.switchCrownstone(37, 100);
  await crownstone.close();
  await crownstone.delay(1000);
}

let promiseInit = function() {
  let crownstone = new Crownstone.CrownstoneUart()
  return crownstone.start()
    .then(() => { return crownstone.switchCrownstone(37, 0); })
    .then(() => { return crownstone.close(); })
    .then(() => { return crownstone.delay(1000); })
}

// we can use the lib with async functions like so:
asyncInit()
  .then(() => {
    // OR we can use the lib with promises like so:
    return promiseInit();
  })
  .then(async () => {
    // Or we mix it up!
    await asyncInit();
    await promiseInit();
  })
  .catch((f) => { console.log(f)})
