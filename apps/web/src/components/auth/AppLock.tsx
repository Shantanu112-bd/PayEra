'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  isBiometricAvailable,
  verifyBiometric,
  verifyPin,
  registerBiometric,
  registerPin,
  hasBiometric,
  hasPin,
  isAppAuthSetup,
} from '../../lib/appAuth'
import { useAppStore } from '../../lib/store'

type LockScreenState = 'SETUP' | 'UNLOCK' | 'LOCKOUT'

export function AppLock() {
  const { setAppUnlocked } = useAppStore()
  const [screenState, setScreenState] = useState<LockScreenState>('UNLOCK')
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [lockoutTime, setLockoutTime] = useState(0)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [showPinFallback, setShowPinFallback] = useState(false)

  useEffect(() => {
    isBiometricAvailable().then(setBiometricAvailable)
    if (!isAppAuthSetup()) {
      setScreenState('SETUP')
    } else {
      setScreenState('UNLOCK')
      // Auto trigger biometric if returning user and has biometric
      if (hasBiometric()) {
        triggerBiometric()
      } else {
        setShowPinFallback(true)
      }
    }
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (lockoutTime > 0) {
      timer = setInterval(() => {
        setLockoutTime(prev => {
          if (prev <= 1) {
            setScreenState('UNLOCK')
            setFailedAttempts(0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [lockoutTime])

  const triggerBiometric = async () => {
    const success = await verifyBiometric()
    if (success) {
      setAppUnlocked(true)
    } else {
      setShowPinFallback(true)
    }
  }

  const handleSetupBiometric = async () => {
    const success = await registerBiometric()
    if (success) {
      setAppUnlocked(true)
    }
  }

  const handleNumpad = async (digit: string) => {
    if (digit === 'del') {
      if (isConfirming) {
        setPinConfirm(prev => prev.slice(0, -1))
      } else {
        setPin(prev => prev.slice(0, -1))
      }
      setPinError(false)
      return
    }

    if (digit === 'ok') {
      if (screenState === 'SETUP') {
        if (!isConfirming && pin.length === 6) {
          setIsConfirming(true)
        } else if (isConfirming && pinConfirm.length === 6) {
          if (pin === pinConfirm) {
            await registerPin(pin)
            setAppUnlocked(true)
          } else {
            setPinError(true)
            setTimeout(() => {
              setPin('')
              setPinConfirm('')
              setIsConfirming(false)
              setPinError(false)
            }, 600)
          }
        }
      } else if (screenState === 'UNLOCK') {
        if (pin.length === 6) {
          const success = await verifyPin(pin)
          if (success) {
            setAppUnlocked(true)
          } else {
            setPinError(true)
            const newAttempts = failedAttempts + 1
            setFailedAttempts(newAttempts)
            setTimeout(() => {
              setPin('')
              setPinError(false)
              if (newAttempts >= 3) {
                setScreenState('LOCKOUT')
                setLockoutTime(30)
              }
            }, 600)
          }
        }
      }
      return
    }

    if (screenState === 'SETUP') {
      if (isConfirming) {
        if (pinConfirm.length < 6) setPinConfirm(prev => prev + digit)
      } else {
        if (pin.length < 6) setPin(prev => prev + digit)
      }
    } else if (screenState === 'UNLOCK') {
      if (pin.length < 6) setPin(prev => prev + digit)
    }
  }

  const currentPinLength = screenState === 'SETUP' && isConfirming ? pinConfirm.length : pin.length

  const renderDots = () => {
    return (
      <motion.div 
        animate={pinError ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex gap-4 justify-center my-8"
      >
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full transition-colors ${i < currentPinLength ? 'bg-black' : 'bg-gray-300'}`}
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
      <div className="flex flex-col gap-4 items-center">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-4">
            {row.map(key => (
              <motion.button
                key={key}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNumpad(key)}
                className="w-[72px] h-[72px] rounded-full border-[1.5px] border-black flex items-center justify-center font-mono text-[20px] bg-white active:bg-gray-100"
              >
                {key === 'del' ? '⌫' : key === 'ok' ? '✓' : key}
              </motion.button>
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (screenState === 'LOCKOUT') {
    return (
      <div className="fixed inset-0 z-[100] bg-[#E8E4DC] flex flex-col items-center justify-center p-6 text-black">
        <h1 className="font-bold text-[24px] mb-2">Too many attempts</h1>
        <p className="text-gray-500 mb-8">Try again in {lockoutTime} seconds</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#E8E4DC] flex flex-col items-center pt-20 p-6 text-black pb-safe">
      <div className="font-mono text-[24px] font-bold mb-12">⟠ Payra</div>

      {screenState === 'SETUP' && (
        <div className="flex flex-col items-center w-full max-w-sm flex-1">
          {!showPinFallback ? (
            <>
              <h1 className="font-mono text-[18px] mb-2">Secure your app</h1>
              <p className="text-[14px] text-gray-500 text-center mb-12">Set up a PIN or biometric to protect your wallet</p>
              
              {biometricAvailable && (
                <button 
                  onClick={handleSetupBiometric}
                  className="w-full bg-[#C5D483] text-black font-bold h-[56px] rounded-full border-[1.5px] border-black mb-4"
                >
                  SET UP FINGERPRINT
                </button>
              )}
              <button 
                onClick={() => setShowPinFallback(true)}
                className="w-full bg-transparent text-black font-bold h-[56px] rounded-full border-[1.5px] border-black"
              >
                USE PIN INSTEAD
              </button>
            </>
          ) : (
            <div className="w-full flex flex-col items-center flex-1 justify-between">
              <div className="flex flex-col items-center">
                <h1 className="font-mono text-[18px] mb-2">{isConfirming ? 'Confirm PIN' : 'Create PIN'}</h1>
                {renderDots()}
                {pinError && <div className="text-red-500 text-[14px]">PINs do not match</div>}
              </div>
              <div className="mt-auto mb-8">
                {renderNumpad()}
              </div>
            </div>
          )}
        </div>
      )}

      {screenState === 'UNLOCK' && (
        <div className="flex flex-col items-center w-full max-w-sm flex-1">
          <p className="text-[14px] text-gray-500 mb-8">Welcome back</p>

          {!showPinFallback && hasBiometric() ? (
            <div className="flex flex-col items-center mt-12">
              <button onClick={triggerBiometric} className="mb-4">
                <svg className="w-16 h-16 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </button>
              <p className="text-[12px] text-gray-500 mb-12">Touch to unlock</p>
              
              {hasPin() && (
                <button onClick={() => setShowPinFallback(true)} className="text-[14px] font-bold border-b border-black">
                  Use PIN instead
                </button>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center flex-1 justify-between">
              <div className="flex flex-col items-center">
                <h1 className="font-mono text-[18px] mb-2">Enter PIN</h1>
                {renderDots()}
                {pinError && <div className="text-red-500 text-[14px]">Incorrect PIN</div>}
              </div>
              <div className="mt-auto mb-8">
                {renderNumpad()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
