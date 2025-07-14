# 多语言国际化设计规范 (i18n Guidelines)

## 概述

本文档制定了 Unifi 渠道情报分析平台的多语言国际化标准和最佳实践，确保应用程序能够支持中英文无缝切换，并为未来扩展更多语言提供框架。

## 1. 核心原则

### 1.1 零硬编码原则
- **绝对禁止**在代码中直接使用硬编码的可显示文本
- 所有用户可见的文本必须通过i18n系统管理
- 包括但不限于：标题、按钮文本、提示信息、错误消息、数据标签等

### 1.2 键值命名规范
- 使用英文，采用`snake_case`命名
- 键值应具有层次结构，便于组织和查找
- 键名应该语义明确，避免使用数字索引

```javascript
// ✅ 正确示例
{
  "dashboard": {
    "modules": {
      "financial_overview": {
        "title": "Financial Overview",
        "description": "..."
      }
    }
  }
}

// ❌ 错误示例
{
  "page1_title": "Dashboard",
  "btn1": "Submit",
  "text123": "Some text"
}
```

### 1.3 语言完整性原则
- 每个支持的语言必须包含所有的翻译键
- 不允许某个语言缺失翻译键
- 定期审查和同步语言文件

## 2. 文件结构规范

### 2.1 目录结构
```
src/
├── locales/
│   ├── zh.json          # 中文翻译
│   ├── en.json          # 英文翻译
│   └── index.js         # i18n配置文件
├── utils/
│   ├── i18nData.js      # 国际化数据工具
│   └── ...
└── ...
```

### 2.2 语言文件组织

#### 2.2.1 顶级分类
```json
{
  "brand": {},           // 品牌相关
  "badges": {},          // 标签徽章
  "language": {},        // 语言切换
  "nav": {},            // 导航菜单
  "common": {},         // 通用组件
  "dashboard": {},      // 仪表盘
  "financial": {},      // 财务分析
  "distribution": {},   // 分销网络
  "reseller": {},       // 经销商分析
  "service": {},        // 服务提供商
  "strategic": {},      // 战略分析
  "competitive": {},    // 竞争情报
  "charts": {},         // 图表相关
  "metrics": {},        // 指标数据
  "analysis": {},       // 分析词汇
  "footer": {},         // 页脚信息
  "channel_data": {}    // 渠道数据
}
```

#### 2.2.2 命名层次规范
```json
{
  "模块名": {
    "title": "页面标题",
    "subtitle": "页面副标题",
    "sections": {
      "section_name": {
        "title": "区块标题",
        "items": {
          "item_key": "具体内容"
        }
      }
    },
    "actions": {
      "save": "保存",
      "cancel": "取消"
    },
    "messages": {
      "success": "成功信息",
      "error": "错误信息"
    }
  }
}
```

## 3. 实现规范

### 3.1 Vue组件中的使用

#### 3.1.1 模板中使用
```vue
<template>
  <!-- ✅ 正确：直接使用$t()函数 -->
  <h1>{{ $t('dashboard.title') }}</h1>
  <button>{{ $t('common.actions.save') }}</button>
  
  <!-- ❌ 错误：硬编码文本 -->
  <h1>仪表盘</h1>
  <button>保存</button>
</template>
```

#### 3.1.2 脚本中使用
```javascript
// ✅ 正确：使用useI18n组合式API
import { useI18n } from 'vue-i18n'

export default {
  setup() {
    const { t } = useI18n()
    
    const dynamicData = computed(() => ({
      title: t('dashboard.title'),
      items: [
        { label: t('dashboard.item1'), value: 'data1' },
        { label: t('dashboard.item2'), value: 'data2' }
      ]
    }))
    
    return { dynamicData }
  }
}
```

#### 3.1.3 动态内容处理
```javascript
// ✅ 对于包含变量的文本
{
  "metrics": {
    "revenue_percentage": "Revenue percentage: {percentage}%",
    "last_updated": "Last updated: {time}"
  }
}

// 在组件中使用
const message = t('metrics.revenue_percentage', { percentage: 88 })
const updateTime = t('metrics.last_updated', { time: lastUpdated.value })
```

### 3.2 数据结构国际化

#### 3.2.1 静态数据处理
对于包含可显示文本的静态数据，应该：

```javascript
// ❌ 错误：在数据中硬编码
const distributors = [
  {
    name: 'Ingram Micro',
    value_proposition: '规模化和广泛市场覆盖'  // 硬编码中文
  }
]

// ✅ 正确：使用键值引用
const distributors = [
  {
    name: 'Ingram Micro',
    value_proposition_key: 'ingram_micro'  // 引用翻译键
  }
]

// 在组件中使用
const displayText = computed(() => 
  t(`channel_data.distributors.${distributor.value_proposition_key}.value_proposition`)
)
```

#### 3.2.2 API数据处理
```javascript
// 对于从API获取的数据，在前端进行国际化转换
const processApiData = (apiData) => {
  return apiData.map(item => ({
    ...item,
    displayName: t(`regions.${item.code}`),
    description: t(`regions.${item.code}.description`)
  }))
}
```

### 3.3 路由和页面标题

#### 3.3.1 路由配置
```javascript
// router/index.js
const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { titleKey: 'nav.dashboard' }  // 使用titleKey而不是title
  }
]
```

#### 3.3.2 页面标题更新
```javascript
// App.vue中监听路由变化
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t, locale } = useI18n()

// 监听路由变化
watch(
  () => route.meta.titleKey,
  (titleKey) => {
    if (titleKey) {
      document.title = t(titleKey)
    }
  },
  { immediate: true }
)

// 监听语言变化
watch(locale, () => {
  if (route.meta.titleKey) {
    document.title = t(route.meta.titleKey)
  }
})
```

## 4. 数据管理规范

### 4.1 Store中的国际化
```javascript
// ❌ 错误：在store中存储硬编码文本
const state = {
  channelIssues: [
    {
      title: '库存分配不透明',
      description: '...'
    }
  ]
}

// ✅ 正确：在store中存储键值引用
const state = {
  channelIssues: [
    {
      titleKey: 'inventory_transparency',
      descriptionKey: 'inventory_transparency_desc'
    }
  ]
}
```

### 4.2 工具函数使用
创建专门的工具函数来处理国际化数据：

```javascript
// utils/i18nData.js
export function useChannelIssueData(issueKey) {
  const { t } = useI18n()
  
  return {
    title: computed(() => t(`channel_data.issues.${issueKey}.title`)),
    description: computed(() => t(`channel_data.issues.${issueKey}.description`)),
    impact: computed(() => t(`channel_data.issues.${issueKey}.impact`))
  }
}
```

## 5. 翻译质量标准

### 5.1 翻译原则
- **准确性**：翻译必须准确传达原意，不能有歧义
- **一致性**：相同概念在整个应用中使用相同的翻译
- **本地化**：符合目标语言的表达习惯
- **简洁性**：在保证准确的前提下，尽量简洁明了

### 5.2 术语管理
维护统一的术语库：

```json
{
  "terminology": {
    "distributor": "分销商",
    "reseller": "经销商", 
    "channel": "渠道",
    "revenue": "营收",
    "margin": "利润率"
  }
}
```

### 5.3 业务术语翻译标准
- **技术术语**：保持英文原文，如 "UniFi", "MSP", "SI"
- **财务术语**：使用标准的财务翻译，如 "Revenue" → "营收"
- **地理名称**：使用官方中文译名

## 6. 开发流程规范

### 6.1 新功能开发
1. **设计阶段**：确定所有需要显示的文本内容
2. **开发阶段**：
   - 先定义翻译键值结构
   - 添加到语言文件中
   - 在代码中使用i18n函数
3. **测试阶段**：验证所有语言的显示效果

### 6.2 翻译键值添加流程
1. 在 `zh.json` 中添加中文翻译
2. 在 `en.json` 中添加对应的英文翻译  
3. 确保键值路径完全一致
4. 测试语言切换功能

### 6.3 代码审查要点
- [ ] 检查是否有硬编码文本
- [ ] 验证翻译键值是否存在
- [ ] 确认中英文翻译都已添加
- [ ] 测试语言切换功能

## 7. 维护和扩展

### 7.1 定期维护
- **月度审查**：检查是否有遗漏的硬编码文本
- **季度同步**：确保所有语言文件的键值完整性
- **年度优化**：评估和优化翻译质量

### 7.2 新语言扩展
当需要支持新语言时：
1. 复制 `en.json` 作为模板
2. 翻译所有键值内容
3. 在 `src/locales/index.js` 中注册新语言
4. 更新语言切换组件
5. 全面测试新语言功能

### 7.3 工具支持
- 使用自动化工具检测遗漏的翻译键
- 建立翻译管理流程
- 考虑使用专业的翻译管理平台

## 8. 常见问题和解决方案

### 8.1 性能考虑
- 语言文件按模块拆分，避免单个文件过大
- 使用懒加载机制按需加载翻译内容
- 对于大量动态数据，考虑后端国际化

### 8.2 SEO优化
- 为不同语言设置正确的 `lang` 属性
- 考虑为不同语言生成不同的URL路径
- 确保搜索引擎能够正确识别内容语言

### 8.3 调试和错误处理
```javascript
// 在开发环境显示翻译键缺失警告
const config = {
  locale: 'zh',
  fallbackLocale: 'en',
  missingWarn: process.env.NODE_ENV === 'development',
  fallbackWarn: process.env.NODE_ENV === 'development'
}
```

## 9. 检查清单

### 9.1 开发完成检查
- [ ] 所有用户可见文本都使用了i18n
- [ ] 中英文翻译键值完整对应
- [ ] 页面标题支持国际化
- [ ] 动态数据正确处理国际化
- [ ] 语言切换功能正常工作
- [ ] 所有页面在两种语言下显示正常

### 9.2 发布前检查
- [ ] 翻译质量审查通过
- [ ] 所有浏览器兼容性测试通过
- [ ] 移动端显示正常
- [ ] 性能测试通过
- [ ] 无控制台错误或警告

## 10. 总结

通过遵循这些规范，我们能够：
- 确保应用程序的完整国际化支持
- 提供一致的用户体验
- 降低维护成本
- 为未来扩展更多语言打下基础

**记住：国际化不仅仅是翻译文本，更是要考虑不同文化背景下的用户体验和习惯。**