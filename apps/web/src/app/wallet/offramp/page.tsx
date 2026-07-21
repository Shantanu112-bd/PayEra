'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cryptoPaySdk } from '@cryptopay/sdk'
import { useStellarWallet } from '../../../components/providers/StellarWalletProvider'
import { TopBar } from '../../../components/layout/TopBar'
import { signTransaction } from '@stellar/freighter-api'
import { Networks } from '@stellar/stellar-sdk'

type Step = 'amount' | 'loading' | 'anchor' | 'sign' | 'polling' | 'done' | 'error'

const HORIZON_URL = process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'
const USDC_ISSUER = process.env.NEXT_PUBLIC_USDC_ISSUER || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
const PASSPHRASE = Networks.TESTNET

export default function OffRampPage() {
  const router = useRouter()
  const { publicKey, balances, refreshBalances, connect } = useStellarWallet()
  const [step, setStep] = useState<Step>('amount')
  const [amount, setAmount] = useState('')
  const [amountError, setAmountError] = useState('')
  const [error, setError] = useState('')
  const [statusText, setStatusText] = useState('')
  const [interactiveUrl, setInteractiveUrl] = useState('')
  const [txId, setTxId] = useState('')
  const [jwt, setJwt] = useState('')
  const [anchorAccount, setAnchorAccount] = useState('')
  const [memo, setMemo] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current) }, [])

  const handleContinue = async () => {
    if (!publicKey) return
    const val = parseFloat(amount)
    if (!amount || isNaN(val) || val < 5) {
      setAmountError('Minimum withdrawal is 5 USDC')
      return
    }
    if (val > parseFloat(balances.USDC)) {
      setAmountError('Insufficient USDC balance')
      return
    }
    setAmountError('')
    setError('')
    setStep('loading')
    setStatusText('Authenticating…')
    try {
      const { jwtToken } = await cryptoPaySdk.ramps.authenticate(publicKey)
      setJwt(jwtToken)
      setStatusText('Initiating withdrawal…')
      const { interactiveUrl: url, transactionId } = await cryptoPaySdk.ramps.initiateWithdrawal({
        userPublicKey: publicKey,
        amount,
        jwtToken,
      })
      setInteractiveUrl(url)
      setTxId(transactionId)
      setStep('anchor')
    } catch (e: any) {
      setError(e.message || 'Failed to initiate withdrawal')
      setStep('error')
    }
  }

  const startPolling = (id: string, token: string) => {
    setStep('polling')
    setStatusText('Waiting for anchor confirmation…')
    const poll = async () => {
      try {
        const res = await cryptoPaySdk.ramps.getTransactionStatus({ id, jwt: token })
        setStatusText(`Status: ${res.status}`)
        if (res.status === 'pending_user_transfer_start' && res.withdrawAnchorAccount) {
          setAnchorAccount(res.withdrawAnchorAccount)
          setMemo(res.memo || '')
          if (res.referenceNumber) setReferenceNumber(res.referenceNumber)
          setStep('sign')
        } else if (res.status === 'completed') {
          if (res.referenceNumber) setReferenceNumber(res.referenceNumber)
          await refreshBalances()
          setStep('done')
        } else {
          pollRef.current = setTimeout(poll, 5000)
        }
      } catch {
        pollRef.current = setTimeout(poll, 5000)
      }
    }
    poll()
  }

  const handleIframeDone = () => {
    setInteractiveUrl('')
    startPolling(txId, jwt)
  }

  const handleSignPayment = async () => {
    if (!publicKey) return
    setStep('loading')
    setStatusText('Signing payment…')
    try {
      const { Horizon, TransactionBuilder, BASE_FEE, Operation, Asset, Memo } = await import('@stellar/stellar-sdk')
      const server = new Horizon.Server(HORIZON_URL)
      const account = await server.loadAccount(publicKey)
      const asset = new Asset('USDC', USDC_ISSUER)
      const builder = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: PASSPHRASE })
        .addOperation(Operation.payment({ destination: anchorAccount, asset, amount }))
        .setTimeout(30)
      if (memo) builder.addMemo(Memo.text(memo))
      const tx = builder.build()
      const { signedTxXdr: signedTransaction } = await signTransaction(tx.toXDR(), { networkPassphrase: PASSPHRASE, address: publicKey })
      const signedTx = TransactionBuilder.fromXDR(signedTransaction, PASSPHRASE)
      await server.submitTransaction(signedTx)
      startPolling(txId, jwt)
    } catch (e: any) {
      setError(e.message || 'Failed to sign payment')
      setStep('error')
    }
  }

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar title="Withdraw" backHref="/wallet" />
        <div className="flex-1 flex flex-col items-center justify-center px-[20px] gap-4 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">account_balance_wallet</span>
          <p className="text-on-surface-variant text-sm">Connect your wallet to withdraw</p>
          <button onClick={connect} className="bg-primary text-on-primary font-semibold px-8 py-3 rounded-full">
            Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      <TopBar title="Withdraw" backHref="/wallet" />

      <div className="flex-1 px-[20px] pt-4 space-y-4">

        {step === 'amount' && (
          <>
            <div className="bg-primary rounded-[24px] p-5 text-on-primary">
              <div className="text-xs font-semibold opacity-70 mb-1">Available USDC</div>
              <div className="text-3xl font-bold">{balances.USDC} <span className="text-lg opacity-70">USDC</span></div>
            </div>

            <div className="bg-surface-container-lowest rounded-[24px] p-5 space-y-4">
              <div className="text-sm font-semibold text-on-surface">Amount (USDC)</div>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setAmountError('') }}
                  placeholder="0.00"
                  className="w-full bg-surface-container rounded-[16px] px-4 pr-16 py-4 text-on-surface text-lg font-semibold outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">USDC</span>
              </div>
              {amountError && (
                <div className="flex items-center gap-2 text-error text-sm">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {amountError}
                </div>
              )}
              <div className="flex gap-2">
                {['20', '50', '100'].map(v => (
                  <button key={v} onClick={() => { setAmount(v); setAmountError('') }}
                    className={`flex-1 py-2 rounded-full text-sm font-semibold border border-outline-variant transition-colors ${amount === v ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container text-on-surface'}`}>
                    {v}
                  </button>
                ))}
              </div>
              <div className="text-xs text-on-surface-variant">Min 5 USDC · Max 2,500 USDC</div>
            </div>

            <div className="bg-secondary-container rounded-[24px] p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-[18px]">storefront</span>
                Pick up cash at any MoneyGram location
              </div>
              <div className="flex items-center gap-2 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-[18px]">public</span>
                174 countries supported
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={!amount}
              className="w-full bg-primary text-on-primary font-semibold py-4 rounded-full disabled:opacity-40">
              Continue
            </button>
          </>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-on-surface-variant text-sm">{statusText || 'Please wait…'}</p>
          </div>
        )}

        {step === 'anchor' && interactiveUrl && (
          <div className="space-y-3">
            <p className="text-sm text-on-surface-variant text-center">Complete your withdrawal details below</p>
            <div className="rounded-[24px] overflow-hidden h-[500px] bg-surface-container">
              <iframe src={interactiveUrl} className="w-full h-full border-0" title="MoneyGram Withdrawal" />
            </div>
            <button onClick={handleIframeDone} className="w-full bg-primary-container text-on-primary-container font-semibold py-3 rounded-full text-sm">
              I've completed the form
            </button>
          </div>
        )}

        {step === 'polling' && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-on-surface-variant text-sm">{statusText}</p>
          </div>
        )}

        {step === 'sign' && (
          <div className="bg-surface-container-lowest rounded-[24px] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">send</span>
              <div>
                <div className="font-semibold text-on-surface">Send USDC to MoneyGram</div>
                <div className="text-sm text-on-surface-variant">Sign the payment to complete your withdrawal</div>
              </div>
            </div>
            <div className="bg-surface-container rounded-[16px] p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Amount</span>
                <span className="font-semibold text-on-surface">{amount} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Destination</span>
                <span className="font-mono text-on-surface text-xs">{anchorAccount.slice(0, 8)}…{anchorAccount.slice(-4)}</span>
              </div>
              {memo && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Memo</span>
                  <span className="font-mono text-on-surface">{memo}</span>
                </div>
              )}
            </div>
            <button onClick={handleSignPayment} className="w-full bg-primary text-on-primary font-semibold py-4 rounded-full">
              Sign &amp; Send
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
            <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-container text-4xl">check_circle</span>
            </div>
            <div>
              <div className="text-xl font-bold text-on-surface">Withdrawal submitted</div>
              <div className="text-sm text-on-surface-variant mt-1">Your cash is ready for pickup at MoneyGram</div>
            </div>
            {referenceNumber && (
              <div className="bg-secondary-container rounded-[16px] px-6 py-4 w-full">
                <div className="text-xs text-on-surface-variant mb-1">Reference number</div>
                <div className="font-bold text-on-surface text-lg font-mono">{referenceNumber}</div>
              </div>
            )}
            <button onClick={() => router.push('/wallet')} className="w-full bg-primary text-on-primary font-semibold py-4 rounded-full">
              Done
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="bg-error-container rounded-[24px] p-5 space-y-4">
            <div className="flex items-center gap-2 text-error">
              <span className="material-symbols-outlined">error</span>
              <span className="font-semibold">Something went wrong</span>
            </div>
            <p className="text-sm text-error">{error}</p>
            <button onClick={() => { setStep('amount'); setError('') }} className="w-full bg-primary text-on-primary font-semibold py-3 rounded-full">
              Try Again
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
