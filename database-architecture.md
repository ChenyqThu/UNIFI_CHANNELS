# 多维度竞品数据库架构设计
# Multi-dimensional Competitive Intelligence Database Architecture

## 1. 数据库设计概述 / Database Design Overview

### 1.1 设计理念 / Design Philosophy

**中文**: 构建一个高度规范化、支持多维度数据存储和分析的竞品情报数据库。通过灵活的数据模型设计，支持财务、渠道、产品、舆情、专利、人员等多个维度的数据统一管理。

**English**: Build a highly normalized, multi-dimensional competitive intelligence database that supports unified management of financial, channel, product, sentiment, patent, and personnel data through flexible data modeling.

### 1.2 核心设计原则 / Core Design Principles

- **多维度支持**: 统一的数据模型支持各种类型的竞品数据
- **实时性**: 支持实时数据更新和变化检测
- **可扩展性**: 易于添加新的数据维度和竞品
- **数据质量**: 内置数据验证和质量评分机制
- **审计跟踪**: 完整的数据变化历史记录
- **性能优化**: 优化的索引和查询性能

## 2. 数据库技术架构 / Database Technical Architecture

### 2.1 技术栈选择 / Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    数据库技术栈 / Database Stack                  │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL 15+ (主数据库)                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │  JSONB 支持     │  │  全文搜索       │  │  实时订阅       │    │
│  │  JSON Support   │  │  Full-text      │  │  Real-time      │    │
│  │                 │  │  Search         │  │  Subscriptions  │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │  时间序列优化    │  │  分区表支持     │  │  并发控制       │    │
│  │  Time Series    │  │  Partitioning   │  │  Concurrency    │    │
│  │  Optimization   │  │  Support        │  │  Control        │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Supabase 集成 / Supabase Integration

```javascript
// Supabase 配置
const supabaseConfig = {
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceKey: process.env.SUPABASE_SERVICE_KEY,
  features: {
    realtime: true,        // 实时数据同步
    auth: true,           // 用户认证
    storage: true,        // 文件存储
    edgeFunctions: true,  // 边缘函数
    rls: true            // 行级安全
  }
}
```

## 3. 核心数据模型 / Core Data Model

### 3.1 主要实体关系图 / Main Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      实体关系图 / ERD                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│     ┌─────────────┐       ┌─────────────────┐       ┌─────────────┐│
│     │  companies  │◄──────┤ competitive_data │──────►│data_types  ││
│     │   竞品公司   │       │    竞品数据      │       │ 数据类型   ││
│     └─────────────┘       └─────────────────┘       └─────────────┘│
│            │                        │                      │       │
│            │                        │                      │       │
│            ▼                        ▼                      ▼       │
│     ┌─────────────┐       ┌─────────────────┐       ┌─────────────┐│
│     │   users     │       │  data_changes   │       │data_categories││
│     │   用户管理   │       │   数据变化      │       │  数据分类   ││
│     └─────────────┘       └─────────────────┘       └─────────────┘│
│            │                        │                      │       │
│            │                        │                      │       │
│            ▼                        ▼                      ▼       │
│     ┌─────────────┐       ┌─────────────────┐       ┌─────────────┐│
│     │user_permissions│      │collection_tasks │       │notifications││
│     │   用户权限   │       │   收集任务      │       │   通知      ││
│     └─────────────┘       └─────────────────┘       └─────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 数据库表结构 / Database Schema

#### 3.2.1 公司表 / Companies Table

```sql
-- 竞品公司主表
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT,
    industry TEXT,
    founded_date DATE,
    headquarters TEXT,
    country_code TEXT,
    website TEXT,
    logo_url TEXT,
    ticker_symbol TEXT,
    market_cap BIGINT,
    employee_count INTEGER,
    description TEXT,
    status company_status DEFAULT 'active',
    priority_level INTEGER DEFAULT 1, -- 1: 高优先级, 2: 中, 3: 低
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 枚举类型定义
CREATE TYPE company_status AS ENUM ('active', 'inactive', 'archived');

-- 索引优化
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_ticker ON companies(ticker_symbol);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_updated_at ON companies(updated_at);
```

#### 3.2.2 数据分类表 / Data Categories Table

```sql
-- 数据维度分类表
CREATE TABLE data_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    display_name_zh TEXT,
    display_name_en TEXT,
    description TEXT,
    icon_name TEXT,
    color_code TEXT,
    collection_frequency INTERVAL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 初始化数据分类
INSERT INTO data_categories (name, display_name_zh, display_name_en, description, icon_name, color_code, collection_frequency, sort_order) VALUES
('financial', '财务数据', 'Financial Data', 'Quarterly earnings, revenue, profit margins', 'chart-line', '#10B981', '3 months', 1),
('channels', '渠道数据', 'Channel Data', 'Distribution networks, partnerships', 'users', '#3B82F6', '1 week', 2),
('products', '产品数据', 'Product Data', 'Product releases, feature updates', 'package', '#8B5CF6', '1 day', 3),
('sentiment', '舆情数据', 'Sentiment Data', 'Social media, news, reviews', 'message-circle', '#F59E0B', '6 hours', 4),
('patents', '专利数据', 'Patent Data', 'Patent applications, technology trends', 'shield', '#EF4444', '1 week', 5),
('personnel', '人员数据', 'Personnel Data', 'Key hires, team changes', 'user', '#06B6D4', '1 week', 6),
('market', '市场数据', 'Market Data', 'Market share, competitive positioning', 'trending-up', '#84CC16', '1 month', 7),
('technology', '技术数据', 'Technology Data', 'Code repositories, technical publications', 'code', '#6366F1', '1 day', 8);
```

#### 3.2.3 数据类型表 / Data Types Table

```sql
-- 数据类型定义表
CREATE TABLE data_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES data_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_name_zh TEXT,
    display_name_en TEXT,
    description TEXT,
    schema_definition JSONB, -- JSON Schema定义
    validation_rules JSONB DEFAULT '{}',
    processing_rules JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, name)
);

-- 数据类型索引
CREATE INDEX idx_data_types_category ON data_types(category_id);
CREATE INDEX idx_data_types_name ON data_types(name);
CREATE INDEX idx_data_types_active ON data_types(is_active);
```

#### 3.2.4 核心数据表 / Core Data Table

```sql
-- 统一竞品数据表
CREATE TABLE competitive_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES data_categories(id) ON DELETE CASCADE,
    data_type_id UUID REFERENCES data_types(id) ON DELETE CASCADE,
    data_source TEXT NOT NULL,
    source_url TEXT,
    raw_data JSONB NOT NULL,
    processed_data JSONB,
    metadata JSONB DEFAULT '{}',
    confidence_score FLOAT DEFAULT 0.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    relevance_score FLOAT DEFAULT 0.0 CHECK (relevance_score >= 0 AND relevance_score <= 1),
    quality_score FLOAT DEFAULT 0.0 CHECK (quality_score >= 0 AND quality_score <= 1),
    data_hash TEXT, -- 数据指纹用于去重
    collection_version INTEGER DEFAULT 1,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    is_anomaly BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 分区表设计 (按月分区)
CREATE TABLE competitive_data_y2025m01 PARTITION OF competitive_data
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- 索引优化
CREATE INDEX idx_competitive_data_company ON competitive_data(company_id);
CREATE INDEX idx_competitive_data_category ON competitive_data(category_id);
CREATE INDEX idx_competitive_data_type ON competitive_data(data_type_id);
CREATE INDEX idx_competitive_data_collected_at ON competitive_data(collected_at);
CREATE INDEX idx_competitive_data_source ON competitive_data(data_source);
CREATE INDEX idx_competitive_data_hash ON competitive_data(data_hash);
CREATE INDEX idx_competitive_data_active ON competitive_data(is_active);
CREATE INDEX idx_competitive_data_composite ON competitive_data(company_id, category_id, collected_at DESC);

-- 全文搜索索引
CREATE INDEX idx_competitive_data_fts ON competitive_data USING GIN(to_tsvector('english', processed_data::text));
```

#### 3.2.5 数据变化跟踪表 / Data Changes Tracking Table

```sql
-- 数据变化跟踪表
CREATE TABLE data_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_id UUID REFERENCES competitive_data(id) ON DELETE CASCADE,
    change_type change_type_enum NOT NULL,
    field_name TEXT,
    old_value JSONB,
    new_value JSONB,
    diff_details JSONB,
    significance_score FLOAT DEFAULT 0.0 CHECK (significance_score >= 0 AND significance_score <= 1),
    impact_assessment TEXT,
    is_notable BOOLEAN DEFAULT FALSE,
    notification_sent BOOLEAN DEFAULT FALSE,
    detection_method TEXT,
    metadata JSONB DEFAULT '{}',
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    detected_by UUID REFERENCES auth.users(id)
);

-- 枚举类型
CREATE TYPE change_type_enum AS ENUM ('created', 'updated', 'deleted', 'restored', 'archived');

-- 索引
CREATE INDEX idx_data_changes_data_id ON data_changes(data_id);
CREATE INDEX idx_data_changes_type ON data_changes(change_type);
CREATE INDEX idx_data_changes_significance ON data_changes(significance_score DESC);
CREATE INDEX idx_data_changes_changed_at ON data_changes(changed_at DESC);
CREATE INDEX idx_data_changes_notable ON data_changes(is_notable) WHERE is_notable = TRUE;
```

#### 3.2.6 数据质量监控表 / Data Quality Monitoring Table

```sql
-- 数据质量监控表
CREATE TABLE data_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_id UUID REFERENCES competitive_data(id) ON DELETE CASCADE,
    completeness_score FLOAT CHECK (completeness_score >= 0 AND completeness_score <= 1),
    accuracy_score FLOAT CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
    timeliness_score FLOAT CHECK (timeliness_score >= 0 AND timeliness_score <= 1),
    consistency_score FLOAT CHECK (consistency_score >= 0 AND consistency_score <= 1),
    validity_score FLOAT CHECK (validity_score >= 0 AND validity_score <= 1),
    overall_score FLOAT CHECK (overall_score >= 0 AND overall_score <= 1),
    quality_issues JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    validation_errors JSONB DEFAULT '[]',
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checked_by UUID REFERENCES auth.users(id)
);

-- 索引
CREATE INDEX idx_data_quality_data_id ON data_quality_metrics(data_id);
CREATE INDEX idx_data_quality_overall_score ON data_quality_metrics(overall_score DESC);
CREATE INDEX idx_data_quality_checked_at ON data_quality_metrics(checked_at DESC);
```

#### 3.2.7 数据收集任务表 / Data Collection Tasks Table

```sql
-- 数据收集任务表
CREATE TABLE collection_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES data_categories(id) ON DELETE CASCADE,
    data_type_id UUID REFERENCES data_types(id) ON DELETE CASCADE,
    schedule_expression TEXT, -- Cron表达式
    function_name TEXT,
    function_config JSONB DEFAULT '{}',
    retry_config JSONB DEFAULT '{}',
    timeout_seconds INTEGER DEFAULT 300,
    priority INTEGER DEFAULT 1,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    last_run_status task_status,
    last_run_result JSONB,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    total_runs INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 枚举类型
CREATE TYPE task_status AS ENUM ('pending', 'running', 'success', 'failed', 'timeout', 'cancelled');

-- 索引
CREATE INDEX idx_collection_tasks_company ON collection_tasks(company_id);
CREATE INDEX idx_collection_tasks_category ON collection_tasks(category_id);
CREATE INDEX idx_collection_tasks_next_run ON collection_tasks(next_run_at) WHERE is_active = TRUE;
CREATE INDEX idx_collection_tasks_status ON collection_tasks(last_run_status);
CREATE INDEX idx_collection_tasks_active ON collection_tasks(is_active);
```

#### 3.2.8 通知系统表 / Notification System Tables

```sql
-- 通知表
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    priority notification_priority DEFAULT 'medium',
    significance_score FLOAT DEFAULT 0.0,
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 枚举类型
CREATE TYPE notification_type AS ENUM ('data_change', 'system_alert', 'task_completion', 'quality_issue', 'user_mention');
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- 索引
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

#### 3.2.9 用户权限表 / User Permissions Tables

```sql
-- 用户公司访问权限
CREATE TABLE user_company_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    access_level access_level_enum DEFAULT 'read',
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    granted_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, company_id)
);

-- 用户数据分类权限
CREATE TABLE user_category_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES data_categories(id) ON DELETE CASCADE,
    permission_level permission_level_enum DEFAULT 'read',
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    granted_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, category_id)
);

-- 枚举类型
CREATE TYPE access_level_enum AS ENUM ('read', 'write', 'admin');
CREATE TYPE permission_level_enum AS ENUM ('read', 'write', 'admin');

-- 索引
CREATE INDEX idx_user_company_access_user ON user_company_access(user_id);
CREATE INDEX idx_user_company_access_company ON user_company_access(company_id);
CREATE INDEX idx_user_category_permissions_user ON user_category_permissions(user_id);
CREATE INDEX idx_user_category_permissions_category ON user_category_permissions(category_id);
```

## 4. 数据类型定义和Schema / Data Type Definitions and Schema

### 4.1 财务数据 Schema / Financial Data Schema

```json
{
  "type": "object",
  "properties": {
    "quarterly_earnings": {
      "type": "object",
      "properties": {
        "quarter": { "type": "string", "pattern": "^\\d{4}Q[1-4]$" },
        "revenue": { "type": "number", "minimum": 0 },
        "revenue_growth": { "type": "number" },
        "net_income": { "type": "number" },
        "gross_margin": { "type": "number", "minimum": 0, "maximum": 1 },
        "operating_margin": { "type": "number", "minimum": 0, "maximum": 1 },
        "eps": { "type": "number" },
        "revenue_by_segment": {
          "type": "object",
          "additionalProperties": { "type": "number", "minimum": 0 }
        },
        "revenue_by_geography": {
          "type": "object",
          "additionalProperties": { "type": "number", "minimum": 0 }
        },
        "guidance": {
          "type": "object",
          "properties": {
            "revenue_guidance": { "type": "object" },
            "eps_guidance": { "type": "object" }
          }
        }
      },
      "required": ["quarter", "revenue"]
    }
  }
}
```

### 4.2 渠道数据 Schema / Channel Data Schema

```json
{
  "type": "object",
  "properties": {
    "distributor_network": {
      "type": "object",
      "properties": {
        "distributors": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "region": { "type": "string" },
              "country": { "type": "string" },
              "type": { "type": "string", "enum": ["master", "authorized", "partner"] },
              "contact_info": { "type": "object" },
              "website": { "type": "string", "format": "uri" },
              "status": { "type": "string", "enum": ["active", "inactive"] },
              "added_date": { "type": "string", "format": "date" }
            }
          }
        },
        "summary": {
          "type": "object",
          "properties": {
            "total_distributors": { "type": "integer", "minimum": 0 },
            "by_region": { "type": "object" },
            "by_type": { "type": "object" }
          }
        }
      }
    }
  }
}
```

### 4.3 产品数据 Schema / Product Data Schema

```json
{
  "type": "object",
  "properties": {
    "product_release": {
      "type": "object",
      "properties": {
        "product_name": { "type": "string" },
        "version": { "type": "string" },
        "release_date": { "type": "string", "format": "date" },
        "category": { "type": "string" },
        "description": { "type": "string" },
        "key_features": {
          "type": "array",
          "items": { "type": "string" }
        },
        "pricing": {
          "type": "object",
          "properties": {
            "msrp": { "type": "number", "minimum": 0 },
            "currency": { "type": "string", "pattern": "^[A-Z]{3}$" },
            "pricing_tiers": { "type": "array" }
          }
        },
        "availability": {
          "type": "object",
          "properties": {
            "regions": { "type": "array", "items": { "type": "string" } },
            "launch_date": { "type": "string", "format": "date" }
          }
        },
        "technical_specs": { "type": "object" },
        "competitive_comparison": { "type": "object" }
      }
    }
  }
}
```

### 4.4 舆情数据 Schema / Sentiment Data Schema

```json
{
  "type": "object",
  "properties": {
    "sentiment_analysis": {
      "type": "object",
      "properties": {
        "source": { "type": "string", "enum": ["reddit", "twitter", "news", "review"] },
        "content": { "type": "string" },
        "sentiment_score": { "type": "number", "minimum": -1, "maximum": 1 },
        "sentiment_label": { "type": "string", "enum": ["positive", "negative", "neutral"] },
        "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
        "topics": {
          "type": "array",
          "items": { "type": "string" }
        },
        "keywords": {
          "type": "array",
          "items": { "type": "string" }
        },
        "metrics": {
          "type": "object",
          "properties": {
            "engagement": { "type": "integer", "minimum": 0 },
            "reach": { "type": "integer", "minimum": 0 },
            "shares": { "type": "integer", "minimum": 0 },
            "comments": { "type": "integer", "minimum": 0 }
          }
        },
        "author_info": { "type": "object" },
        "published_at": { "type": "string", "format": "date-time" }
      }
    }
  }
}
```

## 5. 数据库函数和存储过程 / Database Functions and Stored Procedures

### 5.1 数据质量计算函数 / Data Quality Calculation Function

```sql
-- 计算数据质量评分
CREATE OR REPLACE FUNCTION calculate_data_quality_score(
    p_data_id UUID
) RETURNS FLOAT AS $$
DECLARE
    v_completeness_score FLOAT;
    v_accuracy_score FLOAT;
    v_timeliness_score FLOAT;
    v_consistency_score FLOAT;
    v_overall_score FLOAT;
    v_data_record competitive_data%ROWTYPE;
BEGIN
    -- 获取数据记录
    SELECT * INTO v_data_record
    FROM competitive_data
    WHERE id = p_data_id;

    -- 计算完整性评分
    v_completeness_score := calculate_completeness_score(v_data_record);
    
    -- 计算准确性评分
    v_accuracy_score := calculate_accuracy_score(v_data_record);
    
    -- 计算及时性评分
    v_timeliness_score := calculate_timeliness_score(v_data_record);
    
    -- 计算一致性评分
    v_consistency_score := calculate_consistency_score(v_data_record);
    
    -- 计算综合评分
    v_overall_score := (
        v_completeness_score * 0.3 +
        v_accuracy_score * 0.3 +
        v_timeliness_score * 0.2 +
        v_consistency_score * 0.2
    );
    
    -- 插入或更新质量指标
    INSERT INTO data_quality_metrics (
        data_id, completeness_score, accuracy_score, 
        timeliness_score, consistency_score, overall_score
    ) VALUES (
        p_data_id, v_completeness_score, v_accuracy_score,
        v_timeliness_score, v_consistency_score, v_overall_score
    )
    ON CONFLICT (data_id) DO UPDATE SET
        completeness_score = EXCLUDED.completeness_score,
        accuracy_score = EXCLUDED.accuracy_score,
        timeliness_score = EXCLUDED.timeliness_score,
        consistency_score = EXCLUDED.consistency_score,
        overall_score = EXCLUDED.overall_score,
        checked_at = NOW();
    
    RETURN v_overall_score;
END;
$$ LANGUAGE plpgsql;
```

### 5.2 变化检测函数 / Change Detection Function

```sql
-- 检测数据变化
CREATE OR REPLACE FUNCTION detect_data_changes() RETURNS TRIGGER AS $$
DECLARE
    v_change_type TEXT;
    v_significance_score FLOAT;
    v_field_name TEXT;
    v_old_value JSONB;
    v_new_value JSONB;
BEGIN
    -- 确定变化类型
    IF TG_OP = 'INSERT' THEN
        v_change_type := 'created';
        v_significance_score := 0.8;
    ELSIF TG_OP = 'UPDATE' THEN
        v_change_type := 'updated';
        v_significance_score := calculate_change_significance(OLD, NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_change_type := 'deleted';
        v_significance_score := 0.9;
    END IF;
    
    -- 记录变化
    INSERT INTO data_changes (
        data_id,
        change_type,
        old_value,
        new_value,
        significance_score,
        is_notable
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        v_change_type::change_type_enum,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::JSONB ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW)::JSONB ELSE NULL END,
        v_significance_score,
        v_significance_score > 0.5
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 为 competitive_data 表创建触发器
CREATE TRIGGER trigger_detect_data_changes
    AFTER INSERT OR UPDATE OR DELETE ON competitive_data
    FOR EACH ROW EXECUTE FUNCTION detect_data_changes();
```

### 5.3 跨维度分析函数 / Cross-dimensional Analysis Function

```sql
-- 跨维度分析
CREATE OR REPLACE FUNCTION get_cross_dimension_analysis(
    p_company_id UUID,
    p_dimension_ids UUID[],
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
) RETURNS JSON AS $$
DECLARE
    v_result JSON;
    v_dimension_data JSON;
    v_correlations JSON;
    v_insights JSON;
BEGIN
    -- 获取多维度数据
    SELECT json_agg(
        json_build_object(
            'category', dc.display_name_en,
            'data', cd.processed_data,
            'timestamp', cd.collected_at,
            'confidence', cd.confidence_score
        )
    ) INTO v_dimension_data
    FROM competitive_data cd
    JOIN data_categories dc ON cd.category_id = dc.id
    WHERE cd.company_id = p_company_id
    AND cd.category_id = ANY(p_dimension_ids)
    AND cd.collected_at BETWEEN p_start_date AND p_end_date
    AND cd.is_active = TRUE;
    
    -- 计算相关性
    v_correlations := calculate_dimension_correlations(p_company_id, p_dimension_ids, p_start_date, p_end_date);
    
    -- 生成洞察
    v_insights := generate_cross_dimension_insights(p_company_id, p_dimension_ids, p_start_date, p_end_date);
    
    -- 构建结果
    v_result := json_build_object(
        'company_id', p_company_id,
        'analysis_period', json_build_object(
            'start', p_start_date,
            'end', p_end_date
        ),
        'dimensions', v_dimension_data,
        'correlations', v_correlations,
        'insights', v_insights,
        'generated_at', NOW()
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

## 6. 数据库性能优化 / Database Performance Optimization

### 6.1 索引策略 / Index Strategy

```sql
-- 复合索引优化
CREATE INDEX idx_competitive_data_company_category_time 
ON competitive_data(company_id, category_id, collected_at DESC);

-- 部分索引
CREATE INDEX idx_competitive_data_active_recent 
ON competitive_data(company_id, collected_at DESC) 
WHERE is_active = TRUE AND collected_at > NOW() - INTERVAL '30 days';

-- 表达式索引
CREATE INDEX idx_competitive_data_processed_data_keywords 
ON competitive_data USING GIN((processed_data->'keywords'));

-- 并发索引创建
CREATE INDEX CONCURRENTLY idx_competitive_data_quality_score 
ON competitive_data(quality_score DESC) 
WHERE quality_score > 0.8;
```

### 6.2 查询优化 / Query Optimization

```sql
-- 物化视图：竞品概览
CREATE MATERIALIZED VIEW mv_company_overview AS
SELECT 
    c.id,
    c.name,
    c.industry,
    COUNT(cd.id) as total_data_points,
    AVG(cd.quality_score) as avg_quality_score,
    MAX(cd.collected_at) as last_update,
    json_agg(DISTINCT dc.name) as tracked_dimensions
FROM companies c
LEFT JOIN competitive_data cd ON c.id = cd.company_id
LEFT JOIN data_categories dc ON cd.category_id = dc.id
WHERE c.status = 'active'
GROUP BY c.id, c.name, c.industry;

-- 刷新物化视图的函数
CREATE OR REPLACE FUNCTION refresh_company_overview() RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_company_overview;
END;
$$ LANGUAGE plpgsql;

-- 定期刷新任务
SELECT cron.schedule('refresh-company-overview', '0 */6 * * *', 'SELECT refresh_company_overview();');
```

### 6.3 分区表策略 / Partitioning Strategy

```sql
-- 为历史数据创建分区
CREATE TABLE competitive_data_y2024 PARTITION OF competitive_data
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- 自动分区创建函数
CREATE OR REPLACE FUNCTION create_monthly_partitions() RETURNS VOID AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
    v_partition_name TEXT;
BEGIN
    -- 创建下个月的分区
    v_start_date := date_trunc('month', NOW() + INTERVAL '1 month');
    v_end_date := v_start_date + INTERVAL '1 month';
    v_partition_name := 'competitive_data_y' || EXTRACT(YEAR FROM v_start_date) || 'm' || LPAD(EXTRACT(MONTH FROM v_start_date)::text, 2, '0');
    
    EXECUTE format('CREATE TABLE %I PARTITION OF competitive_data FOR VALUES FROM (%L) TO (%L)', 
                   v_partition_name, v_start_date, v_end_date);
END;
$$ LANGUAGE plpgsql;
```

## 7. 数据安全和权限控制 / Data Security and Access Control

### 7.1 行级安全策略 / Row Level Security Policies

```sql
-- 启用行级安全
ALTER TABLE competitive_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 公司访问权限策略
CREATE POLICY "Users can only access authorized companies" ON companies
    FOR ALL
    USING (
        id IN (
            SELECT company_id 
            FROM user_company_access 
            WHERE user_id = auth.uid() 
            AND is_active = TRUE
            AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

-- 竞品数据访问权限策略
CREATE POLICY "Users can only access authorized competitive data" ON competitive_data
    FOR ALL
    USING (
        company_id IN (
            SELECT company_id 
            FROM user_company_access 
            WHERE user_id = auth.uid() 
            AND is_active = TRUE
            AND (expires_at IS NULL OR expires_at > NOW())
        )
        AND category_id IN (
            SELECT category_id 
            FROM user_category_permissions 
            WHERE user_id = auth.uid() 
            AND is_active = TRUE
            AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

-- 数据分类权限策略
CREATE POLICY "Data category access control" ON competitive_data
    FOR ALL
    USING (
        category_id IN (
            SELECT category_id 
            FROM user_category_permissions 
            WHERE user_id = auth.uid() 
            AND permission_level IN ('read', 'write', 'admin')
            AND is_active = TRUE
        )
    );
```

### 7.2 数据加密和审计 / Data Encryption and Auditing

```sql
-- 审计日志表
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- 审计触发器函数
CREATE OR REPLACE FUNCTION audit_trigger_function() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id, action, table_name, record_id, 
        old_values, new_values, ip_address
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::JSONB ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW)::JSONB ELSE NULL END,
        inet_client_addr()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 为敏感表创建审计触发器
CREATE TRIGGER audit_companies
    AFTER INSERT OR UPDATE OR DELETE ON companies
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_competitive_data
    AFTER INSERT OR UPDATE OR DELETE ON competitive_data
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

## 8. 数据备份和恢复策略 / Data Backup and Recovery Strategy

### 8.1 备份策略 / Backup Strategy

```sql
-- 创建备份配置表
CREATE TABLE backup_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    backup_type TEXT NOT NULL, -- 'full', 'incremental', 'differential'
    schedule_expression TEXT,
    retention_period INTERVAL,
    storage_location TEXT,
    encryption_enabled BOOLEAN DEFAULT TRUE,
    compression_enabled BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 备份历史表
CREATE TABLE backup_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    configuration_id UUID REFERENCES backup_configurations(id),
    backup_type TEXT NOT NULL,
    backup_size BIGINT,
    backup_location TEXT,
    checksum TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL, -- 'success', 'failed', 'in_progress'
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);
```

### 8.2 数据恢复函数 / Data Recovery Functions

```sql
-- 数据恢复函数
CREATE OR REPLACE FUNCTION restore_data_from_backup(
    p_backup_id UUID,
    p_target_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_backup_info backup_history%ROWTYPE;
    v_success BOOLEAN := FALSE;
BEGIN
    -- 获取备份信息
    SELECT * INTO v_backup_info
    FROM backup_history
    WHERE id = p_backup_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Backup not found: %', p_backup_id;
    END IF;
    
    -- 执行恢复逻辑
    -- 这里是示例，实际实现需要根据备份类型和存储位置来处理
    
    RETURN v_success;
END;
$$ LANGUAGE plpgsql;
```

## 9. 监控和维护 / Monitoring and Maintenance

### 9.1 数据库监控 / Database Monitoring

```sql
-- 创建监控视图
CREATE VIEW v_database_health AS
SELECT 
    'competitive_data' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as recent_records,
    AVG(quality_score) as avg_quality_score,
    MAX(collected_at) as last_collection,
    pg_size_pretty(pg_total_relation_size('competitive_data')) as table_size
FROM competitive_data
UNION ALL
SELECT 
    'companies' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as recent_records,
    NULL as avg_quality_score,
    MAX(updated_at) as last_collection,
    pg_size_pretty(pg_total_relation_size('companies')) as table_size
FROM companies;

-- 性能监控函数
CREATE OR REPLACE FUNCTION get_slow_queries() RETURNS TABLE (
    query TEXT,
    calls BIGINT,
    total_time DOUBLE PRECISION,
    avg_time DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pg_stat_statements.query,
        pg_stat_statements.calls,
        pg_stat_statements.total_exec_time,
        pg_stat_statements.mean_exec_time
    FROM pg_stat_statements
    ORDER BY pg_stat_statements.mean_exec_time DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;
```

### 9.2 自动维护任务 / Automated Maintenance Tasks

```sql
-- 数据清理函数
CREATE OR REPLACE FUNCTION cleanup_old_data() RETURNS VOID AS $$
BEGIN
    -- 删除过期的数据
    DELETE FROM competitive_data 
    WHERE expires_at < NOW();
    
    -- 删除过期的通知
    DELETE FROM notifications 
    WHERE expires_at < NOW();
    
    -- 删除旧的审计日志（保留1年）
    DELETE FROM audit_logs 
    WHERE timestamp < NOW() - INTERVAL '1 year';
    
    -- 清理质量监控数据（保留6个月）
    DELETE FROM data_quality_metrics 
    WHERE checked_at < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;

-- 定期清理任务
SELECT cron.schedule('cleanup-old-data', '0 2 * * *', 'SELECT cleanup_old_data();');

-- 统计信息更新
SELECT cron.schedule('update-statistics', '0 3 * * *', 'ANALYZE;');

-- 重建索引
SELECT cron.schedule('reindex-tables', '0 4 * * 0', 'REINDEX DATABASE CONCURRENTLY;');
```

## 10. 总结 / Summary

这个数据库架构设计提供了：

1. **多维度数据支持**: 统一的数据模型支持财务、渠道、产品、舆情等多种数据类型
2. **高性能**: 通过索引优化、分区表、物化视图等技术确保查询性能
3. **数据质量**: 内置数据质量评分和监控机制
4. **安全性**: 行级安全策略和审计日志保障数据安全
5. **可扩展性**: 灵活的架构设计支持新数据类型和维度的添加
6. **实时性**: 支持实时数据更新和变化检测
7. **可靠性**: 完善的备份恢复和监控维护机制

这个架构为构建一个强大的竞品洞察平台提供了坚实的数据基础。