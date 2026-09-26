"use client";

import { useCallback, useEffect, useState } from "react";

// A short-lived error message for small inline controls (vote, save, join…),
// shown next to the control instead of a browser alert.
export function useFlashError(ms = 4000) {
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(null), ms);
    return () => clearTimeout(id);
  }, [error, ms]);
  return [error, useCallback((message: string) => setError(message), [])] as const;
}
