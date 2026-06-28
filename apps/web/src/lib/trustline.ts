import { Horizon } from '@stellar/stellar-sdk'

const server = new Horizon.Server(
  process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'
)

export async function hasUsdcTrustline(publicKey: string): Promise<boolean> {
  try {
    const account = await server.loadAccount(publicKey)
    return account.balances.some(
      (b) =>
        b.asset_type === 'credit_alphanum4' &&
        b.asset_code === 'USDC' &&
        b.asset_issuer === (process.env.NEXT_PUBLIC_USDC_ISSUER || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5')
    )
  } catch {
    return false
  }
}

export async function addUsdcTrustline(publicKey: string): Promise<string> {
  // Return XDR of trustline transaction for user to sign with Freighter
  const account = await server.loadAccount(publicKey)
  const { TransactionBuilder, BASE_FEE, Networks, Operation, Asset } = await import('@stellar/stellar-sdk')
  
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.changeTrust({
      asset: new Asset(
        'USDC',
        process.env.NEXT_PUBLIC_USDC_ISSUER || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
      ),
    }))
    .setTimeout(30)
    .build()

  return tx.toXDR()
}
