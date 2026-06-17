from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.core.deps import get_current_active_user
from app import models, schemas
import csv
from io import StringIO
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("/", response_model=List[schemas.AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    return db.query(models.AuditLog).order_by(models.AuditLog.requested_date.desc()).all()

from typing import List, Optional
from datetime import datetime

@router.get("/export")
def export_audit_csv(
    from_date: Optional[str] = None, 
    to_date: Optional[str] = None, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_active_user)
):
    query = db.query(models.AuditLog)
    
    if from_date:
        try:
            fd = datetime.fromisoformat(from_date)
            query = query.filter(models.AuditLog.requested_date >= fd)
        except ValueError:
            pass
            
    if to_date:
        try:
            # Append time to the end of the day if just a date string is provided
            td_str = to_date + " 23:59:59" if len(to_date) == 10 else to_date
            td = datetime.fromisoformat(td_str)
            query = query.filter(models.AuditLog.requested_date <= td)
        except ValueError:
            pass

    logs = query.all()
    
    f = StringIO()
    writer = csv.writer(f)
    writer.writerow([
        "Requested By", "Requested Date", "Approved By", "Approved Date", 
        "Finance Reviewed By", "Finance Reviewed Date",
        "Action Taken By", "Action Taken Date", "Request Type", "Bill Code", 
        "Description", "Old Rate", "New Rate", "Department", "Status"
    ])
    
    for log in logs:
        writer.writerow([
            log.requested_by or "Not Applicable",
            log.requested_date.strftime("%Y-%m-%d %H:%M:%S") if log.requested_date else "Not Applicable",
            log.approved_by or "Not Applicable",
            log.approved_date.strftime("%Y-%m-%d %H:%M:%S") if log.approved_date else "Not Applicable",
            log.finance_reviewed_by or "Not Applicable",
            log.finance_reviewed_date.strftime("%Y-%m-%d %H:%M:%S") if log.finance_reviewed_date else "Not Applicable",
            log.action_taken_by or "Not Applicable",
            log.action_taken_date.strftime("%Y-%m-%d %H:%M:%S") if log.action_taken_date else "Not Applicable",
            log.request_type or "Not Applicable",
            log.bill_code or "Not Applicable",
            log.description or "Not Applicable",
            log.old_rate or "Not Applicable",
            log.new_rate or "Not Applicable",
            log.department or "Not Applicable",
            log.status or "Not Applicable"
        ])
        
    f.seek(0)
    return StreamingResponse(f, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=audit_export.csv"})
