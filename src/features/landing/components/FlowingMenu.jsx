// import { useRef, useEffect, useState, forwardRef } from 'react';
// import { gsap } from 'gsap';
// import hoverSound from '../../../assets/sounds/feature-card.wav';
// import '../styles/FlowingMenu.scss';

// // ─── FlowingMenu parent ────────────────────────────────────────────────────────
// function FlowingMenu({
//   items = [],
//   speed = 15,
//   textColor = '#F5F0E8',
//   bgColor = '#0A0A0A',
//   marqueeBgColor = '#C8102E',
//   marqueeTextColor = '#F5F0E8',
//   borderColor = '#1E1E1E',
// }) {
//   const itemRefs = useRef([]);
//   const audioRef = useRef(null);

//   useEffect(() => {
//     audioRef.current = new Audio(hoverSound);
//     audioRef.current.volume = 0.35;
//     return () => {
//       audioRef.current.pause();
//       audioRef.current = null;
//     };
//   }, []);

//   const playSound = () => {
//     if (!audioRef.current) return;
//     audioRef.current.currentTime = 0;
//     audioRef.current.play().catch(() => {});
//   };

//   const handleItemHoverEnter = (hoveredIdx) => {
//     itemRefs.current.forEach((el, idx) => {
//       if (!el) return;
//       gsap.to(el, {
//         flexGrow: idx === hoveredIdx ? 3 : 0.6,
//         duration: 0.55,
//         ease: 'expo.out',
//         overwrite: 'auto',
//       });
//     });
//   };

//   const handleItemHoverLeave = () => {
//     itemRefs.current.forEach((el) => {
//       if (!el) return;
//       gsap.to(el, {
//         flexGrow: 1,
//         duration: 0.55,
//         ease: 'expo.out',
//         overwrite: 'auto',
//       });
//     });
//   };

//   return (
//     <div className="menu-wrap" style={{ backgroundColor: bgColor }}>
//       <nav className="menu">
//         {items.map((item, idx) => (
//           <MenuItem
//             key={idx}
//             {...item}
//             ref={(el) => (itemRefs.current[idx] = el)}
//             speed={speed}
//             textColor={textColor}
//             marqueeBgColor={marqueeBgColor}
//             marqueeTextColor={marqueeTextColor}
//             borderColor={borderColor}
//             onHoverEnter={() => handleItemHoverEnter(idx)}
//             onHoverLeave={handleItemHoverLeave}
//             onPlaySound={playSound}
//           />
//         ))}
//       </nav>
//     </div>
//   );
// }

// // ─── MenuItem ──────────────────────────────────────────────────────────────────
// const MenuItem = forwardRef(function MenuItem(
//   {
//     link,
//     text,
//     image,
//     // hint removed — no longer used
//     speed,
//     textColor,
//     marqueeBgColor,
//     marqueeTextColor,
//     borderColor,
//     onHoverEnter,
//     onHoverLeave,
//     onPlaySound,
//   },
//   forwardedRef
// ) {
//   const itemRef         = useRef(null);
//   const marqueeRef      = useRef(null);
//   const marqueeInnerRef = useRef(null);
//   const animationRef    = useRef(null);
//   const [repetitions, setRepetitions] = useState(4);

//   const animationDefaults = { duration: 0.6, ease: 'expo' };

//   const setRefs = (el) => {
//     itemRef.current = el;
//     if (typeof forwardedRef === 'function') forwardedRef(el);
//     else if (forwardedRef) forwardedRef.current = el;
//   };

//   const distMetric = (x, y, x2, y2) => {
//     const dx = x - x2;
//     const dy = y - y2;
//     return dx * dx + dy * dy;
//   };

//   const findClosestEdge = (mouseX, mouseY, width, height) => {
//     const topDist    = distMetric(mouseX, mouseY, width / 2, 0);
//     const bottomDist = distMetric(mouseX, mouseY, width / 2, height);
//     return topDist < bottomDist ? 'top' : 'bottom';
//   };

//   // ── Repetitions: fill viewport width ──────────────────────────────────────
//   useEffect(() => {
//     const calculateRepetitions = () => {
//       if (!marqueeInnerRef.current) return;
//       const part = marqueeInnerRef.current.querySelector('.marquee__part');
//       if (!part) return;
//       const needed = Math.ceil(window.innerWidth / part.offsetWidth) + 2;
//       setRepetitions(Math.max(4, needed));
//     };

//     calculateRepetitions();
//     window.addEventListener('resize', calculateRepetitions);
//     return () => window.removeEventListener('resize', calculateRepetitions);
//   }, [text, image]);

//   // ── Marquee horizontal animation ───────────────────────────────────────────
//   useEffect(() => {
//     const setupMarquee = () => {
//       if (!marqueeInnerRef.current) return;
//       const part = marqueeInnerRef.current.querySelector('.marquee__part');
//       if (!part || part.offsetWidth === 0) return;

//       if (animationRef.current) animationRef.current.kill();

//       animationRef.current = gsap.to(marqueeInnerRef.current, {
//         x: -part.offsetWidth,
//         duration: speed,
//         ease: 'none',
//         repeat: -1,
//       });
//     };

//     const timer = setTimeout(setupMarquee, 50);
//     return () => {
//       clearTimeout(timer);
//       if (animationRef.current) animationRef.current.kill();
//     };
//   }, [text, image, repetitions, speed]);

//   // ── Mouse handlers ─────────────────────────────────────────────────────────
//   const handleMouseEnter = (ev) => {
//     onPlaySound?.();
//     onHoverEnter?.();

//     if (marqueeRef.current) {
//       gsap.to(marqueeRef.current.querySelectorAll('.marquee__img'), {
//         scale: 1.18,
//         duration: 0.6,
//         ease: 'expo.out',
//         overwrite: 'auto',
//       });
//     }

//     if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
//     const rect = itemRef.current.getBoundingClientRect();
//     const edge = findClosestEdge(
//       ev.clientX - rect.left,
//       ev.clientY - rect.top,
//       rect.width,
//       rect.height
//     );

//     gsap
//       .timeline({ defaults: animationDefaults })
//       .set(marqueeRef.current,      { y: edge === 'top' ? '-101%' : '101%' }, 0)
//       .set(marqueeInnerRef.current, { y: edge === 'top' ? '101%'  : '-101%' }, 0)
//       .to([marqueeRef.current, marqueeInnerRef.current], { y: '0%' }, 0);
//   };

//   const handleMouseLeave = (ev) => {
//     onHoverLeave?.();

//     if (marqueeRef.current) {
//       gsap.to(marqueeRef.current.querySelectorAll('.marquee__img'), {
//         scale: 1,
//         duration: 0.6,
//         ease: 'expo.out',
//         overwrite: 'auto',
//       });
//     }

//     if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
//     const rect = itemRef.current.getBoundingClientRect();
//     const edge = findClosestEdge(
//       ev.clientX - rect.left,
//       ev.clientY - rect.top,
//       rect.width,
//       rect.height
//     );

//     gsap
//       .timeline({ defaults: { ...animationDefaults, overwrite: true } })
//       .to(marqueeRef.current,      { y: edge === 'top' ? '-101%' : '101%' }, 0)
//       .to(marqueeInnerRef.current, { y: edge === 'top' ? '101%'  : '-101%' }, 0);
//   };

//   return (
//     <div className="menu__item" ref={setRefs} style={{ borderColor }}>
//       <a
//         className="menu__item-link"
//         href={link}
//         onClick={(e) => e.preventDefault()}
//         onMouseEnter={handleMouseEnter}
//         onMouseLeave={handleMouseLeave}
//         style={{ color: textColor }}
//       >
//         {text}
//       </a>
//       <div className="marquee" ref={marqueeRef} style={{ backgroundColor: marqueeBgColor }}>
//         <div className="marquee__inner-wrap">
//           <div className="marquee__inner" ref={marqueeInnerRef} aria-hidden="true">
//             {[...Array(repetitions)].map((_, idx) => (
//               <div className="marquee__part" key={idx} style={{ color: marqueeTextColor }}>
//                 <span>{text}</span>
//                 <div
//                   className="marquee__img"
//                   style={{ backgroundImage: `url(${image})` }}
//                 />
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// });

// export default FlowingMenu;

import { useRef, useEffect, useState, forwardRef } from 'react';
import { gsap } from 'gsap';
import hoverSound from '../../../assets/sounds/feature-card.wav';
import '../styles/FlowingMenu.scss';

// ─── FlowingMenu parent ────────────────────────────────────────────────────────
function FlowingMenu({
  items = [],
  speed = 6,
  textColor = '#F5F0E8',
  bgColor = '#0A0A0A',
  marqueeBgColor = '#C8102E',
  marqueeTextColor = '#F5F0E8',
  borderColor = '#1E1E1E',
}) {
  const itemRefs = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio(hoverSound);
    audioRef.current.volume = 0.35;
    return () => {
      audioRef.current.pause();
      audioRef.current = null;
    };
  }, []);

  const playSound = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  };

  const handleItemHoverEnter = (hoveredIdx) => {
    itemRefs.current.forEach((el, idx) => {
      if (!el) return;
      gsap.to(el, {
        flexGrow: idx === hoveredIdx ? 3 : 0.6,
        duration: 0.55,
        ease: 'expo.out',
        overwrite: 'auto',
      });
    });
  };

  const handleItemHoverLeave = () => {
    itemRefs.current.forEach((el) => {
      if (!el) return;
      gsap.to(el, {
        flexGrow: 1,
        duration: 0.55,
        ease: 'expo.out',
        overwrite: 'auto',
      });
    });
  };

  return (
    <div className="menu-wrap" style={{ backgroundColor: bgColor }}>
      <nav className="menu">
        {items.map((item, idx) => (
          <MenuItem
            key={idx}
            {...item}
            ref={(el) => (itemRefs.current[idx] = el)}
            speed={speed}
            textColor={textColor}
            marqueeBgColor={marqueeBgColor}
            marqueeTextColor={marqueeTextColor}
            borderColor={borderColor}
            onHoverEnter={() => handleItemHoverEnter(idx)}
            onHoverLeave={handleItemHoverLeave}
            onPlaySound={playSound}
          />
        ))}
      </nav>
    </div>
  );
}

// ─── MenuItem ──────────────────────────────────────────────────────────────────
const MenuItem = forwardRef(function MenuItem(
  {
    link,
    text,
    image,
    // hint removed — no longer used
    speed,
    textColor,
    marqueeBgColor,
    marqueeTextColor,
    borderColor,
    onHoverEnter,
    onHoverLeave,
    onPlaySound,
  },
  forwardedRef
) {
  const itemRef         = useRef(null);
  const marqueeRef      = useRef(null);
  const marqueeInnerRef = useRef(null);
  const animationRef    = useRef(null);
  const [repetitions, setRepetitions] = useState(4);

  const animationDefaults = { duration: 0.6, ease: 'expo' };

  const setRefs = (el) => {
    itemRef.current = el;
    if (typeof forwardedRef === 'function') forwardedRef(el);
    else if (forwardedRef) forwardedRef.current = el;
  };

  const distMetric = (x, y, x2, y2) => {
    const dx = x - x2;
    const dy = y - y2;
    return dx * dx + dy * dy;
  };

  const findClosestEdge = (mouseX, mouseY, width, height) => {
    const topDist    = distMetric(mouseX, mouseY, width / 2, 0);
    const bottomDist = distMetric(mouseX, mouseY, width / 2, height);
    return topDist < bottomDist ? 'top' : 'bottom';
  };

  // ── Repetitions: fill viewport width ──────────────────────────────────────
  useEffect(() => {
    const calculateRepetitions = () => {
      if (!marqueeInnerRef.current) return;
      const part = marqueeInnerRef.current.querySelector('.marquee__part');
      if (!part) return;
      const needed = Math.ceil(window.innerWidth / part.offsetWidth) + 2;
      setRepetitions(Math.max(4, needed));
    };

    calculateRepetitions();
    window.addEventListener('resize', calculateRepetitions);
    return () => window.removeEventListener('resize', calculateRepetitions);
  }, [text, image]);

  // ── Marquee horizontal animation ───────────────────────────────────────────
  useEffect(() => {
    const setupMarquee = () => {
      if (!marqueeInnerRef.current) return;
      const part = marqueeInnerRef.current.querySelector('.marquee__part');
      if (!part || part.offsetWidth === 0) return;

      if (animationRef.current) animationRef.current.kill();

      animationRef.current = gsap.to(marqueeInnerRef.current, {
        x: -part.offsetWidth,
        duration: speed,
        ease: 'none',
        repeat: -1,
      });
    };

    const timer = setTimeout(setupMarquee, 50);
    return () => {
      clearTimeout(timer);
      if (animationRef.current) animationRef.current.kill();
    };
  }, [text, image, repetitions, speed]);

  // ── Mouse handlers ─────────────────────────────────────────────────────────
  const handleMouseEnter = (ev) => {
    onPlaySound?.();
    onHoverEnter?.();

    if (marqueeRef.current) {
      gsap.to(marqueeRef.current.querySelectorAll('.marquee__img'), {
        scale: 1.18,
        duration: 0.6,
        ease: 'expo.out',
        overwrite: 'auto',
      });
    }

    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(
      ev.clientX - rect.left,
      ev.clientY - rect.top,
      rect.width,
      rect.height
    );

    gsap
      .timeline({ defaults: animationDefaults })
      .set(marqueeRef.current,      { y: edge === 'top' ? '-101%' : '101%' }, 0)
      .set(marqueeInnerRef.current, { y: edge === 'top' ? '101%'  : '-101%' }, 0)
      .to([marqueeRef.current, marqueeInnerRef.current], { y: '0%' }, 0);
  };

  const handleMouseLeave = (ev) => {
    onHoverLeave?.();

    if (marqueeRef.current) {
      gsap.to(marqueeRef.current.querySelectorAll('.marquee__img'), {
        scale: 1,
        duration: 0.6,
        ease: 'expo.out',
        overwrite: 'auto',
      });
    }

    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(
      ev.clientX - rect.left,
      ev.clientY - rect.top,
      rect.width,
      rect.height
    );

    gsap
      .timeline({ defaults: { ...animationDefaults, overwrite: 'auto' } })
      .to(marqueeRef.current,      { y: edge === 'top' ? '-101%' : '101%' }, 0)
      .to(marqueeInnerRef.current, { y: edge === 'top' ? '101%'  : '-101%' }, 0);
  };

  return (
    <div className="menu__item" ref={setRefs} style={{ borderColor }}>
      <a
        className="menu__item-link"
        href={link}
        onClick={(e) => e.preventDefault()}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ color: textColor }}
      >
        {text}
      </a>
      <div className="marquee" ref={marqueeRef} style={{ backgroundColor: marqueeBgColor }}>
        <div className="marquee__inner-wrap">
          <div className="marquee__inner" ref={marqueeInnerRef} aria-hidden="true">
            {[...Array(repetitions)].map((_, idx) => (
              <div className="marquee__part" key={idx} style={{ color: marqueeTextColor }}>
                <span>{text}</span>
                <div
                  className="marquee__img"
                  style={{ backgroundImage: `url(${image})` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default FlowingMenu;