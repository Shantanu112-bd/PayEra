import { RampProviderRegistry } from './ramp-provider.registry';
import { FiatRampProvider } from './fiat-ramp-provider.interface';
import { NotFoundException } from '@nestjs/common';

function fakeProvider(id: string): FiatRampProvider {
  return {
    id: id as any,
    supportsOnRamp: () => true,
    supportsOffRamp: () => true,
    supportsStatusCallback: () => false,
    authenticate: jest.fn(),
    initiateOnRamp: jest.fn(),
    initiateOffRamp: jest.fn(),
    getStatus: jest.fn(),
  };
}

describe('RampProviderRegistry', () => {
  it('registers and resolves providers by id', () => {
    const reg = new RampProviderRegistry([fakeProvider('MONEYGRAM')]);
    expect(reg.list()).toEqual(['MONEYGRAM']);
    expect(reg.has('MONEYGRAM')).toBe(true);
    expect(reg.get('MONEYGRAM').id).toBe('MONEYGRAM');
  });

  it('throws NotFound for unknown provider', () => {
    const reg = new RampProviderRegistry([fakeProvider('MONEYGRAM')]);
    expect(() => reg.get('TRANSAK')).toThrow(NotFoundException);
  });

  it('rejects duplicate provider ids', () => {
    expect(() => new RampProviderRegistry([fakeProvider('MONEYGRAM'), fakeProvider('MONEYGRAM')])).toThrow(
      /Duplicate ramp provider/,
    );
  });
});
