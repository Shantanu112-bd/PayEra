const { Keypair } = require('@stellar/stellar-base');
const crypto = require('crypto');

const kp = Keypair.random();
const msg = "CryptoPay Network login";

const prefix = Buffer.from('Stellar Signed Message:\n');
const msgBytes = Buffer.from(msg, 'utf-8');
const payload = Buffer.concat([prefix, msgBytes]);
const hash = crypto.createHash('sha256').update(payload).digest();

// Sign 1: Hash
const sig1 = kp.sign(hash);
console.log("Sig1 verify hash:", kp.verify(hash, sig1));

// Sign 2: Payload
const sig2 = kp.sign(payload);
console.log("Sig2 verify payload:", kp.verify(payload, sig2));

// Sign 3: Msg bytes
const sig3 = kp.sign(msgBytes);
console.log("Sig3 verify msgBytes:", kp.verify(msgBytes, sig3));
