import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerStorageService,
  ThrottlerException,
} from '@nestjs/throttler';
import { RampsController } from './ramps.controller';

/**
 * R4 — proves the per-route rate limit on ramp INITIATION actually triggers.
 *
 * We drive the REAL ThrottlerGuard against the REAL RampsController.initiateOnRamp
 * handler (so the @Throttle({ limit: 5, ttl: 60000 }) metadata is read exactly as
 * in production) backed by the real in-memory ThrottlerStorageService. The global
 * default (100/min) is also configured to prove the tighter route limit is what
 * bites first.
 *
 * fail-before/pass-after: before the @Throttle decorator existed, the 6th call
 * returned true (allowed). With the decorator, the 6th call throws.
 */
describe('RampsController rate limiting (R4)', () => {
  const ROUTE_LIMIT = 5;

  // ThrottlerStorageService schedules a real ttl-length timeout per key to expire
  // records; fake timers stop those from keeping the jest process alive after the
  // run. We never need them to fire (every assertion is within the ttl window).
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function makeGuard() {
    // Mirror app.module.ts global config so the guard resolves a "default" throttler.
    const options = [{ ttl: 60000, limit: 100 }];
    const storage = new ThrottlerStorageService();
    const reflector = new Reflector();
    const guard = new ThrottlerGuard(options as any, storage, reflector);
    // onModuleInit builds the internal throttler list from options.
    return guard.onModuleInit().then(() => ({ guard, storage }));
  }

  function contextFor(handlerName: 'initiateOnRamp' | 'initiateOffRamp' | 'getRamp', ip: string): ExecutionContext {
    const handler = (RampsController.prototype as any)[handlerName];
    const req: any = { ip, ips: [], headers: {}, method: 'POST', url: `/ramps/${handlerName}` };
    const res: any = { header: () => undefined, setHeader: () => undefined };
    return {
      switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
      getHandler: () => handler,
      getClass: () => RampsController,
    } as unknown as ExecutionContext;
  }

  it('allows up to the route limit then throws ThrottlerException on the next call', async () => {
    const { guard } = await makeGuard();
    const ctx = contextFor('initiateOnRamp', '203.0.113.1');

    // First ROUTE_LIMIT calls are allowed.
    for (let i = 0; i < ROUTE_LIMIT; i++) {
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    }
    // The next one trips the limiter.
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ThrottlerException);
  });

  it('tracks limits per client (a different IP is unaffected)', async () => {
    const { guard } = await makeGuard();
    const a = contextFor('initiateOnRamp', '203.0.113.2');
    const b = contextFor('initiateOnRamp', '203.0.113.3');

    for (let i = 0; i < ROUTE_LIMIT; i++) await guard.canActivate(a);
    await expect(guard.canActivate(a)).rejects.toBeInstanceOf(ThrottlerException);
    // b has its own budget.
    await expect(guard.canActivate(b)).resolves.toBe(true);
  });

  it('applies the strict 5/min limit to off-ramp too', async () => {
    const { guard } = await makeGuard();
    const ctx = contextFor('initiateOffRamp', '203.0.113.4');
    for (let i = 0; i < ROUTE_LIMIT; i++) await guard.canActivate(ctx);
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ThrottlerException);
  });
});
