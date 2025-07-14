<template>
  <div class="echarts-container" :style="{ height: height, width: width }">
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p class="loading-text">{{ loadingText }}</p>
      </div>
    </div>
    <v-chart 
      ref="chartRef"
      :option="chartOption" 
      :theme="theme"
      :update-options="updateOptions"
      autoresize
      @click="handleChartClick"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { 
  PieChart, 
  BarChart, 
  MapChart,
  LineChart,
  ScatterChart
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent,
  DataZoomComponent,
  VisualMapComponent,
  GeoComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

// Register necessary ECharts components
use([
  CanvasRenderer,
  PieChart,
  BarChart,
  MapChart,
  LineChart,
  ScatterChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent,
  DataZoomComponent,
  VisualMapComponent,
  GeoComponent
])

const props = defineProps({
  option: {
    type: Object,
    required: true
  },
  height: {
    type: String,
    default: '400px'
  },
  width: {
    type: String,
    default: '100%'
  },
  theme: {
    type: String,
    default: 'light'
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingText: {
    type: String,
    default: 'Loading...'
  },
  notMerge: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['chart-click', 'chart-ready'])

const chartRef = ref(null)

const chartOption = computed(() => {
  console.log('EChartsComponent: Computing chart option:', props.option)
  
  // 安全检查，防止props.option为undefined
  if (!props.option) {
    return {
      backgroundColor: 'transparent',
      animationDurationUpdate: 1000,
      animationEasingUpdate: 'cubicInOut'
    }
  }
  
  const option = {
    backgroundColor: 'transparent',
    ...props.option,
    // 确保全局动画配置正确
    animationDurationUpdate: props.option.animationDurationUpdate || 1000,
    animationEasingUpdate: props.option.animationEasingUpdate || 'cubicInOut'
  }
  console.log('EChartsComponent: Final chart option:', option)
  return option
})

// Update options configuration for vue-echarts
const updateOptions = computed(() => ({
  notMerge: props.notMerge,
  lazyUpdate: false,
  silent: false
}))

const handleChartClick = (params) => {
  emit('chart-click', params)
}

onMounted(() => {
  emit('chart-ready', chartRef.value)
})

watch(() => props.option, () => {
  // ECharts will auto-update when option changes
}, { deep: true })

// Expose chart instance for parent component usage
defineExpose({
  getChart: () => chartRef.value?.getChart?.(),
  refresh: () => chartRef.value?.getChart?.().resize()
})
</script>

<style scoped>
.echarts-container {
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  text-align: center;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 2s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #666;
  font-size: 14px;
  margin: 0;
}
</style>