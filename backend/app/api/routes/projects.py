from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.project import Project as ProjectModel
from app.schemas.project import Project, ProjectCreate
from app.models.user import User

router = APIRouter()


@router.post("/", response_model=Project)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = ProjectModel(user_id=current_user.id, **payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return Project(id=project.id, name=project.name, domain=project.domain)


@router.get("/", response_model=list[Project])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects = db.query(ProjectModel).filter(ProjectModel.user_id == current_user.id).all()
    return [Project(id=p.id, name=p.name, domain=p.domain) for p in projects]


@router.get("/{project_id}", response_model=Project)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = (
        db.query(ProjectModel)
        .filter(ProjectModel.id == project_id, ProjectModel.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return Project(id=project.id, name=project.name, domain=project.domain)
