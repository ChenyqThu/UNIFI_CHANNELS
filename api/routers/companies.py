from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from config.database import get_db
from models.database import Company, Distributor
from models.schemas import CompanyResponse, PaginatedResponse, PaginationParams
from api.dependencies import rate_limit

router = APIRouter()

@router.get("/", response_model=PaginatedResponse)
async def get_companies(
    pagination: PaginationParams = Depends(),
    search: Optional[str] = Query(None, description="Search company names"),
    has_distributors: bool = Query(True, description="Only companies with distributors"),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit)
):
    """Get paginated list of companies"""
    try:
        query = db.query(Company)
        
        # Apply filters
        if has_distributors:
            query = query.filter(Company.distributors.any())
        
        if search:
            query = query.filter(Company.name.ilike(f"%{search}%"))
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        companies = query.order_by(Company.name).offset(pagination.offset).limit(pagination.per_page).all()
        
        # Convert to response models
        items = [CompanyResponse.from_orm(company) for company in companies]
        
        return PaginatedResponse(
            items=items,
            total=total,
            page=pagination.page,
            per_page=pagination.per_page,
            pages=(total + pagination.per_page - 1) // pagination.per_page,
            has_next=pagination.offset + pagination.per_page < total,
            has_prev=pagination.page > 1
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit)
):
    """Get a specific company by ID"""
    company = db.query(Company).filter(Company.id == company_id).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return CompanyResponse.from_orm(company)

@router.get("/{company_id}/distributors")
async def get_company_distributors(
    company_id: int,
    active_only: bool = Query(True, description="Only return active distributors"),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit)
):
    """Get all distributors for a specific company"""
    try:
        company = db.query(Company).filter(Company.id == company_id).first()
        
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        query = db.query(Distributor).filter(Distributor.company_id == company_id)
        
        if active_only:
            query = query.filter(Distributor.is_active == True)
        
        distributors = query.all()
        
        return {
            "company": CompanyResponse.from_orm(company),
            "distributors": [
                {
                    "id": dist.id,
                    "partner_type": dist.partner_type,
                    "address": dist.address,
                    "region": dist.region,
                    "country_state": dist.country_state,
                    "is_active": dist.is_active,
                    "phone": dist.phone,
                    "contact_email": dist.contact_email
                }
                for dist in distributors
            ],
            "total_distributors": len(distributors)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search/{company_name}")
async def search_companies(
    company_name: str,
    limit: int = Query(10, description="Maximum number of results"),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit)
):
    """Search companies by name"""
    try:
        companies = db.query(Company).filter(
            Company.name.ilike(f"%{company_name}%")
        ).limit(limit).all()
        
        return {
            "query": company_name,
            "results": [CompanyResponse.from_orm(company) for company in companies],
            "total_found": len(companies)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/overview")
async def get_company_stats(
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit)
):
    """Get company statistics overview"""
    try:
        total_companies = db.query(Company).count()
        
        companies_with_distributors = db.query(Company).filter(
            Company.distributors.any()
        ).count()
        
        companies_with_active_distributors = db.query(Company).filter(
            Company.distributors.any(Distributor.is_active == True)
        ).count()
        
        companies_with_masters = db.query(Company).filter(
            Company.distributors.any(Distributor.partner_type == 'master')
        ).count()
        
        return {
            "total_companies": total_companies,
            "companies_with_distributors": companies_with_distributors,
            "companies_with_active_distributors": companies_with_active_distributors,
            "companies_with_masters": companies_with_masters,
            "companies_without_distributors": total_companies - companies_with_distributors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))