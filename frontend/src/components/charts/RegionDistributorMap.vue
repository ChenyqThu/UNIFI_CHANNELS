<template>
  <div class="region-distributor-map">
    <!-- Chart Type Switcher -->
    <div class="chart-controls mb-4">
      <div class="flex justify-center">
        <div class="flex space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            v-for="(mode, key) in chartModes"
            :key="key"
            :id="`region-btn-${key}`"
            :class="[
              'px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center',
              currentMode === key 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            ]"
          >
            <span class="material-icons text-sm mr-1">{{ mode.icon }}</span>
            {{ mode.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Chart Container -->
    <div class="chart-wrapper">
      <div 
        ref="chartContainer" 
        id="regionChartContainer"
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
  regionsData: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['chart-click', 'chart-ready'])

// State
const currentMode = ref('map')
const chartContainer = ref(null)
let myChart = null
let mapLoaded = false

// 预定义的配置对象 - 模仿 CountryDistributorCharts
let mapOption = null
let barOption = null  
let pieOption = null

const chartModes = computed(() => ({
  map: { label: t('charts.map_view'), icon: 'public' },
  bar: { label: t('charts.bar_chart'), icon: 'bar_chart' },
  pie: { label: t('charts.pie_chart'), icon: 'pie_chart' }
}))

// 处理地区数据 - 修复数据映射逻辑，添加 masters/resellers 信息
const processedRegionData = computed(() => {
  const regions = props.regionsData || {}
  console.log('RegionDistributorMap: Raw regions data:', regions)
  
  return Object.values(regions)
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 8)
    .map(item => {
      console.log('RegionDistributorMap: Processing item:', item)
      console.log('RegionDistributorMap: item.masters =', item.masters, 'item.resellers =', item.resellers)
      // 确保使用正确的英文翻译key
      const nameKey = item.name_key || item.name
      console.log('RegionDistributorMap: Using nameKey:', nameKey)
      const processedItem = {
        nameKey: nameKey, // 翻译用的英文key
        displayName: item.name || nameKey, // 显示用的备用名称
        value: item.count || 0,
        masters: item.masters || 0, // 添加 masters 数据
        resellers: item.resellers || 0, // 添加 resellers 数据
        coordinates: item.coordinates || [0, 0]
      }
      console.log('RegionDistributorMap: Processed item:', processedItem)
      return processedItem
    })
})

// 创建图表配置 - 完全模仿 CountryDistributorCharts 的结构
function createChartOptions() {
  const chartData = processedRegionData.value
  
  if (!chartData.length) return

  // A. 地图配置 - 散点图
  mapOption = {
    title: {
      text: t('charts.global_distributor_distribution_by_region'),
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const regionName = t(`regions.${params.data.nameKey}`) || params.data.displayName || params.data.nameKey
        return `${regionName}<br/>
                ${t('charts.total')}: ${params.data.value[2]}<br/>
                ${t('charts.masters')}: ${params.data.masters || 0}<br/>
                ${t('charts.resellers')}: ${params.data.resellers || 0}`
      }
    },
    geo: {
      map: 'world',
      roam: false,
      center: [0, 20],
      zoom: 1,
      itemStyle: {
        areaColor: '#E2E8F0', // 使用更深的灰色背景，让地图边界更清楚
        borderColor: '#94A3B8',
        borderWidth: 1,
        opacity: 1 // 确保完全不透明
      },
      emphasis: {
        disabled: true // 禁用地图区域的强调效果，避免干扰
      },
      silent: true
    },
    series: [{
      id: 'regionDistributionData', // 独特的 series ID
      type: 'scatter',
      coordinateSystem: 'geo',
      universalTransition: { enabled: true, divideShape: 'clone' },
      animationDurationUpdate: 1000,
      data: chartData.map(item => ({
        nameKey: item.nameKey, // 翻译用的英文key
        displayName: item.displayName, // 显示名称
        masters: item.masters, // 添加 masters 数据
        resellers: item.resellers, // 添加 resellers 数据
        value: [item.coordinates[0], item.coordinates[1], item.value]
      })),
      symbolSize: (value) => Math.max(Math.sqrt(value[2]) * 8, 28), // 进一步增大最小尺寸
      itemStyle: {
        color: '#2563EB', // 使用更深的蓝色提高对比度
        borderColor: '#1E40AF',
        borderWidth: 2,
        opacity: 1, // 确保圆点完全不透明
        shadowBlur: 0,
        shadowColor: 'transparent'
      },
      label: {
        show: true,
        formatter: (params) => {
          // 在圆点中间显示地区名称和数量
          const regionName = t(`regions.${params.data.nameKey}`) || params.data.displayName || params.data.nameKey
          return `${regionName}\n${params.data.value[2]}`
        },
        position: 'inside',
        fontSize: 12, // 稍微增大字体
        fontWeight: 'bold',
        color: '#FFFFFF',
        lineHeight: 16,
        textAlign: 'center',
        textBorderColor: 'rgba(0, 0, 0, 0.1)', // 添加细微文字边框提高可读性
        textBorderWidth: 0.5
      },
      emphasis: {
        itemStyle: {
          color: '#1D4ED8',
          borderColor: '#1E3A8A',
          borderWidth: 3,
          opacity: 1, // 强调状态也保持完全不透明
          shadowBlur: 0,
          shadowColor: 'transparent'
        },
        label: {
          show: true,
          fontSize: 13,
          fontWeight: 'bold',
          color: '#FFFFFF',
          textBorderColor: 'rgba(0, 0, 0, 0.2)',
          textBorderWidth: 1
        }
      }
    }]
  }

  // B. 柱状图配置
  const barData = [...chartData].reverse() // 地区数据不需要截取，全部显示
  barOption = {
    title: { 
      text: t('charts.region_distributor_count'), 
      left: 'center' 
    },
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const data = params[0]
        const regionName = t(`regions.${data.name}`) || data.name
        // 查找原始数据以获取 masters/resellers 信息
        const originalData = chartData.find(item => item.nameKey === data.name)
        if (originalData) {
          return `${regionName}<br/>
                  ${t('charts.total')}: ${data.value}<br/>
                  ${t('charts.masters')}: ${originalData.masters || 0}<br/>
                  ${t('charts.resellers')}: ${originalData.resellers || 0}`
        }
        return `${regionName}: ${data.value} ${t('charts.distributors')}`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { 
      type: 'category', 
      data: barData.map(item => item.nameKey), // 使用nameKey作为分类
      axisLabel: { 
        fontSize: 11,
        formatter: (value) => t(`regions.${value}`) || value // 显示翻译后的地区名
      }
    },
    series: [{
      id: 'regionDistributionData', // 相同的 series ID
      type: 'bar',
      universalTransition: { enabled: true, divideShape: 'clone' },
      animationDurationUpdate: 1000,
      data: barData.map(item => item.value),
      itemStyle: {
        color: '#10B981' // 使用绿色区分地区图表
      }
    }]
  }

  // C. 饼图配置
  const pieData = chartData.map(item => ({
    name: item.nameKey,
    value: item.value,
    masters: item.masters,
    resellers: item.resellers,
    displayName: t(`regions.${item.nameKey}`) || item.displayName
  }))
  
  pieOption = {
    title: { 
      text: t('charts.distributor_region_distribution'), 
      left: 'center' 
    },
    tooltip: { 
      trigger: 'item', 
      formatter: (params) => {
        const displayName = t(`regions.${params.name}`) || params.name
        return `${displayName}<br/>
                ${t('charts.total')}: ${params.value} (${params.percent}%)<br/>
                ${t('charts.masters')}: ${params.data.masters || 0}<br/>
                ${t('charts.resellers')}: ${params.data.resellers || 0}`
      }
    },
    series: [{
      id: 'regionDistributionData', // 相同的 series ID  
      name: t('charts.distributor_count'), 
      type: 'pie',
      radius: ['40%', '70%'], 
      center: ['50%', '50%'],
      universalTransition: { enabled: true, divideShape: 'clone' },
      animationDurationUpdate: 1000,
      data: pieData,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: (params) => {
          const displayName = t(`regions.${params.name}`) || params.name
          return `${displayName}\n${params.value}`
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

// 按钮切换函数 - 完全模仿 CountryDistributorCharts
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

// 初始化图表
async function initChart() {
  if (!chartContainer.value) return
  
  try {
    // 加载世界地图
    const mapLoadSuccess = await loadMap('world', '/maps/world.json')
    if (!mapLoadSuccess) {
      console.warn('Failed to load world map for regions')
      return
    }
    
    mapLoaded = true
    
    // 初始化 ECharts 实例
    myChart = echarts.init(chartContainer.value)
    
    // 创建配置
    createChartOptions()
    
    // 初始显示地图
    if (mapOption) {
      myChart.setOption(mapOption)
    }
    
    // 绑定事件
    myChart.on('click', (params) => {
      emit('chart-click', params)
    })
    
    // 绑定按钮事件 - 原生事件绑定
    document.getElementById('region-btn-map')?.addEventListener('click', switchToMap)
    document.getElementById('region-btn-bar')?.addEventListener('click', switchToBar)  
    document.getElementById('region-btn-pie')?.addEventListener('click', switchToPie)
    
    // 窗口大小变化处理
    window.addEventListener('resize', () => {
      if (myChart) {
        myChart.resize()
      }
    })
    
    emit('chart-ready', myChart)
    console.log('Region charts: Initialized successfully with smooth transitions')
    
  } catch (error) {
    console.error('Region charts: Error during initialization:', error)
  }
}

// 清理函数
function cleanup() {
  if (myChart) {
    myChart.dispose()
    myChart = null
  }
  
  // 移除事件监听器
  document.getElementById('region-btn-map')?.removeEventListener('click', switchToMap)
  document.getElementById('region-btn-bar')?.removeEventListener('click', switchToBar)
  document.getElementById('region-btn-pie')?.removeEventListener('click', switchToPie)
  
  window.removeEventListener('resize', () => {
    if (myChart) {
      myChart.resize()
    }
  })
}

// 监听数据变化
watch(() => props.regionsData, () => {
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

// 监听语言变化
watch(() => t('charts.map_view'), () => {
  if (mapLoaded && myChart) {
    console.log('Language changed, recreating region chart options')
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
.region-distributor-map {
  width: 100%;
  height: 500px;
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