'use client'

const CREDENTIAL_KEY = 'payra-auth-credential'
const PIN_HASH_KEY = 'payra-pin-hash'

export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!window.PublicKeyCredential) return false
  try {
    return await PublicKeyCredential
      .isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

export async function registerBiometric(): Promise<boolean> {
  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: {
          name: 'Payra',
          id: window.location.hostname,
        },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: 'payra-user',
          displayName: 'Payra User',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    }) as PublicKeyCredential

    if (credential) {
      localStorage.setItem(
        CREDENTIAL_KEY,
        btoa(String.fromCharCode(
          ...new Uint8Array(credential.rawId)
        ))
      )
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function verifyBiometric(): Promise<boolean> {
  const storedId = localStorage.getItem(CREDENTIAL_KEY)
  if (!storedId) return false

  try {
    const rawId = Uint8Array.from(
      atob(storedId), c => c.charCodeAt(0)
    )
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{
          id: rawId,
          type: 'public-key',
        }],
        userVerification: 'required',
        timeout: 60000,
      },
    })
    return !!assertion
  } catch {
    return false
  }
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + 'payra-salt-2026')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(
    ...new Uint8Array(hashBuffer)
  ))
}

export async function registerPin(pin: string): Promise<void> {
  const hashed = await hashPin(pin)
  localStorage.setItem(PIN_HASH_KEY, hashed)
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_HASH_KEY)
  if (!stored) return false
  const hashed = await hashPin(pin)
  return hashed === stored
}

export function hasPin(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem(PIN_HASH_KEY)
}

export function hasBiometric(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem(CREDENTIAL_KEY)
}

export function isAppAuthSetup(): boolean {
  return hasPin() || hasBiometric()
}
