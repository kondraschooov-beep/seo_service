from pydantic import BaseModel
from typing import Optional


class ReportRequest(BaseModel):
    project_id: int
    period_start: str
    period_end: str


class ReportStatus(BaseModel):
    report_id: int
    status: str
    message: Optional[str] = None
