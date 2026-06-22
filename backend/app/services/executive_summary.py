from __future__ import annotations

from typing import Any


def build_executive_summary(data: dict[str, Any]) -> str:
    parts: list[str] = []

    metrika = data.get("yandex_metrika") or {}
    stats = metrika.get("stats") or {}
    totals = stats.get("totals") or []
    if totals and isinstance(totals, list):
        visits = totals[0] if len(totals) > 0 else 0
        parts.append(f"Трафик: {int(visits)} визитов.")

    gsc = data.get("gsc") or {}
    analytics = gsc.get("search_analytics") or {}
    rows = analytics.get("rows") or []
    if rows:
        clicks = sum(r.get("clicks", 0) for r in rows)
        impressions = sum(r.get("impressions", 0) for r in rows)
        parts.append(f"Поиск: {int(clicks)} кликов, {int(impressions)} показов.")

    if not parts:
        return "Данных пока недостаточно для вывода."

    return " ".join(parts)
