from __future__ import annotations

import httpx

OAUTH_TOKEN_URL = "https://oauth.yandex.com/token"
USERINFO_URL = "https://login.yandex.ru/info"


def exchange_code(
    *,
    code: str,
    client_id: str,
    client_secret: str,
    redirect_uri: str,
) -> dict:
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
    }
    resp = httpx.post(OAUTH_TOKEN_URL, data=data, timeout=30)
    resp.raise_for_status()
    return resp.json()


def refresh_token(
    *,
    refresh_token: str,
    client_id: str,
    client_secret: str,
) -> dict:
    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": client_id,
        "client_secret": client_secret,
    }
    resp = httpx.post(OAUTH_TOKEN_URL, data=data, timeout=30)
    resp.raise_for_status()
    return resp.json()


def get_user_info(access_token: str) -> dict:
    headers = {"Authorization": f"OAuth {access_token}"}
    params = {"format": "json"}
    resp = httpx.get(USERINFO_URL, headers=headers, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()
