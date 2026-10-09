import { useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Stats from "./components/Stats";
import AboutPreview from "./components/AboutPreview";
import Services from "./components/Services";
import Team from "./components/Team";
import Portfolio from "./components/Portfolio";
import Testimonials from "./components/Testimonials";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import SupportChat from "./components/SupportChat";
import LegalPage from "./components/LegalPage";
import ServiceDetail from "./components/ServiceDetail";
import PortfolioDetail from "./components/PortfolioDetail";
import BlogIndex from "./components/BlogIndex";
import BlogPost from "./components/BlogPost";
import NotFoundPage from "./components/NotFoundPage";
import Preloader from "./components/Preloader";
import JsonLd from "./components/JsonLd";
import { services } from "./data/services";
import { portfolio } from "./data/portfolio";
import { portfolioImages } from "./data/portfolioImages";
import { team } from "./data/team";
import { blog } from "./data/blog";
import {
  buildGraph,
  buildOrganization,
  buildPortfolioListGraph,
  buildServiceListGraph,
  buildWebsite,
} from "./lib/structuredData";

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
  "/blog": {
    title: "Blog | Bluecore Software PLC",
    description: "Practical notes from the Bluecore team on software, AI adoption, and digital transformation.",
  },
};

// Resolves a pathname to the page it should render, plus the title/description
// that page needs. Static routes come from routeMetadata above; detail pages
// (a single service, portfolio project, or blog post) are looked up by slug
// from the same data files that drive their section on the homepage, so a
// new entry there becomes a real route automatically.
function resolveRoute(path) {
  if (legalPages.has(path)) {
    return { view: "legal", page: path.slice(1), metadata: routeMetadata[path] };
  }
  if (path === "/") {
    return { view: "home", metadata: routeMetadata["/"] };
  }
  if (path === "/blog") {
    return { view: "blog-index", metadata: routeMetadata["/blog"] };
  }
  if (path.startsWith("/services/")) {
    const slug = path.slice("/services/".length);
    const service = services.find((item) => item.slug === slug);
    if (service) {
      return {
        view: "service-detail",
        service,
        metadata: { title: `${service.title} | Bluecore Software PLC`, description: service.overview?.[0] ?? service.text },
      };
    }
  }
  if (path.startsWith("/portfolio/")) {
    const slug = path.slice("/portfolio/".length);
    const item = portfolio.find((entry) => entry.slug === slug);
    if (item) {
      return {
        view: "portfolio-detail",
        item,
        metadata: { title: `${item.title} | Bluecore Software PLC`, description: item.overview?.[0] ?? item.text },
      };
    }
  }
  if (path.startsWith("/blog/")) {
    const slug = path.slice("/blog/".length);
    const post = blog.find((entry) => entry.slug === slug);
    if (post) {
      return {
        view: "blog-post",
        post,
        metadata: { title: `${post.title} | Bluecore Software PLC`, description: post.description },
      };
    }
  }
  return { view: "not-found", metadata: null };
}

function setMeta(selector, content) {
  document.querySelector(selector)?.setAttribute("content", content);
}

function useRouteMetadata(path, metadata) {
  useEffect(() => {
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
  }, [path, metadata]);
}

// The app is client-rendered only: createRoot() (see main.jsx) fully replaces
// the prerendered DOM on mount rather than hydrating it. The browser's native
// one-time scroll-to-hash (e.g. loading /#portfolio directly) fires against
// the prerendered markup, then gets discarded the moment React replaces the
// tree - the new elements share the same ids, but the browser doesn't re-run
// its fragment scroll for them. Same-page nav clicks (href="/#contact" while
// already on "/") have the same gap: no listener re-applies the scroll on
// hashchange. This effect covers both: it scrolls to the current hash once on
// mount (after the client render has settled) and again on every hashchange.
function useHashScroll(isHomePage) {
  useEffect(() => {
    if (!isHomePage) return undefined;

    // "instant" (not "smooth"): this page has heavy concurrent layout
    // activity on mount (staggered Framer Motion reveals, animated
    // background blobs), which reliably interrupts a smooth scroll fired
    // from an effect - it starts moving, then gets cut off a few pixels in.
    // An instant jump also matches the browser's own (non-JS) fragment-scroll
    // behavior, which this is standing in for.
    const scrollToHash = () => {
      if (!window.location.hash) return;
      document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "instant" });
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, [isHomePage]);
}

export default function App() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const route = resolveRoute(path);
  useRouteMetadata(path, route.metadata);
  useHashScroll(route.view === "home");

  return (
    <>
      <Preloader />
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {/* Organization/WebSite schema, plus the full Service and portfolio
          Project catalog, apply site-wide so any page (not only the
          homepage) carries a complete, machine-readable description of what
          Bluecore does. */}
      <JsonLd
        data={buildGraph([
          buildOrganization(team),
          buildWebsite(),
          buildServiceListGraph(services),
          buildPortfolioListGraph(portfolio),
        ])}
      />
      <Navbar />
      <main id="main-content" tabIndex="-1" className="min-h-screen min-w-0 overflow-x-clip bg-white text-[#0F172A] transition-colors duration-300 dark:bg-[#09090B] dark:text-[#FAFAFA]">
        {route.view === "legal" ? (
          <LegalPage page={route.page} />
        ) : route.view === "home" ? (
          <>
            <Hero /><AboutPreview /><Stats /><Services />
            <Team /><Portfolio /><Testimonials /><Contact />
          </>
        ) : route.view === "service-detail" ? (
          <ServiceDetail service={route.service} />
        ) : route.view === "portfolio-detail" ? (
          <PortfolioDetail item={route.item} image={portfolioImages[route.item.type]} />
        ) : route.view === "blog-index" ? (
          <BlogIndex />
        ) : route.view === "blog-post" ? (
          <BlogPost post={route.post} />
        ) : <NotFoundPage />}
      </main>
      <Footer />
      <SupportChat />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
