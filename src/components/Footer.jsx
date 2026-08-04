import { Mail, MapPin, Phone } from "lucide-react";
import logo from "../assets/logo.png";

const footerNav = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About Us" },
  { href: "#services", label: "Services" },
  { href: "#portfolio", label: "Portfolio" },
  { href: "#contact", label: "Contact" },
];

const footerServices = [
  "Custom Software",
  "System Integration",
  "Digitization Support",
  "AI Solutions",
  "Cloud & DevOps",
];

const linkClass =
  "text-slate-300 transition-colors hover:text-white dark:text-[#FAFAFA]/80 dark:hover:text-[#FAFAFA]";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0F172A] text-white dark:border-white/[0.08] dark:bg-[#09090B] dark:text-[#FAFAFA]">
      <div className="mx-auto min-w-0 max-w-7xl px-3 py-10 sm:px-5 sm:py-14 lg:px-6">
        <div className="grid gap-10 sm:gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <div className="min-w-0 lg:col-span-4">
            <a href="#home" className="inline-block rounded-lg bg-white p-1.5">
              <img
                src={logo}
                alt="Bluecore Software PLC"
                width={600}
                height={200}
                loading="lazy"
                className="h-11 w-auto max-w-[200px] object-contain object-left"
              />
            </a>
            <p className="mt-5 max-w-sm text-pretty text-sm leading-7 text-slate-300 dark:text-[#FAFAFA]/78">
              Bluecore Software PLC builds intelligent software solutions with a
              solid core—design, delivery, and long-term support for businesses
              and institutions.
            </p>
          </div>

          <nav className="lg:col-span-2" aria-label="Footer quick links">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#8B5E3C]">
              Explore
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {footerNav.map(({ href, label }) => (
                <li key={href}>
                  <a href={href} className={linkClass}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#8B5E3C]">
              Services
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-300 dark:text-[#FAFAFA]/80">
              {footerServices.map((item) => (
                <li key={item}>
                  <a href="#services" className={linkClass}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#8B5E3C]">
              Contact
            </h2>
            <ul className="mt-4 space-y-4 text-sm">
              <li>
                <a
                  href="https://maps.google.com/?q=Addis+Ababa+Ethiopia"
                  className={`flex gap-3 ${linkClass}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#8B5E3C]"
                    aria-hidden
                  />
                  <span>Addis Ababa, Ethiopia</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+251911234567"
                  className={`flex gap-3 ${linkClass}`}
                >
                  <Phone
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#8B5E3C]"
                    aria-hidden
                  />
                  <span>+251 911 234 567</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@bluecoresoft.com"
                  className={`flex gap-3 break-all ${linkClass}`}
                >
                  <Mail
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#8B5E3C]"
                    aria-hidden
                  />
                  <span>info@bluecoresoft.com</span>
                </a>
              </li>
            </ul>
            <a
              href="#contact"
              className="mt-6 inline-flex rounded-xl bg-[#8B5E3C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#A0694A]"
            >
              Get in touch
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-slate-400 dark:border-white/[0.08] dark:text-[#FAFAFA]/50 sm:flex-row sm:text-sm">
          <p>
            © {new Date().getFullYear()} Bluecore Software PLC. All rights
            reserved.
          </p>
          <nav
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
            aria-label="Legal"
          >
            <a href="#contact" className={linkClass}>
              Privacy
            </a>
            <a href="#contact" className={linkClass}>
              Terms
            </a>
            <a href="#contact" className={linkClass}>
              Support
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
