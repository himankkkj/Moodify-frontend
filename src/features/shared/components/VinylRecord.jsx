import vinylImg from '../../../assets/images/vinyl/vinyl.png'
import '../styles/vinyl.scss'

const VinylRecord = ({ spinning = true, size = 700 }) => {
  return (
    <div 
      className={`vinyl ${spinning ? 'vinyl--spinning' : ''}`}
      style={{ width: size, height: size }}
    >
      <img src={vinylImg} alt="vinyl record" />
    </div>
  )
}

export default VinylRecord