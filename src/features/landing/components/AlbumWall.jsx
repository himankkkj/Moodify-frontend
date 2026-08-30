import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import DriftWall from './DriftWall';

import cover1  from '../../../assets/images/albums/album1.webp';
import cover2  from '../../../assets/images/albums/album2.webp';
import cover3  from '../../../assets/images/albums/album3.webp';
import cover4  from '../../../assets/images/albums/album4.webp';
import cover5  from '../../../assets/images/albums/album5.webp';
import cover6  from '../../../assets/images/albums/album6.webp';
import cover7  from '../../../assets/images/albums/album7.webp';
import cover8  from '../../../assets/images/albums/album8.webp';
import cover9  from '../../../assets/images/albums/album9.webp';
import cover10 from '../../../assets/images/albums/album10.webp';
import cover11 from '../../../assets/images/albums/album11.webp';
import cover12 from '../../../assets/images/albums/album12.webp';
import cover13 from '../../../assets/images/albums/album13.webp';
import cover14 from '../../../assets/images/albums/album14.webp';
import cover15 from '../../../assets/images/albums/album15.webp';
import cover16 from '../../../assets/images/albums/album16.webp';
import cover17 from '../../../assets/images/albums/album17.webp';
import cover18 from '../../../assets/images/albums/album18.webp';
import cover19 from '../../../assets/images/albums/album19.webp';
import cover20 from '../../../assets/images/albums/album20.webp';
import cover21 from '../../../assets/images/albums/album21.webp';
import cover22 from '../../../assets/images/albums/album22.webp';
import cover23 from '../../../assets/images/albums/album23.webp';
import cover24 from '../../../assets/images/albums/album24.webp';
import cover25 from '../../../assets/images/albums/album25.webp';

import '../../../shared/styles/driftwall.responsive.scss';

gsap.registerPlugin(ScrollTrigger);

const albumItems = [
  { image: cover1  }, { image: cover2  }, { image: cover3  },
  { image: cover4  }, { image: cover5  }, { image: cover6  },
  { image: cover7  }, { image: cover8  }, { image: cover9  },
  { image: cover10 }, { image: cover11 }, { image: cover12 },
  { image: cover13 }, { image: cover14 }, { image: cover15 },
  { image: cover16 }, { image: cover17 }, { image: cover18 },
  { image: cover19 }, { image: cover20 }, { image: cover21 },
  { image: cover22 }, { image: cover23 }, { image: cover24 },
  { image: cover25 },
];

// Helper hook for responsive JS props
function useWallConfig() {
  const [config, setConfig] = useState(() => {
    if (typeof window === 'undefined') return { cols: 7, w: 220, h: 200 };
    const width = window.innerWidth;
    if (width < 480) return { cols: 3, w: 105, h: 105 }; // Mobile
    if (width < 768) return { cols: 4, w: 130, h: 125 }; // Phablet
    if (width < 1024) return { cols: 5, w: 170, h: 160 }; // Tablet
    return { cols: 7, w: 220, h: 200 }; // Desktop
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 480) setConfig({ cols: 3, w: 105, h: 105 });
      else if (width < 768) setConfig({ cols: 4, w: 130, h: 125 });
      else if (width < 1024) setConfig({ cols: 5, w: 170, h: 160 });
      else setConfig({ cols: 7, w: 220, h: 200 });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return config;
}

export default function AlbumWall() {
  const sectionRef = useRef(null);
  const wallConfig = useWallConfig();

  useEffect(() => {
    gsap.fromTo(
      sectionRef.current,
      { clipPath: 'inset(0 0 100% 0)' },
      {
        clipPath: 'inset(0 0 0% 0)',
        ease:     'expo.out',
        duration: 1.4,
        scrollTrigger: {
          trigger: sectionRef.current,
          start:   'top 90%',
          once:    true,
        },
      }
    );
  }, []);

  return (
    <section
      ref={sectionRef}
      className="album-wall-section"
    >
      <DriftWall
        items={albumItems}
        columns={wallConfig.cols}
        tileWidth={wallConfig.w}
        tileHeight={wallConfig.h}
        gap={12}
        radius={0}
        tilt={10}
        turn={-8}
        perspective={1000}
        depth={80}
        speed={30}
        direction="up"
        variance={0.4}
        parallax={0.3}
        lift={50}
        fade={0.65}
        dim={0.55}
        grayscale={true}
        overlayColor="#0A0A0A"
      />
    </section>
  );
}