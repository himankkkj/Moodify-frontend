import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import '../../shared/styles/navbar.scss'

const Navbar = () => {
  const [hidden, setHidden] = useState(false)
  const [atTop, setAtTop] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // at top of page
      setAtTop(currentScrollY < 50)

      // hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setHidden(true)
      } else {
        setHidden(false)
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className={`navbar ${hidden ? 'navbar--hidden' : ''} ${atTop ? 'navbar--top' : 'navbar--scrolled'}`}>

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