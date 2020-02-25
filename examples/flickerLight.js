const Bluenet = require("../dist/BluenetUart")

let bluenet = new Bluenet.BluenetUart()

let asyncInit = async function() {
  await bluenet.start()
  await bluenet.switchCrownstone(1, 1);
  await bluenet.close();
  await bluenet.delay(200);
}

let promiseInit = function() {
  return bluenet.start()
    .then(() => { return bluenet.switchCrownstone(1, 0); })
    .then(() => { return bluenet.close(); })
    .then(() => { return bluenet.delay(200); })
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
