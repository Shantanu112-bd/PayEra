'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  hasBiometric,
  hasPin,
  verifyBiometric,
  verifyPin
} from '../../lib/appAuth'

interface PaymentConfirmProps {
  amount: string
  merchantName: string
  starReward: string
  onConfirmed: () => void
  onCancelled: () => void
}

export function PaymentConfirm({ amount, merchantName, starReward, onConfirmed, onCancelled }: PaymentConfirmProps) {
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [showPin, setShowPin] = useState(false)

  useEffect(() => {
    if (hasBiometric()) {
      triggerBiometric()
    } else if (hasPin()) {
      setShowPin(true)
    } else {
      // If no auth setup, just confirm automatically (though AppLock should prevent reaching here)
      onConfirmed()
    }
  }, [])

  const triggerBiometric = async () => {
    const success = await verifyBiometric()
    if (success) {
      onConfirmed()
    } else if (hasPin()) {
      setShowPin(true)
    } else {
      onCancelled()
    }
  }

  const handleNumpad = async (digit: string) => {
    if (digit === 'del') {
      setPin(prev => prev.slice(0, -1))
      setPinError(false)
      return
    }

    if (digit === 'ok') {
      if (pin.length === 6) {
        const success = await verifyPin(pin)
        if (success) {
          onConfirmed()
        } else {
          setPinError(true)
          setTimeout(() => {
            setPin('')
            setPinError(false)
          }, 600)
        }
      }
      return
    }

    if (pin.length < 6) {
      setPin(prev => prev + digit)
    }
  }

  const renderDots = () => {
    return (
      <motion.div 
        animate={pinError ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex gap-3 justify-center my-6"
      >
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className={`w-3 h-3 rounded-full transition-colors ${i < pin.length ? 'bg-black' : 'bg-gray-300'}`}
          />
        ))}
      </motion.div>
    )
  }

  const renderNumpad = () => {
    const rows = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['del', '0', 'ok']
    ]

    return (
      <div className="flex flex-col gap-3 items-center">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-3">
            {row.map(key => (
              <motion.button
                key={key}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNumpad(key)}
                className="w-[60px] h-[60px] rounded-full border-[1.5px] border-black flex items-center justify-center font-mono text-[18px] bg-white active:bg-gray-100"
              >
                {key === 'del' ? '⌫' : key === 'ok' ? '✓' : key}
              </motion.button>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[80]"
        onClick={onCancelled}
      />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] p-6 z-[90] pb-safe text-black flex flex-col items-center"
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mb-6" />
        <h2 className="text-[16px] font-bold font-mono mb-6">Confirm Payment</h2>

        <div className="w-full border-[1.5px] border-black rounded-[12px] p-4 mb-6">
          <div className="flex justify-between text-[14px] mb-2">
            <span className="text-gray-500">Merchant</span>
            <span className="font-bold">{merchantName}</span>
          </div>
          <div className="flex justify-between text-[14px] mb-2">
            <span className="text-gray-500">Amount</span>
            <span className="font-bold font-mono">₹{amount}</span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-gray-500">STAR reward</span>
            <span className="font-bold text-[#C5D483]">+{starReward} ⭐</span>
          </div>
        </div>

        <p className="text-[12px] text-gray-500 mb-6">Authenticate to confirm</p>

        {!showPin && hasBiometric() ? (
          <div className="flex flex-col items-center mb-6">
            <button onClick={triggerBiometric}>
              <svg className="w-16 h-16 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-6">
            {renderDots()}
            {pinError && <div className="text-red-500 text-[12px] mb-2">Incorrect PIN</div>}
            {renderNumpad()}
          </div>
        )}

        <button 
          onClick={onCancelled}
          className="w-full py-4 text-[14px] font-bold text-gray-500 mt-2"
        >
          CANCEL
        </button>
      </motion.div>
    </>
  )
}
