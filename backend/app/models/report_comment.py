from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class ReportComment(Base):
    __tablename__ = "report_comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("reports.id"), index=True)
    section: Mapped[str] = mapped_column(String(64))
    text: Mapped[str] = mapped_column(String(2048))
    source: Mapped[str] = mapped_column(String(32), default="ai")
