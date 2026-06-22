"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    setBusy(false);
    if (res.ok) {
      router.push("/projects");
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Что-то пошло не так");
    }
  }

  const inputCls =
    "w-full border border-line bg-white px-3 py-2.5 text-sm placeholder:text-mute";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="font-display text-5xl font-semibold tracking-tight">
            Маяк<span className="text-pine">*</span>
          </div>
          <div className="mt-3 text-[11px] uppercase tracking-[0.22em] text-mute">
            SEO-аналитика · Метрика · GSC · Вебмастер
          </div>
        </div>

        <div className="border border-line bg-card p-6">
          <div className="mb-6 flex border-b border-line text-sm">
            {(
              [
                ["login", "Вход"],
                ["register", "Регистрация"],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`-mb-px cursor-pointer border-b-2 px-4 py-2 ${
                  mode === m
                    ? "border-pine font-medium text-ink"
                    : "border-transparent text-mute hover:text-ink-2"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <input
                className={inputCls}
                placeholder="Имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <input
              className={inputCls}
              type="email"
              required
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className={inputCls}
              type="password"
              required
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <div className="text-sm text-rust">{error}</div>}
            <button
              disabled={busy}
              className="w-full cursor-pointer bg-night px-4 py-2.5 text-sm font-medium text-paper hover:bg-night-2 disabled:opacity-50"
            >
              {busy ? "Секунду…" : mode === "login" ? "Войти" : "Создать аккаунт"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-mute">
          Несколько проектов в одном кабинете, брендированные отчёты,
          <br />
          органика, цели и страницы входа — на одном экране.
        </p>
      </div>
    </main>
  );
}
