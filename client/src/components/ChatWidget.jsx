import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X, Shield } from "lucide-react";
import { chat } from "../services/api";

const SUGGESTIONS = [
  "Which zone is riskiest right now?",
  "Is it safe to travel today?",
  "What should I do during a flood warning?",
];

const GREETING = {
  role: "assistant",
  content: "Hi, I'm Aegis. Ask me about flood or heat risk in any zone.",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, open]);

  const send = async (text) => {
    const content = text.trim();
    if (!content || busy) return;

    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);

    try {
      const payload = next
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));
      const res = await chat(payload);
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: err.userMessage || "Something went wrong. Please try again.", error: true },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-24 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-aegis-500 to-violet-glow text-white shadow-xl shadow-aegis-500/40 lg:bottom-6 lg:right-6"
            aria-label="Open AI assistant"
          >
            <MessageCircle className="h-6 w-6" />
            <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full bg-risk-low ring-2 ring-ink-950" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="glass fixed inset-x-3 bottom-24 z-50 flex h-[65vh] max-h-[560px] flex-col overflow-hidden !bg-ink-900/90 sm:left-auto sm:w-96 lg:bottom-6 lg:right-6"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-aegis-400 to-violet-glow">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-white">Aegis Assistant</p>
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="live-dot !h-1.5 !w-1.5" /> Uses live zone data
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-sm bg-gradient-to-br from-aegis-500 to-violet-glow text-white"
                        : m.error
                        ? "rounded-bl-sm bg-risk-critical/15 text-risk-critical"
                        : "rounded-bl-sm bg-white/10 text-slate-200"
                    }`}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}

              {busy && (
                <div className="flex gap-1.5 rounded-2xl rounded-bl-sm bg-white/10 px-4 py-3 w-fit">
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="h-2 w-2 rounded-full bg-slate-300"
                      animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }}
                    />
                  ))}
                </div>
              )}

              {messages.length === 1 && !busy && (
                <div className="flex flex-col gap-2 pt-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-aegis-400/50 hover:bg-white/10"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div ref={endRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex gap-2 border-t border-white/10 p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={500}
                placeholder="Ask about any zone…"
                className="input !py-2.5"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="btn-primary !px-3.5"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}