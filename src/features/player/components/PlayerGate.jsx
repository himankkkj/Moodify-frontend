import { useLocation } from 'react-router-dom'
import MusicPlayer from './MusicPlayer.jsx'
import { usePlayerState } from '../context/player.context'

// Routes where the mini-player UI must NEVER show
const HIDE_PLAYER_ON = [
  '/',
  '/login',
  '/register',
  '/verification',
]

export default function PlayerGate() {
  const { pathname } = useLocation()
  const { currentSong } = usePlayerState()

  const hide = HIDE_PLAYER_ON.some(
    (path) => pathname === path || (path !== '/' && pathname.startsWith(path + '/'))
  )

  if (hide || !currentSong) return null

  return <MusicPlayer />
}
