import { useLayoutEffect } from "react";

import Preloader from "./components/Preloader";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import AboutSection from "./components/AboutSection";
import Stats from "./components/Stats";
import AboutPreview from "./components/AboutPreview";
import Services from "./components/Services";
import Portfolio from "./components/Portfolio";
import Testimonials from "./components/Testimonials";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import SupportChat from "./components/SupportChat";

export default function App() {
  useLayoutEffect(() => {
    // Open the landing page in dark mode by default.
    // White mode still works when the user clicks the theme button.
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <>
      <Preloader />

      <Navbar />

      <main className="min-h-screen min-w-0 overflow-x-clip bg-white text-[#0f172a] transition-colors duration-300 dark:bg-[#09090B] dark:text-[#FAFAFA]">
        <Hero />
        <AboutSection />
        <Stats />
        <AboutPreview />
        <Services />
        <Portfolio />
        <Testimonials />
        <Contact />
      </main>

      <Footer />

      {/* Floating AI support chat — rendered outside main so it overlays everything */}
      <SupportChat />
    </>
  );
}
