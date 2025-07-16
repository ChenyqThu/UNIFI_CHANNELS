# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

**Comprehensive Competitive Intelligence Platform** - A next-generation multi-dimensional competitive intelligence platform that provides real-time monitoring, analysis, and insights across financial performance, distribution networks, product releases, market sentiment, patents, and strategic initiatives. Built on modern serverless architecture with direct frontend-database connectivity.

## System Architecture

### Core Components

**Frontend Layer (Vue 3 + Vite)**
- **Multi-dimensional Dashboard** (`frontend/src/views/`) - Real-time competitive intelligence dashboards
- **Direct Database Connection** (`frontend/src/services/`) - Type-safe Supabase client with real-time subscriptions
- **State Management** (`frontend/src/stores/`) - Pinia stores for competitive data, companies, and user preferences
- **Internationalization** (`frontend/src/locales/`) - Complete Chinese/English i18n support

**Data Service Layer (Supabase BaaS)**
- **PostgreSQL Database** - Multi-dimensional competitive data with optimized schema
- **Real-time Subscriptions** - WebSocket-based live data updates
- **Row Level Security** - Fine-grained access control and permissions
- **Auto-generated APIs** - Type-safe REST and GraphQL endpoints

**Data Collection Layer (Serverless Functions)**
- **Financial Data Collector** (`api/collectors/financial-data.js`) - SEC filings, earnings reports, financial metrics
- **Sentiment Analyzer** (`api/collectors/sentiment-analysis.js`) - Reddit, Twitter, news sentiment analysis
- **Product Release Tracker** (`api/collectors/product-releases.js`) - GitHub releases, product announcements
- **Patent Monitor** (`api/collectors/patent-tracker.js`) - Patent applications and technology trends
- **Channel Data Scraper** (`api/collectors/channel-data.js`) - Distribution network monitoring

**Data Processing & Intelligence**
- **Multi-dimensional Processor** (`processors/`) - Data validation, normalization, and quality scoring
- **Change Detection Engine** - Automatic significance scoring and trend analysis
- **Cross-dimensional Analysis** - Correlation analysis across data dimensions
- **Predictive Analytics** - Trend forecasting and competitive intelligence insights

### Database Design

The system uses a **multi-dimensional competitive intelligence data model**:

- **Companies** - Competitor profiles with industry classification and metadata
- **Data Categories** - Financial, channels, products, sentiment, patents, personnel, market, technology
- **Data Types** - Specific data structures within each category (e.g., quarterly_earnings, reddit_mentions)
- **Competitive Data** - Unified storage for all multi-dimensional competitive intelligence
- **Data Changes** - Complete audit trail with significance scoring and impact assessment
- **Quality Metrics** - Data completeness, accuracy, timeliness, and consistency tracking
- **User Permissions** - Role-based access control for companies and data categories

## Essential Commands

### Frontend Development
```bash
# Start development server
cd frontend && npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Lint and fix code
npm run lint

# i18n validation
npm run i18n:validate

# Generate database types
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

### Serverless Functions Deployment
```bash
# Deploy to Vercel
vercel --prod

# Deploy functions only
vercel --prod --only=functions

# Local development
vercel dev

# View function logs
vercel logs

# Trigger data collection manually
curl -X POST "https://your-domain.vercel.app/api/collectors/financial-data" \
  -H "Authorization: Bearer $API_KEY"
```

### Supabase Database Operations
```bash
# Connect to database
npx supabase db connect

# Run migrations
npx supabase db push

# Reset database
npx supabase db reset

# Generate database documentation
npx supabase gen docs

# Backup database
npx supabase db dump --data-only > backup.sql

# View real-time connections
npx supabase realtime inspect
```

### Data Collection Management
```bash
# Trigger all collectors
curl -X POST "https://your-domain.vercel.app/api/collectors/run-all" \
  -H "Authorization: Bearer $API_KEY"

# Check collection status
curl -X GET "https://your-domain.vercel.app/api/monitoring/collection-status" \
  -H "Authorization: Bearer $API_KEY"

# View collection logs
curl -X GET "https://your-domain.vercel.app/api/monitoring/execution-logs" \
  -H "Authorization: Bearer $API_KEY"
```

### System Monitoring
```bash
# Check system health
curl -X GET "https://your-domain.vercel.app/api/health"

# View performance metrics
curl -X GET "https://your-domain.vercel.app/api/monitoring/metrics"

# Check database performance
curl -X GET "https://your-domain.vercel.app/api/monitoring/database-health"
```

### Multi-dimensional Data Management 🆕
```bash
# Frontend data management (from frontend directory)
# Start development with real-time data
npm run dev

# View competitive data in browser console
const { competitiveDataService } = await import('@/services/competitiveDataService')
const data = await competitiveDataService.getByCompany('company-id')
console.log(data)

# Test real-time subscriptions
const { realtimeService } = await import('@/services/realtimeService')
realtimeService.subscribeToCompetitiveData('company-id', console.log)

# Validate data quality
const { data } = await supabase.from('competitive_data').select('quality_score').gt('quality_score', 0.8)
console.log('High quality data points:', data.length)
```

## Configuration

### Environment Variables

**Frontend (.env)**
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application Configuration
VITE_APP_NAME=Competitive Intelligence Platform
VITE_DEFAULT_LANGUAGE=zh
VITE_ENABLE_REALTIME=true
VITE_CACHE_TTL=300000

# Development
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

**Serverless Functions (.env.local)**
```bash
# Supabase Service Key (for functions)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Keys for Data Collection
SEC_API_KEY=your_sec_api_key
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
NEWS_API_KEY=your_news_api_key
GITHUB_TOKEN=your_github_token

# Function Configuration
COLLECTION_API_KEY=your_collection_api_key
WEBHOOK_SECRET=your_webhook_secret
BATCH_SIZE=100
RATE_LIMIT_PER_MINUTE=60

# Monitoring & Alerting
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ALERT_EMAIL=alerts@yourcompany.com
SENTRY_DSN=https://...
```

**Database Configuration (Supabase)**
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configure real-time
ALTER publication supabase_realtime ADD TABLE competitive_data;
ALTER publication supabase_realtime ADD TABLE data_changes;
ALTER publication supabase_realtime ADD TABLE notifications;
```

### Key Features

**Multi-dimensional Intelligence**
- **8 Data Dimensions** - Financial, channels, products, sentiment, patents, personnel, market, technology
- **100+ Companies** - Comprehensive competitive landscape coverage
- **Real-time Updates** - Live data synchronization and change detection
- **Cross-dimensional Analysis** - Correlation analysis across different data types

**Data Quality & Validation**
- **Automated Quality Scoring** - Completeness, accuracy, timeliness, consistency metrics
- **Confidence Indicators** - Data source reliability and validation confidence
- **Significance Detection** - Automatic importance scoring for changes
- **Data Lineage** - Complete audit trail from collection to analysis

**Advanced Analytics**
- **Predictive Intelligence** - Trend forecasting and pattern recognition
- **Competitive Benchmarking** - Multi-dimensional competitive positioning
- **Sentiment Analysis** - AI-powered social media and news sentiment tracking
- **Change Impact Assessment** - Automatic evaluation of competitive move significance

**User Experience**
- **Real-time Dashboards** - Live updating competitive intelligence views
- **Multi-language Support** - Complete Chinese/English internationalization
- **Role-based Access** - Fine-grained permissions for companies and data categories
- **Customizable Views** - Personalized dashboards for different user roles

**Technical Architecture**
- **Serverless First** - Cost-effective, auto-scaling serverless functions
- **Direct Frontend-DB** - No backend API development required
- **Type Safety** - Full TypeScript support with auto-generated types
- **Performance Optimized** - Intelligent caching and query optimization

## Data Architecture

### Data Flow Pipeline
```
External Sources → Serverless Collectors → Data Processing → Supabase DB → Frontend
       ↓                    ↓                    ↓             ↓           ↓
   API Calls →        Validation →         Quality →      Real-time →  Dashboard
   Web Scraping →     Normalization →     Scoring →      Updates →     Analysis
   File Parsing →     Enrichment →        Change →       Subscriptions → Insights
```

### Key Workflows

**Automated Data Collection**
1. **Scheduled Collection** (6h intervals for critical data, 24h for others)
2. **Multi-source Aggregation** - SEC, Reddit, GitHub, news APIs, company websites
3. **Quality Validation** - Automatic data validation and quality scoring
4. **Change Detection** - Significance analysis and impact assessment
5. **Real-time Distribution** - Live updates to frontend via WebSocket

**Real-time Intelligence**
1. **Live Data Streaming** - WebSocket-based real-time updates
2. **Change Notifications** - Instant alerts for significant competitive moves
3. **Cross-dimensional Correlation** - Automatic analysis across data dimensions
4. **Predictive Analytics** - Trend forecasting and pattern recognition

**User Interaction Workflows**
1. **Dashboard Access** - Role-based competitive intelligence views
2. **Multi-dimensional Analysis** - Interactive exploration across data dimensions
3. **Custom Reporting** - Personalized competitive intelligence reports
4. **Collaborative Analysis** - Team-based insights and knowledge sharing

**Data Quality Management**
1. **Automated Validation** - Real-time data quality checks and scoring
2. **Confidence Tracking** - Source reliability and data accuracy monitoring
3. **Error Recovery** - Graceful handling of data collection failures
4. **Performance Optimization** - Intelligent caching and query optimization

## Development Guidelines

### Frontend Code Organization
```
frontend/src/
├── components/          # Vue components
│   ├── common/         # Reusable components
│   ├── charts/         # Data visualization components
│   ├── layout/         # Layout components
│   └── forms/          # Form components
├── composables/        # Vue composition functions
│   ├── useCompetitiveData.ts
│   ├── useDataChanges.ts
│   └── useRealtime.ts
├── services/           # Data services
│   ├── supabaseClient.ts
│   ├── competitiveDataService.ts
│   └── realtimeService.ts
├── stores/             # Pinia stores
│   ├── competitiveIntelligence.ts
│   ├── companies.ts
│   └── user.ts
├── utils/              # Utility functions
│   ├── errorHandler.ts
│   ├── queryBuilder.ts
│   └── cacheManager.ts
└── views/              # Page components
    ├── Dashboard.vue
    ├── CompanyProfile.vue
    └── DataAnalysis.vue
```

### Serverless Functions Organization
```
api/
├── collectors/         # Data collection functions
│   ├── financial-data.js
│   ├── sentiment-analysis.js
│   └── product-releases.js
├── processors/         # Data processing utilities
│   ├── base-data-processor.js
│   └── financial-data-processor.js
├── monitoring/         # System monitoring functions
│   ├── collection-status.js
│   └── health-check.js
└── utils/              # Shared utilities
    ├── error-handler.js
    └── retry-handler.js
```

### Multi-dimensional Data Development Guidelines 🆕
- **Type Safety** - All data operations must use TypeScript with auto-generated Supabase types
- **Real-time First** - Components should subscribe to real-time data updates where applicable
- **Error Handling** - Use comprehensive error handling with user-friendly messages
- **Performance** - Implement intelligent caching and query optimization
- **Validation** - Validate all data at collection, processing, and display layers
- **Accessibility** - Ensure all components meet WCAG 2.1 AA standards
- **Internationalization** - All user-facing text must support i18n

### Testing & Quality
```bash
# Frontend testing
npm run test:unit
npm run test:e2e
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Build verification
npm run build
```

### Database Development
1. **Schema Changes** - Use Supabase migrations for all schema modifications
2. **Type Generation** - Regenerate TypeScript types after schema changes
3. **RLS Policies** - Implement row-level security for all sensitive data
4. **Performance** - Add appropriate indexes for query optimization
5. **Backup** - Regular database backups and migration testing

## Performance Metrics

**Expected Performance**
- **Companies Tracked**: 100+ competitors across multiple industries
- **Data Collection Speed**: ~30 minutes for full multi-dimensional collection per company
- **Real-time Update Latency**: <5 seconds for live data updates
- **Dashboard Load Time**: <3 seconds for initial load, <1 second for subsequent navigation
- **API Response Time**: <2 seconds for standard queries, <5 seconds for complex analysis

**Quality Benchmarks**
- **Data Coverage**: ≥95% across all tracked dimensions
- **Data Freshness**: ≤6 hours for critical data, ≤24 hours for all dimensions
- **Quality Score**: ≥98% average data quality rating
- **Confidence Score**: ≥95% average confidence in data accuracy
- **Change Detection**: Real-time significance analysis and impact assessment
- **System Uptime**: ≥99.5% availability

## Troubleshooting

### Common Issues
- **Supabase Connection**: Check SUPABASE_URL and API keys in environment variables
- **Real-time Updates**: Verify WebSocket connection and real-time subscriptions
- **Data Collection Failures**: Check serverless function logs and API rate limits
- **Performance Issues**: Monitor database query performance and cache hit rates
- **Type Errors**: Regenerate TypeScript types after database schema changes

### Debugging
```bash
# Check Supabase connection
npx supabase db ping

# View real-time subscriptions
npx supabase realtime logs

# Debug serverless functions
vercel logs --follow

# Check database performance
npx supabase db analyze

# Frontend debugging
npm run dev -- --debug

# Monitor real-time updates
const { realtimeService } = await import('@/services/realtimeService')
console.log(realtimeService.getConnectionStatus())
```

### Performance Debugging
```bash
# Database query analysis
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

# Cache performance
const { queryCache } = await import('@/utils/queryCache')
console.log('Cache size:', queryCache.size())
console.log('Cache hit rate:', queryCache.getHitRate())

# Real-time connection status
const status = supabase.realtime.getSocketConnectionState()
console.log('WebSocket status:', status)
```

## Integration Notes

This system prioritizes **comprehensive competitive intelligence** and **real-time insights**. The modern serverless architecture with direct frontend-database connectivity eliminates traditional backend development while providing enterprise-grade performance and reliability.

## Important Multi-dimensional Data Architecture Notes 🆕

### Critical Architecture Evolution (2025-01-15)
**MAJOR UPGRADE**: System has been completely redesigned from single-dimensional distributor tracking to comprehensive multi-dimensional competitive intelligence platform.

### Key Architectural Changes:
1. **Serverless First**: All data collection moved to serverless functions for cost efficiency and scalability
2. **Direct Frontend-DB**: Frontend connects directly to Supabase, eliminating backend API development
3. **Real-time Everything**: WebSocket-based real-time data updates across all dimensions
4. **Multi-dimensional**: Support for 8+ data dimensions with cross-dimensional analysis
5. **Type Safety**: Complete TypeScript integration with auto-generated database types

### For Developers:
- **No Backend APIs**: Use Supabase services directly from frontend components
- **Real-time First**: All components should subscribe to real-time data updates
- **Type Safety**: All database operations are type-checked with auto-generated types
- **Performance**: Intelligent caching and query optimization built into services
- **Error Handling**: Comprehensive error handling with user-friendly messages

### For Data Analysts:
- **Multi-dimensional Views**: Access financial, sentiment, product, and channel data in unified interface
- **Real-time Updates**: Live data streaming for immediate competitive intelligence
- **Cross-dimensional Analysis**: Correlation analysis across different data types
- **Predictive Analytics**: Trend forecasting and pattern recognition capabilities
- **Custom Dashboards**: Personalized views for different analysis needs

### Migration Benefits:
- ✅ Eliminates backend API development and maintenance
- ✅ Provides real-time competitive intelligence across all dimensions
- ✅ Enables predictive analytics and trend forecasting
- ✅ Supports unlimited scaling with serverless architecture
- ✅ Delivers enterprise-grade performance at fraction of traditional costs

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

## 重要数据库字段说明 (2025-01-16)

### 分销商数据表结构
- **`country_state`** 字段：存储国家/地区代码（如 KE, NG, ZA, UA 等）- **主要使用**
- **`country_code`** 字段：可能为空，不建议使用
- **`region`** 字段：存储区域代码（如 af, eur, na 等）

### 前端代码映射
- 地图显示使用 `country_state` 字段进行国家映射
- 通过 `utils/countryMapping.js` 将数据库代码转换为地图显示名称
- 确保所有分销商相关查询使用正确的字段名称

### 故障排查记录 (2025-01-16)
**问题**：分销网络地图显示异常，console 报错 "Invalid API key"
**原因**：Supabase API key 过期
**解决方案**：
1. 更新 `.env` 文件中的 `VITE_SUPABASE_ANON_KEY`
2. 修正 `distributorService.js` 中地理位置查询使用 `country_state` 字段
3. 验证 WebSocket 实时连接正常工作

**测试验证**：
- ✅ Supabase 数据库连接正常
- ✅ 分销商数据查询成功
- ✅ 地区和国家统计数据正确
- ✅ WebSocket 实时订阅正常

### UI/UX 更新记录 (2025-01-16)
**更新内容**：浏览器标签页图标和标题优化
**变更详情**：
1. **新增自定义favicon** (`frontend/public/favicon.svg`)
   - 使用与导航栏一致的Material Icons `analytics` 图标
   - 蓝色到绿色渐变背景 (blue-600 to green-600)
   - 白色前景图标，居中显示，最优比例缩放
2. **更新页面标题** (`frontend/index.html`)
   - 从 "Ubiquiti 渠道情报分析平台" 更新为 "Ubiquiti 竞争情报分析平台"
   - 与项目的多维度竞争情报定位保持一致
3. **图标引用更新**
   - 从默认 `vite.svg` 更改为自定义 `favicon.svg`
   - 保持SVG格式以支持高分辨率显示

**设计理念**：
- 保持与应用内导航栏的视觉统一性
- 突出"竞争情报分析"的核心功能定位
- 提供清晰的品牌识别和专业形象