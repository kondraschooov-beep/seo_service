from pydantic import BaseModel


class ReportLogOut(BaseModel):
    id: int
    report_id: int
    level: str
    message: str
