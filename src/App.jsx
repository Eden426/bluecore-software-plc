import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Stats from "./components/Stats";
import AboutPreview from "./components/AboutPreview";
import Services from "./components/Services";
import Portfolio from "./components/Portfolio";
import Testimonials from "./components/Testimonials";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import SupportChat from "./components/SupportChat";
import LegalPage from "./components/LegalPage";
import NotFoundPage from "./components/NotFoundPage";
import Preloader from "./components/Preloader";

const legalPages = new Set(["/privacy", "/terms", "/support"]);
const siteUrl = "https://blue-core.tech";
const routeMetadata = {
  "/": {
    title: "Bluecore Software PLC",
    description: "Bluecore Software PLC designs and supports practical software, web applications, system integrations, AI solutions, and digitization services in Addis Ababa, Ethiopia.",
  },
  "/privacy": {
    title: "Privacy Policy | Bluecore Software PLC",
    description: "Learn how Bluecore Software PLC processes information submitted through this website and its contact form.",
  },
  "/terms": {
    title: "Terms of Use | Bluecore Software PLC",
    description: "Read the terms governing use of the Bluecore Software PLC website and its informational content.",
  },
  "/support": {
    title: "Support | Bluecore Software PLC",
    description: "Contact Bluecore Software PLC for product, project, and website support.",
  },
};

function setMeta(selector, content) {
  document.querySelector(selector)?.setAttribute("content", content);
}

function useRouteMetadata(path) {
  useEffect(() => {
    const metadata = routeMetadata[path];
    const title = metadata?.title ?? "Page Not Found | Bluecore Software PLC";
    const description = metadata?.description ?? "The requested Bluecore Software PLC page could not be found.";
    const canonicalPath = metadata ? path : "/";
    const canonicalUrl = `${siteUrl}${canonicalPath === "/" ? "/" : canonicalPath}`;

    document.title = title;
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonicalUrl);
    setMeta('meta[name="description"]', description);
    setMeta('meta[name="robots"]', metadata ? "index, follow" : "noindex, nofollow");
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', canonicalUrl);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
  }, [path]);
}

export default function App() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const isLegalPage = legalPages.has(path);
  useRouteMetadata(path);

  return (
    <>
      <Preloader />
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Navbar />
      <main id="main-content" tabIndex="-1" className="min-h-screen min-w-0 overflow-x-clip bg-white text-[#0F172A] transition-colors duration-300 dark:bg-[#09090B] dark:text-[#FAFAFA]">
        {isLegalPage ? (
          <LegalPage page={path.slice(1)} />
        ) : path === "/" ? (
          <>
            <Hero /><AboutPreview /><Stats /><Services />
            <Portfolio /><Testimonials /><Contact />
          </>
        ) : <NotFoundPage />}
      </main>
      <Footer />
      <SupportChat />
    </>
  );
}
