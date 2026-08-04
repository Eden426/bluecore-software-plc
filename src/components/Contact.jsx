import { useState } from "react";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

const initialForm = { name: "", email: "", company: "", message: "", website: "" };

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const fallbackError = "Something went wrong. Please try again, or email us directly.";

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || fallbackError);
      }

      setStatus("success");
      setForm(initialForm);
    } catch {
      setStatus("error");
      setErrorMessage(fallbackError);
    }
  };

  return (
    <section
      id="contact"
      className="bg-[#F2F4F7] py-12 dark:bg-[#09090B] dark:text-[#FAFAFA] sm:py-16 lg:py-20"
    >
      <div className="mx-auto grid min-w-0 max-w-7xl gap-10 px-3 sm:gap-12 sm:px-5 lg:grid-cols-2">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-[#06243f] dark:text-[#93c5fd] sm:text-sm">
            Contact Us
          </p>

          <h2 className="mt-3 text-2xl font-black text-balance sm:mt-4 sm:text-3xl md:text-4xl lg:text-5xl dark:text-[#FAFAFA]">
            Let's Build Something Great Together.
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-600 text-pretty dark:text-[#FAFAFA]/80 sm:mt-5 sm:text-base sm:leading-8">
            Have a project, idea, system problem, or digitization need? Contact
            Bluecore and let's discuss the best solution.
          </p>

          <div className="mt-8 space-y-5">
            <ContactItem
              icon={MapPin}
              title="Office"
              text="Addis Ababa, Ethiopia"
            />
            <ContactItem icon={Phone} title="Phone" text="+251 911 234 567" />
            <ContactItem
              icon={Mail}
              title="Email"
              text="info@bluecoresoft.com"
            />
            <ContactItem
              icon={Clock}
              title="Working Hours"
              text="Mon - Fri, 9:00 AM - 5:00 PM"
            />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:rounded-3xl sm:p-7 dark:bg-[#161616] dark:border-white/10"
        >
          <div className="grid gap-4 sm:gap-5">
            <div>
              <label htmlFor="contact-name" className="sr-only">
                Full Name
              </label>
              <input
                id="contact-name"
                name="name"
                className="input"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="contact-email" className="sr-only">
                Email Address
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                className="input"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="contact-company" className="sr-only">
                Company / Organization
              </label>
              <input
                id="contact-company"
                name="company"
                className="input"
                placeholder="Company / Organization"
                value={form.company}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="contact-message" className="sr-only">
                Your Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                className="input min-h-36"
                placeholder="Your Message"
                value={form.message}
                onChange={handleChange}
                required
              />
            </div>

            {/* Honeypot: hidden from real visitors, catches basic bots. */}
            <div className="absolute left-[-9999px]" aria-hidden="true">
              <label htmlFor="contact-website">Website</label>
              <input
                id="contact-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="min-h-11 w-full rounded-xl bg-[#8B5E3C] py-3 text-sm font-bold text-white hover:bg-[#A0694A] disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
            >
              {status === "sending" ? "Sending…" : "Send Message"}
            </button>

            {status === "success" && (
              <p role="status" className="text-sm font-semibold text-green-700 dark:text-green-400">
                Thanks — your message has been sent. We'll get back to you soon.
              </p>
            )}
            {status === "error" && (
              <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

function ContactItem({ icon: Icon, title, text }) {
  return (
    <div className="flex min-w-0 gap-3 sm:gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#06243f]/10 sm:h-12 sm:w-12 dark:bg-white/10">
        <Icon className="h-5 w-5 text-[#06243f] sm:h-6 sm:w-6 dark:text-[#FAFAFA]" />
      </div>
      <div className="min-w-0">
        <h4 className="font-black dark:text-[#FAFAFA]">{title}</h4>
        <p className="break-words text-sm text-slate-600 dark:text-[#FAFAFA]/80 sm:text-base">
          {text}
        </p>
      </div>
    </div>
  );
}
