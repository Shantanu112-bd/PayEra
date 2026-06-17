import {
  PrismaClient,
  UserRole,
  MerchantStatus,
  CampaignStatus,
  CampaignRewardType,
  TransactionStatus,
  TransactionType,
  PaymentRail,
  SettlementLayer,
  AssetCode,
  RewardReason,
  RewardStatus,
  SettlementStatus,
  WalletProvider,
  WalletNetwork,
  WalletStatus,
  BrandStatus,
} from "./../src/generated/prisma";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as crypto from "crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── IDs ────────────────────────────────────────────────────────────────────
const DEMO_USER_ID       = "00000000-0000-0000-0000-000000000001";
const DEMO_WALLET_ID     = "00000000-0000-0000-0000-000000000002";
const DEMO_QR_ID         = "00000000-0000-0000-0000-000000000003";
const DEMO_MERCHANT_ID   = "11111111-1111-1111-1111-111111111111";
const DEMO_BRAND_ID      = "22222222-2222-2222-2222-222222222222";
const DEMO_CAMPAIGN_ID   = "33333333-3333-3333-3333-333333333333";

// Seeded Stellar hashes (realistic looking testnet hashes)
const STELLAR_HASHES = [
  "a8f3c2d1e9b04f7a6c5d2e3f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2",
  "b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1",
  "c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9",
  "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
  "e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7",
];

const STAR_MINT_HASHES = [
  "STAR_MINT_001_aa1bb2cc3dd4ee5ff6",
  "STAR_MINT_002_bb2cc3dd4ee5ff6aa1",
  "STAR_MINT_003_cc3dd4ee5ff6aa1bb2",
  "STAR_MINT_004_dd4ee5ff6aa1bb2cc3",
  "STAR_MINT_005_ee5ff6aa1bb2cc3dd4",
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function main() {
  console.log("🌱 Seeding database...\n");

  // ─── 1. Demo User ─────────────────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: { status: "ACTIVE", lastLoginAt: new Date() },
    create: {
      id: DEMO_USER_ID,
      email: "demo.user@cryptopay.network",
      emailNormalized: "demo.user@cryptopay.network",
      displayName: "Demo User",
      role: UserRole.CONSUMER,
      status: "ACTIVE",
      referralCode: "DEMO-CRYPTO-2026",
      lastLoginAt: new Date(),
    },
  });
  console.log(`✅ Demo User        → ${user.id} (${user.displayName})`);

  // ─── 2. Demo Wallet ───────────────────────────────────────────────────────
  const wallet = await prisma.wallet.upsert({
    where: { id: DEMO_WALLET_ID },
    update: {},
    create: {
      id: DEMO_WALLET_ID,
      userId: user.id,
      address: "GBZE5AYKOH6JGEZ5DGGVMQSZ5HBIXB5JLNP3VJBHSF4KHTG2GY7AEXK",
      addressNormalized: "GBZE5AYKOH6JGEZ5DGGVMQSZ5HBIXB5JLNP3VJBHSF4KHTG2GY7AEXK",
      publicKey: "GBZE5AYKOH6JGEZ5DGGVMQSZ5HBIXB5JLNP3VJBHSF4KHTG2GY7AEXK",
      provider: WalletProvider.FREIGHTER,
      network: WalletNetwork.STELLAR,
      status: WalletStatus.ACTIVE,
      isPrimary: true,
      verifiedAt: daysAgo(30),
      lastUsedAt: new Date(),
    },
  });
  console.log(`✅ Demo Wallet      → ${wallet.id}`);

  // ─── 3. Demo Merchant ─────────────────────────────────────────────────────
  const merchant = await prisma.merchant.upsert({
    where: { id: DEMO_MERCHANT_ID },
    update: {},
    create: {
      id: DEMO_MERCHANT_ID,
      ownerUserId: user.id,
      displayName: "Chai Point",
      legalName: "Chai Point Private Limited",
      merchantCode: "CHAI-001",
      status: MerchantStatus.APPROVED,
      defaultUpiVpa: "chaipoint@upi",
      category: "F&B",
      city: "Bengaluru",
      state: "Karnataka",
      country: "IN",
      approvedAt: daysAgo(60),
    },
  });
  console.log(`✅ Demo Merchant    → ${merchant.id} (${merchant.displayName})`);

  // ─── 4. Demo QR Code ──────────────────────────────────────────────────────
  const qrPayload = "upi://pay?pa=chaipoint@upi&pn=Chai%20Point&mc=5411&tid=DEMO";
  await prisma.merchantQrCode.upsert({
    where: { id: DEMO_QR_ID },
    update: {},
    create: {
      id: DEMO_QR_ID,
      merchantId: merchant.id,
      upiVpa: "chaipoint@upi",
      qrPayload,
      qrPayloadHash: sha256(qrPayload),
      isActive: true,
    },
  });
  console.log(`✅ Demo QR Code     → ${DEMO_QR_ID}`);

  // ─── 5. Demo Brand ────────────────────────────────────────────────────────
  // Campaign requires a Brand FK — this is the missing piece
  const brand = await prisma.brand.upsert({
    where: { id: DEMO_BRAND_ID },
    update: {},
    create: {
      id: DEMO_BRAND_ID,
      ownerUserId: user.id,
      name: "Chai Point Rewards",
      slug: "chai-point-rewards",
      status: BrandStatus.ACTIVE,
    },
  });
  console.log(`✅ Demo Brand       → ${brand.id} (${brand.name})`);

  // ─── 6. Demo Campaign (DOUBLE_REWARDS, ACTIVE) ────────────────────────────
  const campaign = await prisma.campaign.upsert({
    where: { id: DEMO_CAMPAIGN_ID },
    update: { status: CampaignStatus.ACTIVE },
    create: {
      id: DEMO_CAMPAIGN_ID,
      brandId: brand.id,
      name: "Double Star Weekend",
      description: "Earn 2x STAR tokens on every payment at Chai Point this weekend!",
      status: CampaignStatus.ACTIVE,
      rewardType: CampaignRewardType.DOUBLE_REWARDS,
      thresholdAmountPaise: BigInt(5000),   // ₹50 minimum spend
      rewardAmountStar: BigInt(20),          // 20 STAR per qualifying transaction
      budgetStar: BigInt(50000),             // Total budget: 50,000 STAR
      spentStar: BigInt(4200),               // Already spent 4,200 STAR
      startsAt: daysAgo(3),
      endsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // Ends in 4 days
      merchantLinks: {
        create: {
          merchantId: merchant.id,
          isActive: true,
        },
      },
    },
  });
  console.log(`✅ Demo Campaign    → ${campaign.id} (${campaign.name})`);

  // ─── 7. Demo Transactions (5, spread over last 7 days) ───────────────────
  const txData = [
    { amountInPaise: BigInt(10000),  assetIn: AssetCode.USDC, daysBack: 1, stellarHash: STELLAR_HASHES[0], starMint: STAR_MINT_HASHES[0], starReward: BigInt(10)  },
    { amountInPaise: BigInt(25000),  assetIn: AssetCode.XLM,  daysBack: 2, stellarHash: STELLAR_HASHES[1], starMint: STAR_MINT_HASHES[1], starReward: BigInt(25)  },
    { amountInPaise: BigInt(50000),  assetIn: AssetCode.USDC, daysBack: 4, stellarHash: STELLAR_HASHES[2], starMint: STAR_MINT_HASHES[2], starReward: BigInt(50)  },
    { amountInPaise: BigInt(100000), assetIn: AssetCode.XLM,  daysBack: 5, stellarHash: STELLAR_HASHES[3], starMint: STAR_MINT_HASHES[3], starReward: BigInt(100) },
    { amountInPaise: BigInt(150000), assetIn: AssetCode.USDC, daysBack: 7, stellarHash: STELLAR_HASHES[4], starMint: STAR_MINT_HASHES[4], starReward: BigInt(150) },
  ];

  const RATES: Record<string, number> = { USDC: 83, XLM: 9 };

  const createdTxIds: string[] = [];

  for (let i = 0; i < txData.length; i++) {
    const d = txData[i];
    const rate = RATES[d.assetIn] ?? 83;
    const amountInr = Number(d.amountInPaise) / 100;
    const amountInCrypto = amountInr / rate;
    const usdcAmount = amountInr / 83;
    const now = daysAgo(d.daysBack);
    const txPublicId = `PAY-DEMO-${String(i + 1).padStart(3, "0")}`;

    const tx = await prisma.transaction.upsert({
      where: { publicId: txPublicId },
      update: {},
      create: {
        publicId: txPublicId,
        userId: user.id,
        walletId: wallet.id,
        merchantId: merchant.id,
        merchantQrCodeId: DEMO_QR_ID,
        campaignId: DEMO_CAMPAIGN_ID,
        type: TransactionType.CRYPTO_TO_FIAT,
        status: TransactionStatus.COMPLETED,
        rail: PaymentRail.UPI_MOCK,
        settlementLayer: SettlementLayer.STELLAR,
        assetIn: d.assetIn,
        amountInCrypto: amountInCrypto.toFixed(18),
        amountInPaise: d.amountInPaise,
        quoteRateInrPerAsset: rate.toFixed(18),
        usdcAmount: usdcAmount.toFixed(18),
        networkFeePaise: BigInt(0),
        merchantSettlementPaise: d.amountInPaise,
        merchantUpiVpa: "chaipoint@upi",
        qrPayloadHash: sha256(qrPayload),
        stellarLedger: BigInt(52000000 + i * 1234),
        stellarTransactionHash: d.stellarHash,
        authorizedAt: now,
        completedAt: now,
        createdAt: now,
        expiresAt: new Date(now.getTime() + 30000),
        settlementInstruction: {
          create: {
            merchantId: merchant.id,
            amountPaise: d.amountInPaise,
            status: SettlementStatus.CONFIRMED,
            mockReference: `UPI_MOCK_${i + 1}_SETTLED`,
            attemptedAt: now,
            confirmedAt: now,
          },
        },
        events: {
          create: [
            { sequence: 1, status: TransactionStatus.CREATED,        eventType: "transaction.created",        createdAt: now },
            { sequence: 2, status: TransactionStatus.QUOTED,          eventType: "transaction.quoted",          createdAt: now },
            { sequence: 3, status: TransactionStatus.AUTHORIZED,      eventType: "transaction.authorized",      createdAt: now },
            { sequence: 4, status: TransactionStatus.CONVERTING,      eventType: "transaction.converting",      createdAt: now },
            { sequence: 5, status: TransactionStatus.ROUTING_STELLAR, eventType: "transaction.routing_stellar", createdAt: now },
            { sequence: 6, status: TransactionStatus.SETTLING,        eventType: "transaction.settling",        createdAt: now },
            { sequence: 7, status: TransactionStatus.REWARDING,       eventType: "transaction.rewarding",       createdAt: now },
            { sequence: 8, status: TransactionStatus.COMPLETED,       eventType: "transaction.completed",       createdAt: now },
          ],
        },
      },
    });

    createdTxIds.push(tx.id);
    console.log(`  ✅ Transaction ${i + 1}   → ${tx.publicId} | ₹${amountInr} | ${d.assetIn} | Hash: ${d.stellarHash.slice(0, 12)}...`);

    // ── Reward for this transaction ──────────────────────────────────────────
    await prisma.reward.upsert({
      where: {
        transactionId_reason: {
          transactionId: tx.id,
          reason: RewardReason.SPEND,
        },
      },
      update: {},
      create: {
        userId: user.id,
        transactionId: tx.id,
        campaignId: DEMO_CAMPAIGN_ID,
        reason: RewardReason.SPEND,
        status: RewardStatus.MINTED,
        starAmount: d.starReward,
        formulaVersion: "STAR_SPEND_V1",
        ruleSnapshot: {
          formula: "10 STAR per INR 100 spent",
          multiplier: 2,
          campaign: "Double Star Weekend",
          formulaVersion: "STAR_SPEND_V1",
        },
        stellarMintHash: d.starMint,
        mintedAt: now,
        createdAt: now,
      },
    });
    console.log(`  ⭐ Reward          → ${d.starReward} STAR minted (${d.starMint.slice(0, 20)}...)`);
  }

  // ─── 8. Extra reward events (CAMPAIGN and REFERRAL types) ─────────────────
  // Campaign bonus reward
  await prisma.reward.upsert({
    where: {
      transactionId_reason: {
        transactionId: createdTxIds[0],
        reason: RewardReason.CAMPAIGN,
      },
    },
    update: {},
    create: {
      userId: user.id,
      transactionId: createdTxIds[0],
      campaignId: DEMO_CAMPAIGN_ID,
      reason: RewardReason.CAMPAIGN,
      status: RewardStatus.MINTED,
      starAmount: BigInt(20),
      formulaVersion: "STAR_SPEND_V1",
      ruleSnapshot: {
        formula: "Campaign bonus: Double Star Weekend",
        campaign: "Double Star Weekend",
        campaignId: DEMO_CAMPAIGN_ID,
      },
      stellarMintHash: "CAMPAIGN_BONUS_MINT_001_ff6aa1bb2cc3dd4ee5",
      mintedAt: daysAgo(1),
      createdAt: daysAgo(1),
    },
  });
  console.log(`  ⭐ Campaign Bonus  → 20 STAR (campaign reward)`);

  // ─── 9. Summary ───────────────────────────────────────────────────────────
  const [totalTx, totalRewards, totalRewardStar] = await Promise.all([
    prisma.transaction.count({ where: { userId: DEMO_USER_ID } }),
    prisma.reward.count({ where: { userId: DEMO_USER_ID } }),
    prisma.reward.aggregate({
      _sum: { starAmount: true },
      where: { userId: DEMO_USER_ID, status: RewardStatus.MINTED },
    }),
  ]);

  const totalStar = totalRewardStar._sum.starAmount ?? 0n;

  console.log("\n🎉 Seeding complete!\n");
  console.log("─────────────────────────────────────────────");
  console.log(`  Demo User ID     : ${DEMO_USER_ID}`);
  console.log(`  Demo Merchant ID : ${DEMO_MERCHANT_ID}`);
  console.log(`  Demo Campaign ID : ${DEMO_CAMPAIGN_ID}`);
  console.log(`  Transactions     : ${totalTx}`);
  console.log(`  Reward Events    : ${totalRewards}`);
  console.log(`  Total STAR Minted: ${totalStar.toString()} STAR`);
  console.log("─────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
