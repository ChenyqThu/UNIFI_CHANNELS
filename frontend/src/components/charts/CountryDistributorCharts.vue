<template>
  <div class="country-distributor-charts">
    <!-- Chart Type Switcher -->
    <div class="chart-controls mb-4">
      <div class="flex space-x-2 bg-gray-100 rounded-lg p-1">
        <button
          v-for="(mode, key) in chartModes"
          :key="key"
          @click="switchChartMode(key)"
          :disabled="loading"
          :class="[
            'px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center',
            currentMode === key 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900',
            loading ? 'opacity-50 cursor-not-allowed' : ''
          ]"
        >
          <span class="material-icons text-sm mr-1">{{ mode.icon }}</span>
          {{ mode.label }}
        </button>
      </div>
    </div>

    <!-- Chart Container -->
    <div class="chart-wrapper">
      <EChartsComponent
        :option="chartOption"
        height="500px"
        :loading="loading"
        :loadingText="$t('charts.loading')"
        @chart-click="handleChartClick"
        @chart-ready="handleChartReady"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import EChartsComponent from './EChartsComponent.vue'
import { loadMap } from '@/utils/mapLoader'

const { t } = useI18n()

// Props
const props = defineProps({
  countriesData: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['chart-click', 'chart-ready'])

// State
const currentMode = ref('map')
const chartRef = ref(null)
const mapLoaded = ref(false)
const loading = ref(false)

const chartModes = computed(() => ({
  map: { label: t('charts.map_view'), icon: 'public' },
  bar: { label: t('charts.bar_chart'), icon: 'bar_chart' },
  pie: { label: t('charts.pie_chart'), icon: 'pie_chart' }
}))

// 处理国家数据
const processedCountryData = computed(() => {
  return (props.countriesData || [])
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)
})

// 统一的图表配置 - 强制清除轴配置解决持久化问题
const chartOption = computed(() => {
  const chartData = processedCountryData.value
  
  if (!mapLoaded.value && currentMode.value === 'map') {
    return {
      title: {
        text: t('charts.loading_world_map'),
        left: 'center',
        top: 'middle'
      }
    }
  }

  // 基础配置 - 确保每次都是新对象，强制清除所有轴相关配置
  const baseConfig = {
    backgroundColor: 'transparent',
    animationDurationUpdate: 1000,
    animationEasingUpdate: 'cubicInOut',
    // 强制重置所有轴配置 - 使用 null 而不是 undefined 来确保完全清除
    xAxis: null,
    yAxis: null,
    grid: null,
    // 强制清除其他可能持久化的组件
    dataZoom: null,
    brush: null,
    timeline: null
  }

  // 地图配置
  if (currentMode.value === 'map') {
    return {
      ...baseConfig,
      title: {
        text: t('charts.global_distributor_distribution_by_country'),
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          if (params.data && params.data.value > 0) {
            const data = params.data
            return `${data.name}<br/>
                    ${t('charts.total')}: ${data.value}<br/>
                    ${t('charts.masters')}: ${data.masters || 0}<br/>
                    ${t('charts.resellers')}: ${data.resellers || 0}`
          }
          return `${params.name}: ${t('common.no_data')}`
        }
      },
      visualMap: {
        left: 'right',
        min: 0,
        max: Math.max(...chartData.map(d => d.value), 25),
        inRange: {
          color: ['#F0F9FF', '#E0F2FE', '#0EA5E9', '#0284C7', '#0369A1', '#1E40AF']
        },
        text: [t('charts.high'), t('charts.low')],
        calculable: true
      },
      series: [{
        id: 'distributionData',
        type: 'map',
        map: 'world',
        roam: true,
        scaleLimit: {
          min: 1,
          max: 20
        },
        universalTransition: { enabled: true, divideShape: 'clone' },
        animationDurationUpdate: 1000,
        data: [...chartData],
        itemStyle: {
          borderColor: '#9CA3AF',
          borderWidth: 0.5
        },
        emphasis: {
          itemStyle: {
            areaColor: '#FCD34D'
          }
        }
      }]
    }
  }
  
  // 柱状图配置 - 清除地图相关配置
  if (currentMode.value === 'bar') {
    const displayData = chartData.slice(0, 25).reverse()
    
    return {
      ...baseConfig,
      // 强制清除地图相关配置
      visualMap: null,
      geo: null,
      title: {
        text: t('charts.country_distributor_count'),
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const data = params[0]
          const originalData = chartData.find(item => item.name === data.name)
          if (originalData) {
            return `${data.name}<br/>
                    ${t('charts.total')}: ${data.value}<br/>
                    ${t('charts.masters')}: ${originalData.masters || 0}<br/>
                    ${t('charts.resellers')}: ${originalData.resellers || 0}`
          }
          return `${data.name}: ${data.value}`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'value'
      },
      yAxis: {
        type: 'category',
        data: displayData.map(item => item.name),
        axisLabel: {
          fontSize: 11
        }
      },
      series: [{
        id: 'distributionData',
        type: 'bar',
        universalTransition: { enabled: true, divideShape: 'clone' },
        animationDurationUpdate: 1000,
        data: displayData.map(item => item.value),
        itemStyle: {
          color: '#3B82F6'
        }
      }]
    }
  }
  
  // 饼图配置 - 强制清除轴配置
  if (currentMode.value === 'pie') {
    const top10Data = chartData.slice(0, 10)
    const otherValue = chartData.slice(10).reduce((sum, item) => sum + item.value, 0)
    const pieData = [...top10Data]
    
    if (otherValue > 0) {
      pieData.push({ name: t('charts.others'), value: otherValue })
    }
    
    return {
      ...baseConfig,
      // 强制清除地图和柱状图相关配置
      visualMap: null,
      geo: null,
      title: {
        text: t('charts.distributor_country_distribution'),
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          if (params.name === t('charts.others')) {
            return `${params.name}<br/>${t('charts.distributors')}: ${params.value} (${params.percent}%)`
          }
          const originalData = chartData.find(item => item.name === params.name)
          if (originalData) {
            return `${params.name}<br/>
                    ${t('charts.total')}: ${params.value} (${params.percent}%)<br/>
                    ${t('charts.masters')}: ${originalData.masters || 0}<br/>
                    ${t('charts.resellers')}: ${originalData.resellers || 0}`
          }
          return `${params.name}: ${params.value} (${params.percent}%)`
        }
      },
      series: [{
        id: 'distributionData',
        name: t('charts.distributor_count'),
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        universalTransition: { enabled: true, divideShape: 'clone' },
        animationDurationUpdate: 1000,
        data: [...pieData],
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    }
  }
  
  return {}
})

function switchChartMode(newMode) {
  if (loading.value || currentMode.value === newMode) return
  
  // 强制清除当前图表配置，避免轴配置持久化
  if (chartRef.value) {
    chartRef.value.clear()
  }
  
  // 切换模式，ECharts会重新渲染
  currentMode.value = newMode
}

function handleChartClick(params) {
  emit('chart-click', params)
}

function handleChartReady(chart) {
  chartRef.value = chart
  emit('chart-ready', chart)
}

onMounted(async () => {
  try {
    loading.value = true
    
    const mapLoadSuccess = await loadMap('world', '/maps/world.json')
    
    if (mapLoadSuccess) {
      mapLoaded.value = true
      console.log('Country charts: World map loaded successfully')
    } else {
      console.warn('Country charts: Failed to load world map')
      mapLoaded.value = false
    }
  } catch (error) {
    console.error('Country charts: Error during initialization:', error)
    mapLoaded.value = false
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.country-distributor-charts {
  width: 100%;
}

.chart-wrapper {
  width: 100%;
  height: 500px;
}

.chart-controls {
  display: flex;
  justify-content: center;
}
</style>