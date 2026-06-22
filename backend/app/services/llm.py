from __future__ import annotations

from typing import Any
import httpx
from app.core.settings import settings


def generate_text(prompt: str) -> str:
    if settings.llm_provider != "openai" or not settings.llm_api_key:
        return f"[AI] {prompt[:300]}"

    url = f"{settings.openai_base_url}/chat/completions"
    payload = {
        "model": settings.openai_model,
        "messages": [
            {"role": "system", "content": "You are an SEO analyst."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 200,
    }
    headers = {"Authorization": f"Bearer {settings.llm_api_key}"}
    resp = httpx.post(url, json=payload, headers=headers, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"]


def build_prompt(data: dict[str, Any]) -> str:
    return f"SEO report summary: {list(data.keys())}"
