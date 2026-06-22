from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from typing import Optional


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    status: Mapped[str] = mapped_column(String(32), default="draft")
    period_start: Mapped[str] = mapped_column(String(32))
    period_end: Mapped[str] = mapped_column(String(32))
    result_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
