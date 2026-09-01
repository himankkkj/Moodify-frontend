import React, { useEffect, lazy, Suspense, useState } from 'react'
import { routes } from './routes.jsx'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './features/auth/auth.context.jsx'
import { PlayerProvider } from './features/player/context/player.context'

const DitherCursor = lazy(() => import('./features/shared/components/DitherCursor'))

// ── Audio pool — handles rapid sequential hovers cleanly ──────────────────
let hoverPool = null
let hoverIdx = 0

const getHoverPool = () => {
  if (!hoverPool) {
    hoverPool = Array.from({ length: 4 }, () => {
      const a = new Audio('/sounds/click.wav')
      a.volume = 0.2
      return a
    })
  }
  return hoverPool
}

const playHover = () => {
  const pool = getHoverPool()
  const a = pool[hoverIdx % 4]
  a.currentTime = 0
  a.play().catch(() => {})
  hoverIdx++
}

const INTERACTIVE = 'button, a, [role="button"], input, select, textarea, label'

const App = () => {
  const [showCursor, setShowCursor] = useState(false)

  useEffect(() => {
    const desktop = window.matchMedia('(pointer:fine) and (min-width: 1024px)').matches
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setShowCursor(desktop && !reduceMotion)
  }, [])

  useEffect(() => {
    const isFinePointer = window.matchMedia('(pointer:fine)').matches
    if (!isFinePointer) return

    const handleOver = (e) => {
      if (e.target.closest('[data-no-hover-sound]')) return
      if (e.target.closest(INTERACTIVE)) playHover()
    }

    document.addEventListener('mouseover', handleOver)
    return () => document.removeEventListener('mouseover', handleOver)
  }, [])

  return (
    <AuthProvider>
      <PlayerProvider>
        {showCursor && (
          <Suspense fallback={null}>
            <DitherCursor />
          </Suspense>
        )}
        <RouterProvider router={routes} />
      </PlayerProvider>
    </AuthProvider>
  )
}

export default App