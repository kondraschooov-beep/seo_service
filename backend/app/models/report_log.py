from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class ReportLog(Base):
    __tablename__ = "report_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("reports.id"), index=True)
    level: Mapped[str] = mapped_column(String(16), default="info")
    message: Mapped[str] = mapped_column(String(2048))
