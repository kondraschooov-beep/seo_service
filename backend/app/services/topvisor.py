import httpx
from app.core.settings import settings
from typing import Optional

BASE_URL = "https://api.topvisor.com"


def request_api(
    operator: str,
    service: str,
    method: Optional[str] = None,
    *,
    params: Optional[dict] = None,
) -> dict:
    if not settings.topvisor_user_id or not settings.topvisor_api_key:
        raise RuntimeError("Topvisor not configured")

    url = f"{BASE_URL}/v2/json/{operator}/{service}"
    if method:
        url = f"{url}/{method}"

    headers = {
        "User-Id": settings.topvisor_user_id,
        "Authorization": f"bearer {settings.topvisor_api_key}",
        "Content-Type": "application/json",
    }

    resp = httpx.post(url, headers=headers, json=params or {}, timeout=30)
    resp.raise_for_status()
    return resp.json()


def get_projects() -> dict:
    return request_api("get", "projects_2", "projects")


def get_positions_summary(project_id: int) -> dict:
    return request_api("get", "positions_2", "summary", params={"project_id": project_id})
