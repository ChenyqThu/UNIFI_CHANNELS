<template>
  <div class="bg-white rounded-xl border border-gray-200 p-6">
    <div class="mb-6">
      <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ $t('charts.yearly_channel_updates') }}</h3>
      <p class="text-sm text-gray-600">{{ $t('charts.yearly_updates_description') }}</p>
      
      <!-- Tab Navigation -->
      <div class="mt-4 border-b border-gray-200">
        <nav class="flex space-x-8">
          <button 
            @click="activeTab = 'trends'"
            :class="[
              'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'trends' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            {{ $t('charts.regional_trends') }}
          </button>
          <button 
            @click="activeTab = 'map'"
            :class="[
              'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'map' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            {{ $t('charts.country_map_view') }}
          </button>
        </nav>
      </div>
    </div>
    
    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
    
    <div v-else-if="error" class="flex items-center justify-center h-64">
      <div class="text-red-600 text-center">
        <span class="material-icons text-4xl mb-2">error</span>
        <p>{{ $t('common.error_loading_data') }}</p>
      </div>
    </div>
    
    <div v-else>
      <!-- Regional Trends Tab -->
      <div v-if="activeTab === 'trends'">
        <div ref="chartContainer" class="h-80 w-full"></div>
        
        <!-- Key Insights -->
        <div v-if="chartData.insights" class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-blue-600 mb-1">{{ chartData.insights.most_active_year }}</div>
            <div class="text-sm text-gray-700">{{ $t('insights.most_active_year') }}</div>
          </div>
          <div class="bg-green-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-green-600 mb-1">{{ chartData.insights.most_active_region }}</div>
            <div class="text-sm text-gray-700">{{ $t('insights.most_active_region') }}</div>
          </div>
          <div class="bg-purple-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-purple-600 mb-1">{{ chartData.insights.total_channel_updates }}</div>
            <div class="text-sm text-gray-700">{{ $t('insights.total_updates') }}</div>
          </div>
        </div>
        
        <!-- Regional Trends -->
        <div v-if="chartData.insights?.regional_trends" class="mt-6">
          <h4 class="text-lg font-semibold text-gray-900 mb-4">{{ $t('insights.regional_growth_trends') }}</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="(trend, region) in chartData.insights.regional_trends" :key="region"
                 class="bg-gray-50 rounded-lg p-4">
              <div class="text-lg font-bold text-gray-900 mb-1">{{ region.toUpperCase() }}</div>
              <div class="space-y-1">
                <div class="text-sm text-gray-600">
                  {{ $t('insights.total_updates') }}: <span class="font-medium">{{ trend.total_updates }}</span>
                </div>
                <div class="text-sm text-gray-600">
                  {{ $t('insights.growth_rate') }}: 
                  <span :class="trend.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'" class="font-medium">
                    {{ trend.growth_rate }}%
                  </span>
                </div>
                <div class="text-sm text-gray-600">
                  {{ $t('insights.latest_year') }}: <span class="font-medium">{{ trend.latest_year_updates }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- World Map Tab -->
      <div v-if="activeTab === 'map'">
        <!-- Year Selector -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('charts.select_year') }}</label>
          
          <!-- Year Slider -->
          <div v-if="numericYears.length > 0" class="space-y-3">
            <div class="flex items-center space-x-4">
              <span class="text-sm text-gray-600 w-12">{{ minYear }}</span>
              <div class="flex-1">
                <input
                  type="range"
                  :min="sliderMin"
                  :max="sliderMax"
                  :value="sliderValue"
                  @input="handleSliderChange"
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                >
              </div>
              <span class="text-sm text-gray-600 w-16 text-right">{{ $t('charts.all_years') }}</span>
            </div>
            <div class="text-center">
              <span class="text-lg font-semibold text-blue-600">
                {{ displayedYear }}
              </span>
            </div>
          </div>
          
          <!-- Fallback buttons for no years -->
          <div v-else class="flex flex-wrap gap-2">
            <button
              @click="selectedYear = 'all'"
              :class="[
                'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                selectedYear === 'all'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              ]"
            >
              {{ $t('charts.all_years') }}
            </button>
          </div>
        </div>
        
        <!-- World Map Container -->
        <div ref="mapContainer" class="h-96 w-full border border-gray-200 rounded-lg"></div>
        
        <!-- Country Statistics -->
        <div v-if="selectedYearData" class="mt-6">
          <h4 class="text-lg font-semibold text-gray-900 mb-4">
            {{ selectedYear === 'all' ? $t('charts.total_updates_by_country') : $t('charts.year_updates_by_country', {year: selectedYear}) }}
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
            <div v-for="(count, country) in topCountriesForYear" :key="country"
                 class="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
              <span class="font-medium text-gray-900">{{ getCountryName(country) }}</span>
              <span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">{{ count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'

const { t } = useI18n()

// Reactive data
const chartContainer = ref(null)
const mapContainer = ref(null)
const chartData = ref({})
const loading = ref(true)
const error = ref(false)
const activeTab = ref('trends')
const selectedYear = ref('all')
let chart = null
let worldMap = null
let refreshInterval = null
let lastDataTimestamp = null

// World map data
const worldGeoData = ref(null)

// Tab and year related computed properties
const availableYears = computed(() => {
  return chartData.value.available_years || []
})

const selectedYearData = computed(() => {
  // 使用映射后的国家数据用于地图显示
  return chartData.value.mapped_country_data?.[selectedYear.value] || {}
})

const topCountriesForYear = computed(() => {
  const data = selectedYearData.value
  return Object.fromEntries(
    Object.entries(data)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20) // 显示前20个国家
  )
})

// Numeric years for slider (exclude 'all')
const numericYears = computed(() => {
  return availableYears.value.filter(year => year !== 'all').sort((a, b) => a - b)
})

const minYear = computed(() => {
  return numericYears.value.length > 0 ? Math.min(...numericYears.value) : new Date().getFullYear()
})

const maxYear = computed(() => {
  return numericYears.value.length > 0 ? Math.max(...numericYears.value) : new Date().getFullYear()
})

// Slider range: numeric years + 1 extra position for 'all'
const sliderMin = computed(() => minYear.value)
const sliderMax = computed(() => maxYear.value + 1)

// Current slider value
const sliderValue = computed(() => {
  if (selectedYear.value === 'all') {
    return sliderMax.value // 'all' is at the rightmost position
  }
  return parseInt(selectedYear.value)
})

// Displayed year text
const displayedYear = computed(() => {
  return selectedYear.value === 'all' ? t('charts.all_years') : selectedYear.value
})

// Handle slider change
const handleSliderChange = (event) => {
  const value = parseInt(event.target.value)
  if (value === sliderMax.value) {
    selectedYear.value = 'all'
  } else {
    selectedYear.value = value
  }
}

// Region colors mapping
const regionColors = {
  'af': '#8b5cf6',      // purple
  'as': '#06b6d4',      // cyan
  'aus-nzl': '#10b981', // emerald
  'can': '#f59e0b',     // amber
  'eur': '#3b82f6',     // blue
  'lat-a': '#ef4444',   // red
  'mid-e': '#84cc16',   // lime
  'usa': '#f97316'      // orange
}

// Country name mapping (简化版，可以扩展)
const getCountryName = (countryCode) => {
  const countryNames = {
    'AE': '阿联酋', 'AM': '亚美尼亚', 'AT': '奥地利', 'AU': '澳大利亚', 'BG': '保加利亚',
    'CA': '加拿大', 'CH': '瑞士', 'CN': '中国', 'CY': '塞浦路斯', 'CZ': '捷克',
    'DE': '德国', 'ES': '西班牙', 'FL': '佛罗里达', 'FR': '法国', 'GB': '英国',
    'GR': '希腊', 'HK': '香港', 'HR': '克罗地亚', 'HU': '匈牙利', 'ID': '印度尼西亚',
    'IE': '爱尔兰', 'IL': '以色列', 'IQ': '伊拉克', 'IT': '意大利', 'JO': '约旦',
    'KE': '肯尼亚', 'KH': '柬埔寨', 'KW': '科威特', 'KZ': '哈萨克斯坦', 'LT': '立陶宛',
    'MK': '马其顿', 'MM': '缅甸', 'MN': '蒙古', 'MO': '密苏里', 'NC': '北卡罗来纳',
    'NG': '尼日利亚', 'NL': '荷兰', 'NO': '挪威', 'NP': '尼泊尔', 'NZ': '新西兰',
    'ON': '安大略', 'OR': '俄勒冈', 'PH': '菲律宾', 'PK': '巴基斯坦', 'PL': '波兰',
    'QC': '魁北克', 'RO': '罗马尼亚', 'RS': '塞尔维亚', 'SE': '瑞典', 'SG': '新加坡',
    'SK': '斯洛伐克', 'TR': '土耳其', 'TZ': '坦桑尼亚', 'UA': '乌克兰', 'UG': '乌干达',
    'XK': '科索沃', 'ZA': '南非', 'AB': '阿尔伯塔', 'AZ': '阿塞拜疆', 'JP': '日本',
    'MD': '马里兰', 'ME': '黑山', 'TX': '德克萨斯', 'ZW': '津巴布韦', 'BE': '比利时',
    'DK': '丹麦', 'FI': '芬兰', 'BR': '巴西', 'IN': '印度', 'TH': '泰国', 'VN': '越南'
  }
  return countryNames[countryCode] || countryCode
}

// Load world map data
const loadWorldMapData = async () => {
  try {
    const response = await fetch('/maps/world.json')
    if (response.ok) {
      const data = await response.json()
      worldGeoData.value = data
      echarts.registerMap('world', data)
      console.log('✅ World map data loaded successfully')
    } else {
      console.warn('Failed to load world map data:', response.status, response.statusText)
    }
  } catch (error) {
    console.warn('Failed to load world map data:', error)
  }
}

// Initialize world map
const initWorldMap = () => {
  if (!mapContainer.value || !worldGeoData.value || !chartData.value.mapped_country_data) {
    console.warn('🗺️ Cannot initialize world map: missing container, geo data, or chart data')
    return
  }
  
  console.log('🗺️ Initializing world map...')
  
  try {
    // Dispose existing instance if any
    if (worldMap) {
      worldMap.dispose()
      worldMap = null
    }
    
    // Create new ECharts instance
    worldMap = echarts.init(mapContainer.value)
    
    // Add error handler
    worldMap.on('error', (error) => {
      console.error('🗺️ ECharts error:', error)
    })
    
    // Update with current data
    updateWorldMap()
    
    console.log('🗺️ World map initialized successfully')
  } catch (error) {
    console.error('🗺️ Failed to initialize world map:', error)
    worldMap = null
  }
}

// Update world map with selected year data
const updateWorldMap = () => {
  if (!worldMap || !selectedYearData.value) {
    console.warn('🗺️ Cannot update world map: missing worldMap or selectedYearData')
    return
  }
  
  console.log('🗺️ Updating world map with data:', selectedYearData.value)
  
  // Import the country mapping function
  import('../../utils/countryMapping.js').then(({ COUNTRY_CODE_TO_MAP_NAME }) => {
    console.log('🗺️ Country mapping loaded:', COUNTRY_CODE_TO_MAP_NAME)
    
    // Prepare map data with proper country name mapping
    const mapData = Object.entries(selectedYearData.value).map(([countryCode, count]) => {
      // Use the mapping to get the correct country name for the world map
      let mapName = COUNTRY_CODE_TO_MAP_NAME[countryCode] || countryCode
      
      // Handle special cases for USA and Canada that are already mapped
      if (countryCode === 'USA') {
        mapName = 'USA'
      } else if (countryCode === 'Canada') {
        mapName = 'Canada'
      }
      
      console.log(`🗺️ Mapping ${countryCode} (${count} updates) -> ${mapName}`)
      
      return {
        name: mapName,
        value: count,
        region: chartData.value.mapped_country_region_map?.[countryCode] || 'unknown',
        originalCode: countryCode
      }
    })
    
    console.log('🗺️ Final map data:', mapData)
    
    // Calculate max value for color scale
    const maxValue = Math.max(...Object.values(selectedYearData.value))
    console.log('🗺️ Max value for color scale:', maxValue)
    
    const option = {
      title: {
        text: selectedYear.value === 'all' 
          ? t('charts.total_channel_updates_map') 
          : t('charts.channel_updates_map_year', {year: selectedYear.value}),
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          if (params.data) {
            const region = params.data.region
            const regionName = region ? t(`regions.${region}`, region.toUpperCase()) : t('common.unknown')
            const originalCode = params.data.originalCode
            return `
              <div class="font-semibold">${getCountryName(originalCode)} (${originalCode})</div>
              <div class="text-sm text-gray-600">${t('charts.region')}: ${regionName}</div>
              <div class="text-sm">${t('charts.updates')}: <span class="font-medium">${params.data.value}</span></div>
            `
          }
          return params.name
        }
      },
      visualMap: {
        min: 0,
        max: maxValue,
        left: 'left',
        top: 'bottom',
        text: [t('charts.high'), t('charts.low')],
        seriesIndex: [0],
        inRange: {
          color: ['#e8f4fd', '#1e40af'] // Light blue to dark blue
        },
        calculable: true
      },
      series: [{
        name: t('charts.channel_updates'),
        type: 'map',
        map: 'world',
        roam: true,
        scaleLimit: { min: 1, max: 20 },
        emphasis: {
          label: { show: true },
          itemStyle: { areaColor: '#fbbf24' }
        },
        data: mapData
      }]
    }
    
    console.log('🗺️ Setting ECharts option:', option)
    
    try {
      if (worldMap && !worldMap.isDisposed()) {
        worldMap.setOption(option, true) // true = not merge, completely replace
        console.log('🗺️ World map updated successfully')
      } else {
        console.warn('🗺️ Cannot update map: worldMap is disposed or null')
        // Try to reinitialize if needed
        if (activeTab.value === 'map') {
          nextTick(() => initWorldMap())
        }
      }
    } catch (error) {
      console.error('🗺️ Failed to update world map:', error)
      // Reset worldMap and try to reinitialize
      worldMap = null
      if (activeTab.value === 'map') {
        nextTick(() => initWorldMap())
      }
    }
  }).catch(error => {
    console.warn('Failed to load country mapping:', error)
    // Fallback without mapping
    const mapData = Object.entries(selectedYearData.value).map(([countryCode, count]) => ({
      name: countryCode,
      value: count,
      region: chartData.value.mapped_country_region_map?.[countryCode] || 'unknown',
      originalCode: countryCode
    }))
    
    const maxValue = Math.max(...Object.values(selectedYearData.value))
    
    const option = {
      title: {
        text: selectedYear.value === 'all' 
          ? t('charts.total_channel_updates_map') 
          : t('charts.channel_updates_map_year', {year: selectedYear.value}),
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          if (params.data) {
            return `${params.data.name}: ${params.data.value}`
          }
          return params.name
        }
      },
      visualMap: {
        min: 0,
        max: maxValue,
        left: 'left',
        top: 'bottom',
        text: [t('charts.high'), t('charts.low')],
        seriesIndex: [0],
        inRange: {
          color: ['#e8f4fd', '#1e40af']
        },
        calculable: true
      },
      series: [{
        name: t('charts.channel_updates'),
        type: 'map',
        map: 'world',
        roam: true,
        scaleLimit: { min: 1, max: 20 },
        data: mapData
      }]
    }
    
    worldMap.setOption(option)
  })
}

const fetchData = async () => {
  try {
    loading.value = true
    error.value = false
    
    // 先尝试从专门的年度更新数据文件读取
    try {
      const response = await fetch('/data/yearly-channel-updates.json')
      if (response.ok) {
        const data = await response.json()
        console.log('Successfully loaded yearly channel updates data')
        
        // 更新时间戳
        lastDataTimestamp = data.timestamp
        
        if (data.data) {
          chartData.value = data.data
          return
        }
      }
    } catch (fileError) {
      console.warn('Failed to load yearly updates data from file:', fileError)
    }
    
    // 备选：从主要分销商数据文件中处理
    try {
      const response = await fetch('/data/distributors.json')
      if (response.ok) {
        const data = await response.json()
        console.log('Fallback: processing from distributor data')
        
        // 更新时间戳
        lastDataTimestamp = data.timestamp || data.last_updated
        
        // 如果有distributors数组，处理年度更新数据
        if (data.data && data.data.distributors) {
          const yearlyData = processYearlyUpdates(data.data.distributors)
          chartData.value = yearlyData
          return
        }
      }
    } catch (fallbackError) {
      console.warn('Failed to load distributor data for processing:', fallbackError)
    }
    
    // 如果本地文件都不可用，尝试后端API
    try {
      const response = await fetch('/api/analytics/yearly-channel-updates')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      chartData.value = data
    } catch (apiError) {
      console.warn('Backend API failed, using fallback data:', apiError)
      // 使用模拟数据作为备选
      chartData.value = getFallbackYearlyData()
    }
  } catch (err) {
    console.error('Error fetching yearly channel updates:', err)
    error.value = true
    // 使用模拟数据作为最后备选
    chartData.value = getFallbackYearlyData()
  } finally {
    loading.value = false
  }
}

// 处理真实数据库数据的年度更新统计
const processYearlyUpdates = (distributors) => {
  console.log('Processing yearly updates from distributor data...')
  
  const yearlyData = {}
  const allRegions = new Set()
  
  // 处理每个分销商的last_modified_at数据
  distributors.forEach(distributor => {
    if (distributor.last_modified_at && distributor.region) {
      const year = new Date(distributor.last_modified_at).getFullYear()
      const region = distributor.region
      
      if (year >= 2020 && year <= new Date().getFullYear()) { // 只处理合理年份
        if (!yearlyData[year]) {
          yearlyData[year] = {}
        }
        if (!yearlyData[year][region]) {
          yearlyData[year][region] = 0
        }
        yearlyData[year][region]++
        allRegions.add(region)
      }
    }
  })
  
  // 转换为图表格式
  const chart_data = []
  for (const year of Object.keys(yearlyData).sort()) {
    const yearData = { year: parseInt(year) }
    let total = 0
    for (const region of Array.from(allRegions).sort()) {
      const count = yearlyData[year][region] || 0
      yearData[region] = count
      total += count
    }
    yearData.total = total
    chart_data.push(yearData)
  }
  
  // 生成洞察
  const totalUpdates = chart_data.reduce((sum, item) => sum + item.total, 0)
  const mostActiveYear = chart_data.length > 0 
    ? chart_data.reduce((max, item) => item.total > max.total ? item : max).year 
    : null
  
  // 计算最活跃地区
  const regionTotals = {}
  allRegions.forEach(region => {
    regionTotals[region] = chart_data.reduce((sum, item) => sum + (item[region] || 0), 0)
  })
  const mostActiveRegion = Object.keys(regionTotals).length > 0
    ? Object.keys(regionTotals).reduce((max, region) => 
        regionTotals[region] > regionTotals[max] ? region : max)
    : null
  
  // 计算地区增长趋势
  const regionalTrends = {}
  allRegions.forEach(region => {
    const regionData = chart_data.map(item => item[region] || 0)
    if (regionData.length > 1) {
      const firstValue = regionData[0] || 1
      const lastValue = regionData[regionData.length - 1] || 0
      const growthRate = ((lastValue - firstValue) / firstValue * 100)
      
      regionalTrends[region] = {
        total_updates: regionTotals[region],
        growth_rate: Math.round(growthRate * 100) / 100,
        latest_year_updates: lastValue
      }
    }
  })
  
  return {
    chart_data,
    regions: Array.from(allRegions).sort(),
    years: Object.keys(yearlyData).map(Number).sort(),
    insights: {
      total_channel_updates: totalUpdates,
      most_active_year: mostActiveYear,
      most_active_region: mostActiveRegion,
      regional_trends: regionalTrends,
      years_analyzed: Object.keys(yearlyData).length
    }
  }
}

// 备选数据（当API和文件都失败时使用）
const getFallbackYearlyData = () => {
  return {
    chart_data: [
      { year: 2020, usa: 45, eur: 78, as: 32, 'aus-nzl': 12, can: 8, 'lat-a': 15, 'mid-e': 9, af: 5, total: 204 },
      { year: 2021, usa: 52, eur: 89, as: 41, 'aus-nzl': 15, can: 11, 'lat-a': 19, 'mid-e': 12, af: 7, total: 246 },
      { year: 2022, usa: 38, eur: 95, as: 48, 'aus-nzl': 18, can: 9, 'lat-a': 23, 'mid-e': 15, af: 8, total: 254 },
      { year: 2023, usa: 41, eur: 102, as: 55, 'aus-nzl': 21, can: 12, 'lat-a': 28, 'mid-e': 18, af: 11, total: 288 },
      { year: 2024, usa: 47, eur: 108, as: 62, 'aus-nzl': 24, can: 14, 'lat-a': 33, 'mid-e': 21, af: 13, total: 322 }
    ],
    regions: ['af', 'as', 'aus-nzl', 'can', 'eur', 'lat-a', 'mid-e', 'usa'],
    years: [2020, 2021, 2022, 2023, 2024],
    insights: {
      total_channel_updates: 1314,
      most_active_year: 2024,
      most_active_region: 'eur',
      regional_trends: {
        usa: { total_updates: 223, growth_rate: 4.4, latest_year_updates: 47 },
        eur: { total_updates: 472, growth_rate: 38.5, latest_year_updates: 108 },
        as: { total_updates: 238, growth_rate: 93.8, latest_year_updates: 62 },
        'aus-nzl': { total_updates: 90, growth_rate: 100.0, latest_year_updates: 24 },
        can: { total_updates: 54, growth_rate: 75.0, latest_year_updates: 14 },
        'lat-a': { total_updates: 118, growth_rate: 120.0, latest_year_updates: 33 },
        'mid-e': { total_updates: 75, growth_rate: 133.3, latest_year_updates: 21 },
        af: { total_updates: 44, growth_rate: 160.0, latest_year_updates: 13 }
      },
      years_analyzed: 5
    }
  }
}

const initChart = () => {
  if (!chartContainer.value || !chartData.value.chart_data) return
  
  chart = echarts.init(chartContainer.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function(params) {
        let tooltip = `<div class="font-semibold">${params[0].axisValue}</div>`
        let total = 0
        params.forEach(param => {
          if (param.seriesName !== 'Total') {
            tooltip += `<div class="flex justify-between items-center">
              <span class="flex items-center">
                <span class="w-3 h-3 rounded-full inline-block mr-2" style="background-color: ${param.color}"></span>
                ${param.seriesName.toUpperCase()}
              </span>
              <span class="font-medium">${param.value}</span>
            </div>`
            total += param.value
          }
        })
        tooltip += `<div class="border-t pt-1 mt-1 flex justify-between items-center font-semibold">
          <span>${t('common.total')}</span>
          <span>${total}</span>
        </div>`
        return tooltip
      }
    },
    legend: {
      top: 20,
      data: chartData.value.regions.map(region => region.toUpperCase()),
      textStyle: { fontSize: 12 }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.value.chart_data.map(item => item.year),
      axisLabel: { fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      name: t('charts.number_of_updates'),
      nameTextStyle: { fontSize: 12 },
      axisLabel: { fontSize: 12 }
    },
    series: chartData.value.regions.map(region => ({
      name: region.toUpperCase(),
      type: 'bar',
      stack: 'total',
      emphasis: { focus: 'series' },
      data: chartData.value.chart_data.map(item => item[region] || 0),
      itemStyle: {
        color: regionColors[region] || '#64748b'
      }
    })),
    dataZoom: [
      {
        type: 'slider',
        show: chartData.value.chart_data.length > 10,
        start: 0,
        end: 100,
        height: 20,
        bottom: '5%'
      }
    ]
  }
  
  chart.setOption(option)
  
  // Handle resize
  const resizeObserver = new ResizeObserver(() => {
    chart?.resize()
  })
  resizeObserver.observe(chartContainer.value)
}

watch(() => [chartData.value, loading.value], () => {
  if (!loading.value && chartData.value.chart_data) {
    nextTick(() => {
      if (activeTab.value === 'trends') {
        initChart()
      }
    })
  }
})

// Watch active tab changes
watch(activeTab, (newTab) => {
  if (newTab === 'map' && worldGeoData.value && chartData.value.mapped_country_data) {
    nextTick(() => {
      initWorldMap()
    })
  }
})

// Watch selected year changes
watch(selectedYear, () => {
  if (activeTab.value === 'map' && worldMap) {
    updateWorldMap()
  }
})

// Watch chart data changes - reinitialize map when data is refreshed
watch(() => chartData.value.mapped_country_data, (newData, oldData) => {
  if (newData && newData !== oldData && activeTab.value === 'map') {
    console.log('🗺️ Chart data changed, reinitializing map...')
    nextTick(() => {
      // Dispose existing map instance
      if (worldMap) {
        worldMap.dispose()
        worldMap = null
      }
      // Reinitialize map with new data
      if (worldGeoData.value) {
        initWorldMap()
      }
    })
  }
}, { deep: false })

// 检查数据是否需要刷新
const checkForUpdates = async () => {
  try {
    // 优先检查专门的年度更新数据文件
    const response = await fetch('/data/yearly-channel-updates.json')
    if (response.ok) {
      const data = await response.json()
      const newTimestamp = data.timestamp
      
      // 如果时间戳发生变化，重新加载数据
      if (newTimestamp && newTimestamp !== lastDataTimestamp) {
        console.log('Yearly updates data timestamp changed, refreshing chart data...')
        lastDataTimestamp = newTimestamp
        await fetchData()
        return
      }
    }
    
    // 备选：检查主要分销商数据文件
    const fallbackResponse = await fetch('/data/distributors.json')
    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json()
      const newTimestamp = fallbackData.timestamp || fallbackData.last_updated
      
      // 如果时间戳发生变化，重新加载数据
      if (newTimestamp && newTimestamp !== lastDataTimestamp) {
        console.log('Distributor data timestamp changed, refreshing chart data...')
        lastDataTimestamp = newTimestamp
        await fetchData()
      }
    }
  } catch (error) {
    // 静默忽略检查更新时的错误
    console.debug('Update check failed:', error)
  }
}

// 窗口获得焦点时刷新数据
const handleWindowFocus = () => {
  console.log('Window focused, checking for updates...')
  checkForUpdates()
  
  // Also check if world map needs reinitialization
  if (activeTab.value === 'map' && (!worldMap || worldMap.isDisposed())) {
    console.log('🗺️ Window focus detected, reinitializing world map...')
    nextTick(() => {
      if (worldGeoData.value && chartData.value.mapped_country_data) {
        initWorldMap()
      }
    })
  }
}

onMounted(async () => {
  // Load both data and map
  await Promise.all([
    fetchData(),
    loadWorldMapData()
  ])
  
  // Set default selected year to 'all'
  if (availableYears.value.length > 0) {
    selectedYear.value = availableYears.value.includes('all') ? 'all' : availableYears.value[availableYears.value.length - 1]
  }
  
  // 设置定期检查更新（每5分钟）
  refreshInterval = setInterval(checkForUpdates, 5 * 60 * 1000)
  
  // 监听窗口焦点事件
  window.addEventListener('focus', handleWindowFocus)
})

onUnmounted(() => {
  // 清理定时器和事件监听器
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  if (chart) {
    chart.dispose()
  }
  if (worldMap) {
    worldMap.dispose()
  }
  window.removeEventListener('focus', handleWindowFocus)
})
</script>

<style scoped>
/* Slider styles */
.slider {
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  background: linear-gradient(to right, #e5e7eb 0%, #3b82f6 50%, #1e40af 100%);
  outline: none;
  border-radius: 4px;
  cursor: pointer;
}

/* WebKit/Blink */
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  height: 24px;
  width: 24px;
  border-radius: 50%;
  background: #ffffff;
  border: 3px solid #3b82f6;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-color: #1e40af;
}

.slider::-webkit-slider-thumb:active {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

/* Firefox */
.slider::-moz-range-track {
  height: 8px;
  background: linear-gradient(to right, #e5e7eb 0%, #3b82f6 50%, #1e40af 100%);
  border-radius: 4px;
  border: none;
}

.slider::-moz-range-thumb {
  height: 24px;
  width: 24px;
  border-radius: 50%;
  background: #ffffff;
  border: 3px solid #3b82f6;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-color: #1e40af;
}

.slider::-moz-range-thumb:active {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

/* Remove default focus outline */
.slider:focus {
  outline: none;
}

.slider:focus::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.slider:focus::-moz-range-thumb {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}
</style>