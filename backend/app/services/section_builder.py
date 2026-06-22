from __future__ import annotations

from typing import Any


def build_sections(data: dict[str, Any]) -> list[dict[str, str]]:
    sections: list[dict[str, str]] = []

    metrika = data.get("yandex_metrika") or {}
    if metrika:
        stats = metrika.get("stats") or {}
        totals = stats.get("totals") or []
        if totals and isinstance(totals, list):
            visits = totals[0] if len(totals) > 0 else 0
            pageviews = totals[1] if len(totals) > 1 else 0
            bounce = totals[2] if len(totals) > 2 else 0
            avg_time = totals[3] if len(totals) > 3 else 0
            content = (
                f"Визиты: {int(visits)}, просмотры: {int(pageviews)}, "
                f"отказы: {float(bounce):.1f}%, "
                f"среднее время: {int(avg_time)} сек."
            )
        else:
            content = "Данные Метрики получены. Добавьте ключевые метрики трафика и поведения."
        sections.append({
            "title": "Traffic & Behavior",
            "content": content,
        })

    gsc = data.get("gsc") or {}
    if gsc:
        analytics = gsc.get("search_analytics") or {}
        rows = analytics.get("rows") or []
        top_queries = ", ".join([r.get("keys", [""])[0] for r in rows[:5] if r.get("keys")])
        if rows:
            clicks = sum(r.get("clicks", 0) for r in rows)
            impressions = sum(r.get("impressions", 0) for r in rows)
            ctr = (clicks / impressions * 100) if impressions else 0
            avg_pos = sum(r.get("position", 0) for r in rows) / len(rows)
            content = (
                f"Клики: {int(clicks)}, показы: {int(impressions)}, "
                f"CTR: {ctr:.2f}%, ср. позиция: {avg_pos:.1f}. "
            )
            if top_queries:
                content += f"Топ-запросы: {top_queries}."
        else:
            content = "Данные Search Console получены. Добавьте клики, показы и CTR."
        sections.append({
            "title": "Search Queries",
            "content": content,
            "chart": [r.get("impressions", 0) for r in rows[:20]] if rows else [],
        })

    if not sections:
        sections.append({
            "title": "Summary",
            "content": "Нет данных для секций отчета.",
        })

    # Technical issues (Webmaster)
    webmaster = data.get("yandex_webmaster") or {}
    history = webmaster.get("indexing_history") or {}
    indicators = history.get("indicators") or {}
    if isinstance(indicators, dict) and indicators:
        parts = []
        for name, values in list(indicators.items())[:5]:
            if isinstance(values, list) and values:
                value = values[-1].get("value", 0)
            else:
                value = 0
            parts.append(f"{name}: {value}")
        content = " | ".join(parts)
    else:
        content = "Технические ошибки: пока нет данных из Вебмастера."

    in_search = webmaster.get("in_search_history") or {}
    in_search_data = in_search.get("data") or []
    if in_search_data and isinstance(in_search_data, list):
        last_point = in_search_data[-1]
        indexed = last_point.get("value") or 0
        content += f" | В индексе: {indexed}"
        chart_points = [p.get("value", 0) for p in in_search_data[-30:]]
    else:
        chart_points = []

    sections.append({
        "title": "Technical Issues",
        "content": content,
        "chart": chart_points,
    })

    topvisor = data.get("topvisor") or {}
    positions = topvisor.get("positions_summary") or {}
    if positions:
        sections.append({
            "title": "Positions (Topvisor)",
            "content": "Данные позиций получены. Добавьте динамику по ТОП-10/ТОП-30.",
        })

    return sections
