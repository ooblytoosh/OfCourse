"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { AiAnswer } from "@/components/ai/ai-answer";
import { SignInLink } from "@/components/sign-in-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askCourseQuestion } from "@/lib/actions/ai";
import { AI_LIMITS } from "@/lib/ai/config";
import type { AskResult } from "@/lib/ai/search";

const LOADING_STEPS = [
  "Searching student knowledge…",
  "Finding relevant explanations…",
  "Synthesizing what students have shared…",
];

function LoadingState() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 1800);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col gap-3" role="status" aria-live="polite">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="size-4 animate-pulse text-brand" />
        {LOADING_STEPS[step]}
      </p>
      <div className="flex flex-col gap-2">
        <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

// "Ask the student knowledge" at the top of a course feed. Answers come only
// from this course's student posts, with links back to them.
export function AskStudentKnowledge({
  courseId,
  courseCode,
  signedIn,
}: {
  courseId: string;
  courseCode: string;
  signedIn: boolean;
}) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResult | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const q = question.trim();
    if (q.length < AI_LIMITS.questionMin) return;
    setResult(null);
    startTransition(async () => {
      try {
        setResult(await askCourseQuestion(courseId, q));
      } catch {
        setResult({ status: "error", question: q, message: "Couldn't reach OfCourse. Check your connection and try again." });
      }
    });
  };

  return (
    <section className="rounded-xl border bg-card p-4" aria-labelledby="ask-heading">
      <h2 id="ask-heading" className="flex items-center gap-1.5 text-sm font-semibold">
        <Sparkles className="size-4 text-brand" />
        Ask the student knowledge
      </h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        What are you trying to figure out? Answers come from what {courseCode} students have shared.
      </p>

      {signedIn ? (
        <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="ask-question" className="sr-only">
            Your question
          </label>
          <Input
            id="ask-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={AI_LIMITS.questionMax}
            placeholder="e.g. I'm struggling with AVL rotations. Why do they work?"
            className="h-10 flex-1"
            disabled={pending}
          />
          <Button
            type="submit"
            className="h-10 px-4"
            disabled={pending || question.trim().length < AI_LIMITS.questionMin}
          >
            <Sparkles />
            Search student knowledge
          </Button>
        </form>
      ) : (
        <p className="mt-3 text-sm">
          <SignInLink className="font-medium text-foreground underline-offset-4 hover:underline">
            Sign in
          </SignInLink>{" "}
          to ask questions answered from {courseCode} student posts.
        </p>
      )}

      {(pending || result) && (
        <div className="mt-4 border-t pt-4">
          {pending ? <LoadingState /> : result && <AiAnswer result={result} onReset={() => { setResult(null); setQuestion(""); }} />}
        </div>
      )}

    </section>
  );
}
