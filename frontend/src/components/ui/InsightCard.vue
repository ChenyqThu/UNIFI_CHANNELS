<template>
  <div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
    <div class="flex items-center mb-4">
      <div :class="iconClasses" class="w-10 h-10 rounded-lg flex items-center justify-center mr-3">
        <span class="material-icons text-white text-lg">{{ icon }}</span>
      </div>
      <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
    </div>
    
    <ul class="space-y-3">
      <li 
        v-for="(insight, index) in insights" 
        :key="index"
        class="flex items-start space-x-3 text-sm text-gray-600 leading-relaxed"
      >
        <div class="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gray-400 mt-2"></div>
        <span>{{ insight }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: 'blue',
    validator: (value) => ['blue', 'green', 'yellow', 'red', 'purple', 'indigo'].includes(value)
  },
  insights: {
    type: Array,
    required: true
  }
})

const iconClasses = computed(() => {
  const colorMap = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
    green: 'bg-gradient-to-r from-green-500 to-green-600',
    yellow: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
    red: 'bg-gradient-to-r from-red-500 to-red-600',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-600',
    indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-600'
  }
  return colorMap[props.color]
})
</script>