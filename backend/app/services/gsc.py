from __future__ import annotations

import httpx

SITES_URL = "https://www.googleapis.com/webmasters/v3/sites"
SEARCH_ANALYTICS_URL_TMPL = "https://www.googleapis.com/webmasters/v3/sites/{site_url}/searchAnalytics/query"


def list_sites(access_token: str) -> dict:
    headers = {"Authorization": f"Bearer {access_token}"}
    resp = httpx.get(SITES_URL, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()


def search_analytics(access_token: str, site_url: str, body: dict) -> dict:
    headers = {"Authorization": f"Bearer {access_token}"}
    url = SEARCH_ANALYTICS_URL_TMPL.format(site_url=site_url)
    resp = httpx.post(url, headers=headers, json=body, timeout=30)
    resp.raise_for_status()
    return resp.json()
