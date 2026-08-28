// src/features/auth/components/AuthLayout.jsx
import { memo, useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import AuthDrift from './AuthDrift'
import '../styles/auth.scss'

function AuthLayout({ children }) {
  const leftRef = useRef(null)
  const rightRef = useRef(null)

  useLayoutEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        leftRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: 'power2.out' }
      )
      gsap.fromTo(
        rightRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, delay: 0.05, ease: 'power2.out' }
      )
    })
    return () => ctx.revert()
  }, [])

  return (
    <div className="auth-layout" data-theme="dark">
      <div className="auth-layout__left" ref={leftRef}>
        <header className="auth-layout__topbar">
          <Link to="/" className="auth-layout__topbar-logo">
            Moodify
          </Link>
          <Link to="/" className="auth-layout__topbar-home">
            ← Back to home
          </Link>
        </header>

        <main className="auth-layout__content">
          <div className="auth-layout__form-wrapper">
            {children}
          </div>
        </main>
      </div>

      <div className="auth-layout__right" ref={rightRef}>
        <div className="auth-layout__fade" />
        <AuthDrift />
      </div>
    </div>
  )
}

export default memo(AuthLayout)