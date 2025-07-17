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
        <div ref="chartContainer" class="h-96 w-full"></div>
        
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
            <div v-for="(count, countryName) in topCountriesForYear" :key="countryName"
                 class="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
              <span class="font-medium text-gray-900">{{ countryName }}</span>
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
import { distributorService } from '@/services/distributorService.js'
import { COUNTRY_CODE_TO_MAP_NAME } from '@/utils/countryMapping.js'

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
  const data = chartData.value.mapped_country_data?.[selectedYear.value] || {}
  console.log(`🗺️ Selected year data for ${selectedYear.value}:`, data)
  return data
})

const topCountriesForYear = computed(() => {
  const data = selectedYearData.value
  // 转换为地图国家名并排序
  const mappedData = {}
  
  Object.entries(data).forEach(([countryCode, count]) => {
    const mapName = getCountryMapName(countryCode)
    if (mappedData[mapName]) {
      mappedData[mapName] += count
    } else {
      mappedData[mapName] = count
    }
  })
  
  return Object.fromEntries(
    Object.entries(mappedData)
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

// 获取国家在地图上的显示名称
const getCountryMapName = (countryCode) => {
  return COUNTRY_CODE_TO_MAP_NAME[countryCode] || countryCode
}

// 基于region的动态国家映射（复用competitiveDataService逻辑）
const getCountryMapNameForRegion = (countryCode, region) => {
  // 针对特定region的映射规则
  const regionSpecificMapping = {
    'eur': {
      'IL': 'Israel',
      'MD': 'Moldova', 
      'PA': 'Paraguay',
      'MA': 'Morocco',
      'DE': 'Germany',
      'FR': 'France',
      'IT': 'Italy',
      'GB': 'England',
      'ES': 'Spain',
      'NL': 'Netherlands',
      'BE': 'Belgium',
      'AT': 'Austria',
      'CH': 'Switzerland',
      'PL': 'Poland',
      'CZ': 'Czech Republic',
      'GR': 'Greece',
      'PT': 'Portugal',
      'HU': 'Hungary',
      'RO': 'Romania',
      'BG': 'Bulgaria',
      'HR': 'Croatia',
      'SK': 'Slovakia',
      'LT': 'Lithuania',
      'FI': 'Finland',
      'SE': 'Sweden',
      'DK': 'Denmark',
      'NO': 'Norway',
      'IE': 'Ireland'
    },
    'mid-e': {
      'IL': 'Israel',
      'AE': 'United Arab Emirates',
      'SA': 'Saudi Arabia',
      'KW': 'Kuwait',
      'QA': 'Qatar',
      'BH': 'Bahrain',
      'OM': 'Oman',
      'JO': 'Jordan',
      'LB': 'Lebanon',
      'IQ': 'Iraq',
      'TR': 'Turkey',
      'IR': 'Iran'
    },
    'lat-a': {
      'PA': 'Panama',
      'BR': 'Brazil',
      'AR': 'Argentina',
      'MX': 'Mexico',
      'CO': 'Colombia',
      'PE': 'Peru',
      'VE': 'Venezuela',
      'CL': 'Chile',
      'EC': 'Ecuador',
      'BO': 'Bolivia',
      'UY': 'Uruguay',
      'PY': 'Paraguay',
      'CR': 'Costa Rica',
      'GT': 'Guatemala',
      'HN': 'Honduras',
      'SV': 'El Salvador',
      'NI': 'Nicaragua',
      'DO': 'Dominican Republic',
      'CU': 'Cuba'
    },
    'as': {
      'MA': 'Malaysia',
      'CN': 'China',
      'JP': 'Japan',
      'KR': 'South Korea',
      'IN': 'India',
      'TH': 'Thailand',
      'VN': 'Vietnam',
      'PH': 'Philippines',
      'SG': 'Singapore',
      'MY': 'Malaysia',
      'ID': 'Indonesia',
      'TW': 'Taiwan',
      'HK': 'Hong Kong',
      'MO': 'Macau',
      'KH': 'Cambodia',
      'MM': 'Myanmar',
      'BD': 'Bangladesh',
      'LK': 'Sri Lanka',
      'PK': 'Pakistan',
      'MN': 'Mongolia',
      'KZ': 'Kazakhstan'
    },
    'af': {
      'ZA': 'South Africa',
      'NG': 'Nigeria',
      'KE': 'Kenya',
      'TZ': 'United Republic of Tanzania',
      'UG': 'Uganda',
      'ET': 'Ethiopia',
      'GH': 'Ghana',
      'MA': 'Morocco',
      'DZ': 'Algeria',
      'TN': 'Tunisia',
      'LY': 'Libya',
      'EG': 'Egypt',
      'ZW': 'Zimbabwe',
      'NA': 'Namibia',
      'ZM': 'Zambia',
      'MW': 'Malawi',
      'MZ': 'Mozambique'
    },
    'aus-nzl': {
      'AU': 'Australia',
      'NZ': 'New Zealand',
      'FJ': 'Fiji',
      'PG': 'Papua New Guinea'
    }
  }

  // 先尝试region特定映射
  if (regionSpecificMapping[region] && regionSpecificMapping[region][countryCode]) {
    return regionSpecificMapping[region][countryCode]
  }

  // 如果没有region特定映射，使用原来的全局映射（但排除会冲突的代码）
  if (COUNTRY_CODE_TO_MAP_NAME[countryCode]) {
    // 排除容易冲突的代码，这些必须通过region确定
    const conflictingCodes = ['IL', 'PA', 'MD', 'MA', 'CA']
    if (conflictingCodes.includes(countryCode)) {
      console.warn(`⚠️ 冲突代码 ${countryCode} 在 region ${region} 中没有映射`)
      return null
    }
    return COUNTRY_CODE_TO_MAP_NAME[countryCode]
  }

  // 如果都没有，返回原代码作为国家名
  return countryCode
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
    'DK': '丹麦', 'FI': '芬兰', 'BR': '巴西', 'IN': '印度', 'TH': '泰国', 'VN': '越南',
    'US': '美国', 'USA': '美国'
  }
  return countryNames[countryCode] || getCountryMapName(countryCode) || countryCode
}

// Load world map data
const loadWorldMapData = async () => {
  try {
    const response = await fetch('/maps/world.json')
    if (response.ok) {
      const data = await response.json()
      worldGeoData.value = data
      echarts.registerMap('world', data)
      // ✅ World map data loaded successfully
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
  
  console.log('🗺️ Updating world map with country-level data:', selectedYearData.value)
  
  // Prepare map data - data is already properly aggregated by region-first logic
  const mapData = []
  
  if (selectedYearData.value && typeof selectedYearData.value === 'object') {
    Object.entries(selectedYearData.value).forEach(([countryName, count]) => {
      console.log(`🗺️ Processing country ${countryName} with ${count} updates`)
      
      if (count > 0) {
        mapData.push({
          name: countryName,
          value: count,
          countryCode: countryName,
          originalCodes: [countryName] // For now, use countryName as original code
        })
      }
    })
  }
  
  console.log('🗺️ Final map data:', mapData)
  
  // Ensure we have at least some data to display
  if (mapData.length === 0) {
    console.warn('🗺️ No valid map data to display')
    return
  }
  
  // Calculate max value based on whether we're showing "all" years or individual years
  let maxValue = 1
  
  if (selectedYear.value === 'all') {
    // For "all" years, use max from only the "all" data
    if (chartData.value.mapped_country_data && chartData.value.mapped_country_data.all) {
      const allYearValues = Object.values(chartData.value.mapped_country_data.all).filter(v => v != null && !isNaN(v) && v > 0)
      if (allYearValues.length > 0) {
        maxValue = Math.max(maxValue, Math.max(...allYearValues))
      }
    }
    console.log('🗺️ Max value for "all" years scale:', maxValue)
  } else {
    // For individual years, use max from all individual years (exclude "all")
    if (chartData.value.mapped_country_data) {
      Object.entries(chartData.value.mapped_country_data).forEach(([year, yearData]) => {
        if (year !== 'all' && yearData && typeof yearData === 'object') {
          const values = Object.values(yearData).filter(v => v != null && !isNaN(v) && v > 0)
          if (values.length > 0) {
            maxValue = Math.max(maxValue, Math.max(...values))
          }
        }
      })
    }
    console.log('🗺️ Max value for individual years scale:', maxValue)
  }
  
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
            const countryName = params.data.name
            const updateCount = params.data.value
            const originalCodes = params.data.originalCodes || []
            
            let tooltip = `<div class="font-semibold">${countryName}</div>`
            
            // Show original codes if multiple (e.g., US states)
            if (originalCodes.length > 1) {
              tooltip += `<div class="text-xs text-gray-500 mb-1">${t('charts.includes')}: ${originalCodes.join(', ')}</div>`
            } else if (originalCodes.length === 1) {
              tooltip += `<div class="text-xs text-gray-500 mb-1">${t('charts.code')}: ${originalCodes[0]}</div>`
            }
            
            tooltip += `<div class="text-sm">${t('charts.updates')}: <span class="font-medium">${updateCount}</span></div>`
            
            return tooltip
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
}

const fetchData = async () => {
  try {
    loading.value = true
    error.value = false
    
    console.log('🔄 Loading yearly channel updates using unified service...')
    
    // 使用新的统一竞争数据服务
    try {
      const { competitiveDataService } = await import('@/services/competitiveDataService')
      const overview = await competitiveDataService.getCompetitiveOverview()
      
      if (overview && overview.yearlyTrends) {
        console.log('✅ Loaded yearly trends from unified service:', overview.yearlyTrends)
        
        // 转换统一服务的数据格式为组件需要的格式
        const yearlyData = await convertUnifiedServiceData(overview.yearlyTrends)
        
        // 验证转换后的数据
        if (yearlyData && yearlyData.mapped_country_data && yearlyData.chart_data) {
          chartData.value = yearlyData
          lastDataTimestamp = overview.timestamp
          
          console.log('✅ Yearly channel updates processed successfully from unified service')
          console.log('🗺️ Country data available:', Object.keys(yearlyData.mapped_country_data))
          return
        } else {
          console.warn('⚠️ Unified service data conversion failed, falling back')
        }
      }
      
      console.warn('⚠️ Unified service returned no yearly trends, falling back to old logic')
    } catch (unifiedError) {
      console.warn('❌ Unified service failed, falling back to old logic:', unifiedError)
    }
    
    // 备选：使用原始逻辑从Supabase获取分销商数据
    try {
      const allDistributors = await distributorService.getAll({ 
        activeOnly: true 
      })
      
      if (allDistributors && allDistributors.length > 0) {
        console.log(`✅ Loaded ${allDistributors.length} distributors from Supabase (fallback)`)
        
        // 处理年度更新数据
        const yearlyData = await processYearlyUpdatesFromDatabase(allDistributors)
        chartData.value = yearlyData
        lastDataTimestamp = new Date().toISOString()
        
        console.log('✅ Yearly channel updates processed successfully (fallback)')
        return
      }
    } catch (dbError) {
      console.warn('❌ Failed to load from Supabase, trying file fallback:', dbError)
    }
    
    // 备选：从专门的年度更新数据文件读取
    try {
      const response = await fetch('/data/yearly-channel-updates.json')
      if (response.ok) {
        const data = await response.json()
        console.log('📁 Fallback: loaded yearly channel updates from file')
        
        // 更新时间戳
        lastDataTimestamp = data.timestamp
        
        if (data.data) {
          chartData.value = data.data
          return
        }
      }
    } catch (fileError) {
      console.warn('❌ Failed to load yearly updates data from file:', fileError)
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

// 将地区数据拆解为国家级别数据
const expandRegionDataToCountries = async (regionYearlyData) => {
  console.log('🔄 Expanding region data to country-level data...')
  
  try {
    // 获取真实的分销商数据以确定每个地区的具体国家
    const { competitiveDataService } = await import('@/services/competitiveDataService')
    const overview = await competitiveDataService.getCompetitiveOverview()
    
    if (!overview || !overview.distributors) {
      console.warn('⚠️ No distributor data available, using fallback country mapping')
      return expandRegionDataToCountriesFallback(regionYearlyData)
    }
    
    const allDistributors = await (await import('@/services/distributorService')).distributorService.getAll({ 
      activeOnly: true 
    })
    
    // 按地区和国家分组分销商
    const regionCountryDistributors = {}
    const countryTotalDistributors = {} // 记录每个国家的总分销商数
    
    allDistributors.forEach(dist => {
      const region = dist.region
      const country = dist.country_state
      
      if (!region || !country) return
      
      if (!regionCountryDistributors[region]) {
        regionCountryDistributors[region] = {}
      }
      if (!regionCountryDistributors[region][country]) {
        regionCountryDistributors[region][country] = []
      }
      regionCountryDistributors[region][country].push(dist)
      
      // 记录国家总分销商数
      if (!countryTotalDistributors[country]) {
        countryTotalDistributors[country] = 0
      }
      countryTotalDistributors[country]++
    })
    
    // 根据真实分销商数据分配年度更新数据
    const countryYearlyData = {}
    
    Object.entries(regionYearlyData).forEach(([region, yearData]) => {
      const regionCountries = regionCountryDistributors[region] || {}
      const countryList = Object.keys(regionCountries)
      
      if (countryList.length === 0) {
        console.warn(`⚠️ No countries found for region ${region}`)
        return
      }
      
      // 计算每个国家的分销商权重
      const countryWeights = {}
      let totalWeight = 0
      
      countryList.forEach(country => {
        const weight = regionCountries[country].length
        countryWeights[country] = weight
        totalWeight += weight
      })
      
      // 按权重分配年度更新数据
      Object.entries(yearData).forEach(([year, totalCount]) => {
        countryList.forEach(country => {
          const weight = countryWeights[country]
          const countryCount = Math.round((weight / totalWeight) * totalCount)
          
          if (!countryYearlyData[country]) {
            countryYearlyData[country] = {}
          }
          
          countryYearlyData[country][year] = (countryYearlyData[country][year] || 0) + countryCount
        })
      })
    })
    
    console.log('✅ Expanded region data to country-level data:', Object.keys(countryYearlyData).length, 'countries')
    return { countryYearlyData, countryTotalDistributors }
    
  } catch (error) {
    console.error('❌ Error expanding region data to countries:', error)
    return expandRegionDataToCountriesFallback(regionYearlyData)
  }
}

// 备用的国家数据拆解逻辑
const expandRegionDataToCountriesFallback = (regionYearlyData) => {
  console.log('🔄 Using fallback country mapping for region data expansion...')
  
  // 预定义的地区到国家映射
  const regionCountryMapping = {
    'usa': ['US'],
    'can': ['CA'],
    'eur': ['DE', 'FR', 'IT', 'GB', 'ES', 'NL', 'BE', 'AT', 'CH', 'PL', 'CZ', 'GR', 'PT', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV', 'EE', 'FI', 'SE', 'DK', 'NO', 'IE'],
    'as': ['CN', 'JP', 'KR', 'IN', 'TH', 'VN', 'PH', 'SG', 'MY', 'ID', 'TW', 'HK', 'KH', 'MM', 'MN', 'KZ', 'PK', 'BD', 'LK', 'NP'],
    'aus-nzl': ['AU', 'NZ', 'FJ', 'PG'],
    'lat-a': ['BR', 'AR', 'MX', 'CO', 'PE', 'VE', 'CL', 'EC', 'BO', 'UY', 'PY', 'PA', 'CR', 'GT', 'HN', 'SV', 'NI', 'DO', 'CU'],
    'mid-e': ['AE', 'SA', 'IL', 'KW', 'QA', 'BH', 'OM', 'JO', 'LB', 'IQ', 'TR', 'IR'],
    'af': ['ZA', 'NG', 'KE', 'TZ', 'UG', 'GH', 'MA', 'DZ', 'TN', 'LY', 'EG', 'ET', 'ZW', 'NA', 'ZM', 'MW', 'MZ', 'AO', 'BW']
  }
  
  const countryYearlyData = {}
  const countryTotalDistributors = {} // 模拟总分销商数
  
  Object.entries(regionYearlyData).forEach(([region, yearData]) => {
    const countries = regionCountryMapping[region] || []
    
    if (countries.length === 0) {
      console.warn(`⚠️ No countries mapping for region ${region}`)
      return
    }
    
    // 平均分配年度更新数据到各国家
    Object.entries(yearData).forEach(([year, totalCount]) => {
      const countPerCountry = Math.round(totalCount / countries.length)
      
      countries.forEach(country => {
        if (!countryYearlyData[country]) {
          countryYearlyData[country] = {}
        }
        countryYearlyData[country][year] = countPerCountry
        
        // 模拟总分销商数 (假设每个国家有 10-50 个分销商)
        if (!countryTotalDistributors[country]) {
          countryTotalDistributors[country] = Math.floor(Math.random() * 40) + 10
        }
      })
    })
  })
  
  console.log('✅ Fallback country mapping completed:', Object.keys(countryYearlyData).length, 'countries')
  return { countryYearlyData, countryTotalDistributors }
}

// 转换统一服务数据格式为组件需要的格式
const convertUnifiedServiceData = async (yearlyTrends) => {
  console.log('🔄 Converting unified service data to component format...')
  
  if (!yearlyTrends || !yearlyTrends.global || !yearlyTrends.byRegion) {
    console.warn('⚠️ Invalid yearly trends data from unified service')
    return getFallbackYearlyData()
  }
  
  const chart_data = []
  const mapped_country_data = {}
  
  // 获取所有地区列表
  const regions = Object.keys(yearlyTrends.byRegion)
  
  // 处理全球年度数据
  const years = Object.keys(yearlyTrends.global).map(y => parseInt(y)).sort()
  
  for (const year of years) {
    const yearData = { year }
    
    // 添加各地区的数据
    Object.entries(yearlyTrends.byRegion).forEach(([region, regionYears]) => {
      yearData[region] = regionYears[year] || 0
    })
    
    chart_data.push(yearData)
  }
  
  // 直接使用competitiveDataService获取正确的国家数据
  try {
    const { competitiveDataService } = await import('@/services/competitiveDataService')
    const overview = await competitiveDataService.getCompetitiveOverview()
    
    if (overview && overview.distributors && overview.distributors.mapData) {
      console.log('🗺️ Using competitiveDataService mapData:', overview.distributors.mapData)
      
      // 对于"全部年份"，直接使用真实的分销商总数
      mapped_country_data.all = {}
      overview.distributors.mapData.forEach(item => {
        mapped_country_data.all[item.name] = item.value || item.count
      })
      
      // 为各个年份准备数据，按比例分配
      years.forEach(year => {
        mapped_country_data[year] = {}
        const yearRegionData = yearlyTrends.byRegion
        
        // 根据年度地区数据按比例分配到各国家
        overview.distributors.mapData.forEach(item => {
          const region = item.region
          if (yearRegionData[region] && yearRegionData[region][year]) {
            // 按该国家在该地区的占比分配年度更新数
            const regionTotal = overview.distributors.regions[region]?.count || 1
            const countryRatio = (item.value || item.count) / regionTotal
            const yearlyUpdates = Math.round(yearRegionData[region][year] * countryRatio)
            
            if (yearlyUpdates > 0) {
              mapped_country_data[year][item.name] = yearlyUpdates
            }
          }
        })
      })
      
      console.log('✅ Successfully processed country data from competitiveDataService')
      console.log('🗺️ All years country data:', mapped_country_data.all)
    } else {
      throw new Error('No mapData from competitiveDataService')
    }
  } catch (error) {
    console.warn('⚠️ Fallback to simple region mapping:', error)
    
    // 备用方案：简单的地区到国家映射
    const regionToCountryMap = {
      'usa': 'USA',
      'can': 'Canada', 
      'eur': 'Germany',
      'as': 'China',
      'aus-nzl': 'Australia',
      'lat-a': 'Brazil',
      'mid-e': 'Saudi Arabia',
      'af': 'South Africa'
    }
    
    // 对于"全部年份"，使用简化的分销商总数
    mapped_country_data.all = {}
    Object.entries(yearlyTrends.byRegion).forEach(([region, regionYears]) => {
      const countryName = regionToCountryMap[region]
      if (countryName) {
        mapped_country_data.all[countryName] = Object.values(regionYears).reduce((sum, count) => sum + count, 0)
      }
    })
    
    years.forEach(year => {
      mapped_country_data[year] = {}
      Object.entries(yearlyTrends.byRegion).forEach(([region, regionYears]) => {
        const countryName = regionToCountryMap[region]
        if (countryName && regionYears[year]) {
          mapped_country_data[year][countryName] = regionYears[year]
        }
      })
    })
  }
  
  console.log('✅ Converted unified service data with country-level data:', { chart_data, regions, years: years.length })
  
  return {
    chart_data,
    regions,
    mapped_country_data,
    available_years: [...years, 'all']
  }
}

// 处理Supabase数据库数据的年度更新统计
const processYearlyUpdatesFromDatabase = async (distributors) => {
  console.log('🔄 Processing yearly updates from Supabase data...')
  
  const yearlyData = {}
  const allRegions = new Set()
  const currentYear = new Date().getFullYear()
  
  // 处理每个分销商的last_modified_at字段
  distributors.forEach(distributor => {
    const region = distributor.region
    if (!region) return
    
    allRegions.add(region)
    
    // 使用last_modified_at字段作为年度更新的标准
    if (distributor.last_modified_at) {
      const year = new Date(distributor.last_modified_at).getFullYear()
      if (year >= 2020 && year <= currentYear) {
        // 地区级别数据
        if (!yearlyData[year]) {
          yearlyData[year] = {}
        }
        if (!yearlyData[year][region]) {
          yearlyData[year][region] = 0
        }
        yearlyData[year][region]++
      }
    }
  })
  
  // 转换为图表格式
  const chart_data = []
  const years = Object.keys(yearlyData).map(y => parseInt(y)).sort()
  
  for (const year of years) {
    const yearData = { year }
    for (const region of allRegions) {
      yearData[region] = yearlyData[year][region] || 0
    }
    chart_data.push(yearData)
  }
  
  // 构建年度趋势对象以传递给convertUnifiedServiceData
  const yearlyTrends = {
    global: {},
    byRegion: {}
  }
  
  // 计算全球数据
  years.forEach(year => {
    yearlyTrends.global[year] = Object.values(yearlyData[year] || {}).reduce((sum, count) => sum + count, 0)
  })
  
  // 构建地区数据
  allRegions.forEach(region => {
    yearlyTrends.byRegion[region] = {}
    years.forEach(year => {
      yearlyTrends.byRegion[region][year] = yearlyData[year]?.[region] || 0
    })
  })
  
  // 调用convertUnifiedServiceData来处理国家级别数据
  const convertedData = await convertUnifiedServiceData(yearlyTrends)
  
  console.log(`✅ Processed ${distributors.length} distributors into ${chart_data.length} years of data`)
  console.log('📊 Regions found:', Array.from(allRegions))
  console.log('📅 Years covered:', years)
  
  return {
    chart_data: convertedData.chart_data,
    regions: convertedData.regions,
    years: years,
    mapped_country_data: convertedData.mapped_country_data,
    available_years: convertedData.available_years,
    summary: {
      total_distributors: distributors.length,
      years_covered: years.length,
      regions_covered: allRegions.size
    }
  }
}

// 处理静态文件数据的年度更新统计（备用）
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
    all_country_data: {
      'US': { 2020: 45, 2021: 52, 2022: 38, 2023: 41, 2024: 47 },
      'CA': { 2020: 8, 2021: 11, 2022: 9, 2023: 12, 2024: 14 },
      'DE': { 2020: 25, 2021: 28, 2022: 30, 2023: 32, 2024: 35 },
      'FR': { 2020: 20, 2021: 23, 2022: 25, 2023: 27, 2024: 30 },
      'GB': { 2020: 15, 2021: 18, 2022: 20, 2023: 22, 2024: 25 },
      'CN': { 2020: 18, 2021: 22, 2022: 26, 2023: 30, 2024: 33 },
      'JP': { 2020: 8, 2021: 10, 2022: 12, 2023: 14, 2024: 16 },
      'AU': { 2020: 8, 2021: 10, 2022: 12, 2023: 14, 2024: 16 },
      'BR': { 2020: 8, 2021: 10, 2022: 12, 2023: 15, 2024: 18 },
      'ZA': { 2020: 3, 2021: 4, 2022: 5, 2023: 6, 2024: 7 }
    },
    mapped_country_data: {
      'all': {
        'US': 223, 'CA': 54, 'DE': 150, 'FR': 125, 'GB': 100, 
        'CN': 129, 'JP': 60, 'AU': 60, 'BR': 63, 'ZA': 25
      },
      2020: { 'US': 45, 'CA': 8, 'DE': 25, 'FR': 20, 'GB': 15, 'CN': 18, 'JP': 8, 'AU': 8, 'BR': 8, 'ZA': 3 },
      2021: { 'US': 52, 'CA': 11, 'DE': 28, 'FR': 23, 'GB': 18, 'CN': 22, 'JP': 10, 'AU': 10, 'BR': 10, 'ZA': 4 },
      2022: { 'US': 38, 'CA': 9, 'DE': 30, 'FR': 25, 'GB': 20, 'CN': 26, 'JP': 12, 'AU': 12, 'BR': 12, 'ZA': 5 },
      2023: { 'US': 41, 'CA': 12, 'DE': 32, 'FR': 27, 'GB': 22, 'CN': 30, 'JP': 14, 'AU': 14, 'BR': 15, 'ZA': 6 },
      2024: { 'US': 47, 'CA': 14, 'DE': 35, 'FR': 30, 'GB': 25, 'CN': 33, 'JP': 16, 'AU': 16, 'BR': 18, 'ZA': 7 }
    },
    available_years: [2020, 2021, 2022, 2023, 2024, 'all'],
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
  if (!chartContainer.value) {
    console.warn('📊 Cannot initialize chart: missing container')
    return
  }
  
  if (!chartData.value.chart_data) {
    console.warn('📊 Cannot initialize chart: missing chart data')
    return
  }
  
  console.log('📊 Initializing chart with data:', chartData.value.chart_data.length, 'years')
  
  // 清理现有的图表实例
  if (chart && !chart.isDisposed()) {
    console.log('📊 Disposing existing chart instance')
    chart.dispose()
    chart = null
  }
  
  // 创建新的图表实例
  try {
    console.log('📊 Creating new chart instance')
    chart = echarts.init(chartContainer.value)
    
    // 更新图表配置
    updateChartOption()
    
    // 添加窗口大小变化监听
    const handleResize = () => {
      if (chart && !chart.isDisposed()) {
        chart.resize()
      }
    }
    
    window.addEventListener('resize', handleResize)
    
    // 监听容器大小变化
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        if (chart && !chart.isDisposed()) {
          chart.resize()
        }
      })
      resizeObserver.observe(chartContainer.value)
    }
    
    console.log('📊 Chart initialized successfully')
  } catch (error) {
    console.error('📊 Failed to initialize chart:', error)
    chart = null
  }
}

// 提取图表配置更新逻辑
const updateChartOption = () => {
  if (!chart || chart.isDisposed()) {
    console.warn('📊 Cannot update chart option: chart is disposed or missing')
    return
  }
  
  if (!chartData.value.chart_data || !chartData.value.regions) {
    console.warn('📊 Cannot update chart option: missing chart_data or regions')
    return
  }
  
  console.log('📊 Updating chart with data:', chartData.value.chart_data.length, 'years')
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
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
      axisLabel: { fontSize: 12 },
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: t('charts.number_of_updates'),
      nameTextStyle: { fontSize: 12 },
      axisLabel: { fontSize: 12 }
    },
    series: chartData.value.regions.map(region => ({
      name: region.toUpperCase(),
      type: 'line',
      stack: 'total',
      areaStyle: {
        opacity: 0.8
      },
      emphasis: { focus: 'series' },
      smooth: true,
      data: chartData.value.chart_data.map(item => item[region] || 0),
      itemStyle: {
        color: regionColors[region] || '#64748b'
      },
      lineStyle: {
        width: 2,
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
  
  try {
    chart.setOption(option, true) // true 表示 notMerge，完全替换配置
    console.log('📊 Chart option updated successfully')
  } catch (error) {
    console.error('📊 Error updating chart option:', error)
  }
}

// 优化的图表初始化监听
watch(() => [chartData.value, loading.value], ([newChartData, newLoading], [oldChartData, oldLoading]) => {
  if (!newLoading && newChartData?.chart_data) {
    nextTick(() => {
      if (activeTab.value === 'trends') {
        // 只在数据真正改变时重新初始化图表
        if (newChartData !== oldChartData) {
          console.log('🔄 Initializing trends chart due to data change')
          initChart()
        }
      }
    })
  }
}, { deep: false }) // 使用浅比较提高性能

// 优化的标签页切换监听
watch(activeTab, (newTab, oldTab) => {
  console.log(`🔄 Tab changed from ${oldTab} to ${newTab}`)
  
  if (newTab === 'map' && worldGeoData.value && chartData.value.mapped_country_data) {
    nextTick(() => {
      console.log('🗺️ Initializing world map for map tab')
      initWorldMap()
    })
  } else if (newTab === 'trends') {
    // 延迟初始化，确保DOM已完全渲染
    setTimeout(() => {
      console.log('📊 Switching to trends tab, checking data availability')
      console.log('📊 Chart data available:', !!chartData.value.chart_data)
      console.log('📊 Chart container available:', !!chartContainer.value)
      
      if (chartData.value.chart_data && chartContainer.value) {
        console.log('📊 Initializing trends chart for trends tab')
        initChart()
      } else {
        console.warn('📊 No chart data or container available for trends tab')
        // 如果数据还没准备好，等一会再试
        setTimeout(() => {
          if (chartData.value.chart_data && chartContainer.value && activeTab.value === 'trends') {
            console.log('📊 Retry initializing trends chart')
            initChart()
          }
        }, 500)
      }
    }, 100)
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
  console.log('🚀 Mounting YearlyChannelUpdates component')
  
  // Load both data and map
  await Promise.all([
    fetchData(),
    loadWorldMapData()
  ])
  
  // Set default selected year to 'all'
  if (availableYears.value.length > 0) {
    selectedYear.value = availableYears.value.includes('all') ? 'all' : availableYears.value[availableYears.value.length - 1]
  }
  
  // 根据当前活动标签页初始化相应的图表
  await nextTick()
  if (activeTab.value === 'trends' && chartData.value.chart_data) {
    console.log('📊 Initializing trends chart on mount')
    initChart()
  } else if (activeTab.value === 'map' && worldGeoData.value && chartData.value.mapped_country_data) {
    console.log('🗺️ Initializing world map on mount')
    initWorldMap()
  }
  
  // 设置定期检查更新（每5分钟）
  refreshInterval = setInterval(checkForUpdates, 5 * 60 * 1000)
  
  // 监听窗口焦点事件
  window.addEventListener('focus', handleWindowFocus)
})

onUnmounted(() => {
  console.log('🧹 Cleaning up YearlyChannelUpdates component')
  
  // 清理定时器和事件监听器
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
  
  // 清理图表实例
  if (chart && !chart.isDisposed()) {
    chart.dispose()
    chart = null
  }
  
  if (worldMap && !worldMap.isDisposed()) {
    worldMap.dispose()
    worldMap = null
  }
  
  // 移除事件监听器
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