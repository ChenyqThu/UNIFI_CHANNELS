# 国际化 (i18n) 扩展方案
# Internationalization (i18n) Expansion Plan

## 1. 方案概述 / Overview

### 1.1 目标 / Objectives

**中文**: 构建一个完整的多语言国际化系统，支持中文和英文的无缝切换，确保所有用户界面、数据标签、错误消息和动态内容都能正确本地化。

**English**: Build a comprehensive multi-language internationalization system supporting seamless switching between Chinese and English, ensuring all UI elements, data labels, error messages, and dynamic content are properly localized.

### 1.2 支持语言 / Supported Languages

- **中文 (Chinese)** - 简体中文 (zh-CN)
- **英文 (English)** - 美式英语 (en-US)
- **预留扩展** - 日语 (ja-JP), 韩语 (ko-KR), 德语 (de-DE)

## 2. 技术架构 / Technical Architecture

### 2.1 Vue i18n 核心配置 / Vue i18n Core Configuration

```typescript
// src/i18n/index.ts
import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'

// 类型定义
interface LocaleMessages {
  [key: string]: any
}

// 获取浏览器语言
function getBrowserLocale(): string {
  const navigatorLanguage = navigator.language || navigator.languages[0]
  
  // 语言映射
  const localeMap: Record<string, string> = {
    'zh': 'zh-CN',
    'zh-CN': 'zh-CN',
    'zh-TW': 'zh-CN',
    'en': 'en-US',
    'en-US': 'en-US',
    'en-GB': 'en-US'
  }
  
  return localeMap[navigatorLanguage] || 'en-US'
}

// 获取存储的语言偏好
function getStoredLocale(): string {
  const stored = localStorage.getItem('competitive-intelligence-locale')
  return stored || getBrowserLocale()
}

const i18n = createI18n({
  locale: getStoredLocale(),
  fallbackLocale: 'en-US',
  legacy: false, // 使用 Composition API 模式
  globalInjection: true,
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  },
  // 数字格式化
  numberFormats: {
    'zh-CN': {
      currency: {
        style: 'currency',
        currency: 'CNY',
        notation: 'standard'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      },
      percent: {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }
    },
    'en-US': {
      currency: {
        style: 'currency',
        currency: 'USD',
        notation: 'standard'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      },
      percent: {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }
    }
  },
  // 日期时间格式化
  datetimeFormats: {
    'zh-CN': {
      short: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      },
      long: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      },
      monthDay: {
        month: 'long',
        day: 'numeric'
      }
    },
    'en-US': {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit'
      },
      monthDay: {
        month: 'long',
        day: 'numeric'
      }
    }
  },
  // 复数规则
  pluralRules: {
    'zh-CN': (choice: number) => choice === 0 ? 0 : 1,
    'en-US': (choice: number) => choice === 0 ? 0 : choice === 1 ? 1 : 2
  }
})

export default i18n
```

### 2.2 翻译文件结构 / Translation File Structure

```json
// src/i18n/locales/zh-CN.json
{
  "brand": {
    "name": "竞品洞察平台",
    "slogan": "全方位竞品智能分析",
    "company": "您的公司名称"
  },
  "navigation": {
    "dashboard": "仪表盘",
    "companies": "竞品公司",
    "analysis": "多维分析",
    "reports": "报告中心",
    "settings": "设置"
  },
  "common": {
    "loading": "加载中...",
    "error": "错误",
    "success": "成功",
    "warning": "警告",
    "info": "信息",
    "confirm": "确认",
    "cancel": "取消",
    "save": "保存",
    "edit": "编辑",
    "delete": "删除",
    "search": "搜索",
    "filter": "筛选",
    "export": "导出",
    "import": "导入",
    "refresh": "刷新",
    "reset": "重置",
    "submit": "提交",
    "back": "返回",
    "next": "下一步",
    "previous": "上一步",
    "close": "关闭",
    "open": "打开",
    "view": "查看",
    "download": "下载",
    "upload": "上传",
    "copy": "复制",
    "paste": "粘贴",
    "cut": "剪切",
    "select_all": "全选",
    "deselect_all": "取消全选",
    "expand": "展开",
    "collapse": "收起",
    "sort": "排序",
    "group": "分组",
    "total": "总计",
    "average": "平均",
    "maximum": "最大",
    "minimum": "最小",
    "count": "数量",
    "percentage": "百分比",
    "ratio": "比例",
    "trend": "趋势",
    "growth": "增长",
    "decline": "下降",
    "stable": "稳定",
    "increase": "增加",
    "decrease": "减少",
    "change": "变化",
    "comparison": "对比",
    "analysis": "分析",
    "insight": "洞察",
    "recommendation": "建议",
    "summary": "摘要",
    "detail": "详情",
    "overview": "概览",
    "status": "状态",
    "active": "活跃",
    "inactive": "不活跃",
    "pending": "待处理",
    "completed": "已完成",
    "failed": "失败",
    "processing": "处理中",
    "archived": "已归档",
    "draft": "草稿",
    "published": "已发布",
    "scheduled": "已安排",
    "unknown": "未知",
    "unavailable": "不可用",
    "not_found": "未找到",
    "no_data": "暂无数据",
    "no_results": "没有结果",
    "empty_state": "暂无内容",
    "coming_soon": "即将推出",
    "beta": "测试版",
    "new": "新",
    "updated": "已更新",
    "required": "必填",
    "optional": "可选",
    "enabled": "已启用",
    "disabled": "已禁用",
    "public": "公开",
    "private": "私有",
    "shared": "共享",
    "personal": "个人",
    "team": "团队",
    "organization": "组织",
    "global": "全局",
    "local": "本地",
    "internal": "内部",
    "external": "外部",
    "online": "在线",
    "offline": "离线",
    "connected": "已连接",
    "disconnected": "已断开",
    "synced": "已同步",
    "syncing": "同步中",
    "sync_failed": "同步失败",
    "last_updated": "最后更新",
    "created_at": "创建时间",
    "updated_at": "更新时间",
    "expires_at": "过期时间",
    "valid_until": "有效期至",
    "version": "版本",
    "revision": "修订版本",
    "build": "构建版本",
    "environment": "环境",
    "production": "生产环境",
    "staging": "预发布环境",
    "development": "开发环境",
    "testing": "测试环境"
  },
  "dashboard": {
    "title": "竞品洞察仪表盘",
    "subtitle": "实时竞品数据分析和洞察",
    "welcome": "欢迎使用竞品洞察平台",
    "overview": "总览",
    "metrics": "关键指标",
    "alerts": "告警",
    "recent_changes": "最新变化",
    "quick_actions": "快速操作",
    "shortcuts": "快捷方式",
    "widgets": {
      "companies_tracked": "跟踪公司数",
      "data_points": "数据点",
      "last_update": "最后更新",
      "system_health": "系统健康状况",
      "data_quality": "数据质量",
      "collection_status": "收集状态",
      "real_time_updates": "实时更新",
      "notifications": "通知",
      "critical_alerts": "重要告警",
      "performance_metrics": "性能指标",
      "user_activity": "用户活动",
      "system_usage": "系统使用情况"
    }
  },
  "companies": {
    "title": "竞品公司",
    "subtitle": "管理和分析竞品公司信息",
    "list": "公司列表",
    "details": "公司详情",
    "profile": "公司档案",
    "add": "添加公司",
    "edit": "编辑公司",
    "remove": "移除公司",
    "search_placeholder": "搜索公司名称...",
    "industry": "行业",
    "founded": "成立时间",
    "headquarters": "总部",
    "website": "官网",
    "ticker": "股票代码",
    "market_cap": "市值",
    "employees": "员工数",
    "revenue": "营收",
    "select_company": "选择公司",
    "company_selected": "已选择公司",
    "no_companies": "暂无公司数据",
    "loading_companies": "加载公司列表中...",
    "company_not_found": "未找到该公司",
    "add_company_success": "公司添加成功",
    "update_company_success": "公司更新成功",
    "delete_company_success": "公司删除成功",
    "delete_company_confirm": "确认删除此公司吗？",
    "company_validation": {
      "name_required": "公司名称为必填项",
      "name_min_length": "公司名称至少需要2个字符",
      "website_format": "请输入正确的网站地址",
      "industry_required": "请选择行业分类"
    }
  },
  "data_categories": {
    "financial": "财务数据",
    "channels": "渠道数据", 
    "products": "产品数据",
    "sentiment": "舆情数据",
    "patents": "专利数据",
    "personnel": "人员数据",
    "market": "市场数据",
    "technology": "技术数据",
    "all": "全部分类",
    "select_category": "选择数据分类"
  },
  "data_types": {
    "quarterly_earnings": "季度财报",
    "revenue_breakdown": "营收分解",
    "profit_margins": "利润率",
    "distributor_network": "分销商网络",
    "partnership_changes": "合作关系变化",
    "product_releases": "产品发布",
    "feature_updates": "功能更新",
    "reddit_mentions": "Reddit提及",
    "news_coverage": "新闻报道",
    "patent_applications": "专利申请",
    "executive_changes": "高管变化",
    "team_expansion": "团队扩张"
  },
  "analysis": {
    "title": "多维分析",
    "subtitle": "跨维度竞品数据分析",
    "cross_dimension": "跨维度分析",
    "correlation": "相关性分析",
    "trend_analysis": "趋势分析",
    "competitive_positioning": "竞争定位",
    "market_share": "市场份额",
    "sentiment_tracking": "舆情跟踪",
    "financial_performance": "财务表现",
    "product_comparison": "产品对比",
    "channel_analysis": "渠道分析",
    "patent_landscape": "专利态势",
    "personnel_insights": "人员洞察",
    "time_range": "时间范围",
    "date_range": "日期范围",
    "select_dimensions": "选择分析维度",
    "select_companies": "选择分析公司",
    "generate_report": "生成报告",
    "export_analysis": "导出分析",
    "save_analysis": "保存分析",
    "share_analysis": "分享分析",
    "analysis_results": "分析结果",
    "key_insights": "关键洞察",
    "recommendations": "建议",
    "limitations": "局限性",
    "methodology": "方法论",
    "data_sources": "数据来源",
    "confidence_level": "置信度",
    "significance": "重要性",
    "statistical_significance": "统计显著性",
    "correlation_coefficient": "相关系数",
    "p_value": "P值",
    "sample_size": "样本量",
    "margin_of_error": "误差范围",
    "confidence_interval": "置信区间"
  },
  "charts": {
    "title": "图表标题",
    "x_axis": "X轴",
    "y_axis": "Y轴",
    "legend": "图例",
    "tooltip": "提示信息",
    "no_data": "暂无图表数据",
    "loading_chart": "加载图表中...",
    "chart_error": "图表加载失败",
    "zoom_in": "放大",
    "zoom_out": "缩小",
    "reset_zoom": "重置缩放",
    "download_chart": "下载图表",
    "full_screen": "全屏显示",
    "exit_full_screen": "退出全屏",
    "chart_types": {
      "line": "折线图",
      "bar": "柱状图",
      "pie": "饼图",
      "scatter": "散点图",
      "area": "面积图",
      "radar": "雷达图",
      "treemap": "树状图",
      "heatmap": "热力图",
      "candlestick": "K线图",
      "funnel": "漏斗图",
      "gauge": "仪表盘",
      "sankey": "桑基图",
      "sunburst": "旭日图",
      "parallel": "平行坐标图",
      "box_plot": "箱线图"
    }
  },
  "notifications": {
    "title": "通知中心",
    "all": "全部通知",
    "unread": "未读通知", 
    "read": "已读通知",
    "mark_as_read": "标记为已读",
    "mark_all_read": "全部标记为已读",
    "delete": "删除通知",
    "delete_all": "删除全部",
    "settings": "通知设置",
    "enable_notifications": "启用通知",
    "disable_notifications": "禁用通知",
    "notification_preferences": "通知偏好",
    "email_notifications": "邮件通知",
    "push_notifications": "推送通知",
    "sms_notifications": "短信通知",
    "notification_types": {
      "data_change": "数据变化",
      "system_alert": "系统告警",
      "task_completion": "任务完成",
      "quality_issue": "质量问题",
      "user_mention": "用户提及"
    },
    "priority_levels": {
      "low": "低",
      "medium": "中",
      "high": "高", 
      "critical": "紧急"
    },
    "no_notifications": "暂无通知",
    "loading_notifications": "加载通知中...",
    "notification_error": "通知加载失败"
  },
  "settings": {
    "title": "系统设置",
    "general": "通用设置",
    "account": "账户设置",
    "security": "安全设置",
    "privacy": "隐私设置",
    "notifications": "通知设置",
    "language": "语言设置",
    "theme": "主题设置",
    "advanced": "高级设置",
    "about": "关于",
    "language_selection": "语言选择",
    "current_language": "当前语言",
    "change_language": "切换语言",
    "theme_selection": "主题选择",
    "light_theme": "浅色主题",
    "dark_theme": "深色主题",
    "auto_theme": "自动主题",
    "timezone": "时区",
    "date_format": "日期格式",
    "time_format": "时间格式",
    "currency": "货币",
    "number_format": "数字格式",
    "save_settings": "保存设置",
    "reset_settings": "重置设置",
    "settings_saved": "设置已保存",
    "settings_error": "设置保存失败"
  },
  "errors": {
    "general": "发生未知错误",
    "network": "网络连接错误",
    "timeout": "请求超时",
    "server": "服务器错误",
    "not_found": "请求的资源未找到",
    "unauthorized": "未授权访问",
    "forbidden": "禁止访问",
    "validation": "数据验证失败",
    "database": "数据库错误",
    "file_upload": "文件上传失败",
    "file_download": "文件下载失败",
    "permission_denied": "权限不足",
    "session_expired": "会话已过期",
    "invalid_input": "输入无效",
    "required_field": "此字段为必填项",
    "invalid_email": "邮箱格式无效",
    "invalid_url": "URL格式无效",
    "invalid_date": "日期格式无效",
    "invalid_number": "数字格式无效",
    "min_length": "长度不能少于{min}个字符",
    "max_length": "长度不能超过{max}个字符",
    "min_value": "值不能小于{min}",
    "max_value": "值不能大于{max}",
    "pattern_mismatch": "格式不匹配",
    "duplicate_value": "值已存在",
    "file_too_large": "文件过大",
    "unsupported_file": "不支持的文件类型",
    "connection_failed": "连接失败",
    "operation_failed": "操作失败",
    "try_again": "请重试",
    "contact_support": "请联系技术支持",
    "error_code": "错误代码: {code}",
    "error_details": "错误详情"
  },
  "success": {
    "operation_completed": "操作成功完成",
    "data_saved": "数据保存成功",
    "data_updated": "数据更新成功",
    "data_deleted": "数据删除成功",
    "file_uploaded": "文件上传成功",
    "file_downloaded": "文件下载成功",
    "email_sent": "邮件发送成功",
    "notification_sent": "通知发送成功",
    "settings_updated": "设置更新成功",
    "password_changed": "密码修改成功",
    "account_created": "账户创建成功",
    "account_updated": "账户更新成功",
    "login_successful": "登录成功",
    "logout_successful": "退出成功",
    "sync_completed": "同步完成",
    "backup_created": "备份创建成功",
    "restore_completed": "恢复完成",
    "import_successful": "导入成功",
    "export_successful": "导出成功",
    "connection_established": "连接建立成功",
    "task_completed": "任务完成",
    "process_finished": "处理完成",
    "validation_passed": "验证通过",
    "test_passed": "测试通过",
    "deployment_successful": "部署成功",
    "migration_completed": "迁移完成",
    "installation_successful": "安装成功",
    "configuration_updated": "配置更新成功",
    "permission_granted": "权限授予成功",
    "subscription_activated": "订阅激活成功"
  },
  "meta": {
    "page_title": "竞品洞察平台",
    "page_description": "全方位竞品智能分析平台",
    "keywords": "竞品分析,商业智能,数据分析,市场洞察",
    "author": "竞品洞察平台",
    "robots": "index, follow",
    "viewport": "width=device-width, initial-scale=1.0",
    "charset": "UTF-8",
    "language": "zh-CN",
    "og_title": "竞品洞察平台",
    "og_description": "全方位竞品智能分析平台",
    "og_type": "website",
    "og_image": "/images/og-image.jpg",
    "twitter_card": "summary_large_image",
    "twitter_title": "竞品洞察平台",
    "twitter_description": "全方位竞品智能分析平台"
  }
}
```

```json
// src/i18n/locales/en-US.json
{
  "brand": {
    "name": "Competitive Intelligence Platform",
    "slogan": "Comprehensive Competitive Analysis",
    "company": "Your Company Name"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "companies": "Companies",
    "analysis": "Analysis",
    "reports": "Reports",
    "settings": "Settings"
  },
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "warning": "Warning",
    "info": "Info",
    "confirm": "Confirm",
    "cancel": "Cancel",
    "save": "Save",
    "edit": "Edit",
    "delete": "Delete",
    "search": "Search",
    "filter": "Filter",
    "export": "Export",
    "import": "Import",
    "refresh": "Refresh",
    "reset": "Reset",
    "submit": "Submit",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "close": "Close",
    "open": "Open",
    "view": "View",
    "download": "Download",
    "upload": "Upload",
    "copy": "Copy",
    "paste": "Paste",
    "cut": "Cut",
    "select_all": "Select All",
    "deselect_all": "Deselect All",
    "expand": "Expand",
    "collapse": "Collapse",
    "sort": "Sort",
    "group": "Group",
    "total": "Total",
    "average": "Average",
    "maximum": "Maximum",
    "minimum": "Minimum",
    "count": "Count",
    "percentage": "Percentage",
    "ratio": "Ratio",
    "trend": "Trend",
    "growth": "Growth",
    "decline": "Decline",
    "stable": "Stable",
    "increase": "Increase",
    "decrease": "Decrease",
    "change": "Change",
    "comparison": "Comparison",
    "analysis": "Analysis",
    "insight": "Insight",
    "recommendation": "Recommendation",
    "summary": "Summary",
    "detail": "Detail",
    "overview": "Overview",
    "status": "Status",
    "active": "Active",
    "inactive": "Inactive",
    "pending": "Pending",
    "completed": "Completed",
    "failed": "Failed",
    "processing": "Processing",
    "archived": "Archived",
    "draft": "Draft",
    "published": "Published",
    "scheduled": "Scheduled",
    "unknown": "Unknown",
    "unavailable": "Unavailable",
    "not_found": "Not Found",
    "no_data": "No Data",
    "no_results": "No Results",
    "empty_state": "Empty State",
    "coming_soon": "Coming Soon",
    "beta": "Beta",
    "new": "New",
    "updated": "Updated",
    "required": "Required",
    "optional": "Optional",
    "enabled": "Enabled",
    "disabled": "Disabled",
    "public": "Public",
    "private": "Private",
    "shared": "Shared",
    "personal": "Personal",
    "team": "Team",
    "organization": "Organization",
    "global": "Global",
    "local": "Local",
    "internal": "Internal",
    "external": "External",
    "online": "Online",
    "offline": "Offline",
    "connected": "Connected",
    "disconnected": "Disconnected",
    "synced": "Synced",
    "syncing": "Syncing",
    "sync_failed": "Sync Failed",
    "last_updated": "Last Updated",
    "created_at": "Created At",
    "updated_at": "Updated At",
    "expires_at": "Expires At",
    "valid_until": "Valid Until",
    "version": "Version",
    "revision": "Revision",
    "build": "Build",
    "environment": "Environment",
    "production": "Production",
    "staging": "Staging",
    "development": "Development",
    "testing": "Testing"
  },
  "dashboard": {
    "title": "Competitive Intelligence Dashboard",
    "subtitle": "Real-time competitive data analysis and insights",
    "welcome": "Welcome to Competitive Intelligence Platform",
    "overview": "Overview",
    "metrics": "Key Metrics",
    "alerts": "Alerts",
    "recent_changes": "Recent Changes",
    "quick_actions": "Quick Actions",
    "shortcuts": "Shortcuts",
    "widgets": {
      "companies_tracked": "Companies Tracked",
      "data_points": "Data Points",
      "last_update": "Last Update",
      "system_health": "System Health",
      "data_quality": "Data Quality",
      "collection_status": "Collection Status",
      "real_time_updates": "Real-time Updates",
      "notifications": "Notifications",
      "critical_alerts": "Critical Alerts",
      "performance_metrics": "Performance Metrics",
      "user_activity": "User Activity",
      "system_usage": "System Usage"
    }
  },
  "companies": {
    "title": "Companies",
    "subtitle": "Manage and analyze competitive companies",
    "list": "Company List",
    "details": "Company Details",
    "profile": "Company Profile",
    "add": "Add Company",
    "edit": "Edit Company",
    "remove": "Remove Company",
    "search_placeholder": "Search company name...",
    "industry": "Industry",
    "founded": "Founded",
    "headquarters": "Headquarters",
    "website": "Website",
    "ticker": "Ticker",
    "market_cap": "Market Cap",
    "employees": "Employees",
    "revenue": "Revenue",
    "select_company": "Select Company",
    "company_selected": "Company Selected",
    "no_companies": "No Companies",
    "loading_companies": "Loading Companies...",
    "company_not_found": "Company Not Found",
    "add_company_success": "Company Added Successfully",
    "update_company_success": "Company Updated Successfully",
    "delete_company_success": "Company Deleted Successfully",
    "delete_company_confirm": "Are you sure you want to delete this company?",
    "company_validation": {
      "name_required": "Company name is required",
      "name_min_length": "Company name must be at least 2 characters",
      "website_format": "Please enter a valid website URL",
      "industry_required": "Please select an industry"
    }
  },
  "data_categories": {
    "financial": "Financial Data",
    "channels": "Channel Data",
    "products": "Product Data",
    "sentiment": "Sentiment Data",
    "patents": "Patent Data",
    "personnel": "Personnel Data",
    "market": "Market Data",
    "technology": "Technology Data",
    "all": "All Categories",
    "select_category": "Select Category"
  },
  "data_types": {
    "quarterly_earnings": "Quarterly Earnings",
    "revenue_breakdown": "Revenue Breakdown",
    "profit_margins": "Profit Margins",
    "distributor_network": "Distributor Network",
    "partnership_changes": "Partnership Changes",
    "product_releases": "Product Releases",
    "feature_updates": "Feature Updates",
    "reddit_mentions": "Reddit Mentions",
    "news_coverage": "News Coverage",
    "patent_applications": "Patent Applications",
    "executive_changes": "Executive Changes",
    "team_expansion": "Team Expansion"
  },
  "analysis": {
    "title": "Multi-dimensional Analysis",
    "subtitle": "Cross-dimensional competitive data analysis",
    "cross_dimension": "Cross-dimension Analysis",
    "correlation": "Correlation Analysis",
    "trend_analysis": "Trend Analysis",
    "competitive_positioning": "Competitive Positioning",
    "market_share": "Market Share",
    "sentiment_tracking": "Sentiment Tracking",
    "financial_performance": "Financial Performance",
    "product_comparison": "Product Comparison",
    "channel_analysis": "Channel Analysis",
    "patent_landscape": "Patent Landscape",
    "personnel_insights": "Personnel Insights",
    "time_range": "Time Range",
    "date_range": "Date Range",
    "select_dimensions": "Select Dimensions",
    "select_companies": "Select Companies",
    "generate_report": "Generate Report",
    "export_analysis": "Export Analysis",
    "save_analysis": "Save Analysis",
    "share_analysis": "Share Analysis",
    "analysis_results": "Analysis Results",
    "key_insights": "Key Insights",
    "recommendations": "Recommendations",
    "limitations": "Limitations",
    "methodology": "Methodology",
    "data_sources": "Data Sources",
    "confidence_level": "Confidence Level",
    "significance": "Significance",
    "statistical_significance": "Statistical Significance",
    "correlation_coefficient": "Correlation Coefficient",
    "p_value": "P-value",
    "sample_size": "Sample Size",
    "margin_of_error": "Margin of Error",
    "confidence_interval": "Confidence Interval"
  },
  "charts": {
    "title": "Chart Title",
    "x_axis": "X-axis",
    "y_axis": "Y-axis",
    "legend": "Legend",
    "tooltip": "Tooltip",
    "no_data": "No Chart Data",
    "loading_chart": "Loading Chart...",
    "chart_error": "Chart Loading Failed",
    "zoom_in": "Zoom In",
    "zoom_out": "Zoom Out",
    "reset_zoom": "Reset Zoom",
    "download_chart": "Download Chart",
    "full_screen": "Full Screen",
    "exit_full_screen": "Exit Full Screen",
    "chart_types": {
      "line": "Line Chart",
      "bar": "Bar Chart",
      "pie": "Pie Chart",
      "scatter": "Scatter Plot",
      "area": "Area Chart",
      "radar": "Radar Chart",
      "treemap": "Treemap",
      "heatmap": "Heatmap",
      "candlestick": "Candlestick Chart",
      "funnel": "Funnel Chart",
      "gauge": "Gauge Chart",
      "sankey": "Sankey Diagram",
      "sunburst": "Sunburst Chart",
      "parallel": "Parallel Coordinates",
      "box_plot": "Box Plot"
    }
  },
  "notifications": {
    "title": "Notification Center",
    "all": "All Notifications",
    "unread": "Unread",
    "read": "Read",
    "mark_as_read": "Mark as Read",
    "mark_all_read": "Mark All as Read",
    "delete": "Delete",
    "delete_all": "Delete All",
    "settings": "Notification Settings",
    "enable_notifications": "Enable Notifications",
    "disable_notifications": "Disable Notifications",
    "notification_preferences": "Notification Preferences",
    "email_notifications": "Email Notifications",
    "push_notifications": "Push Notifications",
    "sms_notifications": "SMS Notifications",
    "notification_types": {
      "data_change": "Data Change",
      "system_alert": "System Alert",
      "task_completion": "Task Completion",
      "quality_issue": "Quality Issue",
      "user_mention": "User Mention"
    },
    "priority_levels": {
      "low": "Low",
      "medium": "Medium",
      "high": "High",
      "critical": "Critical"
    },
    "no_notifications": "No Notifications",
    "loading_notifications": "Loading Notifications...",
    "notification_error": "Notification Loading Failed"
  },
  "settings": {
    "title": "Settings",
    "general": "General",
    "account": "Account",
    "security": "Security",
    "privacy": "Privacy",
    "notifications": "Notifications",
    "language": "Language",
    "theme": "Theme",
    "advanced": "Advanced",
    "about": "About",
    "language_selection": "Language Selection",
    "current_language": "Current Language",
    "change_language": "Change Language",
    "theme_selection": "Theme Selection",
    "light_theme": "Light Theme",
    "dark_theme": "Dark Theme",
    "auto_theme": "Auto Theme",
    "timezone": "Timezone",
    "date_format": "Date Format",
    "time_format": "Time Format",
    "currency": "Currency",
    "number_format": "Number Format",
    "save_settings": "Save Settings",
    "reset_settings": "Reset Settings",
    "settings_saved": "Settings Saved",
    "settings_error": "Settings Save Failed"
  },
  "errors": {
    "general": "An unknown error occurred",
    "network": "Network connection error",
    "timeout": "Request timeout",
    "server": "Server error",
    "not_found": "Resource not found",
    "unauthorized": "Unauthorized access",
    "forbidden": "Forbidden access",
    "validation": "Validation failed",
    "database": "Database error",
    "file_upload": "File upload failed",
    "file_download": "File download failed",
    "permission_denied": "Permission denied",
    "session_expired": "Session expired",
    "invalid_input": "Invalid input",
    "required_field": "This field is required",
    "invalid_email": "Invalid email format",
    "invalid_url": "Invalid URL format",
    "invalid_date": "Invalid date format",
    "invalid_number": "Invalid number format",
    "min_length": "Must be at least {min} characters",
    "max_length": "Must not exceed {max} characters",
    "min_value": "Must be at least {min}",
    "max_value": "Must not exceed {max}",
    "pattern_mismatch": "Format mismatch",
    "duplicate_value": "Value already exists",
    "file_too_large": "File too large",
    "unsupported_file": "Unsupported file type",
    "connection_failed": "Connection failed",
    "operation_failed": "Operation failed",
    "try_again": "Please try again",
    "contact_support": "Please contact support",
    "error_code": "Error code: {code}",
    "error_details": "Error details"
  },
  "success": {
    "operation_completed": "Operation completed successfully",
    "data_saved": "Data saved successfully",
    "data_updated": "Data updated successfully",
    "data_deleted": "Data deleted successfully",
    "file_uploaded": "File uploaded successfully",
    "file_downloaded": "File downloaded successfully",
    "email_sent": "Email sent successfully",
    "notification_sent": "Notification sent successfully",
    "settings_updated": "Settings updated successfully",
    "password_changed": "Password changed successfully",
    "account_created": "Account created successfully",
    "account_updated": "Account updated successfully",
    "login_successful": "Login successful",
    "logout_successful": "Logout successful",
    "sync_completed": "Sync completed",
    "backup_created": "Backup created successfully",
    "restore_completed": "Restore completed",
    "import_successful": "Import successful",
    "export_successful": "Export successful",
    "connection_established": "Connection established successfully",
    "task_completed": "Task completed",
    "process_finished": "Process finished",
    "validation_passed": "Validation passed",
    "test_passed": "Test passed",
    "deployment_successful": "Deployment successful",
    "migration_completed": "Migration completed",
    "installation_successful": "Installation successful",
    "configuration_updated": "Configuration updated successfully",
    "permission_granted": "Permission granted successfully",
    "subscription_activated": "Subscription activated successfully"
  },
  "meta": {
    "page_title": "Competitive Intelligence Platform",
    "page_description": "Comprehensive competitive intelligence platform",
    "keywords": "competitive analysis, business intelligence, data analysis, market insights",
    "author": "Competitive Intelligence Platform",
    "robots": "index, follow",
    "viewport": "width=device-width, initial-scale=1.0",
    "charset": "UTF-8",
    "language": "en-US",
    "og_title": "Competitive Intelligence Platform",
    "og_description": "Comprehensive competitive intelligence platform",
    "og_type": "website",
    "og_image": "/images/og-image.jpg",
    "twitter_card": "summary_large_image",
    "twitter_title": "Competitive Intelligence Platform",
    "twitter_description": "Comprehensive competitive intelligence platform"
  }
}
```

### 2.3 语言切换组件 / Language Switcher Component

```vue
<!-- src/components/common/LanguageSwitcher.vue -->
<template>
  <div class="language-switcher">
    <select
      v-model="selectedLocale"
      @change="changeLanguage"
      class="language-select"
      :aria-label="$t('settings.language_selection')"
    >
      <option
        v-for="locale in availableLocales"
        :key="locale.code"
        :value="locale.code"
        :selected="locale.code === currentLocale"
      >
        {{ locale.name }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

interface LocaleOption {
  code: string
  name: string
  flag: string
}

// 可用语言列表
const availableLocales: LocaleOption[] = [
  { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' }
]

const { locale, t } = useI18n()

const selectedLocale = ref<string>(locale.value)
const currentLocale = computed(() => locale.value)

// 切换语言
const changeLanguage = () => {
  if (selectedLocale.value !== locale.value) {
    locale.value = selectedLocale.value
    
    // 保存到本地存储
    localStorage.setItem('competitive-intelligence-locale', selectedLocale.value)
    
    // 更新 HTML lang 属性
    document.documentElement.lang = selectedLocale.value
    
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('locale-changed', {
      detail: { locale: selectedLocale.value }
    }))
    
    // 更新页面标题
    updatePageTitle()
  }
}

// 更新页面标题
const updatePageTitle = () => {
  document.title = t('meta.page_title')
}

onMounted(() => {
  updatePageTitle()
})
</script>

<style scoped>
.language-switcher {
  @apply relative inline-block;
}

.language-select {
  @apply
    appearance-none
    bg-white
    border
    border-gray-300
    rounded-md
    px-3
    py-2
    pr-8
    text-sm
    focus:outline-none
    focus:ring-2
    focus:ring-blue-500
    focus:border-transparent
    cursor-pointer
    transition-colors
    duration-200;
}

.language-select:hover {
  @apply border-gray-400;
}

.dark .language-select {
  @apply bg-gray-800 border-gray-600 text-white;
}

.dark .language-select:hover {
  @apply border-gray-500;
}

/* 自定义下拉箭头 */
.language-select::after {
  content: '';
  @apply
    absolute
    right-2
    top-1/2
    transform
    -translate-y-1/2
    w-0
    h-0
    border-l-4
    border-r-4
    border-t-4
    border-l-transparent
    border-r-transparent
    border-t-gray-400
    pointer-events-none;
}
</style>
```

### 2.4 动态内容国际化 / Dynamic Content Internationalization

```typescript
// src/composables/useDynamicI18n.ts
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useDynamicI18n() {
  const { t, locale } = useI18n()

  // 动态获取数据标签
  const getDataLabel = (data: any, labelKey: string) => {
    return computed(() => {
      if (!data || !labelKey) return ''
      
      const localeKey = locale.value === 'zh-CN' ? 'zh' : 'en'
      const localizedKey = `${labelKey}_${localeKey}`
      
      return data[localizedKey] || data[labelKey] || data.name || ''
    })
  }

  // 格式化数字
  const formatNumber = (value: number, options: Intl.NumberFormatOptions = {}) => {
    return computed(() => {
      if (value === null || value === undefined) return ''
      
      const localeCode = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US'
      return new Intl.NumberFormat(localeCode, options).format(value)
    })
  }

  // 格式化货币
  const formatCurrency = (value: number, currency: string = 'USD') => {
    return computed(() => {
      if (value === null || value === undefined) return ''
      
      const localeCode = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US'
      const currencyCode = locale.value === 'zh-CN' ? 'CNY' : currency
      
      return new Intl.NumberFormat(localeCode, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value)
    })
  }

  // 格式化日期
  const formatDate = (value: string | Date, options: Intl.DateTimeFormatOptions = {}) => {
    return computed(() => {
      if (!value) return ''
      
      const date = typeof value === 'string' ? new Date(value) : value
      const localeCode = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US'
      
      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }
      
      return new Intl.DateTimeFormat(localeCode, {
        ...defaultOptions,
        ...options
      }).format(date)
    })
  }

  // 格式化相对时间
  const formatRelativeTime = (value: string | Date) => {
    return computed(() => {
      if (!value) return ''
      
      const date = typeof value === 'string' ? new Date(value) : value
      const now = new Date()
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
      
      const localeCode = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US'
      const rtf = new Intl.RelativeTimeFormat(localeCode, { numeric: 'auto' })
      
      if (diffInSeconds < 60) {
        return rtf.format(-diffInSeconds, 'second')
      } else if (diffInSeconds < 3600) {
        return rtf.format(-Math.floor(diffInSeconds / 60), 'minute')
      } else if (diffInSeconds < 86400) {
        return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour')
      } else if (diffInSeconds < 2592000) {
        return rtf.format(-Math.floor(diffInSeconds / 86400), 'day')
      } else if (diffInSeconds < 31536000) {
        return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month')
      } else {
        return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year')
      }
    })
  }

  // 获取本地化的枚举值
  const getLocalizedEnum = (enumType: string, value: string) => {
    return computed(() => {
      if (!value) return ''
      
      const enumKey = `enums.${enumType}.${value}`
      return t(enumKey, value)
    })
  }

  return {
    getDataLabel,
    formatNumber,
    formatCurrency,
    formatDate,
    formatRelativeTime,
    getLocalizedEnum
  }
}
```

### 2.5 数据库国际化支持 / Database Internationalization Support

```typescript
// src/services/i18nDataService.ts
import { supabase } from './supabaseClient'
import { useI18n } from 'vue-i18n'

export class I18nDataService {
  private locale: string

  constructor() {
    const { locale } = useI18n()
    this.locale = locale.value
  }

  // 获取本地化的数据分类
  async getLocalizedDataCategories() {
    const { data, error } = await supabase
      .from('data_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (error) throw error

    return data.map(category => ({
      ...category,
      display_name: this.getLocalizedField(category, 'display_name')
    }))
  }

  // 获取本地化的数据类型
  async getLocalizedDataTypes(categoryId?: string) {
    let query = supabase
      .from('data_types')
      .select('*')
      .eq('is_active', true)

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query

    if (error) throw error

    return data.map(type => ({
      ...type,
      display_name: this.getLocalizedField(type, 'display_name')
    }))
  }

  // 获取本地化的公司数据
  async getLocalizedCompanies() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('status', 'active')
      .order('name')

    if (error) throw error

    return data.map(company => ({
      ...company,
      display_name: company.display_name || company.name
    }))
  }

  // 获取本地化的竞品数据
  async getLocalizedCompetitiveData(companyId: string, options: any = {}) {
    const { data, error } = await supabase
      .from('competitive_data')
      .select(`
        *,
        companies(*),
        data_categories(*),
        data_types(*)
      `)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('collected_at', { ascending: false })

    if (error) throw error

    return data.map(item => ({
      ...item,
      category_name: this.getLocalizedField(item.data_categories, 'display_name'),
      type_name: this.getLocalizedField(item.data_types, 'display_name'),
      localized_data: this.localizeDataContent(item.processed_data)
    }))
  }

  // 获取本地化字段
  private getLocalizedField(obj: any, fieldName: string): string {
    if (!obj) return ''
    
    const localeKey = this.locale === 'zh-CN' ? 'zh' : 'en'
    const localizedKey = `${fieldName}_${localeKey}`
    
    return obj[localizedKey] || obj[fieldName] || obj.name || ''
  }

  // 本地化数据内容
  private localizeDataContent(data: any): any {
    if (!data || typeof data !== 'object') return data

    const localizedData = { ...data }

    // 处理常见的可本地化字段
    const localizableFields = [
      'title',
      'description',
      'content',
      'summary',
      'category',
      'type',
      'source',
      'status'
    ]

    localizableFields.forEach(field => {
      if (localizedData[field]) {
        localizedData[field] = this.translateContent(localizedData[field])
      }
    })

    return localizedData
  }

  // 翻译内容
  private translateContent(content: string): string {
    // 这里可以集成翻译服务 API
    // 目前返回原内容
    return content
  }

  // 更新语言设置
  updateLocale(newLocale: string) {
    this.locale = newLocale
  }
}
```

## 3. 组件国际化集成 / Component Internationalization Integration

### 3.1 图表组件国际化 / Chart Component Internationalization

```vue
<!-- src/components/charts/LocalizedChart.vue -->
<template>
  <div class="localized-chart">
    <div class="chart-header">
      <h3 class="chart-title">{{ localizedTitle }}</h3>
      <p class="chart-subtitle">{{ localizedSubtitle }}</p>
    </div>
    
    <EChartsComponent
      :options="localizedChartOptions"
      :height="height"
      :loading="loading"
      @chart-ready="handleChartReady"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDynamicI18n } from '@/composables/useDynamicI18n'
import EChartsComponent from './EChartsComponent.vue'

interface Props {
  title?: string
  subtitle?: string
  data: any[]
  type: 'line' | 'bar' | 'pie'
  height?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
  loading: false
})

const emit = defineEmits<{
  chartReady: [chart: any]
}>()

const { t, locale } = useI18n()
const { formatNumber, formatCurrency, formatDate } = useDynamicI18n()

// 本地化标题
const localizedTitle = computed(() => {
  return props.title ? t(props.title) : ''
})

const localizedSubtitle = computed(() => {
  return props.subtitle ? t(props.subtitle) : ''
})

// 本地化图表配置
const localizedChartOptions = computed(() => {
  const baseOptions = {
    animation: true,
    animationDuration: 1000,
    responsive: true,
    maintainAspectRatio: false,
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        return formatTooltip(params)
      }
    },
    legend: {
      show: true,
      orient: 'horizontal',
      left: 'center',
      top: 'bottom',
      textStyle: {
        color: locale.value === 'zh-CN' ? '#333' : '#666'
      }
    },
    grid: {
      top: '15%',
      left: '10%',
      right: '10%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      name: t('charts.x_axis'),
      nameTextStyle: {
        color: '#666'
      },
      axisLabel: {
        color: '#666',
        formatter: (value: string) => {
          // 处理日期格式
          if (isValidDate(value)) {
            return formatDate(value, { month: 'short', day: 'numeric' }).value
          }
          return value
        }
      }
    },
    yAxis: {
      type: 'value',
      name: t('charts.y_axis'),
      nameTextStyle: {
        color: '#666'
      },
      axisLabel: {
        color: '#666',
        formatter: (value: number) => {
          return formatNumber(value).value
        }
      }
    }
  }

  // 根据图表类型添加特定配置
  switch (props.type) {
    case 'line':
      return {
        ...baseOptions,
        series: props.data.map(series => ({
          ...series,
          type: 'line',
          smooth: true,
          emphasis: {
            focus: 'series'
          }
        }))
      }
    
    case 'bar':
      return {
        ...baseOptions,
        series: props.data.map(series => ({
          ...series,
          type: 'bar',
          emphasis: {
            focus: 'series'
          }
        }))
      }
    
    case 'pie':
      return {
        ...baseOptions,
        series: [{
          type: 'pie',
          data: props.data,
          radius: ['40%', '70%'],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            formatter: '{b}: {c} ({d}%)'
          }
        }]
      }
    
    default:
      return baseOptions
  }
})

// 格式化提示信息
const formatTooltip = (params: any) => {
  if (!Array.isArray(params)) {
    params = [params]
  }

  let tooltipContent = ''
  
  params.forEach((param: any, index: number) => {
    if (index === 0) {
      tooltipContent += `<div class="tooltip-header">${param.name}</div>`
    }
    
    const value = typeof param.value === 'number' 
      ? formatNumber(param.value).value 
      : param.value
    
    tooltipContent += `
      <div class="tooltip-item">
        <span class="tooltip-marker" style="background-color: ${param.color}"></span>
        <span class="tooltip-name">${param.seriesName}:</span>
        <span class="tooltip-value">${value}</span>
      </div>
    `
  })

  return tooltipContent
}

// 验证日期格式
const isValidDate = (dateString: string) => {
  return !isNaN(Date.parse(dateString))
}

// 处理图表就绪事件
const handleChartReady = (chart: any) => {
  emit('chartReady', chart)
}

// 监听语言变化
watch(locale, () => {
  // 图表会自动重新渲染
}, { flush: 'post' })
</script>

<style scoped>
.localized-chart {
  @apply w-full h-full;
}

.chart-header {
  @apply mb-4 text-center;
}

.chart-title {
  @apply text-xl font-semibold text-gray-800 mb-2;
}

.chart-subtitle {
  @apply text-sm text-gray-600;
}

.dark .chart-title {
  @apply text-gray-200;
}

.dark .chart-subtitle {
  @apply text-gray-400;
}

/* 提示信息样式 */
:global(.tooltip-header) {
  @apply font-semibold mb-2 pb-1 border-b border-gray-200;
}

:global(.tooltip-item) {
  @apply flex items-center justify-between py-1;
}

:global(.tooltip-marker) {
  @apply inline-block w-3 h-3 rounded-full mr-2;
}

:global(.tooltip-name) {
  @apply text-gray-600;
}

:global(.tooltip-value) {
  @apply font-semibold ml-auto;
}
</style>
```

### 3.2 数据表格国际化 / Data Table Internationalization

```vue
<!-- src/components/common/LocalizedDataTable.vue -->
<template>
  <div class="localized-data-table">
    <!-- 表格头部 -->
    <div class="table-header">
      <div class="table-controls">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('common.search')"
          class="search-input"
        />
        
        <select v-model="pageSize" class="page-size-select">
          <option v-for="size in pageSizeOptions" :key="size" :value="size">
            {{ size }} {{ $t('common.items_per_page') }}
          </option>
        </select>
      </div>
      
      <div class="table-actions">
        <button @click="refreshData" class="btn btn-secondary">
          {{ $t('common.refresh') }}
        </button>
        <button @click="exportData" class="btn btn-primary">
          {{ $t('common.export') }}
        </button>
      </div>
    </div>

    <!-- 表格内容 -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th
              v-for="column in localizedColumns"
              :key="column.key"
              :class="['table-header-cell', getSortClass(column.key)]"
              @click="handleSort(column.key)"
            >
              <div class="header-content">
                <span>{{ column.label }}</span>
                <span v-if="column.sortable" class="sort-indicator">
                  <i class="sort-icon"></i>
                </span>
              </div>
            </th>
          </tr>
        </thead>
        
        <tbody>
          <tr v-if="loading" class="loading-row">
            <td :colspan="localizedColumns.length" class="loading-cell">
              {{ $t('common.loading') }}
            </td>
          </tr>
          
          <tr v-else-if="paginatedData.length === 0" class="empty-row">
            <td :colspan="localizedColumns.length" class="empty-cell">
              {{ $t('common.no_data') }}
            </td>
          </tr>
          
          <tr
            v-else
            v-for="(row, index) in paginatedData"
            :key="getRowKey(row, index)"
            class="table-row"
            @click="handleRowClick(row)"
          >
            <td
              v-for="column in localizedColumns"
              :key="column.key"
              class="table-cell"
            >
              <div class="cell-content">
                <component
                  v-if="column.component"
                  :is="column.component"
                  :value="getColumnValue(row, column.key)"
                  :row="row"
                  :column="column"
                />
                <span v-else>
                  {{ formatCellValue(row, column) }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="table-pagination">
      <div class="pagination-info">
        {{ $t('common.showing_items', {
          start: (currentPage - 1) * pageSize + 1,
          end: Math.min(currentPage * pageSize, filteredData.length),
          total: filteredData.length
        }) }}
      </div>
      
      <div class="pagination-controls">
        <button
          @click="previousPage"
          :disabled="currentPage === 1"
          class="btn btn-secondary"
        >
          {{ $t('common.previous') }}
        </button>
        
        <span class="page-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="goToPage(page)"
            :class="['page-btn', { active: page === currentPage }]"
          >
            {{ page }}
          </button>
        </span>
        
        <button
          @click="nextPage"
          :disabled="currentPage === totalPages"
          class="btn btn-secondary"
        >
          {{ $t('common.next') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDynamicI18n } from '@/composables/useDynamicI18n'

interface Column {
  key: string
  label: string
  sortable?: boolean
  type?: 'text' | 'number' | 'date' | 'currency' | 'boolean'
  component?: any
  width?: string
}

interface Props {
  data: any[]
  columns: Column[]
  loading?: boolean
  pageSize?: number
  searchable?: boolean
  sortable?: boolean
  rowKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  pageSize: 20,
  searchable: true,
  sortable: true,
  rowKey: 'id'
})

const emit = defineEmits<{
  rowClick: [row: any]
  refresh: []
  export: []
}>()

const { t, locale } = useI18n()
const { formatNumber, formatCurrency, formatDate } = useDynamicI18n()

// 响应式数据
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(props.pageSize)
const sortKey = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')

const pageSizeOptions = [10, 20, 50, 100]

// 本地化列定义
const localizedColumns = computed(() => {
  return props.columns.map(column => ({
    ...column,
    label: t(column.label, column.label)
  }))
})

// 过滤数据
const filteredData = computed(() => {
  if (!props.searchable || !searchQuery.value) {
    return props.data
  }

  const query = searchQuery.value.toLowerCase()
  return props.data.filter(row => {
    return Object.values(row).some(value => 
      String(value).toLowerCase().includes(query)
    )
  })
})

// 排序数据
const sortedData = computed(() => {
  if (!sortKey.value) return filteredData.value

  return [...filteredData.value].sort((a, b) => {
    const aValue = getColumnValue(a, sortKey.value)
    const bValue = getColumnValue(b, sortKey.value)

    if (aValue === bValue) return 0

    const result = aValue > bValue ? 1 : -1
    return sortOrder.value === 'asc' ? result : -result
  })
})

// 分页数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedData.value.slice(start, end)
})

// 总页数
const totalPages = computed(() => {
  return Math.ceil(filteredData.value.length / pageSize.value)
})

// 可见页码
const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const range = 2
  const pages = []

  let start = Math.max(1, current - range)
  let end = Math.min(total, current + range)

  // 确保显示足够的页码
  if (end - start < 2 * range) {
    if (start === 1) {
      end = Math.min(total, start + 2 * range)
    } else if (end === total) {
      start = Math.max(1, end - 2 * range)
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// 获取行键
const getRowKey = (row: any, index: number) => {
  return row[props.rowKey] || index
}

// 获取列值
const getColumnValue = (row: any, key: string) => {
  return key.split('.').reduce((obj, k) => obj?.[k], row)
}

// 格式化单元格值
const formatCellValue = (row: any, column: Column) => {
  const value = getColumnValue(row, column.key)
  
  if (value === null || value === undefined) return ''

  switch (column.type) {
    case 'number':
      return formatNumber(value).value
    case 'currency':
      return formatCurrency(value).value
    case 'date':
      return formatDate(value).value
    case 'boolean':
      return value ? t('common.yes') : t('common.no')
    default:
      return String(value)
  }
}

// 处理排序
const handleSort = (key: string) => {
  if (!props.sortable) return

  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

// 获取排序样式
const getSortClass = (key: string) => {
  if (sortKey.value !== key) return ''
  return sortOrder.value === 'asc' ? 'sort-asc' : 'sort-desc'
}

// 处理行点击
const handleRowClick = (row: any) => {
  emit('rowClick', row)
}

// 分页控制
const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const goToPage = (page: number) => {
  currentPage.value = page
}

// 刷新数据
const refreshData = () => {
  emit('refresh')
}

// 导出数据
const exportData = () => {
  emit('export')
}

// 监听页面大小变化
watch(pageSize, () => {
  currentPage.value = 1
})

// 监听搜索查询变化
watch(searchQuery, () => {
  currentPage.value = 1
})
</script>

<style scoped>
.localized-data-table {
  @apply w-full bg-white rounded-lg shadow-sm border border-gray-200;
}

.table-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200;
}

.table-controls {
  @apply flex items-center space-x-4;
}

.search-input {
  @apply
    px-3
    py-2
    border
    border-gray-300
    rounded-md
    focus:outline-none
    focus:ring-2
    focus:ring-blue-500
    focus:border-transparent;
}

.page-size-select {
  @apply
    px-3
    py-2
    border
    border-gray-300
    rounded-md
    focus:outline-none
    focus:ring-2
    focus:ring-blue-500
    focus:border-transparent;
}

.table-actions {
  @apply flex items-center space-x-2;
}

.btn {
  @apply
    px-4
    py-2
    rounded-md
    font-medium
    transition-colors
    duration-200
    focus:outline-none
    focus:ring-2
    focus:ring-offset-2;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.btn-secondary {
  @apply bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500;
}

.table-container {
  @apply overflow-x-auto;
}

.data-table {
  @apply w-full border-collapse;
}

.table-header-cell {
  @apply
    px-6
    py-3
    text-left
    text-xs
    font-medium
    text-gray-500
    uppercase
    tracking-wider
    bg-gray-50
    border-b
    border-gray-200
    cursor-pointer
    hover:bg-gray-100
    transition-colors
    duration-200;
}

.header-content {
  @apply flex items-center justify-between;
}

.sort-indicator {
  @apply ml-2 text-gray-400;
}

.sort-asc .sort-indicator {
  @apply text-blue-600;
}

.sort-desc .sort-indicator {
  @apply text-blue-600;
}

.table-row {
  @apply hover:bg-gray-50 cursor-pointer transition-colors duration-200;
}

.table-cell {
  @apply px-6 py-4 whitespace-nowrap border-b border-gray-200;
}

.cell-content {
  @apply text-sm text-gray-900;
}

.loading-row,
.empty-row {
  @apply bg-gray-50;
}

.loading-cell,
.empty-cell {
  @apply px-6 py-12 text-center text-gray-500;
}

.table-pagination {
  @apply flex items-center justify-between p-4 bg-gray-50 border-t border-gray-200;
}

.pagination-info {
  @apply text-sm text-gray-700;
}

.pagination-controls {
  @apply flex items-center space-x-2;
}

.page-numbers {
  @apply flex items-center space-x-1;
}

.page-btn {
  @apply
    px-3
    py-1
    text-sm
    border
    border-gray-300
    rounded-md
    hover:bg-gray-100
    transition-colors
    duration-200;
}

.page-btn.active {
  @apply bg-blue-600 text-white border-blue-600;
}

.dark .localized-data-table {
  @apply bg-gray-800 border-gray-700;
}

.dark .table-header {
  @apply border-gray-700;
}

.dark .table-header-cell {
  @apply bg-gray-700 text-gray-300 border-gray-600;
}

.dark .table-row:hover {
  @apply bg-gray-700;
}

.dark .table-cell {
  @apply border-gray-600;
}

.dark .cell-content {
  @apply text-gray-100;
}

.dark .table-pagination {
  @apply bg-gray-700 border-gray-600;
}

.dark .pagination-info {
  @apply text-gray-300;
}
</style>
```

## 4. 总结 / Summary

这个国际化扩展方案提供了：

1. **完整的 Vue i18n 配置** - 支持中英文切换和数字、日期格式化
2. **结构化翻译文件** - 按功能模块组织的翻译键值
3. **动态内容国际化** - 支持数据库内容的本地化
4. **组件级国际化** - 图表、表格等组件的完整国际化支持
5. **用户体验优化** - 语言切换组件和本地化存储
6. **可扩展性** - 易于添加新语言和翻译内容

这个方案确保了整个竞品洞察平台的完整国际化支持。