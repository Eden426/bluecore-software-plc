import { useState } from "react";
import emailjs from "@emailjs/browser";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";

// ─── EmailJS credentials ────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID = "service_umrmsbk";
const EMAILJS_TEMPLATE_ID = "template_yxl2yrk";
const EMAILJS_PUBLIC_KEY = "XZ5qtolydRMNyKZEn";
// ─────────────────────────────────────────────────────────────────────────────

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });

  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (status === "loading") return;

    setStatus("loading");
    setErrorMessage("");

    const templateParams = {
      name: form.name,
      email: form.email,
      company: form.company || "Not provided",
      time: new Date().toLocaleString(),
      message: form.message,
    };

    try {
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY,
      );

      console.log("EmailJS success:", response.status, response.text);

      setStatus("success");
      setForm({
        name: "",
        email: "",
        company: "",
        message: "",
      });
    } catch (err) {
      console.error("EmailJS error:", err);

      setErrorMessage(
        err?.text ||
          err?.message ||
          "Email service failed. Please check your EmailJS settings.",
      );

      setStatus("error");
    }
  };

  return (
    <section
      id="contact"
      className="bg-[#F2F4F7] py-12 dark:bg-[#09090B] dark:text-[#FAFAFA] sm:py-16 lg:py-20"
    >
      <div className="mx-auto grid min-w-0 max-w-7xl gap-10 px-3 sm:gap-12 sm:px-5 lg:grid-cols-2">
        {/* Left — info */}
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

            <ContactItem icon={Phone} title="Phone" text="+251 978 939 312" />

            <ContactItem
              icon={Mail}
              title="Email"
              text="support.bluecoresoft@gmail.com"
            />

            <ContactItem
              icon={Clock}
              title="Working Hours"
              text="Mon – Fri, 9:00 AM – 5:00 PM"
            />
          </div>
        </div>

        {/* Right — form */}
        <form
          onSubmit={handleSubmit}
          className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:rounded-3xl sm:p-7 dark:border-white/10 dark:bg-[#161616]"
        >
          <div className="grid gap-4 sm:gap-5">
            <input
              className="input"
              placeholder="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <input
              className="input"
              placeholder="Email Address"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <input
              className="input"
              placeholder="Company / Organization"
              name="company"
              value={form.company}
              onChange={handleChange}
            />

            <textarea
              className="input min-h-36"
              placeholder="Your Message"
              name="message"
              value={form.message}
              onChange={handleChange}
              required
            />

            {status === "success" && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CheckCircle className="h-4 w-4 shrink-0" />
                Message sent! We'll get back to you soon.
              </div>
            )}

            {status === "error" && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                  <div>
                    <p>
                      Something went wrong. Please try again or email us
                      directly.
                    </p>

                    {errorMessage && (
                      <p className="mt-1 text-xs opacity-80">
                        Error detail: {errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#8B5E3C] py-3 text-sm font-bold text-white transition-colors hover:bg-[#A0694A] disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
            >
              {status === "loading" ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send Message"
              )}
            </button>
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