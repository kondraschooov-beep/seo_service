from sqlalchemy import String, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from typing import Optional


class IntegrationCredential(Base):
    __tablename__ = "integration_credentials"

    id: Mapped[int] = mapped_column(primary_key=True)
    integration_id: Mapped[int] = mapped_column(ForeignKey("integrations.id"), index=True)

    access_token: Mapped[str] = mapped_column(String(2048))
    refresh_token: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    token_type: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    scope: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    expires_at: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # TODO: encrypt tokens at rest before production
