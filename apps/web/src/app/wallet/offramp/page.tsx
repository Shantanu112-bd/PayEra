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

export default function OffRampPage() {
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<'auth' | 'interactive' | 'send' | 'confirmed' | 'trustline'>('auth')
  const [jwtToken, setJwtToken] = useState('')
  const [interactiveUrl, setInteractiveUrl] = useState('')
  const [txId, setTxId] = useState('')
  const [withdrawInstructions, setWithdrawInstructions] = useState<any>(null)
  
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
    if (!amount || parseFloat(amount) < 5) {
      alert("Minimum cash out is 5 USDC")
      return
    }
    
    try {
      const pubKey = await getPublicKey()
      const authRes = await cryptoPaySdk.ramps.authenticate(pubKey)
      const token = authRes.jwtToken
      setJwtToken(token)

      const depositRes = await cryptoPaySdk.ramps.initiateWithdrawal({
        userPublicKey: pubKey,
        amount,
        jwtToken: token
      })
      setInteractiveUrl(depositRes.interactiveUrl)
      setTxId(depositRes.transactionId)
      setStep('interactive')
    } catch (e) {
      console.error(e)
      alert("Failed to initiate withdrawal")
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
        setWithdrawInstructions({ memo: status.memo, account: status.withdrawAnchorAccount, referenceNumber: status.referenceNumber })
        setStep('send')
      } else {
        setTimeout(pollStatus, 3000)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSendUsdc = async () => {
    try {
      const pubKey = await getPublicKey()
      const { Horizon, TransactionBuilder, BASE_FEE, Networks, Operation, Asset, Memo } = await import('@stellar/stellar-sdk')
      const server = new Horizon.Server(
        process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'
      )
      
      const account = await server.loadAccount(pubKey)
      const asset = new Asset('USDC', process.env.NEXT_PUBLIC_USDC_ISSUER || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5')
      
      const builder = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
        .addOperation(Operation.payment({
          destination: withdrawInstructions.account,
          asset,
          amount: amount,
        }))
        .setTimeout(30)
      
      if (withdrawInstructions.memo) {
        builder.addMemo(Memo.text(withdrawInstructions.memo))
      }
      
      const tx = builder.build()
      const signedXdrStr = await signTx(tx.toXDR())
      
      const { Transaction } = await import('@stellar/stellar-sdk')
      const signedTx = new Transaction(signedXdrStr, Networks.TESTNET)
      await server.submitTransaction(signedTx)
      
      setStep('confirmed')
    } catch (e) {
      console.error(e)
      alert("Failed to send USDC")
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-3">
        <Link href="/wallet" className="text-gray-500 hover:text-black">← Back</Link>
        <h1 className="text-xl font-bold">Cash Out USDC</h1>
      </div>

      {step === 'trustline' && (
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
          <h3 className="font-bold text-orange-800">⚠️ USDC Trustline Required</h3>
          <p className="text-sm text-orange-600 mt-1 mb-4">Your wallet needs a USDC trustline.</p>
          <button onClick={handleAddTrustline} className="w-full bg-orange-500 text-white p-3 rounded-lg font-bold">
            Add Trustline →
          </button>
        </div>
      )}

      {step === 'auth' && (
        <>
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="text-sm text-gray-500">Available Balance</div>
            <div className="text-2xl font-bold">Loading... USDC</div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">How much do you want to cash out?</label>
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
            <div className="text-xs text-gray-500 mt-2">min 5, max 2500</div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 space-y-2">
            <p>• Pick up cash at any MoneyGram location near you</p>
            <p>• 174 countries supported</p>
          </div>

          <button onClick={handleStart} className="w-full bg-lime-400 text-black p-4 rounded-xl font-bold">
            CASH OUT →
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
              title="MoneyGram USDC Off-Ramp"
            />
          </div>
        </div>
      )}
      
      {step === 'send' && withdrawInstructions && (
        <div className="text-center py-10 space-y-4">
          <h2 className="text-2xl font-bold">Send USDC to MoneyGram</h2>
          <div className="bg-gray-50 p-4 rounded-xl text-left text-sm mt-4 break-all">
            <p><strong>Account:</strong> {withdrawInstructions.account}</p>
            <p className="mt-2"><strong>Memo:</strong> {withdrawInstructions.memo}</p>
          </div>
          <button onClick={handleSendUsdc} className="w-full bg-lime-400 text-black p-4 rounded-xl font-bold mt-4">
            Send USDC Now
          </button>
        </div>
      )}

      {step === 'confirmed' && (
        <div className="text-center py-10 space-y-4">
          <div className="text-4xl">✅</div>
          <h2 className="text-2xl font-bold">Ready for Pickup!</h2>
          <p className="text-gray-500">Your cash is ready at MoneyGram.</p>
          {withdrawInstructions?.referenceNumber && (
            <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-lg font-bold mt-4">
              Reference: {withdrawInstructions.referenceNumber}
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
