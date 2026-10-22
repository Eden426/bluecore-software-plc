import { Shield, Scale, HelpCircle, Cookie, Mail, Phone } from "lucide-react";
import { openCookieBanner } from "../lib/analytics";

const content = {
  privacy: {
    title: "Privacy Policy & Data Protection Notice",
    icon: Shield,
    lastUpdated: "October 15, 2026",
    summary:
      "Bluecore Software PLC is committed to protecting your privacy and ensuring transparent processing of your personal information in compliance with applicable commercial data protection laws and international privacy standards.",
    sections: [
      {
        id: "controller",
        title: "1. Data Controller & Statutory Identification",
        paragraphs: [
          "This website (blue-core.tech) is owned and operated by Bluecore Software PLC, a private limited company duly incorporated and registered under the laws of the Federal Democratic Republic of Ethiopia.",
          "Principal Place of Business & Registered Office: Addis Ababa, Ethiopia.",
          "Commercial Registration & Business License No.: AACATB/14/672/50471350/2018, issued by the Addis Ababa City Trade Bureau.",
          "Official Contact for Data Privacy Matters: team@blue-core.tech, telephone: +251 978 939 312.",
        ],
      },
      {
        id: "data-collected",
        title: "2. Information We Collect",
        paragraphs: [
          "We collect personal information through two primary mechanisms: information you provide to us directly, and information collected automatically through privacy-respecting website analytics.",
        ],
        list: [
          "Information Provided Directly: When you submit our website contact form or communicate with us via email, telephone, WhatsApp, or Telegram, we may collect your name, email address, company or institutional affiliation, telephone number, and the contents of your message.",
          "Cookieless Analytics Telemetry: We use Vercel Web Analytics to collect aggregated, privacy-preserving metrics such as page paths, referrer URLs, browser type, operating system category, and country of origin. Vercel Web Analytics operates completely without cookies and does not collect or store any personal data or persistent visitor identifiers.",
          "Google Analytics 4 (GA4): Subject to your consent, we utilize Google Analytics 4 (Measurement ID: G-VVMVSLLBVB) to gather pseudonymous telemetry, including first-party cookie identifiers, truncated/anonymized IP addresses, session duration, interaction events (e.g., CTA clicks, content engagement, navigation flows), and approximate geographic location.",
        ],
      },
      {
        id: "purposes-legal-basis",
        title: "3. Purposes and Legal Bases for Processing",
        paragraphs: [
          "We process your data strictly for legitimate business, contractual, and technical purposes:",
        ],
        list: [
          "Responding to Business Inquiries: Processing contact form inquiries to evaluate potential software engineering projects, provide architectural advice, and communicate pre-contractual proposals (Legal Basis: Legitimate commercial interest and taking requested pre-contractual steps).",
          "Website Performance & Optimization: Evaluating user engagement patterns, optimizing load times, and enhancing accessibility across devices (Legal Basis: Legitimate interest for cookieless telemetry; explicit consent for cookie-based Google Analytics 4).",
          "Security & Fraud Prevention: Protecting our infrastructure, preventing spam, mitigating denial-of-service risks, and enforcing our terms (Legal Basis: Legitimate security interest and compliance with statutory obligations).",
        ],
      },
      {
        id: "cookies",
        title: "4. Cookies and Local Storage Technologies",
        paragraphs: [
          "Cookies are small text files placed on your device to assist with site navigation, remember preferences, and analyze website usage. We utilize minimal cookies and local storage items:",
        ],
        table: [
          {
            name: "theme",
            type: "Local Storage (Essential)",
            purpose: "Remembers your light or dark visual theme selection across pages.",
            duration: "Persistent",
          },
          {
            name: "bluecore_cookie_consent",
            type: "Local Storage (Essential)",
            purpose: "Stores your analytics and cookie consent preference (accepted or declined).",
            duration: "1 year",
          },
          {
            name: "_ga",
            type: "First-Party Cookie (Analytics)",
            purpose: "Google Analytics 4 identifier used to distinguish pseudonymous visitors and sessions.",
            duration: "2 years",
          },
          {
            name: "_ga_VVMVSLLBVB",
            type: "First-Party Cookie (Analytics)",
            purpose: "Google Analytics 4 container cookie used to persist session state.",
            duration: "2 years",
          },
        ],
        callout: {
          title: "Managing Your Cookie Preferences",
          text: "You can change or withdraw your cookie consent at any time. When you select 'Essential Only', Google Analytics 4 is completely disabled and only cookieless essential functions remain active.",
          actionText: "Update Cookie Settings",
          actionType: "open-cookie-banner",
        },
      },
      {
        id: "third-parties",
        title: "5. Third-Party Service Providers & Processors",
        paragraphs: [
          "We do not sell, rent, or trade your personal data. We engage vetted service providers who process data strictly on our behalf under secure processing agreements:",
        ],
        list: [
          "Vercel Inc. (USA): Provides edge application hosting, content delivery network (CDN), and cookieless web analytics under strict data privacy safeguards.",
          "Google LLC (USA): Provides Google Analytics 4 services. Google processes analytics data in accordance with Google's Data Processing Terms and Standard Contractual Clauses (SCCs).",
          "Resend Inc. (USA): Provides transactional email transmission infrastructure used to securely relay website contact form submissions to our engineering and management team.",
        ],
      },
      {
        id: "retention",
        title: "6. Data Retention",
        paragraphs: [
          "We retain personal data only for as long as necessary to fulfill the purposes for which it was gathered:",
          "Inquiries submitted through the contact form are retained for up to three (3) years to manage business correspondence, client relations, and commercial records.",
          "Google Analytics 4 event and user data is automatically set to standard retention (up to 14 months) before automated deletion by Google.",
        ],
      },
      {
        id: "rights",
        title: "7. Your Rights as a Data Subject",
        paragraphs: [
          "Depending on your jurisdiction and in accordance with international data protection frameworks, you have specific rights concerning your personal data:",
        ],
        list: [
          "Right of Access: You may request confirmation of whether we process your personal data and receive a copy thereof.",
          "Right to Rectification: You may request prompt correction of inaccurate or incomplete personal information.",
          "Right to Erasure: You may request the deletion of your personal data where it is no longer required for its original purpose.",
          "Right to Restrict or Object: You may object to or request restriction of data processing based on our legitimate interests.",
          "Right to Withdraw Consent: Where processing relies on consent (such as analytics cookies), you may withdraw consent at any time without affecting prior lawful processing.",
        ],
        paragraphsAfter: [
          "To exercise any of these statutory rights, please contact our privacy team at team@blue-core.tech.",
        ],
      },
      {
        id: "security",
        title: "8. Data Security Safeguards",
        paragraphs: [
          "We employ industry-standard administrative, physical, and technical safeguards to protect your personal data. All traffic to and from blue-core.tech is encrypted in transit using modern Transport Layer Security (TLS/HTTPS). Internal access to inquiry data is strictly limited to authorized personnel with a business need.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Use & Statutory Disclosures",
    icon: Scale,
    lastUpdated: "October 15, 2026",
    summary:
      "These Terms of Use govern your access to and use of the Bluecore Software PLC website and contain mandatory statutory corporate disclosures mandated under commercial and electronic commerce regulations.",
    sections: [
      {
        id: "statutory-disclosure",
        title: "1. Mandatory Statutory Corporate Disclosures (Legal Notice / Impressum)",
        paragraphs: [
          "In accordance with the Ethiopian Commercial Code, the Electronic Signature and Electronic Commerce Proclamation (Proclamation No. 1205/2020), and international electronic commerce transparency standards, the following mandatory legal disclosures are provided:",
        ],
        list: [
          "Registered Corporate Name: Bluecore Software PLC",
          "Legal Form: Private Limited Company (PLC) registered under the laws of the Federal Democratic Republic of Ethiopia",
          "Principal Place of Business & Registered Office: Addis Ababa, Ethiopia",
          "Commercial Registration & Business License No.: AACATB/14/672/50471350/2018",
          "Supervisory & Licensing Authority: Addis Ababa City Trade Bureau",
          "Authorized Representatives: Management Board of Bluecore Software PLC",
          "Official Contact Email: team@blue-core.tech",
          "Official Telephone: +251 978 939 312",
          "Primary Business Activities: Custom software engineering, enterprise system integration, digital transformation, cloud architecture, and artificial intelligence solutions",
        ],
      },
      {
        id: "acceptance",
        title: "2. Acceptance of Terms",
        paragraphs: [
          "By accessing, browsing, or interacting with this website (blue-core.tech), you acknowledge that you have read, understood, and agree to be bound by these Terms of Use and our Privacy Policy. If you do not agree to these terms, you must refrain from using this website.",
        ],
      },
      {
        id: "informational-purpose",
        title: "3. Informational Scope & No Binding Contractual Offer",
        paragraphs: [
          "The contents of this website are presented exclusively for general informational and marketing purposes to introduce the services, technical capabilities, and portfolio of Bluecore Software PLC.",
          "Nothing contained on this website constitutes a formal binding contractual offer, software license, or warranty of delivery. Professional engineering services, technical deliverables, timelines, pricing, and service level agreements (SLAs) are governed exclusively by separately executed written Master Services Agreements (MSAs) or Statements of Work (SOWs).",
        ],
      },
      {
        id: "intellectual-property",
        title: "4. Intellectual Property Rights",
        paragraphs: [
          "All intellectual property rights in and to this website—including source code, visual design, user experience workflows, trademarks, brand names, logos, written text, graphics, and portfolio case studies—are the exclusive property of Bluecore Software PLC or its respective licensors.",
          "You are granted a limited, revocable, non-exclusive license to view and navigate this website for personal or internal business evaluation purposes. You may not reproduce, distribute, modify, create derivative works of, publicly display, or reverse engineer any part of this website without prior express written authorization from Bluecore Software PLC.",
        ],
      },
      {
        id: "acceptable-use",
        title: "5. Acceptable Use and Prohibited Activities",
        paragraphs: [
          "When using this website, you agree to comply with all applicable local, national, and international laws and regulations. You specifically agree not to:",
        ],
        list: [
          "Transmit any unlawful, defamatory, harassing, fraudulent, or malicious material through contact forms or interactive channels.",
          "Introduce viruses, worms, Trojan horses, or other technologically harmful or malicious code.",
          "Engage in unauthorized automated data extraction, web scraping, crawling, or systematic retrieval of website content without prior written permission.",
          "Attempt to bypass, disable, or interfere with security features, edge rate-limiting mechanisms, or the proper functioning of the site.",
        ],
      },
      {
        id: "third-party-links",
        title: "6. External Links & Third-Party Platforms",
        paragraphs: [
          "This website may include hyperlinks to external third-party websites or services (e.g., client projects such as SchoolBridge, social networks, developer platforms). Bluecore Software PLC has no control over and assumes no legal responsibility for the content, privacy policies, or practices of third-party platforms.",
        ],
      },
      {
        id: "disclaimer",
        title: "7. Disclaimer of Warranties",
        paragraphs: [
          "This website and all its contents are provided on an 'as is' and 'as available' basis without warranties of any kind, whether express, implied, or statutory. Bluecore Software PLC expressly disclaims all warranties, including but not limited to merchantability, fitness for a particular purpose, non-infringement, accuracy, and uninterrupted or error-free availability.",
        ],
      },
      {
        id: "liability",
        title: "8. Limitation of Liability",
        paragraphs: [
          "To the maximum extent permitted by applicable law, Bluecore Software PLC, its directors, officers, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, goodwill, or business interruption arising out of or related to your use of or inability to use this website.",
        ],
      },
      {
        id: "governing-law",
        title: "9. Governing Law and Dispute Resolution",
        paragraphs: [
          "These Terms of Use, their validity, interpretation, and any disputes arising out of or relating to your use of this website shall be governed by and construed in accordance with the substantive laws of the Federal Democratic Republic of Ethiopia.",
          "Any legal dispute, controversy, or claim arising out of or in connection with these Terms shall be submitted to the exclusive jurisdiction of the competent courts of Addis Ababa, Ethiopia.",
        ],
      },
      {
        id: "amendments",
        title: "10. Amendments and Severability",
        paragraphs: [
          "We reserve the right to amend or update these Terms of Use at our sole discretion. Any changes take effect immediately upon being posted to this page. If any provision of these Terms is deemed invalid or unenforceable by a court of competent jurisdiction, the remaining provisions shall remain in full force and effect.",
        ],
      },
    ],
  },
  support: {
    title: "Customer Support & Service Contacts",
    icon: HelpCircle,
    lastUpdated: "October 15, 2026",
    summary:
      "Bluecore Software PLC provides support channels for our software platforms, active project engagements, and website visitors.",
    sections: [
      {
        id: "contact-channels",
        title: "1. Official Support Channels",
        paragraphs: [
          "For technical assistance, project inquiries, or service requests, you can contact our support and engineering team directly through the following official channels:",
        ],
        list: [
          "Email Support: team@blue-core.tech (Monitored business days, 8:30 AM – 5:30 PM EAT)",
          "Telephone Support: +251 978 939 312",
          "Physical Office: Addis Ababa, Ethiopia",
        ],
      },
      {
        id: "assistant",
        title: "2. Quick-Help Automated Assistant Notice",
        paragraphs: [
          "The interactive quick-help assistant available on this website provides immediate automated answers to common questions about our services and delivery workflow.",
          "The quick-help assistant is an informational tool and does not generate binding contractual commitments or automatically open a formalized SLA support ticket. For formal enterprise support, please contact us via email or telephone.",
        ],
      },
      {
        id: "slas",
        title: "3. Service Level Agreements (SLAs)",
        paragraphs: [
          "General inquiries submitted via our contact form or email are typically answered within one (1) to two (2) business days.",
          "Critical support commitments, system uptime guarantees, and emergency response escalation pathways are governed strictly by individual client Service Level Agreements (SLAs) entered into under executed Master Services Agreements.",
        ],
      },
    ],
  },
};

export default function LegalPage({ page }) {
  const item = content[page] || content.privacy;
  const PageIcon = item.icon || Shield;

  return (
    <article className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
      {/* Header Badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8B5E3C]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#8B5E3C] dark:bg-[#8B5E3C]/20">
          <PageIcon className="h-3.5 w-3.5" aria-hidden />
          Bluecore Software PLC
        </span>
      </div>

      <h1 className="mt-4 text-3xl font-black text-[#06243f] dark:text-white sm:text-5xl">
        {item.title}
      </h1>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-white/60">
        <span>Last updated: {item.lastUpdated}</span>
        <span>•</span>
        <span>Addis Ababa, Ethiopia</span>
      </div>

      {item.summary && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80 sm:p-5 sm:text-base sm:leading-7">
          {item.summary}
        </div>
      )}

      {/* Quick In-Page Table of Contents Navigation */}
      {item.sections && (
        <nav
          aria-label="Table of Contents"
          className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0F172A]/40"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
            Contents
          </p>
          <ul className="mt-2.5 flex flex-wrap gap-2 text-xs">
            {item.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-white/[0.08] dark:text-white/90 dark:hover:bg-white/15"
                >
                  {section.title.replace(/^\d+\.\s*/, "")}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Structured Sections */}
      <div className="mt-10 space-y-12">
        {item.sections ? (
          item.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#06243f] dark:text-white sm:text-2xl">
                {section.title}
              </h2>

              <div className="mt-4 space-y-3.5 text-base leading-7 text-slate-700 dark:text-white/80">
                {section.paragraphs?.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              {section.list && (
                <ul className="mt-4 space-y-2.5 pl-5 text-sm leading-6 text-slate-700 dark:text-white/80 sm:text-base">
                  {section.list.map((itemText, idx) => (
                    <li key={idx} className="list-disc pl-1">
                      {itemText}
                    </li>
                  ))}
                </ul>
              )}

              {section.paragraphsAfter && (
                <div className="mt-4 space-y-3.5 text-base leading-7 text-slate-700 dark:text-white/80">
                  {section.paragraphsAfter.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
              )}

              {/* Table of Cookies / Items if provided */}
              {section.table && (
                <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="border-b border-slate-200 bg-slate-100 text-[#06243f] dark:border-white/10 dark:bg-white/[0.06] dark:text-white">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Identifier</th>
                          <th className="px-4 py-3 font-semibold">Type</th>
                          <th className="px-4 py-3 font-semibold">Purpose</th>
                          <th className="px-4 py-3 font-semibold">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-white/10 dark:text-white/80">
                        {section.table.map((row) => (
                          <tr key={row.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                            <td className="px-4 py-3 font-mono font-medium text-[#154187] dark:text-[#93C5FD]">
                              {row.name}
                            </td>
                            <td className="px-4 py-3">{row.type}</td>
                            <td className="px-4 py-3">{row.purpose}</td>
                            <td className="px-4 py-3">{row.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Callout Action */}
              {section.callout && (
                <div className="mt-6 rounded-2xl border border-[#8B5E3C]/30 bg-[#8B5E3C]/5 p-5 dark:border-[#8B5E3C]/40 dark:bg-[#8B5E3C]/10">
                  <h3 className="text-sm font-bold text-[#06243f] dark:text-white sm:text-base">
                    {section.callout.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-white/75 sm:text-sm">
                    {section.callout.text}
                  </p>
                  {section.callout.actionType === "open-cookie-banner" && (
                    <button
                      type="button"
                      onClick={openCookieBanner}
                      className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-[#8B5E3C] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#A0694A] sm:text-sm"
                    >
                      <Cookie className="h-4 w-4" aria-hidden />
                      {section.callout.actionText}
                    </button>
                  )}
                </div>
              )}
            </section>
          ))
        ) : (
          <div className="space-y-5 text-base leading-8 text-slate-700 dark:text-white/80">
            {item.paragraphs?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}
      </div>

      {/* Support Details Callout if on Support Page */}
      {page === "support" && (
        <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-white/[0.04]">
          <h2 className="text-base font-bold text-[#06243f] dark:text-white sm:text-lg">
            Direct Engineering &amp; Support Contact
          </h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:gap-6">
            <a
              className="inline-flex items-center gap-2 font-bold text-[#154187] underline hover:text-[#06243f] dark:text-[#93C5FD] dark:hover:text-white"
              href="tel:+251978939312"
            >
              <Phone className="h-4 w-4" />
              +251 978 939 312
            </a>
            <a
              className="inline-flex items-center gap-2 font-bold text-[#154187] underline hover:text-[#06243f] dark:text-[#93C5FD] dark:hover:text-white"
              href="mailto:team@blue-core.tech"
            >
              <Mail className="h-4 w-4" />
              team@blue-core.tech
            </a>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 dark:border-white/10">
        <a
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#154187] underline hover:text-[#06243f] dark:text-[#93C5FD] dark:hover:text-white"
          href="/"
        >
          ← Return to the website
        </a>

        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-white/60">
          <a href="/privacy" className="hover:underline">
            Privacy Policy
          </a>
          <span>•</span>
          <a href="/terms" className="hover:underline">
            Terms of Use
          </a>
          <span>•</span>
          <a href="/support" className="hover:underline">
            Support
          </a>
        </div>
      </div>
    </article>
  );
}
