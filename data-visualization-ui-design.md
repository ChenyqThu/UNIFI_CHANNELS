# 数据可视化和跨维度分析界面设计方案
# Data Visualization and Cross-Dimensional Analysis UI Design

## 1. 界面设计概述 / UI Design Overview

### 1.1 设计理念 / Design Philosophy

**中文**: 构建一个直观、高效的多维度竞品数据可视化界面，支持跨维度关联分析，通过现代化的交互设计和智能化的数据呈现，帮助用户快速洞察竞品动态和市场趋势。

**English**: Build an intuitive, efficient multi-dimensional competitive data visualization interface that supports cross-dimensional correlation analysis, helping users quickly understand competitive dynamics and market trends through modern interactive design and intelligent data presentation.

### 1.2 核心设计原则 / Core Design Principles

- **多维度融合**: 在单一界面内展示多个数据维度的关联关系
- **实时响应**: 支持实时数据更新和动态交互
- **智能洞察**: 自动识别和突出显示关键趋势和异常
- **用户友好**: 简洁直观的操作流程和清晰的视觉层次
- **可定制性**: 支持用户自定义视图和个性化配置
- **移动适配**: 响应式设计，支持多设备访问

## 2. 主界面架构设计 / Main Interface Architecture

### 2.1 整体布局架构 / Overall Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           竞品智能分析平台                                        │
│                     Competitive Intelligence Platform                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────────────────────────────────────────┐ │
│  │  导航面板   │  │                    主工作区                                │ │
│  │  Nav Panel  │  │                 Main Workspace                             │ │
│  │             │  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │ ┌─────────┐ │  │  │                控制面板                                  │ │ │
│  │ │ 仪表板  │ │  │  │            Control Panel                               │ │ │
│  │ │Dashboard│ │  │  │  [时间] [公司] [维度] [视图] [筛选] [导出]              │ │ │
│  │ └─────────┘ │  │  └─────────────────────────────────────────────────────────┘ │ │
│  │             │  │                                                             │ │
│  │ ┌─────────┐ │  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │ 财务分析│ │  │  │                                                         │ │ │
│  │ │Financial│ │  │  │                    可视化区域                            │ │ │
│  │ └─────────┘ │  │  │                Visualization Area                       │ │ │
│  │             │  │  │                                                         │ │ │
│  │ ┌─────────┐ │  │  │    [图表1] [图表2] [图表3] [图表4]                     │ │ │
│  │ │ 渠道分析│ │  │  │                                                         │ │ │
│  │ │Channels │ │  │  │    [关联分析] [趋势预测] [异常检测]                      │ │ │
│  │ └─────────┘ │  │  │                                                         │ │ │
│  │             │  │  └─────────────────────────────────────────────────────────┘ │ │
│  │ ┌─────────┐ │  │                                                             │ │
│  │ │ 产品分析│ │  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │Products │ │  │  │                   洞察面板                               │ │ │
│  │ └─────────┘ │  │  │                Insights Panel                           │ │ │
│  │             │  │  │                                                         │ │ │
│  │ ┌─────────┐ │  │  │  [智能提醒] [关键指标] [趋势分析] [建议措施]            │ │ │
│  │ │ 舆情分析│ │  │  │                                                         │ │ │
│  │ │Sentiment│ │  │  └─────────────────────────────────────────────────────────┘ │ │
│  │ └─────────┘ │  │                                                             │ │
│  │             │  └─────────────────────────────────────────────────────────────┘ │
│  │ ┌─────────┐ │                                                                 │
│  │ │ 跨维分析│ │                                                                 │
│  │ │Cross-Dim│ │                                                                 │
│  │ └─────────┘ │                                                                 │
│  └─────────────┘                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 响应式布局适配 / Responsive Layout Adaptation

```typescript
// 响应式布局配置
const layoutConfig = {
  desktop: {
    sidebarWidth: '280px',
    mainContentPadding: '24px',
    chartColumns: 2,
    chartHeight: '400px'
  },
  tablet: {
    sidebarWidth: '240px',
    mainContentPadding: '16px',
    chartColumns: 1,
    chartHeight: '350px'
  },
  mobile: {
    sidebarCollapsed: true,
    mainContentPadding: '12px',
    chartColumns: 1,
    chartHeight: '300px'
  }
}

// Vue 3 响应式布局组件
<template>
  <div class="platform-layout" :class="layoutClass">
    <NavSidebar 
      :collapsed="isMobileView"
      :width="currentLayout.sidebarWidth"
    />
    <MainWorkspace 
      :padding="currentLayout.mainContentPadding"
      :chartColumns="currentLayout.chartColumns"
    />
  </div>
</template>
```

## 3. 核心可视化组件设计 / Core Visualization Components

### 3.1 多维度数据仪表板 / Multi-Dimensional Dashboard

```vue
<template>
  <div class="dashboard-container">
    <!-- 关键指标卡片 -->
    <div class="metrics-grid">
      <MetricCard
        v-for="metric in keyMetrics"
        :key="metric.id"
        :title="metric.title"
        :value="metric.value"
        :trend="metric.trend"
        :sparkline="metric.sparkline"
        :color="metric.color"
        @click="drillDown(metric)"
      />
    </div>

    <!-- 多维度关联热力图 -->
    <div class="heatmap-section">
      <CrossDimensionalHeatmap
        :data="correlationData"
        :dimensions="availableDimensions"
        @cellClick="exploreDimensions"
      />
    </div>

    <!-- 实时趋势监控 -->
    <div class="trend-monitoring">
      <RealTimeTrendChart
        :datasets="trendDatasets"
        :timeRange="selectedTimeRange"
        @anomalyDetected="handleAnomaly"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCompetitiveDataStore } from '@/stores/competitiveData'

const { t } = useI18n()
const competitiveStore = useCompetitiveDataStore()

// 关键指标配置
const keyMetrics = computed(() => [
  {
    id: 'revenue_growth',
    title: t('metrics.revenue_growth'),
    value: '12.5%',
    trend: 'up',
    sparkline: [/* 时间序列数据 */],
    color: '#10b981'
  },
  {
    id: 'market_share',
    title: t('metrics.market_share'),
    value: '18.3%',
    trend: 'stable',
    sparkline: [/* 时间序列数据 */],
    color: '#3b82f6'
  },
  {
    id: 'sentiment_score',
    title: t('metrics.sentiment_score'),
    value: '7.2/10',
    trend: 'down',
    sparkline: [/* 时间序列数据 */],
    color: '#f59e0b'
  }
])

// 跨维度关联分析
const correlationData = ref([
  { x: 'Financial', y: 'Sentiment', value: 0.78 },
  { x: 'Financial', y: 'Products', value: 0.65 },
  { x: 'Products', y: 'Channels', value: 0.82 },
  // ... 更多关联数据
])

// 深度钻取功能
const drillDown = (metric: any) => {
  // 导航到详细分析页面
  navigateToDetail(metric.id)
}
</script>
```

### 3.2 跨维度关联分析图表 / Cross-Dimensional Correlation Chart

```vue
<template>
  <div class="correlation-analysis">
    <div class="analysis-header">
      <h3>{{ t('analysis.cross_dimensional_correlation') }}</h3>
      <div class="dimension-selector">
        <Select
          v-model="selectedDimensions"
          :options="dimensionOptions"
          multiple
          :placeholder="t('analysis.select_dimensions')"
        />
      </div>
    </div>

    <!-- 关联网络图 -->
    <div class="network-chart">
      <NetworkGraph
        :nodes="correlationNodes"
        :links="correlationLinks"
        :config="networkConfig"
        @nodeClick="exploreNode"
        @linkClick="exploreLink"
      />
    </div>

    <!-- 关联强度矩阵 -->
    <div class="correlation-matrix">
      <CorrelationMatrix
        :data="correlationMatrix"
        :dimensions="selectedDimensions"
        @cellHover="showCorrelationDetail"
      />
    </div>

    <!-- 时间序列关联 -->
    <div class="time-series-correlation">
      <TimeSeriesCorrelation
        :data="timeSeriesData"
        :dimensions="selectedDimensions"
        @periodSelect="analyzePeriod"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// 网络图配置
const networkConfig = {
  nodes: {
    scaling: {
      min: 10,
      max: 50,
      label: {
        enabled: true,
        min: 14,
        max: 30
      }
    },
    color: {
      border: '#2b7ce9',
      background: '#97c2fc',
      highlight: {
        border: '#2b7ce9',
        background: '#d2e5ff'
      }
    }
  },
  edges: {
    color: {
      color: '#848484',
      highlight: '#848484'
    },
    width: 2,
    smooth: {
      enabled: true,
      type: 'continuous'
    }
  },
  physics: {
    enabled: true,
    stabilization: {
      iterations: 100
    }
  }
}

// 关联节点数据
const correlationNodes = computed(() => [
  { id: 'financial', label: t('dimensions.financial'), group: 'primary' },
  { id: 'channels', label: t('dimensions.channels'), group: 'secondary' },
  { id: 'products', label: t('dimensions.products'), group: 'secondary' },
  { id: 'sentiment', label: t('dimensions.sentiment'), group: 'tertiary' }
])

// 关联链接数据
const correlationLinks = computed(() => [
  { from: 'financial', to: 'channels', value: 0.78, label: '强关联' },
  { from: 'financial', to: 'products', value: 0.65, label: '中关联' },
  { from: 'products', to: 'sentiment', value: 0.82, label: '强关联' }
])
</script>
```

### 3.3 智能异常检测可视化 / Intelligent Anomaly Detection Visualization

```vue
<template>
  <div class="anomaly-detection">
    <div class="detection-header">
      <h3>{{ t('analysis.anomaly_detection') }}</h3>
      <div class="detection-controls">
        <Select
          v-model="detectionSensitivity"
          :options="sensitivityOptions"
          :placeholder="t('analysis.sensitivity')"
        />
        <Toggle
          v-model="realTimeDetection"
          :label="t('analysis.real_time_detection')"
        />
      </div>
    </div>

    <!-- 异常时间线 -->
    <div class="anomaly-timeline">
      <AnomalyTimeline
        :anomalies="detectedAnomalies"
        :timeRange="selectedTimeRange"
        @anomalyClick="investigateAnomaly"
      />
    </div>

    <!-- 异常分布热力图 -->
    <div class="anomaly-heatmap">
      <AnomalyHeatmap
        :data="anomalyDistribution"
        :dimensions="allDimensions"
        @patternClick="explorePattern"
      />
    </div>

    <!-- 异常详情面板 -->
    <div class="anomaly-details" v-if="selectedAnomaly">
      <AnomalyDetailPanel
        :anomaly="selectedAnomaly"
        @close="selectedAnomaly = null"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAnomalyDetectionStore } from '@/stores/anomalyDetection'

const anomalyStore = useAnomalyDetectionStore()

// 异常检测配置
const detectionSensitivity = ref('medium')
const realTimeDetection = ref(true)
const selectedAnomaly = ref(null)

// 敏感度选项
const sensitivityOptions = [
  { value: 'low', label: t('analysis.sensitivity_low') },
  { value: 'medium', label: t('analysis.sensitivity_medium') },
  { value: 'high', label: t('analysis.sensitivity_high') }
]

// 检测到的异常
const detectedAnomalies = computed(() => 
  anomalyStore.getAnomalies(detectionSensitivity.value)
)

// 异常分布数据
const anomalyDistribution = computed(() => 
  anomalyStore.getAnomalyDistribution()
)

// 实时检测监听
watch(realTimeDetection, (enabled) => {
  if (enabled) {
    anomalyStore.startRealTimeDetection()
  } else {
    anomalyStore.stopRealTimeDetection()
  }
})

// 异常调查功能
const investigateAnomaly = (anomaly: any) => {
  selectedAnomaly.value = anomaly
  // 触发详细分析
  anomalyStore.investigateAnomaly(anomaly.id)
}
</script>
```

## 4. 交互设计模式 / Interaction Design Patterns

### 4.1 钻取和筛选交互 / Drill-down and Filtering Interactions

```typescript
// 钻取交互管理器
class DrillDownManager {
  private breadcrumb: DrillDownLevel[] = []
  private currentContext: AnalysisContext

  // 深度钻取
  drillDown(dimension: string, filter: FilterCriteria) {
    this.breadcrumb.push({
      dimension,
      filter,
      timestamp: new Date()
    })
    
    this.updateContext(dimension, filter)
    this.refreshVisualization()
  }

  // 钻取回退
  drillUp(targetLevel?: number) {
    if (targetLevel) {
      this.breadcrumb = this.breadcrumb.slice(0, targetLevel)
    } else {
      this.breadcrumb.pop()
    }
    
    this.restoreContext()
    this.refreshVisualization()
  }

  // 上下文更新
  private updateContext(dimension: string, filter: FilterCriteria) {
    this.currentContext = {
      ...this.currentContext,
      focusDimension: dimension,
      activeFilters: [
        ...this.currentContext.activeFilters,
        filter
      ]
    }
  }
}

// Vue 组件中的使用
const drillDownManager = new DrillDownManager()

// 图表点击事件
const onChartClick = (event: ChartClickEvent) => {
  const { dimension, value, context } = event
  
  drillDownManager.drillDown(dimension, {
    field: dimension,
    operator: 'equals',
    value: value
  })
}
```

### 4.2 实时数据同步交互 / Real-time Data Synchronization

```typescript
// 实时数据同步组件
export class RealTimeDataSync {
  private websocket: WebSocket
  private subscriptions: Map<string, Subscription> = new Map()
  private updateCallbacks: Map<string, UpdateCallback[]> = new Map()

  constructor(private supabaseClient: SupabaseClient) {
    this.initializeWebSocket()
  }

  // 订阅数据更新
  subscribe(
    table: string, 
    filter: RealtimeFilter, 
    callback: UpdateCallback
  ) {
    const subscription = this.supabaseClient
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter.toPostgresFilter()
        },
        (payload) => {
          this.handleDataUpdate(table, payload, callback)
        }
      )
      .subscribe()

    this.subscriptions.set(`${table}-${filter.id}`, subscription)
    
    // 注册回调
    if (!this.updateCallbacks.has(table)) {
      this.updateCallbacks.set(table, [])
    }
    this.updateCallbacks.get(table)!.push(callback)
  }

  // 处理数据更新
  private handleDataUpdate(
    table: string, 
    payload: RealtimePayload, 
    callback: UpdateCallback
  ) {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    // 更新本地缓存
    this.updateLocalCache(table, eventType, newRecord, oldRecord)
    
    // 触发回调
    callback({
      eventType,
      table,
      newRecord,
      oldRecord,
      timestamp: new Date()
    })
    
    // 触发UI更新
    this.triggerUIUpdate(table, eventType)
  }

  // 批量更新优化
  private batchUpdateQueue: UpdateEvent[] = []
  private updateTimer: NodeJS.Timeout | null = null

  private triggerUIUpdate(table: string, eventType: string) {
    this.batchUpdateQueue.push({ table, eventType, timestamp: new Date() })
    
    if (this.updateTimer) {
      clearTimeout(this.updateTimer)
    }
    
    this.updateTimer = setTimeout(() => {
      this.processBatchUpdates()
      this.batchUpdateQueue = []
    }, 100) // 100ms 批量更新间隔
  }
}
```

## 5. 可视化组件库 / Visualization Component Library

### 5.1 ECharts 配置和主题 / ECharts Configuration and Themes

```typescript
// ECharts 主题配置
export const competitiveTheme = {
  color: [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ],
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: 12,
    color: '#374151'
  },
  title: {
    textStyle: {
      fontSize: 16,
      fontWeight: 600,
      color: '#111827'
    }
  },
  legend: {
    textStyle: {
      fontSize: 12,
      color: '#6b7280'
    }
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    textStyle: {
      color: '#374151'
    },
    extraCssText: 'border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  }
}

// 多维度关联图表组件
export class MultiDimensionalChart {
  private chart: ECharts
  private data: MultiDimensionalData
  private config: ChartConfig

  constructor(container: HTMLElement, config: ChartConfig) {
    this.chart = echarts.init(container, competitiveTheme)
    this.config = config
    this.setupEventListeners()
  }

  // 更新数据
  updateData(data: MultiDimensionalData) {
    this.data = data
    const option = this.generateChartOption()
    this.chart.setOption(option, true)
  }

  // 生成图表配置
  private generateChartOption(): EChartsOption {
    return {
      title: {
        text: this.config.title,
        left: 'center'
      },
      series: this.generateSeries(),
      xAxis: this.generateXAxis(),
      yAxis: this.generateYAxis(),
      tooltip: this.generateTooltip(),
      dataZoom: this.generateDataZoom()
    }
  }

  // 生成系列数据
  private generateSeries(): SeriesOption[] {
    return this.data.dimensions.map((dimension, index) => ({
      name: dimension.name,
      type: dimension.chartType || 'line',
      data: dimension.values,
      smooth: true,
      emphasis: {
        focus: 'series'
      },
      markPoint: {
        data: this.generateMarkPoints(dimension)
      }
    }))
  }

  // 生成标记点（异常值）
  private generateMarkPoints(dimension: DimensionData): MarkPointDataItemOption[] {
    return dimension.anomalies?.map(anomaly => ({
      type: 'max',
      name: anomaly.type,
      value: anomaly.value,
      itemStyle: {
        color: '#ef4444'
      }
    })) || []
  }
}
```

### 5.2 自定义可视化组件 / Custom Visualization Components

```vue
<template>
  <div class="competitive-radar-chart">
    <div class="chart-header">
      <h3>{{ title }}</h3>
      <div class="chart-controls">
        <Select
          v-model="selectedCompanies"
          :options="companyOptions"
          multiple
          :placeholder="t('chart.select_companies')"
        />
        <Select
          v-model="selectedMetrics"
          :options="metricOptions"
          multiple
          :placeholder="t('chart.select_metrics')"
        />
      </div>
    </div>

    <div class="chart-container" ref="chartContainer">
      <!-- ECharts 雷达图 -->
    </div>

    <div class="chart-insights">
      <div class="insight-card" v-for="insight in insights" :key="insight.id">
        <div class="insight-icon">
          <Icon :name="insight.icon" :color="insight.color" />
        </div>
        <div class="insight-content">
          <h4>{{ insight.title }}</h4>
          <p>{{ insight.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useCompetitiveAnalysisStore } from '@/stores/competitiveAnalysis'

interface Props {
  title: string
  companies: string[]
  metrics: string[]
}

const props = defineProps<Props>()
const analysisStore = useCompetitiveAnalysisStore()

const chartContainer = ref<HTMLElement>()
const selectedCompanies = ref<string[]>(props.companies)
const selectedMetrics = ref<string[]>(props.metrics)

// 雷达图配置
const radarOption = computed(() => ({
  title: {
    text: props.title,
    left: 'center'
  },
  legend: {
    data: selectedCompanies.value,
    bottom: '5%'
  },
  radar: {
    indicator: selectedMetrics.value.map(metric => ({
      name: t(`metrics.${metric}`),
      max: 100
    })),
    center: ['50%', '50%'],
    radius: '70%'
  },
  series: [{
    name: t('chart.competitive_analysis'),
    type: 'radar',
    data: generateRadarData()
  }]
}))

// 生成雷达图数据
const generateRadarData = () => {
  return selectedCompanies.value.map(company => ({
    value: selectedMetrics.value.map(metric => 
      analysisStore.getMetricValue(company, metric)
    ),
    name: company,
    itemStyle: {
      color: getCompanyColor(company)
    }
  }))
}

// 智能洞察
const insights = computed(() => 
  analysisStore.generateInsights(selectedCompanies.value, selectedMetrics.value)
)

// 图表初始化
onMounted(() => {
  if (chartContainer.value) {
    const chart = echarts.init(chartContainer.value, competitiveTheme)
    chart.setOption(radarOption.value)
    
    // 监听数据变化
    watch(
      [selectedCompanies, selectedMetrics],
      () => {
        chart.setOption(radarOption.value, true)
      },
      { deep: true }
    )
  }
})
</script>
```

## 6. 移动端适配设计 / Mobile Adaptation Design

### 6.1 移动端布局策略 / Mobile Layout Strategy

```vue
<template>
  <div class="mobile-competitive-dashboard">
    <!-- 移动端头部 -->
    <div class="mobile-header">
      <div class="header-left">
        <Button @click="toggleSidebar" variant="ghost" size="sm">
          <Icon name="menu" />
        </Button>
        <h1>{{ t('app.title') }}</h1>
      </div>
      <div class="header-right">
        <Button @click="showSearch" variant="ghost" size="sm">
          <Icon name="search" />
        </Button>
        <Button @click="showNotifications" variant="ghost" size="sm">
          <Icon name="bell" />
          <Badge v-if="unreadCount > 0" :count="unreadCount" />
        </Button>
      </div>
    </div>

    <!-- 移动端指标卡片 -->
    <div class="mobile-metrics">
      <Swiper
        :slides-per-view="1.2"
        :space-between="16"
        :centered-slides="false"
      >
        <SwiperSlide v-for="metric in keyMetrics" :key="metric.id">
          <MetricCard
            :title="metric.title"
            :value="metric.value"
            :trend="metric.trend"
            :compact="true"
            @click="openMetricDetail(metric)"
          />
        </SwiperSlide>
      </Swiper>
    </div>

    <!-- 移动端图表区域 -->
    <div class="mobile-charts">
      <div class="chart-tabs">
        <TabBar v-model="activeTab" :tabs="chartTabs" />
      </div>
      
      <div class="chart-content">
        <component
          :is="activeChartComponent"
          :data="chartData"
          :height="chartHeight"
          @chart-click="handleChartClick"
        />
      </div>
    </div>

    <!-- 移动端快速操作 -->
    <div class="mobile-quick-actions">
      <Button
        v-for="action in quickActions"
        :key="action.id"
        @click="executeAction(action)"
        :variant="action.variant"
        size="sm"
      >
        <Icon :name="action.icon" />
        {{ action.label }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBreakpoints } from '@/composables/useBreakpoints'

const { isMobile, isTablet } = useBreakpoints()

// 移动端图表高度
const chartHeight = computed(() => {
  if (isMobile.value) return '250px'
  if (isTablet.value) return '300px'
  return '400px'
})

// 图表标签页
const chartTabs = [
  { id: 'overview', label: t('tabs.overview'), icon: 'chart-bar' },
  { id: 'financial', label: t('tabs.financial'), icon: 'currency-dollar' },
  { id: 'sentiment', label: t('tabs.sentiment'), icon: 'heart' },
  { id: 'correlation', label: t('tabs.correlation'), icon: 'link' }
]

// 快速操作
const quickActions = [
  { id: 'refresh', label: t('actions.refresh'), icon: 'refresh', variant: 'outline' },
  { id: 'export', label: t('actions.export'), icon: 'download', variant: 'outline' },
  { id: 'share', label: t('actions.share'), icon: 'share', variant: 'outline' }
]
</script>
```

### 6.2 触摸交互优化 / Touch Interaction Optimization

```typescript
// 触摸手势管理器
export class TouchGestureManager {
  private element: HTMLElement
  private startPoint: TouchPoint
  private currentPoint: TouchPoint
  private gestureHandlers: Map<string, GestureHandler> = new Map()

  constructor(element: HTMLElement) {
    this.element = element
    this.bindEvents()
  }

  // 绑定触摸事件
  private bindEvents() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this))
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this))
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this))
  }

  // 处理触摸开始
  private handleTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    this.startPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }
  }

  // 处理触摸移动
  private handleTouchMove(event: TouchEvent) {
    event.preventDefault() // 防止页面滚动
    
    const touch = event.touches[0]
    this.currentPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }

    // 检测手势
    const gesture = this.detectGesture()
    if (gesture) {
      this.executeGesture(gesture)
    }
  }

  // 检测手势类型
  private detectGesture(): GestureType | null {
    const deltaX = this.currentPoint.x - this.startPoint.x
    const deltaY = this.currentPoint.y - this.startPoint.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const duration = this.currentPoint.timestamp - this.startPoint.timestamp

    // 滑动手势
    if (distance > 50 && duration < 300) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        return deltaX > 0 ? 'swipe-right' : 'swipe-left'
      } else {
        return deltaY > 0 ? 'swipe-down' : 'swipe-up'
      }
    }

    // 长按手势
    if (distance < 10 && duration > 500) {
      return 'long-press'
    }

    return null
  }

  // 注册手势处理器
  registerGesture(type: GestureType, handler: GestureHandler) {
    this.gestureHandlers.set(type, handler)
  }

  // 执行手势
  private executeGesture(gesture: GestureType) {
    const handler = this.gestureHandlers.get(gesture)
    if (handler) {
      handler({
        type: gesture,
        startPoint: this.startPoint,
        currentPoint: this.currentPoint,
        element: this.element
      })
    }
  }
}

// 在 Vue 组件中使用
const setupTouchGestures = (chartContainer: Ref<HTMLElement>) => {
  onMounted(() => {
    if (chartContainer.value) {
      const gestureManager = new TouchGestureManager(chartContainer.value)
      
      // 注册手势处理器
      gestureManager.registerGesture('swipe-left', () => {
        // 切换到下一个图表
        nextChart()
      })
      
      gestureManager.registerGesture('swipe-right', () => {
        // 切换到上一个图表
        previousChart()
      })
      
      gestureManager.registerGesture('long-press', () => {
        // 显示上下文菜单
        showContextMenu()
      })
    }
  })
}
```

## 7. 性能优化方案 / Performance Optimization

### 7.1 虚拟滚动和数据分页 / Virtual Scrolling and Data Pagination

```vue
<template>
  <div class="virtual-data-table">
    <div class="table-header">
      <div class="header-cell" v-for="column in columns" :key="column.key">
        {{ column.title }}
      </div>
    </div>
    
    <div
      class="table-body"
      ref="tableBody"
      @scroll="handleScroll"
      :style="{ height: tableHeight }"
    >
      <div
        class="table-content"
        :style="{ height: `${totalHeight}px`, paddingTop: `${offsetY}px` }"
      >
        <div
          class="table-row"
          v-for="(item, index) in visibleItems"
          :key="item.id"
          :style="{ height: `${itemHeight}px` }"
        >
          <div class="table-cell" v-for="column in columns" :key="column.key">
            {{ item[column.key] }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Props {
  data: any[]
  columns: TableColumn[]
  itemHeight: number
  tableHeight: string
}

const props = defineProps<Props>()

const tableBody = ref<HTMLElement>()
const scrollTop = ref(0)
const containerHeight = ref(0)

// 计算可见项目
const visibleItems = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight)
  const end = Math.min(
    start + Math.ceil(containerHeight.value / props.itemHeight) + 1,
    props.data.length
  )
  
  return props.data.slice(start, end)
})

// 计算总高度
const totalHeight = computed(() => props.data.length * props.itemHeight)

// 计算偏移量
const offsetY = computed(() => 
  Math.floor(scrollTop.value / props.itemHeight) * props.itemHeight
)

// 滚动处理
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
}

// 初始化
onMounted(() => {
  if (tableBody.value) {
    containerHeight.value = tableBody.value.clientHeight
  }
})
</script>
```

### 7.2 图表渲染优化 / Chart Rendering Optimization

```typescript
// 图表渲染优化器
export class ChartRenderOptimizer {
  private renderQueue: RenderTask[] = []
  private isRendering = false
  private rafId: number | null = null

  // 添加渲染任务
  addRenderTask(task: RenderTask) {
    this.renderQueue.push(task)
    if (!this.isRendering) {
      this.scheduleRender()
    }
  }

  // 调度渲染
  private scheduleRender() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
    }

    this.rafId = requestAnimationFrame(() => {
      this.processBatch()
    })
  }

  // 批量处理渲染任务
  private processBatch() {
    this.isRendering = true
    const startTime = performance.now()
    const maxBatchTime = 16 // 16ms 保证 60fps

    while (this.renderQueue.length > 0 && (performance.now() - startTime) < maxBatchTime) {
      const task = this.renderQueue.shift()!
      this.executeRenderTask(task)
    }

    if (this.renderQueue.length > 0) {
      this.scheduleRender()
    } else {
      this.isRendering = false
    }
  }

  // 执行渲染任务
  private executeRenderTask(task: RenderTask) {
    switch (task.type) {
      case 'chart-update':
        this.updateChart(task.chart, task.data)
        break
      case 'chart-resize':
        this.resizeChart(task.chart)
        break
      case 'chart-dispose':
        this.disposeChart(task.chart)
        break
    }
  }

  // 图表更新优化
  private updateChart(chart: ECharts, data: any) {
    // 使用 notMerge: false 进行增量更新
    chart.setOption(data, {
      notMerge: false,
      lazyUpdate: true,
      silent: true
    })
  }

  // 数据抽样优化
  sampleData(data: DataPoint[], maxPoints: number = 1000): DataPoint[] {
    if (data.length <= maxPoints) {
      return data
    }

    const step = Math.ceil(data.length / maxPoints)
    const sampledData: DataPoint[] = []

    for (let i = 0; i < data.length; i += step) {
      sampledData.push(data[i])
    }

    return sampledData
  }

  // 渐进式加载
  progressiveLoad(
    data: DataPoint[],
    chart: ECharts,
    chunkSize: number = 100
  ) {
    let currentIndex = 0
    const totalChunks = Math.ceil(data.length / chunkSize)
    
    const loadChunk = () => {
      if (currentIndex >= data.length) {
        return
      }

      const chunk = data.slice(currentIndex, currentIndex + chunkSize)
      const progress = (currentIndex / data.length) * 100

      // 更新图表
      chart.setOption({
        series: [{
          data: chunk,
          progressive: totalChunks,
          progressiveThreshold: chunkSize
        }]
      })

      currentIndex += chunkSize

      // 显示加载进度
      if (currentIndex < data.length) {
        setTimeout(loadChunk, 16) // 下一帧加载
      }
    }

    loadChunk()
  }
}
```

## 8. 用户体验优化 / User Experience Optimization

### 8.1 智能提示和引导 / Smart Tips and Guidance

```vue
<template>
  <div class="intelligent-guidance">
    <!-- 智能提示系统 -->
    <div class="smart-tips" v-if="activeTip">
      <div class="tip-content">
        <div class="tip-icon">
          <Icon :name="activeTip.icon" :color="activeTip.color" />
        </div>
        <div class="tip-text">
          <h4>{{ activeTip.title }}</h4>
          <p>{{ activeTip.description }}</p>
        </div>
        <div class="tip-actions">
          <Button @click="acceptTip" variant="primary" size="sm">
            {{ t('guidance.accept') }}
          </Button>
          <Button @click="dismissTip" variant="ghost" size="sm">
            {{ t('guidance.dismiss') }}
          </Button>
        </div>
      </div>
    </div>

    <!-- 上下文帮助 -->
    <div class="context-help" v-if="showContextHelp">
      <div class="help-overlay" @click="hideContextHelp"></div>
      <div class="help-panel">
        <div class="help-header">
          <h3>{{ t('help.title') }}</h3>
          <Button @click="hideContextHelp" variant="ghost" size="sm">
            <Icon name="x" />
          </Button>
        </div>
        <div class="help-content">
          <div class="help-section" v-for="section in helpSections" :key="section.id">
            <h4>{{ section.title }}</h4>
            <p>{{ section.content }}</p>
            <div class="help-actions" v-if="section.actions">
              <Button
                v-for="action in section.actions"
                :key="action.id"
                @click="executeHelpAction(action)"
                variant="outline"
                size="sm"
              >
                {{ action.label }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能引导 -->
    <div class="feature-tour" v-if="showTour">
      <div class="tour-overlay"></div>
      <div class="tour-spotlight" :style="spotlightStyle"></div>
      <div class="tour-tooltip" :style="tooltipStyle">
        <div class="tooltip-content">
          <h4>{{ currentTourStep.title }}</h4>
          <p>{{ currentTourStep.description }}</p>
        </div>
        <div class="tooltip-actions">
          <Button @click="previousTourStep" variant="ghost" size="sm">
            {{ t('tour.previous') }}
          </Button>
          <Button @click="nextTourStep" variant="primary" size="sm">
            {{ t('tour.next') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useIntelligentGuidance } from '@/composables/useIntelligentGuidance'

const {
  activeTip,
  showContextHelp,
  helpSections,
  showTour,
  currentTourStep,
  acceptTip,
  dismissTip,
  startTour,
  nextTourStep,
  previousTourStep
} = useIntelligentGuidance()

// 聚光灯样式
const spotlightStyle = computed(() => {
  if (!currentTourStep.value) return {}
  
  const { element } = currentTourStep.value
  const rect = element.getBoundingClientRect()
  
  return {
    top: `${rect.top - 10}px`,
    left: `${rect.left - 10}px`,
    width: `${rect.width + 20}px`,
    height: `${rect.height + 20}px`
  }
})

// 提示框样式
const tooltipStyle = computed(() => {
  if (!currentTourStep.value) return {}
  
  const { element } = currentTourStep.value
  const rect = element.getBoundingClientRect()
  
  return {
    top: `${rect.bottom + 10}px`,
    left: `${rect.left}px`
  }
})
</script>
```

### 8.2 自适应布局和主题 / Adaptive Layout and Themes

```typescript
// 主题管理器
export class ThemeManager {
  private currentTheme: Theme = 'light'
  private systemTheme: Theme = 'light'
  private userPreference: Theme | 'system' = 'system'

  constructor() {
    this.detectSystemTheme()
    this.loadUserPreference()
    this.applyTheme()
  }

  // 检测系统主题
  private detectSystemTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.systemTheme = mediaQuery.matches ? 'dark' : 'light'
    
    mediaQuery.addEventListener('change', (e) => {
      this.systemTheme = e.matches ? 'dark' : 'light'
      if (this.userPreference === 'system') {
        this.applyTheme()
      }
    })
  }

  // 加载用户偏好
  private loadUserPreference() {
    const saved = localStorage.getItem('theme-preference')
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      this.userPreference = saved as Theme | 'system'
    }
  }

  // 应用主题
  private applyTheme() {
    const theme = this.userPreference === 'system' 
      ? this.systemTheme 
      : this.userPreference

    this.currentTheme = theme
    document.documentElement.setAttribute('data-theme', theme)
    
    // 更新图表主题
    this.updateChartThemes(theme)
  }

  // 更新图表主题
  private updateChartThemes(theme: Theme) {
    const chartTheme = theme === 'dark' ? darkChartTheme : lightChartTheme
    
    // 更新所有活动图表
    document.querySelectorAll('.chart-container').forEach(container => {
      const chart = echarts.getInstanceByDom(container as HTMLElement)
      if (chart) {
        chart.setOption(chartTheme, true)
      }
    })
  }

  // 设置主题
  setTheme(theme: Theme | 'system') {
    this.userPreference = theme
    localStorage.setItem('theme-preference', theme)
    this.applyTheme()
  }

  // 获取当前主题
  getCurrentTheme(): Theme {
    return this.currentTheme
  }
}

// 响应式布局管理器
export class ResponsiveLayoutManager {
  private breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  }

  private currentBreakpoint: string = 'lg'
  private layoutConfig: LayoutConfig = {}

  constructor() {
    this.detectBreakpoint()
    this.bindResizeListener()
  }

  // 检测断点
  private detectBreakpoint() {
    const width = window.innerWidth
    
    if (width < this.breakpoints.sm) {
      this.currentBreakpoint = 'xs'
    } else if (width < this.breakpoints.md) {
      this.currentBreakpoint = 'sm'
    } else if (width < this.breakpoints.lg) {
      this.currentBreakpoint = 'md'
    } else if (width < this.breakpoints.xl) {
      this.currentBreakpoint = 'lg'
    } else if (width < this.breakpoints['2xl']) {
      this.currentBreakpoint = 'xl'
    } else {
      this.currentBreakpoint = '2xl'
    }
  }

  // 绑定窗口大小监听
  private bindResizeListener() {
    let resizeTimer: NodeJS.Timeout
    
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        this.detectBreakpoint()
        this.applyLayout()
      }, 150)
    })
  }

  // 应用布局
  private applyLayout() {
    const config = this.getLayoutConfig()
    
    // 更新 CSS 变量
    document.documentElement.style.setProperty('--sidebar-width', config.sidebarWidth)
    document.documentElement.style.setProperty('--chart-columns', config.chartColumns.toString())
    document.documentElement.style.setProperty('--chart-height', config.chartHeight)
    
    // 触发重新布局事件
    window.dispatchEvent(new CustomEvent('layout-changed', {
      detail: { breakpoint: this.currentBreakpoint, config }
    }))
  }

  // 获取布局配置
  private getLayoutConfig(): LayoutConfig {
    const configs = {
      xs: {
        sidebarWidth: '0px',
        chartColumns: 1,
        chartHeight: '250px',
        showSidebar: false
      },
      sm: {
        sidebarWidth: '0px',
        chartColumns: 1,
        chartHeight: '300px',
        showSidebar: false
      },
      md: {
        sidebarWidth: '240px',
        chartColumns: 1,
        chartHeight: '350px',
        showSidebar: true
      },
      lg: {
        sidebarWidth: '280px',
        chartColumns: 2,
        chartHeight: '400px',
        showSidebar: true
      },
      xl: {
        sidebarWidth: '320px',
        chartColumns: 2,
        chartHeight: '450px',
        showSidebar: true
      },
      '2xl': {
        sidebarWidth: '360px',
        chartColumns: 3,
        chartHeight: '500px',
        showSidebar: true
      }
    }
    
    return configs[this.currentBreakpoint] || configs.lg
  }
}
```

## 9. 总结 / Summary

这个数据可视化和跨维度分析界面设计方案提供了：

### 核心特性 / Core Features
- **多维度数据融合**: 统一界面展示财务、渠道、产品、舆情等多维度数据
- **智能关联分析**: 自动识别跨维度数据关联和趋势
- **实时响应交互**: 支持实时数据更新和动态用户交互
- **移动端适配**: 完整的响应式设计和触摸优化
- **性能优化**: 虚拟滚动、渐进式加载、批量渲染等优化方案

### 技术实现 / Technical Implementation
- **Vue 3 + TypeScript**: 现代前端框架和类型安全
- **ECharts 集成**: 专业图表库和自定义可视化组件
- **智能用户体验**: 自适应布局、主题管理、智能引导
- **国际化支持**: 完整的中英文双语界面
- **模块化设计**: 可复用的组件和清晰的架构

### 用户价值 / User Value
- **提升决策效率**: 直观的多维度数据展示
- **深度洞察分析**: 跨维度关联发现和趋势预测
- **便捷操作体验**: 简洁的交互设计和智能引导
- **全设备支持**: 桌面端和移动端统一体验

这个设计方案为竞品智能分析平台提供了完整的前端可视化解决方案，支持多维度数据的统一展示和深度分析。