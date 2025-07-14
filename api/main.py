from fastapi import FastAPI, Depends, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn
from datetime import datetime, timedelta

from config.database import get_db, init_db
from config.settings import settings
from config.logging import setup_logging
from models.schemas import (
    DistributorResponse, CompanyResponse, ChangeHistoryResponse,
    SyncResponse, AnalyticsSummary, HealthCheck, PaginatedResponse, PaginationParams
)
from models.database import Company, Distributor, ChangeHistory
from services.scraper import UnifiDistributorScraper
from services.data_processor import DataProcessor
from services.notion_integration import NotionIntegration
from api.dependencies import get_current_user, rate_limit
from api.routers import distributors, companies, analytics, health

# Initialize logging
setup_logging()

# Create FastAPI app
app = FastAPI(
    title="Unifi Distributor Tracking System",
    description="A system to track and analyze Unifi distributor and reseller information",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(distributors.router, prefix="/api/distributors", tags=["distributors"])
app.include_router(companies.router, prefix="/api/companies", tags=["companies"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(health.router, prefix="/api/health", tags=["health"])

@app.on_event("startup")
async def startup_event():
    """Initialize database and perform startup tasks"""
    init_db()
    print("Application started successfully")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Unifi Distributor Tracking System API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_check": "/api/health"
    }

@app.post("/api/sync", response_model=SyncResponse)
async def sync_distributors(
    background_tasks: BackgroundTasks,
    sync_notion: bool = Query(True, description="Whether to sync to Notion"),
    detect_missing: bool = Query(True, description="Whether to detect missing distributors"),
    db: Session = Depends(get_db)
):
    """
    Manually trigger distributor data synchronization
    
    This endpoint will:
    1. Scrape distributor data from Unifi website
    2. Process and store in local database
    3. Optionally sync to Notion
    4. Optionally detect missing distributors
    """
    try:
        # Start scraping
        scraper = UnifiDistributorScraper()
        scraping_result = scraper.scrape_distributors()
        
        if not scraping_result.success:
            raise HTTPException(
                status_code=500,
                detail=f"Scraping failed: {scraping_result.error_message}"
            )
        
        # Process scraped data
        processor = DataProcessor(db)
        processing_results = processor.process_scraped_data(scraping_result.distributors)
        
        # Detect missing distributors if requested
        missing_count = 0
        if detect_missing:
            missing_distributors = processor.detect_missing_distributors(scraping_result.distributors)
            missing_count = processor.mark_distributors_inactive(missing_distributors)
        
        # Sync to Notion if requested and configured
        notion_results = None
        if sync_notion and settings.notion_sync_enabled:
            try:
                notion = NotionIntegration()
                # Get all active distributors
                active_distributors = db.query(Distributor).filter(
                    Distributor.is_active == True
                ).all()
                
                # Convert to response models
                distributor_responses = [
                    DistributorResponse.from_orm(dist) for dist in active_distributors
                ]
                
                # Sync in background
                background_tasks.add_task(
                    notion.sync_distributors_to_notion,
                    distributor_responses
                )
                
                notion_results = {"status": "started_background_sync"}
                
            except Exception as e:
                notion_results = {"error": str(e)}
        
        return SyncResponse(
            status="success",
            scraped_count=scraping_result.total_found,
            processing_results=processing_results,
            notion_results=notion_results,
            message=f"Successfully processed {scraping_result.total_found} distributors. "
                   f"Created: {processing_results['created']}, "
                   f"Updated: {processing_results['updated']}, "
                   f"Missing: {missing_count}"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Sync failed: {str(e)}"
        )

@app.get("/api/distributors", response_model=PaginatedResponse)
async def get_distributors(
    pagination: PaginationParams = Depends(),
    region: Optional[str] = Query(None, description="Filter by region"),
    partner_type: Optional[str] = Query(None, description="Filter by partner type"),
    active_only: bool = Query(True, description="Only return active distributors"),
    db: Session = Depends(get_db)
):
    """Get paginated list of distributors with optional filters"""
    try:
        query = db.query(Distributor)
        
        # Apply filters
        if active_only:
            query = query.filter(Distributor.is_active == True)
        
        if region:
            query = query.filter(Distributor.region == region)
        
        if partner_type:
            query = query.filter(Distributor.partner_type == partner_type)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        distributors = query.offset(pagination.offset).limit(pagination.per_page).all()
        
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

@app.get("/api/distributors/{distributor_id}", response_model=DistributorResponse)
async def get_distributor(
    distributor_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific distributor by ID"""
    distributor = db.query(Distributor).filter(Distributor.id == distributor_id).first()
    
    if not distributor:
        raise HTTPException(status_code=404, detail="Distributor not found")
    
    return DistributorResponse.from_orm(distributor)

@app.get("/api/changes", response_model=List[ChangeHistoryResponse])
async def get_changes(
    limit: int = Query(100, description="Number of changes to return"),
    days: int = Query(30, description="Number of days to look back"),
    change_type: Optional[str] = Query(None, description="Filter by change type"),
    db: Session = Depends(get_db)
):
    """Get recent change history"""
    try:
        query = db.query(ChangeHistory)
        
        # Filter by date range
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        query = query.filter(ChangeHistory.detected_at >= cutoff_date)
        
        # Filter by change type if specified
        if change_type:
            query = query.filter(ChangeHistory.change_type == change_type)
        
        # Order by most recent first
        changes = query.order_by(
            ChangeHistory.detected_at.desc()
        ).limit(limit).all()
        
        return [ChangeHistoryResponse.from_orm(change) for change in changes]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(db: Session = Depends(get_db)):
    """Get analytics summary"""
    try:
        total_distributors = db.query(Distributor).count()
        active_distributors = db.query(Distributor).filter(Distributor.is_active == True).count()
        master_distributors = db.query(Distributor).filter(
            Distributor.partner_type == "master",
            Distributor.is_active == True
        ).count()
        
        # Get region distribution
        region_stats = db.query(
            Distributor.region,
            db.func.count(Distributor.id).label('count')
        ).filter(
            Distributor.is_active == True,
            Distributor.region.isnot(None)
        ).group_by(Distributor.region).all()
        
        region_distribution = {region: count for region, count in region_stats}
        
        return AnalyticsSummary(
            total_distributors=total_distributors,
            active_distributors=active_distributors,
            master_distributors=master_distributors,
            reseller_distributors=active_distributors - master_distributors,
            region_distribution=region_distribution,
            last_updated=datetime.utcnow()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health", response_model=HealthCheck)
async def health_check(db: Session = Depends(get_db)):
    """System health check"""
    checks = {
        "database": False,
        "notion": False,
        "scraper": False
    }
    
    # Database check
    try:
        db.execute("SELECT 1")
        checks["database"] = True
    except Exception:
        pass
    
    # Notion check
    try:
        if settings.notion_token:
            notion = NotionIntegration()
            checks["notion"] = notion.test_connection()
    except Exception:
        pass
    
    # Scraper check
    try:
        scraper = UnifiDistributorScraper()
        checks["scraper"] = True
    except Exception:
        pass
    
    status = "healthy" if all(checks.values()) else "unhealthy"
    
    return HealthCheck(
        status=status,
        checks=checks
    )

@app.post("/api/notion/sync")
async def sync_to_notion(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Manually sync data to Notion"""
    if not settings.notion_sync_enabled:
        raise HTTPException(
            status_code=400,
            detail="Notion sync is not enabled"
        )
    
    try:
        notion = NotionIntegration()
        
        # Get all active distributors
        active_distributors = db.query(Distributor).filter(
            Distributor.is_active == True
        ).all()
        
        # Convert to response models
        distributor_responses = [
            DistributorResponse.from_orm(dist) for dist in active_distributors
        ]
        
        # Start background sync
        background_tasks.add_task(
            notion.sync_distributors_to_notion,
            distributor_responses
        )
        
        return {
            "status": "started",
            "message": f"Started background sync of {len(distributor_responses)} distributors to Notion"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Notion sync failed: {str(e)}"
        )

@app.get("/api/notion/info")
async def get_notion_info():
    """Get Notion database information"""
    if not settings.notion_sync_enabled:
        raise HTTPException(
            status_code=400,
            detail="Notion sync is not enabled"
        )
    
    try:
        notion = NotionIntegration()
        return notion.get_database_info()
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get Notion info: {str(e)}"
        )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "timestamp": datetime.utcnow().isoformat()
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True,
        log_level=settings.log_level.lower()
    )