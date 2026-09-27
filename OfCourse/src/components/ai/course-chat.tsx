"use client";

import { ArrowUp, History, Info, Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { AiAnswer } from "@/components/ai/ai-answer";
import { SignInLink } from "@/components/sign-in-link";
import { toast } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  askCourseQuestion,
  deleteChat,
  openChat,
  refreshChats,
} from "@/lib/actions/ai";
import { AI_DISCLAIMER } from "@/lib/ai/disclaimer";
import type { AskResult } from "@/lib/ai/search";
import type { ChatSummary } from "@/lib/data/ai-chats";
import { cn } from "@/lib/utils";

const QUESTION_MIN = 5;
const QUESTION_MAX = 500;
const LOADING_STEPS = [
  "Searching student knowledge…",
  "Finding relevant explanations…",
  "Putting together what students shared…",
];

function Thinking() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)),
      1800,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col gap-3" role="status" aria-live="polite">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="size-4 animate-pulse" aria-hidden />
        {LOADING_STEPS[step]}
      </p>
      <div className="flex flex-col gap-2">
        <div className="h-3 w-11/12 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-4/5 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}

function QuestionBubble({ text }: { text: string }) {
  return (
    <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 text-sm text-background">
      {text}
    </p>
  );
}

type Turn = { question: string; result: AskResult | null };

// "Ask about CS 1332": a saved, course-scoped chat over student posts.
export function CourseChat({
  courseId,
  courseCode,
  signedIn,
  suggestions,
  initialChats,
  initialChatId,
  initialTurns,
}: {
  courseId: string;
  courseCode: string;
  signedIn: boolean;
  suggestions: string[];
  initialChats: ChatSummary[];
  initialChatId: string | null;
  initialTurns: AskResult[];
}) {
  const [chats, setChats] = useState(initialChats);
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [turns, setTurns] = useState<Turn[]>(
    initialTurns.map((r) => ({ question: r.question, result: r })),
  );
  const [question, setQuestion] = useState("");
  const [pending, startTransition] = useTransition();
  const [switching, startSwitch] = useTransition();
  const lastTurnRef = useRef<HTMLLIElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pending)
      lastTurnRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
  }, [pending, turns.length]);

  const ask = (text: string) => {
    const q = text.trim();
    if (q.length < QUESTION_MIN || pending) return;
    setQuestion("");
    setTurns((t) => [...t, { question: q, result: null }]);
    startTransition(async () => {
      let result: AskResult;
      let nextChatId = chatId;
      try {
        const reply = await askCourseQuestion(courseId, q, chatId ?? undefined);
        result = reply.result;
        nextChatId = reply.conversationId ?? chatId;
      } catch {
        result = {
          status: "error",
          question: q,
          message:
            "Couldn't reach OfCourse. Check your connection and try again.",
        };
      }
      setTurns((t) => [...t.slice(0, -1), { question: q, result }]);
      if (nextChatId !== chatId) {
        setChatId(nextChatId);
        setChats(await refreshChats(courseId));
      }
    });
  };

  const newChat = () => {
    setChatId(null);
    setTurns([]);
    setQuestion("");
    inputRef.current?.focus();
  };

  const switchChat = (id: string) => {
    if (!id) return newChat();
    startSwitch(async () => {
      const loaded = await openChat(id);
      if (loaded) {
        setChatId(id);
        setTurns(loaded.map((r) => ({ question: r.question, result: r })));
      }
    });
  };

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const removeChat = () => {
    if (!chatId) return;
    startSwitch(async () => {
      const list = await deleteChat(chatId, courseId);
      if (list) {
        setChats(list);
        newChat();
        toast("Chat deleted", {
          description: "It's gone from your past chats.",
        });
      } else {
        toast("Couldn't delete that chat", {
          tone: "error",
          description: "Try again in a moment.",
        });
      }
    });
  };

  return (
    <section
      aria-labelledby="ask-heading"
      className="rounded-2xl bg-brand-gradient p-px shadow-[0_18px_40px_-24px_var(--brand)]"
    >
      <div className="overflow-hidden rounded-[calc(1rem-1px)] bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2
              id="ask-heading"
              className="flex items-center gap-1.5 font-semibold"
            >
              <span className="grid size-6 place-items-center rounded-md bg-brand-gradient text-brand-foreground">
                <Sparkles className="size-3.5" aria-hidden />
              </span>
              Ask the student knowledge
            </h2>
            <p className="text-xs text-muted-foreground">
              Answers come only from what {courseCode} students have shared.
            </p>
          </div>
          {signedIn && (
            <div className="flex items-center gap-1.5">
              {chats.length > 0 && (
                <label className="relative">
                  <span className="sr-only">Past chats</span>
                  <History
                    className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <select
                    value={chatId ?? ""}
                    onChange={(e) => switchChat(e.target.value)}
                    disabled={pending || switching}
                    className="h-8 max-w-44 rounded-lg border border-input bg-background pr-2 pl-7 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">
                      {chatId ? "Past chats" : "New chat"}
                    </option>
                    {chats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {chatId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setConfirmingDelete(true)}
                  disabled={pending || switching}
                  aria-label="Delete this chat"
                >
                  <Trash2 />
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={newChat}
                disabled={pending || (!chatId && turns.length === 0)}
              >
                <Plus />
                New chat
              </Button>
            </div>
          )}
        </div>

        <p className="flex items-start gap-2 border-b bg-brand/5 px-4 py-2 text-xs text-muted-foreground sm:px-5">
          <Info className="mt-px size-3.5 shrink-0 text-brand" aria-hidden />
          {AI_DISCLAIMER}
        </p>

        <div
          className={cn(
            "px-4 sm:px-5",
            (turns.length > 0 || !signedIn) && "py-4",
            // Long chats scroll inside the card so the course tabs stay in reach.
            turns.length > 0 &&
              "max-h-[36rem] overflow-y-auto overscroll-contain",
          )}
        >
          {!signedIn ? (
            <p className="text-sm">
              <SignInLink className="font-medium text-foreground underline-offset-4 hover:underline">
                Sign in
              </SignInLink>{" "}
              to ask questions answered from {courseCode} student posts. Your
              chats are saved to your account.
            </p>
          ) : (
            turns.length > 0 && (
              <ol
                className={cn(
                  "flex flex-col gap-6 transition-opacity",
                  switching && "opacity-50",
                )}
              >
                {turns.map((turn, i) => (
                  <li
                    key={i}
                    data-turn
                    ref={i === turns.length - 1 ? lastTurnRef : undefined}
                    className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300"
                  >
                    <QuestionBubble text={turn.question} />
                    {turn.result ? (
                      <AiAnswer result={turn.result} />
                    ) : (
                      <Thinking />
                    )}
                  </li>
                ))}
              </ol>
            )
          )}
        </div>

        {signedIn && (
          <div
            className={cn(
              "flex flex-col gap-3 px-4 pb-4 sm:px-5",
              turns.length > 0 ? "border-t pt-3" : "pt-4",
            )}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(question);
              }}
              className="flex items-center gap-2"
            >
              <label htmlFor="ask-question" className="sr-only">
                Your question
              </label>
              <div className="relative min-w-0 flex-1">
                <Sparkles
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  id="ask-question"
                  ref={inputRef}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  maxLength={QUESTION_MAX}
                  placeholder={
                    turns.length
                      ? "Ask a follow-up…"
                      : `Ask anything about ${courseCode}…`
                  }
                  disabled={pending}
                  className="h-12 w-full rounded-lg border border-input bg-background pr-4 pl-10 text-[0.95rem] outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-foreground/40 focus-visible:ring-4 focus-visible:ring-ring/20"
                />
              </div>
              <Button
                type="submit"
                size="icon-lg"
                className="size-12 shrink-0 rounded-lg"
                disabled={pending || question.trim().length < QUESTION_MIN}
                aria-label="Search student knowledge"
              >
                <ArrowUp />
              </Button>
            </form>
            {turns.length === 0 && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    disabled={pending}
                    className="rounded-md border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title="Delete this chat?"
        description="The questions and answers in it will be removed. This can't be undone."
        confirmLabel="Delete chat"
        onConfirm={removeChat}
      />
    </section>
  );
}
