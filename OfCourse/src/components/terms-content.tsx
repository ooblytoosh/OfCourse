import { TERMS, TERMS_VERSION } from "@/lib/terms";

export function TermsContent() {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <ol className="flex flex-col gap-3">
        {TERMS.map((t, i) => (
          <li key={t.heading} className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
              {i + 1}
            </span>
            <div>
              <p className="font-medium">{t.heading}</p>
              <p className="mt-0.5 text-muted-foreground">{t.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">Version: {TERMS_VERSION}</p>
    </div>
  );
}
