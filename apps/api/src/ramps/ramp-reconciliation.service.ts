import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RampsService } from './ramps.service';
import { RampStatus } from '../generated/prisma';

/**
 * Reconciliation poller for pending ramps.
 *
 * This is the OFFICIALLY-SUPPORTED mechanism for MoneyGram status updates:
 * MoneyGram documents polling (`pending_user_transfer_start` -> ... ->
 * `completed`), NOT webhooks. Rather than fabricate a webhook, we poll the
 * provider's status endpoint for every non-terminal ramp on a fixed cadence.
 * If a provider later documents callback support, the callback path can update
 * the same records via RampsService.applyStatus and shorten the polling need.
 */
@Injectable()
export class RampReconciliationService {
  private readonly logger = new Logger(RampReconciliationService.name);
  // Stop polling a ramp after this age to bound work; it can still be
  // refreshed on-demand when the user opens it.
  private readonly maxAgeMs = 1000 * 60 * 60 * 24; // 24h

  constructor(
    private readonly prisma: PrismaService,
    private readonly rampsService: RampsService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async reconcilePending(): Promise<void> {
    const cutoff = new Date(Date.now() - this.maxAgeMs);
    const pending = await this.prisma.rampTransaction.findMany({
      where: {
        status: {
          in: [
            RampStatus.PENDING_USER_TRANSFER,
            RampStatus.PENDING_ANCHOR,
            RampStatus.PENDING_STELLAR,
            RampStatus.PENDING_EXTERNAL,
          ],
        },
        providerTxId: { not: null },
        createdAt: { gte: cutoff },
      },
      orderBy: { lastPolledAt: { sort: 'asc', nulls: 'first' } },
      take: 20,
    });

    if (pending.length === 0) return;

    for (const ramp of pending) {
      try {
        await this.rampsService.refreshStatus(ramp.id);
      } catch (err) {
        // A single provider/network failure must not kill the batch.
        this.logger.warn(
          `Reconcile failed for ${ramp.publicId}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }
}
