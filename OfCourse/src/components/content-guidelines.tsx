import { Check, X } from "lucide-react";

import { POST_TYPES, PROHIBITED_CONTENT } from "@/lib/content-policy";

// What can and can't be posted. Used on /guidelines and the post composer.
export function ContentGuidelines() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <section className="rounded-xl border p-5">
        <h2 className="font-medium">Share your own work</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {Object.values(POST_TYPES).map(({ label, description }) => (
            <li key={label} className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              <span>
                <span className="font-medium">{label}</span>{" "}
                <span className="text-muted-foreground">— {description}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border p-5">
        <h2 className="font-medium">Never post</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {PROHIBITED_CONTENT.map((item) => (
            <li key={item} className="flex gap-2">
              <X className="mt-0.5 size-4 shrink-0 text-destructive" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
