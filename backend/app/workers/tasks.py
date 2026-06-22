import os
from app.workers.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.report import Report
from app.models.project import Project
from app.core.settings import settings
from app.services.pdf import render_simple_report_pdf
from app.services.collectors import DataCollector
from app.models.integration import Integration
from app.models.report_data import ReportData
from app.services.report_builder import build_simple_summary
from app.services.section_builder import build_sections
from app.services.table_builder import build_tables
from app.services.recommendation_builder import build_recommendations
from app.services.executive_summary import build_executive_summary
from app.services.comment_builder import generate_ai_comments
from app.models.report_comment import ReportComment
from app.models.report_log import ReportLog


@celery_app.task(name="generate_report", bind=True, max_retries=3, default_retry_delay=30)
def generate_report_task(self, report_id: int) -> None:
    db = SessionLocal()
    try:
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            return

        report.status = "collecting"
        db.commit()

        project = db.query(Project).filter(Project.id == report.project_id).first()
        project_name = project.name if project else "Unknown"
        domain = project.domain if project else "unknown"

        integrations = (
            db.query(Integration)
            .filter(Integration.project_id == report.project_id)
            .all()
        )

        collector = DataCollector(db)
        collected = {}
        for integration in integrations:
            collected[integration.provider] = collector.collect(
                integration,
                period_start=report.period_start,
                period_end=report.period_end,
            )

        existing = db.query(ReportData).filter(ReportData.report_id == report.id).first()
        if existing:
            existing.payload = collected
            db.add(existing)
        else:
            report_data = ReportData(report_id=report.id, payload=collected)
            db.add(report_data)
        db.commit()

        summary = build_simple_summary(collected)

        existing_comments = db.query(ReportComment).filter(ReportComment.report_id == report.id).all()
        for c in existing_comments:
            db.delete(c)
        db.commit()

        for comment in generate_ai_comments(collected):
            db.add(
                ReportComment(
                    report_id=report.id,
                    section=comment["section"],
                    text=comment["text"],
                    source="ai",
                )
            )
        db.commit()
        comments = [
            c.text
            for c in db.query(ReportComment).filter(ReportComment.report_id == report.id).all()
        ]
        sections = build_sections(collected)
        tables = build_tables(collected)
        recommendations = build_recommendations(collected)
        exec_summary = build_executive_summary(collected)
        output_path = os.path.join(settings.reports_dir, f"report_{report_id}.pdf")
        render_simple_report_pdf(
            output_path,
            project_name=project_name,
            domain=domain,
            period_start=report.period_start,
            period_end=report.period_end,
            summary=summary,
            comments=comments,
            sections=sections,
            tables=tables,
            recommendations=recommendations,
            exec_summary=exec_summary,
        )

        report.status = "ready"
        report.result_path = output_path
        db.commit()
        db.add(ReportLog(report_id=report.id, level="info", message="Report ready"))
        db.commit()
    except Exception as exc:
        try:
            report = db.query(Report).filter(Report.id == report_id).first()
            if report:
                report.status = "error"
                db.add(report)
                db.commit()
                db.add(ReportLog(report_id=report.id, level="error", message=str(exc)[:2000]))
                db.commit()
        finally:
            db.close()
        raise self.retry(exc=exc)
    finally:
        db.close()
