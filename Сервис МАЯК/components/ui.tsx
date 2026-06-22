import type { ReactNode } from "react";

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`text-[11px] font-medium uppercase tracking-[0.16em] text-mute ${className ?? ""}`}>
      {children}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`border border-line bg-card ${className ?? ""}`}>{children}</div>;
}

export function SectionHead({ kicker, title, right }: { kicker: string; title?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 border-b border-ink/80 pb-2">
      <div>
        <Kicker>{kicker}</Kicker>
        {title && <h2 className="font-display mt-1 text-xl font-medium">{title}</h2>}
      </div>
      {right}
    </div>
  );
}

export function SourceBadge({ live, label }: { live: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px] tracking-wide ${
        live ? "border-pine/30 bg-pine-soft text-pine" : "border-honey/30 bg-honey-soft text-honey"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-pine" : "bg-honey"}`} />
      {label} · {live ? "API" : "демо"}
    </span>
  );
}

export function ProjectLogo({
  logo,
  name,
  size = 44,
}: {
  logo: string;
  name: string;
  size?: number;
}) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={name}
        width={size}
        height={size}
        className="border border-line bg-white object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="font-display flex items-center justify-center bg-night font-semibold text-paper"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {(name.trim()[0] ?? "•").toUpperCase()}
    </div>
  );
}

export function Delta({ value, invertGood }: { value: number | null; invertGood?: boolean }) {
  if (value === null || Number.isNaN(value)) return null;
  const up = value >= 0;
  const good = invertGood ? !up : up;
  const txt = `${up ? "▲" : "▼"} ${Math.abs(value).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}%`;
  return (
    <span className={`tnum text-xs font-medium ${good ? "text-pine" : "text-rust"}`} title="к прошлому периоду">
      {txt}
    </span>
  );
}

export function Stat({
  label,
  value,
  sub,
  accent,
  delta,
  deltaInvertGood,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "pine" | "honey";
  /** % к прошлому периоду; null/undefined — не показывать */
  delta?: number | null;
  /** рост — это плохо (отказы, средняя позиция) */
  deltaInvertGood?: boolean;
}) {
  return (
    <div className="px-5 py-4 first:pl-0">
      <Kicker>{label}</Kicker>
      <div className="flex flex-wrap items-baseline gap-x-2.5">
        <span
          className={`font-display tnum mt-1 text-[2rem] leading-tight font-medium ${
            accent === "pine" ? "text-pine" : accent === "honey" ? "text-honey" : "text-ink"
          }`}
        >
          {value}
        </span>
        {delta !== undefined && <Delta value={delta} invertGood={deltaInvertGood} />}
      </div>
      {sub && <div className="tnum mt-0.5 text-xs text-ink-2">{sub}</div>}
    </div>
  );
}

export function BarRow({
  name,
  value,
  share,
  max,
  color = "var(--color-pine)",
}: {
  name: string;
  value: string;
  share?: string;
  max: number;
  color?: string;
}) {
  return (
    <div className="py-2">
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate">{name}</span>
        <span className="tnum shrink-0 text-ink-2">
          {value}
          {share && <span className="ml-2 text-mute">{share}</span>}
        </span>
      </div>
      <div className="h-[5px] w-full bg-line-soft">
        <div className="h-full" style={{ width: `${Math.min(max, 100)}%`, background: color }} />
      </div>
    </div>
  );
}
