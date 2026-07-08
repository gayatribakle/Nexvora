import os
import datetime
import io
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional

from app.database.session import get_db
from app.database.models import Violation, Fine, Worker, Report, User, Site
from app.auth.dependencies import get_current_user, require_admin, require_supervisor_or_above
from app.config.settings import settings

router = APIRouter(prefix="/reports", tags=["Reports"])


def generate_report_html(report_type: str, data: dict) -> str:
    html = f"""
    <html>
    <head><style>
        body {{ font-family: Arial, sans-serif; padding: 20px; }}
        h1 {{ color: #1a237e; border-bottom: 2px solid #1a237e; padding-bottom: 10px; }}
        table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #1a237e; color: white; }}
        .summary {{ display: flex; gap: 20px; margin: 20px 0; }}
        .card {{ background: #f5f5f5; padding: 15px; border-radius: 8px; flex: 1; }}
        .card h3 {{ margin: 0 0 10px 0; color: #333; }}
        .card .value {{ font-size: 24px; font-weight: bold; color: #1a237e; }}
    </style></head>
    <body>
    <h1>{data.get('title', report_type.title())}</h1>
    <p>Generated: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}</p>
    <div class="summary">
    """
    for key, value in data.get("summary", {}).items():
        html += f'<div class="card"><h3>{key.replace("_", " ").title()}</h3><div class="value">{value}</div></div>'

    html += "</div><table><tr>"
    if data.get("columns"):
        for col in data["columns"]:
            html += f"<th>{col}</th>"
    html += "</tr>"

    for row in data.get("rows", []):
        html += "<tr>"
        for cell in row:
            html += f"<td>{cell}</td>"
        html += "</tr>"

    html += "</table></body></html>"
    return html


def generate_pdf_from_html(html_content: str) -> bytes:
    """Generate PDF from HTML using weasyprint."""
    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html_content).write_pdf()
        return pdf_bytes
    except Exception as e:
        # Fallback: return HTML as bytes if weasyprint fails
        raise Exception(f"PDF generation failed: {e}")


def generate_excel(data: dict) -> bytes:
    """Generate Excel file from report data."""
    from openpyxl import Workbook

    wb = Workbook()
    ws = wb.active
    ws.title = data.get("title", "Report")[:31]

    # Summary section
    ws.append(["Summary"])
    for key, value in data.get("summary", {}).items():
        ws.append([key.replace("_", " ").title(), value])
    ws.append([])

    # Data table
    columns = data.get("columns", [])
    if columns:
        ws.append(columns)
    for row in data.get("rows", []):
        ws.append(list(row))

    output = io.BytesIO()
    wb.save(output)
    return output.getvalue()


def save_report_file(report_type: str, title: str, content: bytes, fmt: str, user_id: int, db: Session) -> Report:
    """Save report to disk and create DB record."""
    os.makedirs(settings.REPORTS_DIR, exist_ok=True)
    ts = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    ext = "pdf" if fmt == "pdf" else "xlsx"
    filename = f"{report_type}_{ts}.{ext}"
    filepath = os.path.join(settings.REPORTS_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    # Upload to MinIO
    minio_key = None
    try:
        from app.storage.minio_client import upload_file
        content_type = "application/pdf" if fmt == "pdf" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        minio_key = upload_file(filepath, object_name=f"reports/{filename}", content_type=content_type)
    except Exception:
        pass

    report = Report(
        report_type=report_type,
        title=title,
        file_path=filepath,
        minio_key=minio_key,
        format=ext,
        generated_by=user_id,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/daily")
def daily_report(
    format: str = Query("html", regex="^(html|pdf|excel)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor_or_above),
):
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + datetime.timedelta(days=1)

    violations = db.query(Violation).filter(
        Violation.created_at >= today_start,
        Violation.created_at < today_end,
    ).all()

    fines = db.query(Fine).filter(
        Fine.created_at >= today_start,
        Fine.created_at < today_end,
    ).all()

    data = {
        "title": f"Daily Report - {today_start.strftime('%Y-%m-%d')}",
        "summary": {
            "total_violations": len(violations),
            "approved": sum(1 for v in violations if v.status == "approved"),
            "pending": sum(1 for v in violations if v.status == "pending"),
            "total_fines": len(fines),
            "fine_amount": sum(f.amount for f in fines),
        },
        "columns": ["ID", "Type", "Status", "Worker", "Camera", "Time"],
        "rows": [
            [
                v.id, v.violation_type, v.status,
                v.worker.user.full_name if v.worker and v.worker.user else "Unknown",
                v.camera_id, str(v.created_at.strftime("%H:%M:%S")),
            ]
            for v in violations
        ],
    }

    html = generate_report_html("daily", data)

    if format == "pdf":
        pdf_bytes = generate_pdf_from_html(html)
        report = save_report_file("daily", data["title"], pdf_bytes, "pdf", current_user.id, db)
        return FileResponse(report.file_path, filename=os.path.basename(report.file_path), media_type="application/pdf")

    if format == "excel":
        excel_bytes = generate_excel(data)
        report = save_report_file("daily", data["title"], excel_bytes, "excel", current_user.id, db)
        return FileResponse(report.file_path, filename=os.path.basename(report.file_path),
                           media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

    # Default: HTML
    os.makedirs(settings.REPORTS_DIR, exist_ok=True)
    filepath = os.path.join(settings.REPORTS_DIR, f"daily_report_{today_start.strftime('%Y%m%d')}.html")
    with open(filepath, "w") as f:
        f.write(html)
    report = Report(report_type="daily", title=data["title"], file_path=filepath, format="html", generated_by=current_user.id)
    db.add(report)
    db.commit()
    return {"message": "Daily report generated", "file_path": filepath}


@router.get("/employee/{worker_id}")
def employee_report(
    worker_id: int,
    format: str = Query("html", regex="^(html|pdf|excel)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor_or_above),
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    violations = db.query(Violation).filter(Violation.worker_id == worker_id).all()
    fines = db.query(Fine).filter(Fine.worker_id == worker_id).all()
    total_fines_amount = sum(f.amount for f in fines)
    paid_fines = sum(f.amount for f in fines if f.is_paid)
    compliance_score = worker.safety_score

    data = {
        "title": f"Employee Report - {worker.user.full_name if worker.user else 'Unknown'}",
        "summary": {
            "employee_id": worker.employee_id,
            "department": worker.department or "N/A",
            "total_violations": len(violations),
            "total_fines": len(fines),
            "total_fine_amount": f"₹{total_fines_amount:.0f}",
            "paid_fines": f"₹{paid_fines:.0f}",
            "compliance_score": f"{compliance_score}%",
        },
        "columns": ["ID", "Type", "Status", "Confidence", "Date", "Fine"],
        "rows": [
            [
                v.id, v.violation_type, v.status,
                f"{v.confidence:.2f}" if v.confidence else "N/A",
                v.created_at.strftime("%Y-%m-%d %H:%M"),
                f"₹{next((f.amount for f in fines if f.violation_id == v.id), 0):.0f}",
            ]
            for v in violations[:200]
        ],
    }

    html = generate_report_html("employee", data)

    if format == "pdf":
        pdf_bytes = generate_pdf_from_html(html)
        report = save_report_file("employee", data["title"], pdf_bytes, "pdf", current_user.id, db)
        return FileResponse(report.file_path, filename=os.path.basename(report.file_path), media_type="application/pdf")

    if format == "excel":
        excel_bytes = generate_excel(data)
        report = save_report_file("employee", data["title"], excel_bytes, "excel", current_user.id, db)
        return FileResponse(report.file_path, filename=os.path.basename(report.file_path),
                           media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

    return {"data": data}


@router.get("/site/{site_id}")
def site_report(
    site_id: int,
    format: str = Query("html", regex="^(html|pdf|excel)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor_or_above),
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    violations = db.query(Violation).filter(Violation.site_id == site_id).all()
    by_type = {}
    for v in violations:
        by_type[v.violation_type] = by_type.get(v.violation_type, 0) + 1

    fines = db.query(Fine).join(Violation).filter(Violation.site_id == site_id).all()
    total_fines = sum(f.amount for f in fines)

    data = {
        "title": f"Site Report - {site.name}",
        "summary": {
            "location": site.location or "N/A",
            "total_violations": len(violations),
            "violation_types": len(by_type),
            "total_fines": f"₹{total_fines:.0f}",
            **{f"Type: {k}": v for k, v in by_type.items()},
        },
        "columns": ["ID", "Type", "Status", "Worker", "Camera", "Date"],
        "rows": [
            [
                v.id, v.violation_type, v.status,
                v.worker.user.full_name if v.worker and v.worker.user else "Unknown",
                v.camera_id, v.created_at.strftime("%Y-%m-%d %H:%M"),
            ]
            for v in violations[:200]
        ],
    }

    html = generate_report_html("site", data)

    if format == "pdf":
        pdf_bytes = generate_pdf_from_html(html)
        report = save_report_file("site", data["title"], pdf_bytes, "pdf", current_user.id, db)
        return FileResponse(report.file_path, filename=os.path.basename(report.file_path), media_type="application/pdf")

    if format == "excel":
        excel_bytes = generate_excel(data)
        report = save_report_file("site", data["title"], excel_bytes, "excel", current_user.id, db)
        return FileResponse(report.file_path, filename=os.path.basename(report.file_path),
                           media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

    return {"data": data}


@router.get("/monthly")
def monthly_report(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    format: str = Query("html", regex="^(html|pdf|excel)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor_or_above),
):
    start_date = datetime.datetime(year, month, 1)
    if month == 12:
        end_date = datetime.datetime(year + 1, 1, 1)
    else:
        end_date = datetime.datetime(year, month + 1, 1)

    violations = db.query(Violation).filter(
        Violation.created_at >= start_date,
        Violation.created_at < end_date,
    ).all()

    fines = db.query(Fine).filter(
        Fine.created_at >= start_date,
        Fine.created_at < end_date,
    ).all()

    by_type = {}
    by_site = {}
    for v in violations:
        by_type[v.violation_type] = by_type.get(v.violation_type, 0) + 1
        site_name = v.site.name if v.site else "Unknown"
        by_site[site_name] = by_site.get(site_name, 0) + 1

    total_fines = sum(f.amount for f in fines)
    month_name = start_date.strftime("%B %Y")

    data = {
        "title": f"Monthly Report - {month_name}",
        "summary": {
            "total_violations": len(violations),
            "approved": sum(1 for v in violations if v.status == "approved"),
            "rejected": sum(1 for v in violations if v.status == "rejected"),
            "pending": sum(1 for v in violations if v.status == "pending"),
            "total_fines": f"₹{total_fines:.0f}",
            "paid_fines": f"₹{sum(f.amount for f in fines if f.is_paid):.0f}",
        },
        "columns": ["ID", "Type", "Status", "Worker", "Camera", "Date"],
        "rows": [
            [
                v.id, v.violation_type, v.status,
                v.worker.user.full_name if v.worker and v.worker.user else "Unknown",
                v.camera_id, v.created_at.strftime("%Y-%m-%d %H:%M"),
            ]
            for v in violations[:200]
        ],
    }

    html = generate_report_html("monthly", data)

    if format == "pdf":
        pdf_bytes = generate_pdf_from_html(html)
        report = save_report_file("monthly", data["title"], pdf_bytes, "pdf", current_user.id, db)
        return FileResponse(report.file_path, filename=os.path.basename(report.file_path), media_type="application/pdf")

    if format == "excel":
        excel_bytes = generate_excel(data)
        report = save_report_file("monthly", data["title"], excel_bytes, "excel", current_user.id, db)
        return FileResponse(report.file_path, filename=os.path.basename(report.file_path),
                           media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

    return {"data": data}


@router.get("/violation-report")
def violation_report(
    start_date: str = None,
    end_date: str = None,
    format: str = Query("html", regex="^(html|pdf|excel)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    query = db.query(Violation)
    if start_date:
        query = query.filter(Violation.created_at >= datetime.datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Violation.created_at < datetime.datetime.fromisoformat(end_date))

    violations = query.order_by(Violation.created_at.desc()).all()

    by_type = {}
    for v in violations:
        by_type[v.violation_type] = by_type.get(v.violation_type, 0) + 1

    data = {
        "title": "Violation Report",
        "summary": {
            "total_violations": len(violations),
            "violation_types": len(by_type),
            **by_type,
        },
        "columns": ["ID", "Type", "Status", "Worker", "Camera", "Date"],
        "rows": [
            [
                v.id, v.violation_type, v.status,
                v.worker.user.full_name if v.worker and v.worker.user else "Unknown",
                v.camera_id, str(v.created_at.strftime("%Y-%m-%d %H:%M")),
            ]
            for v in violations[:100]
        ],
    }

    html = generate_report_html("violation", data)

    if format == "pdf":
        pdf_bytes = generate_pdf_from_html(html)
        report = save_report_file("violation", data["title"], pdf_bytes, "pdf", current_user.id, db)
        return FileResponse(report.file_path, filename=os.path.basename(report.file_path), media_type="application/pdf")

    if format == "excel":
        excel_bytes = generate_excel(data)
        report = save_report_file("violation", data["title"], excel_bytes, "excel", current_user.id, db)
        return FileResponse(report.file_path, filename=os.path.basename(report.file_path),
                           media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

    os.makedirs(settings.REPORTS_DIR, exist_ok=True)
    filepath = os.path.join(settings.REPORTS_DIR, f"violation_report_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.html")
    with open(filepath, "w") as f:
        f.write(html)

    return {"message": "Violation report generated", "file_path": filepath}


@router.get("/list")
def list_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reports = db.query(Report).order_by(Report.created_at.desc()).limit(20).all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "report_type": r.report_type,
            "format": r.format,
            "created_at": str(r.created_at),
            "file_path": r.file_path,
        }
        for r in reports
    ]


@router.get("/download/{report_id}")
def download_report(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report or not report.file_path or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report not found")

    media_types = {
        "pdf": "application/pdf",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "html": "text/html",
    }
    ext = os.path.splitext(report.file_path)[1].lstrip(".")
    return FileResponse(
        report.file_path,
        filename=os.path.basename(report.file_path),
        media_type=media_types.get(ext, "application/octet-stream"),
    )