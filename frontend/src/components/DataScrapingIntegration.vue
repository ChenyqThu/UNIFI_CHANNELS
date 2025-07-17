<template>
  <div class="data-scraping-integration">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">
        {{ $t('dataScrapingIntegration.title') }}
      </h1>
      <p class="text-gray-600 mb-6">
        {{ $t('dataScrapingIntegration.description') }}
      </p>
    </div>

    <!-- 状态总览 -->
    <div class="status-overview mb-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- 抓取状态 -->
        <div class="status-card">
          <div class="status-indicator" :class="scrapingStatusClass">
            <i :class="scrapingStatusIcon"></i>
          </div>
          <div class="status-content">
            <h3 class="status-title">{{ $t('dataScrapingIntegration.scrapingStatus') }}</h3>
            <p class="status-value">{{ scrapingStatusText }}</p>
            <p class="status-subtitle">{{ lastRunTime }}</p>
          </div>
        </div>

        <!-- 数据统计 -->
        <div class="status-card">
          <div class="status-indicator status-data">
            <i class="fas fa-database"></i>
          </div>
          <div class="status-content">
            <h3 class="status-title">{{ $t('dataScrapingIntegration.dataStatistics') }}</h3>
            <p class="status-value">{{ totalChannels.toLocaleString() }}</p>
            <p class="status-subtitle">{{ $t('dataScrapingIntegration.totalChannels') }}</p>
          </div>
        </div>

        <!-- 最近更新 -->
        <div class="status-card">
          <div class="status-indicator status-update">
            <i class="fas fa-sync-alt"></i>
          </div>
          <div class="status-content">
            <h3 class="status-title">{{ $t('dataScrapingIntegration.recentUpdates') }}</h3>
            <p class="status-value">{{ recentUpdates }}</p>
            <p class="status-subtitle">{{ $t('dataScrapingIntegration.inLast24Hours') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 抓取控制面板 -->
    <div class="control-panel mb-8">
      <div class="panel-card">
        <h2 class="panel-title">{{ $t('dataScrapingIntegration.controlPanel') }}</h2>
        
        <div class="control-grid">
          <!-- 全量抓取 -->
          <div class="control-section">
            <h3 class="control-title">{{ $t('dataScrapingIntegration.fullScraping') }}</h3>
            <p class="control-description">{{ $t('dataScrapingIntegration.fullScrapingDesc') }}</p>
            
            <div class="control-options">
              <div class="option-group">
                <label class="option-label">{{ $t('dataScrapingIntegration.regions') }}</label>
                <div class="region-selector">
                  <button
                    v-for="region in availableRegions"
                    :key="region.code"
                    @click="toggleRegion(region.code)"
                    :class="['region-btn', { active: selectedRegions.includes(region.code) }]"
                  >
                    {{ region.name }}
                  </button>
                </div>
              </div>
              
              <div class="option-group">
                <label class="option-label">{{ $t('dataScrapingIntegration.concurrency') }}</label>
                <select v-model="scrapingOptions.maxConcurrency" class="option-select">
                  <option value="1">1 ({{ $t('dataScrapingIntegration.sequential') }})</option>
                  <option value="2">2</option>
                  <option value="3">3 ({{ $t('dataScrapingIntegration.recommended') }})</option>
                  <option value="5">5</option>
                </select>
              </div>
              
              <div class="option-group">
                <label class="option-checkbox">
                  <input 
                    type="checkbox" 
                    v-model="scrapingOptions.retryFailed"
                    class="checkbox-input"
                  >
                  <span class="checkbox-label">{{ $t('dataScrapingIntegration.retryFailed') }}</span>
                </label>
              </div>
            </div>
            
            <div class="control-actions">
              <button 
                @click="startFullScraping"
                :disabled="isScrapingRunning"
                class="btn btn-primary"
              >
                <i class="fas fa-play mr-2"></i>
                {{ $t('dataScrapingIntegration.startFullScraping') }}
              </button>
              
              <button 
                @click="stopScraping"
                :disabled="!isScrapingRunning"
                class="btn btn-secondary"
              >
                <i class="fas fa-stop mr-2"></i>
                {{ $t('dataScrapingIntegration.stopScraping') }}
              </button>
            </div>
          </div>

          <!-- 增量抓取 -->
          <div class="control-section">
            <h3 class="control-title">{{ $t('dataScrapingIntegration.incrementalScraping') }}</h3>
            <p class="control-description">{{ $t('dataScrapingIntegration.incrementalScrapingDesc') }}</p>
            
            <div class="control-options">
              <div class="option-group">
                <label class="option-label">{{ $t('dataScrapingIntegration.selectRegion') }}</label>
                <select v-model="incrementalOptions.selectedRegion" class="option-select">
                  <option value="">{{ $t('dataScrapingIntegration.selectRegionPlaceholder') }}</option>
                  <option
                    v-for="region in availableRegions"
                    :key="region.code"
                    :value="region.code"
                  >
                    {{ region.name }}
                  </option>
                </select>
              </div>
            </div>
            
            <div class="control-actions">
              <button 
                @click="startIncrementalScraping"
                :disabled="!incrementalOptions.selectedRegion || isScrapingRunning"
                class="btn btn-primary"
              >
                <i class="fas fa-refresh mr-2"></i>
                {{ $t('dataScrapingIntegration.startIncrementalScraping') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 进度监控 -->
    <div v-if="isScrapingRunning" class="progress-monitor mb-8">
      <div class="progress-card">
        <h2 class="progress-title">{{ $t('dataScrapingIntegration.progressMonitor') }}</h2>
        
        <div class="progress-overview">
          <div class="progress-stats">
            <div class="stat-item">
              <span class="stat-label">{{ $t('dataScrapingIntegration.regionsProcessed') }}</span>
              <span class="stat-value">{{ scrapingProgress.processedRegions }} / {{ scrapingProgress.totalRegions }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">{{ $t('dataScrapingIntegration.channelsFound') }}</span>
              <span class="stat-value">{{ scrapingProgress.totalChannels }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">{{ $t('dataScrapingIntegration.newChannels') }}</span>
              <span class="stat-value">{{ scrapingProgress.newChannels }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">{{ $t('dataScrapingIntegration.updatedChannels') }}</span>
              <span class="stat-value">{{ scrapingProgress.updatedChannels }}</span>
            </div>
          </div>
          
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :style="{ width: progressPercentage + '%' }"
              ></div>
            </div>
            <span class="progress-text">{{ progressPercentage }}% {{ $t('dataScrapingIntegration.complete') }}</span>
          </div>
        </div>
        
        <div class="progress-log">
          <h3 class="log-title">{{ $t('dataScrapingIntegration.activityLog') }}</h3>
          <div class="log-container">
            <div
              v-for="log in scrapingLogs"
              :key="log.id"
              class="log-entry"
              :class="logEntryClass(log.type)"
            >
              <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史记录 -->
    <div class="history-section">
      <div class="history-card">
        <h2 class="history-title">{{ $t('dataScrapingIntegration.scrapingHistory') }}</h2>
        
        <div class="history-table-container">
          <table class="history-table">
            <thead>
              <tr>
                <th>{{ $t('dataScrapingIntegration.startTime') }}</th>
                <th>{{ $t('dataScrapingIntegration.status') }}</th>
                <th>{{ $t('dataScrapingIntegration.duration') }}</th>
                <th>{{ $t('dataScrapingIntegration.channelsProcessed') }}</th>
                <th>{{ $t('dataScrapingIntegration.newChannels') }}</th>
                <th>{{ $t('dataScrapingIntegration.errors') }}</th>
                <th>{{ $t('dataScrapingIntegration.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="session in scrapingHistory" :key="session.id">
                <td>{{ formatDateTime(session.session_start) }}</td>
                <td>
                  <span class="status-badge" :class="sessionStatusClass(session.status)">
                    {{ session.status }}
                  </span>
                </td>
                <td>{{ formatDuration(session.session_duration) }}</td>
                <td>{{ session.total_found || 0 }}</td>
                <td>{{ session.new_channels || 0 }}</td>
                <td>{{ session.error_message ? '有错误' : '无' }}</td>
                <td>
                  <button 
                    @click="viewSessionDetails(session)"
                    class="btn btn-sm btn-outline"
                  >
                    {{ $t('dataScrapingIntegration.viewDetails') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 会话详情模态框 -->
    <div v-if="selectedSession" class="modal-overlay" @click="closeSessionModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ $t('dataScrapingIntegration.sessionDetails') }}</h2>
          <button @click="closeSessionModal" class="modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="session-details">
            <div class="detail-section">
              <h3 class="detail-title">{{ $t('dataScrapingIntegration.sessionInfo') }}</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>{{ $t('dataScrapingIntegration.sessionId') }}:</label>
                  <span>{{ selectedSession.id }}</span>
                </div>
                <div class="detail-item">
                  <label>{{ $t('dataScrapingIntegration.startTime') }}:</label>
                  <span>{{ formatDateTime(selectedSession.session_start) }}</span>
                </div>
                <div class="detail-item">
                  <label>{{ $t('dataScrapingIntegration.endTime') }}:</label>
                  <span>{{ formatDateTime(selectedSession.session_end) }}</span>
                </div>
                <div class="detail-item">
                  <label>{{ $t('dataScrapingIntegration.status') }}:</label>
                  <span class="status-badge" :class="sessionStatusClass(selectedSession.status)">
                    {{ selectedSession.status }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h3 class="detail-title">{{ $t('dataScrapingIntegration.results') }}</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>{{ $t('dataScrapingIntegration.totalFound') }}:</label>
                  <span>{{ selectedSession.total_found || 0 }}</span>
                </div>
                <div class="detail-item">
                  <label>{{ $t('dataScrapingIntegration.newChannels') }}:</label>
                  <span>{{ selectedSession.new_channels || 0 }}</span>
                </div>
                <div class="detail-item">
                  <label>{{ $t('dataScrapingIntegration.updatedChannels') }}:</label>
                  <span>{{ selectedSession.updated_channels || 0 }}</span>
                </div>
                <div class="detail-item">
                  <label>{{ $t('dataScrapingIntegration.deactivatedChannels') }}:</label>
                  <span>{{ selectedSession.deactivated_channels || 0 }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="selectedSession.error_message" class="detail-section">
              <h3 class="detail-title">{{ $t('dataScrapingIntegration.errorInfo') }}</h3>
              <div class="error-message">
                {{ selectedSession.error_message }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeSessionModal" class="btn btn-secondary">
            {{ $t('dataScrapingIntegration.close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import dataScrapingService from '../services/dataScrapingService.js';
import { distributorService } from '../services/distributorService.js';
import { REGIONS } from '../utils/regionCountryMapping.js';

export default {
  name: 'DataScrapingIntegration',
  
  data() {
    return {
      // 抓取状态
      isScrapingRunning: false,
      scrapingProgress: {
        processedRegions: 0,
        totalRegions: 0,
        totalChannels: 0,
        newChannels: 0,
        updatedChannels: 0,
        deactivatedChannels: 0,
        errors: []
      },
      
      // 抓取选项
      scrapingOptions: {
        maxConcurrency: 3,
        retryFailed: true
      },
      
      // 增量抓取选项
      incrementalOptions: {
        selectedRegion: ''
      },
      
      // 地区选择
      selectedRegions: Object.keys(REGIONS),
      
      // 状态数据
      totalChannels: 0,
      recentUpdates: 0,
      lastRunTime: '',
      
      // 抓取日志
      scrapingLogs: [],
      
      // 历史记录
      scrapingHistory: [],
      
      // 模态框
      selectedSession: null,
      
      // 定时器
      statusTimer: null,
      historyTimer: null
    };
  },
  
  computed: {
    availableRegions() {
      return Object.entries(REGIONS).map(([code, info]) => ({
        code,
        name: info.name || code.toUpperCase()
      }));
    },
    
    scrapingStatusClass() {
      return {
        'status-running': this.isScrapingRunning,
        'status-idle': !this.isScrapingRunning,
        'status-success': !this.isScrapingRunning && this.lastRunTime
      };
    },
    
    scrapingStatusIcon() {
      if (this.isScrapingRunning) return 'fas fa-sync fa-spin';
      return 'fas fa-check-circle';
    },
    
    scrapingStatusText() {
      if (this.isScrapingRunning) return this.$t('dataScrapingIntegration.running');
      return this.$t('dataScrapingIntegration.idle');
    },
    
    progressPercentage() {
      if (this.scrapingProgress.totalRegions === 0) return 0;
      return Math.round((this.scrapingProgress.processedRegions / this.scrapingProgress.totalRegions) * 100);
    }
  },
  
  async mounted() {
    await this.loadInitialData();
    this.startStatusTimer();
  },
  
  beforeUnmount() {
    this.cleanup();
  },
  
  methods: {
    async loadInitialData() {
      try {
        // 加载基础统计数据
        await this.loadStatistics();
        
        // 加载抓取历史
        await this.loadScrapingHistory();
        
        // 检查是否有正在进行的抓取
        this.checkScrapingStatus();
        
      } catch (error) {
        console.error('加载初始数据失败:', error);
        this.$message.error('数据加载失败');
      }
    },
    
    async loadStatistics() {
      try {
        const stats = await distributorService.getStatistics();
        this.totalChannels = stats.total_count || 0;
        
        // 获取最近24小时的更新数
        const recentChanges = await distributorService.getRecentChanges({
          days: 1,
          limit: 1000
        });
        this.recentUpdates = recentChanges.length;
        
      } catch (error) {
        console.error('加载统计数据失败:', error);
      }
    },
    
    async loadScrapingHistory() {
      try {
        const sessions = await distributorService.getMonitoringSessions({
          limit: 20
        });
        this.scrapingHistory = sessions;
        
        // 设置最后运行时间
        if (sessions.length > 0) {
          this.lastRunTime = this.formatDateTime(sessions[0].session_start);
        }
        
      } catch (error) {
        console.error('加载抓取历史失败:', error);
      }
    },
    
    checkScrapingStatus() {
      const status = dataScrapingService.getStatus();
      this.isScrapingRunning = status.isRunning;
    },
    
    async startFullScraping() {
      if (this.isScrapingRunning) return;
      
      try {
        this.isScrapingRunning = true;
        this.scrapingProgress = {
          processedRegions: 0,
          totalRegions: this.selectedRegions.length,
          totalChannels: 0,
          newChannels: 0,
          updatedChannels: 0,
          deactivatedChannels: 0,
          errors: []
        };
        this.scrapingLogs = [];
        
        this.addLog('info', '开始全量抓取...');
        
        const result = await dataScrapingService.startFullScraping({
          regions: this.selectedRegions,
          onProgress: this.handleScrapingProgress,
          maxConcurrency: this.scrapingOptions.maxConcurrency,
          retryFailed: this.scrapingOptions.retryFailed
        });
        
        this.addLog('success', `抓取完成！处理了 ${result.totalChannels} 个渠道`);
        
        // 刷新统计数据
        await this.loadStatistics();
        await this.loadScrapingHistory();
        
      } catch (error) {
        console.error('全量抓取失败:', error);
        this.addLog('error', `抓取失败: ${error.message}`);
        this.$message.error('抓取失败');
      } finally {
        this.isScrapingRunning = false;
      }
    },
    
    async startIncrementalScraping() {
      if (this.isScrapingRunning || !this.incrementalOptions.selectedRegion) return;
      
      try {
        this.isScrapingRunning = true;
        this.scrapingLogs = [];
        
        this.addLog('info', `开始增量抓取地区: ${this.incrementalOptions.selectedRegion}`);
        
        const result = await dataScrapingService.incrementalScrapeRegion(
          this.incrementalOptions.selectedRegion
        );
        
        this.addLog('success', `增量抓取完成！处理了 ${result.channelCount} 个渠道`);
        
        // 刷新统计数据
        await this.loadStatistics();
        await this.loadScrapingHistory();
        
      } catch (error) {
        console.error('增量抓取失败:', error);
        this.addLog('error', `增量抓取失败: ${error.message}`);
        this.$message.error('增量抓取失败');
      } finally {
        this.isScrapingRunning = false;
      }
    },
    
    stopScraping() {
      if (!this.isScrapingRunning) return;
      
      dataScrapingService.stopScraping();
      this.addLog('warning', '抓取已被用户停止');
      this.isScrapingRunning = false;
    },
    
    handleScrapingProgress(progressData) {
      switch (progressData.type) {
        case 'region_completed':
          this.scrapingProgress.processedRegions++;
          this.scrapingProgress.totalChannels += progressData.result.channelCount;
          this.addLog('info', `地区 ${progressData.region} 完成，发现 ${progressData.result.channelCount} 个渠道`);
          break;
          
        case 'scraping_completed':
          this.scrapingProgress.newChannels = progressData.result.newChannels;
          this.scrapingProgress.updatedChannels = progressData.result.updatedChannels;
          this.scrapingProgress.deactivatedChannels = progressData.result.deactivatedChannels;
          break;
      }
    },
    
    toggleRegion(regionCode) {
      const index = this.selectedRegions.indexOf(regionCode);
      if (index > -1) {
        this.selectedRegions.splice(index, 1);
      } else {
        this.selectedRegions.push(regionCode);
      }
    },
    
    addLog(type, message) {
      this.scrapingLogs.unshift({
        id: Date.now(),
        type,
        message,
        timestamp: new Date()
      });
      
      // 限制日志数量
      if (this.scrapingLogs.length > 100) {
        this.scrapingLogs = this.scrapingLogs.slice(0, 100);
      }
    },
    
    viewSessionDetails(session) {
      this.selectedSession = session;
    },
    
    closeSessionModal() {
      this.selectedSession = null;
    },
    
    startStatusTimer() {
      this.statusTimer = setInterval(() => {
        this.checkScrapingStatus();
      }, 5000);
      
      this.historyTimer = setInterval(() => {
        if (!this.isScrapingRunning) {
          this.loadScrapingHistory();
        }
      }, 30000);
    },
    
    cleanup() {
      if (this.statusTimer) {
        clearInterval(this.statusTimer);
      }
      if (this.historyTimer) {
        clearInterval(this.historyTimer);
      }
      dataScrapingService.cleanup();
    },
    
    // 辅助方法
    logEntryClass(type) {
      switch (type) {
        case 'error': return 'log-error';
        case 'warning': return 'log-warning';
        case 'success': return 'log-success';
        default: return 'log-info';
      }
    },
    
    sessionStatusClass(status) {
      switch (status) {
        case 'completed': return 'status-success';
        case 'running': return 'status-running';
        case 'failed': return 'status-error';
        default: return 'status-default';
      }
    },
    
    formatDateTime(timestamp) {
      if (!timestamp) return '-';
      return new Date(timestamp).toLocaleString();
    },
    
    formatLogTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString();
    },
    
    formatDuration(duration) {
      if (!duration) return '-';
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }
};
</script>

<style scoped>
.data-scraping-integration {
  @apply max-w-7xl mx-auto p-6 space-y-8;
}

.page-header {
  @apply text-center mb-8;
}

/* 状态总览 */
.status-overview {
  @apply space-y-6;
}

.status-card {
  @apply bg-white rounded-lg shadow-md p-6 border border-gray-200 flex items-center;
}

.status-indicator {
  @apply w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl mr-4;
}

.status-running {
  @apply bg-blue-500;
}

.status-idle {
  @apply bg-gray-500;
}

.status-success {
  @apply bg-green-500;
}

.status-data {
  @apply bg-purple-500;
}

.status-update {
  @apply bg-orange-500;
}

.status-content {
  @apply flex-1;
}

.status-title {
  @apply text-lg font-semibold text-gray-800;
}

.status-value {
  @apply text-2xl font-bold text-gray-900;
}

.status-subtitle {
  @apply text-sm text-gray-600;
}

/* 控制面板 */
.control-panel {
  @apply space-y-6;
}

.panel-card {
  @apply bg-white rounded-lg shadow-md p-6 border border-gray-200;
}

.panel-title {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.control-grid {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-8;
}

.control-section {
  @apply space-y-4;
}

.control-title {
  @apply text-lg font-semibold text-gray-800;
}

.control-description {
  @apply text-gray-600;
}

.control-options {
  @apply space-y-4;
}

.option-group {
  @apply space-y-2;
}

.option-label {
  @apply block text-sm font-medium text-gray-700;
}

.option-select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.option-checkbox {
  @apply flex items-center space-x-2;
}

.checkbox-input {
  @apply w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500;
}

.checkbox-label {
  @apply text-sm text-gray-700;
}

.region-selector {
  @apply flex flex-wrap gap-2;
}

.region-btn {
  @apply px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors;
}

.region-btn.active {
  @apply bg-blue-500 text-white border-blue-500;
}

.control-actions {
  @apply flex space-x-3;
}

.btn {
  @apply px-4 py-2 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.btn-secondary {
  @apply bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500;
}

.btn-outline {
  @apply border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500;
}

.btn-sm {
  @apply px-2 py-1 text-sm;
}

.btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* 进度监控 */
.progress-monitor {
  @apply space-y-6;
}

.progress-card {
  @apply bg-white rounded-lg shadow-md p-6 border border-gray-200;
}

.progress-title {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.progress-overview {
  @apply space-y-4 mb-6;
}

.progress-stats {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

.stat-item {
  @apply text-center;
}

.stat-label {
  @apply block text-sm text-gray-600;
}

.stat-value {
  @apply text-2xl font-bold text-gray-900;
}

.progress-bar-container {
  @apply space-y-2;
}

.progress-bar {
  @apply w-full bg-gray-200 rounded-full h-4;
}

.progress-fill {
  @apply bg-blue-500 h-4 rounded-full transition-all duration-300;
}

.progress-text {
  @apply text-sm text-gray-600;
}

.progress-log {
  @apply space-y-4;
}

.log-title {
  @apply text-lg font-semibold text-gray-800;
}

.log-container {
  @apply bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2;
}

.log-entry {
  @apply flex space-x-2 text-sm;
}

.log-time {
  @apply text-gray-500 font-mono;
}

.log-message {
  @apply flex-1;
}

.log-info {
  @apply text-gray-700;
}

.log-success {
  @apply text-green-700;
}

.log-warning {
  @apply text-yellow-700;
}

.log-error {
  @apply text-red-700;
}

/* 历史记录 */
.history-section {
  @apply space-y-6;
}

.history-card {
  @apply bg-white rounded-lg shadow-md p-6 border border-gray-200;
}

.history-title {
  @apply text-xl font-semibold text-gray-800 mb-6;
}

.history-table-container {
  @apply overflow-x-auto;
}

.history-table {
  @apply min-w-full table-auto;
}

.history-table th {
  @apply px-4 py-2 text-left text-sm font-medium text-gray-700 bg-gray-50 border-b;
}

.history-table td {
  @apply px-4 py-2 text-sm text-gray-900 border-b;
}

.status-badge {
  @apply inline-flex px-2 py-1 text-xs font-medium rounded-full;
}

.status-success {
  @apply bg-green-100 text-green-800;
}

.status-running {
  @apply bg-blue-100 text-blue-800;
}

.status-error {
  @apply bg-red-100 text-red-800;
}

.status-default {
  @apply bg-gray-100 text-gray-800;
}

/* 模态框 */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-container {
  @apply bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b;
}

.modal-title {
  @apply text-xl font-semibold text-gray-800;
}

.modal-close {
  @apply text-gray-400 hover:text-gray-600 focus:outline-none;
}

.modal-body {
  @apply p-6;
}

.modal-footer {
  @apply flex justify-end p-6 border-t;
}

.session-details {
  @apply space-y-6;
}

.detail-section {
  @apply space-y-4;
}

.detail-title {
  @apply text-lg font-semibold text-gray-800;
}

.detail-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.detail-item {
  @apply flex flex-col;
}

.detail-item label {
  @apply text-sm font-medium text-gray-700;
}

.detail-item span {
  @apply text-sm text-gray-900;
}

.error-message {
  @apply bg-red-50 border border-red-200 rounded-lg p-4 text-red-700;
}
</style>