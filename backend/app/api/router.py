from fastapi import APIRouter
from app.api.routes import projects, integrations, reports, auth


api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(integrations.router, prefix="/integrations", tags=["integrations"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
