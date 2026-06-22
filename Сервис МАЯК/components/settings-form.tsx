"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ProjectDTO } from "@/lib/types";
import type { IntegrationOptions } from "@/app/api/projects/[id]/integration-options/route";
import { Kicker, ProjectLogo } from "@/components/ui";

const inputCls = "w-full border border-line bg-white px-3 py-2.5 text-sm placeholder:text-mute";
const selectCls = "w-full border border-line bg-white px-3 py-2.5 text-sm";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-sm font-medium">{label}</div>
      {children}
      {hint && <div className="mt-1.5 text-xs leading-relaxed text-mute">{hint}</div>}
    </label>
  );
}

function ConnectedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 border border-pine/30 bg-pine-soft px-2.5 py-1 text-xs text-pine">
      <span className="h-1.5 w-1.5 rounded-full bg-pine" />
      Аккаунт подключён
    </span>
  );
}

type TvProject = { id: number; name: string; site: string; regionIndex: string };

type Banner = { kind: "ok" | "err"; text: string };

function initialBanner(): Banner | null {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search);
  if (q.get("connected") === "yandex") {
    return { kind: "ok", text: "Яндекс подключён: токен получен, счётчик и хост подобраны по домену. Проверьте и сохраните." };
  }
  if (q.get("connected") === "google") {
    return { kind: "ok", text: "Google подключён: доступ к Search Console получен, ресурс подобран по домену." };
  }
  const err = q.get("oauth_error");
  return err ? { kind: "err", text: err } : null;
}

function makeShareUrl(token: string): string {
  return typeof window !== "undefined" && token ? `${window.location.origin}/r/${token}` : "";
}

export function SettingsForm({ initial }: { initial: ProjectDTO }) {
  const router = useRouter();
  const [p, setP] = useState(initial);
  const [opts, setOpts] = useState<IntegrationOptions | null>(null);
  const [banner] = useState<Banner | null>(() => initialBanner());
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tvProjects, setTvProjects] = useState<TvProject[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState(() => makeShareUrl(initial.shareToken));

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("connected") || q.get("oauth_error")) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  useEffect(() => {
    fetch(`/api/projects/${initial.id}/integration-options`)
      .then((r) => r.json())
      .then(setOpts)
      .catch(() => {});
  }, [initial.id]);

  // список проектов Топвизора подгружаем, когда есть токен и user-id
  useEffect(() => {
    if (p.tvToken && p.tvUserId) {
      fetch(`/api/projects/${initial.id}/topvisor-projects`)
        .then((r) => r.json())
        .then((j) => setTvProjects(j.projects ?? []))
        .catch(() => setTvProjects([]));
    }
    // намеренно реагируем только на сохранённые в базе значения, не на каждый ввод
  }, [initial.id, initial.tvToken, initial.tvUserId, p.tvToken, p.tvUserId]);

  const set = (key: keyof ProjectDTO) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setP({ ...p, [key]: e.target.value });
      setSaved(false);
    };

  function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      setError("Логотип слишком большой — до 500 КБ (PNG/SVG/JPG)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setP((prev) => ({ ...prev, logo: String(reader.result) }));
      setSaved(false);
      setError("");
    };
    reader.readAsDataURL(file);
  }

  async function save(patch?: Partial<ProjectDTO>) {
    setBusy(true);
    setError("");
    const body = patch ? { ...p, ...patch } : p;
    const res = await fetch(`/api/projects/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) {
      const { project } = await res.json();
      setP(project);
      setSaved(true);
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Не удалось сохранить");
    }
  }

  async function disconnect(kind: "yandex" | "google") {
    const patch: Partial<ProjectDTO> =
      kind === "yandex"
        ? { metrikaToken: "", wmToken: "", wmHostId: "" }
        : { gscCredentials: "" };
    await save(patch);
    setOpts(null);
    fetch(`/api/projects/${p.id}/integration-options`).then((r) => r.json()).then(setOpts).catch(() => {});
  }

  async function remove() {
    if (!confirm(`Удалить проект «${p.name}»? Это действие необратимо.`)) return;
    await fetch(`/api/projects/${p.id}`, { method: "DELETE" });
    router.push("/projects");
    router.refresh();
  }

  async function enableShare() {
    const res = await fetch(`/api/projects/${p.id}/share`, { method: "POST" });
    if (res.ok) {
      const { project } = await res.json();
      setP(project);
      setShareUrl(makeShareUrl(project.shareToken));
    }
  }

  async function revokeShare() {
    if (!confirm("Отозвать ссылку? Старый адрес перестанет открываться.")) return;
    const res = await fetch(`/api/projects/${p.id}/share`, { method: "DELETE" });
    if (res.ok) {
      const { project } = await res.json();
      setP(project);
      setShareUrl(makeShareUrl(project.shareToken));
    }
  }

  function copyShare() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  const yaConnected = Boolean(p.metrikaToken || p.wmToken);
  const gConnected = Boolean(p.gscCredentials);
  const tvConnected = Boolean(p.tvToken && p.tvUserId);
  const visibleTvProjects = tvConnected ? tvProjects : null;

  return (
    <main className="mx-auto max-w-3xl px-6 pb-24">
      <div className="border-b border-ink/80 pt-10 pb-4">
        <Kicker>
          <Link href={`/p/${p.id}`} className="hover:text-ink">← {p.name}</Link>
        </Kicker>
        <h1 className="font-display mt-1 text-4xl font-medium">Настройки проекта</h1>
      </div>

      {banner && (
        <div
          className={`mt-4 border px-4 py-3 text-sm ${
            banner.kind === "ok"
              ? "border-pine/30 bg-pine-soft text-pine"
              : "border-rust/30 bg-honey-soft text-rust"
          }`}
        >
          {banner.text}
        </div>
      )}

      <section className="mt-8 space-y-4">
        <Kicker>Проект и бренд</Kicker>
        <div className="grid gap-4 border border-line bg-card p-6 sm:grid-cols-2">
          <Field label="Название">
            <input className={inputCls} value={p.name} onChange={set("name")} />
          </Field>
          <Field label="Домен" hint="По нему подбираются счётчик Метрики, хост Вебмастера и ресурс GSC">
            <input className={inputCls} placeholder="example.ru" value={p.domain} onChange={set("domain")} />
          </Field>
          <div className="sm:col-span-2">
            <Field
              label="Брендовые слова"
              hint="Через запятую: по ним органика делится на бренд / небренд. Если пусто — берётся имя домена."
            >
              <input className={inputCls} placeholder="маяк, mayak, маяк сервис" value={p.brandKeywords} onChange={set("brandKeywords")} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <div className="mb-1.5 text-sm font-medium">Логотип для отчётов</div>
            <div className="flex items-center gap-4">
              <ProjectLogo logo={p.logo} name={p.name} size={56} />
              <label className="cursor-pointer border border-line bg-white px-3 py-2 text-sm hover:border-pine">
                Загрузить
                <input type="file" accept="image/*" className="hidden" onChange={onLogoFile} />
              </label>
              {p.logo && (
                <button
                  onClick={() => { setP({ ...p, logo: "" }); setSaved(false); }}
                  className="cursor-pointer text-sm text-rust hover:underline"
                >
                  Убрать
                </button>
              )}
              <span className="text-xs text-mute">PNG / SVG / JPG, до 500 КБ</span>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Яндекс ───── */}
      <section className="mt-8 space-y-4">
        <Kicker>Яндекс — Метрика и Вебмастер</Kicker>
        <div className="space-y-5 border border-line bg-card p-6">
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`/api/oauth/yandex/start?project=${p.id}`}
              className="inline-flex items-center gap-2.5 bg-night px-4 py-2.5 text-sm font-medium text-paper hover:bg-night-2"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#fc3f1d] text-[13px] font-bold text-white">
                Я
              </span>
              {yaConnected ? "Переподключить Яндекс" : "Войти через Яндекс"}
            </a>
            {yaConnected && <ConnectedBadge />}
            {yaConnected && (
              <button onClick={() => disconnect("yandex")} className="cursor-pointer text-sm text-rust hover:underline">
                Отключить
              </button>
            )}
          </div>
          <p className="text-xs leading-relaxed text-mute">
            Один вход даёт доступ сразу к Метрике и Вебмастеру (чтение). Токен сервис получит и сохранит сам,
            счётчик и хост подберутся по домену — ниже их можно поправить.
          </p>

          {opts?.yandex.error && yaConnected && (
            <div className="text-xs text-rust">⚠ {opts.yandex.error}</div>
          )}

          {yaConnected && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Счётчик Метрики">
                {opts && opts.yandex.counters.length > 0 ? (
                  <select className={selectCls} value={p.metrikaCounterId} onChange={set("metrikaCounterId")}>
                    <option value="">— не выбран —</option>
                    {opts.yandex.counters.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name || c.site} · №{c.id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input className={inputCls} placeholder={opts ? "счётчиков не найдено" : "загружаем список…"} value={p.metrikaCounterId} onChange={set("metrikaCounterId")} />
                )}
              </Field>
              <Field label="Хост Вебмастера">
                {opts && opts.yandex.hosts.length > 0 ? (
                  <select className={selectCls} value={p.wmHostId} onChange={set("wmHostId")}>
                    <option value="">— авто по домену —</option>
                    {opts.yandex.hosts.filter((h) => h.verified).map((h) => (
                      <option key={h.hostId} value={h.hostId}>
                        {h.url}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input className={inputCls} placeholder={opts ? "хостов не найдено" : "загружаем список…"} value={p.wmHostId} onChange={set("wmHostId")} />
                )}
              </Field>
            </div>
          )}

          {opts && !opts.env.yandex && (
            <div className="border border-honey/30 bg-honey-soft px-3 py-2 text-xs leading-relaxed text-ink-2">
              Кнопка заработает после настройки сервера: создайте приложение на oauth.yandex.ru
              (права — чтение Метрики и Вебмастера) и пропишите YANDEX_CLIENT_ID / YANDEX_CLIENT_SECRET в .env — см. README.
            </div>
          )}

          <details>
            <summary className="cursor-pointer text-xs text-mute hover:text-ink-2">
              Подключить вручную (токен)
            </summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="OAuth-токен (Метрика + Вебмастер)">
                <input
                  className={inputCls}
                  type="password"
                  placeholder="y0_AgA…"
                  value={p.metrikaToken}
                  onChange={(e) => {
                    setP({ ...p, metrikaToken: e.target.value, wmToken: e.target.value });
                    setSaved(false);
                  }}
                />
              </Field>
              <Field label="Номер счётчика">
                <input className={inputCls} placeholder="12345678" value={p.metrikaCounterId} onChange={set("metrikaCounterId")} />
              </Field>
            </div>
          </details>
        </div>
      </section>

      {/* ───── Google ───── */}
      <section className="mt-8 space-y-4">
        <Kicker>Google Search Console</Kicker>
        <div className="space-y-5 border border-line bg-card p-6">
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`/api/oauth/google/start?project=${p.id}`}
              className="inline-flex items-center gap-2.5 border border-line bg-white px-4 py-2.5 text-sm font-medium hover:border-ink"
            >
              <span className="font-display text-base font-semibold text-[#4285f4]">G</span>
              {gConnected ? "Переподключить Google" : "Войти через Google"}
            </a>
            {gConnected && <ConnectedBadge />}
            {gConnected && (
              <button onClick={() => disconnect("google")} className="cursor-pointer text-sm text-rust hover:underline">
                Отключить
              </button>
            )}
          </div>
          <p className="text-xs leading-relaxed text-mute">
            Доступ только на чтение Search Console. Ресурс подберётся по домену — ниже его можно сменить.
          </p>

          {opts?.google.error && gConnected && (
            <div className="text-xs text-rust">⚠ {opts.google.error}</div>
          )}

          {gConnected && (
            <Field label="Ресурс Search Console">
              {opts && opts.google.sites.length > 0 ? (
                <select className={selectCls} value={p.gscSiteUrl} onChange={set("gscSiteUrl")}>
                  <option value="">— не выбран —</option>
                  {opts.google.sites.map((s) => (
                    <option key={s.siteUrl} value={s.siteUrl}>
                      {s.siteUrl}
                    </option>
                  ))}
                </select>
              ) : (
                <input className={inputCls} placeholder={opts ? "sc-domain:example.ru" : "загружаем список…"} value={p.gscSiteUrl} onChange={set("gscSiteUrl")} />
              )}
            </Field>
          )}

          {opts && !opts.env.google && (
            <div className="border border-honey/30 bg-honey-soft px-3 py-2 text-xs leading-relaxed text-ink-2">
              Кнопка заработает после настройки сервера: создайте OAuth-клиент в Google Cloud Console
              (scope webmasters.readonly) и пропишите GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET в .env — см. README.
            </div>
          )}

          <details>
            <summary className="cursor-pointer text-xs text-mute hover:text-ink-2">
              Подключить вручную (сервисный аккаунт или токен)
            </summary>
            <div className="mt-3 grid gap-4">
              <Field label="Ресурс (siteUrl)" hint="Например, sc-domain:example.ru или https://example.ru/">
                <input className={inputCls} placeholder="sc-domain:example.ru" value={p.gscSiteUrl} onChange={set("gscSiteUrl")} />
              </Field>
              <Field
                label="Доступ"
                hint="JSON ключа сервисного аккаунта Google (его e-mail добавьте в пользователи ресурса GSC) — либо готовый OAuth access token."
              >
                <textarea
                  className={`${inputCls} h-28 font-mono text-xs`}
                  placeholder='{"type":"service_account", …}'
                  value={p.gscCredentials}
                  onChange={set("gscCredentials")}
                />
              </Field>
            </div>
          </details>
        </div>
      </section>

      {/* ───── Позиции ───── */}
      <section className="mt-8 space-y-4">
        <Kicker>Позиции — Топвизор или Keys.so</Kicker>
        <div className="space-y-5 border border-line bg-card p-6">
          <p className="text-xs leading-relaxed text-mute">
            Мониторинг позиций по вашему семантическому ядру. Подключите один из сервисов — данные о топ-3/топ-10 и
            видимости появятся на дашборде и в отчёте. Без подключения блок работает на демо-данных.
          </p>

          <div>
            <div className="mb-2 text-sm font-medium">
              Топвизор {tvConnected && <span className="ml-1 text-xs text-pine">● подключён</span>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="API-токен" hint="Топвизор → Настройки → API">
                <input className={inputCls} type="password" placeholder="токен" value={p.tvToken} onChange={set("tvToken")} />
              </Field>
              <Field label="User ID" hint="Идентификатор пользователя API (там же)">
                <input className={inputCls} placeholder="12345" value={p.tvUserId} onChange={set("tvUserId")} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Проект в Топвизоре">
                  {visibleTvProjects && visibleTvProjects.length > 0 ? (
                    <select
                      className={selectCls}
                      value={p.tvProjectId}
                      onChange={(e) => {
                        const sel = visibleTvProjects.find((t) => String(t.id) === e.target.value);
                        setP({
                          ...p,
                          tvProjectId: e.target.value,
                          tvRegionIndex: sel?.regionIndex ?? p.tvRegionIndex,
                        });
                        setSaved(false);
                      }}
                    >
                      <option value="">— не выбран —</option>
                      {visibleTvProjects.map((t) => (
                        <option key={t.id} value={String(t.id)}>
                          {t.name} · №{t.id}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={inputCls}
                      placeholder={tvConnected ? "сохраните токен — подгрузим список" : "ID проекта"}
                      value={p.tvProjectId}
                      onChange={set("tvProjectId")}
                    />
                  )}
                </Field>
              </div>
            </div>
          </div>

          <div className="border-t border-line-soft pt-5">
            <div className="mb-2 text-sm font-medium">
              Keys.so {p.keyssoToken && <span className="ml-1 text-xs text-pine">● подключён</span>}
            </div>
            <Field label="API-токен" hint="Keys.so → личный кабинет → API. Берётся видимость и распределение по топам для домена проекта.">
              <input className={inputCls} type="password" placeholder="X-Keyso-TOKEN" value={p.keyssoToken} onChange={set("keyssoToken")} />
            </Field>
            <div className="mt-2 text-xs text-mute">
              Если заполнены оба сервиса — приоритет у Топвизора (там есть динамика по дням).
            </div>
          </div>
        </div>
      </section>

      {/* ───── Публичная ссылка ───── */}
      <section className="mt-8 space-y-4">
        <Kicker>Публичная ссылка на отчёт</Kicker>
        <div className="space-y-4 border border-line bg-card p-6">
          <p className="text-xs leading-relaxed text-mute">
            Ссылка открывает отчёт без входа в кабинет — удобно отправлять клиенту. Доступ только на чтение,
            настройки и токены не видны. В любой момент можно отозвать.
          </p>
          {p.shareToken ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <input className={`${inputCls} flex-1 min-w-0`} readOnly value={shareUrl} onFocus={(e) => e.target.select()} />
                <button onClick={copyShare} className="cursor-pointer border border-line bg-white px-3 py-2.5 text-sm hover:border-pine">
                  {copied ? "Скопировано ✓" : "Копировать"}
                </button>
                <a href={shareUrl} target="_blank" rel="noreferrer" className="cursor-pointer border border-line bg-white px-3 py-2.5 text-sm hover:border-pine">
                  Открыть
                </a>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={enableShare} className="cursor-pointer text-sm text-ink-2 hover:text-ink hover:underline">
                  Сгенерировать новую
                </button>
                <button onClick={revokeShare} className="cursor-pointer text-sm text-rust hover:underline">
                  Отозвать ссылку
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={enableShare}
              className="cursor-pointer bg-night px-4 py-2.5 text-sm font-medium text-paper hover:bg-night-2"
            >
              Создать публичную ссылку
            </button>
          )}
        </div>
      </section>

      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={() => save()}
          disabled={busy}
          className="cursor-pointer bg-pine px-5 py-2.5 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Сохраняем…" : "Сохранить"}
        </button>
        {saved && <span className="text-sm text-pine">Сохранено ✓</span>}
        {error && <span className="text-sm text-rust">{error}</span>}
      </div>

      <div className="mt-16 border-t border-line pt-6">
        <button onClick={remove} className="cursor-pointer text-sm text-rust hover:underline">
          Удалить проект
        </button>
      </div>
    </main>
  );
}
