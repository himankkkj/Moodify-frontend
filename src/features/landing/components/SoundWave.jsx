import { useEffect, useRef } from 'react'

const SoundWave = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationId

    // set canvas size
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // wave config
    const waves = [
      { amp: 40,  freq: 0.008, speed: 0.02,  offset: 0,    alpha: 0.15 },
      { amp: 25,  freq: 0.012, speed: 0.015, offset: 2,    alpha: 0.10 },
      { amp: 60,  freq: 0.005, speed: 0.01,  offset: 4,    alpha: 0.08 },
      { amp: 15,  freq: 0.02,  speed: 0.025, offset: 1,    alpha: 0.12 },
      { amp: 35,  freq: 0.009, speed: 0.018, offset: 3,    alpha: 0.07 },
    ]

    let time = 0

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const centerY = canvas.height * 0.65

      waves.forEach((wave) => {
        ctx.beginPath()
        ctx.moveTo(0, centerY)

        for (let x = 0; x <= canvas.width; x += 2) {
          const y = centerY +
            Math.sin(x * wave.freq + time * wave.speed + wave.offset) * wave.amp +
            Math.sin(x * wave.freq * 0.5 + time * wave.speed * 0.7) * (wave.amp * 0.4)

          ctx.lineTo(x, y)
        }

        ctx.strokeStyle = `rgba(200, 16, 46, ${wave.alpha})`  // red accent
        ctx.lineWidth = 1.5
        ctx.stroke()
      })

      time++
      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none',
        opacity: 1
      }}
    />
  )
}

export default SoundWave