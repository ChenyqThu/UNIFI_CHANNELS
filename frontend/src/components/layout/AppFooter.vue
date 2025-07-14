<template>
  <footer class="bg-gray-50 border-t border-gray-200 mt-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Brand Info -->
        <div>
          <div class="flex items-center space-x-2 mb-4">
            <div class="w-6 h-6 bg-gradient-to-r from-google-blue to-google-green rounded flex items-center justify-center">
              <span class="material-icons text-white text-xs">analytics</span>
            </div>
            <span class="font-semibold text-gray-900">{{ $t('brand.name') }}</span>
          </div>
          <p class="text-sm text-gray-600 mb-4">
            {{ $t('brand.description') }}
          </p>
          <div class="flex space-x-4">
            <span class="text-xs text-gray-500">{{ $t('brand.copyright') }}</span>
          </div>
        </div>

        <!-- Quick Links -->
        <div>
          <h3 class="font-medium text-gray-900 mb-4">{{ $t('footer.analysis_modules') }}</h3>
          <ul class="space-y-2">
            <li>
              <router-link to="/financial-overview" class="text-sm text-gray-600 hover:text-google-blue transition-colors">
                {{ $t('footer.financial_analysis') }}
              </router-link>
            </li>
            <li>
              <router-link to="/distribution-network" class="text-sm text-gray-600 hover:text-google-blue transition-colors">
                {{ $t('footer.distribution_structure') }}
              </router-link>
            </li>
            <li>
              <router-link to="/strategic-analysis" class="text-sm text-gray-600 hover:text-google-blue transition-colors">
                {{ $t('footer.swot_analysis') }}
              </router-link>
            </li>
            <li>
              <router-link to="/competitive-intel" class="text-sm text-gray-600 hover:text-google-blue transition-colors">
                {{ $t('footer.competitive_intel') }}
              </router-link>
            </li>
          </ul>
        </div>

        <!-- System Info -->
        <div>
          <h3 class="font-medium text-gray-900 mb-4">{{ $t('footer.system_info') }}</h3>
          <ul class="space-y-2 text-sm text-gray-600">
            <li class="flex items-center">
              <span class="material-icons text-xs mr-2 text-green-500">check_circle</span>
              {{ $t('footer.data_source') }}
            </li>
            <li class="flex items-center">
              <span class="material-icons text-xs mr-2 text-green-500">update</span>
              {{ $t('footer.last_updated') }}: {{ lastUpdated }}
            </li>
            <li class="flex items-center">
              <span class="material-icons text-xs mr-2 text-blue-500">api</span>
              {{ $t('footer.integration_status') }}
            </li>
            <li class="flex items-center">
              <span class="material-icons text-xs mr-2 text-yellow-500">security</span>
              {{ $t('footer.data_security') }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="mt-8 pt-6 border-t border-gray-200">
        <div class="flex flex-col sm:flex-row justify-between items-center">
          <p class="text-xs text-gray-500">
            {{ $t('footer.disclaimer') }}
          </p>
          <div class="flex items-center space-x-4 mt-4 sm:mt-0">
            <span class="text-xs text-gray-400">{{ $t('footer.powered_by') }}</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const lastUpdated = computed(() => {
  return new Date().toLocaleDateString(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})
</script>