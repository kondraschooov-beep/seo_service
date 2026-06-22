from __future__ import annotations

import httpx

COUNTERS_URL = "https://api-metrika.yandex.net/management/v1/counters"
STATS_URL = "https://api-metrika.yandex.net/stat/v1/data"


def list_counters(access_token: str) -> dict:
    headers = {"Authorization": f"OAuth {access_token}"}
    resp = httpx.get(COUNTERS_URL, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()


def get_stats(
    access_token: str,
    counter_id: int,
    *,
    date1: str,
    date2: str,
) -> dict:
    headers = {"Authorization": f"OAuth {access_token}"}
    params = {
        "ids": str(counter_id),
        "metrics": "ym:s:visits,ym:s:pageviews,ym:s:bounceRate,ym:s:avgVisitDurationSeconds",
        "date1": date1,
        "date2": date2,
    }
    resp = httpx.get(STATS_URL, headers=headers, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()
