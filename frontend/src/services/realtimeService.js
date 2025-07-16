/**
 * 实时数据服务
 * 负责管理 Supabase 实时订阅和推送
 */

import { supabase, realtimeManager } from './supabaseClient.js'

export class RealtimeService {
  constructor() {
    this.manager = realtimeManager
    this.activeSubscriptions = new Map()
    this.connectionStatus = 'disconnected'
    this.eventHandlers = new Map()
    
    // 监听连接状态
    this.initializeConnectionMonitoring()
  }

  /**
   * 初始化连接监控
   */
  initializeConnectionMonitoring() {
    // 监听WebSocket连接状态
    const channel = supabase.channel('system_status')
    
    channel.on('system', { event: 'connect' }, () => {
      this.connectionStatus = 'connected'
      console.log('🔗 实时连接已建立')
      this.emitEvent('connection_status', { status: 'connected' })
    })

    channel.on('system', { event: 'disconnect' }, () => {
      this.connectionStatus = 'disconnected'
      console.log('🔌 实时连接已断开')
      this.emitEvent('connection_status', { status: 'disconnected' })
    })

    channel.subscribe()
  }

  /**
   * 订阅竞争数据变更
   * @param {string} companyId - 公司 ID
   * @param {Function} callback - 回调函数
   * @returns {Object} 订阅对象
   */
  subscribeToCompetitiveData(companyId, callback) {
    const subscriptionKey = `competitive_data_${companyId}`
    
    if (this.activeSubscriptions.has(subscriptionKey)) {
      console.warn(`⚠️  已存在竞争数据订阅: ${companyId}`)
      return this.activeSubscriptions.get(subscriptionKey)
    }

    const subscription = this.manager.subscribe(
      'competitive_data',
      (payload) => {
        console.log('📊 竞争数据更新:', payload)
        
        // 只处理指定公司的数据
        if (payload.new?.company_id === companyId || payload.old?.company_id === companyId) {
          callback(payload)
          this.emitEvent('competitive_data_change', payload)
        }
      },
      `company_id=eq.${companyId}`
    )

    this.activeSubscriptions.set(subscriptionKey, subscription)
    console.log(`✅ 已订阅竞争数据: ${companyId}`)
    
    return subscription
  }

  /**
   * 订阅分销商数据变更
   * @param {string} companyId - 公司 ID
   * @param {Function} callback - 回调函数
   * @returns {Object} 订阅对象
   */
  subscribeToDistributors(companyId, callback) {
    const subscriptionKey = `distributors_${companyId}`
    
    if (this.activeSubscriptions.has(subscriptionKey)) {
      console.warn(`⚠️  已存在分销商数据订阅: ${companyId}`)
      return this.activeSubscriptions.get(subscriptionKey)
    }

    const subscription = this.manager.subscribe(
      'distributors',
      (payload) => {
        console.log('🏪 分销商数据更新:', payload)
        
        // 只处理指定公司的数据
        if (payload.new?.company_id === companyId || payload.old?.company_id === companyId) {
          callback(payload)
          this.emitEvent('distributor_change', payload)
        }
      },
      `company_id=eq.${companyId}`
    )

    this.activeSubscriptions.set(subscriptionKey, subscription)
    console.log(`✅ 已订阅分销商数据: ${companyId}`)
    
    return subscription
  }

  /**
   * 订阅财报数据变更
   * @param {string} companyId - 公司 ID
   * @param {Function} callback - 回调函数
   * @returns {Object} 订阅对象
   */
  subscribeToFinancialReports(companyId, callback) {
    const subscriptionKey = `financial_reports_${companyId}`
    
    if (this.activeSubscriptions.has(subscriptionKey)) {
      console.warn(`⚠️  已存在财报数据订阅: ${companyId}`)
      return this.activeSubscriptions.get(subscriptionKey)
    }

    const subscription = this.manager.subscribe(
      'financial_reports',
      (payload) => {
        console.log('📈 财报数据更新:', payload)
        
        // 只处理指定公司的数据
        if (payload.new?.company_id === companyId || payload.old?.company_id === companyId) {
          callback(payload)
          this.emitEvent('financial_report_change', payload)
        }
      },
      `company_id=eq.${companyId}`
    )

    this.activeSubscriptions.set(subscriptionKey, subscription)
    console.log(`✅ 已订阅财报数据: ${companyId}`)
    
    return subscription
  }

  /**
   * 订阅数据变更历史
   * @param {Function} callback - 回调函数
   * @returns {Object} 订阅对象
   */
  subscribeToDataChanges(callback) {
    const subscriptionKey = 'data_changes'
    
    if (this.activeSubscriptions.has(subscriptionKey)) {
      console.warn(`⚠️  已存在数据变更订阅`)
      return this.activeSubscriptions.get(subscriptionKey)
    }

    const subscription = this.manager.subscribe(
      'data_changes',
      (payload) => {
        console.log('📋 数据变更历史更新:', payload)
        callback(payload)
        this.emitEvent('data_change_history', payload)
      }
    )

    this.activeSubscriptions.set(subscriptionKey, subscription)
    console.log(`✅ 已订阅数据变更历史`)
    
    return subscription
  }

  /**
   * 订阅通知
   * @param {string} userId - 用户 ID
   * @param {Function} callback - 回调函数
   * @returns {Object} 订阅对象
   */
  subscribeToNotifications(userId, callback) {
    const subscriptionKey = `notifications_${userId}`
    
    if (this.activeSubscriptions.has(subscriptionKey)) {
      console.warn(`⚠️  已存在通知订阅: ${userId}`)
      return this.activeSubscriptions.get(subscriptionKey)
    }

    const subscription = this.manager.subscribe(
      'notifications',
      (payload) => {
        console.log('🔔 通知更新:', payload)
        
        // 只处理指定用户的通知
        if (payload.new?.user_id === userId || payload.old?.user_id === userId) {
          callback(payload)
          this.emitEvent('notification_change', payload)
        }
      },
      `user_id=eq.${userId}`
    )

    this.activeSubscriptions.set(subscriptionKey, subscription)
    console.log(`✅ 已订阅通知: ${userId}`)
    
    return subscription
  }

  /**
   * 订阅所有公司数据变更
   * @param {string} companyId - 公司 ID
   * @param {Function} callback - 回调函数
   * @returns {Array} 订阅对象数组
   */
  subscribeToAllCompanyData(companyId, callback) {
    const subscriptions = []
    
    // 订阅竞争数据
    subscriptions.push(this.subscribeToCompetitiveData(companyId, (payload) => {
      callback('competitive_data', payload)
    }))

    // 订阅分销商数据
    subscriptions.push(this.subscribeToDistributors(companyId, (payload) => {
      callback('distributors', payload)
    }))

    // 订阅财报数据
    subscriptions.push(this.subscribeToFinancialReports(companyId, (payload) => {
      callback('financial_reports', payload)
    }))

    console.log(`✅ 已订阅所有公司数据: ${companyId}`)
    return subscriptions
  }

  /**
   * 取消订阅
   * @param {string} subscriptionKey - 订阅键
   */
  unsubscribe(subscriptionKey) {
    if (this.activeSubscriptions.has(subscriptionKey)) {
      const subscription = this.activeSubscriptions.get(subscriptionKey)
      supabase.removeChannel(subscription)
      this.activeSubscriptions.delete(subscriptionKey)
      console.log(`🔕 已取消订阅: ${subscriptionKey}`)
    }
  }

  /**
   * 取消公司相关的所有订阅
   * @param {string} companyId - 公司 ID
   */
  unsubscribeFromCompany(companyId) {
    const companySubscriptions = Array.from(this.activeSubscriptions.keys())
      .filter(key => key.includes(companyId))
    
    companySubscriptions.forEach(key => {
      this.unsubscribe(key)
    })
    
    console.log(`🔕 已取消公司所有订阅: ${companyId}`)
  }

  /**
   * 取消所有订阅
   */
  unsubscribeAll() {
    this.manager.unsubscribeAll()
    this.activeSubscriptions.clear()
    console.log('🔕 已取消所有订阅')
  }

  /**
   * 获取连接状态
   * @returns {string} 连接状态
   */
  getConnectionStatus() {
    return this.connectionStatus
  }

  /**
   * 获取活跃订阅列表
   * @returns {Array} 活跃订阅数组
   */
  getActiveSubscriptions() {
    return Array.from(this.activeSubscriptions.keys())
  }

  /**
   * 添加事件处理器
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理器
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    
    this.eventHandlers.get(event).push(handler)
    console.log(`✅ 已添加事件处理器: ${event}`)
  }

  /**
   * 移除事件处理器
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理器
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event)
      const index = handlers.indexOf(handler)
      
      if (index > -1) {
        handlers.splice(index, 1)
        console.log(`🔕 已移除事件处理器: ${event}`)
      }
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {any} data - 事件数据
   */
  emitEvent(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`❌ 事件处理器错误 [${event}]:`, error)
        }
      })
    }
  }

  /**
   * 重连实时服务
   */
  reconnect() {
    console.log('🔄 重连实时服务...')
    
    // 保存当前订阅信息
    const currentSubscriptions = Array.from(this.activeSubscriptions.keys())
    
    // 取消所有订阅
    this.unsubscribeAll()
    
    // 重新建立连接
    this.initializeConnectionMonitoring()
    
    // 恢复订阅 (需要应用层面重新调用订阅方法)
    console.log('需要重新订阅以下服务:', currentSubscriptions)
    this.emitEvent('reconnect_required', { subscriptions: currentSubscriptions })
  }

  /**
   * 获取订阅统计信息
   * @returns {Object} 统计信息
   */
  getSubscriptionStats() {
    return {
      total: this.activeSubscriptions.size,
      active: this.getActiveSubscriptions(),
      connection_status: this.connectionStatus,
      event_handlers: Object.fromEntries(
        Array.from(this.eventHandlers.entries()).map(([event, handlers]) => 
          [event, handlers.length]
        )
      )
    }
  }
}

// 创建单例实例
export const realtimeService = new RealtimeService()

// 导出类供测试使用
export default RealtimeService