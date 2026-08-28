import { memo } from 'react'

const MoodBootLoader = memo(({ progress = 0, error = null, onRetry }) => {
  const pct = Math.min(100, Math.max(0, Math.round(progress)))

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      background: 'var(--color-bg, #F5F0E8)', color: 'var(--color-text, #0A0A0A)', padding: '2rem'
    }}>
      <style>{`
        @keyframes bootShine {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        .boot-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: bootShine 1.2s ease-in-out infinite;
        }
      `}</style>

      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 4rem)', margin: '0 0 1rem', textAlign: 'center' }}>
        WHAT'S YOUR <span style={{ color: 'var(--color-accent, #C8102E)' }}>MOOD</span> TODAY?
      </h1>
      
      <p style={{ color: 'var(--color-secondary)', fontSize: '0.9rem', marginBottom: '3rem', textAlign: 'center' }}>
        {error ? error : 'Loading AI Models · Runs locally in your browser'}
      </p>

      {error ? (
        <button 
          onClick={onRetry}
          style={{ padding: '0.8rem 1.5rem', background: '#0A0A0A', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          TRY AGAIN
        </button>
      ) : (
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>
            <span>INITIALIZING ENGINE</span>
            <span style={{ color: 'var(--color-accent)' }}>{pct}%</span>
          </div>
          <div style={{ height: '4px', background: 'rgba(0,0,0,0.08)', width: '100%', overflow: 'hidden', position: 'relative', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-accent, #C8102E)', transition: 'width 0.35s ease-out', position: 'relative', overflow: 'hidden' }}>
              <div className="boot-shimmer" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

MoodBootLoader.displayName = "MoodBootLoader"
export default MoodBootLoader
