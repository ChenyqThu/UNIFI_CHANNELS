-- ====================================================================
-- Supabase 数据库架构 SQL 脚本
-- 用于创建多维度竞争情报平台的数据库结构
-- ====================================================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 1. 核心数据表
-- ====================================================================

-- 1.1 公司表
CREATE TABLE companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    website_url TEXT,
    industry VARCHAR(100),
    description TEXT,
    logo_url TEXT,
    market_cap DECIMAL(15,2),
    employees_count INTEGER,
    headquarters VARCHAR(255),
    founded_year INTEGER,
    ticker_symbol VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_active ON companies(is_active);
CREATE INDEX idx_companies_ticker ON companies(ticker_symbol);

-- 1.2 多维度竞争数据表
CREATE TABLE competitive_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- 'financial', 'channels', 'products', 'sentiment', 'patents', 'personnel', 'market', 'technology'
    data_type VARCHAR(100) NOT NULL, -- 具体数据类型
    data_value JSONB NOT NULL, -- 存储实际数据
    confidence_score DECIMAL(3,2) DEFAULT 0.95 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    quality_score DECIMAL(3,2) DEFAULT 0.90 CHECK (quality_score >= 0 AND quality_score <= 1),
    significance_score DECIMAL(3,2) DEFAULT 0.50 CHECK (significance_score >= 0 AND significance_score <= 1),
    source_url TEXT,
    data_source VARCHAR(100) NOT NULL, -- 数据来源
    collection_method VARCHAR(50) DEFAULT 'automated', -- 'automated', 'manual', 'api'
    collection_frequency VARCHAR(20) DEFAULT 'daily', -- 'realtime', 'hourly', 'daily', 'weekly'
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_competitive_data_company ON competitive_data(company_id);
CREATE INDEX idx_competitive_data_category ON competitive_data(category);
CREATE INDEX idx_competitive_data_type ON competitive_data(data_type);
CREATE INDEX idx_competitive_data_significance ON competitive_data(significance_score);
CREATE INDEX idx_competitive_data_quality ON competitive_data(quality_score);
CREATE INDEX idx_competitive_data_created ON competitive_data(created_at);
CREATE INDEX idx_competitive_data_source ON competitive_data(data_source);
CREATE INDEX idx_competitive_data_expires ON competitive_data(expires_at);

-- 1.3 分销商表
CREATE TABLE distributors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    unifi_id INTEGER UNIQUE, -- 官方 Unifi ID
    partner_type VARCHAR(20) NOT NULL CHECK (partner_type IN ('master', 'simple')),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(50),
    contact_email VARCHAR(255),
    region VARCHAR(10),
    country_state VARCHAR(10),
    country_code VARCHAR(3),
    is_active BOOLEAN DEFAULT TRUE,
    logo_url TEXT,
    sunmax_partner BOOLEAN DEFAULT FALSE,
    data_source VARCHAR(20) DEFAULT 'json_api',
    scraped_at TIMESTAMP WITH TIME ZONE,
    last_modified_at TIMESTAMP WITH TIME ZONE,
    order_weight INTEGER DEFAULT 0,
    certification_level VARCHAR(20),
    annual_revenue DECIMAL(15,2),
    employee_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_distributors_company ON distributors(company_id);
CREATE INDEX idx_distributors_unifi_id ON distributors(unifi_id);
CREATE INDEX idx_distributors_region ON distributors(region);
CREATE INDEX idx_distributors_type ON distributors(partner_type);
CREATE INDEX idx_distributors_active ON distributors(is_active);
CREATE INDEX idx_distributors_location ON distributors(latitude, longitude);
CREATE INDEX idx_distributors_country ON distributors(country_code);
CREATE INDEX idx_distributors_scraped ON distributors(scraped_at);

-- 1.4 财报数据表
CREATE TABLE financial_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('quarterly', 'annual', 'interim')),
    period VARCHAR(20) NOT NULL, -- 'Q1_2025', '2024', etc.
    fiscal_year INTEGER NOT NULL,
    quarter INTEGER CHECK (quarter >= 1 AND quarter <= 4), -- 1-4 for quarterly reports
    revenue_data JSONB NOT NULL,
    profitability_data JSONB NOT NULL,
    regional_breakdown JSONB,
    business_segments JSONB,
    key_metrics JSONB,
    channel_strategy JSONB,
    strategic_risks JSONB,
    filing_date DATE,
    report_url TEXT,
    analyst_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_financial_reports_company ON financial_reports(company_id);
CREATE INDEX idx_financial_reports_period ON financial_reports(period);
CREATE INDEX idx_financial_reports_fiscal_year ON financial_reports(fiscal_year);
CREATE INDEX idx_financial_reports_type ON financial_reports(report_type);
CREATE INDEX idx_financial_reports_filing_date ON financial_reports(filing_date);
CREATE UNIQUE INDEX idx_financial_reports_unique ON financial_reports(company_id, report_type, period);

-- 1.5 数据变更历史表
CREATE TABLE data_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('created', 'updated', 'deleted')),
    old_data JSONB,
    new_data JSONB,
    significance_score DECIMAL(3,2) DEFAULT 0.50 CHECK (significance_score >= 0 AND significance_score <= 1),
    impact_assessment TEXT,
    change_summary TEXT,
    automated_alert BOOLEAN DEFAULT FALSE,
    user_id UUID, -- 如果是手动更改
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_data_changes_table ON data_changes(table_name);
CREATE INDEX idx_data_changes_record ON data_changes(record_id);
CREATE INDEX idx_data_changes_type ON data_changes(change_type);
CREATE INDEX idx_data_changes_significance ON data_changes(significance_score);
CREATE INDEX idx_data_changes_detected ON data_changes(detected_at);
CREATE INDEX idx_data_changes_user ON data_changes(user_id);

-- 1.6 数据质量指标表
CREATE TABLE data_quality_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('completeness', 'accuracy', 'timeliness', 'consistency')),
    metric_value DECIMAL(5,4) NOT NULL CHECK (metric_value >= 0 AND metric_value <= 1),
    measurement_date DATE NOT NULL,
    details JSONB,
    threshold_min DECIMAL(5,4) DEFAULT 0.80,
    threshold_max DECIMAL(5,4) DEFAULT 1.00,
    is_within_threshold BOOLEAN GENERATED ALWAYS AS (metric_value >= threshold_min AND metric_value <= threshold_max) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_quality_metrics_table ON data_quality_metrics(table_name);
CREATE INDEX idx_quality_metrics_type ON data_quality_metrics(metric_type);
CREATE INDEX idx_quality_metrics_date ON data_quality_metrics(measurement_date);
CREATE INDEX idx_quality_metrics_threshold ON data_quality_metrics(is_within_threshold);

-- 1.7 用户权限表
CREATE TABLE user_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    data_category VARCHAR(50) NOT NULL,
    permission_level VARCHAR(20) NOT NULL CHECK (permission_level IN ('read', 'write', 'admin')),
    granted_by UUID,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_company ON user_permissions(company_id);
CREATE INDEX idx_user_permissions_category ON user_permissions(data_category);
CREATE INDEX idx_user_permissions_active ON user_permissions(is_active);
CREATE INDEX idx_user_permissions_expires ON user_permissions(expires_at);

-- 1.8 通知表
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data_payload JSONB,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_company ON notifications(company_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- ====================================================================
-- 2. 触发器和函数
-- ====================================================================

-- 2.1 自动更新时间戳函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用到相关表
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitive_data_updated_at 
    BEFORE UPDATE ON competitive_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_distributors_updated_at 
    BEFORE UPDATE ON distributors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_reports_updated_at 
    BEFORE UPDATE ON financial_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2.2 数据变更跟踪函数
CREATE OR REPLACE FUNCTION track_data_changes()
RETURNS TRIGGER AS $$
DECLARE
    significance DECIMAL(3,2) := 0.50;
    summary TEXT;
BEGIN
    -- 计算变更重要性
    IF TG_TABLE_NAME = 'financial_reports' THEN
        significance := 0.90;
    ELSIF TG_TABLE_NAME = 'distributors' THEN
        significance := 0.70;
    ELSIF TG_TABLE_NAME = 'competitive_data' THEN
        significance := 0.60;
    END IF;

    -- 生成变更摘要
    IF TG_OP = 'INSERT' THEN
        summary := format('新增 %s 记录', TG_TABLE_NAME);
        INSERT INTO data_changes (table_name, record_id, change_type, new_data, significance_score, change_summary)
        VALUES (TG_TABLE_NAME, NEW.id, 'created', to_jsonb(NEW), significance, summary);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        summary := format('更新 %s 记录', TG_TABLE_NAME);
        INSERT INTO data_changes (table_name, record_id, change_type, old_data, new_data, significance_score, change_summary)
        VALUES (TG_TABLE_NAME, NEW.id, 'updated', to_jsonb(OLD), to_jsonb(NEW), significance, summary);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        summary := format('删除 %s 记录', TG_TABLE_NAME);
        INSERT INTO data_changes (table_name, record_id, change_type, old_data, significance_score, change_summary)
        VALUES (TG_TABLE_NAME, OLD.id, 'deleted', to_jsonb(OLD), significance, summary);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 应用到相关表
CREATE TRIGGER track_companies_changes 
    AFTER INSERT OR UPDATE OR DELETE ON companies
    FOR EACH ROW EXECUTE FUNCTION track_data_changes();

CREATE TRIGGER track_distributors_changes 
    AFTER INSERT OR UPDATE OR DELETE ON distributors
    FOR EACH ROW EXECUTE FUNCTION track_data_changes();

CREATE TRIGGER track_financial_reports_changes 
    AFTER INSERT OR UPDATE OR DELETE ON financial_reports
    FOR EACH ROW EXECUTE FUNCTION track_data_changes();

CREATE TRIGGER track_competitive_data_changes 
    AFTER INSERT OR UPDATE OR DELETE ON competitive_data
    FOR EACH ROW EXECUTE FUNCTION track_data_changes();

-- ====================================================================
-- 3. 行级安全策略 (RLS)
-- ====================================================================

-- 启用 RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitive_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 公司数据访问策略
CREATE POLICY "Users can view companies they have permission for" ON companies
    FOR SELECT USING (
        id IN (
            SELECT company_id FROM user_permissions 
            WHERE user_id = auth.uid() 
            AND is_active = TRUE
            AND (expires_at IS NULL OR expires_at > NOW())
            AND permission_level IN ('read', 'write', 'admin')
        )
    );

-- 竞争数据访问策略
CREATE POLICY "Users can view competitive data for permitted companies" ON competitive_data
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_permissions 
            WHERE user_id = auth.uid() 
            AND is_active = TRUE
            AND (expires_at IS NULL OR expires_at > NOW())
            AND permission_level IN ('read', 'write', 'admin')
        )
    );

-- 分销商数据访问策略
CREATE POLICY "Users can view distributors for permitted companies" ON distributors
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_permissions 
            WHERE user_id = auth.uid() 
            AND is_active = TRUE
            AND (expires_at IS NULL OR expires_at > NOW())
            AND permission_level IN ('read', 'write', 'admin')
        )
    );

-- 财报数据访问策略
CREATE POLICY "Users can view financial reports for permitted companies" ON financial_reports
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_permissions 
            WHERE user_id = auth.uid() 
            AND is_active = TRUE
            AND (expires_at IS NULL OR expires_at > NOW())
            AND permission_level IN ('read', 'write', 'admin')
        )
    );

-- 通知访问策略
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- ====================================================================
-- 4. 实用函数
-- ====================================================================

-- 4.1 数据质量评分函数
CREATE OR REPLACE FUNCTION calculate_data_quality_score(
    p_completeness DECIMAL,
    p_accuracy DECIMAL,
    p_timeliness DECIMAL,
    p_consistency DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN (
        p_completeness * 0.3 + 
        p_accuracy * 0.4 + 
        p_timeliness * 0.2 + 
        p_consistency * 0.1
    );
END;
$$ LANGUAGE plpgsql;

-- 4.2 获取公司竞争数据函数
CREATE OR REPLACE FUNCTION get_company_competitive_data(
    p_company_id UUID,
    p_category VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 100
) RETURNS TABLE (
    id UUID,
    category VARCHAR,
    data_type VARCHAR,
    data_value JSONB,
    confidence_score DECIMAL,
    quality_score DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cd.id,
        cd.category,
        cd.data_type,
        cd.data_value,
        cd.confidence_score,
        cd.quality_score,
        cd.created_at
    FROM competitive_data cd
    WHERE cd.company_id = p_company_id
    AND (p_category IS NULL OR cd.category = p_category)
    AND (cd.expires_at IS NULL OR cd.expires_at > NOW())
    ORDER BY cd.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 4.3 获取分销商统计函数
CREATE OR REPLACE FUNCTION get_distributor_statistics(
    p_company_id UUID DEFAULT NULL
) RETURNS TABLE (
    total_count INTEGER,
    active_count INTEGER,
    master_count INTEGER,
    simple_count INTEGER,
    regions JSONB,
    countries JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_count,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END)::INTEGER as active_count,
        COUNT(CASE WHEN partner_type = 'master' AND is_active = TRUE THEN 1 END)::INTEGER as master_count,
        COUNT(CASE WHEN partner_type = 'simple' AND is_active = TRUE THEN 1 END)::INTEGER as simple_count,
        json_agg(DISTINCT region) FILTER (WHERE region IS NOT NULL) as regions,
        json_agg(DISTINCT country_code) FILTER (WHERE country_code IS NOT NULL) as countries
    FROM distributors
    WHERE (p_company_id IS NULL OR company_id = p_company_id);
END;
$$ LANGUAGE plpgsql;

-- 4.4 获取最新财报数据函数
CREATE OR REPLACE FUNCTION get_latest_financial_report(
    p_company_id UUID,
    p_report_type VARCHAR DEFAULT 'quarterly'
) RETURNS TABLE (
    id UUID,
    period VARCHAR,
    fiscal_year INTEGER,
    quarter INTEGER,
    revenue_data JSONB,
    profitability_data JSONB,
    regional_breakdown JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fr.id,
        fr.period,
        fr.fiscal_year,
        fr.quarter,
        fr.revenue_data,
        fr.profitability_data,
        fr.regional_breakdown,
        fr.created_at
    FROM financial_reports fr
    WHERE fr.company_id = p_company_id
    AND fr.report_type = p_report_type
    ORDER BY fr.fiscal_year DESC, fr.quarter DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 5. 视图
-- ====================================================================

-- 5.1 活跃分销商视图
CREATE VIEW active_distributors AS
SELECT 
    d.*,
    c.name as company_name,
    c.website_url as company_website
FROM distributors d
JOIN companies c ON d.company_id = c.id
WHERE d.is_active = TRUE;

-- 5.2 最新财报视图
CREATE VIEW latest_financial_reports AS
SELECT DISTINCT ON (company_id, report_type)
    fr.*,
    c.name as company_name
FROM financial_reports fr
JOIN companies c ON fr.company_id = c.id
ORDER BY company_id, report_type, fiscal_year DESC, quarter DESC;

-- 5.3 数据质量仪表板视图
CREATE VIEW data_quality_dashboard AS
SELECT 
    table_name,
    metric_type,
    AVG(metric_value) as average_score,
    MIN(metric_value) as min_score,
    MAX(metric_value) as max_score,
    COUNT(*) as measurement_count,
    COUNT(CASE WHEN is_within_threshold = FALSE THEN 1 END) as failed_measurements
FROM data_quality_metrics
WHERE measurement_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY table_name, metric_type;

-- ====================================================================
-- 6. 初始数据
-- ====================================================================

-- 插入 Ubiquiti 作为默认公司
INSERT INTO companies (name, website_url, industry, description, headquarters, ticker_symbol)
VALUES (
    'Ubiquiti Inc.',
    'https://www.ui.com',
    'Technology',
    'Leading provider of enterprise WiFi, broadband, and surveillance solutions',
    'New York, NY',
    'UI'
) ON CONFLICT (name) DO NOTHING;

-- 插入数据类别定义
INSERT INTO competitive_data (company_id, category, data_type, data_value, data_source, collection_method)
SELECT 
    c.id,
    'system',
    'data_categories',
    '["financial", "channels", "products", "sentiment", "patents", "personnel", "market", "technology"]'::jsonb,
    'system',
    'manual'
FROM companies c
WHERE c.name = 'Ubiquiti Inc.'
ON CONFLICT DO NOTHING;

-- 设置发布表用于实时订阅
ALTER publication supabase_realtime ADD TABLE competitive_data;
ALTER publication supabase_realtime ADD TABLE distributors;
ALTER publication supabase_realtime ADD TABLE financial_reports;
ALTER publication supabase_realtime ADD TABLE data_changes;
ALTER publication supabase_realtime ADD TABLE notifications;

-- ====================================================================
-- 完成信息
-- ====================================================================

-- 显示创建的表
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('companies', 'competitive_data', 'distributors', 'financial_reports', 'data_changes', 'data_quality_metrics', 'user_permissions', 'notifications')
ORDER BY tablename;