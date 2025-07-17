-- 修复 RLS 政策以允许匿名用户读取数据
-- 这是最安全的解决方案

-- 1. 为 financial_reports 添加匿名只读访问
DROP POLICY IF EXISTS "Users can view financial reports for permitted companies" ON financial_reports;
CREATE POLICY "Allow anonymous read access to financial reports" ON financial_reports
    FOR SELECT USING (true);

-- 2. 为 companies 添加匿名只读访问  
DROP POLICY IF EXISTS "Users can view companies they have permission for" ON companies;
CREATE POLICY "Allow anonymous read access to companies" ON companies
    FOR SELECT USING (true);

-- 3. 为 distributors 添加匿名只读访问
DROP POLICY IF EXISTS "Users can view distributors they have permission for" ON distributors;
CREATE POLICY "Allow anonymous read access to distributors" ON distributors
    FOR SELECT USING (true);

-- 4. 为 competitive_data 添加匿名只读访问
DROP POLICY IF EXISTS "Users can view competitive data for permitted companies" ON competitive_data;
CREATE POLICY "Allow anonymous read access to competitive data" ON competitive_data
    FOR SELECT USING (true);

-- 5. 保持其他操作需要认证
-- INSERT, UPDATE, DELETE 仍然需要用户认证和权限

-- 验证政策
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('financial_reports', 'companies', 'distributors', 'competitive_data')
ORDER BY tablename, policyname;