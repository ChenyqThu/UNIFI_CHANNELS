# Architecture Documentation
# Unifi Distributor Tracking System

## 1. System Overview

The Unifi Distributor Tracking System is a **competitive intelligence platform** designed to automatically monitor and analyze Unifi's global distributor network. The system employs a **microservices-inspired architecture** with clear separation of concerns, supporting both development and production deployment patterns.

### 1.1 Core Architectural Principles

- **Data-Driven**: All operations center around comprehensive distributor data collection and processing
- **Event-Based**: Change detection triggers automated workflows and notifications
- **Integration-First**: Seamless connectivity with external platforms (Notion, APIs)
- **Scalable Design**: Modular components support horizontal scaling
- **Reliability**: Comprehensive error handling, monitoring, and recovery mechanisms

## 2. High-Level Architecture

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

## 3. Component Architecture

### 3.1 Data Collection Layer

**Primary Component**: `services/distributor_scraper.py`

```python
┌─────────────────────────────────────────────────────────────────┐
│                    Data Collection Architecture                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐│
│  │   JSON API      │    │  Region Mapper  │    │  Data Validator ││
│  │   Scraper       │    │                 │    │                 ││
│  │                 │────│ 8 Global        │────│ Schema          ││
│  │ - Rate Limited  │    │ Regions         │    │ Validation      ││
│  │ - Retry Logic   │    │ 131+ Countries  │    │ Duplicate       ││
│  │ - Header Mgmt   │    │ State Mapping   │    │ Detection       ││
│  └─────────────────┘    └─────────────────┘    └─────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Responsibilities**:
- **JSON API Interaction**: Direct API calls to Unifi's endpoint with proper headers
- **Region Management**: Comprehensive mapping of 8 global regions to country/state codes
- **Error Handling**: Retry mechanisms, rate limiting, graceful failure handling
- **Data Standardization**: Consistent data format across all regions

### 3.2 Data Processing Layer

**Primary Component**: `services/enhanced_data_processor.py`

```python
┌─────────────────────────────────────────────────────────────────┐
│                   Data Processing Pipeline                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Raw Data Input                                                 │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐│
│  │   Validation    │    │  Deduplication  │    │ Change          ││
│  │   Engine        │    │  Engine         │    │ Detection       ││
│  │                 │────│                 │────│                 ││
│  │ - Schema Check  │    │ - Unifi ID      │    │ - New Entries   ││
│  │ - Required      │    │ - Name/Location │    │ - Updates       ││
│  │   Fields        │    │ - Fuzzy Match   │    │ - Deletions     ││
│  └─────────────────┘    └─────────────────┘    └─────────────────┘│
│                                                        │          │
│                                                        ▼          │
│                                              ┌─────────────────┐ │
│                                              │ Database        │ │
│                                              │ Transaction     │ │
│                                              │ Management      │ │
│                                              └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Key Features**:
- **Unifi ID Priority**: Official Unifi IDs as primary business identifiers
- **Change Detection**: Automatic identification of new, modified, and removed distributors
- **Missing Distributor Handling**: Deactivation of distributors no longer found in scraping
- **Data Quality Assurance**: Comprehensive validation and quality scoring

### 3.3 Integration Layer

**Primary Components**: 
- `services/notion_sync.py` - Notion workspace integration
- `api/main.py` - REST API endpoints

```python
┌─────────────────────────────────────────────────────────────────┐
│                     Integration Architecture                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐│
│  │   Notion Sync   │    │   REST API      │    │  External       ││
│  │                 │    │                 │    │  Webhooks       ││
│  │ - Field Mapping │    │ - CRUD Ops      │    │  (Future)       ││
│  │ - Batch Sync    │    │ - Filtering     │    │                 ││
│  │ - Bidirectional │    │ - Pagination    │    │ - Change        ││
│  │ - Status Mgmt   │    │ - Health Check  │    │   Notifications ││
│  └─────────────────┘    └─────────────────┘    └─────────────────┘│
│            │                       │                       │     │
│            └───────────────────────┼───────────────────────┘     │
│                                    │                             │
│                                    ▼                             │
│                          ┌─────────────────┐                    │
│                          │  Unified Data   │                    │
│                          │  Model          │                    │
│                          │                 │                    │
│                          │ - Distributor   │                    │
│                          │ - Company       │                    │
│                          │ - Changes       │                    │
│                          └─────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

**Integration Features**:
- **Complete Field Mapping**: All distributor data synchronized with Notion
- **Optimized Sync**: Batch processing and change-based updates
- **REST API**: Comprehensive endpoints for external system integration
- **Health Monitoring**: Real-time system status and diagnostics

### 3.4 Operations Layer

**Primary Components**:
- `scheduler.py` - Automated task execution
- `cli/` - Command-line interface
- Health monitoring and logging

```python
┌─────────────────────────────────────────────────────────────────┐
│                    Operations Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐│
│  │   Scheduler     │    │      CLI        │    │   Monitoring    ││
│  │                 │    │                 │    │                 ││
│  │ - Cron Jobs     │    │ - Data Ops      │    │ - Health Check  ││
│  │ - Task Queue    │    │ - Sync Ops      │    │ - Logging       ││
│  │ - Error Retry   │    │ - Admin Tasks   │    │ - Metrics       ││
│  │ - Notifications │    │ - Diagnostics   │    │ - Alerting      ││
│  └─────────────────┘    └─────────────────┘    └─────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 4. Data Architecture

### 4.1 Database Schema Design

```sql
┌─────────────────────────────────────────────────────────────────┐
│                       Database Schema                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐│
│  │   companies     │    │  distributors   │    │ change_history  ││
│  │                 │    │                 │    │                 ││
│  │ id (PK)         │◄──┤ company_id (FK) │    │ id (PK)         ││
│  │ name (UNIQUE)   │    │ unifi_id (UNIQUE)│   │ distributor_id  ││
│  │ created_at      │    │ name            │    │ change_type     ││
│  │                 │    │ region_code     │    │ field_name      ││
│  │                 │    │ country_code    │    │ old_value       ││
│  │                 │    │ partner_type    │    │ new_value       ││
│  │                 │    │ contact_info    │    │ changed_at      ││
│  │                 │    │ status          │    │                 ││
│  │                 │    │ last_seen       │    │                 ││
│  │                 │    │ created_at      │    │                 ││
│  │                 │    │ updated_at      │    │                 ││
│  └─────────────────┘    └─────────────────┘    └─────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Design Principles**:
- **Normalized Structure**: Separate companies and distributors for data integrity
- **Unifi ID as Business Key**: Primary identifier for distributor relationships
- **Complete Audit Trail**: Change history tracks all modifications
- **Flexible Status Management**: Support for active/inactive distributor states

### 4.2 Data Flow Architecture

```python
┌─────────────────────────────────────────────────────────────────┐
│                        Data Flow Pipeline                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  External APIs                                                  │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────┐                                            │
│  │ JSON Scraper    │────┐                                       │
│  └─────────────────┘    │                                       │
│                         │                                       │
│                         ▼                                       │
│                  ┌─────────────────┐                            │
│                  │ Data Processor  │                            │
│                  │                 │                            │
│                  │ - Validate      │                            │
│                  │ - Deduplicate   │                            │
│                  │ - Detect Changes│                            │
│                  └─────────────────┘                            │
│                         │                                       │
│                         ▼                                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │   Database      │ │   Notion Sync   │ │   Change        │    │
│  │   Storage       │ │                 │ │   Detection     │    │
│  │                 │ │ - Create Pages  │ │                 │    │
│  │ - CRUD Ops      │ │ - Update Props  │ │ - New Entries   │    │
│  │ - Transactions  │ │ - Status Mgmt   │ │ - Modifications │    │
│  │ - Constraints   │ │ - Batch Sync    │ │ - Deletions     │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 5. Deployment Architecture

### 5.1 Docker Multi-Stage Build

```dockerfile
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Architecture                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐│
│  │   Base Stage    │    │  Development    │    │   Production    ││
│  │                 │    │     Stage       │    │     Stage       ││
│  │ - Python 3.11   │────│                 │    │                 ││
│  │ - Dependencies  │    │ + Dev Tools     │    │ + API Server    ││
│  │ - App User      │    │ + Testing       │    │ + Health Check  ││
│  │ - Security      │    │ + Debugging     │    │ + Optimization  ││
│  └─────────────────┘    └─────────────────┘    └─────────────────┘│
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  Scheduler      │    │      CLI        │                     │
│  │    Stage        │    │     Stage       │                     │
│  │                 │    │                 │                     │
│  │ + Cron Jobs     │    │ + Interactive   │                     │
│  │ + Background    │    │ + One-off Tasks │                     │
│  │   Tasks         │    │ + Admin Tools   │                     │
│  └─────────────────┘    └─────────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Container Orchestration

```yaml
┌─────────────────────────────────────────────────────────────────┐
│                   Service Architecture                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐│
│  │   PostgreSQL    │    │     Redis       │    │      API        ││
│  │                 │    │                 │    │    Service      ││
│  │ - Data Storage  │    │ - Session Cache │    │                 ││
│  │ - Health Check  │    │ - Rate Limiting │    │ - REST Endpoints││
│  │ - Persistence   │    │ - Temporary     │    │ - Health Check  ││
│  │ - Backup        │    │   Storage       │    │ - Auto-restart  ││
│  └─────────────────┘    └─────────────────┘    └─────────────────┘│
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │   Scheduler     │    │      CLI        │                     │
│  │   Service       │    │    Service      │                     │
│  │                 │    │                 │                     │
│  │ - Cron Tasks    │    │ - Profile:tools │                     │
│  │ - Auto-restart  │    │ - Manual Tasks  │                     │
│  │ - Log Rotation  │    │ - Maintenance   │                     │
│  └─────────────────┘    └─────────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 6. Security Architecture

### 6.1 Security Layers

```python
┌─────────────────────────────────────────────────────────────────┐
│                     Security Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐│
│  │  Environment    │    │   API Security  │    │  Data Security  ││
│  │   Security      │    │                 │    │                 ││
│  │                 │    │ - Rate Limiting │    │ - Encryption    ││
│  │ - Secret Mgmt   │    │ - Input Valid.  │    │ - Access Ctrl   ││
│  │ - Config Isol.  │    │ - Auth Headers  │    │ - Audit Trail   ││
│  │ - User Isol.    │    │ - CORS Policy   │    │ - Backup Sec    ││
│  └─────────────────┘    └─────────────────┘    └─────────────────┘│
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │   Network       │    │  Container      │                     │
│  │   Security      │    │   Security      │                     │
│  │                 │    │                 │                     │
│  │ - TLS/HTTPS     │    │ - Non-root User │                     │
│  │ - Firewall      │    │ - Read-only FS  │                     │
│  │ - VPC/Network   │    │ - Resource      │                     │
│  │   Segmentation  │    │   Limits        │                     │
│  └─────────────────┘    └─────────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 7. Performance Architecture

### 7.1 Performance Optimization

- **Database Optimization**: Indexed queries, connection pooling, prepared statements
- **Caching Strategy**: Redis for session data, query result caching
- **Batch Processing**: Notion sync and data processing optimization
- **Resource Management**: Memory-efficient data structures, connection limits
- **Monitoring**: Performance metrics, slow query detection

### 7.2 Scalability Design

```python
┌─────────────────────────────────────────────────────────────────┐
│                    Scalability Architecture                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Horizontal Scaling                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐│
│  │   API Service   │    │   Scheduler     │    │   Database      ││
│  │   (Multiple)    │    │   (Single)      │    │   (Clustered)   ││
│  │                 │    │                 │    │                 ││
│  │ - Load Balanced │    │ - Leader/       │    │ - Master/Slave  ││
│  │ - Stateless     │    │   Follower      │    │ - Sharding      ││
│  │ - Auto-scale    │    │ - Lock Mgmt     │    │ - Replication   ││
│  └─────────────────┘    └─────────────────┘    └─────────────────┘│
│                                                                 │
│  Vertical Scaling                                               │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │   Resource      │    │   Performance   │                     │
│  │   Allocation    │    │   Monitoring    │                     │
│  │                 │    │                 │                     │
│  │ - CPU Scaling   │    │ - Metrics       │                     │
│  │ - Memory Mgmt   │    │ - Alerting      │                     │
│  │ - Storage Opt   │    │ - Auto-tuning   │                     │
│  └─────────────────┘    └─────────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 8. Monitoring and Observability

### 8.1 Monitoring Stack

- **Health Checks**: Application, database, and service health monitoring
- **Logging**: Structured JSON logging with configurable levels
- **Metrics**: Performance metrics, business KPIs, system resource usage
- **Alerting**: Automated notifications for system failures and anomalies

### 8.2 Diagnostic Capabilities

```python
┌─────────────────────────────────────────────────────────────────┐
│                   Observability Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐│
│  │    Logging      │    │    Metrics      │    │    Tracing      ││
│  │                 │    │                 │    │                 ││
│  │ - Structured    │    │ - Business KPI  │    │ - Request Flow  ││
│  │ - Centralized   │    │ - System Health │    │ - Performance   ││
│  │ - Searchable    │    │ - Performance   │    │ - Error Track   ││
│  │ - Retention     │    │ - Usage Stats   │    │ - Dependencies  ││
│  └─────────────────┘    └─────────────────┘    └─────────────────┘│
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │    Alerting     │    │   Dashboard     │                     │
│  │                 │    │                 │                     │
│  │ - Threshold     │    │ - Real-time     │                     │
│  │ - Anomaly       │    │ - Historical    │                     │
│  │ - Recovery      │    │ - Trends        │                     │
│  │ - Escalation    │    │ - Health Status │                     │
│  └─────────────────┘    └─────────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 9. Development Architecture

### 9.1 Code Organization

```
unifi_channels/
├── api/                    # REST API layer
├── cli/                    # Command-line interface
├── models/                 # Data models and schemas
├── services/               # Business logic services
├── config/                 # Configuration management
├── utils/                  # Shared utilities
├── tests/                  # Test suite (when needed)
└── docs/                   # Documentation
```

### 9.2 Development Workflow

- **Code Quality**: Black formatting, Flake8 linting, MyPy type checking
- **Testing Strategy**: Unit tests for critical components, integration tests for workflows
- **Documentation**: Comprehensive inline documentation and architectural guides
- **Version Control**: Git-based workflow with feature branches

## 10. Future Architecture Considerations

### 10.1 Extensibility Points

- **Data Sources**: Plugin architecture for additional vendor tracking
- **Integrations**: Webhook framework for external system notifications
- **Analytics**: Machine learning pipeline for trend analysis
- **Deployment**: Kubernetes orchestration for enterprise scaling

### 10.2 Technology Evolution

- **Event Sourcing**: Complete audit trail with event replay capabilities
- **Microservices**: Service decomposition for independent scaling
- **Real-time Processing**: Stream processing for immediate change detection
- **Cloud Native**: Serverless functions for cost-effective scaling

This architecture provides a solid foundation for the current requirements while maintaining flexibility for future enhancements and scaling needs.