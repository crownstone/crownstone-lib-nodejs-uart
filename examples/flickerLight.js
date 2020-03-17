const Bluenet = require("../dist/BluenetUart")

let bluenet = new Bluenet.BluenetUart()

let asyncInit = async function() {
  await bluenet.start()
  await bluenet.switchCrownstone(37, 1);
  await bluenet.close();
  await bluenet.delay(1000);
}

let promiseInit = function() {
  return bluenet.start()
    .then(() => { return bluenet.switchCrownstone(37, 0); })
    .then(() => { return bluenet.close(); })
    .then(() => { return bluenet.delay(1000); })
}


// we can use the lib with async functions like so:
asyncInit()
  .then(() => {
    // OR we can use the lib with promises like so:
    return promiseInit()
  })
  .then(async () => {
    // Or we mix it up!
    await asyncInit()
    await promiseInit()
  })
