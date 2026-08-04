import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Bot,
  Phone,
  Mail,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Predefined responses ──────────────────────────────────────────────────────
const FAQS = [
  {
    keywords: ["service", "services", "provide", "offer", "what do you do"],
    answer:
      "We provide website development, mobile app development, software solutions, business automation, digital transformation, digital marketing, IT consulting, and technical support. Which service interests you most?",
  },
  {
    keywords: ["contact", "reach", "phone", "call", "email", "address"],
    answer:
      "You can contact us by phone at +251 978 939 312 or by email at support.bluecoresoft@gmail.com.",
  },
  {
    keywords: [
      "digital marketing",
      "marketing",
      "social media",
      "promotion",
      "brand",
    ],
    answer:
      "We provide digital marketing services including online promotion, brand visibility support, social media management, and digital growth strategy. Call us at +251 978 939 312 to get started.",
  },
  {
    keywords: ["demo", "request demo", "trial", "try"],
    answer:
      "You can request a demo by calling +251 978 939 312 or emailing support.bluecoresoft@gmail.com.",
  },
  {
    keywords: ["support", "help", "assistance", "issue", "problem"],
    answer:
      "Support is available via phone, WhatsApp, Telegram, or email.\nPhone: +251 978 939 312\nEmail: support.bluecoresoft@gmail.com",
  },
  {
    keywords: ["price", "pricing", "cost", "quote", "how much"],
    answer:
      "Pricing depends on your project needs. Contact us at +251 978 939 312 or support.bluecoresoft@gmail.com to discuss a quote.",
  },
  {
    keywords: ["location", "where", "addis", "ethiopia", "office"],
    answer:
      "We are based in Addis Ababa, Ethiopia, serving clients locally and across the region.",
  },
  {
    keywords: ["web", "website", "web app", "web development"],
    answer:
      "Yes, we build professional, responsive websites and web applications tailored to your business needs — from landing pages to full enterprise platforms.",
  },
  {
    keywords: ["mobile", "app", "android", "ios", "mobile app"],
    answer:
      "We develop native and cross-platform mobile apps for Android and iOS, built for performance and great user experience.",
  },
  {
    keywords: [
      "ai",
      "artificial intelligence",
      "machine learning",
      "automation",
    ],
    answer:
      "We integrate AI and automation into business workflows — from intelligent dashboards to automated pipelines and predictive tools.",
  },
];

const EXTENDED_FAQS = [
  { keywords: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"], answer: "Hello, and welcome to Bluecore Software PLC. How may I help you today? You can ask about our services, portfolio, project process, pricing, support, or contact details." },
  { keywords: ["thank you", "thanks", "appreciate"], answer: "You are very welcome. Please let me know if there is anything else I can help you with." },
  { keywords: ["bye", "goodbye", "see you"], answer: "Thank you for visiting Bluecore Software PLC. We appreciate your time and will be here whenever you need assistance." },
  { keywords: ["about bluecore", "who are you", "company", "bluecore"], answer: "Bluecore Software PLC is a technology company in Addis Ababa focused on practical, secure, scalable, and maintainable digital solutions for businesses, organizations, and institutions." },
  { keywords: ["portfolio", "previous work", "past work", "examples", "projects"], answer: "You can review representative solution concepts in the Our Portfolio section, including a business management platform, a mobile booking application, and a digital office workflow. Contact us to discuss a similar project." },
  { keywords: ["working hours", "opening hours", "business hours", "when are you open"], answer: "Our listed working hours are Monday through Friday, 9:00 AM to 5:00 PM. You can still send an email or contact-form message outside those hours." },
  { keywords: ["integration", "connect systems", "api", "apis", "legacy", "existing system", "existing systems"], answer: "Bluecore can connect existing tools, APIs, databases, and legacy workflows into a unified system. An initial technical review helps identify compatibility, security, and migration requirements." },
  { keywords: ["digitization", "paperwork", "data entry", "data migration", "records"], answer: "We help organizations move paper-based and manual processes into structured digital workflows, including records, approvals, reporting, and service delivery." },
  { keywords: ["cloud", "hosting", "deployment", "devops", "uptime", "server"], answer: "Our Cloud and DevOps work covers reliable deployment, release automation, scalable infrastructure, and operational readiness. The best hosting approach depends on your system and compliance needs." },
  { keywords: ["security", "secure", "privacy", "testing", "quality", "qa"], answer: "Security and quality are part of our delivery approach. We plan appropriate access controls, testing, maintainability, and secure deployment based on project risk and requirements." },
  { keywords: ["process", "project process", "how do you work", "project steps", "get started", "start a project"], answer: "A typical engagement begins with discovery and requirements, followed by planning, design, development, testing, launch, and ongoing support. Contact us with your goal and current challenge to begin." },
  { keywords: ["timeline", "how long", "delivery time", "deadline", "urgent"], answer: "Delivery time depends on scope, integrations, approvals, and testing requirements. After a discovery discussion, the team can provide a realistic schedule and milestones." },
  { keywords: ["price", "pricing", "cost", "quote", "budget", "how much", "payment"], answer: "Project pricing depends on scope, features, integrations, security needs, and delivery schedule. Share your requirements through the contact form for a tailored estimate." },
  { keywords: ["custom", "customize", "tailored", "special requirement"], answer: "Yes. Custom software is one of our core services. We shape workflows, business rules, integrations, and user experience around your organization rather than forcing a generic template." },
  { keywords: ["training", "documentation", "onboarding", "teach staff"], answer: "Training, documentation, and adoption planning can be included according to the project. Mention the number of users and the support your team needs when requesting a proposal." },
  { keywords: ["support", "maintenance", "bug", "issue", "problem", "after launch", "post launch"], answer: "Bluecore provides long-term support and can help with technical issues, maintenance, and post-launch improvements. Contact +251 978 939 312 or support.bluecoresoft@gmail.com and describe the system and issue." },
  { keywords: ["remote", "international", "outside ethiopia", "other country"], answer: "Bluecore is based in Addis Ababa and can discuss projects with organizations outside the immediate area. Contact the team so delivery, communication, and support arrangements can be confirmed." },
  { keywords: ["job", "jobs", "career", "careers", "internship", "vacancy", "hiring"], answer: "Thank you for your interest in Bluecore. This page does not currently list vacancies. Please email support.bluecoresoft@gmail.com with a concise introduction and relevant details." },
  { keywords: ["whatsapp", "telegram", "social media"], answer: "Bluecore is available through the WhatsApp and Telegram links in the footer. For detailed project or support records, email and the contact form are also good options." },
  { keywords: ["stupid", "idiot", "useless", "angry", "bad service"], answer: "I am sorry this has been frustrating. I will remain respectful and help where I can. Please describe what went wrong, or contact the team directly at +251 978 939 312 for personal assistance." },
];

const KNOWLEDGE_BASE = [...EXTENDED_FAQS, ...FAQS];

const QUICK_ACTIONS = [
  { label: "View Services", message: "What services do you provide?" },
  { label: "View Portfolio", message: "Show me your portfolio and project examples." },
  { label: "Request Demo", message: "I'd like to request a demo." },
  { label: "Get Support", message: "How can I get support?" },
  { label: "Call Now", href: "tel:+251978939312" },
  { label: "Email Us", href: "mailto:support.bluecoresoft@gmail.com" },
];

function normalizeMessage(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function keywordScore(message, keyword) {
  const normalizedKeyword = normalizeMessage(keyword);
  if (!normalizedKeyword) return 0;
  if (normalizedKeyword.includes(" ")) {
    return message.includes(normalizedKeyword) ? normalizedKeyword.split(" ").length + 2 : 0;
  }
  return message.split(" ").includes(normalizedKeyword) ? 1 : 0;
}

function getReply(text) {
  const message = normalizeMessage(text);
  let bestMatch = null;
  let bestScore = 0;

  for (const faq of KNOWLEDGE_BASE) {
    const score = faq.keywords.reduce(
      (total, keyword) => total + keywordScore(message, keyword),
      0,
    );
    if (score > bestScore) {
      bestMatch = faq;
      bestScore = score;
    }
  }

  if (bestMatch) return bestMatch.answer;
  return "Thank you for reaching out. I do not want to guess and give you incorrect information. Please tell me whether your question is about services, pricing, timelines, support, or starting a project. You can also contact the team at +251 978 939 312 or support.bluecoresoft@gmail.com.";
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block h-2 w-2 rounded-full bg-[#8B5E3C]/60 dark:bg-[#c4a882]/60"
          style={{
            animation: "typingBounce 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! 👋 Welcome to Bluecore Software PLC.\n\nHow can we help you today? Feel free to ask about our services, pricing, or anything else — or tap a quick button below.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);

  const closeChat = () => {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (!open) return undefined;
    const handleDialogKeys = (event) => {
      if (event.key === "Escape") closeChat();
      if (event.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll("button, a[href], textarea, input, [tabindex]:not([tabindex='-1'])");
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleDialogKeys);
    return () => document.removeEventListener("keydown", handleDialogKeys);
  }, [open]);

  // ── Listen for the navbar "Support" click ──────────────────────────────────
  useEffect(() => {
    const handler = () => {
      setOpen(true);
      setMinimized(false);
    };
    window.addEventListener("open-support-chat", handler);
    return () => window.removeEventListener("open-support-chat", handler);
  }, []);

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, minimized]);

  useEffect(() => {
    if (!minimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, minimized]);

  const sendMessage = (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setShowQuickActions(false);
    setLoading(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: getReply(trimmed) },
      ]);
      setLoading(false);
    }, 700);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139,94,60,0.45); }
          50% { box-shadow: 0 0 0 10px rgba(139,94,60,0); }
        }
      `}</style>

      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            ref={triggerRef}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-4 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-[#8B5E3C] text-white shadow-2xl sm:right-6"
            style={{ animation: "chatPulse 2.5s ease-in-out infinite" }}
            aria-label="Open support chat"
          >
            <MessageCircle className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-chat-title"
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            className="
              fixed z-[9999]
              /* Mobile: near-full-screen anchored to bottom */
              bottom-2 left-2 right-2
              /* Tablet+ : floating bottom-right panel */
              sm:bottom-6 sm:left-auto sm:right-4
              sm:w-[min(400px,calc(100vw-2rem))]
              /* Desktop */
              lg:right-6
            "
          >
            <div
              className="
                flex flex-col overflow-hidden
                bg-white dark:bg-[#09090B]
                border border-slate-200 dark:border-white/10
                shadow-2xl
                /* Mobile: rounded top corners only, full width */
                rounded-2xl
                /* Tablet+: fully rounded */
                sm:rounded-2xl
              "
              style={{
                /* Collapsed (minimized) = header only */
                height: minimized
                  ? "64px"
                  : /* Mobile: 88vh so it doesn't cover full screen */
                    "min(88vh, 560px)",
              }}
            >
              {/* Header */}
              <div className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-[#06243f] px-4 py-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8B5E3C]">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p id="support-chat-title" className="text-sm font-bold text-white">
                    Bluecore Support
                  </p>
                  <p className="text-xs text-white/60">
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Automated quick-help assistant
                  </p>
                </div>
                <button
                  onClick={() => setMinimized((m) => !m)}
                  className="rounded-lg p-1.5 text-white/60 transition-colors hover:text-white"
                  aria-label={minimized ? "Expand chat" : "Minimize chat"}
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={closeChat}
                  className="rounded-lg p-1.5 text-white/60 transition-colors hover:text-white"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body — only rendered when not minimized */}
              {!minimized && (
                /* This wrapper takes all remaining height and creates the scroll + input layout */
                <div className="flex min-h-0 flex-1 flex-col">
                  {/* Scrollable messages */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 dark:bg-[#09090B]">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.role === "assistant" && (
                          <div className="mr-2 flex h-7 w-7 shrink-0 self-end mb-0.5 items-center justify-center rounded-full bg-[#8B5E3C]">
                            <Bot className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                            msg.role === "user"
                              ? "rounded-br-sm bg-[#154187] text-white"
                              : "rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-[#09090B] dark:text-[#FAFAFA]"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}

                    {loading && (
                      <div className="flex justify-start">
                        <div className="mr-2 flex h-7 w-7 shrink-0 self-end mb-0.5 items-center justify-center rounded-full bg-[#8B5E3C]">
                          <Bot className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="rounded-2xl rounded-bl-sm bg-slate-100 dark:bg-[#09090B]">
                          <TypingDots />
                        </div>
                      </div>
                    )}

                    {/* Quick action buttons */}
                    {showQuickActions && !loading && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {QUICK_ACTIONS.map((action) =>
                          action.href ? (
                            <a
                              key={action.label}
                              href={action.href}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#8B5E3C]/35 bg-[#FDF6EF] px-3 py-1.5 text-xs font-semibold text-[#8B5E3C] transition-colors hover:bg-[#8B5E3C] hover:text-white dark:bg-white/[0.06] dark:text-[#F4D7B2] dark:border-white/20 dark:hover:bg-[#8B5E3C]"
                            >
                              {action.label === "Call Now" && (
                                <Phone className="h-3 w-3" />
                              )}
                              {action.label === "Email Us" && (
                                <Mail className="h-3 w-3" />
                              )}
                              {action.label}
                            </a>
                          ) : (
                            <button
                              key={action.label}
                              onClick={() => sendMessage(action.message)}
                              className="inline-flex items-center rounded-lg border border-[#154187]/30 bg-[#EFF6FF] px-3 py-1.5 text-xs font-semibold text-[#154187] transition-colors hover:bg-[#154187] hover:text-white dark:bg-white/[0.06] dark:text-[#93C5FD] dark:border-white/20 dark:hover:bg-[#154187] dark:hover:text-white"
                            >
                              {action.label}
                            </button>
                          ),
                        )}
                      </div>
                    )}

                    <div ref={bottomRef} />
                  </div>

                  {/* Input — pinned to bottom */}
                  <div className="shrink-0 border-t border-slate-100 px-3 py-3 dark:border-white/10 dark:bg-[#09090B]">
                    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-[#09090B]">
                      <textarea
                        id="support-message"
                        aria-label="Message for the Bluecore quick-help assistant"
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Type your message…"
                        rows={1}
                        className="min-w-0 flex-1 resize-none bg-transparent text-left text-sm text-slate-800 placeholder-slate-400 outline-none placeholder:text-left dark:text-[#FAFAFA] dark:placeholder-white/40"
                        style={{ maxHeight: "80px" }}
                      />
                      <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#8B5E3C] text-white transition-opacity disabled:opacity-40 hover:bg-[#A0694A]"
                        aria-label="Send"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="mt-1.5 text-center text-[10px] text-slate-400 dark:text-white/30">
                      Bluecore Support · Press Enter to send
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
