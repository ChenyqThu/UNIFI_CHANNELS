<template>
  <div class="distributor-map-container">
    <!-- Header and Controls -->
    <div class="chart-controls mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-xl font-semibold text-gray-900">{{ $t('charts.global_distributor_distribution') }}</h3>
          <div class="flex items-center mt-1">
            <div class="flex items-center text-xs text-gray-500">
              <span class="material-icons text-xs mr-1">
                {{ currentDataLevel === 'country' ? 'flag' : 'scatter_plot' }}
              </span>
              {{ currentDataLevel === 'country' ? $t('charts.country_view') : $t('charts.region_view') }}
            </div>
          </div>
        </div>
        
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
      </div>
    </div>

    <!-- Chart Components -->
    <div class="chart-wrapper bg-white rounded-xl border border-gray-200 p-6">
      <div v-if="chartLoading" class="flex items-center justify-center h-96">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-600">{{ $t('charts.loading') }}</p>
        </div>
      </div>
      
      <!-- Region View -->
      <RegionDistributorMap
        v-else-if="currentDataLevel === 'region'"
        :regionsData="currentDisplayData.regions"
        @chart-click="handleChartClick"
        @chart-ready="handleChartReady"
      />
      
      <!-- Country View -->
      <CountryDistributorCharts
        v-else-if="currentDataLevel === 'country'"
        :countriesData="currentDisplayData.countriesForMap"
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
import RegionDistributorMap from './RegionDistributorMap.vue'
import CountryDistributorCharts from './CountryDistributorCharts.vue'

const { t } = useI18n()
const channelStore = useChannelStore()

const currentDataLevel = ref('region')
const chartRef = ref(null)
const chartLoading = ref(false)

const dataLevels = computed(() => ({
  region: { label: t('charts.region_view'), icon: 'language' },
  country: { label: t('charts.country_view'), icon: 'flag' }
}))

const resellerData = computed(() => channelStore.resellerData)

const currentDisplayData = computed(() => {
  if (!resellerData.value) return { 
    regions: {}, 
    countries: {}, 
    countriesForMap: [],
    totalCount: 0,
    masterDistributors: 0,
    authorizedResellers: 0
  }
  
  return {
    regions: resellerData.value.regions || {},
    countries: resellerData.value.countries || {},
    countriesForMap: resellerData.value.countriesForMap || [],
    totalCount: resellerData.value.totalCount || 0,
    masterDistributors: resellerData.value.masterDistributors || 0,
    authorizedResellers: resellerData.value.authorizedResellers || 0
  }
})

async function switchDataLevel(newLevel) {
  if (chartLoading.value || currentDataLevel.value === newLevel) return
  
  chartLoading.value = true
  
  // 使用双重nextTick确保Vue更新周期完成
  await nextTick()
  await nextTick()
  
  currentDataLevel.value = newLevel
  
  // 延迟结束loading状态，让用户看到切换过程
  await nextTick()
  setTimeout(() => {
    chartLoading.value = false
  }, 200)
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
  } catch (error) {
    console.error('Error during component initialization:', error)
  }
})
</script>

<style scoped>
.distributor-map-container {
  width: 100%;
}

.chart-wrapper {
  position: relative;
  min-height: 500px;
}

.chart-controls {
  position: relative;
  z-index: 10;
}
</style>

