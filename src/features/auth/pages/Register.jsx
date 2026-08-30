// src/features/auth/pages/Register.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useAuthPageAnimation, animateOut } from '../hooks/useAuthPageAnimation.js'
import AuthLayout from '../components/AuthLayout.jsx'

function getPasswordError(password) {
  if (!password) return "Password is required"
  if (password.length < 8) return "Password must be at least 8 characters"
  if (password.length > 128) return "Password must not exceed 128 characters"
  if (!/[a-z]/.test(password)) return "Password must include a lowercase letter"
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter"
  if (!/\d/.test(password)) return "Password must include a number"
  if (!/[@$!%*?&#^()_+\-=.,;:]/.test(password)) return "Password must include a special character"
  return null
}

function validate(form, agreeTerms) {
  const next = {}

  if (!form.username.trim()) {
    next.username = 'Username is required'
  } else if (form.username.trim().length < 3) {
    next.username = 'Username must be at least 3 characters'
  }

  if (!form.email.trim()) {
    next.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    next.email = 'Enter a valid email'
  }

  const passError = getPasswordError(form.password)
  if (passError) {
    next.password = passError
  }

  if (!agreeTerms) {
    next.terms = 'Please accept the Terms & Conditions'
  }

  return next
}

export default function Register() {
  const { handleRegister } = useAuth()
  const navigate = useNavigate()
  const animRef = useAuthPageAnimation([])

  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [errors, setErrors] = useState({})
  const [pending, setPending] = useState(false)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '', form: '' }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (pending) return

    const next = validate(form, agreeTerms)
    if (Object.keys(next).length) {
      setErrors(next)
      return
    }

    setErrors({})
    setPending(true)

    try {
      await handleRegister(form.email.trim(), form.password, form.username.trim())
      await animateOut(animRef.current)
      navigate('/verification', { state: { email: form.email.trim() } })
    } catch (err) {
      const status = err.response?.status
      const message =
        err.normalizedMessage ||
        err.response?.data?.message ||
        err.message ||
        'Registration failed'

      if (status === 409) {
        const m = message.toLowerCase()
        if (m.includes('email')) setErrors({ email: 'Email already registered' })
        else if (m.includes('username')) setErrors({ username: 'Username already taken' })
        else setErrors({ form: message })
      } else if (status === 400) {
        setErrors({ form: message })
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
        <h1 data-auth-animate className="auth-layout__title"><span>Create</span> an account</h1>
        <p data-auth-animate className="auth-layout__sub">
          Already have an account? <Link to="/login">Log in</Link>
        </p>

        <form data-auth-animate className="auth-form" onSubmit={onSubmit} noValidate>
          <div className="auth-form__input-wrapper">
            <input
              name="username"
              className={`auth-form__input${errors.username ? ' is-invalid' : ''}`}
              placeholder="Username"
              value={form.username}
              onChange={onChange}
              autoComplete="username"
            />
          </div>
          {errors.username && <p className="auth-form__error">{errors.username}</p>}

          <div className="auth-form__input-wrapper">
            <input
              name="email"
              type="email"
              className={`auth-form__input${errors.email ? ' is-invalid' : ''}`}
              placeholder="Email address"
              value={form.email}
              onChange={onChange}
              autoComplete="email"
            />
          </div>
          {errors.email && <p className="auth-form__error">{errors.email}</p>}

          <div className="auth-form__input-wrapper">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              className={`auth-form__input${errors.password ? ' is-invalid' : ''}`}
              placeholder="Enter your password"
              value={form.password}
              onChange={onChange}
              autoComplete="new-password"
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

          <div className="auth-form__terms">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked)
                setErrors((prev) => ({ ...prev, terms: '', form: '' }))
              }}
            />
            <label htmlFor="terms">
              I agree to the <Link to="/terms">Terms & Conditions</Link>
            </label>
          </div>
          {errors.terms && <p className="auth-form__error">{errors.terms}</p>}

          {errors.form && <p className="auth-form__error">{errors.form}</p>}

          <button type="submit" className="auth-form__submit" disabled={pending}>
            {pending ? 'Creating...' : 'Create account'}
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}