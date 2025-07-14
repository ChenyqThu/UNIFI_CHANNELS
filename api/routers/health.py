from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import requests

from config.database import get_db
from config.settings import settings
from models.schemas import HealthCheck
from services.notion_integration import NotionIntegration
from services.scraper import UnifiDistributorScraper
from api.dependencies import rate_limit

router = APIRouter()

@router.get("/", response_model=HealthCheck)
async def health_check(
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit)
):
    """System health check"""
    checks = {
        "database": False,
        "notion": False,
        "scraper": False,
        "external_api": False
    }
    
    # Database check
    try:
        db.execute("SELECT 1")
        checks["database"] = True
    except Exception as e:
        print(f"Database check failed: {e}")
    
    # Notion check
    try:
        if settings.notion_token:
            notion = NotionIntegration()
            checks["notion"] = notion.test_connection()
        else:
            checks["notion"] = None  # Not configured
    except Exception as e:
        print(f"Notion check failed: {e}")
    
    # Scraper check (basic initialization)
    try:
        scraper = UnifiDistributorScraper()
        checks["scraper"] = True
    except Exception as e:
        print(f"Scraper check failed: {e}")
    
    # External API check (test Unifi website accessibility)
    try:
        response = requests.get(settings.unifi_distributors_url, timeout=10)
        checks["external_api"] = response.status_code == 200
    except Exception as e:
        print(f"External API check failed: {e}")
    
    # Determine overall status
    required_checks = ["database", "scraper", "external_api"]
    status = "healthy" if all(checks[check] for check in required_checks if checks[check] is not False) else "unhealthy"
    
    return HealthCheck(
        status=status,
        checks=checks
    )

@router.get("/detailed")
async def detailed_health_check(
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit)
):
    """Detailed health check with more information"""
    health_info = {
        "timestamp": datetime.utcnow().isoformat(),
        "status": "unknown",
        "checks": {},
        "system_info": {
            "version": "1.0.0",
            "environment": "production" if settings.api_host != "0.0.0.0" else "development"
        }
    }
    
    # Database check with details
    try:
        db.execute("SELECT 1")
        # Get some database stats
        from models.database import Distributor, Company
        total_distributors = db.query(Distributor).count()
        total_companies = db.query(Company).count()
        
        health_info["checks"]["database"] = {
            "status": "healthy",
            "details": {
                "total_distributors": total_distributors,
                "total_companies": total_companies
            }
        }
    except Exception as e:
        health_info["checks"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
    
    # Notion check with details
    try:
        if settings.notion_token and settings.notion_database_id:
            notion = NotionIntegration()
            connection_ok = notion.test_connection()
            
            if connection_ok:
                db_info = notion.get_database_info()
                health_info["checks"]["notion"] = {
                    "status": "healthy",
                    "details": db_info
                }
            else:
                health_info["checks"]["notion"] = {
                    "status": "unhealthy",
                    "error": "Connection test failed"
                }
        else:
            health_info["checks"]["notion"] = {
                "status": "not_configured",
                "details": "Notion integration not configured"
            }
    except Exception as e:
        health_info["checks"]["notion"] = {
            "status": "unhealthy",
            "error": str(e)
        }
    
    # Scraper check with details
    try:
        scraper = UnifiDistributorScraper()
        # Test basic connectivity to Unifi site
        import requests
        response = requests.get(settings.unifi_distributors_url, timeout=10)
        
        health_info["checks"]["scraper"] = {
            "status": "healthy",
            "details": {
                "target_url": settings.unifi_distributors_url,
                "response_status": response.status_code,
                "response_time": response.elapsed.total_seconds()
            }
        }
    except Exception as e:
        health_info["checks"]["scraper"] = {
            "status": "unhealthy",
            "error": str(e)
        }
    
    # System resources check
    try:
        import psutil
        health_info["checks"]["system"] = {
            "status": "healthy",
            "details": {
                "cpu_percent": psutil.cpu_percent(),
                "memory_percent": psutil.virtual_memory().percent,
                "disk_percent": psutil.disk_usage('/').percent
            }
        }
    except ImportError:
        health_info["checks"]["system"] = {
            "status": "not_available",
            "details": "psutil not installed"
        }
    except Exception as e:
        health_info["checks"]["system"] = {
            "status": "unhealthy",
            "error": str(e)
        }
    
    # Determine overall status
    unhealthy_checks = [
        name for name, check in health_info["checks"].items()
        if check["status"] == "unhealthy"
    ]
    
    if unhealthy_checks:
        health_info["status"] = "unhealthy"
        health_info["unhealthy_checks"] = unhealthy_checks
    else:
        health_info["status"] = "healthy"
    
    return health_info

@router.get("/database")
async def database_health(
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit)
):
    """Database-specific health check"""
    try:
        # Test basic connectivity
        db.execute("SELECT 1")
        
        # Get database statistics
        from models.database import Distributor, Company, ChangeHistory
        
        stats = {
            "connection": "healthy",
            "tables": {
                "companies": db.query(Company).count(),
                "distributors": db.query(Distributor).count(),
                "change_history": db.query(ChangeHistory).count()
            },
            "active_distributors": db.query(Distributor).filter(Distributor.is_active == True).count()
        }
        
        # Test query performance
        import time
        start_time = time.time()
        db.query(Distributor).join(Company).limit(10).all()
        query_time = time.time() - start_time
        
        stats["performance"] = {
            "sample_query_time": query_time,
            "status": "good" if query_time < 1.0 else "slow"
        }
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database health check failed: {str(e)}")

@router.get("/external-services")
async def external_services_health(_: None = Depends(rate_limit)):
    """External services health check"""
    services = {}
    
    # Check Unifi website
    try:
        response = requests.get(settings.unifi_distributors_url, timeout=10)
        services["unifi_website"] = {
            "status": "healthy" if response.status_code == 200 else "unhealthy",
            "response_code": response.status_code,
            "response_time": response.elapsed.total_seconds()
        }
    except Exception as e:
        services["unifi_website"] = {
            "status": "unhealthy",
            "error": str(e)
        }
    
    # Check Notion API
    try:
        if settings.notion_token:
            notion = NotionIntegration()
            connection_ok = notion.test_connection()
            services["notion_api"] = {
                "status": "healthy" if connection_ok else "unhealthy",
                "configured": True
            }
        else:
            services["notion_api"] = {
                "status": "not_configured",
                "configured": False
            }
    except Exception as e:
        services["notion_api"] = {
            "status": "unhealthy",
            "error": str(e)
        }
    
    return {
        "external_services": services,
        "overall_status": "healthy" if all(
            service["status"] == "healthy" 
            for service in services.values() 
            if service["status"] != "not_configured"
        ) else "degraded"
    }