import { memo } from 'react'
import { SkipForward, SkipBack, Play, Volume2, Hand } from 'lucide-react'

const CONTROLS = [
  { id: 'next',       Icon: SkipForward, label: 'NEXT SONG',      emoji: '✊', hint: 'Fist' },
  { id: 'prev',       Icon: SkipBack,    label: 'PREVIOUS SONG',  emoji: '✌️', hint: 'Victory' },
  { id: 'togglePlay', Icon: Play,        label: 'PLAY / PAUSE',   emoji: '✋', hint: 'Open palm' },
  { id: 'volumeUp',   Icon: Volume2,     label: 'VOLUME',         emoji: '👆', hint: 'Point up' },
]

const GestureDisplay = memo(({ detectedGesture, isActive, lastAction, hasTrack }) => (
  <div className="gesture-display">
    {/* Status block — centered, red + white */}
    <div className="gesture-display__status">
      <Hand size={20} className="gesture-display__status-icon" strokeWidth={2.25} />
      <p className="gesture-display__status-title">
        {hasTrack ? 'Gesture control ready' : 'No track selected'}
      </p>
      <p className="gesture-display__status-sub">
        {hasTrack ? 'Use hands to control playback' : 'Pick a song to start playing'}
      </p>
    </div>

    <div className="gesture-display__divider" />

    <p className="gesture-display__section">CONTROLS</p>

    <ul className="gesture-display__list">
      {CONTROLS.map(({ id, Icon, label, emoji, hint }) => {
        const isHighlighted = lastAction?.action === id || detectedGesture?.action === id

        return (
          <li
            key={id}
            className={
              'gesture-display__row' +
              (isHighlighted ? ' gesture-display__row--active' : '')
            }
          >
            <Icon size={16} className="gesture-display__row-icon" strokeWidth={2.25} />
            <span className="gesture-display__row-label">{label}</span>
            <span className="gesture-display__row-hint">
              <span className="gesture-display__row-emoji" aria-hidden="true">{emoji}</span>
              {hint}
            </span>
          </li>
        )
      })}
    </ul>
  </div>
))

GestureDisplay.displayName = 'GestureDisplay'
export default GestureDisplay