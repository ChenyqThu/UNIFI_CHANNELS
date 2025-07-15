<template>
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <section class="bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-8">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {{ $t('distribution.title') }}
          </h1>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {{ $t('distribution.subtitle') }}
          </p>
          
          <!-- Distribution Statistics Banner -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
            <div class="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200/60 px-4 py-3 shadow-sm hover:shadow-md transition-all duration-200">
              <div class="flex items-center justify-center space-x-2">
                <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span class="material-icons text-white text-sm">store</span>
                </div>
                <div class="text-left">
                  <p class="text-lg font-bold text-gray-900 leading-tight">{{ resellerData.totalCount || 0 }}</p>
                  <p class="text-xs text-gray-600 leading-tight">{{ $t('metrics.total_distributors') }}</p>
                </div>
              </div>
            </div>
            
            <div class="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200/60 px-4 py-3 shadow-sm hover:shadow-md transition-all duration-200">
              <div class="flex items-center justify-center space-x-2">
                <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span class="material-icons text-white text-sm">emoji_events</span>
                </div>
                <div class="text-left">
                  <p class="text-lg font-bold text-gray-900 leading-tight">{{ resellerData.masterDistributors || 0 }}</p>
                  <p class="text-xs text-gray-600 leading-tight">{{ $t('metrics.master_distributors') }}</p>
                </div>
              </div>
            </div>
            
            <div class="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200/60 px-4 py-3 shadow-sm hover:shadow-md transition-all duration-200">
              <div class="flex items-center justify-center space-x-2">
                <div class="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <span class="material-icons text-white text-sm">group</span>
                </div>
                <div class="text-left">
                  <p class="text-lg font-bold text-gray-900 leading-tight">{{ resellerData.authorizedResellers || 0 }}</p>
                  <p class="text-xs text-gray-600 leading-tight">{{ $t('metrics.authorized_resellers') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Global Distributor Map -->
    <section class="py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DistributorMap />
      </div>
    </section>

    <!-- Yearly Channel Development Insights -->
    <section class="py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">{{ $t('distribution.yearly_channel_development') }}</h2>
          <p class="text-lg text-gray-600">{{ $t('distribution.channel_insights_description') }}</p>
        </div>

        <YearlyChannelUpdates />
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
import YearlyChannelUpdates from '@/components/charts/YearlyChannelUpdates.vue'

const { } = useI18n()
const channelStore = useChannelStore()
const distributionData = computed(() => channelStore.distributionData)
const resellerData = computed(() => channelStore.resellerData)

onMounted(() => {
  channelStore.fetchResellerData()
})
</script>