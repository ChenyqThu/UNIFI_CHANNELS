<template>
  <div class="distributor-map-container">
    <!-- Header and Controls -->
    <div class="chart-controls mb-6 mt-6">
      <div class="flex items-center justify-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-900 text-center mb-4">{{ $t('charts.global_distributor_distribution') }}</h2>
          <!-- <div class="flex items-center justify-center mt-1">
            <div class="flex items-center text-xs text-gray-500">
              <span class="material-icons text-xs mr-1">
                {{ currentDataLevel === 'country' ? 'flag' : 'scatter_plot' }}
              </span>
              {{ currentDataLevel === 'country' ? $t('charts.country_view') : $t('charts.region_view') }}
            </div>
          </div> -->
        </div>
      </div>
      
      <!-- Data level switch - 居中显示 -->
      <div class="flex justify-center mt-4">
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
  console.log('🔍 DistributorMap: resellerData.value:', resellerData.value)
  
  if (!resellerData.value) {
    console.warn('⚠️ DistributorMap: resellerData.value 为空')
    return { 
      regions: {}, 
      countries: {}, 
      countriesForMap: [],
      totalCount: 0,
      masterDistributors: 0,
      authorizedResellers: 0
    }
  }
  
  const result = {
    regions: resellerData.value.regions || {},
    countries: resellerData.value.countries || {},
    countriesForMap: resellerData.value.countriesForMap || [],
    totalCount: resellerData.value.totalCount || 0,
    masterDistributors: resellerData.value.masterDistributors || 0,
    authorizedResellers: resellerData.value.authorizedResellers || 0
  }
  
  console.log('🔍 DistributorMap: currentDisplayData结果:', result)
  console.log('🔍 DistributorMap: countriesForMap数量:', result.countriesForMap?.length)
  
  return result
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

