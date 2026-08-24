import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import FlowingMenu from './FlowingMenu';

import nextSongImg   from '../../../assets/images/gestures/next-song.png';
import playPauseImg  from '../../../assets/images/gestures/play-pause.png';
import previousImg   from '../../../assets/images/gestures/previous.png';
import volumeUpImg   from '../../../assets/images/gestures/volume-up.png';

import '../styles/gesturesection.scss';

gsap.registerPlugin(ScrollTrigger);

const gestureItems = [
  { link: '#', text: 'Next Song',    image: nextSongImg  },
  { link: '#', text: 'Play / Pause', image: playPauseImg },
  { link: '#', text: 'Previous',     image: previousImg  },
  { link: '#', text: 'Volume Up',    image: volumeUpImg  },
];

export default function GestureSection() {
  const sectionRef  = useRef(null);
  const headingRef  = useRef(null);
  const subtitleRef = useRef(null);
  const menuRef     = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headingRef.current.querySelectorAll('.gs__word'), {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'expo.out',
        scrollTrigger: { trigger: headingRef.current, start: 'top 82%' },
      });

      gsap.from(subtitleRef.current, {
        y: 12,
        opacity: 0,
        duration: 0.5,
        ease: 'expo.out',
        scrollTrigger: { trigger: subtitleRef.current, start: 'top 88%' },
      });

      gsap.from('.gesture-section__header-right', {
        x: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: headingRef.current, start: 'top 82%' },
      });

      gsap.from(menuRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'expo.out',
        scrollTrigger: { trigger: menuRef.current, start: 'top 90%' },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const dispatchCursorColor = (color) =>
    window.dispatchEvent(new CustomEvent('moodify:cursor-color', { detail: { color } }));

  return (
    <section
      className="gesture-section"
      ref={sectionRef}
      id="gestures"
      data-no-hover-sound
      onMouseEnter={() => dispatchCursorColor('#F5F0E8')}
      onMouseLeave={() => dispatchCursorColor('#C8102E')}
    >
      <div className="gesture-section__header" ref={headingRef}>
        <div className="gesture-section__header-left">
          <span className="gesture-section__eyebrow" ref={subtitleRef}>
            — Gesture Control
          </span>
          <h2 className="gesture-section__heading">
            <span className="gs__word gesture-section__heading--light">CONTROL WITH </span>
            <span className="gs__word gesture-section__heading--accent">YOUR HANDS</span>
          </h2>
        </div>
        <div className="gesture-section__header-right">
          <p className="gesture-section__desc">
            Show the camera your hand. Moodify handles the rest.
          </p>
          <span className="gesture-section__count">4 gestures</span>
        </div>
      </div>

      <div className="gesture-section__menu" ref={menuRef}>
        <FlowingMenu
          items={gestureItems}
          speed={6}
          bgColor="#0A0A0A"
          textColor="#F5F0E8"
          marqueeBgColor="#C8102E"
          marqueeTextColor="#F5F0E8"
          borderColor="#2A2A2A"
        />
      </div>
    </section>
  );
}