export function fmtInt(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
}

export function fmtPct(n: number): string {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(n)}%`;
}

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function fmtDayMonth(iso: string): string {
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
}

/** изменение в процентах к прошлому периоду; null — если сравнивать не с чем */
export function pctDelta(cur: number, prev?: number): number | null {
  if (prev === undefined || prev <= 0) return null;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}
