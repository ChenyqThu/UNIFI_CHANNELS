<template>
  <div class="min-h-screen bg-white">
    <section class="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {{ $t('competitive.title') }}
          </h1>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            {{ $t('competitive.subtitle') }}
          </p>
        </div>
      </div>
    </section>

    <!-- Competitive Analysis -->
    <section class="py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div v-for="competitor in competitiveData" :key="competitor.competitor"
               class="bg-white rounded-xl border border-gray-200 p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">{{ competitor.competitor }}</h3>
            <div class="space-y-4">
              <div>
                <span class="text-sm font-medium text-gray-700">{{ $t('competitive.market_position') }}</span>
                <span class="text-sm text-gray-600 ml-2">{{ competitor.market_position }}</span>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-700">{{ $t('competitive.threat_level') }}</span>
                <span :class="getThreatClass(competitor.threat_level)" 
                      class="text-sm px-2 py-1 rounded ml-2">
                  {{ t(`strategic.${competitor.threat_level}_risk`) }}
                </span>
              </div>
              <div v-if="competitor.strengths && competitor.strengths.length > 0">
                <span class="text-sm font-medium text-gray-700 block mb-2">{{ $t('analysis.strengths') }}</span>
                <ul class="text-sm text-gray-600 space-y-1">
                  <li v-for="strength in competitor.strengths" :key="strength" class="flex items-start">
                    <span class="material-icons text-green-500 text-sm mr-2 mt-0.5">check_circle</span>
                    {{ strength }}
                  </li>
                </ul>
              </div>
              <div v-if="competitor.opportunity">
                <span class="text-sm font-medium text-gray-700 block mb-1">{{ $t('analysis.opportunities') }}</span>
                <p class="text-sm text-gray-600">{{ competitor.opportunity }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChannelStore } from '@/stores/channel'

const { t } = useI18n()
const channelStore = useChannelStore()
const competitiveData = computed(() => 
  channelStore.competitiveData.map(competitor => ({
    ...competitor,
    market_position: competitor.market_position_key ? t(`competitive.${competitor.market_position_key}`) : '',
    opportunity: competitor.opportunity_key ? t(`competitive.${competitor.opportunity_key}`) : '',
    strengths: competitor.strengths_keys?.map(key => t(`competitive.${key}`)) || []
  }))
)

const getThreatClass = (level) => {
  const classes = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  }
  return classes[level] || 'bg-gray-100 text-gray-800'
}
</script>