<template>
  <div class="channel-distribution-chart">
    <div ref="chartContainer" class="chart-container" style="width: 100%; height: 400px;"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  showTitle: {
    type: Boolean,
    default: true
  }
})

const { t } = useI18n()
const chartContainer = ref(null)
let chartInstance = null

const initChart = () => {
  if (!chartContainer.value || !props.data) return

  chartInstance = echarts.init(chartContainer.value)
  
  const option = {
    title: props.showTitle ? {
      text: t('charts.channel_distribution_title'),
      subtext: t('charts.channel_distribution_subtitle'),
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937'
      },
      subtextStyle: {
        fontSize: 12,
        color: '#6b7280'
      }
    } : null,
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        return `${params.name}<br/>${params.value}% <br/><span style="color: ${params.color};">●</span> ${t('charts.revenue_share')}`
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#374151'
      }
    },
    legend: {
      bottom: '5%',
      left: 'center',
      itemGap: 20,
      textStyle: {
        fontSize: 12,
        color: '#4b5563'
      }
    },
    series: [
      {
        name: t('charts.channel_distribution'),
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        emphasis: {
          scale: true,
          scaleSize: 10,
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        labelLine: {
          show: false
        },
        label: {
          show: true,
          position: 'inside',
          fontSize: 14,
          fontWeight: 'bold',
          color: '#ffffff',
          formatter: function(params) {
            return `${params.value}%`
          }
        },
        data: [
          {
            value: props.data.distributor_channel,
            name: t('charts.distributor_channel'),
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                { offset: 0, color: '#60a5fa' },
                { offset: 1, color: '#3b82f6' }
              ])
            }
          },
          {
            value: props.data.direct_sales,
            name: t('charts.direct_sales'),
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                { offset: 0, color: '#34d399' },
                { offset: 1, color: '#10b981' }
              ])
            }
          }
        ],
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: function (idx) {
          return Math.random() * 200;
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

const resizeChart = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(async () => {
  await nextTick()
  initChart()
  window.addEventListener('resize', resizeChart)
})

watch(() => props.data, () => {
  if (chartInstance) {
    initChart()
  }
}, { deep: true })
</script>

<style scoped>
.channel-distribution-chart {
  width: 100%;
  height: 100%;
}

.chart-container {
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(16, 185, 129, 0.02) 100%);
}
</style>