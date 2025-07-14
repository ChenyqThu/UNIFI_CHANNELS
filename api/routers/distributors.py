from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from config.database import get_db
from models.database import Distributor, Company
from models.schemas import DistributorResponse, PaginatedResponse, PaginationParams
from api.dependencies import rate_limit

router = APIRouter()

@router.get("/", response_model=PaginatedResponse)
async def get_distributors(
    pagination: PaginationParams = Depends(),
    region: Optional[str] = Query(None, description="Filter by region"),
    partner_type: Optional[str] = Query(None, description="Filter by partner type"),
    country_state: Optional[str] = Query(None, description="Filter by country/state"),
    active_only: bool = Query(True, description="Only return active distributors"),
    search: Optional[str] = Query(None, description="Search company names"),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit)
):
    """Get paginated list of distributors with filters"""
    try:
        query = db.query(Distributor).join(Company)
        
        # Apply filters
        if active_only:
            query = query.filter(Distributor.is_active == True)
        
        if region:
            query = query.filter(Distributor.region == region)
        
        if partner_type:
            query = query.filter(Distributor.partner_type == partner_type)
        
        if country_state:
            query = query.filter(Distributor.country_state == country_state)
        
        if search:
            query = query.filter(Company.name.ilike(f"%{search}%"))
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        distributors = query.order_by(
            Distributor.partner_type.desc(),  # Masters first
            Company.name
        ).offset(pagination.offset).limit(pagination.per_page).all()
        
        # Convert to response models
        items = [DistributorResponse.from_orm(dist) for dist in distributors]
        
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

@router.get("/{distributor_id}", response_model=DistributorResponse)
async def get_distributor(
    distributor_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit)
):
    """Get a specific distributor by ID"""
    distributor = db.query(Distributor).filter(Distributor.id == distributor_id).first()
    
    if not distributor:
        raise HTTPException(status_code=404, detail="Distributor not found")
    
    return DistributorResponse.from_orm(distributor)

@router.get("/region/{region}", response_model=List[DistributorResponse])
async def get_distributors_by_region(
    region: str,
    active_only: bool = Query(True, description="Only return active distributors"),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit)
):
    """Get all distributors in a specific region"""
    try:
        query = db.query(Distributor).filter(Distributor.region == region)
        
        if active_only:
            query = query.filter(Distributor.is_active == True)
        
        distributors = query.order_by(
            Distributor.partner_type.desc(),
            Distributor.company.has(Company.name)
        ).all()
        
        return [DistributorResponse.from_orm(dist) for dist in distributors]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/company/{company_name}", response_model=List[DistributorResponse])
async def get_distributors_by_company(
    company_name: str,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit)
):
    """Get all distributors for a specific company"""
    try:
        distributors = db.query(Distributor).join(Company).filter(
            Company.name.ilike(f"%{company_name}%")
        ).all()
        
        if not distributors:
            raise HTTPException(status_code=404, detail="No distributors found for this company")
        
        return [DistributorResponse.from_orm(dist) for dist in distributors]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/regions")
async def get_region_stats(
    active_only: bool = Query(True, description="Only count active distributors"),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit)
):
    """Get distributor statistics by region"""
    try:
        query = db.query(
            Distributor.region,
            db.func.count(Distributor.id).label('total'),
            db.func.sum(db.case([(Distributor.partner_type == 'master', 1)], else_=0)).label('masters'),
            db.func.sum(db.case([(Distributor.partner_type == 'simple', 1)], else_=0)).label('resellers')
        ).filter(Distributor.region.isnot(None))
        
        if active_only:
            query = query.filter(Distributor.is_active == True)
        
        results = query.group_by(Distributor.region).all()
        
        return {
            "region_stats": [
                {
                    "region": region,
                    "total": total,
                    "masters": masters,
                    "resellers": resellers
                }
                for region, total, masters, resellers in results
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/partner-types")
async def get_partner_type_stats(
    active_only: bool = Query(True, description="Only count active distributors"),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit)
):
    """Get distributor statistics by partner type"""
    try:
        query = db.query(
            Distributor.partner_type,
            db.func.count(Distributor.id).label('count')
        )
        
        if active_only:
            query = query.filter(Distributor.is_active == True)
        
        results = query.group_by(Distributor.partner_type).all()
        
        return {
            "partner_type_stats": [
                {
                    "partner_type": partner_type,
                    "count": count
                }
                for partner_type, count in results
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))