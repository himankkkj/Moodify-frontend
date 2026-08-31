import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import '../styles/terms.scss'

const SECTIONS = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    body: [
      `By accessing or using Moodify ("the Service"), you agree to be bound by these Terms & Conditions. If you do not agree to any part of these terms, you may not use the Service.`,
      `You must be at least 13 years old to create an account. If you are under the age of majority in your jurisdiction, you confirm that a parent or legal guardian has reviewed and accepted these terms on your behalf.`,
    ],
  },
  {
    id: 'account',
    title: 'Your Account',
    body: [
      `You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.`,
      `You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.`,
      `We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent, abusive, or illegal activity.`,
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & Data',
    body: [
      `Moodify uses on-device facial expression and gesture recognition. No camera images or biometric data are transmitted to or stored on our servers.`,
      `We only collect minimum account data (email, username) required to operate the Service. Refer to our Privacy Policy for full details.`,
    ],
  },
  {
    id: 'content',
    title: 'Content & Licensing',
    body: [
      `Music, artwork, and metadata are provided by third-party licensors. All rights, titles, and interests remain with their respective owners.`,
      `You may not download, redistribute, modify, or commercially exploit any content from Moodify without prior written permission.`,
    ],
  },
  {
    id: 'conduct',
    title: 'Acceptable Use',
    body: [
      `You agree not to misuse the Service, including but not limited to: reverse engineering, scraping, using bots, bypassing security, or interfering with other users' experience.`,
      `Violation of these rules may lead to immediate account suspension without notice.`,
    ],
  },
  {
    id: 'liability',
    title: 'Disclaimers & Liability',
    body: [
      `The Service is provided "as is" without warranties of any kind, either express or implied.`,
      `To the maximum extent permitted by law, Moodify shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.`,
    ],
  },
  {
    id: 'changes',
    title: 'Changes to Terms',
    body: [
      `We may update these Terms from time to time. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.`,
      `Material changes will be communicated via email or in-app notification where reasonably possible.`,
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    body: [
      <>
        Questions about these Terms? Reach us at{' '}
        <a
          href="https://mail.google.com/mail/?view=cm&fs=1&to=jhimank49@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          jhimank49@gmail.com
        </a>
      </>,
    ],
  },
]

export default function Terms() {
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState(SECTIONS[0].id)
  const sectionRefs = useRef({})

  const lastUpdated = useMemo(
    () => new Date('2025-01-15').toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    }),
    []
  )

  // Scroll spy for sidebar active state
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    )

    SECTIONS.forEach(({ id }) => {
      const el = sectionRefs.current[id]
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const scrollTo = (id) => {
    const el = sectionRefs.current[id]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="terms">
      {/* ── HEADER ─────────────────────────────── */}
      <header className="terms__header">
        <button
          type="button"
          className="terms__back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft size={16} />
          <span>BACK</span>
        </button>

        <Link to="/" className="terms__brand">MOODIFY</Link>
      </header>

      {/* ── HERO ───────────────────────────────── */}
      <section className="terms__hero">
        <p className="terms__eyebrow">LEGAL / TERMS OF SERVICE</p>
        <h1 className="terms__title">
          TERMS <span className="terms__title-accent">&amp;</span><br />
          CONDITIONS
        </h1>
        <p className="terms__meta">Last updated: {lastUpdated}</p>
      </section>

      {/* ── BODY ───────────────────────────────── */}
      <div className="terms__body">
        {/* Sidebar Navigation */}
        <aside className="terms__nav" aria-label="Table of contents">
          <p className="terms__nav-label">ON THIS PAGE</p>
          <ul className="terms__nav-list">
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`terms__nav-link ${activeId === s.id ? 'is-active' : ''}`}
                  onClick={() => scrollTo(s.id)}
                >
                  <span className="terms__nav-num">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="terms__nav-text">{s.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <main className="terms__content">
          {SECTIONS.map((section, i) => (
            <section
              key={section.id}
              id={section.id}
              ref={(el) => (sectionRefs.current[section.id] = el)}
              className="terms__section"
            >
              <div className="terms__section-header">
                <span className="terms__section-num">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="terms__section-title">{section.title}</h2>
              </div>
              <div className="terms__section-body">
                {section.body.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            </section>
          ))}

          {/* Footer CTA */}
          <div className="terms__footer">
            <p className="terms__footer-text">
              By using Moodify you acknowledge that you have read and agree to these Terms.
            </p>
            <Link to="/register" className="terms__footer-btn">
              BACK TO SIGN UP →
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}