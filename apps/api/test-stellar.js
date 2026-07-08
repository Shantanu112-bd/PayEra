const { Keypair } = require('@stellar/stellar-base');
const crypto = require('crypto');

// test what freighter might do
const kp = Keypair.random();
const msg = "Hello world";

const prefix = Buffer.from('Stellar Signed Message:\n');
const payload = Buffer.concat([prefix, Buffer.from(msg)]);
const sig = kp.sign(payload); // Does freighter sign this?

const hash = crypto.createHash('sha256').update(payload).digest();
const sigOfHash = kp.sign(hash); // Or does it sign the hash?

console.log("Verifies payload directly?", kp.verify(payload, sig));
console.log("Verifies hash directly?", kp.verify(hash, sigOfHash));

