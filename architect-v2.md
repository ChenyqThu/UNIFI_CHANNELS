# 综合竞品洞察平台架构设计 v2.0
# Comprehensive Competitive Intelligence Platform Architecture

## 1. 架构设计总览 / Architecture Overview

### 1.1 平台愿景 / Platform Vision

**中文**: 构建一个全方位的竞品持续洞察与分析平台，通过多维度数据收集、智能分析和可视化呈现，为企业提供竞争对手的完整认知和战略决策支持。

**English**: Build a comprehensive competitive intelligence platform that provides complete competitor insights and strategic decision support through multi-dimensional data collection, intelligent analysis, and visualization.

### 1.2 核心架构原则 / Core Architecture Principles

- **Serverless First**: 采用无服务器架构，最小化运维成本
- **BaaS Integration**: 后端即服务，减少API开发和维护
- **Real-time Data**: 实时数据同步和变化检测
- **Multi-dimensional**: 支持多维度竞品数据的统一管理
- **Scalable Design**: 云原生架构，自动扩展
- **i18n Ready**: 完整的国际化支持

## 2. 系统架构设计 / System Architecture

### 2.1 整体架构图 / Overall Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           前端应用层 / Frontend Application Layer                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Vue 3 + Vite + TypeScript                                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │  Dashboard      │  │  Multi-Dimension│  │  Analytics      │  │  i18n Support   ││
│  │  仪表盘          │  │  Data Views     │  │  Analytics      │  │  多语言支持      ││
│  │                 │  │  多维度数据视图   │  │  分析报告        │  │                 ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │  Real-time      │  │  Data           │  │  Custom         │  │  Export &       ││
│  │  Notifications  │  │  Visualization  │  │  Reports        │  │  Sharing        ││
│  │  实时通知        │  │  数据可视化      │  │  自定义报告      │  │  导出分享        ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
                                      ↓ Direct Database Connection
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        数据服务层 / Data Service Layer (BaaS)                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Supabase Backend-as-a-Service                                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │  PostgreSQL     │  │  Real-time      │  │  Auto-generated │  │  Authentication ││
│  │  Database       │  │  WebSocket      │  │  APIs           │  │  & Security     ││
│  │  数据库          │  │  实时连接        │  │  自动生成API     │  │  认证和安全      ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │  GraphQL        │  │  Row Level      │  │  File Storage   │  │  Edge Functions ││
│  │  Query Layer    │  │  Security       │  │  文件存储        │  │  边缘函数        ││
│  │  GraphQL查询     │  │  行级安全        │  │                 │  │                 ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
                                      ↓ Scheduled Functions
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       数据收集层 / Data Collection Layer                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Serverless Functions (Vercel/Netlify)                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │  Financial      │  │  Channel        │  │  Product        │  │  Sentiment      ││
│  │  Data Scraper   │  │  Data Scraper   │  │  Release        │  │  Analysis       ││
│  │  财务数据爬虫    │  │  渠道数据爬虫    │  │  产品发布跟踪    │  │  舆情分析        ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │  Patent         │  │  Team           │  │  Data           │  │  Change         ││
│  │  Tracking       │  │  Monitoring     │  │  Processing     │  │  Detection      ││
│  │  专利跟踪        │  │  团队监控        │  │  数据处理        │  │  变化检测        ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
                                      ↓ Data Sources
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         外部数据源 / External Data Sources                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │  SEC Filings    │  │  Company APIs   │  │  GitHub         │  │  Reddit API     ││
│  │  财务报告        │  │  公司API        │  │  代码仓库        │  │  社交媒体        ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │  Patent         │  │  LinkedIn       │  │  News APIs      │  │  Industry       ││
│  │  Databases      │  │  人员信息        │  │  新闻API        │  │  Reports        ││
│  │  专利数据库      │  │                 │  │                 │  │  行业报告        ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈选择 / Technology Stack

#### 前端技术栈 / Frontend Stack
- **Vue 3** - 现代化前端框架
- **Vite** - 快速构建工具
- **TypeScript** - 类型安全
- **TailwindCSS** - 响应式样式
- **ECharts** - 数据可视化
- **Vue-i18n** - 国际化支持
- **Pinia** - 状态管理

#### 后端服务 / Backend Services
- **Supabase** - 主要BaaS服务
  - PostgreSQL 数据库
  - 实时WebSocket连接
  - 自动生成REST/GraphQL API
  - 用户认证和授权
  - 文件存储
  - 边缘函数

#### 数据收集 / Data Collection
- **Vercel Functions** - 无服务器函数
- **Netlify Functions** - 备选方案
- **GitHub Actions** - 定时任务调度
- **Cron Jobs** - 定时执行

## 3. 数据架构设计 / Data Architecture

### 3.1 多维度数据模型 / Multi-dimensional Data Model

```sql
-- 竞品公司主表 / Companies Table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    industry TEXT,
    founded_date DATE,
    headquarters TEXT,
    website TEXT,
    logo_url TEXT,
    ticker_symbol TEXT, -- 股票代码
    market_cap BIGINT,
    employee_count INTEGER,
    status TEXT DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 数据维度分类表 / Data Categories Table
CREATE TABLE data_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    display_name_zh TEXT,
    display_name_en TEXT,
    description TEXT,
    collection_frequency INTERVAL, -- 收集频率
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 数据类型定义表 / Data Types Table
CREATE TABLE data_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES data_categories(id),
    name TEXT NOT NULL,
    display_name_zh TEXT,
    display_name_en TEXT,
    description TEXT,
    schema_definition JSONB, -- JSON Schema定义
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 统一竞品数据表 / Unified Competitive Data Table
CREATE TABLE competitive_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    category_id UUID REFERENCES data_categories(id),
    data_type_id UUID REFERENCES data_types(id),
    data_source TEXT NOT NULL, -- 数据来源
    raw_data JSONB NOT NULL, -- 原始数据
    processed_data JSONB, -- 处理后数据
    metadata JSONB DEFAULT '{}', -- 元数据
    confidence_score FLOAT DEFAULT 0.0, -- 置信度
    relevance_score FLOAT DEFAULT 0.0, -- 相关性
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 数据变化跟踪表 / Data Changes Tracking Table
CREATE TABLE data_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_id UUID REFERENCES competitive_data(id),
    change_type TEXT NOT NULL, -- 'created', 'updated', 'deleted'
    field_name TEXT,
    old_value JSONB,
    new_value JSONB,
    significance_score FLOAT DEFAULT 0.0, -- 变化重要性
    is_notable BOOLEAN DEFAULT FALSE, -- 是否值得注意
    notification_sent BOOLEAN DEFAULT FALSE,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 数据收集任务表 / Data Collection Tasks Table
CREATE TABLE collection_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    company_id UUID REFERENCES companies(id),
    category_id UUID REFERENCES data_categories(id),
    data_type_id UUID REFERENCES data_types(id),
    schedule_expression TEXT, -- Cron表达式
    function_name TEXT, -- 执行函数名
    configuration JSONB DEFAULT '{}',
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 数据质量监控表 / Data Quality Monitoring Table
CREATE TABLE data_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_id UUID REFERENCES competitive_data(id),
    completeness_score FLOAT, -- 完整性评分
    accuracy_score FLOAT, -- 准确性评分
    timeliness_score FLOAT, -- 及时性评分
    consistency_score FLOAT, -- 一致性评分
    overall_score FLOAT, -- 综合评分
    quality_issues JSONB DEFAULT '[]', -- 质量问题列表
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3.2 数据分类定义 / Data Category Definitions

```sql
-- 初始化数据分类 / Initialize Data Categories
INSERT INTO data_categories (name, display_name_zh, display_name_en, description, collection_frequency) VALUES
('financial', '财务数据', 'Financial Data', 'Quarterly earnings, revenue, profit margins', '3 months'),
('channels', '渠道数据', 'Channel Data', 'Distribution networks, partnerships', '1 week'),
('products', '产品数据', 'Product Data', 'Product releases, feature updates', '1 day'),
('sentiment', '舆情数据', 'Sentiment Data', 'Social media, news, reviews', '6 hours'),
('patents', '专利数据', 'Patent Data', 'Patent applications, technology trends', '1 week'),
('personnel', '人员数据', 'Personnel Data', 'Key hires, team changes', '1 week'),
('market', '市场数据', 'Market Data', 'Market share, competitive positioning', '1 month'),
('technology', '技术数据', 'Technology Data', 'Code repositories, technical publications', '1 day');

-- 初始化数据类型 / Initialize Data Types
INSERT INTO data_types (category_id, name, display_name_zh, display_name_en, description) VALUES
-- 财务数据类型
((SELECT id FROM data_categories WHERE name = 'financial'), 'quarterly_earnings', '季度财报', 'Quarterly Earnings', 'Official quarterly financial reports'),
((SELECT id FROM data_categories WHERE name = 'financial'), 'revenue_breakdown', '营收分解', 'Revenue Breakdown', 'Revenue by segment/geography'),
((SELECT id FROM data_categories WHERE name = 'financial'), 'profit_margins', '利润率', 'Profit Margins', 'Gross and net profit margin analysis'),

-- 渠道数据类型
((SELECT id FROM data_categories WHERE name = 'channels'), 'distributor_network', '分销商网络', 'Distributor Network', 'Global distributor and reseller network'),
((SELECT id FROM data_categories WHERE name = 'channels'), 'partnership_changes', '合作关系变化', 'Partnership Changes', 'New partnerships and terminations'),

-- 产品数据类型
((SELECT id FROM data_categories WHERE name = 'products'), 'product_releases', '产品发布', 'Product Releases', 'New product announcements and launches'),
((SELECT id FROM data_categories WHERE name = 'products'), 'feature_updates', '功能更新', 'Feature Updates', 'Software updates and new features'),

-- 舆情数据类型
((SELECT id FROM data_categories WHERE name = 'sentiment'), 'reddit_mentions', 'Reddit提及', 'Reddit Mentions', 'Reddit discussions and sentiment'),
((SELECT id FROM data_categories WHERE name = 'sentiment'), 'news_coverage', '新闻报道', 'News Coverage', 'Media coverage and press releases'),

-- 专利数据类型
((SELECT id FROM data_categories WHERE name = 'patents'), 'patent_applications', '专利申请', 'Patent Applications', 'New patent applications and grants'),

-- 人员数据类型
((SELECT id FROM data_categories WHERE name = 'personnel'), 'executive_changes', '高管变化', 'Executive Changes', 'C-level and VP changes'),
((SELECT id FROM data_categories WHERE name = 'personnel'), 'team_expansion', '团队扩张', 'Team Expansion', 'Hiring trends and team growth');
```

## 4. 前端架构设计 / Frontend Architecture

### 4.1 组件架构 / Component Architecture

```
src/
├── components/
│   ├── common/          # 通用组件
│   │   ├── DataTable.vue
│   │   ├── DatePicker.vue
│   │   ├── FilterPanel.vue
│   │   └── LoadingSpinner.vue
│   ├── charts/          # 图表组件
│   │   ├── CompetitiveChart.vue
│   │   ├── TrendChart.vue
│   │   ├── HeatmapChart.vue
│   │   └── ComparisonChart.vue
│   ├── dashboard/       # 仪表盘组件
│   │   ├── MetricCard.vue
│   │   ├── AlertPanel.vue
│   │   └── QuickActions.vue
│   ├── data-views/      # 数据视图组件
│   │   ├── FinancialView.vue
│   │   ├── ChannelView.vue
│   │   ├── ProductView.vue
│   │   └── SentimentView.vue
│   └── analysis/        # 分析组件
│       ├── CrossDimensionAnalysis.vue
│       ├── TrendAnalysis.vue
│       └── CompetitiveMapping.vue
├── composables/         # 组合式函数
│   ├── useCompetitiveData.js
│   ├── useRealTimeUpdates.js
│   ├── useDataFiltering.js
│   └── useExportData.js
├── services/           # 服务层
│   ├── supabaseClient.js
│   ├── competitiveDataService.js
│   ├── realtimeService.js
│   └── exportService.js
├── stores/             # 状态管理
│   ├── companies.js
│   ├── competitiveData.js
│   ├── userPreferences.js
│   └── notifications.js
├── utils/              # 工具函数
│   ├── dataTransformation.js
│   ├── chartHelpers.js
│   └── validationHelpers.js
└── views/              # 页面视图
    ├── Dashboard.vue
    ├── CompanyProfile.vue
    ├── DataAnalysis.vue
    ├── Reports.vue
    └── Settings.vue
```

### 4.2 数据服务层 / Data Service Layer

```javascript
// services/competitiveDataService.js
import { supabase } from './supabaseClient.js'

export class CompetitiveDataService {
  // 获取公司列表
  async getCompanies() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('status', 'active')
      .order('name')
    
    if (error) throw error
    return data
  }

  // 获取多维度数据
  async getCompetitiveData(companyId, categoryId, dateRange) {
    const { data, error } = await supabase
      .from('competitive_data')
      .select(`
        *,
        companies(*),
        data_categories(*),
        data_types(*)
      `)
      .eq('company_id', companyId)
      .eq('category_id', categoryId)
      .gte('collected_at', dateRange.start)
      .lte('collected_at', dateRange.end)
      .order('collected_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  // 获取数据变化
  async getDataChanges(companyId, significance = 0.5) {
    const { data, error } = await supabase
      .from('data_changes')
      .select(`
        *,
        competitive_data(
          companies(name),
          data_categories(display_name_zh, display_name_en),
          data_types(display_name_zh, display_name_en)
        )
      `)
      .eq('competitive_data.company_id', companyId)
      .gte('significance_score', significance)
      .order('changed_at', { ascending: false })
      .limit(100)
    
    if (error) throw error
    return data
  }

  // 实时数据订阅
  subscribeToDataChanges(callback) {
    return supabase
      .channel('competitive-data-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'competitive_data'
      }, callback)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'data_changes'
      }, callback)
      .subscribe()
  }

  // 跨维度分析
  async getCrossDimensionAnalysis(companyId, dimensions, timeRange) {
    const { data, error } = await supabase
      .rpc('get_cross_dimension_analysis', {
        company_id: companyId,
        dimension_ids: dimensions,
        start_date: timeRange.start,
        end_date: timeRange.end
      })
    
    if (error) throw error
    return data
  }
}
```

### 4.3 状态管理 / State Management

```javascript
// stores/competitiveData.js
import { defineStore } from 'pinia'
import { CompetitiveDataService } from '../services/competitiveDataService.js'

export const useCompetitiveDataStore = defineStore('competitiveData', {
  state: () => ({
    companies: [],
    selectedCompany: null,
    dataCategories: [],
    competitiveData: [],
    dataChanges: [],
    loading: false,
    error: null,
    realtimeSubscription: null,
    filters: {
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      categories: [],
      significance: 0.5
    }
  }),

  getters: {
    filteredData: (state) => {
      return state.competitiveData.filter(item => {
        const matchesDateRange = new Date(item.collected_at) >= state.filters.dateRange.start &&
                                new Date(item.collected_at) <= state.filters.dateRange.end
        const matchesCategory = state.filters.categories.length === 0 ||
                               state.filters.categories.includes(item.category_id)
        return matchesDateRange && matchesCategory
      })
    },

    significantChanges: (state) => {
      return state.dataChanges.filter(change => 
        change.significance_score >= state.filters.significance
      )
    },

    dataByCategory: (state) => {
      return state.competitiveData.reduce((acc, item) => {
        const category = item.data_categories.name
        if (!acc[category]) acc[category] = []
        acc[category].push(item)
        return acc
      }, {})
    }
  },

  actions: {
    async fetchCompanies() {
      this.loading = true
      try {
        const service = new CompetitiveDataService()
        this.companies = await service.getCompanies()
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async fetchCompetitiveData(companyId, categoryId = null) {
      this.loading = true
      try {
        const service = new CompetitiveDataService()
        this.competitiveData = await service.getCompetitiveData(
          companyId,
          categoryId,
          this.filters.dateRange
        )
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async fetchDataChanges(companyId) {
      try {
        const service = new CompetitiveDataService()
        this.dataChanges = await service.getDataChanges(
          companyId,
          this.filters.significance
        )
      } catch (error) {
        this.error = error.message
      }
    },

    setupRealtimeSubscription() {
      const service = new CompetitiveDataService()
      this.realtimeSubscription = service.subscribeToDataChanges((payload) => {
        // 处理实时数据更新
        this.handleRealtimeUpdate(payload)
      })
    },

    handleRealtimeUpdate(payload) {
      const { eventType, new: newRecord, old: oldRecord } = payload
      
      if (eventType === 'INSERT') {
        if (payload.table === 'competitive_data') {
          this.competitiveData.unshift(newRecord)
        } else if (payload.table === 'data_changes') {
          this.dataChanges.unshift(newRecord)
        }
      } else if (eventType === 'UPDATE') {
        // 更新现有记录
        const index = this.competitiveData.findIndex(item => item.id === newRecord.id)
        if (index !== -1) {
          this.competitiveData[index] = newRecord
        }
      }
    },

    setSelectedCompany(company) {
      this.selectedCompany = company
    },

    updateFilters(newFilters) {
      this.filters = { ...this.filters, ...newFilters }
    },

    clearError() {
      this.error = null
    }
  }
})
```

## 5. 数据收集架构 / Data Collection Architecture

### 5.1 Serverless Functions 架构 / Serverless Functions Architecture

```javascript
// vercel.json 配置
{
  "functions": {
    "api/collect-financial-data.js": {
      "maxDuration": 300,
      "memory": 1024
    },
    "api/collect-sentiment-data.js": {
      "maxDuration": 180,
      "memory": 512
    },
    "api/collect-channel-data.js": {
      "maxDuration": 240,
      "memory": 768
    }
  },
  "crons": [
    {
      "path": "/api/collect-financial-data",
      "schedule": "0 9 * * 1" // 每周一上午9点
    },
    {
      "path": "/api/collect-sentiment-data",
      "schedule": "0 */6 * * *" // 每6小时
    },
    {
      "path": "/api/collect-channel-data",
      "schedule": "0 2 * * *" // 每天凌晨2点
    }
  ]
}
```

### 5.2 数据收集管道 / Data Collection Pipeline

```javascript
// api/collect-financial-data.js
import { createClient } from '@supabase/supabase-js'
import { FinancialDataScraper } from '../utils/scrapers/financialDataScraper.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 获取活跃公司列表
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, ticker_symbol')
      .eq('status', 'active')
    
    if (companiesError) throw companiesError

    const scraper = new FinancialDataScraper()
    const results = []

    // 并行处理多个公司
    const promises = companies.map(async (company) => {
      try {
        const financialData = await scraper.scrapeCompanyFinancials(company.ticker_symbol)
        
        // 存储到数据库
        const { data, error } = await supabase
          .from('competitive_data')
          .insert({
            company_id: company.id,
            category_id: await getCategoryId('financial'),
            data_type_id: await getDataTypeId('quarterly_earnings'),
            data_source: 'SEC_API',
            raw_data: financialData,
            processed_data: await processFinancialData(financialData),
            confidence_score: 0.95,
            relevance_score: 1.0
          })
        
        if (error) throw error
        results.push({ company: company.name, status: 'success' })
        
      } catch (error) {
        results.push({ company: company.name, status: 'error', error: error.message })
      }
    })

    await Promise.all(promises)

    res.status(200).json({ 
      message: 'Financial data collection completed',
      results: results
    })

  } catch (error) {
    console.error('Financial data collection error:', error)
    res.status(500).json({ error: error.message })
  }
}

// 工具函数
async function getCategoryId(categoryName) {
  const { data, error } = await supabase
    .from('data_categories')
    .select('id')
    .eq('name', categoryName)
    .single()
  
  if (error) throw error
  return data.id
}

async function getDataTypeId(typeName) {
  const { data, error } = await supabase
    .from('data_types')
    .select('id')
    .eq('name', typeName)
    .single()
  
  if (error) throw error
  return data.id
}

async function processFinancialData(rawData) {
  // 数据清洗和标准化逻辑
  return {
    revenue: rawData.revenue,
    profit: rawData.profit,
    growth_rate: calculateGrowthRate(rawData),
    processed_at: new Date().toISOString()
  }
}
```

### 5.3 数据处理和质量控制 / Data Processing and Quality Control

```javascript
// utils/dataProcessor.js
export class DataProcessor {
  static async processAndValidate(rawData, dataType) {
    const processor = new DataProcessor()
    
    // 数据清洗
    const cleanedData = processor.cleanData(rawData, dataType)
    
    // 数据验证
    const validationResult = processor.validateData(cleanedData, dataType)
    
    // 质量评分
    const qualityScore = processor.calculateQualityScore(cleanedData, validationResult)
    
    return {
      processed_data: cleanedData,
      validation_result: validationResult,
      quality_score: qualityScore
    }
  }

  cleanData(rawData, dataType) {
    // 根据数据类型执行清洗逻辑
    switch (dataType) {
      case 'quarterly_earnings':
        return this.cleanFinancialData(rawData)
      case 'reddit_mentions':
        return this.cleanSentimentData(rawData)
      default:
        return rawData
    }
  }

  validateData(data, dataType) {
    // 数据验证逻辑
    const schema = this.getValidationSchema(dataType)
    return this.validateAgainstSchema(data, schema)
  }

  calculateQualityScore(data, validationResult) {
    // 质量评分算法
    let score = 1.0
    
    // 完整性检查
    score *= this.calculateCompletenessScore(data)
    
    // 准确性检查
    score *= this.calculateAccuracyScore(validationResult)
    
    // 及时性检查
    score *= this.calculateTimelinessScore(data)
    
    return Math.max(0, Math.min(1, score))
  }
}
```

## 6. 实时数据和通知系统 / Real-time Data and Notification System

### 6.1 实时数据架构 / Real-time Data Architecture

```javascript
// services/realtimeService.js
import { supabase } from './supabaseClient.js'

export class RealtimeService {
  constructor() {
    this.subscriptions = new Map()
    this.eventHandlers = new Map()
  }

  // 订阅数据变化
  subscribeToDataChanges(companyId, callback) {
    const channel = supabase
      .channel(`company-${companyId}-changes`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'competitive_data',
        filter: `company_id=eq.${companyId}`
      }, (payload) => {
        this.handleDataChange(payload, callback)
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'data_changes',
        filter: `competitive_data.company_id=eq.${companyId}`
      }, (payload) => {
        this.handleChangeNotification(payload, callback)
      })
      .subscribe()
    
    this.subscriptions.set(`company-${companyId}`, channel)
    return channel
  }

  // 处理数据变化
  handleDataChange(payload, callback) {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    // 计算变化重要性
    const significance = this.calculateSignificance(newRecord, oldRecord)
    
    // 如果变化重要，触发通知
    if (significance > 0.5) {
      this.sendNotification({
        type: 'data_change',
        event: eventType,
        data: newRecord,
        significance: significance
      })
    }
    
    callback(payload)
  }

  // 发送通知
  async sendNotification(notification) {
    // 存储通知到数据库
    await supabase
      .from('notifications')
      .insert({
        type: notification.type,
        title: this.generateNotificationTitle(notification),
        message: this.generateNotificationMessage(notification),
        data: notification.data,
        significance: notification.significance,
        is_read: false
      })
    
    // 实时推送到前端
    await supabase
      .channel('notifications')
      .send({
        type: 'broadcast',
        event: 'new_notification',
        payload: notification
      })
  }

  // 计算变化重要性
  calculateSignificance(newRecord, oldRecord) {
    // 基于数据类型和变化程度计算重要性
    const dataType = newRecord.data_type_id
    const category = newRecord.category_id
    
    // 不同类型数据的重要性权重
    const weights = {
      financial: 0.9,
      products: 0.8,
      channels: 0.7,
      sentiment: 0.6,
      patents: 0.5
    }
    
    // 计算数据变化幅度
    const changeAmount = this.calculateChangeAmount(newRecord, oldRecord)
    
    return weights[category] * changeAmount
  }
}
```

### 6.2 通知系统 / Notification System

```javascript
// composables/useNotifications.js
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '../services/supabaseClient.js'

export function useNotifications() {
  const notifications = ref([])
  const unreadCount = ref(0)
  const subscription = ref(null)

  // 获取通知列表
  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) throw error
    
    notifications.value = data
    unreadCount.value = data.filter(n => !n.is_read).length
  }

  // 标记为已读
  const markAsRead = async (notificationId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
    
    if (error) throw error
    
    // 更新本地状态
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification && !notification.is_read) {
      notification.is_read = true
      unreadCount.value--
    }
  }

  // 订阅实时通知
  const subscribeToNotifications = () => {
    subscription.value = supabase
      .channel('notifications')
      .on('broadcast', { event: 'new_notification' }, (payload) => {
        notifications.value.unshift(payload.payload)
        unreadCount.value++
      })
      .subscribe()
  }

  // 取消订阅
  const unsubscribeFromNotifications = () => {
    if (subscription.value) {
      subscription.value.unsubscribe()
      subscription.value = null
    }
  }

  onMounted(() => {
    fetchNotifications()
    subscribeToNotifications()
  })

  onUnmounted(() => {
    unsubscribeFromNotifications()
  })

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    subscribeToNotifications,
    unsubscribeFromNotifications
  }
}
```

## 7. 国际化架构 / Internationalization Architecture

### 7.1 i18n 系统设计 / i18n System Design

```javascript
// locales/index.js
import { createI18n } from 'vue-i18n'
import zh from './zh.json'
import en from './en.json'

const i18n = createI18n({
  locale: 'zh',
  fallbackLocale: 'en',
  messages: {
    zh,
    en
  },
  // 数字格式化
  numberFormats: {
    'en': {
      currency: {
        style: 'currency',
        currency: 'USD'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    },
    'zh': {
      currency: {
        style: 'currency',
        currency: 'CNY'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    }
  },
  // 日期格式化
  datetimeFormats: {
    'en': {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric'
      }
    },
    'zh': {
      short: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      },
      long: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }
    }
  }
})

export default i18n
```

### 7.2 动态内容国际化 / Dynamic Content Internationalization

```javascript
// utils/dynamicI18n.js
export class DynamicI18n {
  constructor(i18n) {
    this.i18n = i18n
    this.translationCache = new Map()
  }

  // 翻译数据库中的动态内容
  async translateDynamicContent(content, targetLocale) {
    const cacheKey = `${content}_${targetLocale}`
    
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey)
    }

    let translation = content
    
    // 如果有预定义翻译，使用预定义翻译
    if (this.hasPreDefinedTranslation(content, targetLocale)) {
      translation = this.getPreDefinedTranslation(content, targetLocale)
    } else {
      // 否则使用翻译服务
      translation = await this.callTranslationService(content, targetLocale)
    }
    
    this.translationCache.set(cacheKey, translation)
    return translation
  }

  // 获取本地化的数据标签
  getLocalizedDataLabel(dataType, locale) {
    const field = locale === 'zh' ? 'display_name_zh' : 'display_name_en'
    return dataType[field] || dataType.name
  }

  // 格式化数字
  formatNumber(number, locale, options = {}) {
    return new Intl.NumberFormat(locale, options).format(number)
  }

  // 格式化日期
  formatDate(date, locale, options = {}) {
    return new Intl.DateTimeFormat(locale, options).format(new Date(date))
  }

  // 格式化货币
  formatCurrency(amount, locale, currency = 'USD') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount)
  }
}
```

## 8. 部署和运维架构 / Deployment and Operations Architecture

### 8.1 部署流程 / Deployment Process

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build application
      run: npm run build
      
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
        
    - name: Update Supabase functions
      run: |
        npx supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
      env:
        SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### 8.2 监控和告警 / Monitoring and Alerting

```javascript
// utils/monitoring.js
export class MonitoringService {
  constructor() {
    this.metrics = new Map()
    this.alerts = []
  }

  // 记录性能指标
  recordMetric(name, value, tags = {}) {
    const metric = {
      name,
      value,
      tags,
      timestamp: new Date().toISOString()
    }
    
    this.metrics.set(name, metric)
    
    // 发送到监控服务
    this.sendToMonitoring(metric)
  }

  // 检查系统健康状态
  async checkSystemHealth() {
    const healthChecks = [
      this.checkDatabaseHealth(),
      this.checkApiHealth(),
      this.checkDataCollectionHealth()
    ]
    
    const results = await Promise.allSettled(healthChecks)
    
    return {
      overall: results.every(r => r.status === 'fulfilled'),
      details: results.map((r, i) => ({
        service: ['database', 'api', 'data_collection'][i],
        status: r.status,
        result: r.value || r.reason
      }))
    }
  }

  // 数据库健康检查
  async checkDatabaseHealth() {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('count')
        .limit(1)
      
      if (error) throw error
      
      return {
        status: 'healthy',
        response_time: Date.now() - start
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      }
    }
  }

  // 设置告警规则
  setAlertRule(rule) {
    this.alerts.push(rule)
  }

  // 检查告警条件
  checkAlerts() {
    this.alerts.forEach(alert => {
      if (this.evaluateAlertCondition(alert)) {
        this.sendAlert(alert)
      }
    })
  }
}
```

## 9. 安全架构 / Security Architecture

### 9.1 认证和授权 / Authentication and Authorization

```javascript
// services/authService.js
import { supabase } from './supabaseClient.js'

export class AuthService {
  // 用户登录
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  }

  // 获取当前用户
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  // 检查用户权限
  async checkPermission(userId, resource, action) {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('resource', resource)
      .eq('action', action)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return !!data
  }

  // 行级安全策略
  async setupRowLevelSecurity() {
    // 在 Supabase 中设置 RLS 策略
    // 用户只能访问其有权限的公司数据
    await supabase.rpc('enable_rls_policies')
  }
}
```

### 9.2 数据安全 / Data Security

```sql
-- 行级安全策略示例
-- Row Level Security Policies

-- 用户只能访问授权的公司数据
CREATE POLICY "Users can only access authorized companies" ON companies
    FOR SELECT
    USING (
        id IN (
            SELECT company_id 
            FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

-- 用户只能查看授权公司的竞品数据
CREATE POLICY "Users can only view authorized competitive data" ON competitive_data
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id 
            FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

-- 数据分类权限控制
CREATE POLICY "Data category access control" ON competitive_data
    FOR SELECT
    USING (
        category_id IN (
            SELECT category_id 
            FROM user_category_permissions 
            WHERE user_id = auth.uid()
        )
    );
```

## 10. 性能优化 / Performance Optimization

### 10.1 缓存策略 / Caching Strategy

```javascript
// services/cacheService.js
export class CacheService {
  constructor() {
    this.cache = new Map()
    this.ttl = new Map()
  }

  // 设置缓存
  set(key, value, ttl = 300000) { // 默认5分钟
    this.cache.set(key, value)
    this.ttl.set(key, Date.now() + ttl)
  }

  // 获取缓存
  get(key) {
    if (!this.cache.has(key)) return null
    
    const expiresAt = this.ttl.get(key)
    if (Date.now() > expiresAt) {
      this.cache.delete(key)
      this.ttl.delete(key)
      return null
    }
    
    return this.cache.get(key)
  }

  // 智能缓存装饰器
  cached(ttl = 300000) {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value
      
      descriptor.value = async function(...args) {
        const cacheKey = `${propertyKey}_${JSON.stringify(args)}`
        const cachedResult = this.cache.get(cacheKey)
        
        if (cachedResult) {
          return cachedResult
        }
        
        const result = await originalMethod.apply(this, args)
        this.cache.set(cacheKey, result, ttl)
        return result
      }
      
      return descriptor
    }
  }
}
```

### 10.2 查询优化 / Query Optimization

```javascript
// services/queryOptimizer.js
export class QueryOptimizer {
  // 批量查询优化
  async batchQuery(queries) {
    const results = await Promise.all(queries.map(query => 
      this.executeQuery(query)
    ))
    return results
  }

  // 分页查询
  async paginatedQuery(table, options = {}) {
    const {
      page = 1,
      pageSize = 20,
      filters = {},
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options

    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    let query = supabase
      .from(table)
      .select('*', { count: 'exact' })
      .range(start, end)
      .order(sortBy, { ascending: sortOrder === 'asc' })

    // 应用过滤器
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        query = query.eq(key, value)
      }
    })

    const { data, error, count } = await query

    if (error) throw error

    return {
      data,
      pagination: {
        page,
        pageSize,
        total: count,
        totalPages: Math.ceil(count / pageSize)
      }
    }
  }

  // 聚合查询优化
  async aggregateQuery(table, groupBy, aggregations) {
    const { data, error } = await supabase
      .rpc('aggregate_data', {
        table_name: table,
        group_by: groupBy,
        aggregations: aggregations
      })

    if (error) throw error
    return data
  }
}
```

## 11. 总结和后续规划 / Summary and Future Planning

### 11.1 架构优势 / Architecture Advantages

1. **显著降低后端开发成本**: 采用 Supabase BaaS 服务，自动生成 API，无需手动开发后端接口
2. **实时数据同步**: 基于 WebSocket 的实时数据推送，确保数据一致性
3. **高度可扩展**: 云原生架构，支持自动扩展和负载均衡
4. **开发效率高**: 前端直连数据库，快速迭代，减少前后端协调成本
5. **成本效益**: Serverless 按需付费，无服务器维护成本
6. **安全可靠**: 内置认证、授权和行级安全策略

### 11.2 实施路线图 / Implementation Roadmap

**Phase 1: 基础设施搭建** (2-3周)
- 设置 Supabase 项目和数据库
- 实现基础的数据模型和API
- 迁移现有分销商数据
- 建立基础的前端架构

**Phase 2: 多维度数据收集** (3-4周)
- 实现财务数据收集管道
- 集成舆情分析功能
- 添加产品发布跟踪
- 构建数据质量监控系统

**Phase 3: 高级分析功能** (3-4周)
- 实现跨维度数据分析
- 添加预测分析功能
- 构建自定义报告生成器
- 完善通知和告警系统

**Phase 4: 优化和扩展** (持续)
- 性能优化和缓存策略
- 添加更多竞品和数据源
- 移动端适配
- 高级用户权限管理

### 11.3 关键成功因素 / Key Success Factors

1. **数据质量**: 确保数据准确性和完整性
2. **用户体验**: 提供直观友好的界面和交互
3. **实时性**: 保证数据的及时更新和推送
4. **可扩展性**: 支持更多竞品和数据维度的扩展
5. **安全性**: 严格的数据访问控制和隐私保护
6. **国际化**: 完整的多语言支持和本地化
7. **性能**: 快速响应和高并发处理能力

这个架构设计为构建一个功能完善、高性能、易维护的竞品洞察平台奠定了坚实的基础。通过采用现代化的技术栈和最佳实践，我们可以在最短时间内构建出一个具有竞争力的产品。