"use client";

import { PowerOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";

import { BulbIcon } from "@/components/bulb/bulb-icon";
import { SignInLink } from "@/components/sign-in-link";
import { useFlashError } from "@/hooks/use-flash-error";
import { setCommentBulb, setPostBulb, type BulbValue } from "@/lib/actions/community";
import { bulbLevel, bulbSummary } from "@/lib/bulb";
import type { Bulb } from "@/lib/data/posts";
import { VERIFY_HREF } from "@/lib/participation";
import { cn } from "@/lib/utils";

type State = { lit: number; off: number; vote: -1 | 0 | 1 };

function apply(state: State, vote: BulbValue): State {
  let { lit, off } = state;
  if (state.vote === 1) lit -= 1;
  if (state.vote === -1) off -= 1;
  if (vote === 1) lit += 1;
  if (vote === -1) off += 1;
  return { lit, off, vote };
}

// Cracked bulbs play their crack once per browser.
function useFirstSeen(id: string, active: boolean) {
  const [fresh, setFresh] = useState(false);
  useEffect(() => {
    if (!active) return;
    try {
      const key = "ofcourse:seen-cracked";
      const seen = new Set((localStorage.getItem(key) ?? "").split(",").filter(Boolean));
      if (seen.has(id)) return;
      seen.add(id);
      localStorage.setItem(key, [...seen].slice(-300).join(","));
      const t = setTimeout(() => setFresh(true), 0);
      return () => clearTimeout(t);
    } catch {}
  }, [id, active]);
  return fresh;
}

// The lightbulb vote: tap the bulb to switch it ON (helpful), tap the switch
// to turn it OFF (not helpful); tap again to undo. Brightness shows how
// helpful other students found it.
export function BulbVote({
  kind,
  id,
  bulb,
  signedIn,
  canVote = true,
  layout = "inline",
  className,
}: {
  kind: "post" | "comment";
  id: string;
  bulb: Bulb;
  signedIn: boolean;
  canVote?: boolean;
  layout?: "stacked" | "inline" | "compact";
  className?: string;
}) {
  const [state, setOptimistic] = useOptimistic<State, BulbValue>(
    { lit: bulb.lit, off: bulb.off, vote: bulb.viewerVote },
    apply,
  );
  const [pending, startTransition] = useTransition();
  const [error, flashError] = useFlashError();
  const [flash, setFlash] = useState(0);
  const [tip, setTip] = useState(false);
  const press = useRef<ReturnType<typeof setTimeout> | null>(null);

  const level = bulbLevel(state.lit, state.off);
  const summary = bulbSummary(state.lit, state.off, level);
  const crack = useFirstSeen(id, level === 1);
  const small = layout === "compact";

  const vote = (next: BulbValue) =>
    startTransition(async () => {
      setOptimistic(next);
      if (next === 1) setFlash((n) => n + 1);
      const action = kind === "post" ? setPostBulb : setCommentBulb;
      const result = await action(id, next);
      if (!result.ok) flashError(result.error);
    });

  const longPress = {
    onPointerDown: () => {
      press.current = setTimeout(() => setTip(true), 450);
    },
    onPointerUp: () => press.current && clearTimeout(press.current),
    onPointerLeave: () => {
      if (press.current) clearTimeout(press.current);
      setTip(false);
    },
    onMouseEnter: () => setTip(true),
  };

  const icon = (
    <BulbIcon
      key={flash}
      level={level}
      size={small ? 15 : layout === "stacked" ? 22 : 18}
      flash={flash > 0}
      crack={crack}
      className={cn(state.vote === -1 && "bulb-click-off")}
    />
  );
  const count = <span className="tabular-nums">{state.lit}</span>;
  const bulbClass = cn(
    "group/bulb relative z-10 inline-flex items-center justify-center rounded-lg border font-semibold transition-all duration-200 active:scale-95",
    layout === "stacked" ? "w-11 flex-col gap-0.5 py-1.5 text-xs" : small ? "h-7 gap-1 px-1.5 text-xs" : "h-8 gap-1.5 px-2.5 text-sm",
    state.vote === 1
      ? "border-brand/60 bg-brand/15 text-brand shadow-[0_0_18px_-6px_var(--brand)]"
      : "border-border bg-card text-muted-foreground hover:border-brand/50 hover:text-foreground",
  );

  const tooltip = tip && (
    <span
      role="tooltip"
      className={cn(
        "pointer-events-none absolute z-30 rounded-md border bg-popover px-2 py-1 text-[0.7rem] font-medium whitespace-nowrap text-popover-foreground shadow-lg animate-in fade-in zoom-in-95",
        layout === "stacked" ? "top-0 left-full ml-2" : "bottom-full left-0 mb-1.5",
      )}
    >
      {summary}
    </span>
  );

  if (!signedIn || !canVote) {
    const content = (
      <>
        {icon}
        {count}
        <span className="sr-only">. {summary}.</span>
      </>
    );
    return (
      <span className={cn("relative inline-flex", className)} {...longPress}>
        {signedIn ? (
          <Link href={VERIFY_HREF} className={bulbClass} title="Verify your university email to vote">
            {content}
          </Link>
        ) : (
          <SignInLink className={bulbClass} title="Sign in to vote">
            {content}
          </SignInLink>
        )}
        {tooltip}
      </span>
    );
  }

  return (
    <span
      className={cn("relative inline-flex", layout === "stacked" ? "flex-col items-center gap-1" : "items-center gap-1", className)}
      {...longPress}
    >
      <button
        type="button"
        className={bulbClass}
        aria-pressed={state.vote === 1}
        aria-label={`${state.vote === 1 ? "Switch off your light" : "Light this up (helpful)"}. ${summary}`}
        disabled={pending}
        onClick={() => vote(state.vote === 1 ? 0 : 1)}
      >
        {icon}
        {count}
      </button>
      <button
        type="button"
        aria-pressed={state.vote === -1}
        aria-label={state.vote === -1 ? "Undo not helpful" : "Not helpful (switch off)"}
        title={state.vote === -1 ? "You marked this not helpful" : "Not helpful"}
        disabled={pending}
        onClick={() => vote(state.vote === -1 ? 0 : -1)}
        className={cn(
          "relative z-10 grid place-items-center rounded-md transition-colors",
          small ? "size-6" : "size-7",
          state.vote === -1
            ? "bg-muted text-foreground ring-1 ring-border"
            : "text-muted-foreground/60 hover:bg-muted hover:text-foreground",
        )}
      >
        <PowerOff className={small ? "size-3" : "size-3.5"} aria-hidden />
      </button>
      {tooltip}
      {error && (
        <span role="alert" className="absolute top-full left-0 z-20 mt-1 text-xs whitespace-nowrap text-destructive">
          {error}
        </span>
      )}
    </span>
  );
}
