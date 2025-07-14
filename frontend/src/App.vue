<template>
  <div id="app" class="min-h-screen bg-white">
    <!-- Navigation Header -->
    <AppHeader />
    
    <!-- Main Content Area -->
    <main class="relative">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <!-- Footer -->
    <AppFooter />
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useChannelStore } from '@/stores/channel'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

const channelStore = useChannelStore()
const route = useRoute()
const { t, locale } = useI18n()

// Watch for route changes and update page title
watch(
  () => route.meta.titleKey,
  (titleKey) => {
    if (titleKey) {
      document.title = t(titleKey)
    } else {
      document.title = t('brand.platform')
    }
  },
  { immediate: true }
)

// Watch for locale changes and update page title
watch(
  locale,
  () => {
    if (route.meta.titleKey) {
      document.title = t(route.meta.titleKey)
    } else {
      document.title = t('brand.platform')
    }
  }
)

onMounted(() => {
  // Initialize data on app mount
  channelStore.fetchChannelData()
})
</script>

<style scoped>
/* Page transition animations */
.page-enter-active, .page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>