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
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChannelStore } from '@/stores/channel'
import EChartsComponent from './EChartsComponent.vue'
import { loadMap } from '@/utils/mapLoader'
import { convertToMapData } from '@/utils/countryMapping'

const { t } = useI18n()
const channelStore = useChannelStore()

const currentMode = ref('map')
const currentDataLevel = ref('region')
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

const currentDisplayData = computed(() => {
  if (!resellerData.value) return { regions: {}, countries: {} }
  
  if (currentDataLevel.value === 'country') {
    return {
      regions: resellerData.value.regions || {},
      countries: resellerData.value.countries || {},
      totalCount: resellerData.value.totalCount,
      masterDistributors: resellerData.value.masterDistributors,
      authorizedResellers: resellerData.value.authorizedResellers
    }
  } else {
    return resellerData.value
  }
})

const chartHeight = computed(() => chartModes.value[currentMode.value].height)

function getChartData() {
  const isCountryView = currentDataLevel.value === 'country'
  
  if (isCountryView) {
    const countriesData = currentDisplayData.value.countries || currentDisplayData.value.regions
    const mapData = convertToMapData(countriesData)
    return mapData
      .filter(item => item.value > 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .map(item => ({
        name: item.name,
        value: item.value || 0,
        coordinates: item.coordinates || [0, 0]
      }))
  } else {
    const dataEntries = Object.values(currentDisplayData.value.regions || {})
    return dataEntries
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 8)
      .map(item => ({
        name: item.name,
        value: item.count || 0,
        coordinates: item.coordinates || [0, 0]
      }))
  }
}

const chartOption = computed(() => {
  const chartData = getChartData()
  const isCountryView = currentDataLevel.value === 'country'
  
  if (currentMode.value === 'map') {
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
  }
  
  if (currentMode.value === 'bar') {
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
  }
  
  if (currentMode.value === 'pie') {
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
        data: chartData.slice(0, 12),
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
  }
  
  return {}
})

function switchChartMode(newMode) {
  if (chartLoading.value || currentMode.value === newMode) return
  
  chartLoading.value = true
  currentMode.value = newMode
  
  setTimeout(() => {
    chartLoading.value = false
  }, 100)
}

async function switchDataLevel(newLevel) {
  if (chartLoading.value || currentDataLevel.value === newLevel) return
  
  chartLoading.value = true
  currentDataLevel.value = newLevel
  
  setTimeout(() => {
    chartLoading.value = false
  }, 100)
}

function handleChartClick(params) {
  console.log('Chart clicked:', params)
}

function handleChartReady(chart) {
  chartRef.value = chart
}

onMounted(async () => {
  try {
    await channelStore.fetchResellerData()
    
    const mapLoadSuccess = await loadMap('world', '/maps/world.json')
    
    if (mapLoadSuccess) {
      mapLoaded.value = true
      console.log('World map loaded successfully')
    } else {
      console.warn('Failed to load world map, using scatter plot fallback')
      mapLoaded.value = false
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