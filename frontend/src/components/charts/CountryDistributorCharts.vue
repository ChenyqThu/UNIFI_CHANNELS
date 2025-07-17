<template>
  <div class="country-distributor-charts">
    <!-- Chart Container -->
    <div class="chart-wrapper mb-4">
      <div 
        ref="chartContainer" 
        id="countryChartContainer"
        style="width: 100%; height: 500px;"
      ></div>
    </div>

    <!-- Chart Type Switcher - 移到底部 -->
    <div class="chart-controls">
      <div class="flex justify-center">
        <div class="flex space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            v-for="(mode, key) in chartModes"
            :key="key"
            :id="`btn-${key}`"
            @click="switchMode(key)"
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'
import { loadMap } from '@/utils/mapLoader'
import { getBlueGreenGradientColor } from '@/utils/regionCountryMapping'

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
  console.log('🔍 CountryDistributorCharts: 接收到的原始数据:', props.countriesData)
  console.log('🔍 CountryDistributorCharts: 数据类型:', Array.isArray(props.countriesData), '长度:', props.countriesData?.length)
  
  const filtered = (props.countriesData || [])
    .filter(item => {
      const hasValue = item.value > 0
      if (!hasValue) {
        console.log('🔍 过滤掉无效数据:', item)
      }
      return hasValue
    })
    .sort((a, b) => b.value - a.value)
    
  console.log('🔍 CountryDistributorCharts: 处理后的数据:', filtered)
  return filtered
})

// 创建图表配置 - 完全模仿 map.html 的结构
function createChartOptions() {
  const chartData = processedCountryData.value
  console.log('🔍 createChartOptions: 图表数据:', chartData, '数量:', chartData?.length)
  
  if (!chartData.length) {
    console.warn('⚠️ createChartOptions: 没有有效的图表数据，跳过配置创建')
    return
  }

  console.log('✅ createChartOptions: 开始创建图表配置，数据量:', chartData.length)

  // Calculate max value for color scaling
  const maxValue = Math.max(...chartData.map(item => item.value || item.count || 0)) || 30
  console.log('🔍 createChartOptions: 计算得出maxValue:', maxValue)

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
      min: 0, 
      max: maxValue,
      inRange: { color: ['#10B981', '#1E3A8A'] }, // 使用与地区视图相同的浅绿到深蓝渐变
      text: [t('charts.high'), t('charts.low')], 
      calculable: true
    },
    series: [{
      id: 'distributionData', 
      type: 'map', 
      map: 'world', 
      roam: true,
      scaleLimit: { min: 1, max: 10 },
      universalTransition: { enabled: true, divideShape: 'clone' },
      animationDurationUpdate: 1000,
      data: chartData
    }]
  }

  // B. 柱状图配置 (显示前20)
  const barData = [...chartData].slice(0, 20).reverse()
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
      data: barData.map(item => ({
        value: item.value,
        itemStyle: {
          color: getBlueGreenGradientColor(item.value, maxValue)
        }
      }))
    }]
  }

  // C. 饼图配置 (显示前20 + 其他)
  const top20Data = chartData.slice(0, 20)
  const otherCountries = chartData.slice(20)
  const otherValue = otherCountries.reduce((sum, item) => sum + item.value, 0)
  const otherMasters = otherCountries.reduce((sum, item) => sum + (item.masters || 0), 0)
  const otherResellers = otherCountries.reduce((sum, item) => sum + (item.resellers || 0), 0)
  const pieData = [...top20Data, { 
    name: t('charts.others'), 
    value: otherValue,
    masters: otherMasters,
    resellers: otherResellers
  }]
  
  pieOption = {
    title: { 
      text: t('charts.distributor_country_distribution'), 
      left: 'center' 
    },
    tooltip: { 
      trigger: 'item', 
      formatter: (params) => {
        if (params.name === t('charts.others')) {
          // 从pieData中找到"其他"项的数据
          const otherItem = pieData.find(item => item.name === t('charts.others'))
          return `${params.name}<br/>${t('charts.total')}: ${params.value} (${params.percent}%)<br/>${t('charts.masters')}: ${otherItem?.masters || 0}<br/>${t('charts.resellers')}: ${otherItem?.resellers || 0}`
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
      data: pieData.map(item => ({
        name: item.name,
        value: item.value,
        itemStyle: {
          color: item.name === t('charts.others') 
            ? '#9CA3AF'  // 其他项使用浅灰色
            : getBlueGreenGradientColor(item.value, maxValue)
        }
      })),
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true, // 改为显示标签，采用地区视图的样式
        formatter: (params) => {
          if (params.name === t('charts.others')) {
            return `${params.name}\n${params.value}`
          }
          return `${params.name}\n${params.value}`
        }
      },
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

// 统一的模式切换函数
function switchMode(mode) {
  console.log('🔍 switchMode: 切换到模式', mode)
  
  switch(mode) {
    case 'map':
      switchToMap()
      break
    case 'bar':
      switchToBar()
      break
    case 'pie':
      switchToPie()
      break
    default:
      console.warn('未知的模式:', mode)
  }
}

// 初始化图表 - 完全模仿 map.html
async function initChart() {
  console.log('🔍 initChart: 开始初始化国家图表组件')
  if (!chartContainer.value) {
    console.warn('⚠️ initChart: chartContainer 不存在')
    return
  }
  
  try {
    console.log('🔍 initChart: 开始加载世界地图...')
    // 加载世界地图
    const mapLoadSuccess = await loadMap('world', '/maps/world.json')
    if (!mapLoadSuccess) {
      console.error('❌ initChart: 世界地图加载失败')
      return
    }
    
    console.log('✅ initChart: 世界地图加载成功')
    mapLoaded = true
    
    // 初始化 ECharts 实例
    console.log('🔍 initChart: 初始化 ECharts 实例...')
    myChart = echarts.init(chartContainer.value)
    
    // 创建配置
    console.log('🔍 initChart: 创建图表配置...')
    createChartOptions()
    
    // 初始显示地图 - 模仿 map.html
    if (mapOption) {
      console.log('✅ initChart: 设置地图配置')
      myChart.setOption(mapOption)
    } else {
      console.warn('⚠️ initChart: mapOption 未生成，可能是数据问题')
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
    // console.log('Country charts: Initialized successfully with smooth transitions')
    
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
watch(() => props.countriesData, (newData, oldData) => {
  console.log('🔍 watch countriesData: 数据变化', { newData, oldData })
  console.log('🔍 watch countriesData: mapLoaded=', mapLoaded, 'myChart=', !!myChart)
  
  if (mapLoaded && myChart) {
    console.log('✅ watch countriesData: 重新创建图表配置')
    createChartOptions()
    // 重新设置当前模式的配置
    if (currentMode.value === 'map' && mapOption) {
      console.log('✅ watch countriesData: 更新地图配置')
      myChart.setOption(mapOption, true)
    } else if (currentMode.value === 'bar' && barOption) {
      console.log('✅ watch countriesData: 更新柱状图配置')
      myChart.setOption(barOption, true)
    } else if (currentMode.value === 'pie' && pieOption) {
      console.log('✅ watch countriesData: 更新饼图配置')
      myChart.setOption(pieOption, true)
    }
  } else {
    console.log('⚠️ watch countriesData: 图表未准备好，数据加载时图表可能未初始化')
    // 如果数据已到达但图表未初始化，尝试重新初始化
    if (newData?.length > 0) {
      console.log('🔄 watch countriesData: 数据已到达，尝试重新初始化图表')
      setTimeout(() => {
        if (!mapLoaded || !myChart) {
          initChart()
        }
      }, 100)
    }
  }
}, { deep: true, immediate: true })

// 监听语言变化，重新创建配置对象
watch(() => t('charts.map_view'), () => {
  if (mapLoaded && myChart) {
    // console.log('Language changed, recreating chart options')
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

onMounted(async () => {
  console.log('🔍 onMounted: 组件挂载，开始初始化图表')
  console.log('🔍 onMounted: 当前props.countriesData:', props.countriesData)
  await initChart()
  
  // 如果数据已经存在但图表配置未生成，尝试创建配置
  if (mapLoaded && myChart && props.countriesData?.length > 0 && !mapOption) {
    console.log('🔄 onMounted: 数据已存在，补充创建配置')
    createChartOptions()
    if (mapOption) {
      myChart.setOption(mapOption)
    }
  }
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