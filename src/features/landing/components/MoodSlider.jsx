import '../styles/moodslider.responsive.scss'

// Pool of 3 instances — rapid hover rotates through them
// so each sound plays fully without cutting the previous
let audioPool = null
let poolIndex = 0

const getPool = () => {
  if (!audioPool) {
    audioPool = Array.from({ length: 3 }, () => {
      const audio = new Audio('/sounds/hover.wav')
      audio.volume = 0.35
      return audio
    })
  }
  return audioPool
}

const playClick = () => {
  const pool = getPool()
  const audio = pool[poolIndex % 3]
  audio.currentTime = 0
  audio.play().catch(() => {})
  poolIndex++
}

// import all mood images
import happyChill600    from '../../../assets/images/moods/happy_chill-600.webp'
import happyChill320    from '../../../assets/images/moods/happy_chill-320.webp'
import happyNeutral600  from '../../../assets/images/moods/happy_neutral-600.webp'
import happyNeutral320  from '../../../assets/images/moods/happy_neutral-320.webp'
import happyRomantic600 from '../../../assets/images/moods/happy_romantic-600.webp'
import happyRomantic320 from '../../../assets/images/moods/happy_romantic-320.webp'
import neutralDisgusted600  from '../../../assets/images/moods/neutral_disgusted-600.webp'
import neutralDisgusted320  from '../../../assets/images/moods/neutral_disgusted-320.webp'
import neutralMelancholic1600 from '../../../assets/images/moods/neutral_melancholic1-600.webp'
import neutralMelancholic1320 from '../../../assets/images/moods/neutral_melancholic1-320.webp'
import neutralMelancholic2600 from '../../../assets/images/moods/neutral_melancholic2-600.webp'
import neutralMelancholic2320 from '../../../assets/images/moods/neutral_melancholic2-320.webp'
import sadFearful600    from '../../../assets/images/moods/sad_fearful-600.webp'
import sadFearful320    from '../../../assets/images/moods/sad_fearful-320.webp'
import sadMelancholic600 from '../../../assets/images/moods/sad_melancholic-600.webp'
import sadMelancholic320 from '../../../assets/images/moods/sad_melancholic-320.webp'
import sadNeutral600    from '../../../assets/images/moods/sad_neutral-600.webp'
import sadNeutral320    from '../../../assets/images/moods/sad_neutral-320.webp'
import surprisedAngry600 from '../../../assets/images/moods/surprised_angry-600.webp'
import surprisedAngry320 from '../../../assets/images/moods/surprised_angry-320.webp'

const images = [
  { src: happyChill600,         src320: happyChill320,         mood: 'HAPPY'       },
  { src: sadFearful600,         src320: sadFearful320,         mood: 'FEARFUL'     },
  { src: happyRomantic600,      src320: happyRomantic320,      mood: 'ROMANTIC'    },
  { src: neutralDisgusted600,   src320: neutralDisgusted320,   mood: 'DISGUSTED'   },
  { src: happyNeutral600,       src320: happyNeutral320,       mood: 'NEUTRAL'     },
  { src: sadMelancholic600,     src320: sadMelancholic320,     mood: 'MELANCHOLIC' },
  { src: surprisedAngry600,     src320: surprisedAngry320,     mood: 'SURPRISED'   },
  { src: neutralMelancholic1600, src320: neutralMelancholic1320, mood: 'CALM'      },
  { src: sadNeutral600,         src320: sadNeutral320,         mood: 'SAD'         },
  { src: neutralMelancholic2600, src320: neutralMelancholic2320, mood: 'LONELY'    },
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
                <picture>
                  <source srcSet={img.src320} media="(max-width: 768px)" />
                  <img
                    src={img.src}
                    alt={img.mood}
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
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