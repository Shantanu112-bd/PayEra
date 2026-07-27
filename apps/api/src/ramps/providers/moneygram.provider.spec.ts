import { MoneyGramProvider } from './moneygram.provider';

// A valid-format Stellar testnet secret key (deterministic test fixture,
// not tied to any real account).
const TEST_SECRET = 'SDW3W2GX7VZ6X7ITPXQPKZ7Q3H2XPJ3W3TN4EJ4VXQ3T7DWZ7Y5QK2A';

describe('MoneyGramProvider', () => {
  let provider: MoneyGramProvider;
  const realFetch = global.fetch;

  beforeEach(() => {
    process.env.STELLAR_NETWORK = 'testnet';
    // Real, well-formed testnet secret so Keypair.fromSecret succeeds.
    process.env.PLATFORM_STELLAR_SECRET_KEY =
      'SBFGFF27Y64ZUGFAIG5AMJGQODZZKV2YQKAVUUN4HNE2ZPSEGCHNGJ3O';
    process.env.MONEYGRAM_HOME_DOMAIN = 'testanchor.stellar.org';
    provider = new MoneyGramProvider();
  });

  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  it('advertises capabilities honestly (no undocumented webhook)', () => {
    expect(provider.id).toBe('MONEYGRAM');
    expect(provider.supportsOnRamp()).toBe(true);
    expect(provider.supportsOffRamp()).toBe(true);
    // MoneyGram docs are poll-only.
    expect(provider.supportsStatusCallback()).toBe(false);
  });

  it('maps SEP-24 native statuses to the neutral vocabulary', () => {
    const map = (raw: string) => (provider as any).mapStatus(raw);
    expect(map('pending_user_transfer_start')).toBe('PENDING_USER_TRANSFER');
    expect(map('pending_anchor')).toBe('PENDING_ANCHOR');
    expect(map('pending_stellar')).toBe('PENDING_STELLAR');
    expect(map('completed')).toBe('COMPLETED');
    expect(map('refunded')).toBe('REFUNDED');
    expect(map('expired')).toBe('EXPIRED');
    expect(map('error')).toBe('ERROR');
    expect(map('some_unknown_status')).toBe('ERROR');
  });

  it('parses status response and surfaces cash-pickup reference', async () => {
    const tomlBody = [
      'TRANSFER_SERVER_SEP0024="https://anchor.example/sep24"',
      'WEB_AUTH_ENDPOINT="https://anchor.example/auth"',
    ].join('\n');

    global.fetch = jest.fn(async (url: any) => {
      if (String(url).endsWith('stellar.toml')) {
        return { ok: true, text: async () => tomlBody } as any;
      }
      // /transaction?id=...
      return {
        ok: true,
        json: async () => ({
          transaction: {
            status: 'completed',
            amount_in: '10',
            amount_out: '9.5',
            amount_fee: '0.5',
            external_transaction_id: 'REF12345',
            stellar_transaction_id: 'abc123',
          },
        }),
      } as any;
    }) as any;

    const result = await provider.getStatus('jwt-token', 'tx-1');
    expect(result.status).toBe('COMPLETED');
    expect(result.rawStatus).toBe('completed');
    expect(result.amountOut).toBe('9.5');
    expect(result.referenceNumber).toBe('REF12345');
    expect(result.stellarTxHash).toBe('abc123');
  });

  it('throws a typed error when the anchor toml is unreachable', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 503, text: async () => 'down' }) as any) as any;
    await expect(provider.getStatus('jwt', 'tx')).rejects.toMatchObject({ name: 'Sep24AnchorError' });
  });
});
