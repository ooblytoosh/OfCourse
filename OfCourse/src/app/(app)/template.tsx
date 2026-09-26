// Re-rendered on every navigation, so each page gently fades in.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">{children}</div>;
}
