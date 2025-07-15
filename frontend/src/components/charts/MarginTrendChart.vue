<template>
  <div class="margin-trend-chart">
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
      text: t('charts.margin_trend_title'),
      subtext: t('charts.margin_trend_subtitle'),
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
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      formatter: function(params) {
        let result = `${params[0].axisValue}<br/>`
        params.forEach(param => {
          result += `<span style="color: ${param.color};">●</span> ${param.seriesName}: ${param.value}%<br/>`
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
      boundaryGap: false,
      data: ['Q3 2024', '9M 2024', '9M 2025', 'Q1 2025'],
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
      name: t('charts.margin_percentage'),
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
        formatter: '{value}%'
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
        name: t('charts.gross_margin'),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: [
          props.data.q3_2024.gross_margin,
          props.data.nine_months_2024.gross_margin,
          props.data.nine_months_2025.gross_margin,
          props.data.q1_2025.gross_margin
        ],
        itemStyle: {
          color: '#3b82f6'
        },
        lineStyle: {
          width: 3,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#60a5fa' },
            { offset: 1, color: '#3b82f6' }
          ])
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
          ])
        },
        emphasis: {
          focus: 'series'
        },
        markPoint: {
          data: [
            {
              type: 'max',
              name: t('charts.peak_margin'),
              itemStyle: {
                color: '#10b981'
              }
            }
          ]
        }
      },
      {
        name: t('charts.operating_margin'),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: [
          props.data.q3_2024.operating_margin,
          null,
          null,
          props.data.q1_2025.operating_margin
        ],
        itemStyle: {
          color: '#10b981'
        },
        lineStyle: {
          width: 3,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#34d399' },
            { offset: 1, color: '#10b981' }
          ])
        },
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: t('charts.net_margin'),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: [
          props.data.q3_2024.net_margin,
          null,
          null,
          props.data.q1_2025.net_margin
        ],
        itemStyle: {
          color: '#f59e0b'
        },
        lineStyle: {
          width: 3,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#fbbf24' },
            { offset: 1, color: '#f59e0b' }
          ])
        },
        emphasis: {
          focus: 'series'
        }
      }
    ],
    animationDuration: 1500,
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
.margin-trend-chart {
  width: 100%;
  height: 100%;
}

.chart-container {
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(16, 185, 129, 0.02) 100%);
}
</style>