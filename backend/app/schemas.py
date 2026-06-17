from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    role: str
    stage_id: Optional[int] = None
    active: bool = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class WorkflowStageBase(BaseModel):
    stage_number: int
    name: str

class WorkflowStageResponse(WorkflowStageBase):
    id: int
    class Config:
        from_attributes = True

class RequestBase(BaseModel):
    request_type: str
    
    # New Bill Fields
    bldesc: Optional[str] = None
    category: Optional[str] = None
    sergrpdesc: Optional[str] = None
    billgrpdesc: Optional[str] = None
    deptdesc: Optional[str] = None
    sf: Optional[str] = None
    doctor: Optional[str] = None
    user_date: Optional[datetime] = None
    
    # Existing fields for mapping/update
    bill_code: Optional[str] = None
    old_description: Optional[str] = None
    old_rate: Optional[str] = None
    new_description: Optional[str] = None
    new_rate: Optional[str] = None
    
    # Mapping request fields
    cpt_code: Optional[str] = None
    cpt_description: Optional[str] = None
    payer: Optional[str] = None

class RequestCreate(RequestBase):
    to_email: Optional[str] = None
    cc_email: Optional[str] = None

class RequestResponse(RequestBase):
    id: int
    req_id: str
    department: str
    requested_by_id: int
    requested_date: datetime
    status: str
    
    # Stage Info
    stage1_status: Optional[str]
    stage1_user_id: Optional[int]
    stage1_date: Optional[datetime]
    stage1_remarks: Optional[str]
    
    stage2_status: Optional[str]
    stage2_user_id: Optional[int]
    stage2_date: Optional[datetime]
    stage2_remarks: Optional[str]
    
    completed_by_id: Optional[int]
    completed_date: Optional[datetime]
    it_remarks: Optional[str]
    assigned_bill_code: Optional[str]
    file_path: Optional[str] = None
    processed_file_path: Optional[str] = None

    requested_by: Optional[UserBase]
    stage1_user: Optional[UserBase]
    stage2_user: Optional[UserBase]
    completed_by: Optional[UserBase]

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    requested_by: Optional[str]
    requested_date: Optional[datetime]
    approved_by: Optional[str]
    approved_date: Optional[datetime]
    action_taken_by: Optional[str] = None
    action_taken_date: Optional[datetime] = None
    finance_reviewed_by: Optional[str] = None
    finance_reviewed_date: Optional[datetime] = None
    request_type: Optional[str] = None
    bill_code: Optional[str]
    description: Optional[str]
    old_rate: Optional[str]
    new_rate: Optional[str]
    department: Optional[str]
    status: Optional[str]

    class Config:
        from_attributes = True

class StageApproval(BaseModel):
    status: str # APPROVED, REJECTED
    remarks: Optional[str] = None
    to_email: Optional[str] = None
    cc_email: Optional[str] = None

class ITCompletion(BaseModel):
    assigned_bill_code: str
    remarks: Optional[str] = None
    to_email: Optional[str] = None
    cc_email: Optional[str] = None
