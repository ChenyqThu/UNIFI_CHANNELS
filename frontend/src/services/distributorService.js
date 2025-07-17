/**
 * 分销商数据服务
 * 负责管理分销商数据的 CRUD 操作和业务逻辑
 * 增强版：支持渠道生命周期跟踪和监控
 */

import { supabase, QueryBuilder, cacheManager, handleSupabaseError } from './supabaseClient.js'
import channelMonitoringService from './channelMonitoringService.js'

export class DistributorService {
  constructor() {
    this.tableName = 'distributors'
    this.cache = cacheManager
  }

  /**
   * 获取所有分销商
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 分销商数组
   */
  async getAll(options = {}) {
    try {
      const {
        companyId,
        region,
        partnerType,
        activeOnly = true,
        limit = 1000,
        offset = 0
      } = options

      const cacheKey = `distributors_${JSON.stringify(options)}`
      const cached = this.cache.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const query = new QueryBuilder(this.tableName)
        .select(`
          *,
          companies:company_id (
            id,
            name,
            website_url
          )
        `)
        .order('created_at', false)
        .limit(limit)
        .range(offset, offset + limit - 1)

      if (companyId) {
        query.eq('company_id', companyId)
      }

      if (region) {
        query.eq('region', region)
      }

      if (partnerType) {
        query.eq('partner_type', partnerType)
      }

      if (activeOnly) {
        query.eq('is_active', true)
      }

      const data = await query.execute()
      
      // 缓存数据
      this.cache.set(cacheKey, data, 5 * 60 * 1000) // 5分钟缓存
      
      return data
      
    } catch (error) {
      console.error('❌ 获取分销商数据失败:', error)
      throw error
    }
  }

  /**
   * 根据 ID 获取分销商
   * @param {string} id - 分销商 ID
   * @returns {Promise<Object>} 分销商数据
   */
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          companies:company_id (
            id,
            name,
            website_url
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        throw error
      }

      return data
      
    } catch (error) {
      const errorMessage = handleSupabaseError(error, '获取分销商详情')
      console.error('❌ 获取分销商详情失败:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * 根据 Unifi ID 获取分销商
   * @param {number} unifiId - Unifi ID
   * @returns {Promise<Object>} 分销商数据
   */
  async getByUnifiId(unifiId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          companies:company_id (
            id,
            name,
            website_url
          )
        `)
        .eq('unifi_id', unifiId)
        .single()

      if (error) {
        throw error
      }

      return data
      
    } catch (error) {
      const errorMessage = handleSupabaseError(error, '获取分销商详情')
      console.error('❌ 获取分销商详情失败:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * 创建分销商
   * @param {Object} data - 分销商数据
   * @returns {Promise<Object>} 创建的分销商
   */
  async create(data) {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single()

      if (error) {
        throw error
      }

      // 清除相关缓存
      this.cache.clear()

      return result
      
    } catch (error) {
      const errorMessage = handleSupabaseError(error, '创建分销商')
      console.error('❌ 创建分销商失败:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * 更新分销商
   * @param {string} id - 分销商 ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>} 更新后的分销商
   */
  async update(id, updates) {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      // 清除相关缓存
      this.cache.clear()

      return result
      
    } catch (error) {
      const errorMessage = handleSupabaseError(error, '更新分销商')
      console.error('❌ 更新分销商失败:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * 删除分销商
   * @param {string} id - 分销商 ID
   * @returns {Promise<boolean>} 删除是否成功
   */
  async delete(id) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      // 清除所有相关缓存
      this.cache.clear()

      return true
      
    } catch (error) {
      const errorMessage = handleSupabaseError(error, '删除分销商')
      console.error('❌ 删除分销商失败:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * 批量创建分销商
   * @param {Array} dataArray - 分销商数据数组
   * @returns {Promise<Array>} 创建的分销商数组
   */
  async bulkCreate(dataArray) {
    try {
      const { data: results, error } = await supabase
        .from(this.tableName)
        .insert(dataArray)
        .select()

      if (error) {
        throw error
      }

      // 清除所有相关缓存
      this.cache.clear()

      return results
      
    } catch (error) {
      const errorMessage = handleSupabaseError(error, '批量创建分销商')
      console.error('❌ 批量创建分销商失败:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * 批量更新分销商
   * @param {Array} updates - 更新数据数组，每个元素包含 id 和更新字段
   * @returns {Promise<Array>} 更新后的分销商数组
   */
  async bulkUpdate(updates) {
    try {
      const promises = updates.map(({ id, ...data }) => 
        supabase
          .from(this.tableName)
          .update(data)
          .eq('id', id)
          .select()
          .single()
      )

      const results = await Promise.all(promises)
      
      // 检查是否有错误
      const errors = results.filter(result => result.error)
      if (errors.length > 0) {
        throw new Error(`批量更新失败: ${errors.length} 条记录出错`)
      }

      const successData = results.map(result => result.data)

      // 清除所有相关缓存
      this.cache.clear()

      return successData
      
    } catch (error) {
      const errorMessage = handleSupabaseError(error, '批量更新分销商')
      console.error('❌ 批量更新分销商失败:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * 获取分销商统计数据
   * @param {string} companyId - 公司 ID (可选)
   * @returns {Promise<Object>} 统计数据
   */
  async getStatistics(companyId = null) {
    try {
      const cacheKey = `distributor_stats_${companyId || 'all'}`
      const cached = this.cache.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const { data, error } = await supabase
        .rpc('get_distributor_statistics', {
          p_company_id: companyId
        })

      if (error) {
        throw error
      }

      const stats = data[0] || {
        total_count: 0,
        active_count: 0,
        master_count: 0,
        simple_count: 0,
        regions: [],
        countries: []
      }

      // 缓存统计数据
      this.cache.set(cacheKey, stats, 10 * 60 * 1000) // 10分钟缓存

      return stats
      
    } catch (error) {
      console.error('❌ 获取分销商统计数据失败:', error)
      throw error
    }
  }

  /**
   * 按地区获取分销商
   * @param {string} region - 地区
   * @param {string} companyId - 公司 ID (可选)
   * @returns {Promise<Array>} 分销商数组
   */
  async getByRegion(region, companyId = null) {
    try {
      const options = { region, activeOnly: true }
      if (companyId) {
        options.companyId = companyId
      }

      return await this.getAll(options)
      
    } catch (error) {
      console.error('❌ 按地区获取分销商失败:', error)
      throw error
    }
  }

  /**
   * 按合作伙伴类型获取分销商
   * @param {string} partnerType - 合作伙伴类型 ('master' 或 'simple')
   * @param {string} companyId - 公司 ID (可选)
   * @returns {Promise<Array>} 分销商数组
   */
  async getByPartnerType(partnerType, companyId = null) {
    try {
      const options = { partnerType, activeOnly: true }
      if (companyId) {
        options.companyId = companyId
      }

      return await this.getAll(options)
      
    } catch (error) {
      console.error('❌ 按合作伙伴类型获取分销商失败:', error)
      throw error
    }
  }

  /**
   * 搜索分销商
   * @param {string} searchTerm - 搜索词
   * @param {Object} options - 搜索选项
   * @returns {Promise<Array>} 搜索结果
   */
  async search(searchTerm, options = {}) {
    try {
      const {
        companyId,
        region,
        partnerType,
        activeOnly = true
      } = options

      const query = new QueryBuilder(this.tableName)
        .select(`
          *,
          companies:company_id (
            id,
            name,
            website_url
          )
        `)
        .or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,contact_email.ilike.%${searchTerm}%`)
        .order('created_at', false)

      if (companyId) {
        query.eq('company_id', companyId)
      }

      if (region) {
        query.eq('region', region)
      }

      if (partnerType) {
        query.eq('partner_type', partnerType)
      }

      if (activeOnly) {
        query.eq('is_active', true)
      }

      const data = await query.execute()
      
      return data
      
    } catch (error) {
      console.error('❌ 搜索分销商失败:', error)
      throw error
    }
  }

  /**
   * 获取地理位置数据
   * @param {string} companyId - 公司 ID (可选)
   * @returns {Promise<Array>} 包含地理位置的分销商数组
   */
  async getGeoData(companyId = null) {
    try {
      const query = new QueryBuilder(this.tableName)
        .select('id, name, latitude, longitude, address, region, country_state, partner_type')
        .eq('is_active', true)
        .filter('latitude', 'not.is', null)
        .filter('longitude', 'not.is', null)

      if (companyId) {
        query.eq('company_id', companyId)
      }

      const data = await query.execute()
      
      return data
      
    } catch (error) {
      console.error('❌ 获取地理位置数据失败:', error)
      throw error
    }
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear()
    console.log('🗑️ 分销商数据缓存已清除')
  }

  // ====================================================================
  // 增强监控功能 - 新增方法
  // ====================================================================

  /**
   * 获取活跃渠道（使用增强视图）
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>} 活跃渠道列表
   */
  async getActiveChannelsEnhanced(filters = {}) {
    try {
      return await channelMonitoringService.getActiveChannels(filters)
    } catch (error) {
      console.error('❌ 获取增强活跃渠道失败:', error)
      throw error
    }
  }

  /**
   * 获取渠道生命周期事件
   * @param {string} distributorId - 分销商ID
   * @param {Object} options - 选项
   * @returns {Promise<Array>} 生命周期事件列表
   */
  async getLifecycleEvents(distributorId, options = {}) {
    try {
      return await channelMonitoringService.getChannelLifecycleEvents(distributorId, options)
    } catch (error) {
      console.error('❌ 获取生命周期事件失败:', error)
      throw error
    }
  }

  /**
   * 获取最近的渠道变更
   * @param {Object} options - 选项
   * @returns {Promise<Array>} 最近变更列表
   */
  async getRecentChanges(options = {}) {
    try {
      return await channelMonitoringService.getRecentChannelChanges(options)
    } catch (error) {
      console.error('❌ 获取最近变更失败:', error)
      throw error
    }
  }

  /**
   * 获取渠道趋势数据
   * @param {number} days - 天数
   * @returns {Promise<Array>} 趋势数据
   */
  async getChannelTrends(days = 30) {
    try {
      const cacheKey = `channel_trends_${days}`
      const cached = this.cache.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const trends = await channelMonitoringService.getChannelTrends(days)
      
      // 缓存趋势数据
      this.cache.set(cacheKey, trends, 15 * 60 * 1000) // 15分钟缓存
      
      return trends
    } catch (error) {
      console.error('❌ 获取渠道趋势失败:', error)
      throw error
    }
  }

  /**
   * 获取渠道生命周期统计
   * @returns {Promise<Object>} 生命周期统计
   */
  async getLifecycleStats() {
    try {
      const cacheKey = 'channel_lifecycle_stats'
      const cached = this.cache.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const stats = await channelMonitoringService.getChannelLifecycleStats()
      
      // 缓存统计数据
      this.cache.set(cacheKey, stats, 10 * 60 * 1000) // 10分钟缓存
      
      return stats
    } catch (error) {
      console.error('❌ 获取生命周期统计失败:', error)
      throw error
    }
  }

  /**
   * 获取渠道分布统计
   * @returns {Promise<Array>} 分布统计
   */
  async getDistributionStats() {
    try {
      const cacheKey = 'channel_distribution_stats'
      const cached = this.cache.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const stats = await channelMonitoringService.getChannelDistributionStats()
      
      // 缓存分布统计
      this.cache.set(cacheKey, stats, 10 * 60 * 1000) // 10分钟缓存
      
      return stats
    } catch (error) {
      console.error('❌ 获取分布统计失败:', error)
      throw error
    }
  }

  /**
   * 获取监控会话历史
   * @param {Object} options - 选项
   * @returns {Promise<Array>} 会话列表
   */
  async getMonitoringSessions(options = {}) {
    try {
      return await channelMonitoringService.getMonitoringSessions(options)
    } catch (error) {
      console.error('❌ 获取监控会话失败:', error)
      throw error
    }
  }

  /**
   * 获取最新监控会话
   * @returns {Promise<Object>} 最新会话
   */
  async getLatestSession() {
    try {
      return await channelMonitoringService.getLatestMonitoringSession()
    } catch (error) {
      console.error('❌ 获取最新会话失败:', error)
      throw error
    }
  }

  /**
   * 订阅渠道变更通知
   * @param {Function} callback - 回调函数
   * @param {Object} options - 选项
   * @returns {Function} 取消订阅函数
   */
  subscribeToChannelChanges(callback, options = {}) {
    return channelMonitoringService.subscribeToChannelChanges(callback, options)
  }

  /**
   * 订阅监控会话变更
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅函数
   */
  subscribeToSessionChanges(callback) {
    return channelMonitoringService.subscribeToSessionChanges(callback)
  }

  /**
   * 格式化渠道数据用于显示
   * @param {Object} channel - 渠道数据
   * @returns {Object} 格式化后的数据
   */
  formatChannelForDisplay(channel) {
    return channelMonitoringService.formatChannelForDisplay(channel)
  }

  /**
   * 获取渠道活动状态
   * @param {Object} channel - 渠道数据
   * @returns {string} 活动状态
   */
  getChannelActivityStatus(channel) {
    return channelMonitoringService.getActivityStatus(channel)
  }

  /**
   * 计算渠道生命周期
   * @param {Object} channel - 渠道数据
   * @returns {number} 生命周期天数
   */
  calculateChannelLifespan(channel) {
    return channelMonitoringService.calculateLifespan(channel)
  }

  // ====================================================================
  // 数据质量和健康检查
  // ====================================================================

  /**
   * 检查渠道数据质量
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 数据质量报告
   */
  async checkDataQuality(options = {}) {
    try {
      const {
        checkDuplicates = true,
        checkMissingFields = true,
        checkLocationAccuracy = true,
        checkContactInfo = true
      } = options

      const report = {
        totalRecords: 0,
        activeRecords: 0,
        issues: [],
        qualityScore: 0,
        timestamp: new Date()
      }

      // 获取所有分销商数据
      const distributors = await this.getAll({ activeOnly: false, limit: 10000 })
      report.totalRecords = distributors.length
      report.activeRecords = distributors.filter(d => d.is_active).length

      // 检查重复数据
      if (checkDuplicates) {
        const duplicateIds = new Set()
        const seenIds = new Set()
        
        distributors.forEach(d => {
          if (d.unifi_id) {
            if (seenIds.has(d.unifi_id)) {
              duplicateIds.add(d.unifi_id)
            } else {
              seenIds.add(d.unifi_id)
            }
          }
        })

        if (duplicateIds.size > 0) {
          report.issues.push({
            type: 'duplicates',
            count: duplicateIds.size,
            severity: 'high',
            message: `发现 ${duplicateIds.size} 个重复的 Unifi ID`
          })
        }
      }

      // 检查缺失字段
      if (checkMissingFields) {
        const missingFields = {
          name: 0,
          address: 0,
          unifi_id: 0,
          latitude: 0,
          longitude: 0
        }

        distributors.forEach(d => {
          if (!d.name) missingFields.name++
          if (!d.address) missingFields.address++
          if (!d.unifi_id) missingFields.unifi_id++
          if (!d.latitude) missingFields.latitude++
          if (!d.longitude) missingFields.longitude++
        })

        Object.entries(missingFields).forEach(([field, count]) => {
          if (count > 0) {
            report.issues.push({
              type: 'missing_field',
              field,
              count,
              severity: field === 'unifi_id' ? 'high' : 'medium',
              message: `${count} 条记录缺失 ${field} 字段`
            })
          }
        })
      }

      // 计算质量分数
      const totalPossibleIssues = distributors.length * 5 // 5个主要字段
      const actualIssues = report.issues.reduce((sum, issue) => sum + issue.count, 0)
      report.qualityScore = Math.max(0, (totalPossibleIssues - actualIssues) / totalPossibleIssues * 100)

      return report

    } catch (error) {
      console.error('❌ 数据质量检查失败:', error)
      throw error
    }
  }

  /**
   * 获取渠道健康状态
   * @returns {Promise<Object>} 健康状态报告
   */
  async getChannelHealthStatus() {
    try {
      const cacheKey = 'channel_health_status'
      const cached = this.cache.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const [lifecycleStats, distributionStats, recentChanges] = await Promise.all([
        this.getLifecycleStats(),
        this.getDistributionStats(),
        this.getRecentChanges({ days: 7, limit: 100 })
      ])

      const healthStatus = {
        overall: 'healthy',
        activeChannels: lifecycleStats.currently_active || 0,
        totalChannels: lifecycleStats.total_discovered || 0,
        recentlyDeactivated: recentChanges.filter(c => c.event_type === 'deactivated').length,
        recentlyAdded: recentChanges.filter(c => c.event_type === 'discovered').length,
        averageLifespan: lifecycleStats.average_lifespan_days || 0,
        coverage: {
          regions: distributionStats.length,
          countries: new Set(distributionStats.map(d => d.country_code)).size
        },
        alerts: [],
        timestamp: new Date()
      }

      // 健康状态评估
      const deactivationRate = healthStatus.recentlyDeactivated / healthStatus.activeChannels
      const additionRate = healthStatus.recentlyAdded / healthStatus.activeChannels

      if (deactivationRate > 0.05) { // 5%以上的失活率
        healthStatus.overall = 'warning'
        healthStatus.alerts.push({
          type: 'high_deactivation_rate',
          severity: 'warning',
          message: `过去7天内有 ${healthStatus.recentlyDeactivated} 个渠道失活`
        })
      }

      if (additionRate < 0.01) { // 1%以下的新增率
        healthStatus.alerts.push({
          type: 'low_addition_rate',
          severity: 'info',
          message: `过去7天内仅新增 ${healthStatus.recentlyAdded} 个渠道`
        })
      }

      if (healthStatus.averageLifespan < 30) { // 平均生命周期小于30天
        healthStatus.overall = 'warning'
        healthStatus.alerts.push({
          type: 'short_lifespan',
          severity: 'warning',
          message: `渠道平均生命周期仅 ${healthStatus.averageLifespan.toFixed(1)} 天`
        })
      }

      // 缓存健康状态
      this.cache.set(cacheKey, healthStatus, 15 * 60 * 1000) // 15分钟缓存

      return healthStatus

    } catch (error) {
      console.error('❌ 获取渠道健康状态失败:', error)
      throw error
    }
  }

  // ====================================================================
  // 向后兼容性增强
  // ====================================================================

  /**
   * 获取增强统计数据（兼容原有方法）
   * @param {string} companyId - 公司ID
   * @returns {Promise<Object>} 增强统计数据
   */
  async getEnhancedStatistics(companyId = null) {
    try {
      const [basicStats, lifecycleStats, distributionStats] = await Promise.all([
        this.getStatistics(companyId),
        this.getLifecycleStats(),
        this.getDistributionStats()
      ])

      return {
        ...basicStats,
        lifecycle: lifecycleStats,
        distribution: distributionStats,
        enhanced: true
      }

    } catch (error) {
      console.error('❌ 获取增强统计数据失败:', error)
      // 降级到基础统计
      return await this.getStatistics(companyId)
    }
  }
}

// 创建单例实例
export const distributorService = new DistributorService()

// 导出类供测试使用
export default DistributorService