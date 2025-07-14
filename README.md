# Unifi Distributor Tracking System

A comprehensive competitive intelligence platform for monitoring and analyzing Unifi's global distributor network through automated data collection, change detection, and collaborative analysis.

## 🎯 Overview

The Unifi Distributor Tracking System provides real-time intelligence on Unifi's worldwide partner ecosystem through:

- **Automated Data Collection**: JSON API scraping from official Unifi sources
- **Global Coverage**: 8 regions spanning 131+ countries and states
- **Change Detection**: Automatic monitoring of distributor network evolution
- **Notion Integration**: Collaborative workspace for team-based analysis
- **REST API**: Programmatic access for external integrations
- **Production Ready**: Docker deployment with comprehensive monitoring

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT INTERFACES                          │
├─────────────────────────────────────────────────────────────────┤
│  CLI Commands  │  REST API  │  Notion Workspace  │  Scheduler   │
└─────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│         FastAPI Router         │         CLI Handler            │
│       (api/main.py)           │       (cli/__init__.py)        │
└─────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  Data Collection  │  Data Processing  │  Integration  │  Ops     │
│  - JSON Scraper   │  - Processor      │  - Notion     │  - Health│
│  - Region Mapper  │  - Validator      │  - Sync       │  - Tasks │
└─────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│    PostgreSQL/SQLite    │    Redis Cache    │    File System    │
│    - Distributors       │    - Session Data │    - Logs         │
│    - Change History     │    - Rate Limits  │    - Config       │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 13+ (or SQLite for development)
- Docker & Docker Compose
- Redis (optional, for caching)

### Docker Deployment (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd unifi_channels

# Copy environment template
cp .env.example .env

# Edit configuration
nano .env

# Start all services
docker-compose up -d

# Initialize system
docker-compose exec api python -m cli init

# Verify deployment
docker-compose exec api python -m cli health
```

### Manual Installation

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Initialize database
python -m cli init

# Run first data collection
python -m cli scrape --verbose
```

## 📖 Usage

### Command Line Interface

```bash
# System Operations
python -m cli init                              # Initialize database
python -m cli health                            # Check system health
python -m cli stats                             # View statistics

# Data Collection
python -m cli scrape --verbose                  # Collect distributor data
python -m cli scrape --sync-notion              # Collect and sync to Notion
python -m cli list --region usa --limit 20     # List distributors

# Change Tracking
python -m cli changes --days 7                  # View recent changes
python -m cli info 123                          # Get distributor details

# Notion Integration
python -m cli notion test                       # Test Notion connection
python -m cli notion sync                       # Sync to Notion
python -m cli notion stats                      # View sync statistics
```

### REST API

```bash
# Start API server
python -m api.main                              # Development
uvicorn api.main:app --host 0.0.0.0 --port 8000 # Production

# API Documentation
# http://localhost:8000/docs (Swagger UI)
# http://localhost:8000/redoc (ReDoc)
```

### Automated Scheduling

```bash
# Start scheduler service
python -m scheduler

# Docker service automatically runs:
# - Data collection every 24 hours
# - Health monitoring every 30 minutes
# - Daily reports at 9:00 AM
```

## 🗺️ Global Coverage

### Supported Regions

- **af** - Africa (10 countries)
- **as** - Asia (24 countries)
- **aus-nzl** - Australia & New Zealand (2 countries)
- **can** - Canada (4 provinces)
- **eur** - Europe (42 countries)
- **lat-a** - Latin America (20+ countries)
- **mid-e** - Middle East (11 countries)
- **usa** - United States (14 states)

### Partner Types

- **Master Distributors** - Primary regional partners
- **Authorized Resellers** - Local distributors

## 🔗 API Endpoints

### Core Data Access

```bash
# Get distributors with filters
GET /api/distributors?region=usa&partner_type=master&page=1

# Get specific distributor
GET /api/distributors/{id}

# Get change history
GET /api/changes?days=7&limit=50

# Get analytics summary
GET /api/analytics/summary
```

### Operations

```bash
# Trigger manual sync
POST /api/sync

# Health check
GET /api/health

# Notion sync
POST /api/notion/sync
```

## 📊 Data Model

### Database Schema

```sql
-- Companies (normalized company data)
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    website_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Distributors (core business data)
CREATE TABLE distributors (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    unifi_id VARCHAR(50) UNIQUE NOT NULL,    -- Official Unifi ID
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(50),
    contact_email VARCHAR(255),
    contact_url TEXT,
    region_code VARCHAR(10),
    country_code VARCHAR(10),
    partner_type VARCHAR(20),                -- 'master' or 'simple'
    status VARCHAR(20) DEFAULT 'active',
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Change History (complete audit trail)
CREATE TABLE change_history (
    id SERIAL PRIMARY KEY,
    distributor_id INTEGER REFERENCES distributors(id),
    change_type VARCHAR(20),                 -- 'created', 'updated', 'deleted'
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎯 Notion Integration

### Database Fields

The system syncs with Notion databases containing:

#### Core Information
- **Company Name** (Title)
- **Partner Type** (Select: Master Distributor, Authorized Reseller)
- **Website** (URL)
- **Address** (Rich Text)
- **Phone** (Phone Number)
- **Contact Email** (Email)

#### Geographic Data
- **Region** (Select: 8 global regions with color coding)
- **Country/State** (Select: Dynamic options)
- **Coordinates** (Rich Text: "latitude, longitude")

#### Status Tracking
- **Status** (Select: Active/Inactive)
- **Unifi ID** (Rich Text: Official identifier)
- **Last Verified** (Date)
- **Order Weight** (Number: Display priority)

#### Enhanced Fields
- **Analysis Status** (Select: Not Analyzed, In Progress, Completed)
- **Priority** (Select: High, Medium, Low)
- **Notes** (Rich Text: Analysis notes)
- **Data Source** (Select: Auto Scrape, Manual Input, API Sync)

### Sync Commands

```bash
# Test connection
python -m cli notion test

# View database info
python -m cli notion info

# Sync all data
python -m cli notion sync

# View sync statistics
python -m cli notion stats
```

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/unifi_distributors

# Notion Integration
NOTION_TOKEN=secret_your_notion_integration_token
NOTION_DATABASE_ID=your_notion_database_id

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Scraping
SCRAPING_INTERVAL_HOURS=24
USER_AGENT=Mozilla/5.0 (compatible; UnifiDistributorTracker/1.0)

# Performance
NOTION_BATCH_SIZE=25
NOTION_SYNC_ENABLED=true

# Monitoring (Optional)
REDIS_URL=redis://localhost:6379
SENTRY_DSN=https://your_sentry_dsn
```

## 🐳 Docker Services

### Service Architecture

```yaml
services:
  postgres:     # Primary database
  redis:        # Caching and session storage
  api:          # REST API server
  scheduler:    # Automated task execution
  cli:          # One-off administrative tasks
```

### Container Commands

```bash
# Production deployment
docker-compose up -d

# View logs
docker-compose logs -f api

# Execute commands
docker-compose exec api python -m cli stats

# Scale API service
docker-compose up -d --scale api=3

# Health check
docker-compose exec api python -m cli health
```

## 📊 Analytics & Monitoring

### System Metrics

- **Data Quality**: Unifi ID coverage, duplication rates
- **Geographic Distribution**: Regional distributor counts
- **Change Detection**: New, modified, deleted distributors
- **Sync Performance**: Notion integration status
- **System Health**: Database, API, service availability

### Health Monitoring

```bash
# System health check
curl http://localhost:8000/api/health

# Analytics summary
curl http://localhost:8000/api/analytics/summary

# Change trends
curl http://localhost:8000/api/changes?days=30
```

## 🛠️ Development

### Project Structure

```
unifi_channels/
├── api/                    # REST API layer
├── cli/                    # Command-line interface
├── models/                 # Data models and schemas
├── services/               # Business logic services
├── config/                 # Configuration management
├── utils/                  # Shared utilities
├── docker-compose.yml      # Container orchestration
├── Dockerfile              # Multi-stage container build
├── requirements.txt        # Python dependencies
└── .env.example           # Environment template
```

### Code Quality

```bash
# Format code
black .

# Lint code
flake8 .

# Type checking
mypy .
```

## 🔍 Key Features

### Missing Distributor Detection
Automatically identifies distributors that disappear from scraping results and:
- Marks them as inactive in the database
- Updates their status in Notion
- Records the change in audit history
- Maintains data integrity

### Unifi ID System
Uses official Unifi IDs as primary business identifiers:
- Ensures accurate distributor matching
- Prevents data duplication
- Supports reliable Notion synchronization
- Maintains referential integrity

### Change Tracking
Comprehensive audit trail capturing:
- New distributor additions
- Field-level modifications
- Status changes (active/inactive)
- Complete before/after snapshots

## 🚨 Troubleshooting

### Common Issues

```bash
# Database connection
python -m cli health                    # Check system status
echo $DATABASE_URL                      # Verify configuration

# Notion sync failures
python -m cli notion test               # Test connection
python -m cli notion info               # Check database schema

# Data collection issues
python -m cli scrape --verbose          # Debug scraping
curl -I https://www.ui.com/distributors/ # Test endpoint
```

### Log Analysis

```bash
# View application logs
docker-compose logs -f api

# Search for errors
docker-compose logs api | grep ERROR

# Monitor real-time
tail -f logs/unifi_tracker.log
```

## 📈 Performance Optimization

### Database Performance
- Indexed queries on Unifi IDs and region codes
- Connection pooling for concurrent access
- Prepared statements for repeated operations

### Notion Sync Optimization
- Batch processing (25 records per batch)
- Change-based updates (only modified records)
- Rate limiting compliance
- Error recovery and retry mechanisms

### Caching Strategy
- Redis for session data and rate limiting
- Query result caching for analytics
- Geographic data caching

## 🔒 Security & Compliance

### Data Security
- Environment variable configuration
- Non-root container execution
- Network isolation between services
- Audit logging for all operations

### Compliance
- Respectful scraping practices
- Rate limiting and delays
- User-Agent identification
- robots.txt compliance

## 📚 Documentation

- **CLAUDE.md** - Development guidance and commands
- **PRD.md** - Product requirements and specifications
- **ARCHITECT.md** - Technical architecture documentation
- **README.md** - Project overview and usage guide

## 🔄 Future Enhancements

### Planned Features
- Real-time notifications and webhooks
- Advanced analytics and reporting
- Machine learning for trend analysis
- Multi-vendor support expansion

### Technical Roadmap
- Kubernetes orchestration
- Event sourcing architecture
- Stream processing pipeline
- Serverless function integration

---

For detailed technical documentation, see [ARCHITECT.md](ARCHITECT.md).  
For product requirements and specifications, see [PRD.md](PRD.md).  
For development guidance, see [CLAUDE.md](CLAUDE.md).