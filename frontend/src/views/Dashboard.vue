<template>
  <div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div class="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div class="text-center animate-slide-up">
          <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            <span class="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              {{ $t('dashboard.title') }}
            </span>
          </h1>
          <p class="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
            {{ $t('dashboard.subtitle') }}
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div class="flex items-center space-x-2 text-sm text-gray-500">
              <span class="material-icons text-green-500">verified</span>
              <span>{{ $t('dashboard.based_on_data') }}</span>
            </div>
            <div class="hidden sm:block w-1 h-1 bg-gray-300 rounded-full"></div>
            <div class="flex items-center space-x-2 text-sm text-gray-500">
              <span class="material-icons text-blue-500">analytics</span>
              <span>{{ $t('dashboard.multi_dimension') }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Key Metrics Overview -->
    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">{{ $t('dashboard.key_metrics') }}</h2>
          <p class="text-lg text-gray-600">{{ $t('dashboard.record_performance') }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <!-- Total Revenue -->
          <MetricCard
            :value="formatCurrency(financialData.q3_2025.total_revenue)"
            :change="revenueGrowth"
            :title="$t('metrics.total_revenue')"
            :subtitle="$t('metrics.million_usd')"
            icon="trending_up"
            trend="up"
            color="blue"
          />

          <!-- Enterprise Revenue -->
          <MetricCard
            :value="formatCurrency(financialData.q3_2025.enterprise_revenue)"
            :change="enterpriseGrowth"
            :title="$t('metrics.enterprise_revenue')"
            :subtitle="$t('metrics.revenue_percentage', { percentage: 88 })"
            icon="business"
            trend="up"
            color="green"
          />

          <!-- North America Revenue -->
          <MetricCard
            :value="formatCurrency(financialData.q3_2025.north_america_revenue)"
            :change="northAmericaGrowth"
            :title="$t('metrics.north_america_revenue')"
            :subtitle="$t('metrics.revenue_percentage', { percentage: 49 })"
            icon="public"
            trend="up"
            color="yellow"
          />

          <!-- Gross Margin -->
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

        <!-- Revenue Composition Chart -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h3 class="text-xl font-semibold text-gray-900 mb-6">{{ $t('dashboard.revenue_composition_analysis') }}</h3>
          <RevenueChart :data="chartData" />
        </div>
      </div>
    </section>

    <!-- Quick Insights -->
    <section class="py-16 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">{{ $t('dashboard.quick_insights') }}</h2>
          <p class="text-lg text-gray-600">{{ $t('dashboard.key_findings') }}</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Market Dominance -->
          <InsightCard
            :title="$t('dashboard.insights.market_dominance.title')"
            icon="emoji_events"
            color="yellow"
            :insights="[
              $t('dashboard.insights.market_dominance.insight1'),
              $t('dashboard.insights.market_dominance.insight2'),
              $t('dashboard.insights.market_dominance.insight3')
            ]"
          />

          <!-- Channel Challenges -->
          <InsightCard
            :title="$t('dashboard.insights.channel_challenges.title')"
            icon="warning"
            color="red"
            :insights="[
              $t('dashboard.insights.channel_challenges.insight1'),
              $t('dashboard.insights.channel_challenges.insight2'),
              $t('dashboard.insights.channel_challenges.insight3')
            ]"
          />

          <!-- Strategic Opportunities -->
          <InsightCard
            :title="$t('dashboard.insights.strategic_opportunities.title')"
            icon="lightbulb"
            color="green"
            :insights="[
              $t('dashboard.insights.strategic_opportunities.insight1'),
              $t('dashboard.insights.strategic_opportunities.insight2'),
              $t('dashboard.insights.strategic_opportunities.insight3')
            ]"
          />
        </div>
      </div>
    </section>

    <!-- Navigation Grid -->
    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">{{ $t('dashboard.deep_analysis') }}</h2>
          <p class="text-lg text-gray-600">{{ $t('dashboard.select_module') }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NavigationCard
            v-for="module in analysisModules"
            :key="module.route"
            :title="module.title"
            :description="module.description"
            :icon="module.icon"
            :color="module.color"
            :route="module.route"
            :badge="module.badge"
          />
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
import InsightCard from '@/components/ui/InsightCard.vue'
import NavigationCard from '@/components/ui/NavigationCard.vue'
import RevenueChart from '@/components/charts/RevenueChart.vue'

const { t } = useI18n()
const channelStore = useChannelStore()

const financialData = computed(() => channelStore.financialData)
const revenueGrowth = computed(() => channelStore.revenueGrowth)
const enterpriseGrowth = computed(() => channelStore.enterpriseGrowth)
const northAmericaGrowth = computed(() => channelStore.northAmericaGrowth)
const marginImprovement = computed(() => channelStore.marginImprovement)

const chartData = computed(() => ({
  labels: [t('charts.enterprise_tech'), t('charts.service_provider_tech')],
  datasets: [{
    data: [
      financialData.value.q3_2025.enterprise_revenue,
      financialData.value.q3_2025.service_provider_revenue
    ],
    backgroundColor: ['#4285f4', '#34a853'],
    borderWidth: 0
  }]
}))

const analysisModules = computed(() => [
  {
    title: t('dashboard.modules.financial_overview.title'),
    description: t('dashboard.modules.financial_overview.description'),
    icon: 'trending_up',
    color: 'blue',
    route: '/financial-overview',
    badge: t('badges.core')
  },
  {
    title: t('dashboard.modules.distribution_network.title'),
    description: t('dashboard.modules.distribution_network.description'),
    icon: 'hub',
    color: 'green',
    route: '/distribution-network',
    badge: t('badges.key')
  },
  {
    title: t('dashboard.modules.reseller_analysis.title'),
    description: t('dashboard.modules.reseller_analysis.description'),
    icon: 'store',
    color: 'yellow',
    route: '/reseller-analysis',
    badge: null
  },
  {
    title: t('dashboard.modules.service_providers.title'),
    description: t('dashboard.modules.service_providers.description'),
    icon: 'engineering',
    color: 'red',
    route: '/service-providers',
    badge: t('badges.critical')
  },
  {
    title: t('dashboard.modules.strategic_analysis.title'),
    description: t('dashboard.modules.strategic_analysis.description'),
    icon: 'psychology',
    color: 'purple',
    route: '/strategic-analysis',
    badge: t('badges.strategic')
  },
  {
    title: t('dashboard.modules.competitive_intel.title'),
    description: t('dashboard.modules.competitive_intel.description'),
    icon: 'visibility',
    color: 'indigo',
    route: '/competitive-intel',
    badge: t('badges.intelligence')
  }
])

const formatCurrency = (value) => {
  return `$${value}M`
}
</script>

<style scoped>
.bg-grid-pattern {
  background-image: 
    linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}
</style>