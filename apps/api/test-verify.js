const StellarBase = require('@stellar/stellar-base');

const kp = StellarBase.Keypair.random();
const message = "Hello";
const signature = kp.sign(Buffer.from(message));
console.log(kp.verify(Buffer.from(message), signature));

// Let's verify how freighter signs.
