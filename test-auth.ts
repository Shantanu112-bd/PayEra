import { Keypair } from "@stellar/stellar-sdk";

async function main() {
  const kp = Keypair.random();
  const address = kp.publicKey();
  
  const challengeRes = await fetch("https://cryptopayapi-production.up.railway.app/api/v1/auth/wallet/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address,
      network: "STELLAR",
      provider: "FREIGHTER"
    })
  });
  
  const challenge = await challengeRes.json();
  console.log("Challenge:", challenge);
  
  if (!challenge.message) {
    console.error("No message in challenge");
    return;
  }
  
  const signatureBuffer = kp.sign(Buffer.from(challenge.message, "utf-8"));
  const signatureBase64 = signatureBuffer.toString("base64");
  
  const loginRes = await fetch("https://cryptopayapi-production.up.railway.app/api/v1/auth/wallet/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address,
      network: "STELLAR",
      provider: "FREIGHTER",
      nonce: challenge.nonce,
      signature: signatureBase64
    })
  });
  
  console.log("Login Status:", loginRes.status);
  const loginResult = await loginRes.json();
  console.log("Login Result:", loginResult);
}
main();
