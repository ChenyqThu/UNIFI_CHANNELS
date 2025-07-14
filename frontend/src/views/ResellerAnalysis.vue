<template>
  <div class="min-h-screen bg-white">
    <section class="bg-gradient-to-br from-yellow-50 via-white to-orange-50 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {{ $t('reseller.title') }}
          </h1>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            {{ $t('reseller.subtitle') }}
          </p>
        </div>
      </div>
    </section>

    <!-- B&H Photo Video Case Study -->
    <section class="py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">{{ $t('reseller.case_study') }}</h2>
          <p class="text-lg text-gray-600">{{ $t('reseller.transformation') }}</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <!-- B&H Analysis -->
          <div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-4">
                <span class="material-icons text-white">store</span>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-900">B&H Photo Video</h3>
                <p class="text-sm text-yellow-600">{{ $t('reseller.traditional_retailer') }}</p>
              </div>
            </div>
            
            <div class="space-y-3">
              <div>
                <span class="text-sm font-medium text-gray-700">{{ $t('reseller.business_model') }}</span>
                <span class="text-sm text-gray-600">{{ $t('reseller.online_offline_retail') }}</span>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-700">{{ $t('reseller.product_positioning') }}</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">{{ $t('reseller.consumer_grade') }}</span>
                  <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">SOHO</span>
                  <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">{{ $t('reseller.small_business') }}</span>
                </div>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-700">{{ $t('reseller.competitive_advantage') }}</span>
                <span class="text-sm text-gray-600">{{ $t('reseller.brand_inventory') }}</span>
              </div>
            </div>
          </div>

          <!-- Channel Dynamics -->
          <div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-4">
                <span class="material-icons text-white">trending_down</span>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-900">{{ $t('reseller.channel_pressure') }}</h3>
                <p class="text-sm text-orange-600">{{ $t('reseller.d2c_impact') }}</p>
              </div>
            </div>
            
            <div class="space-y-3">
              <div>
                <span class="text-sm font-medium text-gray-700">{{ $t('reseller.price_competition') }}</span>
                <span class="text-sm text-gray-600">{{ $t('reseller.price_transparency') }}</span>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-700">{{ $t('reseller.inventory_risk') }}</span>
                <span class="text-sm text-gray-600">{{ $t('reseller.inventory_pressure') }}</span>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-700">{{ $t('reseller.service_gap') }}</span>
                <span class="text-sm text-gray-600">{{ $t('reseller.limited_tech_support') }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Reseller Ecosystem Challenges -->
        <div class="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-8">
          <h3 class="text-2xl font-bold text-gray-900 mb-6">{{ $t('reseller.ecosystem_challenges') }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white rounded-lg p-6 text-center">
              <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="material-icons text-red-600">price_change</span>
              </div>
              <h4 class="text-lg font-semibold text-gray-900 mb-2">{{ $t('reseller.price_transparency_impact') }}</h4>
              <p class="text-sm text-gray-600">{{ $t('reseller.margin_compression') }}</p>
            </div>
            <div class="bg-white rounded-lg p-6 text-center">
              <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="material-icons text-yellow-600">inventory_2</span>
              </div>
              <h4 class="text-lg font-semibold text-gray-900 mb-2">{{ $t('reseller.inventory_management') }}</h4>
              <p class="text-sm text-gray-600">{{ $t('reseller.complex_product_lines') }}</p>
            </div>
            <div class="bg-white rounded-lg p-6 text-center">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="material-icons text-blue-600">support_agent</span>
              </div>
              <h4 class="text-lg font-semibold text-gray-900 mb-2">{{ $t('reseller.tech_support_gap') }}</h4>
              <p class="text-sm text-gray-600">{{ $t('reseller.professional_service_difficulty') }}</p>
            </div>
          </div>
        </div>

        <!-- Strategic Recommendations -->
        <div class="mt-12">
          <h3 class="text-2xl font-bold text-gray-900 mb-6 text-center">{{ $t('reseller.transformation_recommendations') }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white rounded-xl border-2 border-green-200 p-6">
              <div class="flex items-center mb-4">
                <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <span class="material-icons text-white text-sm">add</span>
                </div>
                <h4 class="text-lg font-semibold text-gray-900">{{ $t('reseller.value_added_services') }}</h4>
              </div>
              <ul class="text-sm text-gray-600 space-y-2">
                <li>{{ $t('reseller.site_survey_design') }}</li>
                <li>{{ $t('reseller.installation_training') }}</li>
                <li>{{ $t('reseller.maintenance_support_team') }}</li>
              </ul>
            </div>
            <div class="bg-white rounded-xl border-2 border-blue-200 p-6">
              <div class="flex items-center mb-4">
                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  <span class="material-icons text-white text-sm">groups</span>
                </div>
                <h4 class="text-lg font-semibold text-gray-900">{{ $t('reseller.customer_segmentation') }}</h4>
              </div>
              <ul class="text-sm text-gray-600 space-y-2">
                <li>{{ $t('reseller.focus_specific_industries') }}</li>
                <li>{{ $t('reseller.develop_industry_solutions') }}</li>
                <li>{{ $t('reseller.build_crm_system') }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>