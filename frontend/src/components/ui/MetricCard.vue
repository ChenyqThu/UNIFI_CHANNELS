<template>
  <div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 group">
    <div class="flex items-center justify-between mb-4">
      <div :class="iconClasses" class="w-12 h-12 rounded-lg flex items-center justify-center">
        <span class="material-icons text-white">{{ icon }}</span>
      </div>
      <div class="flex items-center space-x-1">
        <span 
          class="material-icons text-sm"
          :class="trendClasses"
        >
          {{ trendIcon }}
        </span>
        <span 
          class="text-sm font-medium"
          :class="trendClasses"
        >
          {{ formatChange(change) }}
        </span>
      </div>
    </div>
    
    <div>
      <h3 class="text-2xl md:text-3xl font-bold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors">
        {{ value }}
      </h3>
      <p class="text-sm font-medium text-gray-900 mb-1">{{ title }}</p>
      <p class="text-xs text-gray-500">{{ subtitle }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: {
    type: String,
    required: true
  },
  change: {
    type: [String, Number],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    required: true
  },
  trend: {
    type: String,
    default: 'up',
    validator: (value) => ['up', 'down', 'neutral'].includes(value)
  },
  color: {
    type: String,
    default: 'blue',
    validator: (value) => ['blue', 'green', 'yellow', 'red', 'purple', 'indigo'].includes(value)
  }
})

const iconClasses = computed(() => {
  const baseClasses = 'transition-all duration-300 group-hover:scale-110'
  const colorMap = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
    green: 'bg-gradient-to-r from-green-500 to-green-600',
    yellow: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
    red: 'bg-gradient-to-r from-red-500 to-red-600',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-600',
    indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-600'
  }
  return `${baseClasses} ${colorMap[props.color]}`
})

const trendClasses = computed(() => {
  const baseClasses = 'transition-colors'
  if (props.trend === 'up') return `${baseClasses} text-green-600`
  if (props.trend === 'down') return `${baseClasses} text-red-600`
  return `${baseClasses} text-gray-500`
})

const trendIcon = computed(() => {
  if (props.trend === 'up') return 'trending_up'
  if (props.trend === 'down') return 'trending_down'
  return 'trending_flat'
})

const formatChange = (change) => {
  const numValue = typeof change === 'string' ? parseFloat(change) : change
  if (isNaN(numValue)) return change
  
  const sign = numValue > 0 ? '+' : ''
  return `${sign}${numValue}%`
}
</script>