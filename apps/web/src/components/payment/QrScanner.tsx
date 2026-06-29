'use client'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useEffect, useRef } from 'react'

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void
  onScanError?: (error: string) => void
}

export function QrScanner({ onScanSuccess, onScanError }: QrScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  const onScanSuccessRef = useRef(onScanSuccess)
  const onScanErrorRef = useRef(onScanError)

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess
    onScanErrorRef.current = onScanError
  }, [onScanSuccess, onScanError])

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
      },
      /* verbose= */ false
    )

    scannerRef.current.render(
      (decodedText) => {
        onScanSuccessRef.current(decodedText)
      },
      (error) => {
        // Only call onScanError for real errors, not every frame
        if (!error.includes('No QR code found')) {
          onScanErrorRef.current?.(error)
        }
      }
    )

    return () => {
      scannerRef.current?.clear().catch(console.error)
    }
  }, [])

  return (
    <div className="w-full">
      <div id="qr-reader" className="w-full" />
    </div>
  )
}
