import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.platypus import Table, TableStyle
from reportlab.lib import colors
from typing import Optional, List, Dict


def _wrap_text(text: str, max_width: int) -> list[str]:
    words = text.split()
    lines = []
    line = []
    length = 0
    for word in words:
        if length + len(word) + 1 > max_width and line:
            lines.append(" ".join(line))
            line = [word]
            length = len(word)
        else:
            line.append(word)
            length += len(word) + 1
    if line:
        lines.append(" ".join(line))
    return lines


def _draw_simple_line_chart(c: canvas.Canvas, points: list[float], x: float, y: float, w: float, h: float) -> float:
    if not points:
        return 0
    min_v = min(points)
    max_v = max(points)
    span = max_v - min_v if max_v != min_v else 1
    step = w / max(1, len(points) - 1)

    c.setStrokeColor(colors.darkblue)
    c.setLineWidth(1)
    last_x = x
    last_y = y + ((points[0] - min_v) / span) * h
    for i, val in enumerate(points[1:], start=1):
        cur_x = x + step * i
        cur_y = y + ((val - min_v) / span) * h
        c.line(last_x, last_y, cur_x, cur_y)
        last_x, last_y = cur_x, cur_y
    return h


def render_simple_report_pdf(
    output_path: str,
    *,
    project_name: str,
    domain: str,
    period_start: str,
    period_end: str,
    summary: Optional[str] = None,
    comments: Optional[List[str]] = None,
    sections: Optional[List[Dict]] = None,
    tables: Optional[List[Dict]] = None,
    recommendations: Optional[List[str]] = None,
    exec_summary: Optional[str] = None,
) -> None:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    y = height - 72
    c.setFont("Helvetica-Bold", 20)
    c.drawString(72, y, "SEOSmartReport")

    y -= 36
    c.setFont("Helvetica", 12)
    c.drawString(72, y, f"Project: {project_name}")
    y -= 18
    c.drawString(72, y, f"Domain: {domain}")
    y -= 18
    c.drawString(72, y, f"Period: {period_start} to {period_end}")
    y -= 18
    c.drawString(72, y, f"Generated: {datetime.utcnow().isoformat()} UTC")

    # Title page line
    y -= 12
    c.setStrokeColor(colors.lightgrey)
    c.line(72, y, width - 72, y)

    # Start content on a new page for clarity
    c.showPage()
    y = height - 72

    if exec_summary:
        y -= 24
        c.setFont("Helvetica-Bold", 12)
        c.drawString(72, y, "Executive Summary")
        y -= 16
        c.setFont("Helvetica", 11)
        for line in _wrap_text(exec_summary, 90):
            c.drawString(72, y, line)
            y -= 14

    y -= 24
    c.setFont("Helvetica-Bold", 14)
    c.drawString(72, y, "Summary")
    y -= 18
    c.setFont("Helvetica", 12)
    text = summary or "This is a temporary placeholder PDF."
    for line in _wrap_text(text, 80):
        c.drawString(72, y, line)
        y -= 16

    if comments:
        y -= 16
        c.setFont("Helvetica-Bold", 12)
        c.drawString(72, y, "AI Comments")
        y -= 18
        c.setFont("Helvetica", 11)
        for comment in comments:
            for line in _wrap_text(f"- {comment}", 90):
                c.drawString(72, y, line)
                y -= 14

    if sections:
        y -= 18
        c.setFont("Helvetica-Bold", 14)
        c.drawString(72, y, "Sections")
        y -= 20
        c.setFont("Helvetica", 11)
        for section in sections:
            title = section.get("title", "Section")
            content = section.get("content", "")
            c.setFont("Helvetica-Bold", 11)
            c.drawString(72, y, title)
            y -= 14
            c.setFont("Helvetica", 11)
            for line in _wrap_text(content, 95):
                c.drawString(72, y, line)
                y -= 14
            y -= 8

    if tables:
        y -= 16
        c.setFont("Helvetica-Bold", 14)
        c.drawString(72, y, "Tables")
        y -= 20

        for table in tables:
            title = table.get("title", "Table")
            rows = table.get("rows", [])
            if not rows:
                continue

            c.setFont("Helvetica-Bold", 11)
            c.drawString(72, y, title)
            y -= 14

            t = Table(rows, colWidths=[120] * len(rows[0]))
            t.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                        ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ]
                )
            )

            w, h = t.wrapOn(c, 400, y)
            t.drawOn(c, 72, y - h)
            y -= h + 16

    # Optional simple charts
    if sections:
        for section in sections:
            if section.get("chart"):
                points = section.get("chart")
                if not isinstance(points, list) or not points:
                    continue
                if y < 160:
                    c.showPage()
                    y = height - 72
                y -= 16
                c.setFont("Helvetica-Bold", 12)
                c.drawString(72, y, f"{section.get('title', 'Chart')}")
                y -= 12
                chart_h = 80
                _draw_simple_line_chart(c, points, 72, y - chart_h, 400, chart_h)
                y -= chart_h + 8

    if recommendations:
        y -= 12
        c.setFont("Helvetica-Bold", 14)
        c.drawString(72, y, "Recommendations")
        y -= 18
        c.setFont("Helvetica", 11)
        for rec in recommendations:
            for line in _wrap_text(f"- {rec}", 90):
                c.drawString(72, y, line)
                y -= 14

    c.showPage()
    c.save()
