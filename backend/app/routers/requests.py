from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from app.database import get_db
from app.core.deps import get_current_active_user
from app import models, schemas
import uuid

router = APIRouter(prefix="/api/requests", tags=["requests"])

def generate_req_id(db: Session):
    count = db.query(models.Request).count() + 1
    year = (datetime.utcnow() + timedelta(hours=5, minutes=30)).year
    return f"REQ-{year}-{str(count).zfill(6)}"

@router.get("/", response_model=List[schemas.RequestResponse])
def get_requests(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    # Role-based filtering if needed, for now return all and frontend filters or filter here
    # Admin sees all. Dept sees their own. Stages see what's assigned to them.
    from sqlalchemy.orm import joinedload
    query = db.query(models.Request).options(
        joinedload(models.Request.requested_by),
        joinedload(models.Request.stage1_user),
        joinedload(models.Request.stage2_user),
        joinedload(models.Request.completed_by)
    )
    if current_user.role == "Department":
        query = query.filter(models.Request.requested_by_id == current_user.id)
    return query.order_by(models.Request.requested_date.desc()).all()
@router.get("/id/{req_id}", response_model=schemas.RequestResponse)
def get_request_by_req_id(req_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    normalized_req_id = req_id.replace(" ", "-").replace("%20", "-")
    req = db.query(models.Request).filter(models.Request.req_id == normalized_req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return req

@router.get("/bill-code/{code}")
def get_bill_code_info(code: str, db: Session = Depends(get_db)):
    # Search for a completed NEW_BILL request with this assigned bill code
    req = db.query(models.Request).filter(
        models.Request.assigned_bill_code == code,
        models.Request.status == "COMPLETED"
    ).order_by(models.Request.completed_date.desc()).first()
    
    if req:
        return {
            "bill_code": req.assigned_bill_code,
            "bldesc": req.bldesc,
            "sergrpdesc": req.sergrpdesc,
            "billgrpdesc": req.billgrpdesc,
            "deptdesc": req.deptdesc,
            "rate": req.sf or "25000",
            "description": req.bldesc
        }
    
    raise HTTPException(status_code=404, detail="Bill code doesn't exist")

import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi import Request as FastAPIRequest
import smtplib
from email.message import EmailMessage
from app.core.config import settings
from app.core.smtp_config import get_smtp_config

def format_request_type(req_type: str) -> str:
    if req_type == 'NEW_BILL':
        return "New Bill Code Request"
    formatted = req_type.replace('_', ' ').title()
    if not formatted.endswith('Request'):
        formatted += " Request"
    return formatted

def send_submission_email(request, to_email, cc_email, current_user, db, base_url):
    if not to_email:
        return

    smtp_config = get_smtp_config()
    smtp_user = smtp_config["SMTP_USER"]
    smtp_password = smtp_config["SMTP_PASSWORD"]
    
    msg = EmailMessage()
    msg['From'] = smtp_user
    msg['To'] = to_email
    if cc_email:
        msg['Cc'] = cc_email

    if request.request_type == 'MAPPING_REQUEST':
        public_base_url = settings.PUBLIC_URL.rstrip('/')
        dashboard_link = f"{public_base_url}/request/{request.req_id}"
        msg['Subject'] = f"Request for Mapping - {request.bill_code} - {request.req_id}"
        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>Dear IT Team,</p>
            <br>
            <p>Please map Billing Code {request.bill_code} - {request.bldesc} to {request.cpt_code} - {request.cpt_description}.</p>
            <br>
            <p>Department: {request.deptdesc or current_user.department or request.department}</p>
            <p>Dr. {request.doctor}</p>
            <br>
            <p>Request ID: <a href="{dashboard_link}" style="color: #0a58ca; font-weight: bold; text-decoration: none;">{request.req_id}</a></p>
            <br>
            <p>Thanks &amp; Regards,</p>
            <br>
            <p>{current_user.name}</p>
          </body>
        </html>
        """
    else:
        request_type_str = format_request_type(request.request_type)
        subject_prefix = "New " if not request_type_str.startswith("New ") else ""
        msg['Subject'] = f"{subject_prefix}{request_type_str} Submitted - {request.req_id}"
        
        public_base_url = settings.PUBLIC_URL.rstrip('/')
        dashboard_link = f"{public_base_url}/request/{request.req_id}"
        
        dept_str = f" ({current_user.department})" if current_user.department else ""
        
        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>A <strong>{request_type_str}</strong> has been successfully submitted by {current_user.name}{dept_str}.</p>
            <p>Request ID: <a href="{dashboard_link}" style="color: #0a58ca; font-weight: bold; text-decoration: none;">{request.req_id}</a></p>
            <br>
            <p style="color: #555;">With Regards,<br><strong>{current_user.name}</strong></p>
          </body>
        </html>
        """
    msg.set_content("Please enable HTML to view this email.")
    msg.add_alternative(html_content, subtype='html')
    
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_PORT == 587:
                server.starttls()
            if smtp_user and smtp_password:
                server.login(smtp_user, smtp_password)
            server.send_message(msg)
            
        email_log = models.EmailLog(
            request_id=request.id,
            subject=msg['Subject'],
            sent_to=to_email,
            status="SENT"
        )
        db.add(email_log)
    except Exception as e:
        print(f"Failed to send submission email: {e}")
        email_log = models.EmailLog(
            request_id=request.id,
            subject=msg['Subject'],
            sent_to=to_email,
            status=f"FAILED: {str(e)}"
        )
        db.add(email_log)

@router.post("/", response_model=schemas.RequestResponse)
def create_request(
    req: schemas.RequestCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != "Department":
        raise HTTPException(status_code=403, detail="Only Department can create requests")
        
    db_req = models.Request(
        request_type=req.request_type,
        bldesc=req.bldesc,
        category=req.category,
        sergrpdesc=req.sergrpdesc,
        billgrpdesc=req.billgrpdesc,
        deptdesc=req.deptdesc,
        sf=req.sf,
        doctor=req.doctor,
        user_date=req.user_date,
        bill_code=req.bill_code,
        old_description=req.old_description,
        old_rate=req.old_rate,
        new_description=req.new_description,
        new_rate=req.new_rate,
        cpt_code=req.cpt_code,
        cpt_description=req.cpt_description,
        payer=req.payer,
        req_id=generate_req_id(db),
        department=current_user.department or "",
        requested_by_id=current_user.id,
        status="PENDING_STAGE_3" if req.request_type == 'MAPPING_REQUEST' else "PENDING_STAGE_1",
        stage1_status="SKIPPED" if req.request_type == 'MAPPING_REQUEST' else "PENDING",
        stage2_status="SKIPPED" if req.request_type == 'MAPPING_REQUEST' else "PENDING"
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    
    # Add Audit log
    audit = models.AuditLog(
        requested_by=current_user.name,
        requested_date=db_req.requested_date,
        request_type=db_req.request_type,
        department=db_req.department,
        status=db_req.status,
        description=db_req.bldesc or db_req.old_description
    )
    db.add(audit)
    db.commit()
    
    send_submission_email(db_req, req.to_email, req.cc_email, current_user, db, settings.PUBLIC_URL)
    db.commit()
    
    return db_req

@router.post("/bulk_upload", response_model=schemas.RequestResponse)
def create_bulk_upload(
    request_type: str = Form(...),
    file: UploadFile = File(...),
    to_email: str = Form(""),
    cc_email: str = Form(""),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != "Department":
        raise HTTPException(status_code=403, detail="Only Department can create requests")
        
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_location = f"{upload_dir}/{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    db_req = models.Request(
        req_id=generate_req_id(db),
        request_type=request_type,
        department=current_user.department or "Unknown",
        requested_by_id=current_user.id,
        status="PENDING_STAGE_1",
        file_path=file_location
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    
    audit = models.AuditLog(
        requested_by=current_user.name,
        requested_date=db_req.requested_date,
        request_type=db_req.request_type,
        department=db_req.department,
        status=db_req.status,
        description=f"Bulk upload: {file.filename}"
    )
    db.add(audit)
    db.commit()
    
    send_submission_email(db_req, to_email, cc_email, current_user, db, settings.PUBLIC_URL)
    db.commit()
    
    return db_req

def send_approval_email(request, approval, current_user, db, base_url):
    if not approval.to_email:
        return

    smtp_config = get_smtp_config()
    smtp_user = smtp_config["SMTP_USER"]
    smtp_password = smtp_config["SMTP_PASSWORD"]

    msg = EmailMessage()
    msg['From'] = smtp_user
    msg['To'] = approval.to_email
    if approval.cc_email:
        msg['Cc'] = approval.cc_email

    request_type_str = format_request_type(request.request_type)
    role_name = "Finance" if current_user.role == "Stage 2" else "COO"
    dept_suffix = " Dept." if role_name == "Finance" else ""
    
    msg['Subject'] = f"{role_name} Approved - {request_type_str} - {request.req_id}"
    
    public_base_url = settings.PUBLIC_URL.rstrip('/')
    dashboard_link = f"{public_base_url}/request/{request.req_id}"
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
        <p>The following <strong>{request_type_str}</strong> has been approved by the {role_name}{dept_suffix}.</p>
        <p>Request ID: <a href="{dashboard_link}" style="color: #0a58ca; font-weight: bold; text-decoration: none;">{request.req_id}</a></p>
        <br>
        <p style="color: #555;">With Regards,<br><strong>{current_user.name}</strong></p>
      </body>
    </html>
    """
    msg.set_content("Please enable HTML to view this email.")
    msg.add_alternative(html_content, subtype='html')
    
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_PORT == 587:
                server.starttls()
            if smtp_user and smtp_password:
                server.login(smtp_user, smtp_password)
            server.send_message(msg)
            
        email_log = models.EmailLog(
            request_id=request.id,
            subject=msg['Subject'],
            sent_to=approval.to_email,
            status="SENT"
        )
        db.add(email_log)
    except Exception as e:
        print(f"Failed to send approval email: {e}")
        email_log = models.EmailLog(
            request_id=request.id,
            subject=msg['Subject'],
            sent_to=approval.to_email,
            status=f"FAILED: {str(e)}"
        )
        db.add(email_log)

@router.post("/{req_id}/stage1")
def stage1_approval(
    req_id: int, 
    approval: schemas.StageApproval, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != "Stage 1":
        raise HTTPException(status_code=403, detail="Not authorized for Stage 1")
    
    req = db.query(models.Request).filter(models.Request.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    req.stage1_status = approval.status
    req.stage1_remarks = approval.remarks
    req.stage1_user_id = current_user.id
    req.stage1_date = (datetime.utcnow() + timedelta(hours=5, minutes=30))
    
    if approval.status == "APPROVED":
        req.status = "PENDING_STAGE_2_AND_3"
        send_approval_email(req, approval, current_user, db, settings.PUBLIC_URL)
    else:
        req.status = "REJECTED"
        
    db.commit()
    return {"msg": "Stage 1 updated"}

@router.post("/{req_id}/stage2")
def stage2_approval(req_id: int, approval: schemas.StageApproval, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    if current_user.role != "Stage 2":
        raise HTTPException(status_code=403, detail="Not authorized for Stage 2")
        
    req = db.query(models.Request).filter(models.Request.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    req.stage2_status = approval.status
    req.stage2_remarks = approval.remarks
    req.stage2_user_id = current_user.id
    req.stage2_date = (datetime.utcnow() + timedelta(hours=5, minutes=30))
    
    audit = db.query(models.AuditLog).filter(models.AuditLog.request_type == req.request_type, models.AuditLog.requested_date == req.requested_date).first()
    if audit:
        audit.finance_reviewed_by = current_user.name
        audit.finance_reviewed_date = req.stage2_date

    if approval.status == "APPROVED":
        send_approval_email(req, approval, current_user, db, settings.PUBLIC_URL)

    db.commit()
    return {"msg": "Stage 2 updated"}

import smtplib
from email.message import EmailMessage
from app.core.config import settings

from fastapi import Request as FastAPIRequest

def send_completion_email(request, completion, current_user, db, base_url="http://localhost:8000/"):
    if not completion.to_email:
        return

    smtp_config = get_smtp_config()
    smtp_user = smtp_config["SMTP_USER"]
    smtp_password = smtp_config["SMTP_PASSWORD"]

    msg = EmailMessage()
    msg['From'] = smtp_user
    msg['To'] = completion.to_email
    if completion.cc_email:
        msg['Cc'] = completion.cc_email

    if request.request_type == 'MAPPING_REQUEST':
        msg['Subject'] = f"Surgery Code Mapped - {request.bill_code}"
        
        html_content = f"""
        <html>
          <head>
            <style>
              table {{ border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 14px; margin-bottom: 20px; }}
              th {{ background-color: #0056b3; color: white; border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; font-weight: bold; }}
              td {{ border: 1px solid #ddd; padding: 10px; text-align: left; }}
            </style>
          </head>
          <body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>The mapping request has been completed.</p>
            
            <table>
              <tr>
                <th style="color: white !important;">CODE</th>
                <th style="color: white !important;">DESC</th>
                <th style="color: white !important;">CPT - CODE</th>
                <th style="color: white !important;">CPT DESC</th>
                <th style="color: white !important;">RATE</th>
              </tr>
              <tr>
                <td><strong style="color: #0056b3;">{request.bill_code}</strong></td>
                <td>{request.old_description}</td>
                <td>{request.cpt_code}</td>
                <td>{request.cpt_description}</td>
                <td>{request.old_rate}</td>
              </tr>
            </table>

            <p style="color: #555; margin-top: 40px;">
              With Regards,<br>
              <strong>{current_user.name}</strong>
            </p>
          </body>
        </html>
        """
        msg.set_content("Please enable HTML to view this email.")
        msg.add_alternative(html_content, subtype='html')
    elif request.request_type == 'BULK_UPLOAD':
        msg['Subject'] = f"Bulk Upload Completed - {completion.assigned_bill_code if completion.assigned_bill_code else request.req_id}"
        
        public_base_url = settings.PUBLIC_URL.rstrip('/')
        api_base_url = public_base_url.replace("5173", "8001")
        file_link = f"{api_base_url}/api/requests/{request.id}/download/processed" if request.processed_file_path else "#"
        file_name = request.processed_file_path.split('/')[-1] if request.processed_file_path else "No processed file"
        
        html_content = f"""
        <html>
          <head>
            <style>
              table {{ border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 14px; margin-bottom: 20px; }}
              th {{ background-color: #0056b3; color: white; border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; font-weight: bold; }}
              td {{ border: 1px solid #ddd; padding: 10px; text-align: left; }}
              .btn {{ background-color: #f26522; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; font-family: Arial, sans-serif; }}
            </style>
          </head>
          <body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>Bulk document processing has been completed.</p>
            
            <table>
              <tr>
                <th>SL.NO</th>
                <th>FILE NAME</th>
                <th>REMARKS</th>
              </tr>
              <tr>
                <td>1</td>
                <td>{file_name}</td>
                <td>{completion.remarks or ''}</td>
              </tr>
            </table>

            <a href="{file_link}" class="btn" style="color: white !important;">Download Processed File</a>

            <br><br><br>
            <p style="color: #555;">
              With Regards,<br>
              <strong>{current_user.name}</strong>
            </p>
          </body>
        </html>
        """
        msg.set_content("Please enable HTML to view this email.")
        msg.add_alternative(html_content, subtype='html')
    elif request.request_type in ['RATE_UPDATE', 'DESCRIPTION_UPDATE', 'RATE_AND_DESCRIPTION_UPDATE']:
        update_type_str = request.request_type.replace('_', ' ').title()
        msg['Subject'] = f"{update_type_str} Completed - {request.bill_code}"
        
        html_content = f"""
        <html>
          <head>
            <style>
              table {{ border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 14px; margin-bottom: 20px; }}
              th {{ background-color: #0056b3; color: white; border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; font-weight: bold; }}
              td {{ border: 1px solid #ddd; padding: 10px; text-align: left; }}
            </style>
          </head>
          <body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
            <p>Dear {request.requested_by.name if request.requested_by else 'Team'},</p>
            <p>The {update_type_str} has been completed in HIS.</p>
            
            <table>
              <tr>
                <th style="color: white !important;">BILLCODE</th>
                <th style="color: white !important;">OLD DESC</th>
                <th style="color: white !important;">NEW DESC</th>
                <th style="color: white !important;">OLD RATE</th>
                <th style="color: white !important;">NEW RATE</th>
                <th style="color: white !important;">DATE</th>
              </tr>
              <tr>
                <td><strong style="color: #0056b3;">{request.bill_code}</strong></td>
                <td>{request.old_description or '-'}</td>
                <td>{request.new_description or '-'}</td>
                <td>&#8377; {request.old_rate or '-'}</td>
                <td>&#8377; {request.new_rate or '-'}</td>
                <td>{request.requested_date.strftime('%Y-%m-%d')}</td>
              </tr>
            </table>

            <p>{completion.remarks or ''}</p>

            <p style="color: #555; margin-top: 40px;">
              With Regards,<br>
              <strong>{current_user.name}</strong>
            </p>
          </body>
        </html>
        """
        msg.set_content("Please enable HTML to view this email.")
        msg.add_alternative(html_content, subtype='html')
    else:
        msg['Subject'] = f"New Bill Code Created - {completion.assigned_bill_code}"
        
        html_content = f"""
        <html>
          <head>
            <style>
              table {{ border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 14px; }}
              th {{ background-color: #0056b3; color: white; border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }}
              td {{ border: 1px solid #ddd; padding: 10px; text-align: left; }}
            </style>
          </head>
          <body style="font-family: Arial, sans-serif; font-size: 14px;">
            <br>
            
            <table>
              <tr>
                <th style="color: #ffffff !important;"><span style="color: #ffffff !important; text-decoration: none;">SL NO</span></th>
                <th style="color: #ffffff;">BILLCODE</th>
                <th style="color: #ffffff;">BLDESC</th>
                <th style="color: #ffffff;">CATEGORY</th>
                <th style="color: #ffffff;">SERGRPDESC</th>
                <th style="color: #ffffff;">BILGRPDESC</th>
                <th style="color: #ffffff;">DEPTDESC</th>
                <th style="color: #ffffff;">SF</th>
                <th style="color: #ffffff;">DOCTOR</th>
                <th style="color: #ffffff;">DATE</th>
              </tr>
              <tr>
                <td>1</td>
                <td><strong style="color: #0056b3;">{completion.assigned_bill_code}</strong></td>
                <td>{request.bldesc or request.new_description or request.old_description}</td>
                <td>{request.category or ''}</td>
                <td>{request.sergrpdesc or ''}</td>
                <td>{request.billgrpdesc or ''}</td>
                <td>{request.deptdesc or ''}</td>
                <td>&#8377; {request.sf or ''}</td>
                <td>{request.doctor or ''}</td>
                <td>{request.requested_date.strftime('%Y-%m-%d')}</td>
              </tr>
            </table>

            <p>{completion.remarks or ''}</p>

            <p style="color: #555;">
              With Regards,<br>
              <strong>{current_user.name}</strong>
            </p>
          </body>
        </html>
        """
        msg.set_content("Please enable HTML to view this email.")
        msg.add_alternative(html_content, subtype='html')
    try:
        # If SMTP fails, we still want to complete the request but log it.
        # Use localhost or configured host. If not running, it will throw ConnectionRefusedError.
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_PORT == 587:
                server.starttls()
            if smtp_user and smtp_password:
                server.login(smtp_user, smtp_password)
            server.send_message(msg)
            
        email_log = models.EmailLog(
            request_id=request.id,
            subject=msg['Subject'],
            sent_to=completion.to_email,
            status="SENT"
        )
        db.add(email_log)
    except Exception as e:
        print(f"Failed to send email: {e}")
        email_log = models.EmailLog(
            request_id=request.id,
            subject=msg['Subject'],
            sent_to=completion.to_email,
            status=f"FAILED: {str(e)}"
        )
        db.add(email_log)

@router.post("/{req_id}/complete")
def complete_request(req_id: int, completion: schemas.ITCompletion, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    if current_user.role != "Stage 3":
        raise HTTPException(status_code=403, detail="Not authorized for Stage 3")
        
    req = db.query(models.Request).filter(models.Request.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    req.assigned_bill_code = completion.assigned_bill_code
    req.it_remarks = completion.remarks
    req.completed_by_id = current_user.id
    req.completed_date = (datetime.utcnow() + timedelta(hours=5, minutes=30))
    req.status = "COMPLETED"
    
    # Audit log update
    audit = db.query(models.AuditLog).filter(models.AuditLog.request_type == req.request_type, models.AuditLog.requested_date == req.requested_date).first()
    if audit:
        audit.action_taken_by = current_user.name
        audit.action_taken_date = req.completed_date
        audit.bill_code = req.assigned_bill_code
        audit.status = "COMPLETED"
        if req.stage1_user:
            audit.approved_by = req.stage1_user.name
            audit.approved_date = req.stage1_date

    send_completion_email(req, completion, current_user, db)

    db.commit()
    return {"msg": "Request completed"}

@router.post("/{req_id}/complete_bulk")
def complete_bulk_request(
    req_id: int,
    file: UploadFile = File(...),
    remarks: str = Form(""),
    to_email: str = Form(""),
    cc_email: str = Form(""),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role != "Stage 3":
        raise HTTPException(status_code=403, detail="Not authorized for Stage 3")
        
    req = db.query(models.Request).filter(models.Request.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    upload_dir = "uploads/processed"
    os.makedirs(upload_dir, exist_ok=True)
    file_location = f"{upload_dir}/{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    req.it_remarks = remarks
    req.completed_by_id = current_user.id
    req.completed_date = (datetime.utcnow() + timedelta(hours=5, minutes=30))
    req.status = "COMPLETED"
    req.processed_file_path = file_location
    
    audit = db.query(models.AuditLog).filter(models.AuditLog.request_type == req.request_type, models.AuditLog.requested_date == req.requested_date).first()
    if audit:
        audit.action_taken_by = current_user.name
        audit.action_taken_date = req.completed_date
        audit.status = "COMPLETED"
        if req.stage1_user:
            audit.approved_by = req.stage1_user.name
            audit.approved_date = req.stage1_date

    completion_schema = schemas.ITCompletion(
        assigned_bill_code="BULK UPLOAD COMPLETED",
        remarks=remarks,
        to_email=to_email,
        cc_email=cc_email
    )
    # Send email for bulk upload completion
    send_completion_email(req, completion_schema, current_user, db, base_url=settings.PUBLIC_URL)

    db.commit()
    return {"msg": "Bulk request completed"}

from fastapi.responses import FileResponse

@router.get("/{req_id}/download/{file_type}")
def download_file(req_id: int, file_type: str, db: Session = Depends(get_db)):
    # Note: Authentication can be added here if needed
    req = db.query(models.Request).filter(models.Request.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    file_path = None
    if file_type == "original" and req.file_path:
        file_path = req.file_path
    elif file_type == "processed" and req.processed_file_path:
        file_path = req.processed_file_path
        
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(path=file_path, filename=os.path.basename(file_path))

@router.delete("/all")
def delete_all_requests(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    if current_user.role != 'Admin':
        raise HTTPException(status_code=403, detail="Only Admins can delete all requests")
    
    db.query(models.EmailLog).delete()
    db.query(models.AuditLog).delete()
    db.query(models.Request).delete()
    db.commit()
    return {"msg": "All requests and logs deleted successfully"}
