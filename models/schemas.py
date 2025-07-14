from pydantic import BaseModel, HttpUrl, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class CompanyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    website_url: Optional[HttpUrl] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(CompanyBase):
    name: Optional[str] = Field(None, min_length=1, max_length=255)

class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class DistributorBase(BaseModel):
    partner_type: str = Field(..., pattern=r'^(master|simple)$')
    address: str = Field(..., min_length=1)
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180)
    phone: Optional[str] = Field(None, max_length=200)
    contact_email: Optional[EmailStr] = None
    contact_url: Optional[HttpUrl] = None
    region: Optional[str] = Field(None, max_length=10)
    country_state: Optional[str] = Field(None, max_length=50)
    is_active: bool = True
    
    @validator('partner_type')
    def validate_partner_type(cls, v):
        if v not in ['master', 'simple']:
            raise ValueError('partner_type must be either "master" or "simple"')
        return v

class DistributorCreate(DistributorBase):
    company_id: int

class DistributorUpdate(DistributorBase):
    partner_type: Optional[str] = Field(None, pattern=r'^(master|simple)$')
    address: Optional[str] = Field(None, min_length=1)
    is_active: Optional[bool] = None

class DistributorResponse(DistributorBase):
    id: int
    company_id: int
    company: CompanyResponse
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ChangeHistoryBase(BaseModel):
    change_type: str = Field(..., pattern=r'^(created|updated|deleted)$')
    old_data: Optional[str] = None
    new_data: Optional[str] = None
    
    @validator('change_type')
    def validate_change_type(cls, v):
        if v not in ['created', 'updated', 'deleted']:
            raise ValueError('change_type must be one of: created, updated, deleted')
        return v

class ChangeHistoryResponse(ChangeHistoryBase):
    id: int
    distributor_id: Optional[int] = None
    detected_at: datetime
    
    class Config:
        from_attributes = True

# Scraped data models
class ScrapedDistributor(BaseModel):
    company_name: str
    partner_type: str
    website_url: Optional[str] = None
    address: str
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    phone: Optional[str] = None
    contact_email: Optional[str] = None
    contact_url: Optional[str] = None
    region: Optional[str] = None
    country_state: Optional[str] = None
    
    @validator('partner_type')
    def validate_partner_type(cls, v):
        if v not in ['master', 'simple']:
            raise ValueError('partner_type must be either "master" or "simple"')
        return v

# API Response models
class SyncResponse(BaseModel):
    status: str
    scraped_count: int
    processing_results: dict
    notion_results: Optional[dict] = None
    message: str

class AnalyticsSummary(BaseModel):
    total_distributors: int
    active_distributors: int
    master_distributors: int
    reseller_distributors: int
    region_distribution: dict
    last_updated: datetime

class HealthCheck(BaseModel):
    status: str
    checks: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Pagination models
class PaginatedResponse(BaseModel):
    items: List[dict]
    total: int
    page: int
    per_page: int
    pages: int
    has_next: bool
    has_prev: bool

class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=50, ge=1, le=100)
    
    @property
    def offset(self) -> int:
        return (self.page - 1) * self.per_page