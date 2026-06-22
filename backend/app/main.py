from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.settings import settings
from app.api.router import api_router
from app.db.base import Base
from app.db.session import engine
import app.models.user  # noqa: F401
import app.models.project  # noqa: F401
import app.models.integration  # noqa: F401
import app.models.report  # noqa: F401
import app.models.credential  # noqa: F401
import app.models.report_data  # noqa: F401
import app.models.report_comment  # noqa: F401
import app.models.report_log  # noqa: F401


app = FastAPI(title=settings.app_name)
app.include_router(api_router, prefix=settings.api_v1_prefix)

# Dev-friendly CORS to allow the static frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auto-create tables for initial dev.
Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok"}
