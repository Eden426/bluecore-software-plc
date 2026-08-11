const content = {
  privacy: {
    title: "Privacy Policy",
    paragraphs: [
      "This website provides information about Bluecore Software PLC and a way to contact the company.",
      "When you submit the contact form, Bluecore may process the name, contact details, company name, and message you provide voluntarily so the team can respond to your enquiry.",
      "Form submissions are delivered using EmailJS, a third-party email delivery provider. Information you submit may therefore be processed by that provider as part of delivering your message.",
      "You may contact Bluecore to ask about information you previously submitted. Avoid including sensitive or confidential information in the contact form.",
    ],
  },
  terms: {
    title: "Terms of Use",
    paragraphs: [
      "This website is provided for general information about Bluecore Software PLC and its software services.",
      "Website content may be updated without notice. Project scope, pricing, delivery arrangements, and support terms are agreed separately for each engagement.",
      "You may not misuse this website, interfere with its operation, or submit unlawful or harmful material through its forms.",
      "Links to third-party services are provided for convenience. Those services operate under their own terms and policies.",
    ],
  },
  support: {
    title: "Support",
    paragraphs: [
      "For product, project, or website support, contact Bluecore using the details below. Please describe the issue and include only the information needed to understand it.",
      "The website quick-help assistant provides automated answers to common questions. It is not a live support channel and does not submit a support ticket.",
      "Response timing depends on the nature of the request and current team availability. Any project-specific support arrangements are governed by the applicable agreement.",
    ],
  },
};

export default function LegalPage({ page }) {
  const item = content[page];
  return (
    <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-sm font-bold uppercase tracking-widest text-[#8B5E3C]">Bluecore Software PLC</p>
      <h1 className="mt-3 text-3xl font-black text-[#06243f] dark:text-white sm:text-5xl">{item.title}</h1>
      <p className="mt-3 text-sm text-slate-500 dark:text-white/60">Last updated: July 18, 2026</p>
      <div className="mt-8 space-y-5 text-base leading-8 text-slate-700 dark:text-white/80">
        {item.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
      {page === "support" && <div className="mt-8 rounded-2xl bg-slate-100 p-5 dark:bg-white/[0.06]"><p><a className="font-bold text-[#154187] underline dark:text-[#93C5FD]" href="tel:+251978939312">+251 978 939 312</a></p><p className="mt-2"><a className="font-bold text-[#154187] underline dark:text-[#93C5FD]" href="mailto:team@blue-core.tech">team@blue-core.tech</a></p></div>}
      <a className="mt-10 inline-flex font-bold text-[#154187] underline dark:text-[#93C5FD]" href="/">Return to the website</a>
    </article>
  );
}
