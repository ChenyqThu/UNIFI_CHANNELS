from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Database Configuration
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./unifi_distributors.db")
    
    # Redis Configuration
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Notion Integration
    notion_token: Optional[str] = os.getenv("NOTION_TOKEN")
    notion_database_id: Optional[str] = os.getenv("NOTION_DATABASE_ID")
    
    # Firecrawl API (optional)
    firecrawl_api_key: Optional[str] = os.getenv("FIRECRAWL_API_KEY")
    
    # Sentry Configuration (optional)
    sentry_dsn: Optional[str] = os.getenv("SENTRY_DSN")
    
    # Logging Configuration
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Scraping Configuration
    scraping_interval_hours: int = int(os.getenv("SCRAPING_INTERVAL_HOURS", "24"))
    user_agent: str = os.getenv("USER_AGENT", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
    
    # API Configuration
    api_host: str = os.getenv("API_HOST", "0.0.0.0")
    api_port: int = int(os.getenv("API_PORT", "8000"))
    
    # Security
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
    
    # Unifi Scraping Configuration
    unifi_distributors_url: str = "https://www.ui.com/distributors/"
    request_timeout: int = 30
    max_retries: int = 3
    retry_delay: int = 5
    
    # Notion Sync Configuration
    notion_sync_enabled: bool = os.getenv("NOTION_SYNC_ENABLED", "true").lower() == "true"
    notion_batch_size: int = int(os.getenv("NOTION_BATCH_SIZE", "10"))
    
    # Rate Limiting
    requests_per_minute: int = int(os.getenv("REQUESTS_PER_MINUTE", "60"))
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

# Create global settings instance
settings = Settings()