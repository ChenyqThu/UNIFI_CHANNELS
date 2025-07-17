<template>
  <div class="region-distributor-map">
    <!-- Chart Container -->
    <div class="chart-wrapper mb-4">
      <div 
        ref="chartContainer" 
        id="regionChartContainer"
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
            :id="`region-btn-${key}`"
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
import { generateCountryMapData, getRegionColor, getRegionColorForBackground, getBlueGreenGradientColor } from '@/utils/regionCountryMapping'

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
  // console.log('RegionDistributorMap: Raw regions data:', regions)
  
  return Object.values(regions)
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 8)
    .map(item => {
      // 确保使用正确的英文翻译key
      const nameKey = item.name_key || item.name
      return {
        nameKey: nameKey, // 翻译用的英文key
        displayName: item.name || nameKey, // 显示用的备用名称
        value: item.count || 0,
        masters: item.masters || 0, // 添加 masters 数据
        resellers: item.resellers || 0, // 添加 resellers 数据
        coordinates: item.coordinates || [0, 0]
      }
    })
})

// 创建图表配置 - 完全模仿 CountryDistributorCharts 的结构
function createChartOptions() {
  const chartData = processedRegionData.value
  
  if (!chartData.length) return

  // Calculate max value for gradient scaling
  const maxValue = Math.max(...chartData.map(item => item.value), 350)

  // A. 地图配置 - 散点图配合按区域涂色的背景地图
  // console.log('RegionDistributorMap: Input regionsData:', props.regionsData)
  
  // 生成按区域涂色的国家数据
  const countryMapData = generateCountryMapData(props.regionsData || {})
  // console.log('RegionDistributorMap: Generated countryMapData for background:', countryMapData.length, 'countries')
  
  mapOption = {
    title: {
      text: t('charts.global_distributor_distribution_by_region'),
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        // 如果是散点图数据，显示详细区域信息
        if (params.seriesType === 'scatter' && params.data.nameKey) {
          const regionName = t(`regions.${params.data.nameKey}`) || params.data.displayName || params.data.nameKey
          return `${regionName}<br/>
                  ${t('charts.total')}: ${params.data.value[2]}<br/>
                  ${t('charts.masters')}: ${params.data.masters || 0}<br/>
                  ${t('charts.resellers')}: ${params.data.resellers || 0}`
        }
        // 如果是地图背景，显示国家和所属区域信息
        if (params.seriesType === 'map' && params.data) {
          const regionName = t(`regions.${params.data.regionKey}`) || params.data.regionName
          return `${params.name}<br/>
                  ${t('charts.region')}: ${regionName}<br/>
                  ${t('charts.total')}: ${params.data.value}`
        }
        return params.name
      }
    },
    geo: {
      map: 'world',
      roam: false,
      center: [0, 20],
      zoom: 1,
      show: false, // 隐藏geo层，只用作坐标系
      silent: true
    },
    series: [{
      // 背景地图 - 按区域涂色的国家
      id: 'backgroundMap',
      type: 'map',
      map: 'world',
      roam: false,
      data: countryMapData,
      itemStyle: {
        borderColor: '#ffffff',
        borderWidth: 0.5,
        opacity: 0.3 // 设置背景地图透明度为0.15
      },
      emphasis: {
        disabled: true // 禁用地图的hover效果，避免干扰散点图
      },
      silent: true, // 地图背景不响应鼠标事件
      visualMap: false, // 禁用背景地图的visualMap
      z: 1 // 确保在散点图下方
    }, {
      // 前景散点图 - 区域数据点
      id: 'regionDistributionData',
      type: 'scatter',
      coordinateSystem: 'geo',
      universalTransition: { 
        enabled: true, 
        divideShape: 'clone',
        delay: (idx) => idx * 50 // 添加延迟让动画更明显
      },
      animationDurationUpdate: 1000, // 增加动画时长到2秒
      data: chartData.map(item => {
        // 调整特定区域的坐标位置
        let adjustedCoordinates = [...item.coordinates]
        
        switch(item.nameKey) {
          case 'canada':
          case 'can':
            // 加拿大往左上移动
            adjustedCoordinates[0] = adjustedCoordinates[0] - 18
            adjustedCoordinates[1] = adjustedCoordinates[1] + 18
            break
          case 'usa':
            // 美国往上移动
            adjustedCoordinates[0] = adjustedCoordinates[0] - 4
            adjustedCoordinates[1] = adjustedCoordinates[1] + 8
            break
          case 'latin_america':
          case 'lat-a':
            // 南美往右移一些些
            adjustedCoordinates[0] = adjustedCoordinates[0] + 12
            break
          case 'africa':
          case 'af':
            // 非洲往上移一些些
            adjustedCoordinates[1] = adjustedCoordinates[1] + 18
            break
          case 'middle_east':
          case 'mid-e':
            // 中东往上移一些些
            adjustedCoordinates[1] = adjustedCoordinates[1] + 6
            break
          case 'oceania':
          case 'aus-nzl':
            // 澳新往左上移
            adjustedCoordinates[0] = adjustedCoordinates[0] - 15
            adjustedCoordinates[1] = adjustedCoordinates[1] + 16
            break
          case 'eu':
          case 'europe':
            adjustedCoordinates[1] = adjustedCoordinates[1] + 12
        }
        
        return {
          name: item.nameKey, // 添加name字段用于数据匹配
          nameKey: item.nameKey,
          displayName: item.displayName,
          masters: item.masters,
          resellers: item.resellers,
          value: [adjustedCoordinates[0], adjustedCoordinates[1], item.value]
        }
      }),
      symbolSize: (value) => Math.max(Math.sqrt(value[2]) * 6, 20),
      itemStyle: {
        color: (params) => {
          return getBlueGreenGradientColor(params.data.value[2], maxValue)
        },
        borderWidth: 2,
        borderColor: '#ffffff',
        opacity: 0.9,
        shadowBlur: 6,
        shadowColor: 'rgba(0, 0, 0, 0.3)'
      },
      label: {
        show: true,
        formatter: (params) => {
          return `${params.data.value[2]}`
        },
        position: 'inside',
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textBorderColor: 'rgba(0, 0, 0, 0.3)',
        textBorderWidth: 1
      },
      emphasis: {
        itemStyle: {
          opacity: 1,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        },
        label: {
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      z: 2 // 确保在地图背景上方
    }],
    visualMap: {
      min: 0,
      max: 350,
      left: 'left',
      top: 'bottom',
      text: [t('charts.high'), t('charts.low')],
      seriesIndex: 1, // 只对散点图(第二个series)应用
      inRange: {
        color: ['#10B981', '#1E3A8A'] // 浅绿到深蓝
      },
      calculable: true,
      orient: 'vertical'
    }
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
      id: 'regionDistributionData', // 与散点图相同的ID用于转换
      type: 'bar',
      universalTransition: { 
        enabled: true, 
        divideShape: 'clone',
        delay: (idx) => idx * 50 // 添加延迟让动画更明显
      },
      animationDurationUpdate: 1000, // 增加动画时长到2秒
      data: barData.map((item) => ({
        name: item.nameKey, // 添加name字段用于数据匹配
        value: item.value,
        nameKey: item.nameKey, // 保持nameKey用于颜色映射
        itemStyle: {
          // 使用蓝绿渐变颜色
          color: getBlueGreenGradientColor(item.value, maxValue)
        }
      }))
    }]
  }

  // C. 饼图配置
  const pieData = chartData.map((item) => ({
    name: item.nameKey,
    value: item.value,
    masters: item.masters,
    resellers: item.resellers,
    displayName: t(`regions.${item.nameKey}`) || item.displayName,
    itemStyle: {
      // 使用蓝绿渐变颜色
      color: getBlueGreenGradientColor(item.value, maxValue)
    }
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
      id: 'regionDistributionData', // 与散点图相同的ID用于转换  
      name: t('charts.distributor_count'), 
      type: 'pie',
      radius: ['40%', '70%'], 
      center: ['50%', '50%'],
      universalTransition: { 
        enabled: true, 
        divideShape: 'clone',
        delay: (idx) => idx * 50 // 添加延迟让动画更明显
      },
      animationDurationUpdate: 1000, // 增加动画时长到2秒
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
    // console.log('Region charts: Initialized successfully with smooth transitions')
    
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
    // console.log('Language changed, recreating region chart options')
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