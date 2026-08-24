import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import '../styles/stats.scss'

gsap.registerPlugin(ScrollTrigger)

const stats = [
  { value: 500000, suffix: '+', label: 'SONGS AVAILABLE' },
  { value: 7,      suffix: '',  label: 'MOODS DETECTED'  },
  { value: 95,     suffix: '%', label: 'DETECTION ACCURACY' },
]

// single stat item
const StatItem = ({ value, suffix, label, triggered }) => {
  const valueRef = useRef(null)

  const format = (n) => {
    if (n >= 1000) return Math.floor(n / 1000) + 'K'
    return Math.floor(n)
  }

  useEffect(() => {
    if (!triggered || !valueRef.current) return

    const obj = { val: 0 }
    gsap.to(obj, {
      val: value,
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => {
        if (valueRef.current) {
          valueRef.current.textContent = format(obj.val) + suffix
        }
      }
    })
  }, [triggered])

  return (
    <div className="stats__item">
      <span className="stats__value" ref={valueRef}>
        0{suffix}
      </span>
      <div className="stats__divider" />
      <span className="stats__label">{label}</span>
    </div>
  )
}

const Stats = () => {
  const sectionRef = useRef(null)
  const [triggered, setTriggered] = useState(false)

  useEffect(() => {
    const ctx = gsap.context(() => {

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 75%',
        onEnter: () => setTriggered(true)
      })

      gsap.fromTo(sectionRef.current.children,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
          }
        }
      )

    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section className="stats">
      <div className="container">
        <div className="stats__grid" ref={sectionRef}>
          {stats.map((s, i) => (
            <StatItem key={i} {...s} triggered={triggered} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Stats