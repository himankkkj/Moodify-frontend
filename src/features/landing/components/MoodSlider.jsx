import '../styles/moodslider.scss'
import clickSrc from '../../../assets/sounds/hover.wav'

// Pool of 3 instances — rapid hover rotates through them
// so each sound plays fully without cutting the previous
const POOL_SIZE = 3
const audioPool = Array.from({ length: POOL_SIZE }, () => {
  const audio = new Audio(clickSrc)
  audio.volume = 0.35
  return audio
})
let poolIndex = 0

const playClick = () => {
  const audio = audioPool[poolIndex % POOL_SIZE]
  audio.currentTime = 0
  audio.play().catch(() => {})
  poolIndex++
}

// import all mood images
import happyChill from '../../../assets/images/moods/happy_chill.jpg'
import happyNeutral from '../../../assets/images/moods/happy_neutral.jpg'
import happyRomantic from '../../../assets/images/moods/happy_romantic.jpg'
import neutralDisgusted from '../../../assets/images/moods/neutral_disgusted.jpg'
import neutralMelancholic1 from '../../../assets/images/moods/neutral_melancholic1.jpg'
import neutralMelancholic2 from '../../../assets/images/moods/neutral_melancholic2.jpg'
import sadFearful from '../../../assets/images/moods/sad_fearful.jpg'
import sadMelancholic from '../../../assets/images/moods/sad_melancholic.jpg'
import sadNeutral from '../../../assets/images/moods/sad_neutral.jpg'
import surprisedAngry from '../../../assets/images/moods/surprised_angry.jpg'

const images = [
  { src: happyChill,        mood: 'HAPPY'      },
  { src: sadFearful,        mood: 'FEARFUL'    },
  { src: happyRomantic,     mood: 'ROMANTIC'   },
  { src: neutralDisgusted,  mood: 'DISGUSTED'  },
  { src: happyNeutral,      mood: 'NEUTRAL'    },
  { src: sadMelancholic,    mood: 'MELANCHOLIC'},
  { src: surprisedAngry,    mood: 'SURPRISED'  },
  { src: neutralMelancholic1, mood: 'CALM'     },
  { src: sadNeutral,        mood: 'SAD'        },
  { src: neutralMelancholic2, mood: 'LONELY'   },
]

const MoodSlider = () => {
  return (
    <section className="mood-slider" id="moods">

      {/* section label */}
      <div className="mood-slider__label">
        <span>MOODS WE DETECT</span>
      </div>

      {/* marquee track */}
      <div className="mood-slider__wrapper">
        <div className="mood-slider__track">

          {/* render twice for seamless loop */}
          {[...images, ...images].map((img, i) => (
            <div
              className="mood-slider__item"
              key={i}
              onMouseEnter={playClick}
            >
              <div className="mood-slider__img-wrap">
                <img src={img.src} alt={img.mood} />
                {/* mood label on hover */}
                <div className="mood-slider__overlay">
                  <span>{img.mood}</span>
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>

    </section>
  )
}

export default MoodSlider