from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import time
from collections import defaultdict
from config.settings import settings

# Simple rate limiting storage (in production, use Redis)
rate_limit_storage = defaultdict(list)

security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get current user from token (simplified for demo)
    In production, implement proper JWT token validation
    """
    if not credentials:
        return None
    
    # Simple token validation (implement proper JWT validation in production)
    if credentials.credentials == settings.secret_key:
        return {"user_id": "admin", "username": "admin"}
    
    return None

async def rate_limit(request: Request):
    """
    Simple rate limiting middleware
    In production, use Redis or dedicated rate limiting service
    """
    if not settings.requests_per_minute:
        return
    
    client_ip = request.client.host
    current_time = time.time()
    
    # Clean old entries
    cutoff_time = current_time - 60  # 1 minute window
    rate_limit_storage[client_ip] = [
        timestamp for timestamp in rate_limit_storage[client_ip]
        if timestamp > cutoff_time
    ]
    
    # Check rate limit
    if len(rate_limit_storage[client_ip]) >= settings.requests_per_minute:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please try again later."
        )
    
    # Record this request
    rate_limit_storage[client_ip].append(current_time)

async def admin_required(current_user: dict = Depends(get_current_user)):
    """Require admin privileges"""
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )
    
    return current_user

async def optional_auth(current_user: dict = Depends(get_current_user)):
    """Optional authentication"""
    return current_user