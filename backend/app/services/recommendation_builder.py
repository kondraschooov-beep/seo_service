from __future__ import annotations

from typing import Any


def build_recommendations(data: dict[str, Any]) -> list[str]:
    recs: list[str] = []

    metrika = data.get("yandex_metrika") or {}
    stats = metrika.get("stats") or {}
    totals = stats.get("totals") or []
    if totals and isinstance(totals, list):
        bounce = totals[2] if len(totals) > 2 else 0
        if bounce and float(bounce) > 50:
            recs.append("Высокий показатель отказов: проверьте релевантность посадочных страниц и скорость загрузки.")

    gsc = data.get("gsc") or {}
    analytics = gsc.get("search_analytics") or {}
    rows = analytics.get("rows") or []
    if rows:
        impressions = sum(r.get("impressions", 0) for r in rows)
        clicks = sum(r.get("clicks", 0) for r in rows)
        if impressions and clicks / impressions < 0.02:
            recs.append("Низкий CTR в поиске: пересмотрите тайтлы и сниппеты ключевых страниц.")

    if not recs:
        recs.append("Добавьте больше данных по трафику и запросам для точных рекомендаций.")

    webmaster = data.get("yandex_webmaster") or {}
    history = webmaster.get("indexing_history") or {}
    indicators = history.get("indicators") or {}
    if isinstance(indicators, dict) and indicators:
        recs.append("Есть технические проблемы по индексации: проверьте отчеты Вебмастера.")

    return recs
