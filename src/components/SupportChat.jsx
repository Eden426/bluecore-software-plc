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
      "You can contact us by phone at 0978939312 or by email at support.bluecoresoft@gmail.com. Our team is ready to assist you!",
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
      "Yes! We provide digital marketing services including online promotion, brand visibility support, social media management, and digital growth strategy. Call us at 0978939312 to get started.",
  },
  {
    keywords: ["demo", "request demo", "trial", "try"],
    answer:
      "Absolutely! You can request a demo by contacting us through this chat, calling 0978939312, or emailing support.bluecoresoft@gmail.com. We'd love to show you what we can build.",
  },
  {
    keywords: ["support", "help", "assistance", "issue", "problem"],
    answer:
      "Our support team is available via phone, WhatsApp, Telegram, or email.\n📞 Call Center: 0978939312\n📧 Email: support.bluecoresoft@gmail.com",
  },
  {
    keywords: ["price", "pricing", "cost", "quote", "how much"],
    answer:
      "Pricing depends on your specific project needs. Contact us at 0978939312 or support.bluecoresoft@gmail.com and we'll put together a custom quote for you.",
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

const QUICK_ACTIONS = [
  { label: "View Services", message: "What services do you provide?" },
  { label: "Request Demo", message: "I'd like to request a demo." },
  { label: "Get Support", message: "How can I get support?" },
  { label: "Call Now", href: "tel:0978939312" },
  { label: "Email Us", href: "mailto:support.bluecoresoft@gmail.com" },
];

function getReply(text) {
  const lower = text.toLowerCase();
  for (const faq of FAQS) {
    if (faq.keywords.some((kw) => lower.includes(kw))) return faq.answer;
  }
  return "Thanks for your message! For the best assistance, please contact us directly:\n📞 0978939312\n📧 support.bluecoresoft@gmail.com\nWe typically respond within minutes.";
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
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            className="
              fixed z-[9999]
              /* Mobile: near-full-screen anchored to bottom */
              bottom-0 left-0 right-0
              /* Tablet+ : floating bottom-right panel */
              sm:bottom-6 sm:left-auto sm:right-4
              sm:w-[380px]
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
                rounded-t-2xl
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
                  <p className="text-sm font-bold text-white">
                    Bluecore Support
                  </p>
                  <p className="text-xs text-white/60">
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Online now
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
                  onClick={() => setOpen(false)}
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
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-[#09090B]">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Type your message…"
                        rows={1}
                        className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none text-center placeholder:text-center dark:text-[#FAFAFA] dark:placeholder-white/40"
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
