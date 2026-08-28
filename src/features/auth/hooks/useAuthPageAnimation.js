import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'

export function useAuthPageAnimation(deps = []) {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const items = root.querySelectorAll('[data-auth-animate]')

    if (reduce) {
      gsap.set(items, { opacity: 1, y: 0 })
      return
    }

    const ctx = gsap.context(() => {
      gsap.set(items, { opacity: 0, y: 14 })

      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.45,
        stagger: 0.06,
        ease: 'power2.out',
        clearProps: 'transform',
      })
    }, root)

    return () => ctx.revert()
  }, deps)

  return rootRef
}

export async function animateOut(rootEl) {
  if (!rootEl) return
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) return

  await gsap.to(rootEl, {
    opacity: 0,
    y: -8,
    duration: 0.25,
    ease: 'power2.in',
  })
}
