<template>
  <div class="regional-revenue-chart">
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
  
  const regionalData = [
    {
      name: t('regions.north_america'),
      value: props.data.q1_2025.north_america_revenue,
      percentage: ((props.data.q1_2025.north_america_revenue / props.data.q1_2025.total_revenue) * 100).toFixed(1),
      growth: '+33%'
    },
    {
      name: t('regions.emea'),
      value: props.data.q1_2025.emea_revenue,
      percentage: ((props.data.q1_2025.emea_revenue / props.data.q1_2025.total_revenue) * 100).toFixed(1),
      growth: '+41%'
    },
    {
      name: t('regions.apac'),
      value: props.data.q1_2025.apac_revenue,
      percentage: ((props.data.q1_2025.apac_revenue / props.data.q1_2025.total_revenue) * 100).toFixed(1),
      growth: '+42%'
    },
    {
      name: t('regions.south_america'),
      value: props.data.q1_2025.south_america_revenue,
      percentage: ((props.data.q1_2025.south_america_revenue / props.data.q1_2025.total_revenue) * 100).toFixed(1),
      growth: '-6%'
    }
  ]

  const colors = [
    ['#60a5fa', '#3b82f6'], // North America - Blue
    ['#34d399', '#10b981'], // EMEA - Green  
    ['#fbbf24', '#f59e0b'], // APAC - Yellow
    ['#f87171', '#ef4444']  // South America - Red
  ]
  
  const option = {
    title: props.showTitle ? {
      text: t('charts.regional_revenue_title'),
      subtext: t('charts.regional_revenue_subtitle'),
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
        const data = regionalData[params.dataIndex]
        return `${params.name}<br/>
                $${params.value}M (${data.percentage}%)<br/>
                <span style="color: #10b981;">YoY Growth: ${data.growth}</span>`
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
        name: t('charts.regional_revenue'),
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
          fontSize: 12,
          fontWeight: 'bold',
          color: '#ffffff',
          formatter: function(params) {
            const data = regionalData[params.dataIndex]
            return `${data.percentage}%`
          }
        },
        data: regionalData.map((item, index) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
              { offset: 0, color: colors[index][0] },
              { offset: 1, color: colors[index][1] }
            ])
          }
        })),
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
.regional-revenue-chart {
  width: 100%;
  height: 100%;
}

.chart-container {
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(16, 185, 129, 0.02) 100%);
}
</style>