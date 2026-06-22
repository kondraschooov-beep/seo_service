from __future__ import annotations

from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.integration import Integration
from app.models.credential import IntegrationCredential
from app.services.yandex_metrika import list_counters, get_stats
from app.services.yandex_webmaster import (
    list_hosts,
    get_user,
    get_indexing_history,
    get_search_queries_all_history,
    get_in_search_history,
)
from app.services.yandex_webmaster_queries import get_popular_queries
from app.services.topvisor import get_projects, get_positions_summary
from app.services.gsc import list_sites, search_analytics


class DataCollector:
    def __init__(self, db: Session):
        self.db = db

    def _get_credential(self, integration_id: int) -> Optional[IntegrationCredential]:
        return (
            self.db.query(IntegrationCredential)
            .filter(IntegrationCredential.integration_id == integration_id)
            .first()
        )

    def collect(
        self,
        integration: Integration,
        *,
        period_start: Optional[str] = None,
        period_end: Optional[str] = None,
    ) -> dict[str, Any]:
        cred = self._get_credential(integration.id)
        if not cred:
            return {"error": "credentials_missing"}

        if integration.provider == "yandex_metrika":
            data: dict[str, Any] = {"counters": list_counters(cred.access_token)}
            if integration.meta and integration.meta.get("counter_id") and period_start and period_end:
                data["stats"] = get_stats(
                    cred.access_token,
                    int(integration.meta["counter_id"]),
                    date1=period_start,
                    date2=period_end,
                )
            return data

        if integration.provider == "yandex_webmaster":
            data: dict[str, Any] = {}
            user = get_user(cred.access_token)
            user_id = str(user.get("user_id") or user.get("userId") or user.get("id") or "")
            if not user_id:
                return {"error": "user_id_missing"}
            data["hosts"] = list_hosts(cred.access_token, user_id)
            if integration.meta and integration.meta.get("host_id") and period_start and period_end:
                host_id = str(integration.meta["host_id"])
                data["indexing_history"] = get_indexing_history(
                    cred.access_token,
                    user_id,
                    host_id,
                    date_from=period_start,
                    date_to=period_end,
                )
                data["search_queries_all_history"] = get_search_queries_all_history(
                    cred.access_token,
                    user_id,
                    host_id,
                    date_from=period_start,
                    date_to=period_end,
                )
                data["popular_queries"] = get_popular_queries(
                    cred.access_token,
                    user_id,
                    host_id,
                    date_from=period_start,
                    date_to=period_end,
                )
                data["in_search_history"] = get_in_search_history(
                    cred.access_token,
                    user_id,
                    host_id,
                    date_from=period_start,
                    date_to=period_end,
                )
            return data

        if integration.provider == "gsc":
            data: dict[str, Any] = {"sites": list_sites(cred.access_token)}
            if integration.meta and integration.meta.get("site_url") and period_start and period_end:
                body = {
                    "startDate": period_start,
                    "endDate": period_end,
                    "dimensions": ["query"],
                    "rowLimit": 10,
                }
                data["search_analytics"] = search_analytics(
                    cred.access_token,
                    integration.meta["site_url"],
                    body,
                )
            return data

        if integration.provider == "topvisor":
            data: dict[str, Any] = {"projects": get_projects()}
            if integration.meta and integration.meta.get("project_id"):
                data["positions_summary"] = get_positions_summary(int(integration.meta["project_id"]))
            return data

        return {"note": "provider_not_supported"}
