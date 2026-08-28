// src/features/auth/pages/Login.jsx
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useAuthPageAnimation, animateOut } from '../hooks/useAuthPageAnimation.js'
import AuthLayout from '../components/AuthLayout.jsx'

function validate(identifier, password) {
  const next = {}
  if (!identifier.trim()) {
    next.identifier = 'Email or username is required'
  }
  if (!password) {
    next.password = 'Password is required'
  }
  return next
}

export default function Login() {
  const { handleLogin, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/gesture'
  const animRef = useAuthPageAnimation([])

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [pending, setPending] = useState(false)
  const [isUnverified, setIsUnverified] = useState(false)

  // Bounce if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const onIdentifierChange = (e) => {
    setIdentifier(e.target.value)
    setErrors((prev) => ({ ...prev, identifier: '', form: '' }))
    setIsUnverified(false)
  }

  const onPasswordChange = (e) => {
    setPassword(e.target.value)
    setErrors((prev) => ({ ...prev, password: '', form: '' }))
    setIsUnverified(false)
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (pending) return

    const next = validate(identifier, password)
    if (Object.keys(next).length) {
      setErrors(next)
      return
    }

    setErrors({})
    setIsUnverified(false)
    setPending(true)

    try {
      await handleLogin(identifier.trim(), password)
      await animateOut(animRef.current)
      navigate(from, { replace: true })
    } catch (err) {
      const status = err.response?.status
      const message =
        err.normalizedMessage ||
        err.response?.data?.message ||
        'Login failed'

      if (status === 401) {
        setErrors({ form: 'Invalid email/username or password' })
      } else if (status === 403) {
        setErrors({ form: 'Please verify your email first before logging in.' })
        setIsUnverified(true)
      } else if (status === 404) {
        setErrors({ identifier: 'Account not found' })
      } else if (!err.response) {
        setErrors({ form: 'Network error. Check your connection.' })
      } else {
        setErrors({ form: message })
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout>
      <div ref={animRef}>
        <h1 data-auth-animate className="auth-layout__title"><span>Welcome</span> back</h1>
        <p data-auth-animate className="auth-layout__sub">
          New here? <Link to="/register">Create an account</Link>
        </p>

        <form data-auth-animate className="auth-form" onSubmit={onSubmit} noValidate>
          <div className="auth-form__input-wrapper">
            <input
              name="identifier"
              className={`auth-form__input${errors.identifier ? ' is-invalid' : ''}`}
              placeholder="Email or username"
              value={identifier}
              onChange={onIdentifierChange}
              autoComplete="username"
            />
          </div>
          {errors.identifier && <p className="auth-form__error">{errors.identifier}</p>}

          <div className="auth-form__input-wrapper">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              className={`auth-form__input${errors.password ? ' is-invalid' : ''}`}
              placeholder="Enter your password"
              value={password}
              onChange={onPasswordChange}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-form__icon-btn"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="auth-form__error">{errors.password}</p>}

          {errors.form && (
            <p className="auth-form__error">
              {errors.form}
              {isUnverified && identifier.includes('@') && (
                <>
                  {' '}
                  <Link
                    to="/verification"
                    state={{ email: identifier.trim() }}
                    style={{ color: '#fff', textDecoration: 'underline' }}
                  >
                    Verify now →
                  </Link>
                </>
              )}
            </p>
          )}

          <button type="submit" className="auth-form__submit" disabled={pending}>
            {pending ? 'Signing in...' : 'Log in'}
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
