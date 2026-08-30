import { Fragment, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import '../styles/howitworks.responsive.scss'

import step1_800 from '../../../assets/images/howitworks/step1-800.webp'
import step1_1100 from '../../../assets/images/howitworks/step1-1100.webp'
import step1_1400 from '../../../assets/images/howitworks/step1-1400.webp'
import step2_800 from '../../../assets/images/howitworks/step2-800.webp'
import step2_1100 from '../../../assets/images/howitworks/step2-1100.webp'
import step2_1400 from '../../../assets/images/howitworks/step2-1400.webp'
import step3_800 from '../../../assets/images/howitworks/step3-800.webp'
import step3_1100 from '../../../assets/images/howitworks/step3-1100.webp'
import step3_1400 from '../../../assets/images/howitworks/step3-1400.webp'
import flipSoundSrc from '../../../assets/sounds/page-flip.wav'

gsap.registerPlugin(ScrollTrigger)

const steps = [
  {
    number: '01',
    title: 'LOOK AT\nCAMERA',
    desc: 'Allow camera access once. No photos saved, no data stored. Everything happens live in your browser.',
    image: step1_1400,
    image1100: step1_1100,
    image800: step1_800,
  },
  {
    number: '02',
    title: 'WE READ\nYOUR MOOD',
    desc: 'face-api.js detects your expression instantly — happy, sad, angry, surprised and more.',
    image: step2_1400,
    image1100: step2_1100,
    image800: step2_800,
  },
  {
    number: '03',
    title: 'MUSIC\nPLAYS',
    desc: 'Last.fm finds the perfect tracks for your mood. Music starts playing automatically.',
    image: step3_1400,
    image1100: step3_1100,
    image800: step3_800,
  }
]

const HowItWorks = () => {
  const sectionRef = useRef(null)
  const stickyRef = useRef(null)
  const imagesRef = useRef([])
  const centerRef = useRef(null)
  const colorImagesRef = useRef([])
  const titlesRef = useRef([])
  const descsRef = useRef([])
  const progressRef = useRef(null)
  const activeNumRef = useRef(null)
  const prevStepRef = useRef(-1)
  const audioRef = useRef(null)
  const audioUnlockedRef = useRef(false)

  // unlock audio on first user interaction
  useEffect(() => {
    const unlock = () => { audioUnlockedRef.current = true }
    window.addEventListener('click', unlock, { once: true })
    window.addEventListener('scroll', unlock, { once: true })
    return () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('scroll', unlock)
    }
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {

      // ── PIN THE STICKY PANEL ────────────────
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        pin: stickyRef.current,
        pinSpacing: false,
        onUpdate: (self) => {
          const rawProgress = self.progress * steps.length
          const newStep = Math.min(steps.length - 1, Math.floor(rawProgress))
          const stepProgress = Math.min(rawProgress - newStep, 1)

          if (newStep !== prevStepRef.current) {
            activateStep(newStep)
          }

          // Progress bar scrubs with scroll
          gsap.set(progressRef.current, { scaleY: self.progress })

          if (newStep === 0) {
            // Step 0 has no outgoing, just keep visible + light push nudge
            const pushStart = 0.6
            const pushProgress = stepProgress > pushStart
              ? (stepProgress - pushStart) / (1 - pushStart) : 0
            const img0 = imagesRef.current[0]
            if (img0) gsap.set(img0, { clipPath: 'inset(0% 0 0% 0)', y: -pushProgress * 14 })

          } else {
            // Incoming: top inset shrinks → reveals from bottom as you scroll
            const incomingImg = imagesRef.current[newStep]
            if (incomingImg) gsap.set(incomingImg, {
              clipPath: `inset(${((1 - stepProgress) * 100).toFixed(1)}% 0 0% 0)`
            })

            // Outgoing: bottom inset grows → exits upward as you scroll
            const outgoingImg = imagesRef.current[newStep - 1]
            if (outgoingImg) gsap.set(outgoingImg, {
              clipPath: `inset(0% 0 ${(stepProgress * 100).toFixed(1)}% 0)`
            })
          }
        }
      })

      // ── HEADING ANIMATE IN ──────────────────
      gsap.fromTo('.how__heading-text',
        { y: 60, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' }
        }
      )

      // activate first step
      activateStep(0)

    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const activateStep = (i) => {
    // ── PLAY PAGE FLIP SOUND ─────────────────
    if (prevStepRef.current !== -1 && prevStepRef.current !== i && audioUnlockedRef.current) {
      if (!audioRef.current) {
        audioRef.current = new Audio(flipSoundSrc)
        audioRef.current.volume = 0.4
      }
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => { })
    }
    prevStepRef.current = i

    // ── IMAGE crossfade ─────────────────────
    imagesRef.current.forEach((img, idx) => {
      const colorImg = colorImagesRef.current[idx]
      gsap.killTweensOf(img)

      if (idx === i) {
        // Incoming: set initial clip state, onUpdate scrubs it from here
        gsap.set(img, {
          opacity: 1, scale: 1, y: 0,
          clipPath: i === 0 ? 'inset(0% 0 0% 0)' : 'inset(100% 0 0% 0)',
          filter: 'grayscale(0.45) sepia(0.1) blur(0px)',
        })
        if (colorImg) {
          colorImg.style.clipPath = 'circle(0px at 50% 50%)'
          gsap.to(colorImg, { opacity: 1, duration: 1.4, ease: 'expo.out', overwrite: 'auto' })
        }

      } else if (idx === i - 1) {
        // Adjacent outgoing: keep visible, onUpdate drives the clip-path exit
        gsap.set(img, {
          opacity: 1, scale: 1, y: 0,
          clipPath: 'inset(0% 0 0% 0)',
          filter: 'grayscale(0.45) sepia(0.1) blur(0px)'
        })
        if (colorImg) {
          colorImg.style.clipPath = 'circle(0px at 50% 50%)'
          gsap.set(colorImg, { opacity: 0 })
        }

      } else {
        // Non-adjacent (2+ steps away): hide immediately
        gsap.set(img, {
          opacity: 0,
          y: 0,
          clipPath: 'inset(100% 0 0% 0)'
        })
        if (colorImg) {
          colorImg.style.clipPath = 'circle(0px at 50% 50%)'
          gsap.set(colorImg, { opacity: 0 })
        }
      }
    })

    // ── BIG NUMBER animate ──────────────────
    if (activeNumRef.current) {
      gsap.to(activeNumRef.current, {
        opacity: 0, y: -20, duration: 0.3, ease: 'power2.in',
        overwrite: 'auto',
        onComplete: () => {
          if (activeNumRef.current) {
            activeNumRef.current.textContent = steps[i].number
            gsap.fromTo(activeNumRef.current,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
            )
          }
        }
      })
    }

    // ── TITLE slide in ──────────────────────
    titlesRef.current.forEach((title, idx) => {
      gsap.to(title, {
        opacity: idx === i ? 1 : 0,
        y: idx === i ? 0 : 20,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: 'auto'
      })
    })

    // ── DESC fade in ────────────────────────
    descsRef.current.forEach((desc, idx) => {
      gsap.to(desc, {
        opacity: idx === i ? 1 : 0,
        y: idx === i ? 0 : 10,
        duration: 0.4,
        delay: idx === i ? 0.1 : 0,
        ease: 'power2.out',
        overwrite: 'auto'
      })
    })

  }

  const handleMouseMove = (e) => {
    const rect = centerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const colorImg = colorImagesRef.current[prevStepRef.current]
    if (colorImg) colorImg.style.clipPath = `circle(120px at ${x}px ${y}px)`

    // GSAP tilt — replaces Framer Motion
    const offsetX = e.clientX - rect.left - rect.width / 2
    const offsetY = e.clientY - rect.top - rect.height / 2
    gsap.to(centerRef.current, {
      rotateX: (offsetY / (rect.height / 2)) * -6,
      rotateY: (offsetX / (rect.width / 2)) * 6,
      duration: 0.5,
      ease: 'power2.out',
      overwrite: 'auto',
    })
  }

  const handleMouseEnter = () => {
    gsap.to(centerRef.current, {
      scale: 1.03,
      duration: 0.5,
      ease: 'power2.out',
      overwrite: 'auto',
    })
  }

  const handleMouseLeave = () => {
    colorImagesRef.current.forEach(img => {
      if (img) img.style.clipPath = 'circle(0px at 50% 50%)'
    })
    gsap.to(centerRef.current, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      duration: 0.6,
      ease: 'power2.out',
      overwrite: 'auto',
    })
  }

  return (
    <section className="how" id="how-it-works" ref={sectionRef}>

      {/* ── STICKY PANEL ────────────────────── */}
      <div className="how__sticky" ref={stickyRef}>

        {/* top center heading */}
        <div className="how__heading">
          <h2 className="how__heading-text">
            HOW IT <span className="accent">WORKS</span>
          </h2>
        </div>

        {/* 3 column layout */}
        <div className="how__layout">

          {/* LEFT — big number + progress */}
          <div className="how__left">
            <span className="how__big-number" ref={activeNumRef}>01</span>
            <div className="how__progress-track">
              <div className="how__progress-bar" ref={progressRef} />
            </div>
          </div>

          {/* CENTER — image */}
          <div
            className="how__center"
            ref={centerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {steps.map((step, i) => (
              <Fragment key={i}>
                {/* base — grayscale */}
                <picture>
                  <source srcSet={step.image800} media="(max-width: 768px)" />
                  <source srcSet={step.image1100} media="(max-width: 1024px)" />
                  <img
                    src={step.image}
                    alt={step.title}
                    className="how__image how__image--base"
                    ref={el => imagesRef.current[i] = el}
                    style={{ opacity: i === 0 ? 1 : 0 }}
                    decoding="async"
                  />
                </picture>

                {/* color — torch spotlight layer */}
                <picture>
                  <source srcSet={step.image800} media="(max-width: 768px)" />
                  <source srcSet={step.image1100} media="(max-width: 1024px)" />
                  <img
                    src={step.image}
                    alt=""
                    aria-hidden="true"
                    className="how__image how__image--color"
                    ref={el => colorImagesRef.current[i] = el}
                    style={{ opacity: i === 0 ? 1 : 0, clipPath: 'circle(0px at 50% 50%)' }}
                    decoding="async"
                  />
                </picture>
              </Fragment>
            ))}
          </div>

          {/* RIGHT — title + desc + circular text */}
          <div className="how__right">

            <div className="how__titles">
              {steps.map((step, i) => (
                <h3
                  key={i}
                  className="how__title"
                  ref={el => titlesRef.current[i] = el}
                  style={{ opacity: i === 0 ? 1 : 0 }}
                >
                  {step.title.split('\n').map((line, j) => (
                    <span key={j}>{line}<br /></span>
                  ))}
                </h3>
              ))}
            </div>

            <div className="how__descs">
              {steps.map((step, i) => (
                <p
                  key={i}
                  className="how__desc"
                  ref={el => descsRef.current[i] = el}
                  style={{ opacity: i === 0 ? 1 : 0 }}
                >
                  {step.desc}
                </p>
              ))}
            </div>
          </div>

        </div>
      </div>

    </section>
  )
}

export default HowItWorks