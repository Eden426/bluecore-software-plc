import { Mail, MapPin, Phone } from "lucide-react";
import logo from "../assets/logo.png";

// ── Social icons (SVG inline — lucide-react doesn't ship WhatsApp/Telegram/Facebook) ──
function WhatsAppIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TelegramIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function FacebookIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
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

const socials = [
  {
    label: "WhatsApp",
    href: "https://wa.me/251978939312",
    Icon: WhatsAppIcon,
    color: "hover:text-[#25D366]",
  },
  {
    label: "Telegram",
    href: "https://t.me/bluecoresoftware",
    Icon: TelegramIcon,
    color: "hover:text-[#229ED9]",
  },
  {
    label: "Facebook",
    href: "https://facebook.com/bluecoresoftware",
    Icon: FacebookIcon,
    color: "hover:text-[#1877F2]",
  },
];

const linkClass =
  "text-slate-300 transition-colors hover:text-white dark:text-[#FAFAFA]/80 dark:hover:text-[#FAFAFA]";

// ── Component ─────────────────────────────────────────────────────────────────
export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0F172A] text-white dark:border-white/[0.08] dark:bg-[#09090B] dark:text-[#FAFAFA]">
      <div className="mx-auto min-w-0 max-w-7xl px-3 py-10 sm:px-5 sm:py-14 lg:px-6">
        <div className="grid gap-10 sm:gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">

          {/* Brand column */}
          <div className="min-w-0 lg:col-span-4">
            <a href="#home" className="inline-block rounded-lg bg-white p-1.5">
              <img
                src={logo}
                alt="Bluecore Software PLC"
                className="h-11 w-auto max-w-[200px] object-contain object-left"
              />
            </a>
            <p className="mt-5 max-w-sm text-pretty text-sm leading-7 text-slate-300 dark:text-[#FAFAFA]/78">
              Bluecore Software PLC builds intelligent software solutions with a
              solid core—design, delivery, and long-term support for businesses
              and institutions.
            </p>

            {/* Social icons */}
            <div className="mt-5 flex items-center gap-3">
              {socials.map(({ label, href, Icon, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-slate-300 transition-colors ${color} hover:border-white/30 dark:border-white/10`}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <nav className="lg:col-span-2" aria-label="Footer quick links">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#8B5E3C]">
              Quick Links
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

          {/* Services */}
          <div className="lg:col-span-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#8B5E3C]">
              Services
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {footerServices.map((item) => (
                <li key={item}>
                  <a href="#services" className={linkClass}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
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
                  href="tel:+251978939312"
                  className={`flex gap-3 ${linkClass}`}
                >
                  <Phone
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#8B5E3C]"
                    aria-hidden
                  />
                  <span>0978 939 312</span>
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/251978939312"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex gap-3 ${linkClass}`}
                >
                  <WhatsAppIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#25D366]" />
                  <span>WhatsApp us</span>
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
                  <span>support.bluecoresoft@gmail.com</span>
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

        {/* Bottom bar */}
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
