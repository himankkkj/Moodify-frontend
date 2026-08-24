import React, { useEffect } from 'react'
import { routes } from './routes.jsx'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './features/auth/auth.context.jsx'
import DitherCursor from './features/shared/components/DitherCursor'
import hoverSrc from './assets/sounds/click.wav'

// ── Audio pool — handles rapid sequential hovers cleanly ──────────────────
const POOL_SIZE = 4
const hoverPool = Array.from({ length: POOL_SIZE }, () => {
  const a = new Audio(hoverSrc)
  a.volume = 1  
  return a
})
let hoverIdx = 0

const playHover = () => {
  const a = hoverPool[hoverIdx % POOL_SIZE]
  a.currentTime = 0
  a.play().catch(() => {})
  hoverIdx++
}

const INTERACTIVE = 'button, a, [role="button"], input, select, textarea, label'

const App = () => {

  useEffect(() => {
    const handleOver = (e) => {
      if (e.target.closest('[data-no-hover-sound]')) return
      if (e.target.closest(INTERACTIVE)) playHover()
    }

    document.addEventListener('mouseover', handleOver)
    return () => document.removeEventListener('mouseover', handleOver)
  }, [])

  return (
    <AuthProvider>
      <DitherCursor />
      <RouterProvider router={routes} />
    </AuthProvider>
  )
}

export default App