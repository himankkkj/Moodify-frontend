import { Link } from 'react-router-dom'
import '../styles/footer.scss'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">

        <div className="footer__top">

          {/* brand */}
          <div className="footer__brand">
            <span className="footer__logo">MOODIFY</span>
            <p>Music that reads you.</p>
          </div>

          {/* links */}
          <div className="footer__links">
            <div className="footer__col">
              <span className="footer__col-title">NAVIGATE</span>
              <button onClick={() => document.getElementById('how-it-works')
                .scrollIntoView({ behavior: 'smooth' })}>
                How It Works
              </button>
              <button onClick={() => document.getElementById('moods')
                .scrollIntoView({ behavior: 'smooth' })}>
                Moods
              </button>
              <button onClick={() => document.getElementById('gestures')
                .scrollIntoView({ behavior: 'smooth' })}>
                Gestures
              </button>
            </div>

            <div className="footer__col">
              <span className="footer__col-title">ACCOUNT</span>
              <Link to="/login">Login</Link>
              <Link to="/register">Sign Up</Link>
            </div>
          </div>

        </div>

        {/* bottom bar */}
        <div className="footer__bottom">
          <span>© 2024 MOODIFY. ALL RIGHTS RESERVED.</span>
          <span>MUSIC THAT READS YOU.</span>
        </div>

      </div>
    </footer>
  )
}

export default Footer