import { useRef, useEffect, useState, forwardRef } from 'react';
import { gsap } from 'gsap';
import hoverSound from '../../../assets/sounds/feature-card.wav';
import '../styles/FlowingMenu.responsive.scss';

// ─── FlowingMenu Parent ────────────────────────────────────────────────────────
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
  const [activeIdx, setActiveIdx] = useState(null);

  useEffect(() => {
    audioRef.current = new Audio(hoverSound);
    audioRef.current.volume = 0.35;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playSound = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  };

  const handleItemActivate = (hoveredIdx) => {
    setActiveIdx(hoveredIdx);
    itemRefs.current.forEach((el, idx) => {
      if (!el) return;
      gsap.to(el, {
        flexGrow: idx === hoveredIdx ? 2.2 : 0.7,
        duration: 0.55,
        ease: 'expo.out',
        overwrite: 'auto',
      });
    });
  };

  const handleItemDeactivate = () => {
    setActiveIdx(null);
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

  // Mobile Tap Handler (Single Tap Toggle)
  const handleItemTap = (clickedIdx) => {
    if (activeIdx === clickedIdx) {
      handleItemDeactivate();
    } else {
      playSound();
      handleItemActivate(clickedIdx);
    }
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
            isActive={activeIdx === idx}
            onHoverEnter={() => handleItemActivate(idx)}
            onHoverLeave={handleItemDeactivate}
            onTap={() => handleItemTap(idx)}
            onPlaySound={playSound}
          />
        ))}
      </nav>
    </div>
  );
}

// ─── MenuItem Component ────────────────────────────────────────────────────────
const MenuItem = forwardRef(function MenuItem(
  {
    link,
    text,
    image,
    speed,
    textColor,
    marqueeBgColor,
    marqueeTextColor,
    borderColor,
    isActive,
    onHoverEnter,
    onHoverLeave,
    onTap,
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

  // Handle GSAP Marquee Slide In / Out cleanly
  useEffect(() => {
    if (!marqueeRef.current || !marqueeInnerRef.current) return;

    if (isActive) {
      gsap.to(marqueeRef.current.querySelectorAll('.marquee__img'), {
        scale: 1.18,
        duration: 0.6,
        ease: 'expo.out',
        overwrite: 'auto',
      });

      gsap
        .timeline({ defaults: animationDefaults })
        .set(marqueeRef.current,      { y: '-101%' }, 0)
        .set(marqueeInnerRef.current, { y: '101%' }, 0)
        .to([marqueeRef.current, marqueeInnerRef.current], { y: '0%' }, 0);
    } else {
      gsap.to(marqueeRef.current.querySelectorAll('.marquee__img'), {
        scale: 1,
        duration: 0.6,
        ease: 'expo.out',
        overwrite: 'auto',
      });

      gsap
        .timeline({ defaults: { ...animationDefaults, overwrite: 'auto' } })
        .to(marqueeRef.current,      { y: '101%' }, 0)
        .to(marqueeInnerRef.current, { y: '-101%' }, 0);
    }
  }, [isActive]);

  // Calculate repetitions to fill screen width
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

  // Infinite horizontal scroll animation
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

  // Mouse Hover Handlers (Isolated to Pointer/Mouse devices only)
  const handleMouseEnter = (e) => {
    // Ignore touch-simulated mouseenter events
    if (e.pointerType === 'touch' || window.matchMedia('(hover: none)').matches) return;
    onPlaySound?.();
    onHoverEnter?.();
  };

  const handleMouseLeave = (e) => {
    if (e.pointerType === 'touch' || window.matchMedia('(hover: none)').matches) return;
    onHoverLeave?.();
  };

  return (
    <div className="menu__item" ref={setRefs} style={{ borderColor }}>
      <a
        className="menu__item-link"
        href={link}
        onClick={(e) => {
          e.preventDefault();
          onTap?.();
        }}
        onPointerEnter={handleMouseEnter}
        onPointerLeave={handleMouseLeave}
        style={{ color: textColor }}
      >
        {text}
      </a>
      <div
        className="marquee"
        ref={marqueeRef}
        style={{ backgroundColor: marqueeBgColor }}
        onClick={(e) => {
          e.stopPropagation();
          onTap?.();
        }}
      >
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