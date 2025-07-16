-- ====================================================================
-- RLS 策略修复脚本
-- 修复 companies 表的 RLS 策略以允许前端查询
-- ====================================================================

-- 1. 删除现有的严格 RLS 策略
DROP POLICY IF EXISTS "Users can view companies they have permission for" ON companies;
DROP POLICY IF EXISTS "Users can view competitive data for permitted companies" ON competitive_data;
DROP POLICY IF EXISTS "Users can view distributors for permitted companies" ON distributors;
DROP POLICY IF EXISTS "Users can view financial reports for permitted companies" ON financial_reports;

-- 2. 创建更宽松的 RLS 策略，允许匿名用户读取数据

-- 公司表：允许所有用户查看公司信息
CREATE POLICY "Allow public read access to companies" ON companies
    FOR SELECT USING (true);

-- 竞争数据表：允许所有用户查看竞争数据
CREATE POLICY "Allow public read access to competitive data" ON competitive_data
    FOR SELECT USING (true);

-- 分销商表：允许所有用户查看分销商数据
CREATE POLICY "Allow public read access to distributors" ON distributors
    FOR SELECT USING (true);

-- 财报表：允许所有用户查看财报数据
CREATE POLICY "Allow public read access to financial reports" ON financial_reports
    FOR SELECT USING (true);

-- 数据变更表：允许所有用户查看数据变更历史
CREATE POLICY "Allow public read access to data changes" ON data_changes
    FOR SELECT USING (true);

-- 3. 为写入操作创建更严格的策略（如果需要）

-- 公司表：只允许认证用户和有权限的用户写入
CREATE POLICY "Allow authenticated users to insert companies" ON companies
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' OR
        auth.uid() IN (
            SELECT user_id FROM user_permissions 
            WHERE permission_level IN ('write', 'admin')
            AND is_active = TRUE
            AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

CREATE POLICY "Allow authenticated users to update companies" ON companies
    FOR UPDATE USING (
        auth.role() = 'authenticated' OR
        auth.uid() IN (
            SELECT user_id FROM user_permissions 
            WHERE permission_level IN ('write', 'admin')
            AND is_active = TRUE
            AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

-- 竞争数据表：只允许认证用户写入
CREATE POLICY "Allow authenticated users to insert competitive data" ON competitive_data
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update competitive data" ON competitive_data
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 分销商表：只允许认证用户写入
CREATE POLICY "Allow authenticated users to insert distributors" ON distributors
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update distributors" ON distributors
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 财报表：只允许认证用户写入
CREATE POLICY "Allow authenticated users to insert financial reports" ON financial_reports
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update financial reports" ON financial_reports
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. 为管理员创建一个超级用户权限（可选）

-- 创建一个函数来检查用户是否是管理员
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_permissions 
        WHERE user_permissions.user_id = is_admin_user.user_id
        AND permission_level = 'admin'
        AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 创建一个演示用户权限记录（可选）
-- 注意：这只是为了演示，实际使用时应该根据真实的用户 ID 来创建

-- 获取 Ubiquiti 公司 ID
DO $$
DECLARE
    ubiquiti_id UUID;
BEGIN
    SELECT id INTO ubiquiti_id FROM companies WHERE name = 'Ubiquiti Inc.';
    
    IF ubiquiti_id IS NOT NULL THEN
        -- 为一个示例用户创建权限记录
        INSERT INTO user_permissions (
            user_id, 
            company_id, 
            data_category, 
            permission_level,
            granted_at,
            is_active
        ) VALUES 
        (
            gen_random_uuid(), -- 示例用户 ID
            ubiquiti_id,
            'all',
            'read',
            NOW(),
            TRUE
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 6. 验证策略是否正确应用
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('companies', 'competitive_data', 'distributors', 'financial_reports', 'data_changes')
ORDER BY tablename, policyname;

-- 7. 测试查询（应该可以成功执行）
SELECT 
    id,
    name,
    website_url,
    industry,
    ticker_symbol,
    is_active
FROM companies 
WHERE name = 'Ubiquiti Inc.'
LIMIT 1;

-- 显示成功消息
SELECT 'RLS 策略修复完成！现在前端应该可以正常查询 companies 表了。' AS status;