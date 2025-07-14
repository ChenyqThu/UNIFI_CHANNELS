# Unifi 经销商追踪系统

一个全面的竞争情报平台，通过自动化数据收集、变更检测和协作分析来监控和分析Unifi的全球经销商网络。

## 🎯 概述

Unifi经销商追踪系统通过以下功能提供对Unifi全球合作伙伴生态系统的实时情报：

- **自动化数据收集**：从官方Unifi源进行JSON API抓取
- **全球覆盖**：8个区域，覆盖131+个国家和州
- **变更检测**：自动监控经销商网络演变
- **Notion集成**：团队协作分析工作空间
- **REST API**：外部集成的程序化访问
- **生产就绪**：Docker部署，全面监控

## 🏗️ 架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      客户端接口                                   │
├─────────────────────────────────────────────────────────────────┤
│  CLI命令  │  REST API  │  Notion工作区  │  调度器              │
└─────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                    应用层                                        │
├─────────────────────────────────────────────────────────────────┤
│         FastAPI路由器          │         CLI处理器              │
│       (api/main.py)           │       (cli/__init__.py)        │
└─────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                     服务层                                       │
├─────────────────────────────────────────────────────────────────┤
│  数据收集     │  数据处理     │  集成       │  运维               │
│  - JSON抓取器 │  - 处理器     │  - Notion   │  - 健康检查         │
│  - 区域映射器 │  - 验证器     │  - 同步     │  - 任务             │
└─────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                      数据层                                      │
├─────────────────────────────────────────────────────────────────┤
│    PostgreSQL/SQLite    │    Redis缓存    │    文件系统         │
│    - 经销商             │    - 会话数据   │    - 日志            │
│    - 变更历史           │    - 速率限制   │    - 配置            │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 快速开始

### 先决条件

- Python 3.11+
- PostgreSQL 13+ (或SQLite用于开发)
- Docker & Docker Compose
- Redis (可选，用于缓存)

### Docker部署 (推荐)

```bash
# 克隆仓库
git clone <repository-url>
cd unifi_channels

# 复制环境模板
cp .env.example .env

# 编辑配置
nano .env

# 启动所有服务
docker-compose up -d

# 初始化系统
docker-compose exec api python -m cli init

# 验证部署
docker-compose exec api python -m cli health
```

### 手动安装

```bash
# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境
cp .env.example .env
# 编辑.env文件设置您的配置

# 初始化数据库
python -m cli init

# 运行首次数据收集
python -m cli scrape --verbose
```

## 📖 使用方法

### 命令行界面

```bash
# 系统操作
python -m cli init                              # 初始化数据库
python -m cli health                            # 检查系统健康状态
python -m cli stats                             # 查看统计信息

# 数据收集
python -m cli scrape --verbose                  # 收集经销商数据
python -m cli scrape --sync-notion              # 收集并同步到Notion
python -m cli list --region usa --limit 20     # 列出经销商

# 变更追踪
python -m cli changes --days 7                  # 查看最近变更
python -m cli info 123                          # 获取经销商详情

# Notion集成
python -m cli notion test                       # 测试Notion连接
python -m cli notion sync                       # 同步到Notion
python -m cli notion stats                      # 查看同步统计
```

### REST API

```bash
# 启动API服务器
python -m api.main                              # 开发环境
uvicorn api.main:app --host 0.0.0.0 --port 8000 # 生产环境

# API文档
# http://localhost:8000/docs (Swagger UI)
# http://localhost:8000/redoc (ReDoc)
```

### 自动化调度

```bash
# 启动调度器服务
python -m scheduler

# Docker服务自动运行：
# - 每24小时数据收集
# - 每30分钟健康监控
# - 上午9:00每日报告
```

## 🗺️ 全球覆盖

### 支持的区域

- **af** - 非洲 (10个国家)
- **as** - 亚洲 (24个国家)
- **aus-nzl** - 澳大利亚和新西兰 (2个国家)
- **can** - 加拿大 (4个省份)
- **eur** - 欧洲 (42个国家)
- **lat-a** - 拉丁美洲 (20+个国家)
- **mid-e** - 中东 (11个国家)
- **usa** - 美国 (14个州)

### 合作伙伴类型

- **主要经销商** - 区域主要合作伙伴
- **授权经销商** - 本地经销商

## 🔗 API端点

### 核心数据访问

```bash
# 通过过滤器获取经销商
GET /api/distributors?region=usa&partner_type=master&page=1

# 获取特定经销商
GET /api/distributors/{id}

# 获取变更历史
GET /api/changes?days=7&limit=50

# 获取分析摘要
GET /api/analytics/summary
```

### 操作

```bash
# 触发手动同步
POST /api/sync

# 健康检查
GET /api/health

# Notion同步
POST /api/notion/sync
```

## 📊 数据模型

### 数据库架构

```sql
-- 公司表 (标准化公司数据)
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    website_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 经销商表 (核心业务数据)
CREATE TABLE distributors (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    unifi_id VARCHAR(50) UNIQUE NOT NULL,    -- 官方Unifi ID
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(50),
    contact_email VARCHAR(255),
    contact_url TEXT,
    region_code VARCHAR(10),
    country_code VARCHAR(10),
    partner_type VARCHAR(20),                -- 'master' 或 'simple'
    status VARCHAR(20) DEFAULT 'active',
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 变更历史表 (完整审计跟踪)
CREATE TABLE change_history (
    id SERIAL PRIMARY KEY,
    distributor_id INTEGER REFERENCES distributors(id),
    change_type VARCHAR(20),                 -- 'created', 'updated', 'deleted'
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎯 Notion集成

### 数据库字段

系统与包含以下内容的Notion数据库同步：

#### 核心信息
- **公司名称** (标题)
- **合作伙伴类型** (选择：主要经销商，授权经销商)
- **网站** (URL)
- **地址** (富文本)
- **电话** (电话号码)
- **联系邮箱** (邮箱)

#### 地理数据
- **区域** (选择：8个全球区域带颜色编码)
- **国家/州** (选择：动态选项)
- **坐标** (富文本："纬度，经度")

#### 状态追踪
- **状态** (选择：活跃/非活跃)
- **Unifi ID** (富文本：官方标识符)
- **最后验证** (日期)
- **排序权重** (数字：显示优先级)

#### 增强字段
- **分析状态** (选择：未分析，进行中，已完成)
- **优先级** (选择：高，中，低)
- **备注** (富文本：分析备注)
- **数据源** (选择：自动抓取，手动输入，API同步)

### 同步命令

```bash
# 测试连接
python -m cli notion test

# 查看数据库信息
python -m cli notion info

# 同步所有数据
python -m cli notion sync

# 查看同步统计
python -m cli notion stats
```

## 🔧 配置

### 环境变量

```bash
# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/unifi_distributors

# Notion集成
NOTION_TOKEN=secret_your_notion_integration_token
NOTION_DATABASE_ID=your_notion_database_id

# API配置
API_HOST=0.0.0.0
API_PORT=8000

# 抓取
SCRAPING_INTERVAL_HOURS=24
USER_AGENT=Mozilla/5.0 (compatible; UnifiDistributorTracker/1.0)

# 性能
NOTION_BATCH_SIZE=25
NOTION_SYNC_ENABLED=true

# 监控 (可选)
REDIS_URL=redis://localhost:6379
SENTRY_DSN=https://your_sentry_dsn
```

## 🐳 Docker服务

### 服务架构

```yaml
services:
  postgres:     # 主数据库
  redis:        # 缓存和会话存储
  api:          # REST API服务器
  scheduler:    # 自动化任务执行
  cli:          # 一次性管理任务
```

### 容器命令

```bash
# 生产部署
docker-compose up -d

# 查看日志
docker-compose logs -f api

# 执行命令
docker-compose exec api python -m cli stats

# 扩展API服务
docker-compose up -d --scale api=3

# 健康检查
docker-compose exec api python -m cli health
```

## 📊 分析和监控

### 系统指标

- **数据质量**：Unifi ID覆盖率，重复率
- **地理分布**：区域经销商数量
- **变更检测**：新增、修改、删除的经销商
- **同步性能**：Notion集成状态
- **系统健康**：数据库、API、服务可用性

### 健康监控

```bash
# 系统健康检查
curl http://localhost:8000/api/health

# 分析摘要
curl http://localhost:8000/api/analytics/summary

# 变更趋势
curl http://localhost:8000/api/changes?days=30
```

## 🛠️ 开发

### 项目结构

```
unifi_channels/
├── api/                    # REST API层
├── cli/                    # 命令行界面
├── models/                 # 数据模型和架构
├── services/               # 业务逻辑服务
├── config/                 # 配置管理
├── utils/                  # 共享工具
├── docker-compose.yml      # 容器编排
├── Dockerfile              # 多阶段容器构建
├── requirements.txt        # Python依赖
└── .env.example           # 环境模板
```

### 代码质量

```bash
# 格式化代码
black .

# 代码检查
flake8 .

# 类型检查
mypy .
```

## 🔍 关键特性

### 缺失经销商检测
自动识别从抓取结果中消失的经销商并：
- 在数据库中将其标记为非活跃
- 在Notion中更新其状态
- 在审计历史中记录变更
- 维护数据完整性

### Unifi ID系统
使用官方Unifi ID作为主要业务标识符：
- 确保准确的经销商匹配
- 防止数据重复
- 支持可靠的Notion同步
- 维护引用完整性

### 变更追踪
全面的审计跟踪捕获：
- 新经销商添加
- 字段级修改
- 状态变更（活跃/非活跃）
- 完整的前后快照

## 🚨 故障排除

### 常见问题

```bash
# 数据库连接
python -m cli health                    # 检查系统状态
echo $DATABASE_URL                      # 验证配置

# Notion同步失败
python -m cli notion test               # 测试连接
python -m cli notion info               # 检查数据库架构

# 数据收集问题
python -m cli scrape --verbose          # 调试抓取
curl -I https://www.ui.com/distributors/ # 测试端点
```

### 日志分析

```bash
# 查看应用日志
docker-compose logs -f api

# 搜索错误
docker-compose logs api | grep ERROR

# 实时监控
tail -f logs/unifi_tracker.log
```

## 📈 性能优化

### 数据库性能
- 在Unifi ID和区域代码上建立索引查询
- 并发访问的连接池
- 重复操作的预准备语句

### Notion同步优化
- 批处理（每批25条记录）
- 基于变更的更新（仅修改的记录）
- 速率限制合规
- 错误恢复和重试机制

### 缓存策略
- Redis用于会话数据和速率限制
- 分析查询结果缓存
- 地理数据缓存

## 🔒 安全和合规

### 数据安全
- 环境变量配置
- 非root容器执行
- 服务间网络隔离
- 所有操作的审计日志

### 合规性
- 尊重抓取实践
- 速率限制和延迟
- User-Agent标识
- robots.txt合规

## 📚 文档

- **CLAUDE.md** - 开发指导和命令
- **PRD.md** - 产品需求和规范
- **ARCHITECT.md** - 技术架构文档
- **README.md** - 项目概述和使用指南

## 🔄 未来增强

### 计划功能
- 实时通知和webhooks
- 高级分析和报告
- 趋势分析机器学习
- 多供应商支持扩展

### 技术路线图
- Kubernetes编排
- 事件溯源架构
- 流处理管道
- 无服务器函数集成

---

详细技术文档，请参见 [ARCHITECT.md](ARCHITECT.md)。  
产品需求和规范，请参见 [PRD.md](PRD.md)。  
开发指导，请参见 [CLAUDE.md](CLAUDE.md)。