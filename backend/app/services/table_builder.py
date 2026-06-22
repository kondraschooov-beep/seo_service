from __future__ import annotations

from typing import Any


def build_tables(data: dict[str, Any]) -> list[dict]:
    tables: list[dict] = []

    gsc = data.get("gsc") or {}
    analytics = gsc.get("search_analytics") or {}
    rows = analytics.get("rows") or []
    if rows:
        table_rows = [["Query", "Clicks", "Impressions", "CTR", "Position"]]
        for r in rows[:10]:
            keys = r.get("keys") or [""]
            query = keys[0] if keys else ""
            clicks = r.get("clicks", 0)
            impressions = r.get("impressions", 0)
            ctr = (clicks / impressions * 100) if impressions else 0
            position = r.get("position", 0)
            table_rows.append([
                query,
                str(int(clicks)),
                str(int(impressions)),
                f"{ctr:.2f}%",
                f"{float(position):.1f}",
            ])
        tables.append({"title": "Top Queries (GSC)", "rows": table_rows})

    webmaster = data.get("yandex_webmaster") or {}
    all_history = webmaster.get("search_queries_all_history") or {}
    indicators = all_history.get("indicators") or {}
    data_points = all_history.get("data") or []
    if data_points and isinstance(data_points, list) and indicators:
        table_rows = [["Date"] + list(indicators.keys())]
        for point in data_points[-10:]:
            row = [point.get("date", "")]
            for key in indicators.keys():
                row.append(str(point.get(key, 0)))
            table_rows.append(row)
        tables.append({"title": "Search Queries (Webmaster)", "rows": table_rows})

    popular = webmaster.get("popular_queries") or {}
    popular_rows = popular.get("queries") or []
    if popular_rows:
        table_rows = [["Query", "Clicks", "Impressions", "CTR"]]
        for q in popular_rows[:10]:
            query = q.get("query", "")
            clicks = q.get("clicks", 0)
            impressions = q.get("impressions", 0)
            ctr = (clicks / impressions * 100) if impressions else 0
            table_rows.append([query, str(int(clicks)), str(int(impressions)), f"{ctr:.2f}%"])
        tables.append({"title": "Popular Queries (Webmaster)", "rows": table_rows})

    topvisor = data.get("topvisor") or {}
    summary = topvisor.get("positions_summary") or {}
    if isinstance(summary, dict) and summary:
        rows = [["Metric", "Value"]]
        for key, value in list(summary.items())[:8]:
            rows.append([str(key), str(value)])
        tables.append({"title": "Positions Summary (Topvisor)", "rows": rows})

    return tables
