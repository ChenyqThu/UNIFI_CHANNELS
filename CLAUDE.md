# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

**Unifi Distributor Tracking System** - An automated competitive intelligence platform that monitors Unifi's global distributor network through continuous data collection, change detection, and collaborative analysis via Notion integration.

## System Architecture

### Core Components

**Data Collection**
- **JSON API Scraper** (`services/distributor_scraper.py`) - Primary data source using direct API calls with performance optimization
- **Region Mapping Manager** (`services/region_mapping_manager.py`) - Manages 8 global regions with 131+ country/state mappings

**Data Processing**
- **Enhanced Data Processor** (`services/enhanced_data_processor.py`) - Validates, deduplicates, and processes distributor data with automatic missing distributor detection
- **Change Detection** - Automatic tracking of distributor changes and lifecycle management

**Integration & APIs**
- **Notion Sync** (`services/notion_sync.py`) - Bidirectional synchronization with complete field support
- **FastAPI REST API** (`api/main.py`) - RESTful API for external integrations
- **Scheduler** (`scheduler.py`) - Automated task execution and monitoring

### Database Design

The system uses **Unifi ID as the primary business identifier**:

- **Companies** - Unique company information (name, website)
- **Distributors** - Complete distributor data with Unifi IDs, coordinates, contact info, and enhanced JSON API fields
- **Change History** - Full audit trail of distributor lifecycle changes
- **Notion Integration** - Sync status and page relationship tracking

## Essential Commands

### System Operations
```bash
# Initialize system
python -m cli init

# Full data collection and sync
python -m cli scrape --sync-notion

# Manual Notion synchronization
python -m cli notion sync

# System health check
python -m cli health

# View system statistics
python -m cli stats
```

### Data Management
```bash
# List distributors with filters
python -m cli list --region usa --limit 20

# Get distributor details
python -m cli info <distributor_id>

# View recent changes
python -m cli changes --days 7

# Notion integration stats
python -m cli notion stats
```

### Region Management
```bash
# Refresh region mappings
python -m cli mapping refresh

# View mapping statistics
python -m cli mapping stats
```

### Docker Operations
```bash
# Development environment
docker-compose --profile tools up -d
docker-compose exec cli bash

# Production deployment
docker-compose up -d api scheduler

# One-off scraping
docker-compose run --rm cli scrape --sync-notion

# View logs
docker-compose logs -f api scheduler
```

## Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://unifi_user:unifi_password@localhost:5432/unifi_distributors
# Development: sqlite:///./unifi_distributors.db

# Notion Integration
NOTION_TOKEN=secret_xxx
NOTION_DATABASE_ID=xxx

# Performance
SCRAPING_INTERVAL_HOURS=24
NOTION_BATCH_SIZE=25

# Optional Services
REDIS_URL=redis://localhost:6379
SENTRY_DSN=https://...
```

### Key Features

**Data Quality**
- **100% Unifi ID coverage** - All distributors have official Unifi identifiers
- **Zero duplicates** - System enforces uniqueness constraints  
- **Missing detection** - Automatic deactivation of disappeared distributors
- **Change tracking** - Complete audit trail with timestamps

**Geographic Coverage**
- **8 regions**: af, as, aus-nzl, can, eur, lat-a, mid-e, usa
- **131+ locations** covering global Unifi distributor network
- **Partner types**: master (Master Distributors), simple (Authorized Resellers)

**Integration**
- **Complete Notion sync** - All database fields mapped to Notion properties
- **REST API** - Programmatic access to distributor data and analytics
- **Automated scheduling** - Continuous monitoring with configurable intervals

## Data Architecture

### Business Logic
```
Scraping → Processing → Change Detection → Notion Sync
    ↓           ↓             ↓              ↓
JSON API → Validation → Missing Detection → Status Updates
```

### Key Workflows

**Daily Operations**
1. **Automated Scraping** (24h intervals)
2. **Data Processing** with change detection
3. **Missing Distributor Detection** and deactivation
4. **Notion Synchronization** with complete field mapping
5. **Health Monitoring** and error reporting

**Manual Operations**
- Ad-hoc data collection and analysis
- System maintenance and monitoring
- Custom reporting and data export

## Development Guidelines

### Code Organization
- **Services** - Core business logic and external integrations
- **Models** - Database schemas and data validation
- **API** - RESTful endpoints and documentation
- **Config** - Settings, logging, and database configuration
- **CLI** - Command-line interface for operations

### Testing & Quality
```bash
# Code formatting
black .

# Linting
flake8 .

# Type checking
mypy .
```

### Database Migrations
1. Update SQLAlchemy models in `models/database.py`
2. Test with both SQLite (development) and PostgreSQL (production)
3. Update Pydantic schemas in `models/schemas.py`

## Performance Metrics

**Expected Performance**
- **Total distributors**: ~579 (current collection)
- **Scraping speed**: ~14.6 distributors/second
- **API requests**: 131 requests per full scrape
- **Average request time**: ~0.30 seconds

**Quality Benchmarks**
- **Unifi ID coverage**: 100%
- **Duplicate rate**: 0%
- **Data freshness**: Updated every 24 hours
- **Notion sync rate**: Near real-time with batch processing

## Troubleshooting

### Common Issues
- **Database connection**: Check DATABASE_URL and service health
- **Notion sync failures**: Verify NOTION_TOKEN and database permissions
- **Scraping errors**: Review region mappings and API availability
- **Performance issues**: Monitor batch sizes and request rates

### Debugging
```bash
# Verbose output
python -m cli scrape --verbose

# Health diagnostics
python -m cli health

# Check logs
tail -f logs/unifi_tracker.log

# Docker debugging
docker-compose logs -f api
```

## Integration Notes

This system prioritizes **data accuracy** and **operational reliability**. All major operations include comprehensive error handling, logging, and recovery mechanisms. The architecture supports both automated operations and manual intervention for analysis and maintenance.

## Frontend Development Guidelines

### Multi-language Internationalization (i18n) Standards

**Core Principles**:
- **Zero Hard-coding**: Absolutely prohibit direct use of hard-coded displayable text in code
- **All user-visible text must be managed through the i18n system**
- **Includes**: titles, button text, prompts, error messages, data labels, etc.

**Key Naming Conventions**:
- Use English with `snake_case` naming for translation keys
- Keys should have hierarchical structure for organization
- Key names should be semantically clear, avoid numeric indices

**File Structure**:
```
src/locales/
├── zh.json          # Chinese translations
├── en.json          # English translations  
└── index.js         # i18n configuration
```

**Translation Key Categories**:
- `brand` - Brand related content
- `nav` - Navigation menus
- `common` - Common components (loading, error, actions)
- `dashboard` - Dashboard modules
- `financial` - Financial analysis
- `distribution` - Distribution network
- `charts` - Chart-related text
- `metrics` - Data metrics
- `analysis` - Analysis vocabulary

**Implementation Standards**:
- Template: Use `{{ $t('dashboard.title') }}` instead of hard-coded text
- Script: Use `const { t } = useI18n()` composition API
- Dynamic content: `t('metrics.revenue_percentage', { percentage: 88 })`
- Data structures: Use `value_proposition_key` instead of direct text

**Quality Requirements**:
- **Accuracy**: Translations must accurately convey original meaning
- **Consistency**: Same concepts use same translations throughout app
- **Localization**: Conform to target language expression habits  
- **Completeness**: Every supported language must contain all translation keys

**Critical Configuration**:
- **ECharts zoom limits**: `scaleLimit: { min: 1, max: 20 }` prevents page scroll interference
- **Language switching**: Proper `lang` attribute and URL considerations for SEO
- **Error handling**: Missing translation warnings in development mode