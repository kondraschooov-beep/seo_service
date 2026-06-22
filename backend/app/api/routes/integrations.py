from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.integration import Integration as IntegrationModel
from app.models.project import Project as ProjectModel
from app.models.credential import IntegrationCredential
from app.schemas.integration import (
    Integration,
    IntegrationCreate,
    OAuthExchangeRequest,
    OAuthUrlRequest,
    GscQueryRequest,
)
from app.schemas.integration_update import IntegrationUpdate
from app.models.user import User
from app.core.settings import settings
from app.services.oauth_yandex import exchange_code as yandex_exchange_code, refresh_token as yandex_refresh
from app.services.oauth_google import exchange_code as google_exchange_code, refresh_token as google_refresh
from app.services.yandex_metrika import list_counters
from app.services.yandex_webmaster import list_hosts, get_user
import time
from urllib.parse import urlencode
from app.services.gsc import list_sites, search_analytics
from app.services.topvisor import get_projects, get_positions_summary

router = APIRouter()

YANDEX_AUTH_URL = "https://oauth.yandex.com/authorize"
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_DEFAULT_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
YANDEX_DEFAULT_SCOPE = "metrika:read webmaster:read"


def _maybe_refresh_yandex(db: Session, cred: IntegrationCredential) -> IntegrationCredential:
    if not cred.expires_at or not cred.refresh_token:
        return cred

    if int(time.time()) < (cred.expires_at - 60):
        return cred

    token_data = yandex_refresh(
        refresh_token=cred.refresh_token,
        client_id=settings.yandex_client_id or "",
        client_secret=settings.yandex_client_secret or "",
    )
    expires_in = token_data.get("expires_in")
    cred.access_token = token_data.get("access_token", cred.access_token)
    cred.token_type = token_data.get("token_type", cred.token_type)
    cred.scope = token_data.get("scope", cred.scope)
    cred.expires_at = int(time.time()) + int(expires_in) if expires_in else cred.expires_at
    db.add(cred)
    db.commit()
    return cred


def _maybe_refresh_google(db: Session, cred: IntegrationCredential) -> IntegrationCredential:
    if not cred.expires_at or not cred.refresh_token:
        return cred

    if int(time.time()) < (cred.expires_at - 60):
        return cred

    token_data = google_refresh(
        refresh_token=cred.refresh_token,
        client_id=settings.google_client_id or "",
        client_secret=settings.google_client_secret or "",
    )
    expires_in = token_data.get("expires_in")
    cred.access_token = token_data.get("access_token", cred.access_token)
    cred.token_type = token_data.get("token_type", cred.token_type)
    cred.scope = token_data.get("scope", cred.scope)
    cred.expires_at = int(time.time()) + int(expires_in) if expires_in else cred.expires_at
    db.add(cred)
    db.commit()
    return cred


@router.post("/", response_model=Integration)
def create_integration(
    payload: IntegrationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = (
        db.query(ProjectModel)
        .filter(ProjectModel.id == payload.project_id, ProjectModel.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    integration = IntegrationModel(**payload.model_dump(), status="connected")
    db.add(integration)
    db.commit()
    db.refresh(integration)
    return Integration(
        id=integration.id,
        project_id=integration.project_id,
        provider=integration.provider,
        auth_type=integration.auth_type,
        status=integration.status,
        meta=integration.meta,
    )


@router.get("/", response_model=list[Integration])
def list_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    integrations = (
        db.query(IntegrationModel)
        .join(ProjectModel, IntegrationModel.project_id == ProjectModel.id)
        .filter(ProjectModel.user_id == current_user.id)
        .all()
    )
    return [
        Integration(
            id=i.id,
            project_id=i.project_id,
            provider=i.provider,
            auth_type=i.auth_type,
            status=i.status,
            meta=i.meta,
        )
        for i in integrations
    ]


@router.patch("/{integration_id}", response_model=Integration)
def update_integration(
    integration_id: int,
    payload: IntegrationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    integration = (
        db.query(IntegrationModel)
        .join(ProjectModel, IntegrationModel.project_id == ProjectModel.id)
        .filter(IntegrationModel.id == integration_id, ProjectModel.user_id == current_user.id)
        .first()
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    integration.meta = payload.meta
    db.add(integration)
    db.commit()
    db.refresh(integration)
    return Integration(
        id=integration.id,
        project_id=integration.project_id,
        provider=integration.provider,
        auth_type=integration.auth_type,
        status=integration.status,
        meta=integration.meta,
    )


@router.post("/yandex/oauth/exchange")
def yandex_oauth_exchange(
    payload: OAuthExchangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.provider not in {"yandex_metrika", "yandex_webmaster"}:
        raise HTTPException(status_code=400, detail="Invalid provider")

    project = (
        db.query(ProjectModel)
        .filter(ProjectModel.id == payload.project_id, ProjectModel.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not settings.yandex_client_id or not settings.yandex_client_secret:
        raise HTTPException(status_code=500, detail="Yandex OAuth not configured")

    token_data = yandex_exchange_code(
        code=payload.code,
        client_id=settings.yandex_client_id,
        client_secret=settings.yandex_client_secret,
        redirect_uri=payload.redirect_uri,
    )

    integration = IntegrationModel(
        project_id=payload.project_id,
        provider=payload.provider,
        auth_type="oauth",
        status="connected",
    )
    db.add(integration)
    db.commit()
    db.refresh(integration)

    expires_in = token_data.get("expires_in")
    expires_at = int(time.time()) + int(expires_in) if expires_in else None
    credential = IntegrationCredential(
        integration_id=integration.id,
        access_token=token_data.get("access_token", ""),
        refresh_token=token_data.get("refresh_token"),
        token_type=token_data.get("token_type"),
        scope=token_data.get("scope"),
        expires_at=expires_at,
    )
    db.add(credential)
    db.commit()

    return {"integration_id": integration.id, "status": integration.status}


@router.post("/yandex/oauth/url")
def yandex_oauth_url(payload: OAuthUrlRequest):
    if not settings.yandex_client_id:
        raise HTTPException(status_code=500, detail="Yandex OAuth not configured")

    query = {
        "response_type": "code",
        "client_id": settings.yandex_client_id,
        "redirect_uri": payload.redirect_uri,
        "scope": payload.scope or YANDEX_DEFAULT_SCOPE,
    }
    if payload.state:
        query["state"] = payload.state
    return {"url": f"{YANDEX_AUTH_URL}?{urlencode(query)}"}


@router.post("/gsc/oauth/exchange")
def gsc_oauth_exchange(
    payload: OAuthExchangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.provider != "gsc":
        raise HTTPException(status_code=400, detail="Invalid provider")

    project = (
        db.query(ProjectModel)
        .filter(ProjectModel.id == payload.project_id, ProjectModel.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    token_data = google_exchange_code(
        code=payload.code,
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        redirect_uri=payload.redirect_uri,
    )

    integration = IntegrationModel(
        project_id=payload.project_id,
        provider="gsc",
        auth_type="oauth",
        status="connected",
    )
    db.add(integration)
    db.commit()
    db.refresh(integration)

    expires_in = token_data.get("expires_in")
    expires_at = int(time.time()) + int(expires_in) if expires_in else None
    credential = IntegrationCredential(
        integration_id=integration.id,
        access_token=token_data.get("access_token", ""),
        refresh_token=token_data.get("refresh_token"),
        token_type=token_data.get("token_type"),
        scope=token_data.get("scope"),
        expires_at=expires_at,
    )
    db.add(credential)
    db.commit()

    return {"integration_id": integration.id, "status": integration.status}


@router.post("/gsc/oauth/url")
def gsc_oauth_url(payload: OAuthUrlRequest):
    if not settings.google_client_id:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    query = {
        "response_type": "code",
        "client_id": settings.google_client_id,
        "redirect_uri": payload.redirect_uri,
        "scope": payload.scope or GOOGLE_DEFAULT_SCOPE,
        "access_type": "offline",
        "prompt": "consent",
    }
    if payload.state:
        query["state"] = payload.state
    return {"url": f"{GOOGLE_AUTH_URL}?{urlencode(query)}"}


@router.get("/yandex/metrika/counters")
def yandex_metrika_counters(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    integration = (
        db.query(IntegrationModel)
        .join(ProjectModel, IntegrationModel.project_id == ProjectModel.id)
        .filter(IntegrationModel.id == integration_id, ProjectModel.user_id == current_user.id)
        .first()
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    cred = db.query(IntegrationCredential).filter(IntegrationCredential.integration_id == integration_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credentials not found")

    cred = _maybe_refresh_yandex(db, cred)
    return list_counters(cred.access_token)


@router.get("/yandex/webmaster/hosts")
def yandex_webmaster_hosts(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    integration = (
        db.query(IntegrationModel)
        .join(ProjectModel, IntegrationModel.project_id == ProjectModel.id)
        .filter(IntegrationModel.id == integration_id, ProjectModel.user_id == current_user.id)
        .first()
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    cred = db.query(IntegrationCredential).filter(IntegrationCredential.integration_id == integration_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credentials not found")

    cred = _maybe_refresh_yandex(db, cred)
    user_info = get_user(cred.access_token)
    user_id = str(user_info.get("user_id") or user_info.get("userId") or user_info.get("id") or "")
    if not user_id:
        raise HTTPException(status_code=400, detail="Yandex user id not found")

    return list_hosts(cred.access_token, user_id)


@router.get("/gsc/sites")
def gsc_sites(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    integration = (
        db.query(IntegrationModel)
        .join(ProjectModel, IntegrationModel.project_id == ProjectModel.id)
        .filter(IntegrationModel.id == integration_id, ProjectModel.user_id == current_user.id)
        .first()
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    cred = db.query(IntegrationCredential).filter(IntegrationCredential.integration_id == integration_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credentials not found")

    cred = _maybe_refresh_google(db, cred)
    return list_sites(cred.access_token)


@router.get("/topvisor/projects")
def topvisor_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_projects()


@router.get("/topvisor/positions")
def topvisor_positions(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_positions_summary(project_id)


@router.post("/gsc/search-analytics")
def gsc_search_analytics(
    payload: GscQueryRequest,
    integration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    integration = (
        db.query(IntegrationModel)
        .join(ProjectModel, IntegrationModel.project_id == ProjectModel.id)
        .filter(IntegrationModel.id == integration_id, ProjectModel.user_id == current_user.id)
        .first()
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    cred = db.query(IntegrationCredential).filter(IntegrationCredential.integration_id == integration_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credentials not found")

    cred = _maybe_refresh_google(db, cred)
    return search_analytics(cred.access_token, payload.site_url, payload.body)
