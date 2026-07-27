import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KycService } from '../kyc/kyc.service';
import { createReadableId } from '../common/utils/ids';
import { RampProviderRegistry } from './providers/ramp-provider.registry';
import {
  FiatRampProvider,
  NormalizedRampStatus,
  RampStatusResult,
} from './providers/fiat-ramp-provider.interface';
import { RampProvider, RampStatus, RampType, KycStatus, Prisma } from '../generated/prisma';

interface InitiateArgs {
  userId: string;
  providerId: string;
  userStellarAddress: string;
  amount?: string | undefined;
  assetCode?: string | undefined;
}

/**
 * Orchestrates fiat on/off-ramps across ANY registered provider. Owns
 * persistence (RampTransaction), the append-only audit trail
 * (RampTransactionEvent), retry, and logging. Contains ZERO provider-specific
 * logic — everything provider-specific lives behind FiatRampProvider.
 */
@Injectable()
export class RampsService {
  private readonly logger = new Logger(RampsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: RampProviderRegistry,
    private readonly kyc: KycService,
  ) {}

  /** Providers + capabilities, for the client to render available options. */
  listProviders() {
    return this.registry.list().map((id) => {
      const p = this.registry.get(id);
      return {
        id,
        supportsOnRamp: p.supportsOnRamp(),
        supportsOffRamp: p.supportsOffRamp(),
        supportsStatusCallback: p.supportsStatusCallback(),
      };
    });
  }

  async initiateOnRamp(args: InitiateArgs) {
    await this.assertKycVerified(args.userId);
    const provider = this.registry.get(args.providerId);
    if (!provider.supportsOnRamp()) {
      throw new BadRequestException(`Provider ${args.providerId} does not support on-ramp`);
    }
    return this.initiate(RampType.ONRAMP, provider, args);
  }

  async initiateOffRamp(args: InitiateArgs) {
    await this.assertKycVerified(args.userId);
    const provider = this.registry.get(args.providerId);
    if (!provider.supportsOffRamp()) {
      throw new BadRequestException(`Provider ${args.providerId} does not support off-ramp`);
    }
    if (!args.amount) {
      throw new BadRequestException('Off-ramp requires an amount');
    }
    return this.initiate(RampType.OFFRAMP, provider, args);
  }

  /**
   * Server-side KYC gate. A ramp (money moving to/from the fiat rails) may only
   * be initiated by a fully VERIFIED user. NONE (never started), PENDING (in
   * review) and REJECTED are all refused. Enforced here — never client-side —
   * and BEFORE any RampTransaction row is created, so a blocked attempt leaves
   * no orphaned record.
   */
  private async assertKycVerified(userId: string): Promise<void> {
    const { kycStatus } = await this.kyc.getStatus(userId);
    if (kycStatus !== KycStatus.VERIFIED) {
      throw new ForbiddenException(
        `KYC verification required to use fiat ramps (current status: ${kycStatus})`,
      );
    }
  }

  private async initiate(type: RampType, provider: FiatRampProvider, args: InitiateArgs) {
    // 1. Create the durable record FIRST (INITIATED) so we never lose a ramp
    //    even if the provider call fails mid-flight — the audit trail is the
    //    source of truth (avoids the previously-orphaned-module problem).
    const ramp = await this.prisma.rampTransaction.create({
      data: {
        publicId: createReadableId(type === RampType.ONRAMP ? 'ONRAMP' : 'OFFRAMP'),
        userId: args.userId,
        provider: provider.id as RampProvider,
        type,
        status: RampStatus.INITIATED,
        userStellarAddress: args.userStellarAddress,
        assetCode: args.assetCode || 'USDC',
        amountIn: args.amount ?? null,
      },
    });
    await this.appendEvent(ramp.id, RampStatus.INITIATED, 'ramp.created', 'system', {
      type,
      provider: provider.id,
    });

    try {
      // 2. SEP-10 auth (server-side, using the platform signer). The provider
      //    session token is NEVER persisted or returned to the client.
      const sessionToken = await this.withRetry(
        () => provider.authenticate({ userStellarAddress: args.userStellarAddress }),
        `authenticate:${ramp.publicId}`,
      );

      // 3. SEP-24 interactive initiation.
      const params = {
        userStellarAddress: args.userStellarAddress,
        amount: args.amount,
        assetCode: args.assetCode,
      };
      const result = await this.withRetry(
        () =>
          type === RampType.ONRAMP
            ? provider.initiateOnRamp(sessionToken, params)
            : provider.initiateOffRamp(sessionToken, params),
        `initiate:${ramp.publicId}`,
      );

      const updated = await this.prisma.rampTransaction.update({
        where: { id: ramp.id },
        data: {
          providerTxId: result.providerTxId,
          interactiveUrl: result.interactiveUrl,
          status: RampStatus.PENDING_USER_TRANSFER,
        },
      });
      await this.appendEvent(ramp.id, RampStatus.PENDING_USER_TRANSFER, 'ramp.initiated', 'system', {
        providerTxId: result.providerTxId,
      });

      return {
        id: updated.publicId,
        provider: updated.provider,
        type: updated.type,
        status: updated.status,
        interactiveUrl: updated.interactiveUrl,
        providerTxId: updated.providerTxId,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      await this.prisma.rampTransaction.update({
        where: { id: ramp.id },
        data: { status: RampStatus.ERROR, failureCode: 'INITIATION_FAILED', failureMessage: message },
      });
      await this.appendEvent(ramp.id, RampStatus.ERROR, 'ramp.initiation_failed', 'system', { message });
      this.logger.error(`Ramp ${ramp.publicId} initiation failed: ${message}`);
      throw err;
    }
  }

  /** Fetch a ramp (by public id) for the owning user. */
  async getRamp(userId: string, publicId: string) {
    const ramp = await this.prisma.rampTransaction.findFirst({
      where: { publicId, userId },
    });
    if (!ramp) throw new NotFoundException('Ramp transaction not found');
    return this.serialize(ramp);
  }

  /** Paginated ramp history for a user. */
  async listRamps(userId: string, page = 1, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.rampTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.rampTransaction.count({ where: { userId } }),
    ]);
    return {
      items: items.map((r) => this.serialize(r)),
      meta: { page: Math.max(page, 1), limit: take, total, pageCount: Math.ceil(total / take) },
    };
  }

  /**
   * Refresh a single ramp's status from its provider and persist any change.
   * Used by both the reconciliation poller and on-demand status reads.
   * Idempotent: a no-op if the status is unchanged or already terminal.
   */
  async refreshStatus(rampId: string): Promise<RampStatus> {
    const ramp = await this.prisma.rampTransaction.findUnique({ where: { id: rampId } });
    if (!ramp) throw new NotFoundException('Ramp transaction not found');
    if (this.isTerminal(ramp.status)) return ramp.status;
    if (!ramp.providerTxId) return ramp.status;

    const provider = this.registry.get(ramp.provider);
    const sessionToken = await provider.authenticate({ userStellarAddress: ramp.userStellarAddress });
    const result = await provider.getStatus(sessionToken, ramp.providerTxId);
    return this.applyStatus(ramp.id, ramp.status, result, 'poller');
  }

  /**
   * Apply a provider status result to a ramp. Shared by refreshStatus and the
   * defensive callback ingress. Only writes when something actually changed.
   */
  async applyStatus(
    rampId: string,
    previousStatus: RampStatus,
    result: RampStatusResult,
    source: 'poller' | 'callback' | 'system',
  ): Promise<RampStatus> {
    const nextStatus = result.status as RampStatus;
    const data: Prisma.RampTransactionUpdateInput = { lastPolledAt: new Date() };
    if (result.amountIn !== undefined) data.amountIn = result.amountIn;
    if (result.amountOut !== undefined) data.amountOut = result.amountOut;
    if (result.amountFee !== undefined) data.amountFee = result.amountFee;
    if (result.referenceNumber !== undefined) data.referenceNumber = result.referenceNumber;
    if (result.stellarMemo !== undefined) data.stellarMemo = result.stellarMemo;
    if (result.stellarMemoType !== undefined) data.stellarMemoType = result.stellarMemoType;
    if (result.anchorAccount !== undefined) data.anchorAccount = result.anchorAccount;
    if (result.stellarTxHash !== undefined) data.stellarTxHash = result.stellarTxHash;

    const changed = nextStatus !== previousStatus;
    if (changed) {
      data.status = nextStatus;
      if (nextStatus === RampStatus.COMPLETED) data.completedAt = new Date();
      if (nextStatus === RampStatus.ERROR) {
        data.failureCode = 'PROVIDER_ERROR';
        data.failureMessage = `Provider reported status "${result.rawStatus}"`;
      }
    }

    await this.prisma.rampTransaction.update({ where: { id: rampId }, data });

    if (changed) {
      await this.appendEvent(rampId, nextStatus, 'ramp.status_changed', source, {
        from: previousStatus,
        to: nextStatus,
        rawStatus: result.rawStatus,
      });
      this.logger.log(`Ramp ${rampId} ${previousStatus} -> ${nextStatus} (${source})`);
    }
    return nextStatus;
  }

  private isTerminal(status: RampStatus): boolean {
    return (
      status === RampStatus.COMPLETED ||
      status === RampStatus.REFUNDED ||
      status === RampStatus.EXPIRED ||
      status === RampStatus.ERROR
    );
  }

  /** Append to the ordered, append-only audit trail for a ramp. */
  private async appendEvent(
    rampTransactionId: string,
    status: RampStatus | null,
    eventType: string,
    source: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const last = await this.prisma.rampTransactionEvent.findFirst({
      where: { rampTransactionId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });
    await this.prisma.rampTransactionEvent.create({
      data: {
        rampTransactionId,
        sequence: (last?.sequence ?? 0) + 1,
        status,
        eventType,
        source,
        payload: payload as Prisma.InputJsonValue,
      },
    });
  }

  /** Bounded retry with backoff for transient provider/network failures. */
  private async withRetry<T>(fn: () => Promise<T>, label: string, maxAttempts = 3): Promise<T> {
    const backoff = [0, 500, 2000];
    let lastErr: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (backoff[attempt]) await new Promise((r) => setTimeout(r, backoff[attempt]));
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        this.logger.warn(`${label} attempt ${attempt + 1}/${maxAttempts} failed: ${err instanceof Error ? err.message : err}`);
      }
    }
    throw lastErr;
  }

  private serialize(r: {
    publicId: string;
    provider: RampProvider;
    type: RampType;
    status: RampStatus;
    userStellarAddress: string;
    assetCode: string;
    amountIn: string | null;
    amountOut: string | null;
    amountFee: string | null;
    interactiveUrl: string | null;
    referenceNumber: string | null;
    stellarMemo: string | null;
    anchorAccount: string | null;
    stellarTxHash: string | null;
    failureMessage: string | null;
    createdAt: Date;
    completedAt: Date | null;
  }) {
    return {
      id: r.publicId,
      provider: r.provider,
      type: r.type,
      status: r.status,
      userStellarAddress: r.userStellarAddress,
      assetCode: r.assetCode,
      amountIn: r.amountIn,
      amountOut: r.amountOut,
      amountFee: r.amountFee,
      interactiveUrl: r.interactiveUrl,
      referenceNumber: r.referenceNumber,
      stellarMemo: r.stellarMemo,
      anchorAccount: r.anchorAccount,
      stellarTxHash: r.stellarTxHash,
      failureMessage: r.failureMessage,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
    };
  }
}
