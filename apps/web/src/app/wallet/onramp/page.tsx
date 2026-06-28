'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cryptoPaySdk } from '@cryptopay/sdk'
import { hasUsdcTrustline, addUsdcTrustline } from '@/lib/trustline'
import freighterApi from '@stellar/freighter-api'

const getPublicKey = async () => {
  const res = await freighterApi.getAddress()
  if (res.error) throw new Error(res.error)
  return res.address
}

const signTx = async (xdr: string) => {
  const res = await freighterApi.signTransaction(xdr, { networkPassphrase: 'Test SDF Network ; September 2015' })
  if (res.error) throw new Error(res.error)
  return res.signedTxXdr
}

export default function OnRampPage() {
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<'auth' | 'interactive' | 'confirmed' | 'trustline'>('auth')
  const [jwtToken, setJwtToken] = useState('')
  const [interactiveUrl, setInteractiveUrl] = useState('')
  const [txId, setTxId] = useState('')
  const [depositInstructions, setDepositInstructions] = useState<any>(null)
  
  useEffect(() => {
    checkTrustline()
  }, [])

  const checkTrustline = async () => {
    try {
      const pubKey = await getPublicKey()
      const hasTrust = await hasUsdcTrustline(pubKey)
      if (!hasTrust) {
        setStep('trustline')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddTrustline = async () => {
    try {
      const pubKey = await getPublicKey()
      const xdr = await addUsdcTrustline(pubKey)
      const signedXdrStr = await signTx(xdr)
      
      const { Horizon, Transaction } = await import('@stellar/stellar-sdk')
      const server = new Horizon.Server(
        process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'
      )
      
      const tx = new Transaction(signedXdrStr, 'Test SDF Network ; September 2015')
      await server.submitTransaction(tx)
      
      setStep('auth')
    } catch (e) {
      console.error(e)
      alert("Failed to add trustline")
    }
  }

  const handleStart = async () => {
    try {
      const pubKey = await getPublicKey()
      const authRes = await cryptoPaySdk.ramps.authenticate(pubKey)
      const token = authRes.jwtToken
      setJwtToken(token)

      const depositRes = await cryptoPaySdk.ramps.initiateDeposit({
        userPublicKey: pubKey,
        amount,
        jwtToken: token
      })
      setInteractiveUrl(depositRes.interactiveUrl)
      setTxId(depositRes.transactionId)
      setStep('interactive')
    } catch (e) {
      console.error(e)
      alert("Failed to initiate deposit")
    }
  }

  const closeIframe = () => {
    setInteractiveUrl('')
    pollStatus()
  }

  const pollStatus = async () => {
    if (!txId || !jwtToken) return
    try {
      const status = await cryptoPaySdk.ramps.getTransactionStatus({ id: txId, jwt: jwtToken })
      if (status.status === 'completed') {
        setStep('confirmed')
      } else if (status.status === 'pending_user_transfer_start') {
        setDepositInstructions({ memo: status.memo, account: status.withdrawAnchorAccount })
        setStep('confirmed')
      } else {
        setTimeout(pollStatus, 3000)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-3">
        <Link href="/wallet" className="text-gray-500 hover:text-black">← Back</Link>
        <h1 className="text-xl font-bold">Add USDC</h1>
      </div>

      <div className="text-sm text-gray-500">
        Step: {step === 'trustline' ? 'Setup' : step === 'auth' ? '1. Authenticate' : step === 'interactive' ? '2. Choose Location' : '3. Confirmed'}
      </div>

      {step === 'trustline' && (
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
          <h3 className="font-bold text-orange-800">⚠️ USDC Trustline Required</h3>
          <p className="text-sm text-orange-600 mt-1 mb-4">Your wallet needs a USDC trustline before receiving USDC.</p>
          <button onClick={handleAddTrustline} className="w-full bg-orange-500 text-white p-3 rounded-lg font-bold">
            Add Trustline →
          </button>
        </div>
      )}

      {step === 'auth' && (
        <>
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="text-sm text-gray-500">Current Balance</div>
            <div className="text-2xl font-bold">0 USDC</div>
            <div className="text-xs text-gray-400 truncate mt-1">Testnet USDC: GBBD47...</div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">How much USDC do you want to add?</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">$</span>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border rounded-lg p-3 pl-8" 
                placeholder="0.00"
              />
              <span className="absolute right-3 top-3 text-gray-500">USDC</span>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 space-y-2">
            <p>• You'll pay cash at any MoneyGram location</p>
            <p>• USDC will arrive in your Freighter wallet</p>
            <p>• Available at 500,000+ locations globally</p>
          </div>

          <button onClick={handleStart} className="w-full bg-lime-400 text-black p-4 rounded-xl font-bold">
            GET STARTED →
          </button>
        </>
      )}

      {interactiveUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="w-full max-w-lg h-[600px] bg-white rounded-[20px] overflow-hidden relative">
            <button onClick={closeIframe} className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/10 rounded-full flex items-center justify-center">✕</button>
            <iframe
              src={interactiveUrl}
              className="w-full h-full border-0"
              title="MoneyGram USDC On-Ramp"
            />
          </div>
        </div>
      )}

      {step === 'confirmed' && (
        <div className="text-center py-10 space-y-4">
          <div className="text-4xl">✅</div>
          <h2 className="text-2xl font-bold">Confirmed!</h2>
          <p className="text-gray-500">Your USDC will arrive shortly after cash payment.</p>
          {depositInstructions && (
            <div className="bg-gray-50 p-4 rounded-xl text-left text-sm mt-4">
              <p><strong>Memo:</strong> {depositInstructions.memo}</p>
              <p><strong>Account:</strong> {depositInstructions.account}</p>
            </div>
          )}
          <Link href="/wallet">
            <button className="w-full bg-black text-white p-4 rounded-xl font-bold mt-4">
              Return to Wallet
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}
