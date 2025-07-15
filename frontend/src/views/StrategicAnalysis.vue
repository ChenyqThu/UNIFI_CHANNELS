<template>
  <div class="min-h-screen bg-white">
    <!-- Header Section -->
    <section class="bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {{ $t('strategic.title') }}
          </h1>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            {{ $t('strategic.subtitle') }}
          </p>
        </div>
      </div>
    </section>

    <!-- SWOT Analysis Grid -->
    <section class="py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">{{ $t('strategic.swot_analysis') }}</h2>
          <p class="text-lg text-gray-600">{{ $t('strategic.channel_strategy') }}</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <!-- Strengths -->
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-8">
            <div class="flex items-center mb-6">
              <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-4">
                <span class="material-icons text-white text-lg">trending_up</span>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-green-800">{{ $t('analysis.strengths') }} (Strengths)</h3>
                <p class="text-sm text-green-600">{{ $t('strategic.core_competitiveness') }}</p>
              </div>
            </div>
            <ul class="space-y-4">
              <li v-for="(strength, index) in swotData.strengths" :key="index" 
                  class="flex items-start space-x-3">
                <div class="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span class="text-gray-700 leading-relaxed">{{ strength }}</span>
              </li>
            </ul>
          </div>

          <!-- Weaknesses -->
          <div class="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200 p-8">
            <div class="flex items-center mb-6">
              <div class="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center mr-4">
                <span class="material-icons text-white text-lg">trending_down</span>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-red-800">{{ $t('analysis.weaknesses') }} (Weaknesses)</h3>
                <p class="text-sm text-red-600">{{ $t('strategic.internal_weaknesses') }}</p>
              </div>
            </div>
            <ul class="space-y-4">
              <li v-for="(weakness, index) in swotData.weaknesses" :key="index" 
                  class="flex items-start space-x-3">
                <div class="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span class="text-gray-700 leading-relaxed">{{ weakness }}</span>
              </li>
            </ul>
          </div>

          <!-- Opportunities -->
          <div class="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border border-blue-200 p-8">
            <div class="flex items-center mb-6">
              <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-4">
                <span class="material-icons text-white text-lg">lightbulb</span>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-blue-800">{{ $t('analysis.opportunities') }} (Opportunities)</h3>
                <p class="text-sm text-blue-600">{{ $t('strategic.market_opportunities') }}</p>
              </div>
            </div>
            <ul class="space-y-4">
              <li v-for="(opportunity, index) in swotData.opportunities" :key="index" 
                  class="flex items-start space-x-3">
                <div class="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span class="text-gray-700 leading-relaxed">{{ opportunity }}</span>
              </li>
            </ul>
          </div>

          <!-- Threats -->
          <div class="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 p-8">
            <div class="flex items-center mb-6">
              <div class="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center mr-4">
                <span class="material-icons text-white text-lg">warning</span>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-yellow-800">{{ $t('analysis.threats') }} (Threats)</h3>
                <p class="text-sm text-yellow-600">{{ $t('strategic.external_risks') }}</p>
              </div>
            </div>
            <ul class="space-y-4">
              <li v-for="(threat, index) in swotData.threats" :key="index" 
                  class="flex items-start space-x-3">
                <div class="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                <span class="text-gray-700 leading-relaxed">{{ threat }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Strategic Tensions -->
    <section class="py-16 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">{{ $t('strategic.key_strategic_tensions') }}</h2>
          <p class="text-lg text-gray-600">{{ $t('strategic.core_contradictions') }}</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <div class="flex items-center mb-4">
              <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <span class="material-icons text-white text-sm">balance</span>
              </div>
              <h3 class="text-lg font-semibold text-gray-900">{{ $t('strategic.lean_vs_enterprise') }}</h3>
            </div>
            <p class="text-sm text-gray-600 leading-relaxed">
              {{ $t('strategic.lean_vs_enterprise_desc') }}
            </p>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <div class="flex items-center mb-4">
              <div class="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <span class="material-icons text-white text-sm">groups</span>
              </div>
              <h3 class="text-lg font-semibold text-gray-900">{{ $t('strategic.community_vs_professional') }}</h3>
            </div>
            <p class="text-sm text-gray-600 leading-relaxed">
              {{ $t('strategic.community_vs_professional_desc') }}
            </p>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <div class="flex items-center mb-4">
              <div class="w-10 h-10 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                <span class="material-icons text-white text-sm">trending_up</span>
              </div>
              <h3 class="text-lg font-semibold text-gray-900">{{ $t('strategic.growth_vs_stability') }}</h3>
            </div>
            <p class="text-sm text-gray-600 leading-relaxed">
              {{ $t('strategic.growth_vs_stability_desc') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Recommendations -->
    <section class="py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">{{ $t('strategic.forward_analysis') }}</h2>
          <p class="text-lg text-gray-600">{{ $t('strategic.strategic_recommendations') }}</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- For Ubiquiti -->
          <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8">
            <h3 class="text-xl font-bold text-blue-800 mb-6 flex items-center">
              <span class="material-icons mr-2">business</span>
              {{ $t('strategic.for_ubiquiti') }}
            </h3>
            <ul class="space-y-4">
              <li class="flex items-start space-x-3">
                <span class="material-icons text-blue-600 text-base mt-0.5 flex-shrink-0">inventory</span>
                <span class="text-sm text-gray-700 leading-relaxed">{{ $t('strategic.transparent_inventory_policy') }}</span>
              </li>
              <li class="flex items-start space-x-3">
                <span class="material-icons text-blue-600 text-base mt-0.5 flex-shrink-0">verified_user</span>
                <span class="text-sm text-gray-700 leading-relaxed">{{ $t('strategic.unified_warranty_policy') }}</span>
              </li>
              <li class="flex items-start space-x-3">
                <span class="material-icons text-blue-600 text-base mt-0.5 flex-shrink-0">groups</span>
                <span class="text-sm text-gray-700 leading-relaxed">{{ $t('strategic.formal_msp_program') }}</span>
              </li>
            </ul>
          </div>

          <!-- For Competitors -->
          <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8">
            <h3 class="text-xl font-bold text-green-800 mb-6 flex items-center">
              <span class="material-icons mr-2">visibility</span>
              {{ $t('strategic.for_competitors') }}
            </h3>
            <ul class="space-y-4">
              <li class="flex items-start space-x-3">
                <span class="material-icons text-green-600 text-base mt-0.5 flex-shrink-0">gps_fixed</span>
                <span class="text-sm text-gray-700 leading-relaxed">{{ $t('strategic.attack_channel_weaknesses') }}</span>
              </li>
              <li class="flex items-start space-x-3">
                <span class="material-icons text-green-600 text-base mt-0.5 flex-shrink-0">campaign</span>
                <span class="text-sm text-gray-700 leading-relaxed">{{ $t('strategic.promote_channel_stability') }}</span>
              </li>
              <li class="flex items-start space-x-3">
                <span class="material-icons text-green-600 text-base mt-0.5 flex-shrink-0">handshake</span>
                <span class="text-sm text-gray-700 leading-relaxed">{{ $t('strategic.reliable_inventory_support') }}</span>
              </li>
            </ul>
          </div>

          <!-- For Channel Partners -->
          <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-8">
            <h3 class="text-xl font-bold text-yellow-800 mb-6 flex items-center">
              <span class="material-icons mr-2">store</span>
              {{ $t('strategic.for_channel_partners') }}
            </h3>
            <ul class="space-y-4">
              <li class="flex items-start space-x-3">
                <span class="material-icons text-yellow-600 text-base mt-0.5 flex-shrink-0">category</span>
                <span class="text-sm text-gray-700 leading-relaxed">{{ $t('strategic.diversify_product_portfolio') }}</span>
              </li>
              <li class="flex items-start space-x-3">
                <span class="material-icons text-yellow-600 text-base mt-0.5 flex-shrink-0">visibility</span>
                <span class="text-sm text-gray-700 leading-relaxed">{{ $t('strategic.transparent_customer_communication') }}</span>
              </li>
              <li class="flex items-start space-x-3">
                <span class="material-icons text-yellow-600 text-base mt-0.5 flex-shrink-0">manage_accounts</span>
                <span class="text-sm text-gray-700 leading-relaxed">{{ $t('strategic.manage_customer_expectations') }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Risk Assessment -->
    <section class="py-16 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">{{ $t('strategic.risk_assessment_matrix') }}</h2>
          <p class="text-lg text-gray-600">{{ $t('strategic.impact_probability_assessment') }}</p>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-8">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div v-for="(risk, index) in riskAssessment" :key="index" 
                 class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-semibold text-gray-900">{{ risk.title }}</h4>
                <span :class="risk.levelClass" class="px-2 py-1 rounded text-xs font-medium">
                  {{ risk.level }}
                </span>
              </div>
              <p class="text-sm text-gray-600 mb-3">{{ risk.description }}</p>
              <div class="flex justify-between text-xs text-gray-500">
                <span>{{ $t('strategic.impact') }}: {{ risk.impact }}</span>
                <span>{{ $t('strategic.probability') }}: {{ risk.probability }}</span>
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
const swotData = computed(() => {
  const storeData = channelStore.swotAnalysis
  return {
    strengths: storeData.strengths_keys?.map(key => t(`channel_data.swot.${key}`)) || [],
    weaknesses: storeData.weaknesses_keys?.map(key => t(`channel_data.swot.${key}`)) || [],
    opportunities: storeData.opportunities_keys?.map(key => t(`channel_data.swot.${key}`)) || [],
    threats: storeData.threats_keys?.map(key => t(`channel_data.swot.${key}`)) || []
  }
})

const riskAssessment = computed(() => [
  {
    title: t('strategic.channel_partner_loss'),
    description: t('strategic.channel_partner_loss_desc'),
    level: t('strategic.high_risk'),
    levelClass: 'bg-red-100 text-red-800',
    impact: t('strategic.high'),
    probability: t('strategic.medium')
  },
  {
    title: t('strategic.inventory_management_crisis'),
    description: t('strategic.inventory_management_crisis_desc'),
    level: t('strategic.high_risk'),
    levelClass: 'bg-red-100 text-red-800',
    impact: t('strategic.high'),
    probability: t('strategic.high')
  },
  {
    title: t('strategic.enterprise_market_access'),
    description: t('strategic.enterprise_market_access_desc'),
    level: t('strategic.medium_risk'),
    levelClass: 'bg-yellow-100 text-yellow-800',
    impact: t('strategic.medium'),
    probability: t('strategic.medium')
  },
  {
    title: t('strategic.brand_reputation_damage'),
    description: t('strategic.brand_reputation_damage_desc'),
    level: t('strategic.medium_risk'),
    levelClass: 'bg-yellow-100 text-yellow-800',
    impact: t('strategic.medium'),
    probability: t('strategic.low')
  }
])
</script>