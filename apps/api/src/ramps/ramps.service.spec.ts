import { RampsService } from './ramps.service';
import { RampProviderRegistry } from './providers/ramp-provider.registry';
import { FiatRampProvider } from './providers/fiat-ramp-provider.interface';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

function makeProvider(over: Partial<FiatRampProvider> = {}): FiatRampProvider {
  return {
    id: 'MONEYGRAM' as any,
    supportsOnRamp: () => true,
    supportsOffRamp: () => true,
    supportsStatusCallback: () => false,
    authenticate: jest.fn(async () => 'session-jwt'),
    initiateOnRamp: jest.fn(async () => ({ providerTxId: 'ptx-1', interactiveUrl: 'https://mg/interactive' })),
    initiateOffRamp: jest.fn(async () => ({ providerTxId: 'ptx-2', interactiveUrl: 'https://mg/interactive' })),
    getStatus: jest.fn(),
    ...over,
  };
}

describe('RampsService', () => {
  let prisma: any;
  let registry: RampProviderRegistry;
  let service: RampsService;
  let kyc: { getStatus: jest.Mock };

  beforeEach(() => {
    let seq = 0;
    prisma = {
      rampTransaction: {
        create: jest.fn(async ({ data }: any) => ({ id: 'ramp-1', ...data })),
        update: jest.fn(async ({ data }: any) => ({ id: 'ramp-1', publicId: 'ONRAMP_X', provider: 'MONEYGRAM', type: 'ONRAMP', status: data.status ?? 'PENDING_USER_TRANSFER', interactiveUrl: data.interactiveUrl ?? 'https://mg/interactive', providerTxId: data.providerTxId ?? 'ptx-1' })),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      rampTransactionEvent: {
        findFirst: jest.fn(async () => ({ sequence: seq })),
        create: jest.fn(async () => { seq++; return {}; }),
      },
      $transaction: jest.fn(async (arr: any[]) => Promise.all(arr)),
    };
    registry = new RampProviderRegistry([makeProvider()]);
    // KYC gate: VERIFIED by default so the happy-path tests pass; individual
    // tests override getStatus to exercise the blocked path.
    kyc = { getStatus: jest.fn(async () => ({ kycStatus: 'VERIFIED', kycReference: null, kycVerifiedAt: new Date(0) })) };
    service = new RampsService(prisma, registry, kyc as any);
  });

  it('lists providers with capabilities', () => {
    expect(service.listProviders()).toEqual([
      { id: 'MONEYGRAM', supportsOnRamp: true, supportsOffRamp: true, supportsStatusCallback: false },
    ]);
  });

  it('persists a ramp record BEFORE calling the provider (durable audit)', async () => {
    await service.initiateOnRamp({
      userId: 'u1',
      providerId: 'MONEYGRAM',
      userStellarAddress: 'GABC',
    });
    // created first (INITIATED), then updated to PENDING_USER_TRANSFER
    expect(prisma.rampTransaction.create).toHaveBeenCalledTimes(1);
    expect(prisma.rampTransaction.create.mock.calls[0][0].data.status).toBe('INITIATED');
    expect(prisma.rampTransaction.update).toHaveBeenCalled();
  });

  it('rejects off-ramp without an amount', async () => {
    await expect(
      service.initiateOffRamp({ userId: 'u1', providerId: 'MONEYGRAM', userStellarAddress: 'GABC' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('marks the ramp ERROR and records an event when the provider fails', async () => {
    registry = new RampProviderRegistry([
      makeProvider({ authenticate: jest.fn(async () => { throw new Error('anchor down'); }) }),
    ]);
    service = new RampsService(prisma, registry, kyc as any);
    await expect(
      service.initiateOnRamp({ userId: 'u1', providerId: 'MONEYGRAM', userStellarAddress: 'GABC' }),
    ).rejects.toThrow('anchor down');
    const errorUpdate = prisma.rampTransaction.update.mock.calls.find((c: any) => c[0].data.status === 'ERROR');
    expect(errorUpdate).toBeTruthy();
  });

  // R2 — KYC gate. A ramp may only be started by a VERIFIED user; the check is
  // server-side and runs BEFORE any RampTransaction row is created.
  it.each(['NONE', 'PENDING', 'REJECTED'])(
    'blocks a %s user from starting a ramp (no record created)',
    async (status) => {
      kyc.getStatus.mockResolvedValueOnce({ kycStatus: status, kycReference: null, kycVerifiedAt: null });
      await expect(
        service.initiateOnRamp({ userId: 'u1', providerId: 'MONEYGRAM', userStellarAddress: 'GABC' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      // gate ran before persistence
      expect(prisma.rampTransaction.create).not.toHaveBeenCalled();
    },
  );

  it('allows a VERIFIED user to start a ramp', async () => {
    kyc.getStatus.mockResolvedValueOnce({ kycStatus: 'VERIFIED', kycReference: null, kycVerifiedAt: new Date(0) });
    const res = await service.initiateOnRamp({ userId: 'u1', providerId: 'MONEYGRAM', userStellarAddress: 'GABC' });
    expect(res.status).toBe('PENDING_USER_TRANSFER');
    expect(prisma.rampTransaction.create).toHaveBeenCalledTimes(1);
  });

  it('applyStatus only writes status change once and is idempotent on no-change', async () => {
    prisma.rampTransaction.update.mockClear();
    prisma.rampTransactionEvent.create.mockClear();
    // same status -> no status_changed event
    await service.applyStatus('ramp-1', 'PENDING_ANCHOR' as any, { status: 'PENDING_ANCHOR', rawStatus: 'pending_anchor' } as any, 'poller');
    const changeEvents = prisma.rampTransactionEvent.create.mock.calls.filter(
      (c: any) => c[0].data.eventType === 'ramp.status_changed',
    );
    expect(changeEvents.length).toBe(0);
  });
});
