import { useEffect, lazy, Suspense } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "../../shared/components/Navbar";
import Hero from "../components/Hero";

const MoodSlider = lazy(() => import("../components/MoodSlider"));
const HowItWorks = lazy(() => import("../components/HowItWorks"));
const GestureSection = lazy(() => import("../components/GestureSection"));
const Stats = lazy(() => import("../components/Stats"));
const CallToAction = lazy(() => import("../components/CallToAction"));
const Footer = lazy(() => import("../../shared/components/Footer"));
const AlbumWall = lazy(() => import("../components/AlbumWall"));

gsap.registerPlugin(ScrollTrigger);

const Landing = () => {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      requestAnimationFrame(() => ScrollTrigger.refresh());
      return;
    }

    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    const lenis = new Lenis({
      // mobile: snappier + cheaper; desktop: premium feel
      duration: isMobile ? 0.8 : 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // these two matter a lot on phones
      touchMultiplier: isMobile ? 1.2 : 1.5,
      syncTouch: false,          // important: don't fight native touch scroll
      syncTouchLerp: 0.075,
      wheelMultiplier: isMobile ? 0.9 : 1,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onVisibility = () => {
      if (document.hidden) lenis.stop();
      else lenis.start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      lenis.destroy();
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <main>
      <Navbar />
      <Hero />
      <Suspense fallback={null}>
        <MoodSlider />
        <HowItWorks />
        <GestureSection />
        <Stats />
        <CallToAction />
        <AlbumWall />
        <Footer />
      </Suspense>
    </main>
  );
};

export default Landing;