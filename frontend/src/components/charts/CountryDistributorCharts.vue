<template>
  <div class="country-distributor-charts">
    <!-- Chart Type Switcher -->
    <div class="chart-controls mb-4">
      <div class="flex space-x-2 bg-gray-100 rounded-lg p-1">
        <button
          v-for="(mode, key) in chartModes"
          :key="key"
          :id="`btn-${key}`"
          :class="[
            'px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center',
            currentMode === key 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          <span class="material-icons text-sm mr-1">{{ mode.icon }}</span>
          {{ mode.label }}
        </button>
      </div>
    </div>

    <!-- Chart Container -->
    <div class="chart-wrapper">
      <div 
        ref="chartContainer" 
        id="countryChartContainer"
        style="width: 100%; height: 500px;"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'
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
const chartContainer = ref(null)
let myChart = null
let mapLoaded = false

// 预定义的配置对象 - 完全模仿 map.html
let mapOption = null
let barOption = null  
let pieOption = null

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

// 创建图表配置 - 完全模仿 map.html 的结构
function createChartOptions() {
  const chartData = processedCountryData.value
  
  if (!chartData.length) return

  // A. 地图配置 - 直接复制 map.html 的结构
  mapOption = {
    title: { 
      text: t('charts.global_distributor_distribution_by_country'), 
      left: 'center' 
    },
    tooltip: { 
      trigger: 'item', 
      formatter: (params) => {
        if (params.data && params.data.value > 0) {
          const data = params.data
          return `${data.name}<br/>${t('charts.total')}: ${data.value}<br/>${t('charts.masters')}: ${data.masters || 0}<br/>${t('charts.resellers')}: ${data.resellers || 0}`
        }
        return `${params.name}: ${t('common.no_data')}`
      }
    },
    visualMap: {
      left: 'right', 
      min: 1, 
      max: Math.max(...chartData.map(d => d.value), 35),
      inRange: { color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'] }, // 移除 .reverse()，浅到深
      text: [t('charts.high'), t('charts.low')], 
      calculable: true
    },
    series: [{
      id: 'distributionData', 
      type: 'map', 
      map: 'world', 
      roam: true,
      scaleLimit: { min: 1, max: 20 },
      universalTransition: { enabled: true, divideShape: 'clone' },
      animationDurationUpdate: 1000,
      data: chartData
    }]
  }

  // B. 柱状图配置 (显示前25)
  const barData = [...chartData].slice(0, 25).reverse()
  barOption = {
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
          return `${data.name}<br/>${t('charts.total')}: ${data.value}<br/>${t('charts.masters')}: ${originalData.masters || 0}<br/>${t('charts.resellers')}: ${originalData.resellers || 0}`
        }
        return `${data.name}: ${data.value}`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { 
      type: 'category', 
      data: barData.map(item => item.name),
      axisLabel: { fontSize: 11 }
    },
    series: [{
      id: 'distributionData', 
      type: 'bar',
      universalTransition: { enabled: true, divideShape: 'clone' },
      animationDurationUpdate: 1000,
      data: barData.map(item => item.value)
    }]
  }

  // C. 饼图配置 (显示前10 + 其他)
  const top10Data = chartData.slice(0, 10)
  const otherValue = chartData.slice(10).reduce((sum, item) => sum + item.value, 0)
  const pieData = [...top10Data, { name: t('charts.others'), value: otherValue }]
  
  pieOption = {
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
          return `${params.name}<br/>${t('charts.total')}: ${params.value} (${params.percent}%)<br/>${t('charts.masters')}: ${originalData.masters || 0}<br/>${t('charts.resellers')}: ${originalData.resellers || 0}`
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
      data: pieData,
      emphasis: {
        itemStyle: {
          shadowBlur: 10, shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
}

// 按钮切换函数 - 完全模仿 map.html
function switchToMap() {
  if (mapOption && myChart) {
    myChart.setOption(mapOption, true)
    currentMode.value = 'map'
  }
}

function switchToBar() {
  if (barOption && myChart) {
    myChart.setOption(barOption, true)
    currentMode.value = 'bar'
  }
}

function switchToPie() {
  if (pieOption && myChart) {
    myChart.setOption(pieOption, true)
    currentMode.value = 'pie'
  }
}

// 初始化图表 - 完全模仿 map.html
async function initChart() {
  if (!chartContainer.value) return
  
  try {
    // 加载世界地图
    const mapLoadSuccess = await loadMap('world', '/maps/world.json')
    if (!mapLoadSuccess) {
      console.warn('Failed to load world map')
      return
    }
    
    mapLoaded = true
    
    // 初始化 ECharts 实例
    myChart = echarts.init(chartContainer.value)
    
    // 创建配置
    createChartOptions()
    
    // 初始显示地图 - 模仿 map.html
    if (mapOption) {
      myChart.setOption(mapOption)
    }
    
    // 绑定事件
    myChart.on('click', (params) => {
      emit('chart-click', params)
    })
    
    // 绑定按钮事件 - 原生事件绑定
    document.getElementById('btn-map')?.addEventListener('click', switchToMap)
    document.getElementById('btn-bar')?.addEventListener('click', switchToBar)  
    document.getElementById('btn-pie')?.addEventListener('click', switchToPie)
    
    // 窗口大小变化处理
    window.addEventListener('resize', () => {
      if (myChart) {
        myChart.resize()
      }
    })
    
    emit('chart-ready', myChart)
    console.log('Country charts: Initialized successfully with smooth transitions')
    
  } catch (error) {
    console.error('Country charts: Error during initialization:', error)
  }
}

// 清理函数
function cleanup() {
  if (myChart) {
    myChart.dispose()
    myChart = null
  }
  
  // 移除事件监听器
  document.getElementById('btn-map')?.removeEventListener('click', switchToMap)
  document.getElementById('btn-bar')?.removeEventListener('click', switchToBar)
  document.getElementById('btn-pie')?.removeEventListener('click', switchToPie)
  
  window.removeEventListener('resize', () => {
    if (myChart) {
      myChart.resize()
    }
  })
}

// 监听数据变化
watch(() => props.countriesData, () => {
  if (mapLoaded && myChart) {
    createChartOptions()
    // 重新设置当前模式的配置
    if (currentMode.value === 'map' && mapOption) {
      myChart.setOption(mapOption, true)
    } else if (currentMode.value === 'bar' && barOption) {
      myChart.setOption(barOption, true)
    } else if (currentMode.value === 'pie' && pieOption) {
      myChart.setOption(pieOption, true)
    }
  }
}, { deep: true })

// 监听语言变化，重新创建配置对象
watch(() => t('charts.map_view'), () => {
  if (mapLoaded && myChart) {
    console.log('Language changed, recreating chart options')
    createChartOptions()
    // 重新设置当前模式的配置以更新标题
    if (currentMode.value === 'map' && mapOption) {
      myChart.setOption(mapOption, true)
    } else if (currentMode.value === 'bar' && barOption) {
      myChart.setOption(barOption, true)
    } else if (currentMode.value === 'pie' && pieOption) {
      myChart.setOption(pieOption, true)
    }
  }
})

onMounted(() => {
  initChart()
})

onUnmounted(() => {
  cleanup()
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