from sqlalchemy import String, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from typing import Optional


class Integration(Base):
    __tablename__ = "integrations"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    provider: Mapped[str] = mapped_column(String(64))
    auth_type: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(32), default="connected")
    meta: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
