import { Horizon, Asset } from '@stellar/stellar-sdk'

const server = new Horizon.Server(
  process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'
)

export interface WalletBalances {
  xlm: string
  usdc: string
}

export async function getWalletBalances(publicKey: string): Promise<WalletBalances> {
  try {
    const account = await server.loadAccount(publicKey)
    
    let xlm = '0'
    let usdc = '0'

    for (const balance of account.balances) {
      if (balance.asset_type === 'native') {
        xlm = parseFloat(balance.balance).toFixed(4)
      }
      if (
        balance.asset_type === 'credit_alphanum4' &&
        balance.asset_code === 'USDC'
      ) {
        usdc = parseFloat(balance.balance).toFixed(2)
      }
    }

    return { xlm, usdc }
  } catch {
    return { xlm: '0', usdc: '0' }
  }
}
