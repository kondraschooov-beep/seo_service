from pydantic import BaseModel


class ReportCommentOut(BaseModel):
    id: int
    report_id: int
    section: str
    text: str
    source: str


class ReportCommentUpdate(BaseModel):
    text: str
