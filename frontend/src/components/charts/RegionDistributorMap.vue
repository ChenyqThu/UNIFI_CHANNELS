<template>
  <div class="region-distributor-map">
    <EChartsComponent
      :option="chartOption"
      height="500px"
      :loading="loading"
      :loadingText="$t('charts.loading')"
      @chart-click="handleChartClick"
      @chart-ready="handleChartReady"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import EChartsComponent from './EChartsComponent.vue'
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
const chartRef = ref(null)
const mapLoaded = ref(false)
const loading = ref(false)

// 处理地区数据 - 修复数据映射逻辑
const processedRegionData = computed(() => {
  const regions = props.regionsData || {}
  console.log('RegionDistributorMap: Raw regions data:', regions)
  
  return Object.values(regions)
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 8)
    .map(item => {
      console.log('RegionDistributorMap: Processing item:', item)
      // 确保使用正确的英文翻译key
      const nameKey = item.name_key || item.name
      console.log('RegionDistributorMap: Using nameKey:', nameKey)
      return {
        nameKey: nameKey, // 翻译用的英文key
        displayName: item.name || nameKey, // 显示用的备用名称
        value: item.count || 0,
        coordinates: item.coordinates || [0, 0]
      }
    })
})

// 地区散点图配置 - 修复模糊问题和标签显示
const chartOption = computed(() => {
  const chartData = processedRegionData.value
  
  if (!mapLoaded.value) {
    return {
      title: {
        text: t('charts.loading_world_map'),
        left: 'center',
        top: 'middle'
      }
    }
  }

  return {
    title: {
      text: t('charts.global_distributor_distribution_by_region'),
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const regionName = t(`regions.${params.data.nameKey}`) || params.data.displayName || params.data.nameKey
        return `${regionName}: ${params.data.value[2]} ${t('charts.distributors')}`
      }
    },
    geo: {
      map: 'world',
      roam: false,
      center: [0, 20],
      zoom: 1.2,
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
      type: 'scatter',
      coordinateSystem: 'geo',
      data: chartData.map(item => ({
        nameKey: item.nameKey, // 翻译用的英文key
        displayName: item.displayName, // 显示名称
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
})

function handleChartClick(params) {
  emit('chart-click', params)
}

function handleChartReady(chart) {
  chartRef.value = chart
  emit('chart-ready', chart)
}

onMounted(async () => {
  try {
    loading.value = true
    
    const mapLoadSuccess = await loadMap('world', '/maps/world.json')
    
    if (mapLoadSuccess) {
      mapLoaded.value = true
      console.log('Region map: World map loaded successfully')
    } else {
      console.warn('Region map: Failed to load world map')
      mapLoaded.value = false
    }
  } catch (error) {
    console.error('Region map: Error during initialization:', error)
    mapLoaded.value = false
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.region-distributor-map {
  width: 100%;
  height: 500px;
}
</style>