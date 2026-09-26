// URL helpers usable from both server and client components.

export function profileHref(p: { id: string; username: string | null }): string {
  return `/u/${p.username ?? p.id}`;
}
