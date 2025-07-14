from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta

from config.database import get_db
from models.database import Distributor, Company, ChangeHistory
from models.schemas import AnalyticsSummary
from api.dependencies import rate_limit

router = APIRouter()

@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit)
):
    """Get comprehensive analytics summary"""
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
            func.count(Distributor.id).label('count')
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

@router.get("/geographic-distribution")
async def get_geographic_distribution(
    active_only: bool = Query(True, description="Only include active distributors"),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit)
):
    """Get detailed geographic distribution of distributors"""
    try:
        query = db.query(
            Distributor.region,
            Distributor.country_state,
            func.count(Distributor.id).label('total'),
            func.sum(func.case([(Distributor.partner_type == 'master', 1)], else_=0)).label('masters'),
            func.sum(func.case([(Distributor.partner_type == 'simple', 1)], else_=0)).label('resellers')
        )
        
        if active_only:
            query = query.filter(Distributor.is_active == True)
        
        results = query.group_by(
            Distributor.region,
            Distributor.country_state
        ).all()
        
        # Organize by region
        geographic_data = {}
        for region, country_state, total, masters, resellers in results:
            if region not in geographic_data:
                geographic_data[region] = {
                    "total": 0,
                    "masters": 0,
                    "resellers": 0,
                    "locations": []
                }
            
            geographic_data[region]["total"] += total
            geographic_data[region]["masters"] += masters
            geographic_data[region]["resellers"] += resellers
            
            if country_state:
                geographic_data[region]["locations"].append({
                    "country_state": country_state,
                    "total": total,
                    "masters": masters,
                    "resellers": resellers
                })
        
        return {
            "geographic_distribution": geographic_data,
            "total_regions": len(geographic_data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/partner-analysis")
async def get_partner_analysis(
    active_only: bool = Query(True, description="Only include active distributors"),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit)
):
    """Get detailed partner type analysis"""
    try:
        query = db.query(
            Distributor.partner_type,
            Distributor.region,
            func.count(Distributor.id).label('count')
        )
        
        if active_only:
            query = query.filter(Distributor.is_active == True)
        
        results = query.group_by(
            Distributor.partner_type,
            Distributor.region
        ).all()
        
        # Organize data
        partner_analysis = {}
        for partner_type, region, count in results:
            if partner_type not in partner_analysis:
                partner_analysis[partner_type] = {
                    "total": 0,
                    "regions": {}
                }
            
            partner_analysis[partner_type]["total"] += count
            partner_analysis[partner_type]["regions"][region] = count
        
        return {
            "partner_analysis": partner_analysis,
            "summary": {
                "total_masters": partner_analysis.get("master", {}).get("total", 0),
                "total_resellers": partner_analysis.get("simple", {}).get("total", 0)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/change-trends")
async def get_change_trends(
    days: int = Query(30, description="Number of days to analyze"),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit)
):
    """Get change trends over time"""
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Get changes by type and date
        changes = db.query(
            func.date(ChangeHistory.detected_at).label('date'),
            ChangeHistory.change_type,
            func.count(ChangeHistory.id).label('count')
        ).filter(
            ChangeHistory.detected_at >= cutoff_date
        ).group_by(
            func.date(ChangeHistory.detected_at),
            ChangeHistory.change_type
        ).all()
        
        # Organize by date
        trends = {}
        for date, change_type, count in changes:
            date_str = date.strftime('%Y-%m-%d')
            if date_str not in trends:
                trends[date_str] = {
                    "created": 0,
                    "updated": 0,
                    "deleted": 0
                }
            trends[date_str][change_type] = count
        
        # Calculate summary stats
        total_changes = sum(
            sum(day_data.values()) for day_data in trends.values()
        )
        
        return {
            "trends": trends,
            "summary": {
                "total_changes": total_changes,
                "days_analyzed": days,
                "average_changes_per_day": total_changes / days if days > 0 else 0
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/top-companies")
async def get_top_companies(
    limit: int = Query(10, description="Number of top companies to return"),
    active_only: bool = Query(True, description="Only include active distributors"),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit)
):
    """Get top companies by number of distributors"""
    try:
        query = db.query(
            Company.name,
            Company.website_url,
            func.count(Distributor.id).label('distributor_count'),
            func.sum(func.case([(Distributor.partner_type == 'master', 1)], else_=0)).label('masters'),
            func.sum(func.case([(Distributor.partner_type == 'simple', 1)], else_=0)).label('resellers')
        ).join(Distributor)
        
        if active_only:
            query = query.filter(Distributor.is_active == True)
        
        results = query.group_by(
            Company.id,
            Company.name,
            Company.website_url
        ).order_by(
            func.count(Distributor.id).desc()
        ).limit(limit).all()
        
        return {
            "top_companies": [
                {
                    "company_name": name,
                    "website_url": website_url,
                    "total_distributors": distributor_count,
                    "masters": masters,
                    "resellers": resellers
                }
                for name, website_url, distributor_count, masters, resellers in results
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/coverage-analysis")
async def get_coverage_analysis(
    active_only: bool = Query(True, description="Only include active distributors"),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit)
):
    """Get coverage analysis by region and partner type"""
    try:
        # Get all distributors with coordinates
        query = db.query(
            Distributor.region,
            Distributor.country_state,
            Distributor.partner_type,
            Distributor.latitude,
            Distributor.longitude
        ).filter(
            Distributor.latitude.isnot(None),
            Distributor.longitude.isnot(None)
        )
        
        if active_only:
            query = query.filter(Distributor.is_active == True)
        
        distributors = query.all()
        
        # Analyze coverage
        coverage_analysis = {}
        for region, country_state, partner_type, lat, lng in distributors:
            if region not in coverage_analysis:
                coverage_analysis[region] = {
                    "total_locations": 0,
                    "master_locations": 0,
                    "reseller_locations": 0,
                    "countries_states": set(),
                    "coordinates": []
                }
            
            coverage_analysis[region]["total_locations"] += 1
            coverage_analysis[region]["countries_states"].add(country_state)
            coverage_analysis[region]["coordinates"].append({
                "lat": float(lat),
                "lng": float(lng),
                "partner_type": partner_type
            })
            
            if partner_type == "master":
                coverage_analysis[region]["master_locations"] += 1
            else:
                coverage_analysis[region]["reseller_locations"] += 1
        
        # Convert sets to lists for JSON serialization
        for region_data in coverage_analysis.values():
            region_data["countries_states"] = list(region_data["countries_states"])
        
        return {
            "coverage_analysis": coverage_analysis,
            "total_locations_with_coordinates": len(distributors)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/market-penetration")
async def get_market_penetration(
    active_only: bool = Query(True, description="Only include active distributors"),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit)
):
    """Get market penetration analysis"""
    try:
        # Get distributor density by region
        query = db.query(
            Distributor.region,
            func.count(Distributor.id).label('count'),
            func.count(func.distinct(Distributor.country_state)).label('unique_locations')
        )
        
        if active_only:
            query = query.filter(Distributor.is_active == True)
        
        results = query.group_by(Distributor.region).all()
        
        penetration_data = []
        for region, count, unique_locations in results:
            if region:
                penetration_data.append({
                    "region": region,
                    "total_distributors": count,
                    "unique_locations": unique_locations,
                    "density_ratio": count / unique_locations if unique_locations > 0 else 0
                })
        
        # Sort by density ratio
        penetration_data.sort(key=lambda x: x["density_ratio"], reverse=True)
        
        return {
            "market_penetration": penetration_data,
            "insights": {
                "highest_density_region": penetration_data[0]["region"] if penetration_data else None,
                "lowest_density_region": penetration_data[-1]["region"] if penetration_data else None,
                "total_regions": len(penetration_data)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))