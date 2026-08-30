import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Link } from 'react-router-dom'
import VinylRecord from '../../shared/components/VinylRecord'
import '../styles/hero.scss'
import SoundWave from './SoundWave'
const Hero = () => {
  const headingRef = useRef(null)
  const subRef = useRef(null)
  const btnRef = useRef(null)
  const vinylRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl
      .fromTo(vinylRef.current,
        { y: -120, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2 }
      )
      .fromTo(headingRef.current.children,
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.15 },
        '-=0.6'
      )
      .fromTo(subRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        '-=0.4'
      )
      .fromTo(btnRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 },
        '-=0.4'
      )
  }, [])

  return (
    <section className="hero">
      <SoundWave />
      {/* vinyl — sits at top center, behind navbar */}
      <div className="hero__vinyl" ref={vinylRef}>
        <VinylRecord size={850} spinning={true} />
      </div>

      {/* main content */}
      <div className="hero__content">

        {/* big split headline */}
        <h1 className="hero__heading" ref={headingRef}>
          <span className="hero__heading-left">MUSIC</span>
          <span className="hero__heading-right">MEETS</span>
          <span className="hero__heading-full">YOUR MOOD</span>
        </h1>

        {/* tagline */}
        <p className="hero__tagline" ref={subRef}>
          MUSIC THAT READS YOU.
          <br />
          <span>
            No touch. No type. Just look at the camera
            <br />
            and let Moodify do the rest.
          </span>
        </p>

        {/* CTAs */}
        <div className="hero__btns" ref={btnRef}>
          <Link
            to="/mood"
            className="hero__btn hero__btn--primary"
            onMouseEnter={() => {
              import("../../mood/services/faceapi.service").then((m) => {
                m.loadModels?.("/models", () => { });
              });
            }}
          >
            GET STARTED
          </Link>
          <button
            className="hero__btn hero__btn--secondary"
            onClick={() => document.getElementById('how-it-works')
              .scrollIntoView({ behavior: 'smooth' })}
          >
            SEE HOW IT WORKS
          </button>
        </div>

      </div>

    </section>
  )
}

export default Hero