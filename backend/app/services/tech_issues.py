from __future__ import annotations

from typing import Any


def build_tech_issues(data: dict[str, Any]) -> list[str]:
    issues: list[str] = []

    # Placeholder until Webmaster/GSC coverage issues are added
    if not data:
        issues.append("Нет данных по техническим ошибкам.")
    else:
        issues.append("Технические ошибки: пока нет данных из Вебмастера.")

    return issues
