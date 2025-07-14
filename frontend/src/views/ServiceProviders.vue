<template>
  <div class="min-h-screen bg-white">
    <section class="bg-gradient-to-br from-red-50 via-white to-pink-50 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {{ $t('service.title') }}
          </h1>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            {{ $t('service.subtitle') }}
          </p>
        </div>
      </div>
    </section>

    <!-- Service Providers Analysis -->
    <section class="py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">{{ $t('service.key_providers') }}</h2>
          <p class="text-lg text-gray-600">{{ $t('service.partners') }}</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <!-- Progent Analysis -->
          <div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center mr-4">
                <span class="material-icons text-white">engineering</span>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-900">Progent</h3>
                <p class="text-sm text-red-600">{{ $t('service.enterprise_it_consultant') }}</p>
              </div>
            </div>
            
            <div class="space-y-3">
              <div>
                <span class="text-sm font-medium text-gray-700">{{ $t('service.specialty_area') }}</span>
                <span class="text-sm text-gray-600">{{ $t('service.datacenter_security') }}</span>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-700">{{ $t('service.service_features') }}</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">{{ $t('service.enterprise_consulting') }}</span>
                  <span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">{{ $t('service.project_management') }}</span>
                  <span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">{{ $t('service.technical_support') }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Cloudavize Analysis -->
          <div class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mr-4">
                <span class="material-icons text-white">cloud</span>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-900">Cloudavize</h3>
                <p class="text-sm text-pink-600">{{ $t('service.cloud_network_expert') }}</p>
              </div>
            </div>
            
            <div class="space-y-3">
              <div>
                <span class="text-sm font-medium text-gray-700">{{ $t('service.specialty_area') }}</span>
                <span class="text-sm text-gray-600">{{ $t('service.cloud_migration_optimization') }}</span>
              </div>
              <div>
                <span class="text-sm font-medium text-gray-700">{{ $t('service.service_features') }}</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span class="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded">{{ $t('service.cloud_strategy') }}</span>
                  <span class="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded">{{ $t('service.network_design') }}</span>
                  <span class="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded">{{ $t('service.operational_support') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Service Layer Challenges -->
        <div class="bg-gray-50 rounded-xl p-8">
          <h3 class="text-2xl font-bold text-gray-900 mb-6">{{ $t('service.service_layer_challenges') }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center">
              <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="material-icons text-red-600">support</span>
              </div>
              <h4 class="text-lg font-semibold text-gray-900 mb-2">{{ $t('service.lack_tech_support') }}</h4>
              <p class="text-sm text-gray-600">{{ $t('service.no_official_enterprise_support') }}</p>
            </div>
            <div class="text-center">
              <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="material-icons text-yellow-600">inventory</span>
              </div>
              <h4 class="text-lg font-semibold text-gray-900 mb-2">{{ $t('service.low_inventory_predictability') }}</h4>
              <p class="text-sm text-gray-600">{{ $t('service.opaque_supply_chain') }}</p>
            </div>
            <div class="text-center">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="material-icons text-blue-600">school</span>
              </div>
              <h4 class="text-lg font-semibold text-gray-900 mb-2">{{ $t('service.limited_training_resources') }}</h4>
              <p class="text-sm text-gray-600">{{ $t('service.lack_systematic_certification') }}</p>
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