const sdk = require('@stellar/stellar-sdk');
console.log(Object.keys(sdk).filter(k => k.toLowerCase().includes('verify') || k.toLowerCase().includes('message')));
