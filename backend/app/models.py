from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    department = Column(String, nullable=True)
    role = Column(String, nullable=False) # Admin, Department, Stage 1, Stage 2, Stage 3
    stage_id = Column(Integer, ForeignKey("workflow_stages.id"), nullable=True)
    active = Column(Boolean, default=True)

    stage = relationship("WorkflowStage")

class WorkflowStage(Base):
    __tablename__ = "workflow_stages"
    
    id = Column(Integer, primary_key=True, index=True)
    stage_number = Column(Integer, unique=True, nullable=False) # 1, 2, 3
    name = Column(String, nullable=False)

class Request(Base):
    __tablename__ = "requests"
    
    id = Column(Integer, primary_key=True, index=True)
    req_id = Column(String, unique=True, index=True, nullable=False)
    request_type = Column(String, nullable=False)
    department = Column(String, nullable=False)
    
    requested_by_id = Column(Integer, ForeignKey("users.id"))
    requested_date = Column(DateTime, default=lambda: datetime.datetime.utcnow() + datetime.timedelta(hours=5, minutes=30))
    
    status = Column(String, default="PENDING_STAGE_1") # PENDING_STAGE_1, IN_PROGRESS, REJECTED, COMPLETED
    
    # New Bill Fields
    bldesc = Column(String, nullable=True)
    category = Column(String, nullable=True)
    sergrpdesc = Column(String, nullable=True)
    billgrpdesc = Column(String, nullable=True)
    deptdesc = Column(String, nullable=True)
    sf = Column(String, nullable=True)
    doctor = Column(String, nullable=True)
    user_date = Column(DateTime, nullable=True)
    
    # Existing fields for mapping/update
    bill_code = Column(String, nullable=True)
    old_description = Column(String, nullable=True)
    old_rate = Column(String, nullable=True)
    new_description = Column(String, nullable=True)
    new_rate = Column(String, nullable=True)
    
    # Mapping request fields
    cpt_code = Column(String, nullable=True)
    cpt_description = Column(String, nullable=True)
    payer = Column(String, nullable=True)
    
    # Bulk upload field
    file_path = Column(String, nullable=True)
    processed_file_path = Column(String, nullable=True)
    
    # Stage 1 Info
    stage1_status = Column(String, default="PENDING")
    stage1_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    stage1_date = Column(DateTime, nullable=True)
    stage1_remarks = Column(Text, nullable=True)
    
    # Stage 2 Info (Finance - Advisory)
    stage2_status = Column(String, default="PENDING")
    stage2_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    stage2_date = Column(DateTime, nullable=True)
    stage2_remarks = Column(Text, nullable=True)
    
    # Stage 3 Info (IT - Execution)
    completed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    completed_date = Column(DateTime, nullable=True)
    it_remarks = Column(Text, nullable=True)
    
    # Execution assigned bill code
    assigned_bill_code = Column(String, nullable=True)

    requested_by = relationship("User", foreign_keys=[requested_by_id])
    stage1_user = relationship("User", foreign_keys=[stage1_user_id])
    stage2_user = relationship("User", foreign_keys=[stage2_user_id])
    completed_by = relationship("User", foreign_keys=[completed_by_id])

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    requested_by = Column(String, nullable=True)
    requested_date = Column(DateTime, nullable=True)
    approved_by = Column(String, nullable=True) # Stage 1 user name
    approved_date = Column(DateTime, nullable=True) # Stage 1 date
    action_taken_by = Column(String, nullable=True) # Stage 3 user name
    action_taken_date = Column(DateTime, nullable=True)
    finance_reviewed_by = Column(String, nullable=True) # Stage 2 user name
    finance_reviewed_date = Column(DateTime, nullable=True)
    request_type = Column(String, nullable=True)
    bill_code = Column(String, nullable=True)
    description = Column(String, nullable=True)
    old_rate = Column(String, nullable=True)
    new_rate = Column(String, nullable=True)
    department = Column(String, nullable=True)
    status = Column(String, nullable=True)

class EmailLog(Base):
    __tablename__ = "email_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("requests.id"))
    subject = Column(String, nullable=False)
    sent_to = Column(String, nullable=False)
    sent_date = Column(DateTime, default=lambda: datetime.datetime.utcnow() + datetime.timedelta(hours=5, minutes=30))
    status = Column(String, nullable=False)

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.datetime.utcnow() + datetime.timedelta(hours=5, minutes=30))
