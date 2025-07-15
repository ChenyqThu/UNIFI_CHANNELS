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
            :value="formatCurrency(financialData.q1_2025?.total_revenue || 0)"
            :change="revenueGrowth"
            :title="$t('metrics.total_revenue')"
            subtitle="2025 Q1"
            icon="trending_up"
            trend="up"
            color="blue"
          />
          <MetricCard
            :value="formatCurrency(financialData.q1_2025?.enterprise_revenue || 0)"
            :change="enterpriseGrowth"
            :title="$t('metrics.enterprise_revenue')"
            :subtitle="$t('metrics.revenue_percentage', { percentage: 88 })"
            icon="business"
            trend="up"
            color="green"
          />
          <MetricCard
            :value="formatCurrency(financialData.q1_2025?.north_america_revenue || 0)"
            :change="northAmericaGrowth"
            :title="$t('metrics.north_america_revenue')"
            :subtitle="$t('financial.strategic_market')"
            icon="public"
            trend="up"
            color="yellow"
          />
          <MetricCard
            :value="(financialData.q1_2025?.gross_margin || 0) + '%'"
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
        <!-- Enhanced Revenue Analysis -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <h3 class="text-xl font-semibold text-gray-900 mb-6">{{ $t('financial.revenue_composition') }}</h3>
            <RevenueCompositionChart v-if="financialData.q1_2025" :data="financialData" :show-title="false" />
            <div v-else class="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <p class="text-gray-500">{{ $t('common.loading') }}...</p>
            </div>
          </div>
          
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <h3 class="text-xl font-semibold text-gray-900 mb-6">{{ $t('financial.regional_distribution') }}</h3>
            <RegionalRevenueChart v-if="financialData.q1_2025" :data="financialData" :show-title="false" />
            <div v-else class="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <p class="text-gray-500">{{ $t('common.loading') }}...</p>
            </div>
          </div>
        </div>

        <!-- Channel Strategy & Margin Analysis -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div class="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
            <h3 class="text-xl font-semibold text-gray-900 mb-6">{{ $t('financial.channel_strategy') }}</h3>
            
            <!-- Chart Container with fixed height -->
            <div class="flex-1 min-h-[300px] mb-4">
              <ChannelDistributionChart v-if="channelData.distribution_mix" :data="channelData.distribution_mix" :show-title="false" />
              <div v-else class="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                <p class="text-gray-500">{{ $t('common.loading') }}...</p>
              </div>
            </div>
            
            <!-- Insight text container with controlled height -->
            <div class="mt-auto">
              <div class="p-4 bg-blue-50 rounded-lg">
                <h4 class="text-sm font-semibold text-gray-900 mb-2">{{ $t('financial.strategic_insight_title') }}</h4>
                <p class="text-sm text-gray-700 leading-relaxed">{{ $t('financial.channel_strategy_insight') }}</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
            <h3 class="text-xl font-semibold text-gray-900 mb-6">{{ $t('financial.profitability_trends') }}</h3>
            
            <!-- Chart Container with fixed height -->
            <div class="flex-1 min-h-[300px]">
              <MarginTrendChart v-if="financialData.q1_2025" :data="financialData" :show-title="false" />
              <div v-else class="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                <p class="text-gray-500">{{ $t('common.loading') }}...</p>
              </div>
            </div>
            
            <!-- Additional insights for margin trends -->
            <div class="mt-4">
              <div class="p-4 bg-green-50 rounded-lg">
                <h4 class="text-sm font-semibold text-gray-900 mb-2">{{ $t('financial.margin_insight_title') }}</h4>
                <p class="text-sm text-gray-700 leading-relaxed">{{ $t('financial.margin_trend_insight') }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Nine Months Performance Comparison -->
        <div class="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200 p-6 mb-16">
          <h3 class="text-xl font-semibold text-gray-900 mb-6">{{ $t('financial.nine_months_comparison') }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white/80 backdrop-blur-sm rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-blue-600 mb-1">${{ financialData.nine_months_2025?.total_revenue || 0 }}M</div>
              <div class="text-sm text-gray-600 mb-2">{{ $t('financial.nine_months_revenue_2025') }}</div>
              <div class="text-green-600 font-medium text-sm">+{{ nineMonthsRevenueGrowth }}%</div>
            </div>
            <div class="bg-white/80 backdrop-blur-sm rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-green-600 mb-1">${{ financialData.nine_months_2025?.net_income || 0 }}M</div>
              <div class="text-sm text-gray-600 mb-2">{{ $t('financial.nine_months_net_income_2025') }}</div>
              <div class="text-green-600 font-medium text-sm">+{{ nineMonthsNetIncomeGrowth }}%</div>
            </div>
            <div class="bg-white/80 backdrop-blur-sm rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-yellow-600 mb-1">{{ financialData.nine_months_2025?.gross_margin || 0 }}%</div>
              <div class="text-sm text-gray-600 mb-2">{{ $t('financial.nine_months_margin_2025') }}</div>
              <div class="text-green-600 font-medium text-sm">+{{ nineMonthsMarginImprovement }}pp</div>
            </div>
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
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChannelStore } from '@/stores/channel'
import MetricCard from '@/components/ui/MetricCard.vue'
import ChannelDistributionChart from '@/components/charts/ChannelDistributionChart.vue'
import RevenueCompositionChart from '@/components/charts/RevenueCompositionChart.vue'
import RegionalRevenueChart from '@/components/charts/RegionalRevenueChart.vue'
import MarginTrendChart from '@/components/charts/MarginTrendChart.vue'

const { t } = useI18n()
const channelStore = useChannelStore()

const financialData = computed(() => channelStore.financialData)
const channelData = computed(() => channelStore.channelData)
const revenueGrowth = computed(() => channelStore.revenueGrowth)
const enterpriseGrowth = computed(() => channelStore.enterpriseGrowth)
const northAmericaGrowth = computed(() => channelStore.northAmericaGrowth)
const marginImprovement = computed(() => channelStore.marginImprovement)

// Nine months comparison computed properties
// 使用store中的computed属性
const nineMonthsRevenueGrowth = computed(() => channelStore.nineMonthsRevenueGrowth)
const nineMonthsNetIncomeGrowth = computed(() => channelStore.nineMonthsNetIncomeGrowth)
const nineMonthsMarginImprovement = computed(() => channelStore.nineMonthsMarginImprovement)

const financialMetrics = computed(() => {
  if (!financialData.value.q1_2025 || !financialData.value.q3_2024) {
    return []
  }
  
  return [
    {
      label: t('financial.table.total_revenue'),
      current: formatCurrency(financialData.value.q1_2025.total_revenue),
      previous: formatCurrency(financialData.value.q3_2024.total_revenue),
      change: `+${revenueGrowth.value}%`,
      changeClass: 'text-green-600 font-medium'
    },
    {
      label: t('financial.table.enterprise_revenue'),
      current: formatCurrency(financialData.value.q1_2025.enterprise_revenue),
      previous: formatCurrency(financialData.value.q3_2024.enterprise_revenue),
      change: `+${enterpriseGrowth.value}%`,
      changeClass: 'text-green-600 font-medium'
    },
    {
      label: t('financial.table.service_provider_revenue'),
      current: formatCurrency(financialData.value.q1_2025.service_provider_revenue),
      previous: formatCurrency(financialData.value.q3_2024.service_provider_revenue),
      change: t('financial.table.service_provider_change'),
      changeClass: 'text-red-600 font-medium'
    },
    {
      label: t('financial.table.north_america_revenue'),
      current: formatCurrency(financialData.value.q1_2025.north_america_revenue),
      previous: formatCurrency(financialData.value.q3_2024.north_america_revenue),
      change: `+${northAmericaGrowth.value}%`,
      changeClass: 'text-green-600 font-medium'
    },
    {
      label: t('financial.table.gross_profit'),
      current: formatCurrency(financialData.value.q1_2025.gross_profit),
      previous: formatCurrency(financialData.value.q3_2024.gross_profit),
      change: t('financial.table.gross_profit_change'),
      changeClass: 'text-green-600 font-medium'
    },
    {
      label: t('financial.table.gross_margin'),
      current: `${financialData.value.q1_2025.gross_margin}%`,
      previous: `${financialData.value.q3_2024.gross_margin}%`,
      change: t('financial.table.margin_improvement', { points: marginImprovement.value }),
      changeClass: 'text-green-600 font-medium'
    }
  ]
})

const formatCurrency = (value) => {
  return `$${value}M`
}

// 组件挂载时加载财报数据
onMounted(async () => {
  try {
    console.log('💰 FinancialOverview: 开始加载财报数据...')
    await channelStore.fetchFinancialData()
    console.log('✅ FinancialOverview: 财报数据加载完成')
  } catch (error) {
    console.error('❌ FinancialOverview: 财报数据加载失败:', error)
    // 数据加载失败时，组件仍可正常显示（使用默认值）
  }
})
</script>