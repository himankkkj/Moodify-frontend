import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import '../styles/navbar.responsive.scss'

const Navbar = () => {
  const navRef = useRef(null)
  const lastScrollY = useRef(0)
  const [isOpen, setIsOpen] = useState(false)

  // Standard navbar scroll behavior
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      nav.classList.toggle('navbar--top', currentScrollY < 50)
      nav.classList.toggle('navbar--scrolled', currentScrollY >= 50)

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        nav.classList.add('navbar--hidden')
      } else {
        nav.classList.remove('navbar--hidden')
      }

      lastScrollY.current = currentScrollY
    }

    nav.classList.add('navbar--top')

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const scrollTo = (id) => {
    setIsOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <nav className="navbar navbar--top" ref={navRef}>
        {/* LEFT — Hamburger Toggle + Logo + Pill (Desktop) */}
        <div className="navbar__left">
          <button
            type="button"
            className="navbar__toggle"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/" className="navbar__logo" onClick={() => setIsOpen(false)}>
            MOODIFY
          </Link>

          <div className="navbar__pill">
            <button onClick={() => scrollTo('moods')}>MOODS</button>
            <span className="navbar__pill-divider">/</span>
            <button onClick={() => scrollTo('gestures')}>GESTURES</button>
          </div>
        </div>

        {/* CENTER — empty, vinyl lives here */}
        <div className="navbar__center" />

        {/* RIGHT — auth links */}
        <div className="navbar__right">
          <button onClick={() => scrollTo('how-it-works')} className="navbar__about">
            ABOUT
          </button>
          <Link to="/login" className="navbar__login" onClick={() => setIsOpen(false)}>
            LOGIN
          </Link>
        </div>
      </nav>

      {/* LEFT DRAWER (Active < 1024px) */}
      <div className={`navbar-drawer ${isOpen ? 'navbar-drawer--open' : ''}`}>
        <div className="navbar-drawer__backdrop" onClick={() => setIsOpen(false)} />
        <div className="navbar-drawer__content">
          <div className="navbar-drawer__header">
            <span className="navbar-drawer__logo">MOODIFY</span>
            <button
              type="button"
              className="navbar-drawer__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </div>

          <div className="navbar-drawer__links">
            <button type="button" onClick={() => scrollTo('moods')}>
              MOODS
            </button>
            <button type="button" onClick={() => scrollTo('gestures')}>
              GESTURES
            </button>
            <button type="button" onClick={() => scrollTo('how-it-works')}>
              ABOUT / HOW IT WORKS
            </button>
            <Link to="/login" onClick={() => setIsOpen(false)}>
              LOGIN
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default Navbar