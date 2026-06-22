"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function Masthead() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="no-print border-b border-ink/80">
      <div className="mx-auto flex max-w-6xl items-baseline justify-between px-6 py-4">
        <Link href="/projects" className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold tracking-tight">
            Маяк<span className="text-pine">*</span>
          </span>
          <span className="hidden text-[11px] uppercase tracking-[0.18em] text-mute sm:inline">
            SEO-аналитика
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/projects" className="text-ink-2 hover:text-ink">
            Проекты
          </Link>
          <button onClick={logout} className="cursor-pointer text-ink-2 hover:text-rust">
            Выйти
          </button>
        </nav>
      </div>
    </header>
  );
}
