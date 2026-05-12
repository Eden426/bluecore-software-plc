import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import AboutSection from "./components/AboutSection";
import Stats from "./components/Stats";
import AboutPreview from "./components/AboutPreview";
import Services from "./components/Services";
import Portfolio from "./components/Portfolio";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

export default function App() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen min-w-0 overflow-x-clip bg-white text-[#0f172a] dark:bg-[#09090B] dark:text-[#FAFAFA]">
        <Hero />
        <AboutSection />
        <Stats />
        <AboutPreview />
        <Services />
        <Portfolio />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
