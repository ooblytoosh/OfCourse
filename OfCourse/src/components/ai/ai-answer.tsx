"use client";

import { ArrowBigUp, Info, Sparkles } from "lucide-react";
import Link from "next/link";
import { Fragment, useState } from "react";

import { PostTypeBadge } from "@/components/post/post-type-badge";
import { authorName, UserAvatar } from "@/components/user-avatar";
import { VerifiedBadge } from "@/components/verified-badge";
import type { AskResult, AskSource } from "@/lib/ai/search";
import { profileHref } from "@/lib/links";
import { cn } from "@/lib/utils";

const postHref = (s: AskSource) => `/c/${s.course.slug}/posts/${s.id}`;

// Turns "[S2]" citations into links to the real posts they refer to.
function AnswerText({ text, sources }: { text: string; sources: AskSource[] }) {
  const renderLine = (line: string) =>
    line.split(/(\[S\d+\])/g).map((part, i) => {
      const match = part.match(/^\[S(\d+)\]$/);
      const source = match ? sources[Number(match[1]) - 1] : undefined;
      if (!source) return <Fragment key={i}>{part}</Fragment>;
      return (
        <Link
          key={i}
          href={postHref(source)}
          title={source.title}
          className="mx-0.5 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded bg-brand/10 px-1 align-text-top text-[0.7rem] font-semibold text-brand no-underline hover:bg-brand/20"
        >
          {match![1]}
        </Link>
      );
    });

  const blocks = text.split(/\n{2,}/);
  return (
    <div className="flex flex-col gap-3 text-[0.95rem] leading-relaxed">
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter(Boolean);
        if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
          return (
            <ul key={i} className="flex list-disc flex-col gap-1.5 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{renderLine(l.replace(/^\s*[-*•]\s+/, "").replace(/\*\*/g, ""))}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{renderLine(block.replace(/\*\*/g, ""))}</p>;
      })}
    </div>
  );
}

export function SourceCard({ source, index }: { source: AskSource; index?: number }) {
  return (
    <li className="flex flex-col gap-1.5 rounded-xl border bg-card p-3.5">
      <div className="flex items-center gap-2">
        {index !== undefined && (
          <span className="grid size-5 shrink-0 place-items-center rounded bg-brand/10 text-[0.7rem] font-semibold text-brand">
            {index}
          </span>
        )}
        <PostTypeBadge type={source.type} />
      </div>
      <Link href={postHref(source)} className="font-medium leading-snug hover:underline">
        {source.title}
      </Link>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
        {source.author ? (
          <Link
            href={profileHref(source.author)}
            className="inline-flex items-center gap-1.5 font-medium text-foreground hover:underline"
          >
            <UserAvatar author={source.author} className="size-5" />
            {authorName(source.author)}
          </Link>
        ) : (
          <span>{authorName(null)}</span>
        )}
        {source.author?.university && <VerifiedBadge university={source.author.university} />}
        <span aria-hidden>·</span>
        <span>{source.course.code}</span>
        {source.semester && (
          <>
            <span aria-hidden>·</span>
            <span>{source.semester}</span>
          </>
        )}
        <span aria-hidden>·</span>
        <span className="inline-flex items-center">
          <ArrowBigUp className="size-3.5" />
          {source.voteScore}
        </span>
      </div>
    </li>
  );
}

const SHOWN = 3;

// A course knowledge search result: question, synthesis, and the real student
// posts it drew on. Sources come from database records, never from the model.
export function AiAnswer({ result, onReset }: { result: AskResult; onReset: () => void }) {
  const [showAll, setShowAll] = useState(false);

  if (result.status === "error") {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm" role="alert">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p>{result.message}</p>
      </div>
    );
  }

  if (result.status === "no_results") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">You asked: “{result.question}”</p>
        <div className="rounded-lg bg-muted p-3 text-sm">
          <p className="font-medium">I couldn&apos;t find enough student-created content for this question yet.</p>
          <p className="mt-1 text-muted-foreground">
            Try browsing the course discussions below, or ask the community by{" "}
            <Link href="/new" className="font-medium text-foreground underline-offset-4 hover:underline">
              creating a post
            </Link>
            .
          </p>
        </div>
        {result.closest.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Closest posts
            </p>
            <ul className="grid gap-2 sm:grid-cols-3">
              {result.closest.map((s) => (
                <SourceCard key={s.id} source={s} />
              ))}
            </ul>
          </div>
        )}
        <button type="button" onClick={onReset} className="w-fit text-sm font-medium text-muted-foreground hover:text-foreground">
          Ask something else
        </button>
      </div>
    );
  }

  const { sources } = result;
  const visible = showAll ? sources : sources.slice(0, SHOWN);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">You asked: “{result.question}”</p>

      <div className="rounded-xl border border-brand/20 bg-brand/[0.03] p-4">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles className="size-4 text-brand" />
          Student knowledge
        </p>
        <p className="mb-3 text-sm text-muted-foreground">
          I found {sources.length} student-created {sources.length === 1 ? "resource" : "resources"} related
          to your question. Here&apos;s a synthesis of how students explain it:
        </p>
        <AnswerText text={result.answer} sources={sources} />
        <p className="mt-3 text-xs text-muted-foreground">
          AI summary of student posts. Numbers link to the posts it drew on; check them for the full
          explanations.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Student explanations
        </p>
        <ul className={cn("grid gap-2", visible.length > 1 && "sm:grid-cols-2 lg:grid-cols-3")}>
          {visible.map((s) => (
            <SourceCard key={s.id} source={s} index={sources.indexOf(s) + 1} />
          ))}
        </ul>
        <div className="flex items-center gap-4 text-sm">
          {sources.length > SHOWN && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {showAll ? "Show fewer" : `View all ${sources.length} resources`}
            </button>
          )}
          <button type="button" onClick={onReset} className="font-medium text-muted-foreground hover:text-foreground">
            Ask something else
          </button>
        </div>
      </div>
    </div>
  );
}
