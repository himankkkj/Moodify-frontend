import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import '../../shared/styles/navbar.scss'

const Navbar = () => {
  const navRef       = useRef(null)
  const lastScrollY  = useRef(0)

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // at top
      nav.classList.toggle('navbar--top',      currentScrollY < 50)
      nav.classList.toggle('navbar--scrolled', currentScrollY >= 50)

      // hide / show
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        nav.classList.add('navbar--hidden')
      } else {
        nav.classList.remove('navbar--hidden')
      }

      lastScrollY.current = currentScrollY
    }

    // set initial state without triggering scroll
    nav.classList.add('navbar--top')

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className="navbar navbar--top" ref={navRef}>

      {/* LEFT — nav links */}
      <div className="navbar__left">
        <Link to="/" className="navbar__logo">MOODIFY</Link>
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
        <button onClick={() => scrollTo('how-it-works')} className="navbar__about">ABOUT</button>
        <Link to="/login" className="navbar__login">LOGIN</Link>
      </div>

    </nav>
  )
}

export default Navbar