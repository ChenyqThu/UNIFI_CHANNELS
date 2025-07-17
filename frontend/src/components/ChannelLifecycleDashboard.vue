<template>
  <div class="channel-lifecycle-dashboard">
    <!-- 仪表盘标题 -->
    <div class="dashboard-header">
      <h2 class="text-2xl font-bold text-gray-800 mb-2">
        {{ $t('channelLifecycle.title') }}
      </h2>
      <p class="text-gray-600">{{ $t('channelLifecycle.description') }}</p>
    </div>

    <!-- 健康状态总览 -->
    <div class="health-overview mb-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- 总体健康状态 -->
        <div class="health-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">{{ $t('channelLifecycle.overallHealth') }}</p>
              <p class="text-2xl font-bold" :class="healthStatusClass">
                {{ healthStatus.overall }}
              </p>
            </div>
            <div class="health-icon" :class="healthStatusClass">
              <i :class="healthStatusIcon"></i>
            </div>
          </div>
        </div>

        <!-- 活跃渠道数 -->
        <div class="health-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">{{ $t('channelLifecycle.activeChannels') }}</p>
              <p class="text-2xl font-bold text-green-600">
                {{ healthStatus.activeChannels?.toLocaleString() || 0 }}
              </p>
            </div>
            <div class="health-icon text-green-600">
              <i class="fas fa-check-circle"></i>
            </div>
          </div>
        </div>

        <!-- 平均生命周期 -->
        <div class="health-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">{{ $t('channelLifecycle.averageLifespan') }}</p>
              <p class="text-2xl font-bold text-blue-600">
                {{ Math.round(healthStatus.averageLifespan || 0) }}
                <span class="text-sm">{{ $t('channelLifecycle.days') }}</span>
              </p>
            </div>
            <div class="health-icon text-blue-600">
              <i class="fas fa-clock"></i>
            </div>
          </div>
        </div>

        <!-- 覆盖范围 -->
        <div class="health-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">{{ $t('channelLifecycle.coverage') }}</p>
              <p class="text-2xl font-bold text-purple-600">
                {{ healthStatus.coverage?.regions || 0 }} / {{ healthStatus.coverage?.countries || 0 }}
              </p>
              <p class="text-xs text-gray-500">{{ $t('channelLifecycle.regionsCountries') }}</p>
            </div>
            <div class="health-icon text-purple-600">
              <i class="fas fa-globe"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- 健康状态警告 -->
      <div v-if="healthStatus.alerts?.length > 0" class="mt-6">
        <div class="space-y-2">
          <div
            v-for="alert in healthStatus.alerts"
            :key="alert.type"
            class="alert-item"
            :class="alertClass(alert.severity)"
          >
            <div class="flex items-center">
              <i :class="alertIcon(alert.severity)" class="mr-2"></i>
              <span>{{ alert.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 趋势图表 -->
    <div class="trends-section mb-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 渠道变化趋势 -->
        <div class="chart-card">
          <h3 class="chart-title">{{ $t('channelLifecycle.channelTrends') }}</h3>
          <div class="chart-container">
            <canvas ref="trendsChart" class="chart-canvas"></canvas>
          </div>
        </div>

        <!-- 生命周期分布 -->
        <div class="chart-card">
          <h3 class="chart-title">{{ $t('channelLifecycle.lifecycleDistribution') }}</h3>
          <div class="chart-container">
            <canvas ref="lifecycleChart" class="chart-canvas"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="recent-activity-section mb-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 最近变更 -->
        <div class="activity-card lg:col-span-2">
          <h3 class="activity-title">{{ $t('channelLifecycle.recentChanges') }}</h3>
          <div class="activity-list">
            <div
              v-for="change in recentChanges"
              :key="change.id"
              class="activity-item"
            >
              <div class="activity-icon" :class="changeTypeClass(change.event_type)">
                <i :class="changeTypeIcon(change.event_type)"></i>
              </div>
              <div class="activity-content">
                <p class="activity-title-text">{{ change.distributor_name }}</p>
                <p class="activity-description">
                  {{ getChangeDescription(change) }}
                </p>
                <p class="activity-time">
                  {{ formatTime(change.created_at) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 监控会话 -->
        <div class="activity-card">
          <h3 class="activity-title">{{ $t('channelLifecycle.monitoringSessions') }}</h3>
          <div class="session-list">
            <div
              v-for="session in monitoringSessions"
              :key="session.id"
              class="session-item"
            >
              <div class="session-status" :class="sessionStatusClass(session.status)">
                <i :class="sessionStatusIcon(session.status)"></i>
              </div>
              <div class="session-content">
                <p class="session-title">
                  {{ formatSessionTitle(session) }}
                </p>
                <p class="session-stats">
                  {{ formatSessionStats(session) }}
                </p>
                <p class="session-time">
                  {{ formatTime(session.session_start) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据质量指标 -->
    <div class="data-quality-section mb-8">
      <div class="quality-card">
        <h3 class="quality-title">{{ $t('channelLifecycle.dataQuality') }}</h3>
        
        <div class="quality-score-container">
          <div class="quality-score-circle">
            <div class="quality-score-text">
              <span class="score-value">{{ Math.round(dataQuality.qualityScore || 0) }}</span>
              <span class="score-label">{{ $t('channelLifecycle.qualityScore') }}</span>
            </div>
          </div>
          
          <div class="quality-metrics">
            <div class="metric-item">
              <span class="metric-label">{{ $t('channelLifecycle.totalRecords') }}</span>
              <span class="metric-value">{{ dataQuality.totalRecords?.toLocaleString() || 0 }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">{{ $t('channelLifecycle.activeRecords') }}</span>
              <span class="metric-value">{{ dataQuality.activeRecords?.toLocaleString() || 0 }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">{{ $t('channelLifecycle.dataIssues') }}</span>
              <span class="metric-value">{{ dataQuality.issues?.length || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- 数据质量问题 -->
        <div v-if="dataQuality.issues?.length > 0" class="quality-issues">
          <h4 class="issues-title">{{ $t('channelLifecycle.identifiedIssues') }}</h4>
          <div class="issues-list">
            <div
              v-for="issue in dataQuality.issues"
              :key="issue.type"
              class="issue-item"
              :class="issueClass(issue.severity)"
            >
              <div class="issue-icon">
                <i :class="issueIcon(issue.severity)"></i>
              </div>
              <div class="issue-content">
                <p class="issue-message">{{ issue.message }}</p>
                <p class="issue-count">{{ $t('channelLifecycle.affectedRecords') }}: {{ issue.count }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 实时监控 -->
    <div class="realtime-section">
      <div class="realtime-card">
        <h3 class="realtime-title">
          {{ $t('channelLifecycle.realtimeMonitoring') }}
          <span class="realtime-indicator" :class="{ 'active': isRealtimeActive }">
            <i class="fas fa-circle"></i>
          </span>
        </h3>
        
        <div class="realtime-stats">
          <div class="stat-item">
            <span class="stat-label">{{ $t('channelLifecycle.lastUpdate') }}</span>
            <span class="stat-value">{{ formatTime(lastUpdateTime) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">{{ $t('channelLifecycle.updateFrequency') }}</span>
            <span class="stat-value">{{ $t('channelLifecycle.everyMinute') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">{{ $t('channelLifecycle.nextUpdate') }}</span>
            <span class="stat-value">{{ formatTime(nextUpdateTime) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { distributorService } from '../services/distributorService.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default {
  name: 'ChannelLifecycleDashboard',
  
  data() {
    return {
      healthStatus: {},
      channelTrends: [],
      lifecycleStats: {},
      recentChanges: [],
      monitoringSessions: [],
      dataQuality: {},
      isRealtimeActive: false,
      lastUpdateTime: new Date(),
      nextUpdateTime: new Date(Date.now() + 60000),
      
      // 图表实例
      trendsChart: null,
      lifecycleChart: null,
      
      // 订阅
      subscriptions: [],
      
      // 定时器
      updateTimer: null,
      
      // 加载状态
      loading: {
        health: false,
        trends: false,
        changes: false,
        sessions: false,
        quality: false
      }
    };
  },
  
  computed: {
    healthStatusClass() {
      const status = this.healthStatus.overall;
      switch (status) {
        case 'healthy': return 'text-green-600';
        case 'warning': return 'text-yellow-600';
        case 'error': return 'text-red-600';
        default: return 'text-gray-600';
      }
    },
    
    healthStatusIcon() {
      const status = this.healthStatus.overall;
      switch (status) {
        case 'healthy': return 'fas fa-heart';
        case 'warning': return 'fas fa-exclamation-triangle';
        case 'error': return 'fas fa-times-circle';
        default: return 'fas fa-question-circle';
      }
    }
  },
  
  async mounted() {
    await this.initializeDashboard();
    this.setupRealtimeSubscriptions();
    this.startUpdateTimer();
  },
  
  beforeUnmount() {
    this.cleanup();
  },
  
  methods: {
    async initializeDashboard() {
      console.log('🚀 初始化渠道生命周期仪表盘...');
      
      try {
        // 并行加载所有数据
        await Promise.all([
          this.loadHealthStatus(),
          this.loadChannelTrends(),
          this.loadRecentChanges(),
          this.loadMonitoringSessions(),
          this.loadDataQuality()
        ]);
        
        // 初始化图表
        await this.$nextTick();
        this.initializeCharts();
        
        console.log('✅ 仪表盘初始化完成');
      } catch (error) {
        console.error('❌ 仪表盘初始化失败:', error);
        this.$message.error('仪表盘加载失败');
      }
    },
    
    async loadHealthStatus() {
      this.loading.health = true;
      try {
        this.healthStatus = await distributorService.getChannelHealthStatus();
      } catch (error) {
        console.error('加载健康状态失败:', error);
        this.healthStatus = { overall: 'unknown' };
      } finally {
        this.loading.health = false;
      }
    },
    
    async loadChannelTrends() {
      this.loading.trends = true;
      try {
        this.channelTrends = await distributorService.getChannelTrends(30);
        this.lifecycleStats = await distributorService.getLifecycleStats();
      } catch (error) {
        console.error('加载趋势数据失败:', error);
        this.channelTrends = [];
        this.lifecycleStats = {};
      } finally {
        this.loading.trends = false;
      }
    },
    
    async loadRecentChanges() {
      this.loading.changes = true;
      try {
        this.recentChanges = await distributorService.getRecentChanges({
          days: 7,
          limit: 20
        });
      } catch (error) {
        console.error('加载最近变更失败:', error);
        this.recentChanges = [];
      } finally {
        this.loading.changes = false;
      }
    },
    
    async loadMonitoringSessions() {
      this.loading.sessions = true;
      try {
        this.monitoringSessions = await distributorService.getMonitoringSessions({
          limit: 10
        });
      } catch (error) {
        console.error('加载监控会话失败:', error);
        this.monitoringSessions = [];
      } finally {
        this.loading.sessions = false;
      }
    },
    
    async loadDataQuality() {
      this.loading.quality = true;
      try {
        this.dataQuality = await distributorService.checkDataQuality();
      } catch (error) {
        console.error('加载数据质量失败:', error);
        this.dataQuality = { qualityScore: 0, issues: [] };
      } finally {
        this.loading.quality = false;
      }
    },
    
    initializeCharts() {
      this.initializeTrendsChart();
      this.initializeLifecycleChart();
    },
    
    initializeTrendsChart() {
      if (!this.$refs.trendsChart) return;
      
      const ctx = this.$refs.trendsChart.getContext('2d');
      
      this.trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.channelTrends.map(t => t.date),
          datasets: [
            {
              label: this.$t('channelLifecycle.newChannels'),
              data: this.channelTrends.map(t => t.new_channels),
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              fill: true
            },
            {
              label: this.$t('channelLifecycle.deactivatedChannels'),
              data: this.channelTrends.map(t => t.deactivated_channels),
              borderColor: 'rgb(239, 68, 68)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              fill: true
            },
            {
              label: this.$t('channelLifecycle.netChange'),
              data: this.channelTrends.map(t => t.net_change),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    },
    
    initializeLifecycleChart() {
      if (!this.$refs.lifecycleChart) return;
      
      const ctx = this.$refs.lifecycleChart.getContext('2d');
      
      this.lifecycleChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: [
            this.$t('channelLifecycle.activeChannels'),
            this.$t('channelLifecycle.deactivatedChannels'),
            this.$t('channelLifecycle.neverDeactivated')
          ],
          datasets: [{
            data: [
              this.lifecycleStats.currently_active || 0,
              this.lifecycleStats.total_deactivated || 0,
              this.lifecycleStats.never_deactivated || 0
            ],
            backgroundColor: [
              'rgb(34, 197, 94)',
              'rgb(239, 68, 68)',
              'rgb(59, 130, 246)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    },
    
    setupRealtimeSubscriptions() {
      // 订阅渠道变更
      const channelSubscription = distributorService.subscribeToChannelChanges((payload) => {
        this.handleChannelChange(payload);
      });
      
      // 订阅会话变更
      const sessionSubscription = distributorService.subscribeToSessionChanges((payload) => {
        this.handleSessionChange(payload);
      });
      
      this.subscriptions.push(channelSubscription, sessionSubscription);
      this.isRealtimeActive = true;
    },
    
    startUpdateTimer() {
      this.updateTimer = setInterval(() => {
        this.lastUpdateTime = new Date();
        this.nextUpdateTime = new Date(Date.now() + 60000);
      }, 60000);
    },
    
    handleChannelChange(payload) {
      console.log('📡 接收到渠道变更:', payload);
      
      // 更新最近变更
      this.loadRecentChanges();
      
      // 更新健康状态
      this.loadHealthStatus();
    },
    
    handleSessionChange(payload) {
      console.log('📡 接收到会话变更:', payload);
      
      // 更新监控会话
      this.loadMonitoringSessions();
    },
    
    cleanup() {
      // 清理图表
      if (this.trendsChart) {
        this.trendsChart.destroy();
      }
      if (this.lifecycleChart) {
        this.lifecycleChart.destroy();
      }
      
      // 清理订阅
      this.subscriptions.forEach(unsubscribe => unsubscribe());
      this.subscriptions = [];
      
      // 清理定时器
      if (this.updateTimer) {
        clearInterval(this.updateTimer);
      }
      
      this.isRealtimeActive = false;
    },
    
    // 辅助方法
    alertClass(severity) {
      switch (severity) {
        case 'high': return 'alert-error';
        case 'warning': return 'alert-warning';
        case 'info': return 'alert-info';
        default: return 'alert-info';
      }
    },
    
    alertIcon(severity) {
      switch (severity) {
        case 'high': return 'fas fa-exclamation-circle';
        case 'warning': return 'fas fa-exclamation-triangle';
        case 'info': return 'fas fa-info-circle';
        default: return 'fas fa-info-circle';
      }
    },
    
    changeTypeClass(eventType) {
      switch (eventType) {
        case 'discovered': return 'change-discovered';
        case 'updated': return 'change-updated';
        case 'deactivated': return 'change-deactivated';
        case 'reactivated': return 'change-reactivated';
        default: return 'change-default';
      }
    },
    
    changeTypeIcon(eventType) {
      switch (eventType) {
        case 'discovered': return 'fas fa-plus-circle';
        case 'updated': return 'fas fa-edit';
        case 'deactivated': return 'fas fa-minus-circle';
        case 'reactivated': return 'fas fa-undo';
        default: return 'fas fa-circle';
      }
    },
    
    sessionStatusClass(status) {
      switch (status) {
        case 'completed': return 'session-completed';
        case 'running': return 'session-running';
        case 'failed': return 'session-failed';
        default: return 'session-default';
      }
    },
    
    sessionStatusIcon(status) {
      switch (status) {
        case 'completed': return 'fas fa-check-circle';
        case 'running': return 'fas fa-sync fa-spin';
        case 'failed': return 'fas fa-times-circle';
        default: return 'fas fa-circle';
      }
    },
    
    issueClass(severity) {
      switch (severity) {
        case 'high': return 'issue-high';
        case 'medium': return 'issue-medium';
        case 'low': return 'issue-low';
        default: return 'issue-default';
      }
    },
    
    issueIcon(severity) {
      switch (severity) {
        case 'high': return 'fas fa-exclamation-circle';
        case 'medium': return 'fas fa-exclamation-triangle';
        case 'low': return 'fas fa-info-circle';
        default: return 'fas fa-circle';
      }
    },
    
    getChangeDescription(change) {
      const type = change.event_type;
      const region = change.region;
      const country = change.country_code;
      
      switch (type) {
        case 'discovered':
          return `新发现渠道 - ${region}/${country}`;
        case 'updated':
          return `更新渠道信息 - ${region}/${country}`;
        case 'deactivated':
          return `渠道已失活 - ${region}/${country}`;
        case 'reactivated':
          return `渠道重新激活 - ${region}/${country}`;
        default:
          return `渠道变更 - ${region}/${country}`;
      }
    },
    
    formatSessionTitle(session) {
      const source = session.data_source || 'unknown';
      const status = session.status || 'unknown';
      return `${source} - ${status}`;
    },
    
    formatSessionStats(session) {
      const stats = [];
      if (session.new_channels) stats.push(`新增: ${session.new_channels}`);
      if (session.updated_channels) stats.push(`更新: ${session.updated_channels}`);
      if (session.deactivated_channels) stats.push(`失活: ${session.deactivated_channels}`);
      return stats.join(', ') || '无变更';
    },
    
    formatTime(timestamp) {
      if (!timestamp) return '-';
      return new Date(timestamp).toLocaleString();
    }
  }
};
</script>

<style scoped>
.channel-lifecycle-dashboard {
  @apply max-w-7xl mx-auto p-6 space-y-8;
}

.dashboard-header {
  @apply text-center mb-8;
}

.health-overview {
  @apply space-y-6;
}

.health-card {
  @apply bg-white rounded-lg shadow-md p-6 border border-gray-200;
}

.health-icon {
  @apply w-12 h-12 flex items-center justify-center rounded-full bg-opacity-10;
}

.alert-item {
  @apply p-4 rounded-lg border;
}

.alert-error {
  @apply bg-red-50 border-red-200 text-red-800;
}

.alert-warning {
  @apply bg-yellow-50 border-yellow-200 text-yellow-800;
}

.alert-info {
  @apply bg-blue-50 border-blue-200 text-blue-800;
}

.chart-card {
  @apply bg-white rounded-lg shadow-md p-6 border border-gray-200;
}

.chart-title {
  @apply text-lg font-semibold mb-4 text-gray-800;
}

.chart-container {
  @apply h-64 relative;
}

.chart-canvas {
  @apply absolute inset-0;
}

.activity-card {
  @apply bg-white rounded-lg shadow-md p-6 border border-gray-200;
}

.activity-title {
  @apply text-lg font-semibold mb-4 text-gray-800;
}

.activity-list {
  @apply space-y-4 max-h-64 overflow-y-auto;
}

.activity-item {
  @apply flex items-start space-x-3;
}

.activity-icon {
  @apply w-8 h-8 flex items-center justify-center rounded-full text-white text-sm;
}

.change-discovered {
  @apply bg-green-500;
}

.change-updated {
  @apply bg-blue-500;
}

.change-deactivated {
  @apply bg-red-500;
}

.change-reactivated {
  @apply bg-purple-500;
}

.change-default {
  @apply bg-gray-500;
}

.activity-content {
  @apply flex-1;
}

.activity-title-text {
  @apply font-medium text-gray-900;
}

.activity-description {
  @apply text-sm text-gray-600;
}

.activity-time {
  @apply text-xs text-gray-500;
}

.session-list {
  @apply space-y-3 max-h-64 overflow-y-auto;
}

.session-item {
  @apply flex items-start space-x-3;
}

.session-status {
  @apply w-6 h-6 flex items-center justify-center rounded-full text-white text-xs;
}

.session-completed {
  @apply bg-green-500;
}

.session-running {
  @apply bg-blue-500;
}

.session-failed {
  @apply bg-red-500;
}

.session-default {
  @apply bg-gray-500;
}

.session-content {
  @apply flex-1;
}

.session-title {
  @apply text-sm font-medium text-gray-900;
}

.session-stats {
  @apply text-xs text-gray-600;
}

.session-time {
  @apply text-xs text-gray-500;
}

.quality-card {
  @apply bg-white rounded-lg shadow-md p-6 border border-gray-200;
}

.quality-title {
  @apply text-lg font-semibold mb-6 text-gray-800;
}

.quality-score-container {
  @apply flex items-center space-x-8 mb-6;
}

.quality-score-circle {
  @apply w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center;
}

.quality-score-text {
  @apply text-center text-white;
}

.score-value {
  @apply text-2xl font-bold block;
}

.score-label {
  @apply text-xs;
}

.quality-metrics {
  @apply grid grid-cols-1 gap-4;
}

.metric-item {
  @apply flex justify-between items-center py-2 border-b border-gray-200;
}

.metric-label {
  @apply text-sm text-gray-600;
}

.metric-value {
  @apply text-sm font-semibold text-gray-900;
}

.quality-issues {
  @apply space-y-4;
}

.issues-title {
  @apply text-md font-semibold text-gray-800 mb-3;
}

.issues-list {
  @apply space-y-2;
}

.issue-item {
  @apply flex items-start space-x-3 p-3 rounded-lg border;
}

.issue-high {
  @apply bg-red-50 border-red-200;
}

.issue-medium {
  @apply bg-yellow-50 border-yellow-200;
}

.issue-low {
  @apply bg-blue-50 border-blue-200;
}

.issue-default {
  @apply bg-gray-50 border-gray-200;
}

.issue-icon {
  @apply w-5 h-5 flex items-center justify-center text-sm;
}

.issue-content {
  @apply flex-1;
}

.issue-message {
  @apply text-sm font-medium text-gray-900;
}

.issue-count {
  @apply text-xs text-gray-600;
}

.realtime-card {
  @apply bg-white rounded-lg shadow-md p-6 border border-gray-200;
}

.realtime-title {
  @apply text-lg font-semibold mb-4 text-gray-800 flex items-center;
}

.realtime-indicator {
  @apply ml-2 text-red-500;
}

.realtime-indicator.active {
  @apply text-green-500;
}

.realtime-stats {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.stat-item {
  @apply flex justify-between items-center py-2 border-b border-gray-200;
}

.stat-label {
  @apply text-sm text-gray-600;
}

.stat-value {
  @apply text-sm font-semibold text-gray-900;
}
</style>