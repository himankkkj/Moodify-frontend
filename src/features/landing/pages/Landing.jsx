import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "../../shared/components/Navbar";
import Hero from "../components/Hero";
import MoodSlider from "../components/MoodSlider";
import HowItWorks from "../components/HowItWorks";
import GestureSection from "../components/GestureSection";
import Stats from "../components/Stats";
import CallToAction from "../components/CallToAction";
import Footer from "../../shared/components/Footer";
import AlbumWall from "../components/AlbumWall";

gsap.registerPlugin(ScrollTrigger);

const Landing = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    // ── Sync Lenis scroll position with ScrollTrigger ──────────────────────
    lenis.on("scroll", ScrollTrigger.update);

    // ── Use GSAP ticker instead of manual RAF so timing stays in sync ──────
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => {
      lenis.destroy();
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <main>
      <Navbar />
      <Hero />
      <MoodSlider />
      <HowItWorks />
      <GestureSection />
      <Stats />
      <CallToAction />
      <AlbumWall />
      <Footer />
    </main>
  );
};

export default Landing;