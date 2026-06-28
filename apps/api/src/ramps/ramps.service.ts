import { Injectable, Logger } from '@nestjs/common'
import { Horizon, Networks, Keypair, Transaction } from '@stellar/stellar-sdk'

@Injectable()
export class RampsService {
  private readonly logger = new Logger(RampsService.name)
  private readonly horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'
  private readonly moneygramDomain = process.env.MONEYGRAM_HOME_DOMAIN || 'api.stellar.moneygram.com'
  private readonly networkPassphrase = Networks.TESTNET
  
  private get platformKeypair(): Keypair {
    const secretKey = process.env.PLATFORM_STELLAR_SECRET_KEY
    if (!secretKey) {
      this.logger.warn('PLATFORM_STELLAR_SECRET_KEY is not defined. Using a randomly generated keypair. Real transactions will fail!')
      return Keypair.random()
    }
    return Keypair.fromSecret(secretKey)
  }

  /**
   * Step 1: Fetch MoneyGram's stellar.toml to get SEP-24 endpoint
   */
  async getMoneygramToml(): Promise<{
    transferServerUrl: string
    webAuthEndpoint: string
  }> {
    const tomlUrl = `https://${this.moneygramDomain}/.well-known/stellar.toml`
    const response = await fetch(tomlUrl)
    const tomlText = await response.text()

    // Parse TRANSFER_SERVER_SEP0024 and WEB_AUTH_ENDPOINT from TOML
    const transferMatch = tomlText.match(/TRANSFER_SERVER_SEP0024\s*=\s*"([^"]+)"/)
    const authMatch = tomlText.match(/WEB_AUTH_ENDPOINT\s*=\s*"([^"]+)"/)

    return {
      transferServerUrl: transferMatch?.[1] || `https://${this.moneygramDomain}/sep24`,
      webAuthEndpoint: authMatch?.[1] || `https://${this.moneygramDomain}/sep10`,
    }
  }

  /**
   * Step 2: SEP-10 Authentication
   * Get challenge transaction from MoneyGram, sign it with platform key
   * Returns JWT token for SEP-24 calls
   */
  async authenticateSep10(userPublicKey: string): Promise<string> {
    const { webAuthEndpoint } = await this.getMoneygramToml()

    // Get challenge from MoneyGram
    const challengeRes = await fetch(
      `${webAuthEndpoint}?account=${userPublicKey}&home_domain=${process.env.NEXT_PUBLIC_APP_DOMAIN}`
    )
    const challengeData = await challengeRes.json() as {
      transaction: string
      network_passphrase: string
    }

    // Parse and sign the challenge transaction with platform signing key
    const tx = new Transaction(challengeData.transaction, this.networkPassphrase)
    tx.sign(this.platformKeypair)

    // Submit signed challenge to get JWT
    const tokenRes = await fetch(webAuthEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: tx.toXDR() }),
    })
    const tokenData = await tokenRes.json() as { token: string }

    this.logger.log(`SEP-10 authentication successful for ${userPublicKey.substring(0, 8)}...`)
    return tokenData.token
  }

  /**
   * Step 3: SEP-24 Initiate Deposit (On-Ramp)
   * User pays cash at MoneyGram → receives USDC in their wallet
   */
  async initiateDeposit(params: {
    userPublicKey: string
    amount?: string
    jwtToken: string
    assetCode?: string
  }): Promise<{
    interactiveUrl: string
    transactionId: string
  }> {
    const { transferServerUrl } = await this.getMoneygramToml()

    const body = new URLSearchParams({
      asset_code: params.assetCode || 'USDC',
      account: params.userPublicKey,
      lang: 'en',
    })
    if (params.amount) body.append('amount', params.amount)

    const response = await fetch(`${transferServerUrl}/transactions/deposit/interactive`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${params.jwtToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const data = await response.json() as {
      type: string
      url: string
      id: string
    }

    this.logger.log(`SEP-24 deposit initiated: ${data.id}`)
    return {
      interactiveUrl: data.url,
      transactionId: data.id,
    }
  }

  /**
   * Step 3b: SEP-24 Initiate Withdrawal (Off-Ramp)
   * User sends USDC → receives cash at MoneyGram location
   */
  async initiateWithdrawal(params: {
    userPublicKey: string
    amount: string
    jwtToken: string
    assetCode?: string
  }): Promise<{
    interactiveUrl: string
    transactionId: string
  }> {
    const { transferServerUrl } = await this.getMoneygramToml()

    const body = new URLSearchParams({
      asset_code: params.assetCode || 'USDC',
      account: params.userPublicKey,
      amount: params.amount,
      lang: 'en',
    })

    const response = await fetch(`${transferServerUrl}/transactions/withdraw/interactive`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${params.jwtToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const data = await response.json() as {
      type: string
      url: string
      id: string
    }

    this.logger.log(`SEP-24 withdrawal initiated: ${data.id}`)
    return {
      interactiveUrl: data.url,
      transactionId: data.id,
    }
  }

  /**
   * Step 4: Poll transaction status
   */
  async getTransactionStatus(params: {
    transactionId: string
    jwtToken: string
  }): Promise<{
    status: string
    memo?: string
    memoType?: string
    withdrawAnchorAccount?: string
    referenceNumber?: string
    amountIn?: string
    amountOut?: string
  }> {
    const { transferServerUrl } = await this.getMoneygramToml()

    const response = await fetch(
      `${transferServerUrl}/transaction?id=${params.transactionId}`,
      {
        headers: { 'Authorization': `Bearer ${params.jwtToken}` },
      }
    )

    const data = await response.json() as {
      transaction: {
        status: string
        withdraw_memo?: string
        withdraw_memo_type?: string
        withdraw_anchor_account?: string
        id?: string
        amount_in?: string
        amount_out?: string
      }
    }

    const { transaction } = data;
    const result: any = { status: transaction.status };
    if (transaction.withdraw_memo) result.memo = transaction.withdraw_memo;
    if (transaction.withdraw_memo_type) result.memoType = transaction.withdraw_memo_type;
    if (transaction.withdraw_anchor_account) result.withdrawAnchorAccount = transaction.withdraw_anchor_account;
    if (transaction.id) result.referenceNumber = transaction.id;
    if (transaction.amount_in) result.amountIn = transaction.amount_in;
    if (transaction.amount_out) result.amountOut = transaction.amount_out;
    return result;
  }
}
