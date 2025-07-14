<template>
  <div class="revenue-chart-container">
    <EChartsComponent
      :option="chartOption"
      :height="height"
      :theme="theme"
      @chart-click="handleChartClick"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import EChartsComponent from './EChartsComponent.vue'

const { t } = useI18n()

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  type: {
    type: String,
    default: 'doughnut'
  },
  height: {
    type: String,
    default: '300px'
  },
  theme: {
    type: String,
    default: 'light'
  }
})

const emit = defineEmits(['chart-click'])

const chartOption = computed(() => {
  const { labels, datasets } = props.data
  const data = datasets[0]

  if (props.type === 'doughnut' || props.type === 'pie') {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: ${c}M ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        bottom: '0%',
        left: 'center'
      },
      series: [
        {
          name: t('charts.revenue_composition'),
          type: 'pie',
          radius: props.type === 'doughnut' ? ['40%', '70%'] : '70%',
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: labels.map((label, index) => ({
            value: data.data[index],
            name: label,
            itemStyle: {
              color: data.backgroundColor[index]
            }
          }))
        }
      ]
    }
  }

  // Bar chart configuration
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: labels
    },
    yAxis: {
      type: 'value',
      name: t('charts.amount_million_usd')
    },
    series: [
      {
        name: t('charts.revenue'),
        type: 'bar',
        data: data.data.map((value, index) => ({
          value,
          itemStyle: {
            color: data.backgroundColor[index]
          }
        })),
        emphasis: {
          itemStyle: {
            brightness: 0.3
          }
        }
      }
    ]
  }
})

const handleChartClick = (params) => {
  emit('chart-click', params)
}
</script>

<style scoped>
.revenue-chart-container {
  width: 100%;
  position: relative;
}
</style>