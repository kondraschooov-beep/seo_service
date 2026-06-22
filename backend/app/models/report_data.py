from sqlalchemy import ForeignKey
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class ReportData(Base):
    __tablename__ = "report_data"

    id: Mapped[int] = mapped_column(primary_key=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("reports.id"), index=True)
    payload: Mapped[dict] = mapped_column(JSON)
