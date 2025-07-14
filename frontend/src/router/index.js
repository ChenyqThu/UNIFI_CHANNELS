import { createRouter, createWebHistory } from 'vue-router'
import { useI18n } from 'vue-i18n'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { titleKey: 'nav.dashboard' }
  },
  {
    path: '/financial-overview',
    name: 'FinancialOverview',
    component: () => import('@/views/FinancialOverview.vue'),
    meta: { titleKey: 'nav.financial_overview' }
  },
  {
    path: '/distribution-network',
    name: 'DistributionNetwork',
    component: () => import('@/views/DistributionNetwork.vue'),
    meta: { titleKey: 'nav.distribution_network' }
  },
  {
    path: '/reseller-analysis',
    name: 'ResellerAnalysis',
    component: () => import('@/views/ResellerAnalysis.vue'),
    meta: { titleKey: 'nav.reseller_analysis' }
  },
  {
    path: '/service-providers',
    name: 'ServiceProviders',
    component: () => import('@/views/ServiceProviders.vue'),
    meta: { titleKey: 'nav.service_providers' }
  },
  {
    path: '/strategic-analysis',
    name: 'StrategicAnalysis',
    component: () => import('@/views/StrategicAnalysis.vue'),
    meta: { titleKey: 'nav.strategic_analysis' }
  },
  {
    path: '/competitive-intel',
    name: 'CompetitiveIntel',
    component: () => import('@/views/CompetitiveIntel.vue'),
    meta: { titleKey: 'nav.competitive_intel' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Global navigation guard for title updates
router.beforeEach((to, from, next) => {
  // We'll handle title updates in the main app since we need access to i18n context
  next()
})

export default router