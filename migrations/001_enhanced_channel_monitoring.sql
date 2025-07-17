-- ====================================================================
-- Enhanced Channel Monitoring Migration
-- 增强渠道监控数据库迁移脚本
-- ====================================================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 1. 增强 distributors 表结构
-- ====================================================================

-- 添加生命周期跟踪字段
ALTER TABLE distributors ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE distributors ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE distributors ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE distributors ADD COLUMN IF NOT EXISTS status_change_reason TEXT;
ALTER TABLE distributors ADD COLUMN IF NOT EXISTS scraping_session_id UUID;

-- 更新现有记录的默认值
UPDATE distributors SET 
    first_seen_at = created_at,
    last_seen_at = updated_at
WHERE first_seen_at IS NULL OR last_seen_at IS NULL;

-- 添加新的索引
CREATE INDEX IF NOT EXISTS idx_distributors_first_seen ON distributors(first_seen_at);
CREATE INDEX IF NOT EXISTS idx_distributors_last_seen ON distributors(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_distributors_deactivated ON distributors(deactivated_at);
CREATE INDEX IF NOT EXISTS idx_distributors_session ON distributors(scraping_session_id);

-- ====================================================================
-- 2. 创建渠道监控会话表
-- ====================================================================

CREATE TABLE IF NOT EXISTS channel_monitoring_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    total_found INTEGER DEFAULT 0,
    new_channels INTEGER DEFAULT 0,
    updated_channels INTEGER DEFAULT 0,
    deactivated_channels INTEGER DEFAULT 0,
    reactivated_channels INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    error_message TEXT,
    data_source VARCHAR(50) DEFAULT 'api_scraping',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_sessions_status ON channel_monitoring_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_start ON channel_monitoring_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_sessions_source ON channel_monitoring_sessions(data_source);

-- ====================================================================
-- 3. 创建渠道生命周期事件表
-- ====================================================================

CREATE TABLE IF NOT EXISTS channel_lifecycle_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distributor_id UUID REFERENCES distributors(id) ON DELETE CASCADE,
    unifi_id INTEGER, -- 冗余字段，便于查询
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('discovered', 'updated', 'deactivated', 'reactivated')),
    event_data JSONB,
    old_data JSONB,
    new_data JSONB,
    session_id UUID REFERENCES channel_monitoring_sessions(id),
    significance_score DECIMAL(3,2) DEFAULT 0.50 CHECK (significance_score >= 0 AND significance_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_lifecycle_distributor ON channel_lifecycle_events(distributor_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_unifi_id ON channel_lifecycle_events(unifi_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_event_type ON channel_lifecycle_events(event_type);
CREATE INDEX IF NOT EXISTS idx_lifecycle_session ON channel_lifecycle_events(session_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_created ON channel_lifecycle_events(created_at);
CREATE INDEX IF NOT EXISTS idx_lifecycle_significance ON channel_lifecycle_events(significance_score);

-- ====================================================================
-- 4. 创建渠道统计汇总表
-- ====================================================================

CREATE TABLE IF NOT EXISTS channel_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_channels INTEGER DEFAULT 0,
    active_channels INTEGER DEFAULT 0,
    inactive_channels INTEGER DEFAULT 0,
    new_channels INTEGER DEFAULT 0,
    deactivated_channels INTEGER DEFAULT 0,
    reactivated_channels INTEGER DEFAULT 0,
    master_distributors INTEGER DEFAULT 0,
    simple_distributors INTEGER DEFAULT 0,
    regions_data JSONB,
    countries_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引和约束
CREATE UNIQUE INDEX IF NOT EXISTS idx_channel_stats_date ON channel_statistics(date);
CREATE INDEX IF NOT EXISTS idx_channel_stats_total ON channel_statistics(total_channels);
CREATE INDEX IF NOT EXISTS idx_channel_stats_active ON channel_statistics(active_channels);

-- ====================================================================
-- 5. 创建数据处理函数
-- ====================================================================

-- 5.1 创建监控会话
CREATE OR REPLACE FUNCTION create_monitoring_session(
    p_data_source VARCHAR DEFAULT 'api_scraping',
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    INSERT INTO channel_monitoring_sessions (data_source, metadata)
    VALUES (p_data_source, p_metadata)
    RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- 5.2 完成监控会话
CREATE OR REPLACE FUNCTION complete_monitoring_session(
    p_session_id UUID,
    p_status VARCHAR DEFAULT 'completed',
    p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE channel_monitoring_sessions 
    SET 
        session_end = NOW(),
        status = p_status,
        error_message = p_error_message,
        updated_at = NOW()
    WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- 5.3 记录生命周期事件
CREATE OR REPLACE FUNCTION log_lifecycle_event(
    p_distributor_id UUID,
    p_unifi_id INTEGER,
    p_event_type VARCHAR,
    p_event_data JSONB DEFAULT '{}'::jsonb,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_session_id UUID DEFAULT NULL,
    p_significance_score DECIMAL DEFAULT 0.50
) RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO channel_lifecycle_events (
        distributor_id, unifi_id, event_type, event_data, 
        old_data, new_data, session_id, significance_score
    ) VALUES (
        p_distributor_id, p_unifi_id, p_event_type, p_event_data,
        p_old_data, p_new_data, p_session_id, p_significance_score
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- 5.4 智能更新渠道信息
CREATE OR REPLACE FUNCTION upsert_channel_data(
    p_unifi_id INTEGER,
    p_channel_data JSONB,
    p_session_id UUID
) RETURNS TABLE (
    distributor_id UUID,
    is_new BOOLEAN,
    has_changes BOOLEAN,
    changes JSONB
) AS $$
DECLARE
    existing_record RECORD;
    new_id UUID;
    changes_detected JSONB := '{}'::jsonb;
    is_new_channel BOOLEAN := FALSE;
    has_meaningful_changes BOOLEAN := FALSE;
BEGIN
    -- 查找现有记录
    SELECT * INTO existing_record 
    FROM distributors 
    WHERE unifi_id = p_unifi_id;
    
    IF existing_record IS NULL THEN
        -- 新渠道
        INSERT INTO distributors (
            unifi_id, name, address, phone, contact_email, 
            region, country_state, country_code, partner_type,
            latitude, longitude, is_active, 
            first_seen_at, last_seen_at, scraping_session_id
        ) VALUES (
            p_unifi_id,
            (p_channel_data->>'name')::VARCHAR,
            (p_channel_data->>'address')::TEXT,
            (p_channel_data->>'phone')::VARCHAR,
            (p_channel_data->>'contact_email')::VARCHAR,
            (p_channel_data->>'region')::VARCHAR,
            (p_channel_data->>'country_state')::VARCHAR,
            (p_channel_data->>'country_code')::VARCHAR,
            (p_channel_data->>'partner_type')::VARCHAR,
            (p_channel_data->>'latitude')::DECIMAL,
            (p_channel_data->>'longitude')::DECIMAL,
            TRUE,
            NOW(), NOW(), p_session_id
        ) RETURNING id INTO new_id;
        
        -- 记录发现事件
        PERFORM log_lifecycle_event(
            new_id, p_unifi_id, 'discovered', p_channel_data, 
            NULL, p_channel_data, p_session_id, 0.80
        );
        
        is_new_channel := TRUE;
        distributor_id := new_id;
        
    ELSE
        -- 现有渠道 - 检查变更
        SELECT jsonb_object_agg(key, value) INTO changes_detected
        FROM jsonb_each(p_channel_data)
        WHERE key IN ('name', 'address', 'phone', 'contact_email', 'region', 'country_state', 'country_code', 'partner_type', 'latitude', 'longitude')
        AND value IS DISTINCT FROM (
            CASE key
                WHEN 'name' THEN to_jsonb(existing_record.name)
                WHEN 'address' THEN to_jsonb(existing_record.address)
                WHEN 'phone' THEN to_jsonb(existing_record.phone)
                WHEN 'contact_email' THEN to_jsonb(existing_record.contact_email)
                WHEN 'region' THEN to_jsonb(existing_record.region)
                WHEN 'country_state' THEN to_jsonb(existing_record.country_state)
                WHEN 'country_code' THEN to_jsonb(existing_record.country_code)
                WHEN 'partner_type' THEN to_jsonb(existing_record.partner_type)
                WHEN 'latitude' THEN to_jsonb(existing_record.latitude)
                WHEN 'longitude' THEN to_jsonb(existing_record.longitude)
            END
        );
        
        has_meaningful_changes := (changes_detected != '{}'::jsonb);
        
        -- 更新记录
        UPDATE distributors SET
            name = (p_channel_data->>'name')::VARCHAR,
            address = (p_channel_data->>'address')::TEXT,
            phone = (p_channel_data->>'phone')::VARCHAR,
            contact_email = (p_channel_data->>'contact_email')::VARCHAR,
            region = (p_channel_data->>'region')::VARCHAR,
            country_state = (p_channel_data->>'country_state')::VARCHAR,
            country_code = (p_channel_data->>'country_code')::VARCHAR,
            partner_type = (p_channel_data->>'partner_type')::VARCHAR,
            latitude = (p_channel_data->>'latitude')::DECIMAL,
            longitude = (p_channel_data->>'longitude')::DECIMAL,
            last_seen_at = NOW(),
            scraping_session_id = p_session_id,
            updated_at = NOW(),
            -- 重新激活如果之前被停用
            is_active = CASE 
                WHEN NOT is_active THEN TRUE 
                ELSE is_active 
            END,
            deactivated_at = CASE 
                WHEN NOT is_active THEN NULL 
                ELSE deactivated_at 
            END,
            status_change_reason = CASE 
                WHEN NOT is_active THEN 'reactivated_in_scraping' 
                ELSE status_change_reason 
            END
        WHERE id = existing_record.id;
        
        -- 记录重新激活事件
        IF NOT existing_record.is_active THEN
            PERFORM log_lifecycle_event(
                existing_record.id, p_unifi_id, 'reactivated', 
                jsonb_build_object('reason', 'found_in_scraping'), 
                NULL, p_channel_data, p_session_id, 0.70
            );
        END IF;
        
        -- 记录更新事件
        IF has_meaningful_changes THEN
            PERFORM log_lifecycle_event(
                existing_record.id, p_unifi_id, 'updated', changes_detected,
                row_to_json(existing_record)::jsonb, p_channel_data, p_session_id, 0.50
            );
        END IF;
        
        distributor_id := existing_record.id;
    END IF;
    
    RETURN QUERY SELECT distributor_id, is_new_channel, has_meaningful_changes, changes_detected;
END;
$$ LANGUAGE plpgsql;

-- 5.5 标记失踪渠道为不活跃
CREATE OR REPLACE FUNCTION mark_missing_channels_inactive(
    p_session_id UUID,
    p_found_unifi_ids INTEGER[]
) RETURNS INTEGER AS $$
DECLARE
    deactivated_count INTEGER := 0;
    missing_channel RECORD;
BEGIN
    FOR missing_channel IN 
        SELECT id, unifi_id, name, is_active
        FROM distributors 
        WHERE is_active = TRUE 
        AND unifi_id IS NOT NULL
        AND NOT (unifi_id = ANY(p_found_unifi_ids))
    LOOP
        UPDATE distributors 
        SET 
            is_active = FALSE,
            deactivated_at = NOW(),
            status_change_reason = 'disappeared_from_scraping',
            updated_at = NOW()
        WHERE id = missing_channel.id;
        
        -- 记录停用事件
        PERFORM log_lifecycle_event(
            missing_channel.id, missing_channel.unifi_id, 'deactivated',
            jsonb_build_object('reason', 'disappeared_from_scraping'),
            NULL, NULL, p_session_id, 0.75
        );
        
        deactivated_count := deactivated_count + 1;
    END LOOP;
    
    RETURN deactivated_count;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 6. 分析和统计函数
-- ====================================================================

-- 6.1 获取渠道趋势
CREATE OR REPLACE FUNCTION get_channel_trends(days INTEGER DEFAULT 30)
RETURNS TABLE (
    date DATE,
    new_channels INTEGER,
    deactivated_channels INTEGER,
    reactivated_channels INTEGER,
    net_change INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.date,
        COALESCE(new_count, 0) as new_channels,
        COALESCE(deactivated_count, 0) as deactivated_channels,
        COALESCE(reactivated_count, 0) as reactivated_channels,
        COALESCE(new_count, 0) - COALESCE(deactivated_count, 0) + COALESCE(reactivated_count, 0) as net_change
    FROM (
        SELECT generate_series(
            CURRENT_DATE - INTERVAL '1 day' * days,
            CURRENT_DATE,
            INTERVAL '1 day'
        )::DATE as date
    ) d
    LEFT JOIN (
        SELECT 
            created_at::DATE as date,
            COUNT(*) FILTER (WHERE event_type = 'discovered') as new_count,
            COUNT(*) FILTER (WHERE event_type = 'deactivated') as deactivated_count,
            COUNT(*) FILTER (WHERE event_type = 'reactivated') as reactivated_count
        FROM channel_lifecycle_events
        WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * days
        GROUP BY created_at::DATE
    ) events ON d.date = events.date
    ORDER BY d.date;
END;
$$ LANGUAGE plpgsql;

-- 6.2 获取渠道生命周期统计
CREATE OR REPLACE FUNCTION get_channel_lifecycle_stats()
RETURNS TABLE (
    total_discovered INTEGER,
    currently_active INTEGER,
    total_deactivated INTEGER,
    never_deactivated INTEGER,
    reactivated_count INTEGER,
    average_lifespan_days DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_discovered,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END)::INTEGER as currently_active,
        COUNT(CASE WHEN is_active = FALSE THEN 1 END)::INTEGER as total_deactivated,
        COUNT(CASE WHEN is_active = TRUE AND deactivated_at IS NULL THEN 1 END)::INTEGER as never_deactivated,
        (SELECT COUNT(DISTINCT distributor_id)::INTEGER FROM channel_lifecycle_events WHERE event_type = 'reactivated') as reactivated_count,
        AVG(
            CASE 
                WHEN deactivated_at IS NOT NULL THEN 
                    EXTRACT(DAY FROM (deactivated_at - first_seen_at))
                ELSE 
                    EXTRACT(DAY FROM (NOW() - first_seen_at))
            END
        )::DECIMAL as average_lifespan_days
    FROM distributors
    WHERE unifi_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 6.3 获取渠道分布统计
CREATE OR REPLACE FUNCTION get_channel_distribution_stats()
RETURNS TABLE (
    region VARCHAR,
    country_code VARCHAR,
    total_channels INTEGER,
    active_channels INTEGER,
    master_distributors INTEGER,
    simple_distributors INTEGER,
    recent_changes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.region,
        d.country_code,
        COUNT(*)::INTEGER as total_channels,
        COUNT(CASE WHEN d.is_active = TRUE THEN 1 END)::INTEGER as active_channels,
        COUNT(CASE WHEN d.partner_type = 'master' AND d.is_active = TRUE THEN 1 END)::INTEGER as master_distributors,
        COUNT(CASE WHEN d.partner_type = 'simple' AND d.is_active = TRUE THEN 1 END)::INTEGER as simple_distributors,
        COUNT(CASE WHEN e.created_at >= NOW() - INTERVAL '7 days' THEN 1 END)::INTEGER as recent_changes
    FROM distributors d
    LEFT JOIN channel_lifecycle_events e ON d.id = e.distributor_id
    WHERE d.unifi_id IS NOT NULL
    GROUP BY d.region, d.country_code
    ORDER BY active_channels DESC;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 7. 更新现有触发器
-- ====================================================================

-- 更新会话统计的触发器
CREATE OR REPLACE FUNCTION update_session_statistics()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 更新会话统计
        UPDATE channel_monitoring_sessions 
        SET 
            new_channels = new_channels + CASE WHEN NEW.event_type = 'discovered' THEN 1 ELSE 0 END,
            updated_channels = updated_channels + CASE WHEN NEW.event_type = 'updated' THEN 1 ELSE 0 END,
            deactivated_channels = deactivated_channels + CASE WHEN NEW.event_type = 'deactivated' THEN 1 ELSE 0 END,
            reactivated_channels = reactivated_channels + CASE WHEN NEW.event_type = 'reactivated' THEN 1 ELSE 0 END,
            updated_at = NOW()
        WHERE id = NEW.session_id;
        
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 应用触发器
CREATE TRIGGER IF NOT EXISTS update_session_stats_trigger
    AFTER INSERT ON channel_lifecycle_events
    FOR EACH ROW EXECUTE FUNCTION update_session_statistics();

-- ====================================================================
-- 8. 创建有用的视图
-- ====================================================================

-- 活跃渠道详细视图
CREATE OR REPLACE VIEW active_channels_detailed AS
SELECT 
    d.*,
    EXTRACT(DAY FROM (NOW() - d.first_seen_at)) as days_since_discovery,
    EXTRACT(DAY FROM (NOW() - d.last_seen_at)) as days_since_last_seen,
    CASE 
        WHEN d.first_seen_at >= NOW() - INTERVAL '7 days' THEN 'new'
        WHEN d.last_seen_at >= NOW() - INTERVAL '1 day' THEN 'recent'
        ELSE 'stable'
    END as activity_status
FROM distributors d
WHERE d.is_active = TRUE AND d.unifi_id IS NOT NULL;

-- 最近变更视图
CREATE OR REPLACE VIEW recent_channel_changes AS
SELECT 
    e.*,
    d.name as distributor_name,
    d.region,
    d.country_code,
    d.partner_type
FROM channel_lifecycle_events e
JOIN distributors d ON e.distributor_id = d.id
WHERE e.created_at >= NOW() - INTERVAL '7 days'
ORDER BY e.created_at DESC;

-- 会话摘要视图
CREATE OR REPLACE VIEW session_summary AS
SELECT 
    s.*,
    s.session_end - s.session_start as session_duration,
    s.new_channels + s.updated_channels + s.deactivated_channels + s.reactivated_channels as total_events
FROM channel_monitoring_sessions s
ORDER BY s.session_start DESC;

-- ====================================================================
-- 9. 为 Supabase 实时订阅设置表
-- ====================================================================

-- 添加到实时发布
ALTER publication supabase_realtime ADD TABLE channel_monitoring_sessions;
ALTER publication supabase_realtime ADD TABLE channel_lifecycle_events;
ALTER publication supabase_realtime ADD TABLE channel_statistics;

-- ====================================================================
-- 10. 完成信息
-- ====================================================================

SELECT 'Enhanced Channel Monitoring Migration Completed Successfully' as status;