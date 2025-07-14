<template>
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <section class="bg-gradient-to-br from-green-50 via-white to-emerald-50 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {{ $t('distribution.title') }}
          </h1>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            {{ $t('distribution.subtitle') }}
          </p>
        </div>
      </div>
    </section>

    <!-- Global Distributor Map -->
    <section class="py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DistributorMap />
      </div>
    </section>

    <!-- Top Countries Analysis -->
    <section class="py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">{{ $t('distribution.key_countries') }}</h2>
          <p class="text-lg text-gray-600">{{ $t('distribution.database_analysis') }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div v-for="country in resellerData.topCountries.slice(0, 5)" :key="country.name"
               class="bg-white rounded-lg border border-gray-200 p-4 text-center hover:shadow-md transition-all">
            <div class="text-2xl font-bold text-gray-900 mb-1">{{ country.count }}</div>
            <div class="text-sm font-medium text-gray-700 mb-1">{{ country.name }}</div>
            <div class="text-xs text-green-600">+{{ country.growth }}%</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Key Distributors Grid -->
    <section class="py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">{{ $t('distribution.key_distributors') }}</h2>
          <p class="text-lg text-gray-600">{{ $t('distribution.strategic_partners') }}</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div v-for="distributor in distributionData.us_distributors" :key="distributor.name"
               class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-4">
                <span class="material-icons text-white">business</span>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-900">{{ distributor.name }}</h3>
                <p class="text-sm text-green-600">{{ distributor.value_proposition }}</p>
              </div>
            </div>
            
            <div class="space-y-3">
              <div v-if="distributor.customers">
                <span class="text-sm font-medium text-gray-700">{{ $t('distribution.customer_scale') }}</span>
                <span class="text-sm text-gray-600">{{ distributor.customers }}</span>
              </div>
              <div v-if="distributor.services">
                <span class="text-sm font-medium text-gray-700">{{ $t('distribution.core_services') }}</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span v-for="service in distributor.services" :key="service"
                        class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    {{ service }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Real-time Data Integration Section -->
    <section class="py-16 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-xl border border-gray-200 p-8">
          <div class="flex items-center mb-6">
            <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
              <span class="material-icons text-white">database</span>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-gray-900">{{ $t('distribution.database_integration') }}</h3>
              <p class="text-sm text-gray-600">{{ $t('distribution.realtime_sync') }}</p>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center p-4 bg-green-50 rounded-lg">
              <div class="text-2xl font-bold text-green-600 mb-1">{{ resellerData.totalCount }}</div>
              <div class="text-sm text-gray-700">{{ $t('distribution.distributors_collected') }}</div>
            </div>
            <div class="text-center p-4 bg-blue-50 rounded-lg">
              <div class="text-2xl font-bold text-blue-600 mb-1">8</div>
              <div class="text-sm text-gray-700">{{ $t('distribution.coverage_regions') }}</div>
            </div>
            <div class="text-center p-4 bg-purple-50 rounded-lg">
              <div class="text-2xl font-bold text-purple-600 mb-1">131+</div>
              <div class="text-sm text-gray-700">{{ $t('distribution.countries_regions') }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChannelStore } from '@/stores/channel'
import DistributorMap from '@/components/charts/DistributorMap.vue'

const { t } = useI18n()
const channelStore = useChannelStore()
const distributionData = computed(() => channelStore.distributionData)
const resellerData = computed(() => channelStore.resellerData)

onMounted(() => {
  channelStore.fetchResellerData()
})
</script>