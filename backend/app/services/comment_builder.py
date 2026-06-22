from __future__ import annotations

from typing import Any
from app.services.llm import generate_text, build_prompt


def generate_ai_comments(data: dict[str, Any]) -> list[dict[str, str]]:
    # Try LLM first (placeholder)
    try:
        prompt = build_prompt(data)
        llm_text = generate_text(prompt)
    except Exception:
        llm_text = None

    comments = []

    metrika = data.get("yandex_metrika") or {}
    gsc = data.get("gsc") or {}

    if metrika:
        comments.append({
            "section": "traffic",
            "text": "Данные Метрики получены. Проверьте динамику визитов и поведение пользователей.",
        })

        stats = metrika.get("stats") or {}
        totals = stats.get("totals") or []
        if totals and isinstance(totals, list):
            visits = totals[0] if len(totals) > 0 else 0
            pageviews = totals[1] if len(totals) > 1 else 0
            bounce = totals[2] if len(totals) > 2 else 0
            comments.append({
                "section": "traffic",
                "text": f"Метрика: {int(visits)} визитов, {int(pageviews)} просмотров, отказов {float(bounce):.1f}%.",
            })

    if gsc:
        comments.append({
            "section": "search",
            "text": "Есть данные из Google Search Console. Обратите внимание на клики и показы.",
        })

        analytics = gsc.get("search_analytics") or {}
        rows = analytics.get("rows") or []
        if rows:
            clicks = sum(r.get("clicks", 0) for r in rows)
            impressions = sum(r.get("impressions", 0) for r in rows)
            ctr = (clicks / impressions * 100) if impressions else 0
            avg_pos = sum(r.get("position", 0) for r in rows) / len(rows)
            comments.append({
                "section": "search",
                "text": (
                    f"Топ-запросы: {int(clicks)} кликов, {int(impressions)} показов, "
                    f"CTR {ctr:.2f}%, средняя позиция {avg_pos:.1f}."
                ),
            })

    topvisor = data.get("topvisor") or {}
    if topvisor:
        comments.append({
            "section": "positions",
            "text": "Есть данные Topvisor. Проверьте динамику позиций по ключевым словам.",
        })

    if not comments:
        comments.append({
            "section": "summary",
            "text": "Пока нет данных для автоматического комментария.",
        })

    if llm_text:
        comments.append({
            "section": "summary",
            "text": llm_text,
        })

    return comments
