import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { StellarService } from '../stellar/stellar.service';
import { RewardStatus, TransactionStatus } from '../generated/prisma';
import { SorobanService } from '../stellar/soroban.service';

@Injectable()
export class TransactionProcessorService {
  private readonly logger = new Logger(TransactionProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stellarService: StellarService,
    private readonly sorobanService: SorobanService,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handlePendingTransactions() {
    // Atomically claim one transaction at a time by updating status first
    // Only process if we successfully moved it from CREATED to AUTHORIZED
    const claimed = await this.prisma.transaction.updateMany({
      where: {
        status: TransactionStatus.CREATED,
        expiresAt: { gt: new Date() },
      },
      data: {
        status: TransactionStatus.AUTHORIZED,
        authorizedAt: new Date(),
      },
    });

    if (claimed.count === 0) return;

    // Now fetch the transactions we just claimed
    const transactions = await this.prisma.transaction.findMany({
      where: {
        status: TransactionStatus.AUTHORIZED,
        authorizedAt: { gte: new Date(Date.now() - 6000) },
      },
      take: 10,
    });

    for (const tx of transactions) {
      await this.processTransactionWithRetry(tx);
    }
  }
  private async processTransactionWithRetry(tx: any, attempt = 1): Promise<void> {
    const MAX_ATTEMPTS = 3;
    const BACKOFF_MS = [0, 2000, 8000];

    try {
      await this.processTransaction(tx, attempt);
    } catch (error: any) {
      this.logger.warn(`Transaction ${tx.id} failed on attempt ${attempt}: ${error.message}`);

      if (attempt < MAX_ATTEMPTS) {
        const delay = BACKOFF_MS[attempt] || 8000;
        this.logger.log(`Retrying transaction ${tx.id} in ${delay}ms (attempt ${attempt + 1}/${MAX_ATTEMPTS})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.processTransactionWithRetry(tx, attempt + 1);
      }

      this.logger.error(`Transaction ${tx.id} permanently failed after ${MAX_ATTEMPTS} attempts`);
      
      const metadata = tx.metadata && typeof tx.metadata === 'object' ? tx.metadata : {};
      
      await this.prisma.transaction.update({
        where: { id: tx.id },
        data: {
          status: TransactionStatus.FAILED,
          failureCode: 'MAX_RETRIES_EXCEEDED',
          failureMessage: `Failed after ${MAX_ATTEMPTS} attempts. Last error: ${error.message}`,
          metadata: { ...metadata, retryAttempts: attempt },
        },
      });
    }
  }

  private async processTransaction(tx: any, attempt: number) {
    this.logger.log(`Processing transaction ${tx.id} with status ${tx.status}`);

    try {
      if (tx.status === TransactionStatus.CREATED) {
        await this.updateStatus(tx.id, TransactionStatus.AUTHORIZED);
      }

      await this.updateStatus(tx.id, TransactionStatus.ROUTING_STELLAR);

      const { hash, ledger } = await this.stellarService.submitPayment({
        transactionPublicId: tx.publicId,
        assetCode: tx.assetIn,
        amountCrypto: tx.amountInCrypto?.toString() || '0.0000001',
      });

      await this.prisma.transaction.update({
        where: { id: tx.id },
        data: {
          status: TransactionStatus.SETTLING,
          stellarTransactionHash: hash,
        },
      });
      await this.logEvent(tx.id, TransactionStatus.SETTLING);

      // Fetch pending rewards with user wallet info
      const pendingRewards = await this.prisma.reward.findMany({
        where: {
          transactionId: tx.id,
          status: { in: ['PENDING'] },
        },
        include: {
          user: {
            include: {
              wallets: {
                where: {
                  isPrimary: true,
                  status: 'ACTIVE',
                },
                take: 1,
              },
            },
          },
        },
      })

      for (const reward of pendingRewards) {
        const walletAddress = reward.user?.wallets?.[0]?.address

        if (walletAddress) {
          try {
            // Mint STAR tokens on-chain via Soroban
            const mintResult = await this.sorobanService
              .issueStarReward({
                rewardId: reward.id,
                userId: reward.userId,
                userWalletAddress: walletAddress,
                starAmount: BigInt(reward.starAmount),
              })

            await this.prisma.reward.update({
              where: { id: reward.id },
              data: {
                status: 'MINTED',
                mintedAt: new Date(),
                stellarMintHash: mintResult.hash,
              },
            })

            this.logger.log(
              `✓ STAR minted on-chain: ${reward.starAmount} ` +
              `STAR to ${walletAddress.substring(0, 8)}... ` +
              `hash: ${mintResult.hash}`
            )
          } catch (error) {
            // CRITICAL: on-chain mint failure MUST NOT fail payment
            // Payment is complete. Only reward minting failed.
            this.logger.error(
              `STAR on-chain mint failed for reward ` +
              `${reward.id}: ${error}`
            )
            await this.prisma.reward.update({
              where: { id: reward.id },
              data: {
                status: 'FAILED',
                stellarMintHash: null,
              },
            })
          }
        } else {
          // User has no active wallet — DB record only
          this.logger.warn(
            `No active wallet for user ${reward.userId} ` +
            `— recording reward in DB only`
          )
          await this.prisma.reward.update({
            where: { id: reward.id },
            data: {
              status: 'MINTED',
              mintedAt: new Date(),
              stellarMintHash: `db-only-no-wallet-${reward.id}`,
            },
          })
        }
      }

      await this.prisma.settlementInstruction.updateMany({
        where: { transactionId: tx.id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          mockReference: hash,
        },
      });

      await this.updateStatus(tx.id, TransactionStatus.COMPLETED);

      await this.prisma.adminLog.create({
        data: {
          actorUserId: null,
          action: 'TRANSACTION_COMPLETED',
          targetType: 'TRANSACTION',
          targetId: tx.id,
          metadata: {
            stellarHash: hash,
            ledger,
            processorAttempt: attempt,
          } as any,
        },
      })
      
      this.logger.log(`Transaction ${tx.id} completed successfully. Stellar Hash: ${hash}`);

    } catch (error: any) {
      await this.updateStatus(
        tx.id, 
        TransactionStatus.FAILED, 
        'STELLAR_ERROR', 
        error.message || 'Unknown error during Stellar routing'
      );
    }
  }

  private async updateStatus(
    transactionId: string, 
    status: TransactionStatus, 
    failureCode?: string, 
    failureMessage?: string
  ) {
    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status,
        ...(status === TransactionStatus.COMPLETED ? { completedAt: new Date() } : {}),
        ...(failureCode !== undefined ? { failureCode } : {}),
        ...(failureMessage !== undefined ? { failureMessage } : {})
      },
    });
    
    const payload = failureCode ? { failureCode, failureMessage } : undefined;
    await this.logEvent(transactionId, status, payload);
  }

  private async logEvent(transactionId: string, status: TransactionStatus, payload?: any) {
    const maxEvent = await this.prisma.transactionEvent.aggregate({
      _max: { sequence: true },
      where: { transactionId },
    });
    const sequence = (maxEvent._max.sequence ?? 0) + 1;

    await this.prisma.transactionEvent.create({
      data: {
        transactionId,
        status,
        sequence,
        eventType: `transaction.${status.toLowerCase()}`,
        payload: payload || {},
      },
    });
  }
}
