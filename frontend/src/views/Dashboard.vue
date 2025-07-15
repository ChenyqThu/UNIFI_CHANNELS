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
          
          <!-- Loading indicator -->
          <div v-if="channelStore.loading" class="mt-4">
            <div class="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
              <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ $t('common.loading') }}...
            </div>
          </div>
          
          <!-- Error indicator -->
          <div v-if="channelStore.error" class="mt-4">
            <div class="inline-flex items-center px-4 py-2 bg-red-50 text-red-700 rounded-lg">
              <span class="material-icons mr-2">error</span>
              {{ $t('common.error') }}: {{ channelStore.error }}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <!-- Total Revenue -->
          <MetricCard
            :value="formatCurrency(financialData.q1_2025?.total_revenue || 0)"
            :change="revenueGrowth"
            :title="$t('metrics.total_revenue')"
            :subtitle="$t('metrics.million_usd')"
            icon="trending_up"
            trend="up"
            color="blue"
          />

          <!-- Enterprise Revenue -->
          <MetricCard
            :value="formatCurrency(financialData.q1_2025?.enterprise_revenue || 0)"
            :change="enterpriseGrowth"
            :title="$t('metrics.enterprise_revenue')"
            :subtitle="$t('metrics.revenue_percentage', { percentage: 88 })"
            icon="business"
            trend="up"
            color="green"
          />

          <!-- North America Revenue -->
          <MetricCard
            :value="formatCurrency(financialData.q1_2025?.north_america_revenue || 0)"
            :change="northAmericaGrowth"
            :title="$t('metrics.north_america_revenue')"
            :subtitle="$t('metrics.revenue_percentage', { percentage: 49 })"
            icon="public"
            trend="up"
            color="yellow"
          />

          <!-- Gross Margin -->
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

        <!-- Channel Distribution Analysis - KEY INSIGHT -->
        <div class="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border-2 border-blue-200 p-6 mb-8">
          <div class="flex items-center mb-4">
            <span class="material-icons text-blue-600 mr-2">insights</span>
            <h3 class="text-xl font-semibold text-gray-900">{{ $t('dashboard.channel_distribution_analysis') }}</h3>
            <span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">{{ $t('badges.key') }}</span>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChannelDistributionChart v-if="channelData.distribution_mix" :data="channelData.distribution_mix" :show-title="false" />
            <div v-else class="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
              <p class="text-gray-500">{{ $t('common.loading') }}...</p>
            </div>
            <div class="flex flex-col justify-center space-y-4">
              <div class="bg-white/80 backdrop-blur-sm rounded-lg p-4">
                <h4 class="text-lg font-semibold text-gray-900 mb-2">{{ $t('dashboard.channel_insights_title') }}</h4>
                <div class="space-y-2 text-sm text-gray-700">
                  <div class="flex items-center space-x-2">
                    <span class="w-3 h-3 bg-blue-500 rounded-full"></span>
                    <span>{{ $t('dashboard.channel_insight_1') }}</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span>{{ $t('dashboard.channel_insight_2') }}</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <span>{{ $t('dashboard.channel_insight_3') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Revenue Composition Analysis -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <h3 class="text-xl font-semibold text-gray-900 mb-6">{{ $t('dashboard.revenue_composition_analysis') }}</h3>
            <RevenueCompositionChart v-if="financialData.q1_2025" :data="financialData" :show-title="false" />
            <div v-else class="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <p class="text-gray-500">{{ $t('common.loading') }}...</p>
            </div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <h3 class="text-xl font-semibold text-gray-900 mb-6">{{ $t('dashboard.regional_revenue_distribution') }}</h3>
            <RegionalRevenueChart v-if="financialData.q1_2025" :data="financialData" :show-title="false" />
            <div v-else class="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <p class="text-gray-500">{{ $t('common.loading') }}...</p>
            </div>
          </div>
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
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChannelStore } from '@/stores/channel'
import MetricCard from '@/components/ui/MetricCard.vue'
import InsightCard from '@/components/ui/InsightCard.vue'
import NavigationCard from '@/components/ui/NavigationCard.vue'
import RevenueChart from '@/components/charts/RevenueChart.vue'
import ChannelDistributionChart from '@/components/charts/ChannelDistributionChart.vue'
import RevenueCompositionChart from '@/components/charts/RevenueCompositionChart.vue'
import RegionalRevenueChart from '@/components/charts/RegionalRevenueChart.vue'

const { t } = useI18n()
const channelStore = useChannelStore()

const financialData = computed(() => channelStore.financialData)
const channelData = computed(() => channelStore.channelData)
const revenueGrowth = computed(() => channelStore.revenueGrowth)
const enterpriseGrowth = computed(() => channelStore.enterpriseGrowth)
const northAmericaGrowth = computed(() => channelStore.northAmericaGrowth)
const marginImprovement = computed(() => channelStore.marginImprovement)

const chartData = computed(() => {
  if (!financialData.value.q1_2025) {
    return {
      labels: [],
      datasets: []
    }
  }
  
  return {
    labels: [t('charts.enterprise_tech'), t('charts.service_provider_tech')],
    datasets: [{
      data: [
        financialData.value.q1_2025.enterprise_revenue,
        financialData.value.q1_2025.service_provider_revenue
      ],
      backgroundColor: ['#4285f4', '#34a853'],
      borderWidth: 0
    }]
  }
})

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

// 组件挂载时加载财报数据
onMounted(async () => {
  try {
    console.log('🏠 Dashboard: 开始加载财报数据...')
    await channelStore.fetchFinancialData()
    console.log('✅ Dashboard: 财报数据加载完成')
  } catch (error) {
    console.error('❌ Dashboard: 财报数据加载失败:', error)
    // 数据加载失败时，组件仍可正常显示（使用默认值）
  }
})
</script>

<style scoped>
.bg-grid-pattern {
  background-image: 
    linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}
</style>