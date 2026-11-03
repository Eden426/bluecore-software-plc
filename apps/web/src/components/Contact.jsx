import { useRef, useState } from "react";
import { CONTACT_LIMITS, validateContact } from "../lib/contactValidation";
import { Mail, Phone, MapPin, Clock, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { trackContactSubmission, trackDirectContact } from "../lib/analytics";

const initialForm = { name: "", email: "", company: "", message: "", website: "" };

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle");
  const [sendError, setSendError] = useState("");
  const [errors, setErrors] = useState({});
  const submitting = useRef(false);
  const submission = useRef(null);

  const handleChange = ({ target }) => {
    setForm((current) => ({ ...current, [target.name]: target.value }));
    setErrors((current) => ({ ...current, [target.name]: undefined }));
    if (status === "success") setStatus("idle");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSendError("");
    if (submitting.current || form.website) return;
    trackContactSubmission("attempt");
    const validationErrors = validateContact(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      setStatus("validation");
      trackContactSubmission("validation_error", { errors: Object.keys(validationErrors).join(",") });
      return;
    }
    submitting.current = true;
    setStatus("loading");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);
    try {
      const fingerprint = JSON.stringify(form);
      if (submission.current?.fingerprint !== fingerprint) submission.current = { fingerprint, requestId: crypto.randomUUID() };
      const response = await fetch("/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ ...form, requestId: submission.current.requestId }),
      });
      if (response.status === 429) {
        setStatus("throttled");
        trackContactSubmission("throttled");
        return;
      }
      const result = await response.json();
      if (response.status !== 202 || result.accepted !== true) throw new Error("Submission not accepted");
      setStatus("success");
      trackContactSubmission("success", { has_company: Boolean(form.company) });
      setForm(initialForm);
      submission.current = null;
    } catch {
      setSendError("Please try again later. Your entries have been kept.");
      setStatus("error");
      trackContactSubmission("error");
    } finally {
      window.clearTimeout(timeout);
      submitting.current = false;
    }
  };

  const field = (id, label, props) => <div><label className="mb-2 block text-sm font-bold" htmlFor={id}>{label}</label><input id={id} className="input" maxLength={CONTACT_LIMITS[id]} required={id !== "company"} disabled={status === "loading"} aria-invalid={Boolean(errors[id])} aria-describedby={errors[id] ? `${id}-error` : undefined} {...props} value={form[id]} onChange={handleChange} />{errors[id] && <p id={`${id}-error`} className="mt-1 text-sm text-red-700 dark:text-red-400">{errors[id]}</p>}</div>;

  return (
    <section id="contact" className="bg-white py-12 text-[#06243F] dark:bg-[#09090B] dark:text-[#FAFAFA] sm:py-16 lg:py-20">
      <div className="mx-auto grid min-w-0 max-w-7xl gap-10 px-3 sm:gap-12 sm:px-5 lg:grid-cols-2">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-[#06243f] dark:text-[#93c5fd] sm:text-sm">Contact Us</p>
          <h2 className="mt-3 text-2xl font-black text-balance sm:mt-4 sm:text-3xl md:text-4xl lg:text-5xl">Let&apos;s Build Something Great Together.</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-white/80 sm:text-base sm:leading-8">Have a project, idea, system problem, or digitization need? Contact Bluecore and let&apos;s discuss the best solution.</p>
          <div className="mt-8 space-y-5">
            <ContactItem icon={MapPin} title="Office" text="Addis Ababa, Ethiopia" href="https://maps.google.com/?q=Addis+Ababa+Ethiopia" external />
            <ContactItem icon={Phone} title="Phone" text="+251 978 939 312" href="tel:+251978939312" />
            <ContactItem icon={Mail} title="Email" text="team@blue-core.tech" href="mailto:team@blue-core.tech" />
            <ContactItem icon={Clock} title="Working Hours" text="Monday–Friday, 9:00 AM–5:00 PM" />
          </div>
        </div>
        <form onSubmit={handleSubmit} noValidate aria-busy={status === "loading"} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:rounded-3xl sm:p-7 dark:border-white/10 dark:bg-[#161616]">
          <div className="grid gap-4 sm:gap-5">
            {field("name", "Full name", { name: "name", autoComplete: "name" })}
            {field("email", "Email address", { name: "email", type: "email", autoComplete: "email" })}
            {field("company", "Company or organization (optional)", { name: "company", autoComplete: "organization" })}
            <div><label className="mb-2 block text-sm font-bold" htmlFor="message">Message</label><textarea id="message" name="message" required maxLength={CONTACT_LIMITS.message} disabled={status === "loading"} className="input min-h-36" value={form.message} onChange={handleChange} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "message-error" : undefined} />{errors.message && <p id="message-error" className="mt-1 text-sm text-red-700 dark:text-red-400">{errors.message}</p>}</div>
            <div className="honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex="-1" autoComplete="off" value={form.website} onChange={handleChange} /></div>
            <div aria-live="polite" aria-atomic="true">
              {status === "success" && <p className="status-success"><CheckCircle aria-hidden="true" className="h-4 w-4" />Your inquiry was accepted for sending. Thank you for contacting Bluecore.</p>}
              {status === "error" && <p className="status-error"><AlertCircle className="h-4 w-4 shrink-0" /><span>We could not send your message. {sendError}</span></p>}
              {status === "validation" && <p className="status-error"><AlertCircle className="h-4 w-4 shrink-0" />Please correct the highlighted fields.</p>}
              {status === "throttled" && <p className="status-error"><AlertCircle className="h-4 w-4 shrink-0" />Too many requests. Please wait at least a minute before trying again.</p>}
              {status === "loading" && <span className="sr-only">Sending your message.</span>}
            </div>
            <p className="text-sm leading-6 text-slate-600 dark:text-white/70">By submitting, you acknowledge that Bluecore may use the information you provide to respond to your enquiry. See our <a href="/privacy" className="font-bold underline">Privacy Policy</a>.</p>
            <button type="submit" disabled={status === "loading" || status === "success"} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#8B5E3C] py-3 text-sm font-bold text-white hover:bg-[#A0694A] disabled:cursor-not-allowed disabled:opacity-60 sm:text-base">{status === "loading" ? <><Loader className="h-4 w-4 animate-spin" />Sending…</> : status === "success" ? "Inquiry accepted" : "Send Message"}</button>
          </div>
        </form>
      </div>
    </section>
  );
}

function ContactItem({ icon: Icon, title, text, href, external }) {
  const handleClick = () => {
    if (!href) return;
    if (href.startsWith("mailto:")) trackDirectContact("email", text);
    else if (href.startsWith("tel:")) trackDirectContact("phone", text);
    else if (href.includes("maps.google.com")) trackDirectContact("map", text);
  };

  const value = href ? (
    <a
      className="break-words text-sm text-slate-600 underline-offset-2 hover:underline dark:text-white/80 sm:text-base"
      href={href}
      onClick={handleClick}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      {text}
    </a>
  ) : (
    <p className="text-sm text-slate-600 dark:text-white/80 sm:text-base">{text}</p>
  );
  return <div className="flex gap-3 sm:gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#06243f]/10 sm:h-12 sm:w-12 dark:bg-white/10"><Icon className="h-5 w-5 text-[#06243f] sm:h-6 sm:w-6 dark:text-white" /></div><div><h3 className="font-black">{title}</h3>{value}</div></div>;
}
