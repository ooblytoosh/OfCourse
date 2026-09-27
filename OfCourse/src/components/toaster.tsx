"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

type Toast = { id: number; title: string; description?: string; tone: "success" | "error" };

// A tiny toast store: call toast() from any client component.
let toasts: Toast[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
let nextId = 1;

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function toast(title: string, options: { description?: string; tone?: Toast["tone"] } = {}) {
  const id = nextId++;
  toasts = [...toasts.slice(-2), { id, title, description: options.description, tone: options.tone ?? "success" }];
  emit();
  setTimeout(() => dismiss(id), 3500);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const EMPTY: Toast[] = [];

export function Toaster() {
  const items = useSyncExternalStore(subscribe, () => toasts, () => EMPTY);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:right-4 sm:left-auto sm:items-end"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-popover p-3.5 text-popover-foreground shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-300"
        >
          {t.tone === "success" ? (
            <CircleCheck className="mt-0.5 size-5 shrink-0 text-good" aria-hidden />
          ) : (
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{t.title}</p>
            {t.description && <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>}
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
            className={cn("rounded p-0.5 text-muted-foreground hover:text-foreground")}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
