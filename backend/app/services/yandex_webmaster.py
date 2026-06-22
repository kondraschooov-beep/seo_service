import httpx
from typing import Optional, List

USER_URL = "https://api.webmaster.yandex.net/v4/user"
HOSTS_URL_TMPL = "https://api.webmaster.yandex.net/v4/user/{user_id}/hosts"
INDEXING_HISTORY_TMPL = "https://api.webmaster.yandex.net/v4/user/{user_id}/hosts/{host_id}/indexing/history"
SEARCH_QUERIES_ALL_HISTORY_TMPL = (
    "https://api.webmaster.yandex.net/v4/user/{user_id}/hosts/{host_id}/search-queries/all/history"
)
IN_SEARCH_HISTORY_TMPL = (
    "https://api.webmaster.yandex.net/v4/user/{user_id}/hosts/{host_id}/search-urls/in-search/history"
)


def list_hosts(access_token: str, user_id: str) -> dict:
    headers = {"Authorization": f"OAuth {access_token}"}
    url = HOSTS_URL_TMPL.format(user_id=user_id)
    resp = httpx.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()


def get_user(access_token: str) -> dict:
    headers = {"Authorization": f"OAuth {access_token}"}
    resp = httpx.get(USER_URL, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()


def get_indexing_history(
    access_token: str,
    user_id: str,
    host_id: str,
    *,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> dict:
    headers = {"Authorization": f"OAuth {access_token}"}
    url = INDEXING_HISTORY_TMPL.format(user_id=user_id, host_id=host_id)
    params = {}
    if date_from:
        params["date_from"] = date_from
    if date_to:
        params["date_to"] = date_to
    resp = httpx.get(url, headers=headers, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def get_search_queries_all_history(
    access_token: str,
    user_id: str,
    host_id: str,
    *,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    query_indicators: Optional[List[str]] = None,
    device_type_indicator: Optional[str] = None,
) -> dict:
    headers = {"Authorization": f"OAuth {access_token}"}
    url = SEARCH_QUERIES_ALL_HISTORY_TMPL.format(user_id=user_id, host_id=host_id)
    params = {}
    if date_from:
        params["date_from"] = date_from
    if date_to:
        params["date_to"] = date_to
    if query_indicators:
        params["query_indicator"] = query_indicators
    if device_type_indicator:
        params["device_type_indicator"] = device_type_indicator
    resp = httpx.get(url, headers=headers, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def get_in_search_history(
    access_token: str,
    user_id: str,
    host_id: str,
    *,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> dict:
    headers = {"Authorization": f"OAuth {access_token}"}
    url = IN_SEARCH_HISTORY_TMPL.format(user_id=user_id, host_id=host_id)
    params = {}
    if date_from:
        params["date_from"] = date_from
    if date_to:
        params["date_to"] = date_to
    resp = httpx.get(url, headers=headers, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()
