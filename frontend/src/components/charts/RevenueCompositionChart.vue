<template>
  <div class="revenue-composition-chart">
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
      text: t('charts.revenue_composition_title'),
      subtext: t('charts.revenue_composition_subtitle'),
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
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        let result = `${params[0].axisValue}<br/>`
        params.forEach(param => {
          const percentage = ((param.value / props.data.q1_2025.total_revenue) * 100).toFixed(1)
          result += `<span style="color: ${param.color};">●</span> ${param.seriesName}: $${param.value}M (${percentage}%)<br/>`
        })
        return result
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#374151'
      }
    },
    legend: {
      top: '10%',
      left: 'center',
      itemGap: 20,
      textStyle: {
        fontSize: 12,
        color: '#4b5563'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '25%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['Q1 2025', 'Q3 2024'],
      axisLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      name: t('charts.revenue_millions'),
      nameTextStyle: {
        color: '#6b7280',
        fontSize: 12
      },
      axisLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 12,
        formatter: '${value}M'
      },
      splitLine: {
        lineStyle: {
          color: '#f3f4f6',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: t('charts.enterprise_technology'),
        type: 'bar',
        stack: 'revenue',
        data: [props.data.q1_2025.enterprise_revenue, props.data.q3_2024.enterprise_revenue],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#60a5fa' },
            { offset: 1, color: '#3b82f6' }
          ])
        },
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: t('charts.service_provider_technology'),
        type: 'bar',
        stack: 'revenue',
        data: [props.data.q1_2025.service_provider_revenue, props.data.q3_2024.service_provider_revenue],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#34d399' },
            { offset: 1, color: '#10b981' }
          ])
        },
        emphasis: {
          focus: 'series'
        }
      }
    ],
    animationDuration: 1000,
    animationEasing: 'cubicOut'
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
.revenue-composition-chart {
  width: 100%;
  height: 100%;
}

.chart-container {
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(16, 185, 129, 0.02) 100%);
}
</style>