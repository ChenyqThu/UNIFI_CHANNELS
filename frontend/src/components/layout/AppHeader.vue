<template>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center h-16">
        <!-- Logo and Brand (Left) -->
        <div class="flex items-center space-x-2 flex-shrink-0">
          <div class="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
            <span class="material-icons text-white text-sm">analytics</span>
          </div>
          <div>
            <h1 class="text-lg font-semibold text-gray-900">{{ $t('brand.name') }}</h1>
            <p class="text-xs text-gray-500">{{ $t('brand.platform') }}</p>
          </div>
        </div>

        <!-- Navigation (Center) -->
        <nav class="hidden md:flex items-center justify-center flex-1 space-x-8">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.to"
            class="nav-link"
            :class="{ 'active': $route.name === item.name }"
          >
            <span class="material-icons text-sm mr-1">{{ item.icon }}</span>
            {{ $t(item.label) }}
          </router-link>
        </nav>

        <!-- Actions (Right) -->
        <div class="flex items-center flex-shrink-0">
          <!-- Language Switcher -->
          <button
            @click="toggleLanguage"
            class="flex items-center justify-center w-8 h-8 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            :title="$t('language.switch')"
          >
            <span class="font-medium">{{ currentLanguageShort }}</span>
          </button>

          <!-- Mobile menu button -->
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 ml-2"
          >
            <span class="material-icons">
              {{ mobileMenuOpen ? 'close' : 'menu' }}
            </span>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <div v-if="mobileMenuOpen" class="md:hidden py-4 border-t border-gray-200">
        <div class="space-y-2">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.to"
            @click="mobileMenuOpen = false"
            class="mobile-nav-link"
            :class="{ 'active': $route.name === item.name }"
          >
            <span class="material-icons text-sm mr-2">{{ item.icon }}</span>
            {{ $t(item.label) }}
          </router-link>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale, t } = useI18n()

const mobileMenuOpen = ref(false)

const navigation = [
  { name: 'Dashboard', to: '/', icon: 'dashboard', label: 'nav.dashboard' },
  { name: 'FinancialOverview', to: '/financial-overview', icon: 'trending_up', label: 'nav.financial' },
  { name: 'DistributionNetwork', to: '/distribution-network', icon: 'hub', label: 'nav.distribution' },
  { name: 'ResellerAnalysis', to: '/reseller-analysis', icon: 'store', label: 'nav.reseller' },
  { name: 'ServiceProviders', to: '/service-providers', icon: 'engineering', label: 'nav.service' },
  { name: 'StrategicAnalysis', to: '/strategic-analysis', icon: 'psychology', label: 'nav.strategic' },
  { name: 'CompetitiveIntel', to: '/competitive-intel', icon: 'visibility', label: 'nav.competitive' }
]

const currentLanguage = computed(() => {
  return locale.value === 'zh' ? t('language.chinese') : 'EN'
})

const currentLanguageShort = computed(() => {
  return locale.value === 'zh' ? '中' : 'EN'
})

const toggleLanguage = () => {
  locale.value = locale.value === 'zh' ? 'en' : 'zh'
}
</script>

<style scoped>
.nav-link {
  @apply flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors relative;
}

.nav-link.active {
  @apply text-blue-600;
}

.nav-link.active::after {
  content: '';
  @apply absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600;
}

.mobile-nav-link {
  @apply flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors;
}

.mobile-nav-link.active {
  @apply text-blue-600 bg-blue-50;
}
</style>