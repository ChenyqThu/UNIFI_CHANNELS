<template>
  <div class="min-h-screen bg-white">
    <!-- Header Section -->
    <section class="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {{ $t('financial.title') }}
          </h1>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            {{ $t('financial.subtitle') }}
          </p>
        </div>

        <!-- Key Financial Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            :value="formatCurrency(financialData.q3_2025.total_revenue)"
            :change="revenueGrowth"
            :title="$t('metrics.total_revenue')"
            subtitle="2025 Q3"
            icon="trending_up"
            trend="up"
            color="blue"
          />
          <MetricCard
            :value="formatCurrency(financialData.q3_2025.enterprise_revenue)"
            :change="enterpriseGrowth"
            :title="$t('metrics.enterprise_revenue')"
            :subtitle="$t('metrics.revenue_percentage', { percentage: 88 })"
            icon="business"
            trend="up"
            color="green"
          />
          <MetricCard
            :value="formatCurrency(financialData.q3_2025.north_america_revenue)"
            :change="northAmericaGrowth"
            :title="$t('metrics.north_america_revenue')"
            :subtitle="$t('financial.strategic_market')"
            icon="public"
            trend="up"
            color="yellow"
          />
          <MetricCard
            :value="financialData.q3_2025.gross_margin + '%'"
            :change="marginImprovement"
            :title="$t('metrics.gross_margin')"
            :subtitle="$t('metrics.significant_improvement')"
            icon="account_balance"
            trend="up"
            color="red"
          />
        </div>
      </div>
    </section>

    <!-- Financial Analysis -->
    <section class="py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Revenue Breakdown -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <h3 class="text-xl font-semibold text-gray-900 mb-6">{{ $t('financial.revenue_composition') }}</h3>
            <RevenueChart :data="revenueBreakdownData" />
          </div>
          
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <h3 class="text-xl font-semibold text-gray-900 mb-6">{{ $t('financial.regional_distribution') }}</h3>
            <RevenueChart :data="regionalRevenueData" />
          </div>
        </div>

        <!-- Financial Performance Table -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-16">
          <h3 class="text-xl font-semibold text-gray-900 mb-6">{{ $t('financial.key_metrics_comparison') }}</h3>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-3 px-4 font-medium text-gray-900">{{ $t('financial.table.metric') }}</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-900">{{ $t('financial.table.q3_2025') }}</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-900">{{ $t('financial.table.q3_2024') }}</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-900">{{ $t('financial.table.growth') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(metric, index) in financialMetrics" :key="index" class="border-b border-gray-100">
                  <td class="py-3 px-4 font-medium text-gray-900">{{ metric.label }}</td>
                  <td class="py-3 px-4 text-right text-gray-900">{{ metric.current }}</td>
                  <td class="py-3 px-4 text-right text-gray-600">{{ metric.previous }}</td>
                  <td class="py-3 px-4 text-right">
                    <span :class="metric.changeClass">{{ metric.change }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Strategic Insights -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
            <h3 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span class="material-icons mr-2 text-blue-600">insights</span>
              {{ $t('financial.strategic_insights') }}
            </h3>
            <ul class="space-y-3">
              <li class="flex items-start space-x-3">
                <div class="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span class="text-sm text-gray-700">{{ $t('financial.insights.enterprise_dominance.content') }}</span>
              </li>
              <li class="flex items-start space-x-3">
                <div class="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span class="text-sm text-gray-700">{{ $t('financial.insights.regional_concentration.content') }}</span>
              </li>
              <li class="flex items-start space-x-3">
                <div class="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span class="text-sm text-gray-700">{{ $t('financial.insights.margin_expansion.content') }}</span>
              </li>
            </ul>
          </div>

          <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6">
            <h3 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span class="material-icons mr-2 text-yellow-600">warning</span>
              {{ $t('financial.strategic_risks') }}
            </h3>
            <ul class="space-y-3">
              <li class="flex items-start space-x-3">
                <div class="w-2 h-2 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                <span class="text-sm text-gray-700">{{ $t('financial.risks.channel_concentration.content') }}</span>
              </li>
              <li class="flex items-start space-x-3">
                <div class="w-2 h-2 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                <span class="text-sm text-gray-700">{{ $t('financial.risks.distributor_dependency.content') }}</span>
              </li>
              <li class="flex items-start space-x-3">
                <div class="w-2 h-2 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                <span class="text-sm text-gray-700">{{ $t('financial.risks.market_saturation.content') }}</span>
              </li>
            </ul>
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
import MetricCard from '@/components/ui/MetricCard.vue'
import RevenueChart from '@/components/charts/RevenueChart.vue'

const { t } = useI18n()
const channelStore = useChannelStore()

const financialData = computed(() => channelStore.financialData)
const revenueGrowth = computed(() => channelStore.revenueGrowth)
const enterpriseGrowth = computed(() => channelStore.enterpriseGrowth)
const northAmericaGrowth = computed(() => channelStore.northAmericaGrowth)
const marginImprovement = computed(() => channelStore.marginImprovement)

const revenueBreakdownData = computed(() => ({
  labels: [t('metrics.enterprise_revenue'), t('financial.market_segments')],
  datasets: [{
    data: [
      financialData.value.q3_2025.enterprise_revenue,
      financialData.value.q3_2025.service_provider_revenue
    ],
    backgroundColor: ['#4285f4', '#34a853'],
    borderWidth: 0
  }]
}))

const regionalRevenueData = computed(() => ({
  labels: [t('regions.usa'), 'EMEA', t('regions.others')],
  datasets: [{
    data: [
      financialData.value.q3_2025.north_america_revenue,
      financialData.value.q3_2025.emea_revenue,
      financialData.value.q3_2025.total_revenue - financialData.value.q3_2025.north_america_revenue - financialData.value.q3_2025.emea_revenue
    ],
    backgroundColor: ['#fbbc04', '#ea4335', '#9aa0a6'],
    borderWidth: 0
  }]
}))

const financialMetrics = computed(() => [
  {
    label: t('financial.table.total_revenue'),
    current: formatCurrency(financialData.value.q3_2025.total_revenue),
    previous: formatCurrency(financialData.value.q3_2024.total_revenue),
    change: `+${revenueGrowth.value}%`,
    changeClass: 'text-green-600 font-medium'
  },
  {
    label: t('financial.table.enterprise_revenue'),
    current: formatCurrency(financialData.value.q3_2025.enterprise_revenue),
    previous: formatCurrency(financialData.value.q3_2024.enterprise_revenue),
    change: `+${enterpriseGrowth.value}%`,
    changeClass: 'text-green-600 font-medium'
  },
  {
    label: t('financial.table.service_provider_revenue'),
    current: formatCurrency(financialData.value.q3_2025.service_provider_revenue),
    previous: formatCurrency(financialData.value.q3_2024.service_provider_revenue),
    change: t('financial.table.service_provider_change'),
    changeClass: 'text-red-600 font-medium'
  },
  {
    label: t('financial.table.north_america_revenue'),
    current: formatCurrency(financialData.value.q3_2025.north_america_revenue),
    previous: formatCurrency(financialData.value.q3_2024.north_america_revenue),
    change: `+${northAmericaGrowth.value}%`,
    changeClass: 'text-green-600 font-medium'
  },
  {
    label: t('financial.table.gross_profit'),
    current: formatCurrency(financialData.value.q3_2025.gross_profit),
    previous: formatCurrency(financialData.value.q3_2024.gross_profit),
    change: t('financial.table.gross_profit_change'),
    changeClass: 'text-green-600 font-medium'
  },
  {
    label: t('financial.table.gross_margin'),
    current: `${financialData.value.q3_2025.gross_margin}%`,
    previous: `${financialData.value.q3_2024.gross_margin}%`,
    change: t('financial.table.margin_improvement', { points: marginImprovement.value }),
    changeClass: 'text-green-600 font-medium'
  }
])

const formatCurrency = (value) => {
  return `$${value}M`
}
</script>