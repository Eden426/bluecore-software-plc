import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { Mail, Phone, MapPin, Clock, CheckCircle, AlertCircle, Loader } from "lucide-react";

const getEmailConfig = () => ({
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID?.trim(),
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID?.trim(),
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY?.trim(),
});
const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || "team@blue-core.tech";
const initialForm = { name: "", email: "", company: "", message: "", website: "" };

function validate(form) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Please enter a valid email address.";
  if (form.message.trim().length < 10) errors.message = "Please enter a message of at least 10 characters.";
  return errors;
}

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle");
  const [sendError, setSendError] = useState("");
  const [errors, setErrors] = useState({});
  const lastAttempt = useRef(0);

  const handleChange = ({ target }) => {
    setForm((current) => ({ ...current, [target.name]: target.value }));
    setErrors((current) => ({ ...current, [target.name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSendError("");
    if (status === "loading" || form.website) return;
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      setStatus("validation");
      return;
    }
    const now = Date.now();
    if (now - lastAttempt.current < 5000) {
      setStatus("throttled");
      return;
    }
    lastAttempt.current = now;
    const emailConfig = getEmailConfig();
    if (!emailConfig.serviceId || !emailConfig.templateId || !emailConfig.publicKey) {
      if (import.meta.env.DEV) console.error("EmailJS environment variables are not configured.");
      setSendError("Email service is not configured for this build. Add the VITE_EMAILJS variables and restart or redeploy the site.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      await emailjs.send(emailConfig.serviceId, emailConfig.templateId, {
        name: form.name.trim(),
        from_name: form.name.trim(),
        email: form.email.trim(),
        reply_to: form.email.trim(),
        to_email: contactEmail,
        company: form.company.trim() || "Not provided",
        time: new Date().toLocaleString(),
        message: form.message.trim(),
      }, emailConfig.publicKey);
      setStatus("success");
      setForm(initialForm);
    } catch (error) {
      if (import.meta.env.DEV) console.error("EmailJS submission failed:", error);
      const code = Number(error?.status);
      const detail =
        code === 400
          ? "The EmailJS service or template configuration is invalid."
          : code === 401 || code === 403
            ? "The EmailJS public key or allowed-domain settings rejected this site."
            : code === 412
              ? "The connected email provider needs to be reconnected in EmailJS."
              : "Please try again later or email us directly.";
      setSendError(detail);
      setStatus("error");
    }
  };

  const field = (id, label, props) => <div><label className="mb-2 block text-sm font-bold" htmlFor={id}>{label}</label><input id={id} className="input" aria-invalid={Boolean(errors[id])} aria-describedby={errors[id] ? `${id}-error` : undefined} {...props} value={form[id]} onChange={handleChange} />{errors[id] && <p id={`${id}-error`} className="mt-1 text-sm text-red-700 dark:text-red-400">{errors[id]}</p>}</div>;

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
        <form onSubmit={handleSubmit} noValidate className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:rounded-3xl sm:p-7 dark:border-white/10 dark:bg-[#161616]">
          <div className="grid gap-4 sm:gap-5">
            {field("name", "Full name", { name: "name", autoComplete: "name" })}
            {field("email", "Email address", { name: "email", type: "email", autoComplete: "email" })}
            {field("company", "Company or organization (optional)", { name: "company", autoComplete: "organization" })}
            <div><label className="mb-2 block text-sm font-bold" htmlFor="message">Message</label><textarea id="message" name="message" className="input min-h-36" value={form.message} onChange={handleChange} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "message-error" : undefined} />{errors.message && <p id="message-error" className="mt-1 text-sm text-red-700 dark:text-red-400">{errors.message}</p>}</div>
            <div className="honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex="-1" autoComplete="off" value={form.website} onChange={handleChange} /></div>
            <div aria-live="polite" aria-atomic="true">
              {status === "success" && <p className="status-success"><CheckCircle className="h-4 w-4" />Message sent successfully. Thank you for contacting Bluecore.</p>}
              {status === "error" && <p className="status-error"><AlertCircle className="h-4 w-4 shrink-0" /><span>We could not send your message. {sendError}</span></p>}
              {status === "validation" && <p className="status-error"><AlertCircle className="h-4 w-4 shrink-0" />Please correct the highlighted fields.</p>}
              {status === "throttled" && <p className="status-error"><AlertCircle className="h-4 w-4 shrink-0" />Please wait a few seconds before trying again.</p>}
              {status === "loading" && <span className="sr-only">Sending your message.</span>}
            </div>
            <p className="text-sm leading-6 text-slate-600 dark:text-white/70">By submitting, you acknowledge that Bluecore may use the information you provide to respond to your enquiry. See our <a href="/privacy" className="font-bold underline">Privacy Policy</a>.</p>
            <button type="submit" disabled={status === "loading" || status === "success"} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#8B5E3C] py-3 text-sm font-bold text-white hover:bg-[#A0694A] disabled:cursor-not-allowed disabled:opacity-60 sm:text-base">{status === "loading" ? <><Loader className="h-4 w-4 animate-spin" />Sending…</> : status === "success" ? "Message sent" : "Send Message"}</button>
          </div>
        </form>
      </div>
    </section>
  );
}

function ContactItem({ icon: Icon, title, text, href, external }) {
  const value = href ? <a className="break-words text-sm text-slate-600 underline-offset-2 hover:underline dark:text-white/80 sm:text-base" href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{text}</a> : <p className="text-sm text-slate-600 dark:text-white/80 sm:text-base">{text}</p>;
  return <div className="flex gap-3 sm:gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#06243f]/10 sm:h-12 sm:w-12 dark:bg-white/10"><Icon className="h-5 w-5 text-[#06243f] sm:h-6 sm:w-6 dark:text-white" /></div><div><h3 className="font-black">{title}</h3>{value}</div></div>;
}
