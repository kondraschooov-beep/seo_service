from pydantic import BaseModel
from typing import Optional


class IntegrationCreate(BaseModel):
    project_id: int
    provider: str  # yandex_metrika, yandex_webmaster, gsc, topvisor
    auth_type: str  # oauth, api_key


class Integration(IntegrationCreate):
    id: int
    status: str
    meta: Optional[dict] = None


class OAuthExchangeRequest(BaseModel):
    project_id: int
    code: str
    redirect_uri: str
    provider: str  # yandex_metrika, yandex_webmaster, gsc


class OAuthUrlRequest(BaseModel):
    redirect_uri: str
    scope: Optional[str] = None
    state: Optional[str] = None


class GscQueryRequest(BaseModel):
    site_url: str
    body: dict
