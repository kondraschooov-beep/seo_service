import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.report import Report as ReportModel
from app.models.project import Project as ProjectModel
from app.models.report_data import ReportData as ReportDataModel
from app.schemas.report import ReportRequest, ReportStatus
from app.schemas.report_data import ReportDataOut
from app.schemas.report_comment import ReportCommentOut, ReportCommentUpdate
from app.models.report_comment import ReportComment as ReportCommentModel
from app.models.report_log import ReportLog as ReportLogModel
from app.schemas.report_log import ReportLogOut
from app.services.report_builder import build_simple_summary
from app.services.section_builder import build_sections
from app.services.table_builder import build_tables
from app.services.recommendation_builder import build_recommendations
from app.services.executive_summary import build_executive_summary
from app.services.pdf import render_simple_report_pdf
from app.core.settings import settings
from app.models.user import User
from app.workers.tasks import generate_report_task

router = APIRouter()


@router.post("/generate", response_model=ReportStatus)
def generate_report(
    payload: ReportRequest,
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

    report = ReportModel(
        project_id=payload.project_id,
        period_start=payload.period_start,
        period_end=payload.period_end,
        status="draft",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    generate_report_task.delay(report.id)
    return ReportStatus(report_id=report.id, status=report.status, message="Report data collection queued")


@router.get("/{report_id}", response_model=ReportStatus)
def report_status(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = (
        db.query(ReportModel)
        .join(ProjectModel, ReportModel.project_id == ProjectModel.id)
        .filter(ReportModel.id == report_id, ProjectModel.user_id == current_user.id)
        .first()
    )
    if not report:
        return ReportStatus(report_id=report_id, status="not_found", message="Report not found")
    return ReportStatus(report_id=report.id, status=report.status, message=None)


@router.get("/{report_id}/data", response_model=ReportDataOut)
def report_data(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = (
        db.query(ReportModel)
        .join(ProjectModel, ReportModel.project_id == ProjectModel.id)
        .filter(ReportModel.id == report_id, ProjectModel.user_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    data = db.query(ReportDataModel).filter(ReportDataModel.report_id == report_id).first()
    if not data:
        raise HTTPException(status_code=404, detail="Report data not found")

    return ReportDataOut(report_id=report_id, payload=data.payload)


@router.post("/{report_id}/preview", response_model=ReportStatus)
def preview_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = (
        db.query(ReportModel)
        .join(ProjectModel, ReportModel.project_id == ProjectModel.id)
        .filter(ReportModel.id == report_id, ProjectModel.user_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    data = db.query(ReportDataModel).filter(ReportDataModel.report_id == report_id).first()
    if not data:
        raise HTTPException(status_code=404, detail="Report data not found")

    comments = db.query(ReportCommentModel).filter(ReportCommentModel.report_id == report_id).all()
    comments_text = [c.text for c in comments]

    summary = build_simple_summary(data.payload)
    sections = build_sections(data.payload)
    tables = build_tables(data.payload)
    recommendations = build_recommendations(data.payload)
    exec_summary = build_executive_summary(data.payload)

    project = db.query(ProjectModel).filter(ProjectModel.id == report.project_id).first()
    project_name = project.name if project else "Preview"
    domain = project.domain if project else "preview"

    output_path = os.path.join(settings.reports_dir, f"preview_{report_id}.pdf")
    render_simple_report_pdf(
        output_path,
        project_name=project_name,
        domain=domain,
        period_start=report.period_start,
        period_end=report.period_end,
        summary=summary,
        comments=comments_text,
        sections=sections,
        tables=tables,
        recommendations=recommendations,
        exec_summary=exec_summary,
    )

    report.status = "preview_ready"
    db.add(report)
    db.commit()

    return ReportStatus(report_id=report.id, status=report.status, message=output_path)


@router.get("/{report_id}/preview/download")
def download_preview(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = (
        db.query(ReportModel)
        .join(ProjectModel, ReportModel.project_id == ProjectModel.id)
        .filter(ReportModel.id == report_id, ProjectModel.user_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    preview_path = os.path.join(settings.reports_dir, f"preview_{report_id}.pdf")
    if not os.path.exists(preview_path):
        raise HTTPException(status_code=404, detail="Preview not found")

    return FileResponse(preview_path, media_type="application/pdf", filename=f"preview_{report_id}.pdf")


@router.get("/{report_id}/download")
def download_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = (
        db.query(ReportModel)
        .join(ProjectModel, ReportModel.project_id == ProjectModel.id)
        .filter(ReportModel.id == report_id, ProjectModel.user_id == current_user.id)
        .first()
    )
    if not report or not report.result_path:
        raise HTTPException(status_code=404, detail="Report not found")

    if not os.path.exists(report.result_path):
        raise HTTPException(status_code=404, detail="Report file missing")

    return FileResponse(report.result_path, media_type="application/pdf", filename=f"report_{report_id}.pdf")


@router.get("/{report_id}/comments", response_model=list[ReportCommentOut])
def report_comments(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = (
        db.query(ReportModel)
        .join(ProjectModel, ReportModel.project_id == ProjectModel.id)
        .filter(ReportModel.id == report_id, ProjectModel.user_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    comments = db.query(ReportCommentModel).filter(ReportCommentModel.report_id == report_id).all()
    return [
        ReportCommentOut(
            id=c.id,
            report_id=c.report_id,
            section=c.section,
            text=c.text,
            source=c.source,
        )
        for c in comments
    ]


@router.post("/{report_id}/render", response_model=ReportStatus)
def render_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = (
        db.query(ReportModel)
        .join(ProjectModel, ReportModel.project_id == ProjectModel.id)
        .filter(ReportModel.id == report_id, ProjectModel.user_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    data = db.query(ReportDataModel).filter(ReportDataModel.report_id == report_id).first()
    if not data:
        raise HTTPException(status_code=404, detail="Report data not found")

    comments = db.query(ReportCommentModel).filter(ReportCommentModel.report_id == report_id).all()
    comments_text = [c.text for c in comments]

    summary = build_simple_summary(data.payload)
    sections = build_sections(data.payload)
    tables = build_tables(data.payload)
    recommendations = build_recommendations(data.payload)
    exec_summary = build_executive_summary(data.payload)

    project = db.query(ProjectModel).filter(ProjectModel.id == report.project_id).first()
    project_name = project.name if project else "Project"
    domain = project.domain if project else "domain"

    output_path = os.path.join(settings.reports_dir, f"report_{report_id}.pdf")
    render_simple_report_pdf(
        output_path,
        project_name=project_name,
        domain=domain,
        period_start=report.period_start,
        period_end=report.period_end,
        summary=summary,
        comments=comments_text,
        sections=sections,
        tables=tables,
        recommendations=recommendations,
        exec_summary=exec_summary,
    )

    report.result_path = output_path
    report.status = "final"
    db.add(report)
    db.commit()

    return ReportStatus(report_id=report.id, status=report.status, message="Report re-rendered")


@router.put("/{report_id}/comments/{comment_id}", response_model=ReportCommentOut)
def update_comment(
    report_id: int,
    comment_id: int,
    payload: ReportCommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = (
        db.query(ReportModel)
        .join(ProjectModel, ReportModel.project_id == ProjectModel.id)
        .filter(ReportModel.id == report_id, ProjectModel.user_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    comment = (
        db.query(ReportCommentModel)
        .filter(ReportCommentModel.id == comment_id, ReportCommentModel.report_id == report_id)
        .first()
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment.text = payload.text
    comment.source = "manual"
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return ReportCommentOut(
        id=comment.id,
        report_id=comment.report_id,
        section=comment.section,
        text=comment.text,
        source=comment.source,
    )


@router.get("/{report_id}/logs", response_model=list[ReportLogOut])
def report_logs(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = (
        db.query(ReportModel)
        .join(ProjectModel, ReportModel.project_id == ProjectModel.id)
        .filter(ReportModel.id == report_id, ProjectModel.user_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    logs = db.query(ReportLogModel).filter(ReportLogModel.report_id == report_id).all()
    return [
        ReportLogOut(id=l.id, report_id=l.report_id, level=l.level, message=l.message)
        for l in logs
    ]
