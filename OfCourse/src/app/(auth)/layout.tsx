import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <ThemeToggle className="absolute top-4 right-4" />
      <Logo />
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
