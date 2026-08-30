import { Link } from 'react-router-dom'
import '../styles/footer.responsive.scss'

const scrollToId = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <span className="footer__logo">MOODIFY</span>
            <p>Music that reads you.</p>
          </div>

          <div className="footer__links">
            <div className="footer__col">
              <span className="footer__col-title">Navigate</span>
              <button type="button" onClick={() => scrollToId('how-it-works')}>
                How It Works
              </button>
              <button type="button" onClick={() => scrollToId('moods')}>
                Moods
              </button>
              <button type="button" onClick={() => scrollToId('gestures')}>
                Gestures
              </button>
            </div>

            <div className="footer__col">
              <span className="footer__col-title">Account</span>
              <Link to="/login">Login</Link>
              <Link to="/register">Sign Up</Link>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© 2026 Moodify. All rights reserved.</span>
          <span>Music that reads you.</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer