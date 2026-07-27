'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cryptoPaySdk } from '@cryptopay/sdk'
import type { RampProviderId } from '@cryptopay/sdk'
import { hasUsdcTrustline, addUsdcTrustline } from '../../../lib/trustline'
import { useStellarWallet } from '../../../components/providers/StellarWalletProvider'
import { TopBar } from '../../../components/layout/TopBar'
import { signTransaction } from '@stellar/freighter-api'
import { Networks } from '@stellar/stellar-sdk'

type Step = 'amount' | 'trustline' | 'loading' | 'anchor' | 'polling' | 'done' | 'error'

const HORIZON_URL = process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'
const PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'public' ? Networks.PUBLIC : Networks.TESTNET

export default function OnRampPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { publicKey, balances, refreshBalances, connect } = useStellarWallet()
  const [step, setStep] = useState<Step>('amount')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [statusText, setStatusText] = useState('')
  const [interactiveUrl, setInteractiveUrl] = useState('')
  const [rampId, setRampId] = useState('')
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // When arriving from another flow (e.g. the /pay top-up entry point), a
  // suggested amount and a return destination may be supplied via the query.
  // The entry point is provider-agnostic: it never names a provider — we
  // resolve one from the ramps registry at initiation time.
  const returnTo = searchParams.get('returnTo') || '/wallet'
  useEffect(() => {
    const topup = searchParams.get('topup')
    if (topup && Number(topup) > 0) setAmount(topup)
  }, [searchParams])

  useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current) }, [])

  const handleContinue = async () => {
    if (!publicKey) return
    setError('')
    setStep('loading')
    try {
      const hasTrust = await hasUsdcTrustline(publicKey)
      if (!hasTrust) { setStep('trustline'); return }
      await authenticate()
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
      setStep('error')
    }
  }

  const handleAddTrustline = async () => {
    if (!publicKey) return
    setError('')
    setStep('loading')
    try {
      const xdr = await addUsdcTrustline(publicKey)
      const { signedTxXdr: signedTransaction } = await signTransaction(xdr, { networkPassphrase: PASSPHRASE, address: publicKey })
      const { Horizon, TransactionBuilder } = await import('@stellar/stellar-sdk')
      const server = new Horizon.Server(HORIZON_URL)
      await server.submitTransaction(TransactionBuilder.fromXDR(signedTransaction, PASSPHRASE))
      await authenticate()
    } catch (e: any) {
      setError(e.message || 'Failed to add trustline')
      setStep('error')
    }
  }

  // SEP-10 auth is performed SERVER-SIDE by the ramps backend; the client
  // never handles the anchor JWT. We resolve an on-ramp-capable provider from
  // the registry (no hardcoded provider), request an on-ramp, and receive the
  // interactive URL + our persisted ramp id.
  const authenticate = async () => {
    if (!publicKey) return
    setStatusText('Initiating deposit…')
    const providers = await cryptoPaySdk.ramps.listProviders()
    const provider = providers.find((p) => p.supportsOnRamp)
    if (!provider) throw new Error('No on-ramp provider is currently available')
    const res = await cryptoPaySdk.ramps.initiateOnRamp({
      providerId: provider.id as RampProviderId,
      userStellarAddress: publicKey,
      amount,
    })
    setInteractiveUrl(res.interactiveUrl || '')
    setRampId(res.id)
    setStep('anchor')
  }

  const startPolling = (id: string) => {
    setStep('polling')
    setStatusText('Waiting for deposit confirmation…')
    const poll = async () => {
      try {
        const ramp = await cryptoPaySdk.ramps.get(id)
        setStatusText(`Status: ${ramp.status}`)
        if (ramp.status === 'COMPLETED') {
          await refreshBalances()
          setStep('done')
        } else if (ramp.status === 'ERROR' || ramp.status === 'EXPIRED' || ramp.status === 'REFUNDED') {
          setError(ramp.failureMessage || `Deposit ${ramp.status.toLowerCase()}`)
          setStep('error')
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
    startPolling(rampId)
  }

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar title="Deposit" backHref="/wallet" />
        <div className="flex-1 flex flex-col items-center justify-center px-[20px] gap-4 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">account_balance_wallet</span>
          <p className="text-on-surface-variant text-sm">Connect your wallet to deposit</p>
          <button onClick={connect} className="bg-primary text-on-primary font-semibold px-8 py-3 rounded-full">
            Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      <TopBar title="Deposit" backHref="/wallet" />

      <div className="flex-1 px-[20px] pt-4 space-y-4">

        {step === 'amount' && (
          <>
            <div className="bg-primary rounded-[24px] p-5 text-on-primary">
              <div className="text-xs font-semibold opacity-70 mb-1">USDC Balance</div>
              <div className="text-3xl font-bold">{balances.USDC} <span className="text-lg opacity-70">USDC</span></div>
            </div>

            <div className="bg-surface-container-lowest rounded-[24px] p-5 space-y-4">
              <div className="text-sm font-semibold text-on-surface">Amount (USD)</div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-semibold">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-surface-container rounded-[16px] pl-8 pr-16 py-4 text-on-surface text-lg font-semibold outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">USDC</span>
              </div>
              <div className="flex gap-2">
                {['50', '100', '200'].map(v => (
                  <button key={v} onClick={() => setAmount(v)}
                    className={`flex-1 py-2 rounded-full text-sm font-semibold border border-outline-variant transition-colors ${amount === v ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container text-on-surface'}`}>
                    ${v}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-secondary-container rounded-[24px] p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-[18px]">storefront</span>
                Pay cash at any MoneyGram location
              </div>
              <div className="flex items-center gap-2 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-[18px]">public</span>
                500,000+ locations globally
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full bg-primary text-on-primary font-semibold py-4 rounded-full disabled:opacity-40">
              Continue
            </button>
          </>
        )}

        {step === 'trustline' && (
          <div className="bg-surface-container-lowest rounded-[24px] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">add_link</span>
              <div>
                <div className="font-semibold text-on-surface">USDC Trustline Required</div>
                <div className="text-sm text-on-surface-variant">Your wallet needs a USDC trustline to receive deposits.</div>
              </div>
            </div>
            <button onClick={handleAddTrustline} className="w-full bg-primary text-on-primary font-semibold py-4 rounded-full">
              Add USDC Trustline
            </button>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-on-surface-variant text-sm">{statusText || 'Please wait…'}</p>
          </div>
        )}

        {step === 'anchor' && interactiveUrl && (
          <div className="space-y-3">
            <p className="text-sm text-on-surface-variant text-center">Complete your deposit in the window below</p>
            <div className="rounded-[24px] overflow-hidden h-[500px] bg-surface-container">
              <iframe src={interactiveUrl} className="w-full h-full border-0" title="MoneyGram Deposit" />
            </div>
            <button onClick={handleIframeDone} className="w-full bg-primary-container text-on-primary-container font-semibold py-3 rounded-full text-sm">
              I've completed the deposit
            </button>
          </div>
        )}

        {step === 'polling' && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-on-surface-variant text-sm">{statusText}</p>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
            <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-container text-4xl">check_circle</span>
            </div>
            <div>
              <div className="text-xl font-bold text-on-surface">Deposit complete</div>
              <div className="text-sm text-on-surface-variant mt-1">Your USDC balance has been updated</div>
            </div>
            <div className="bg-surface-container rounded-[16px] px-6 py-3 text-on-surface font-bold text-lg">
              {balances.USDC} USDC
            </div>
            <button onClick={() => router.push(returnTo)} className="w-full bg-primary text-on-primary font-semibold py-4 rounded-full">
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
