from pydantic import BaseModel


class ReportDataOut(BaseModel):
    report_id: int
    payload: dict
