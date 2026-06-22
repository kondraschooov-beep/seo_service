import httpx
from typing import Optional

POPULAR_QUERIES_TMPL = (
    "https://api.webmaster.yandex.net/v4/user/{user_id}/hosts/{host_id}/search-queries/popular"
)


def get_popular_queries(
    access_token: str,
    user_id: str,
    host_id: str,
    *,
    limit: int = 10,
    order_by: str = "TOTAL_SHOWS",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> dict:
    headers = {"Authorization": f"OAuth {access_token}"}
    params = {"limit": limit, "order_by": order_by}
    if date_from:
        params["date_from"] = date_from
    if date_to:
        params["date_to"] = date_to
    url = POPULAR_QUERIES_TMPL.format(user_id=user_id, host_id=host_id)
    resp = httpx.get(url, headers=headers, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()
