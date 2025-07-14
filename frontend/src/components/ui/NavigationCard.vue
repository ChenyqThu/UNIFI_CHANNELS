<template>
  <router-link 
    :to="route" 
    class="group block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300 transform hover:-translate-y-1"
  >
    <div class="flex items-center justify-between mb-4">
      <div :class="iconClasses" class="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <span class="material-icons text-white text-lg">{{ icon }}</span>
      </div>
      <div v-if="badge" :class="badgeClasses" class="px-2 py-1 rounded-full text-xs font-medium">
        {{ badge }}
      </div>
    </div>
    
    <h3 class="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
      {{ title }}
    </h3>
    <p class="text-sm text-gray-600 mb-4 leading-relaxed">
      {{ description }}
    </p>
    
    <div class="flex items-center text-sm font-medium text-gray-400 group-hover:text-gray-600 transition-colors">
      <span>{{ $t('common.view_details') }}</span>
      <span class="material-icons text-sm ml-1 group-hover:translate-x-1 transition-transform duration-300">
        arrow_forward
      </span>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
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
  route: {
    type: String,
    required: true
  },
  badge: {
    type: String,
    default: null
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

const badgeClasses = computed(() => {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800',
    indigo: 'bg-indigo-100 text-indigo-800'
  }
  return colorMap[props.color]
})
</script>