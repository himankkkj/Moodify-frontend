// src/features/auth/pages/Verification.jsx
import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useAuthPageAnimation, animateOut } from '../hooks/useAuthPageAnimation.js'
import AuthLayout from '../components/AuthLayout.jsx'

export default function Verification() {
  const { handleVerifyEmail, handleResendOtp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const animRef = useAuthPageAnimation([])
  
  const [email, setEmail] = useState(location.state?.email || '')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [pending, setPending] = useState(false)
  const [resendPending, setResendPending] = useState(false)

  const timerRef = useRef(null)

  // Clear navigation timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  async function onVerify(e) {
    e.preventDefault()
    if (pending) return

    const cleanEmail = email.trim()
    const cleanOtp = otp.trim()

    if (!cleanEmail) {
      setError('Email address is required')
      return
    }
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter a 6-digit OTP code')
      return
    }

    setError('')
    setMsg('')
    setPending(true)

    try {
      await handleVerifyEmail(cleanEmail, cleanOtp)
      setMsg('Verified. You can log in now.')
      timerRef.current = setTimeout(async () => {
        await animateOut(animRef.current)
        navigate('/login', { replace: true })
      }, 1500)
    } catch (err) {
      setError(err.normalizedMessage || err.response?.data?.message || 'Invalid OTP')
    } finally {
      setPending(false)
    }
  }

  async function onResend() {
    if (resendPending || !email.trim()) return

    setError('')
    setMsg('')
    setResendPending(true)

    try {
      await handleResendOtp(email.trim())
      setMsg('New OTP sent to your email.')
    } catch (err) {
      setError(err.normalizedMessage || err.response?.data?.message || 'Failed to resend')
    } finally {
      setResendPending(false)
    }
  }

  return (
    <AuthLayout>
      <div ref={animRef}>
        <h1 data-auth-animate className="auth-layout__title"><span>Verify</span> email</h1>
        <p data-auth-animate className="auth-layout__sub">
          Enter the 6-digit code sent to your email address.
        </p>

        <form data-auth-animate className="auth-form" onSubmit={onVerify} noValidate>
          <div className="auth-form__input-wrapper">
            <input
              type="email"
              className="auth-form__input"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={!!location.state?.email}
            />
          </div>

          <div className="auth-form__input-wrapper">
            <input
              type="text"
              className="auth-form__input"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
            />
          </div>

          {error && <p className="auth-form__error">{error}</p>}
          {msg && <p className="auth-form__error" style={{ color: '#4ade80' }}>{msg}</p>}

          <button type="submit" className="auth-form__submit" disabled={pending || !otp.trim()}>
            {pending ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <button 
          type="button" 
          className="auth-form__resend" 
          onClick={onResend} 
          disabled={resendPending || !email.trim()}
        >
          Didn't receive the code? <span>{resendPending ? 'Sending...' : 'Resend'}</span>
        </button>
      </div>
    </AuthLayout>
  )
}
