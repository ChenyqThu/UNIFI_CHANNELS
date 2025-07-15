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

**Financial Data Management System** 🆕
- **Standardized JSON Data** (`frontend/public/data/financial-reports.json`) - Centralized financial data in standardized format
- **Financial Data Service** (`frontend/src/services/financialDataService.js`) - Professional data loading with caching, validation, and error handling
- **Data Management Utilities** (`frontend/src/utils/financialDataManager.js`) - Tools for data validation, auto-fixing, and template generation
- **Dynamic Store Integration** (`frontend/src/stores/channel.js`) - Automatic data loading and computed metrics

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

### Financial Data Management 🆕
```bash
# Frontend data management (from frontend directory)
# View current financial data
cat public/data/financial-reports.json

# Backup before updating
cp public/data/financial-reports.json public/data/archived/backup-$(date +%Y%m%d).json

# After updating JSON, test data loading
npm run dev  # Check browser console for validation results

# Data validation utility (in browser console)
import { financialDataManager } from '@/utils/financialDataManager'
const report = financialDataManager.generateValidationReport(data)
console.log(report)
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

**Financial Data Architecture** 🆕
- **JSON-driven design** - All financial data centralized in standardized JSON format
- **Automatic validation** - Data consistency checks and error detection
- **Dynamic computation** - Real-time calculation of growth rates and trends
- **Cache optimization** - 5-minute intelligent caching for performance
- **Version control** - Automatic backup and change tracking for financial data

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

**Financial Data Workflows** 🆕
1. **Quarterly Update Process** (When new earnings are released)
   - Backup current data: `cp financial-reports.json archived/`
   - Edit `frontend/public/data/financial-reports.json` with new quarter data
   - Update metadata: `last_updated`, `version`
   - System automatically validates, computes metrics, and updates all visualizations
2. **Data Validation** - Automatic consistency checks for revenue, regional data, and percentages
3. **Cache Management** - 5-minute intelligent caching with automatic invalidation
4. **Error Recovery** - Graceful fallback and detailed error reporting

## Development Guidelines

### Code Organization
- **Services** - Core business logic and external integrations
- **Models** - Database schemas and data validation
- **API** - RESTful endpoints and documentation
- **Config** - Settings, logging, and database configuration
- **CLI** - Command-line interface for operations

### Financial Data Development Guidelines 🆕
- **Data Structure** - All financial data must follow the standardized JSON schema in `frontend/public/data/financial-reports.json`
- **Service Layer** - Use `financialDataService.js` for all data loading operations
- **Validation** - Utilize `financialDataManager.js` for data validation and integrity checks
- **Store Integration** - Financial data automatically populates Pinia store with computed metrics
- **Component Usage** - Charts automatically adapt to new data structure without modification
- **Error Handling** - Comprehensive validation with warnings and error recovery mechanisms

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

## Important Financial Data Management Notes 🆕

### Critical Architecture Change (2025-01-15)
**BREAKING CHANGE**: Financial data has been migrated from hardcoded store values to JSON-driven architecture.

### Key Points for Developers:
1. **Data Source**: All financial data now comes from `frontend/public/data/financial-reports.json`
2. **Automatic Loading**: Components automatically call `fetchFinancialData()` on mount
3. **Computed Metrics**: Growth rates and trends are auto-calculated by the service layer
4. **Validation**: Data consistency is automatically checked with detailed error reporting
5. **Caching**: 5-minute intelligent caching reduces load times and API calls

### For Data Maintainers:
- **Single Source of Truth**: Only update `financial-reports.json` for all financial data changes
- **Immediate Updates**: Changes to JSON file automatically reflect across all visualizations
- **Data Integrity**: Built-in validation prevents inconsistent data entry
- **Backup Strategy**: Always backup before major updates using provided commands

### Migration Benefits:
- ✅ Eliminates hardcoded financial data scattered across components
- ✅ Centralizes all financial metrics in one maintainable location
- ✅ Automatic validation prevents data entry errors
- ✅ Supports easy quarterly earnings updates
- ✅ Future-proof architecture for additional financial metrics

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

### Country Mapping System

**Important Note**: The `frontend/src/utils/countryMapping.js` file contains complete mappings from database country codes to world map country names. This mapping system is already implemented and should NOT be duplicated elsewhere.

**Key Features**:
- Maps database country codes (e.g., 'FL', 'TX', 'ON', 'QC') to proper world map names
- Handles US states → 'USA' mapping  
- Handles Canadian provinces → 'Canada' mapping
- Contains `COUNTRY_CODE_TO_MAP_NAME` constant with all mappings
- Includes helper functions for data conversion

**Usage**:
```javascript
import { COUNTRY_CODE_TO_MAP_NAME } from '../../utils/countryMapping.js'
const mapName = COUNTRY_CODE_TO_MAP_NAME[countryCode] || countryCode
```

**Do NOT**:
- Create duplicate mapping logic in components
- Re-implement country code conversions
- Hardcode country name mappings elsewhere