from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    domain: str


class Project(ProjectCreate):
    id: int
