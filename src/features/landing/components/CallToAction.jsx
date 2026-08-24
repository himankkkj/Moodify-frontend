import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'
import coverImg from '../../../assets/images/cta/cover.webp'
import vinylImg  from '../../../assets/images/cta/vinyl.webp'
import '../styles/calltoaction.scss'
import albumSong from '../../../assets/sounds/album-song.mp3'

gsap.registerPlugin(ScrollTrigger)

const CallToAction = () => {
  const sectionRef = useRef(null)
  const headingRef = useRef(null)
  const subRef     = useRef(null)
  const btnRef     = useRef(null)
  const sceneRef   = useRef(null)

  const audioRef = useRef(null)

  useEffect(() => {
    audioRef.current = new Audio(albumSong)
    audioRef.current.loop = true
    audioRef.current.volume = 0.6

    return () => {
      audioRef.current.pause()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        }
      })

      tl
        .fromTo(
          headingRef.current.children,
          { clipPath: 'inset(0 100% 0 0)' },
          { clipPath: 'inset(0 0% 0 0)', duration: 0.9, stagger: 0.14, ease: 'power4.inOut' }
        )
        .fromTo(
          subRef.current,
          { y: 24, opacity: 0 },
          { y: 0,  opacity: 1, duration: 0.8, ease: 'power3.out' },
          '-=0.3'
        )
        .fromTo(
          btnRef.current,
          { y: 16, opacity: 0 },
          { y: 0,  opacity: 1, duration: 0.6, ease: 'power3.out' },
          '-=0.3'
        )
        .fromTo(
          sceneRef.current,
          { x: 60, opacity: 0 },
          { x: 0,  opacity: 1, duration: 1.0, ease: 'expo.out' },
          '-=1.2'
        )

    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section className="cta" ref={sectionRef}>

      <div className="cta__inner">

        {/* Left — text */}
        <div className="cta__content">
          <h2 className="cta__heading" ref={headingRef}>
            <span>READY TO</span>
            <span className="accent">FEEL</span>
            <span>THE MUSIC?</span>
          </h2>

          <p className="cta__sub" ref={subRef}>
            Let your face decide what plays next.
          </p>

          <div ref={btnRef}>
            <Link to="/app" className="cta__btn">
              START LISTENING NOW
            </Link>
          </div>
        </div>

        {/* Right — vinyl scene */}
        <div
          className="cta__vinyl-scene"
          ref={sceneRef}
          onMouseEnter={() => audioRef.current?.play().catch(() => {})}
          onMouseLeave={() => {
            audioRef.current?.pause()
            audioRef.current.currentTime = 0
          }}
        >
          <div className="cta__album">
            <img src={coverImg} alt="Album cover" draggable={false} />
          </div>
          <div className="cta__vinyl-wrap">
            <div className="cta__vinyl-spin">
              <img src={vinylImg} alt="Vinyl record" draggable={false} />
            </div>
          </div>
        </div>

      </div>

      <span className="cta__bg-text">MOODIFY</span>

    </section>
  )
}

export default CallToAction