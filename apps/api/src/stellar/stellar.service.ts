import { Injectable, Logger } from '@nestjs/common';
import {
  Horizon,
  Keypair,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Asset,
  Operation,
  Memo,
} from '@stellar/stellar-sdk';

@Injectable()
export class StellarService {
  private readonly logger = new Logger(StellarService.name);
  private readonly server: Horizon.Server;
  private readonly platformKeypair: Keypair;
  private readonly networkPassphrase: string;

  constructor() {
    const secretKey = process.env.PLATFORM_STELLAR_SECRET_KEY;
    if (!secretKey) {
      throw new Error('PLATFORM_STELLAR_SECRET_KEY is not defined in environment variables');
    }
    this.platformKeypair = Keypair.fromSecret(secretKey);

    const horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
    this.server = new Horizon.Server(horizonUrl);

    const network = process.env.STELLAR_NETWORK || 'testnet';
    this.networkPassphrase = network === 'public' ? Networks.PUBLIC : Networks.TESTNET;
  }

  async submitPayment(
    transactionPublicId: string,
    amountInCrypto: string,
  ): Promise<{ hash: string; ledger: number }> {
    try {
      this.logger.debug(`Submitting real transaction on Stellar for ${transactionPublicId}`);
      
      const account = await this.server.loadAccount(this.platformKeypair.publicKey());
      
      const txBuilder = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
      .addOperation(
        Operation.manageData({
          name: `PYARO_TX`,
          value: transactionPublicId.substring(0, 64),
        })
      )
      .setTimeout(30);

      const tx = txBuilder.build();
      tx.sign(this.platformKeypair);

      const result = await this.server.submitTransaction(tx);
      
      return {
        hash: result.hash,
        ledger: result.ledger,
      };
    } catch (error) {
      this.logger.error('Failed to submit transaction to Stellar network', error);
      throw error;
    }
  }

  async getTransactionStatus(hash: string): Promise<boolean> {
    try {
      const tx = await this.server.transactions().transaction(hash).call();
      return tx.successful;
    } catch (error) {
      this.logger.error(`Failed to get transaction status for hash ${hash}`, error);
      return false;
    }
  }
}
