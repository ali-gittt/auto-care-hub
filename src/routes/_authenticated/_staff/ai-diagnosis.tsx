import { createFileRoute } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  BotMessageSquare,
  RefreshCw,
  Send,
  ServerCrash,
  Sparkles,
  User,
} from "lucide-react";
import { sendMessage } from "@/lib/siyaraAI";
import { PageHeader } from "@/components/workshop/ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_staff/ai-diagnosis")({
  head: () => ({ meta: [{ title: "AI Diagnosis — TorqueWorks" }] }),
  component: AiDiagnosisPage,
});

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  text: string;
}

/* ------------------------------------------------------------------ */
/*  Example prompts shown in the empty state                            */
/* ------------------------------------------------------------------ */

const EXAMPLES = [
  "Engine makes a ticking noise at idle",
  "Check engine light is on — what could it be?",
  "Vibration when braking at high speed",
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function uid() {
  return Math.random().toString(36).slice(2);
}

/** Detect Arabic text (RTL) — simple Unicode-range check. */
function isRtl(text: string) {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                       */
/* ------------------------------------------------------------------ */

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const rtl = isRtl(msg.text);

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar icon */}
      <div
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border shadow-sm",
          isUser
            ? "border-primary/40 bg-primary/15 text-primary"
            : "border-border/70 bg-secondary/50 text-muted-foreground",
        )}
      >
        {isUser ? (
          <User className="size-4" />
        ) : (
          <BotMessageSquare className="size-4" />
        )}
      </div>

      {/* Bubble */}
      <div
        dir={rtl ? "rtl" : "ltr"}
        className={cn(
          "max-w-[80%] rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm",
          "whitespace-pre-wrap break-words",
          isUser
            ? "rounded-tr-sm border-primary/30 bg-primary/10 text-foreground"
            : "rounded-tl-sm border-border/60 bg-card/80 text-foreground",
        )}
      >
        {msg.text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex w-full gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-secondary/50 shadow-sm">
        <BotMessageSquare className="size-4 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border/60 bg-card/80 px-4 py-3 shadow-sm">
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

function AiDiagnosisPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Auto-scroll to newest message */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* ---- Actions ---- */

  const resetChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setInput("");
    setError(null);
    textareaRef.current?.focus();
  }, []);

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setInput("");
      setError(null);

      const userMsg: Message = { id: uid(), role: "user", text: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const data = await sendMessage({ message: trimmed, session_id: sessionId });
        setSessionId(data.session_id);
        const aiMsg: Message = {
          id: uid(),
          role: "assistant",
          text: data.response,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        /* Roll back the user bubble so they can retry */
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        setInput(trimmed);
      } finally {
        setLoading(false);
      }
    },
    [loading, sessionId],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  };

  /* ---- Render ---- */

  const isEmpty = messages.length === 0;

  return (
    <>
      <PageHeader eyebrow="Diagnostic Assistant · AI Powered" title="AI" accent="DIAGNOSIS">
        <Button
          id="new-diagnosis-btn"
          variant="outline"
          size="sm"
          onClick={resetChat}
          className="gap-2 font-mono text-xs uppercase border-border/70 hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
        >
          <RefreshCw className="size-3.5" />
          New Diagnosis
        </Button>
      </PageHeader>

      {/* Chat container — fills the remaining viewport height */}
      <div
        className="flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card/90 shadow-sm backdrop-blur-sm"
        style={{ height: "calc(100vh - 240px)", minHeight: "420px" }}
      >
        {/* ---- Message list ---- */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {isEmpty && !loading && !error && (
            /* Empty state */
            <div className="flex h-full flex-col items-center justify-center gap-6 py-10 text-center">
              <div className="relative flex size-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shadow-lg shadow-primary/10">
                <Sparkles className="size-8 text-primary" />
                <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-card">
                  <span className="size-1.5 rounded-full bg-white" />
                </span>
              </div>

              <div>
                <p className="text-lg font-black uppercase tracking-tight text-foreground">
                  AI Diagnosis Ready
                </p>
                <p className="mt-1.5 max-w-sm font-mono text-xs text-muted-foreground">
                  Describe the symptom in your own words — the AI will help you
                  identify the likely cause and next steps.
                </p>
              </div>

              {/* Example prompts */}
              <div className="flex flex-col gap-2 w-full max-w-md">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Try an example
                </p>
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    id={`example-${ex.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}`}
                    onClick={() => {
                      setInput(ex);
                      textareaRef.current?.focus();
                    }}
                    className="rounded-xl border border-border/70 bg-secondary/30 px-4 py-2.5 text-left font-sans text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                  >
                    "{ex}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} />
          ))}

          {loading && <TypingIndicator />}

          {/* Error state */}
          {error && !loading && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-6 py-6 text-center">
              <ServerCrash className="size-8 text-destructive" />
              <div>
                <p className="font-bold text-destructive">Could not reach SiyaraAI</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  Start the SiyaraAI server and try again.
                </p>
                {error && (
                  <p className="mt-2 max-w-sm break-all font-mono text-[10px] text-destructive/70">
                    {error}
                  </p>
                )}
              </div>
              <Button
                id="retry-btn"
                size="sm"
                variant="destructive"
                onClick={() => {
                  setError(null);
                  submit(input || (messages.at(-2)?.text ?? ""));
                }}
                className="font-mono text-xs uppercase"
              >
                <RefreshCw className="mr-1.5 size-3.5" />
                Retry
              </Button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ---- Input bar ---- */}
        <div className="shrink-0 border-t border-border/70 bg-card/60 px-4 py-4 backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-end gap-3">
            <Textarea
              ref={textareaRef}
              id="ai-diagnosis-input"
              placeholder="Describe the symptom… (Enter to send · Shift+Enter for new line)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows={2}
              className={cn(
                "flex-1 resize-none rounded-xl border-border/70 bg-background/80 font-sans text-sm",
                "transition-all focus-visible:ring-primary/40",
                "min-h-[56px] max-h-48",
                loading && "cursor-not-allowed opacity-60",
              )}
            />
            <Button
              id="send-btn"
              onClick={() => submit(input)}
              disabled={loading || !input.trim()}
              size="icon"
              className="size-11 shrink-0 rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-40"
              title="Send message"
            >
              <Send className="size-4" />
            </Button>
          </div>
          <p className="mt-2 text-center font-mono text-[10px] text-muted-foreground/60">
            Enter ↵ sends · Shift+Enter for a new line
          </p>
        </div>
      </div>
    </>
  );
}
