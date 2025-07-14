<template>
  <div class="distributor-map-container">
    <!-- Chart Type Switcher -->
    <div class="chart-controls mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-xl font-semibold text-gray-900">{{ $t('charts.global_distributor_distribution') }}</h3>
          <div class="flex items-center mt-1">
            <div class="flex items-center text-xs text-gray-500">
              <span class="material-icons text-xs mr-1">
                {{ mapLoaded ? 'map' : 'scatter_plot' }}
              </span>
              {{ mapLoaded ? $t('charts.real_map') : $t('charts.region_scatter') }}
            </div>
            <div v-if="currentMode === 'map' && !mapLoaded" class="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
              {{ $t('charts.fallback_solution') }}
            </div>
          </div>
        </div>
        <div class="flex space-x-4">
          <!-- Data level switch -->
          <div class="flex space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              v-for="(level, key) in dataLevels"
              :key="key"
              @click="switchDataLevel(key)"
              :disabled="chartLoading"
              :class="[
                'px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center',
                currentDataLevel === key 
                  ? 'bg-white text-green-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900',
                chartLoading ? 'opacity-50 cursor-not-allowed' : ''
              ]"
            >
              <span class="material-icons text-sm mr-1">{{ level.icon }}</span>
              {{ level.label }}
            </button>
          </div>
          
          <!-- Chart type switch -->
          <div class="flex space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              v-for="(mode, key) in chartModes"
              :key="key"
              @click="switchChartMode(key)"
              :disabled="chartLoading"
              :class="[
                'px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center',
                currentMode === key 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900',
                chartLoading ? 'opacity-50 cursor-not-allowed' : ''
              ]"
            >
              <span class="material-icons text-sm mr-1">{{ mode.icon }}</span>
              {{ mode.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Chart Container -->
    <div class="chart-wrapper bg-white rounded-xl border border-gray-200 p-6">
      <EChartsComponent
        :option="chartOption"
        :height="chartHeight"
        :loading="chartLoading"
        :loadingText="$t('charts.loading')"
        @chart-click="handleChartClick"
        @chart-ready="handleChartReady"
      />
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <div class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
            <span class="material-icons text-white text-sm">store</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ currentDisplayData.totalCount }}</p>
            <p class="text-sm text-gray-600">{{ $t('metrics.total_distributors') }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
            <span class="material-icons text-white text-sm">emoji_events</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ currentDisplayData.masterDistributors }}</p>
            <p class="text-sm text-gray-600">{{ $t('metrics.master_distributors') }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center mr-3">
            <span class="material-icons text-white text-sm">group</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ currentDisplayData.authorizedResellers }}</p>
            <p class="text-sm text-gray-600">{{ $t('metrics.authorized_resellers') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChannelStore } from '@/stores/channel'
import EChartsComponent from './EChartsComponent.vue'
import { loadMap } from '@/utils/mapLoader'
import { convertToMapData } from '@/utils/countryMapping'

const { t } = useI18n()
const channelStore = useChannelStore()

// 简化的响应式状态
const currentMode = ref('map')  // 'map' | 'bar' | 'pie'
const currentDataLevel = ref('region') // 'region' | 'country'
const chartRef = ref(null)
const mapLoaded = ref(false)
const chartLoading = ref(false)

const chartModes = computed(() => ({
  map: { label: t('charts.map_view'), icon: 'public', height: '500px' },
  bar: { label: t('charts.bar_chart'), icon: 'bar_chart', height: '400px' },
  pie: { label: t('charts.pie_chart'), icon: 'pie_chart', height: '400px' }
}))

const dataLevels = computed(() => ({
  region: { label: t('charts.region_view'), icon: 'language' },
  country: { label: t('charts.country_view'), icon: 'flag' }
}))

const resellerData = computed(() => channelStore.resellerData)

// Return corresponding data based on current data level
const currentDisplayData = computed(() => {
  if (!resellerData.value) return { regions: {}, countries: {} }
  
  console.log('🔍 currentDisplayData DEBUG:')
  console.log('  - resellerData.value:', resellerData.value)
  console.log('  - currentDataLevel.value:', currentDataLevel.value)
  console.log('  - countries data exists:', !!resellerData.value?.countries)
  console.log('  - countries count:', Object.keys(resellerData.value?.countries || {}).length)
  if (resellerData.value?.countries) {
    console.log('  - sample countries:', Object.keys(resellerData.value.countries).slice(0, 5))
    console.log('  - sample country data:', Object.values(resellerData.value.countries)[0])
  }
  
  if (currentDataLevel.value === 'country') {
    const countryData = {
      regions: resellerData.value.regions || {},
      countries: resellerData.value.countries || {},
      totalCount: resellerData.value.totalCount,
      masterDistributors: resellerData.value.masterDistributors,
      authorizedResellers: resellerData.value.authorizedResellers
    }
    console.log('  - returning country data:', countryData)
    console.log('  - country data keys:', Object.keys(countryData.countries))
    return countryData
  } else {
    console.log('  - returning region data:', resellerData.value)
    return resellerData.value
  }
})

const chartHeight = computed(() => chartModes.value[currentMode.value].height)

// 分离的图表配置 - 确保互不干扰
const mapOption = computed(() => {
  try {
    const chartData = getSimpleChartData()
    const isCountryView = currentDataLevel.value === 'country'
    
    if (!mapLoaded.value) {
      return {
        title: {
          text: t('charts.loading_world_map'),
          left: 'center',
          top: 'middle'
        }
      }
    }

    if (isCountryView) {
      // 国家视图：真实地图
      return {
        title: {
          text: t('charts.global_distributor_distribution_by_country'),
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            if (params.data && params.data.value > 0) {
              return `${params.data.name}: ${params.data.value} ${t('charts.distributors')}`
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
          type: 'map',
          map: 'world',
          roam: true,
          data: chartData,
          itemStyle: {
            borderColor: '#9CA3AF',
            borderWidth: 0.5
          }
        }]
      }
    } else {
      // 地区视图：散点图
      return {
        title: {
          text: t('charts.global_distributor_distribution_by_region'),
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            return `${params.data.name}: ${params.data.value[2]} ${t('charts.distributors')}`
          }
        },
        geo: {
          map: 'world',
          roam: false,
          center: [0, 20],
          zoom: 1.2,
          itemStyle: {
            areaColor: '#E5E7EB',
            borderColor: '#9CA3AF',
            borderWidth: 0.5
          },
          silent: true
        },
        series: [{
          type: 'scatter',
          coordinateSystem: 'geo',
          data: chartData.map(item => ({
            name: item.name,
            value: [item.coordinates[0], item.coordinates[1], item.value]
          })),
          symbolSize: (value) => Math.max(Math.sqrt(value[2]) * 8, 12)
        }]
      }
    }
  } catch (error) {
    console.error('Error in mapOption:', error)
    return {
      title: { text: 'Error loading map', left: 'center', top: 'middle' }
    }
  }
})

const barOption = computed(() => {
  try {
    const chartData = getSimpleChartData()
    const isCountryView = currentDataLevel.value === 'country'
    
    // 纯粹的柱状图配置，绝不包含地图元素
    return {
      title: {
        text: isCountryView ? t('charts.country_distributor_count') : t('charts.region_distributor_count'),
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: chartData.map(item => item.name),
        axisLabel: {
          rotate: isCountryView ? 45 : 0,
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        name: t('charts.distributor_count')
      },
      series: [{
        type: 'bar',
        data: chartData.map(item => item.value),
        itemStyle: {
          color: '#3B82F6'
        }
      }]
    }
  } catch (error) {
    console.error('Error in barOption:', error)
    return {
      title: { text: 'Error loading bar chart', left: 'center', top: 'middle' }
    }
  }
})

const pieOption = computed(() => {
  try {
    const chartData = getSimpleChartData()
    const isCountryView = currentDataLevel.value === 'country'
    
    // 纯粹的饼图配置，绝不包含地图元素
    return {
      title: {
        text: isCountryView ? t('charts.distributor_country_distribution') : t('charts.distributor_region_distribution'),
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a}<br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle'
      },
      series: [{
        name: t('charts.distributor_count'),
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: chartData.slice(0, 12),  // 饼图只显示前12个
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
            fontSize: 20,
            fontWeight: 'bold'
          }
        }
      }]
    }
  } catch (error) {
    console.error('Error in pieOption:', error)
    return {
      title: { text: 'Error loading pie chart', left: 'center', top: 'middle' }
    }
  }
})

// 主配置选择器
const chartOption = computed(() => {
  console.log('🔧 chartOption computed, currentMode:', currentMode.value)
  
  switch (currentMode.value) {
    case 'bar':
      return barOption.value
    case 'pie':
      return pieOption.value
    case 'map':
    default:
      return mapOption.value
  }
})

// 地区视图数据处理函数
function getRegionViewData() {
  const dataEntries = Object.values(currentDisplayData.value.regions || {})
  const sortedData = dataEntries
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 8)  // 地区视图只有8个地区，全部显示
  
  return sortedData.map((item, index) => ({
    // 使用统一的ID格式确保universalTransition正确工作
    id: `item_${item.name.replace(/\s+/g, '_')}`,
    name: item.name,
    value: item.count || 0,
    // 地区视图的图表都需要颜色（散点图、柱状图、饼图）
    itemStyle: {
      color: getRegionColor(item.count || 0)
    },
    // 添加用于过渡的唯一标识
    dataIndex: index,
    regionData: item,
    // 统一的字段结构
    masters: item.masters || 0,
    resellers: item.resellers || 0,
    coordinates: item.coordinates || [0, 0],
    // 为散点图格式添加坐标数组
    scatterValue: [item.coordinates[0], item.coordinates[1], item.count || 0],
    // 添加 groupId 用于 universalTransition 分组
    groupId: 'distributors'
  }))
}

// 国家视图数据 - 用于地图/柱状图/饼图
function getCountryViewData() {
  console.log('🌍 getCountryViewData called')
  console.log('🌍 Raw regions data:', currentDisplayData.value.regions)
  console.log('🌍 Raw countries data:', currentDisplayData.value.countries)
  
  // 国家视图应该使用countries数据，而不是regions数据
  const countriesData = currentDisplayData.value.countries || currentDisplayData.value.regions
  console.log('🌍 Using countries data:', countriesData)
  
  // 使用convertToMapData处理过的数据，确保名称匹配
  const mapData = convertToMapData(countriesData)
  console.log('🌍 Processed map data:', mapData)
  
  const filteredData = mapData
    .filter(item => item.value > 0)  // 只显示有分销商的国家
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    
  console.log(`🌍 Total countries with distributors: ${filteredData.length}`)
  
  return filteredData
    .map((item, index) => ({
      // 使用统一的ID格式确保universalTransition正确工作
      id: `item_${item.name.replace(/\s+/g, '_')}`,
      name: item.name,
      value: item.value || 0,
      // 移除固定的itemStyle.color，让地图使用visualMap自动渲染颜色
      // 添加用于过渡的唯一标识
      dataIndex: index,
      regionData: item,
      // 统一的字段结构
      masters: item.masters || 0,
      resellers: item.resellers || 0,
      coordinates: item.coordinates || [0, 0],
      // 为地图添加额外的元数据
      codes: item.codes || [],
      region: item.region || 'unknown',
      // 添加 groupId 用于 universalTransition 分组
      groupId: 'distributors'
    }))
}

// 简化的数据获取函数
function getSimpleChartData() {
  try {
    const isCountryView = currentDataLevel.value === 'country'
    let rawData = []
    
    if (isCountryView) {
      rawData = getCountryViewData()
    } else {
      rawData = getRegionViewData()
    }
    
    if (!Array.isArray(rawData)) {
      return []
    }
    
    // 简化的数据格式
    return rawData.map(item => ({
      name: item.name || '',
      value: item.value || item.count || 0,
      masters: item.masters || 0,
      resellers: item.resellers || 0,
      coordinates: item.coordinates || [0, 0]
    })).filter(item => item.name && item.value > 0)
      .sort((a, b) => b.value - a.value)  // 降序排列
    
  } catch (error) {
    console.error('Error in getSimpleChartData:', error)
    return []
  }
}


// 简化的图表模式切换
function switchChartMode(newMode) {
  if (chartLoading.value || currentMode.value === newMode) return
  
  console.log(`🔄 Switching from ${currentMode.value} to ${newMode}`)
  
  chartLoading.value = true
  currentMode.value = newMode
  
  // 快速完成切换
  setTimeout(() => {
    chartLoading.value = false
  }, 100)
}

// Data level switching with loading states  
async function switchDataLevel(newLevel) {
  if (chartLoading.value || currentDataLevel.value === newLevel) return
  
  console.log(`🔄 Switching data level from ${currentDataLevel.value} to ${newLevel}`)
  
  chartLoading.value = true
  
  // Switch data level immediately
  currentDataLevel.value = newLevel
  
  // Quick loading completion
  setTimeout(() => {
    chartLoading.value = false
  }, 100)
}

function getRegionColor(count) {
  // 使用蓝色系渐变，与地图的visualMap保持一致
  if (count > 25) return '#1E40AF' // 深蓝色
  if (count > 15) return '#0369A1' // 中蓝色
  if (count > 10) return '#0284C7' // 浅蓝色
  if (count > 5) return '#0EA5E9'   // 淡蓝色
  if (count > 0) return '#7DD3FC'   // 很淡的蓝色
  return '#E5E7EB' // 灰色（无数据）
}

function handleChartClick(params) {
  console.log('Chart clicked:', params)
  // 可以在这里添加钻取功能
}

function handleChartReady(chart) {
  chartRef.value = chart
}

onMounted(async () => {
  console.log('DistributorMap component mounted, loading data...')
  
  try {
    // 先加载分销商数据
    await channelStore.fetchResellerData()
    console.log('Distributor data loaded:', resellerData.value)
    console.log('Regions data:', resellerData.value.regions)
    
    // 打印地图数据格式
    if (resellerData.value.regions) {
      Object.entries(resellerData.value.regions).forEach(([key, region]) => {
        console.log(`Region ${key}:`, {
          name: region.name,
          count: region.count,
          coordinates: region.coordinates,
          growth: region.growth
        })
      })
    }
    
    // 然后加载地图数据
    const mapLoadSuccess = await loadMap('world', '/maps/world.json')
    
    if (mapLoadSuccess) {
      mapLoaded.value = true
      console.log('World map loaded and registered successfully')
      
      // 打印地图选项数据
      console.log('Map option data for ECharts:', mapOption.value)
    } else {
      console.warn('Failed to load world map, using scatter plot fallback')
      mapLoaded.value = false
      
      // 打印散点图数据
      console.log('Chart option data:', chartOption.value)
    }
  } catch (error) {
    console.error('Error during component initialization:', error)
    mapLoaded.value = false
  }
})
</script>

<style scoped>
.distributor-map-container {
  width: 100%;
}

.chart-wrapper {
  position: relative;
  min-height: 400px;
}

.chart-controls {
  position: relative;
  z-index: 10;
}
</style>