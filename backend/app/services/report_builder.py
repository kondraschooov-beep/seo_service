from __future__ import annotations

from typing import Any


def build_simple_summary(data: dict[str, Any]) -> str:
    sections = []

    metrika = data.get("yandex_metrika")
    if metrika and isinstance(metrika, dict):
        counters = metrika.get("counters", {})
        count = None
        if isinstance(counters, dict):
            if isinstance(counters.get("counters"), list):
                count = len(counters.get("counters"))
            else:
                count = counters.get("count")
        if count is None and isinstance(counters, list):
            count = len(counters)
        if count is not None:
            sections.append(f"Metrika: {count} counters")
        else:
            sections.append("Metrika: counters fetched")

        stats = metrika.get("stats") or {}
        totals = stats.get("totals") or []
        if totals and isinstance(totals, list):
            visits = totals[0] if len(totals) > 0 else 0
            pageviews = totals[1] if len(totals) > 1 else 0
            bounce = totals[2] if len(totals) > 2 else 0
            avg_time = totals[3] if len(totals) > 3 else 0
            sections.append(
                f"Metrika stats: {int(visits)} visits, {int(pageviews)} pageviews, "
                f"bounce {float(bounce):.1f}%, avg time {int(avg_time)}s"
            )

    gsc = data.get("gsc")
    if gsc and isinstance(gsc, dict):
        sites = gsc.get("sites", {})
        count = None
        if isinstance(sites, dict):
            if isinstance(sites.get("siteEntry"), list):
                count = len(sites.get("siteEntry"))
            else:
                count = sites.get("count")
        if count is None and isinstance(sites, list):
            count = len(sites)
        if count is not None:
            sections.append(f"GSC: {count} sites")
        else:
            sections.append("GSC: sites fetched")

        analytics = gsc.get("search_analytics")
        if isinstance(analytics, dict) and isinstance(analytics.get("rows"), list):
            rows = analytics["rows"]
            clicks = sum(r.get("clicks", 0) for r in rows)
            impressions = sum(r.get("impressions", 0) for r in rows)
            ctr = (clicks / impressions * 100) if impressions else 0
            avg_pos = sum(r.get("position", 0) for r in rows) / len(rows)
            sections.append(
                f"GSC top queries: {int(clicks)} clicks, {int(impressions)} impressions, "
                f"CTR {ctr:.2f}%, avg position {avg_pos:.1f}"
            )

    topvisor = data.get("topvisor")
    if topvisor and isinstance(topvisor, dict):
        positions = topvisor.get("positions_summary") or {}
        if positions:
            sections.append("Topvisor: positions summary fetched")

    if not sections:
        return "No data collected yet."

    return "; ".join(sections)
