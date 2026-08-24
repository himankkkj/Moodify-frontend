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

// count up hook
const useCountUp = (target, duration = 2, start = false) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!start) return

    const obj = { val: 0 }
    gsap.to(obj, {
      val: target,
      duration,
      ease: 'power2.out',
      onUpdate: () => setCount(Math.floor(obj.val))
    })
  }, [start, target, duration])

  return count
}

// single stat item
const StatItem = ({ value, suffix, label, triggered }) => {
  const count = useCountUp(value, 2, triggered)

  const format = (n) => {
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K'
    return n
  }

  return (
    <div className="stats__item">
      <span className="stats__value">
        {format(count)}{suffix}
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