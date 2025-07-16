/**
 * Supabase 客户端配置
 * 用于连接和管理 Supabase 数据库
 */

import { createClient } from '@supabase/supabase-js'

// Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// 数据库连接状态检查
export const checkDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ 数据库连接失败:', error)
      return false
    }
    
    console.log('✅ 数据库连接成功')
    return true
  } catch (error) {
    console.error('❌ 数据库连接错误:', error)
    return false
  }
}

// 获取当前用户
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('❌ 获取用户信息失败:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('❌ 用户认证错误:', error)
    return null
  }
}

// 认证状态监听
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback)
}

// 实时订阅管理器
export class RealtimeManager {
  constructor() {
    this.subscriptions = new Map()
  }

  // 订阅表变更
  subscribe(tableName, callback, filter = null) {
    const subscriptionKey = `${tableName}_${filter || 'all'}`
    
    if (this.subscriptions.has(subscriptionKey)) {
      console.warn(`⚠️  已存在订阅: ${subscriptionKey}`)
      return
    }

    let subscription = supabase
      .channel(`${tableName}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: filter
        },
        (payload) => {
          console.log(`📡 实时更新 ${tableName}:`, payload)
          callback(payload)
        }
      )
      .subscribe()

    this.subscriptions.set(subscriptionKey, subscription)
    console.log(`✅ 订阅成功: ${subscriptionKey}`)
    
    return subscription
  }

  // 取消订阅
  unsubscribe(tableName, filter = null) {
    const subscriptionKey = `${tableName}_${filter || 'all'}`
    const subscription = this.subscriptions.get(subscriptionKey)
    
    if (subscription) {
      supabase.removeChannel(subscription)
      this.subscriptions.delete(subscriptionKey)
      console.log(`🔕 取消订阅: ${subscriptionKey}`)
    }
  }

  // 取消所有订阅
  unsubscribeAll() {
    this.subscriptions.forEach((subscription, key) => {
      supabase.removeChannel(subscription)
      console.log(`🔕 取消订阅: ${key}`)
    })
    this.subscriptions.clear()
  }
}

// 创建全局实时管理器实例
export const realtimeManager = new RealtimeManager()

// 错误处理工具
export const handleSupabaseError = (error, context = 'Unknown') => {
  console.error(`❌ Supabase 错误 [${context}]:`, error)
  
  if (error.code === 'PGRST116') {
    return '没有找到相关数据'
  } else if (error.code === 'PGRST301') {
    return '权限不足，无法访问数据'
  } else if (error.code === '23505') {
    return '数据已存在，无法重复创建'
  } else if (error.code === '23503') {
    return '数据引用错误，相关数据不存在'
  } else {
    return error.message || '未知错误'
  }
}

// 数据库查询构建器工具
export class QueryBuilder {
  constructor(tableName) {
    this.tableName = tableName
    this.query = supabase.from(tableName)
  }

  // 选择字段
  select(columns = '*') {
    this.query = this.query.select(columns)
    return this
  }

  // 过滤条件
  filter(column, operator, value) {
    this.query = this.query.filter(column, operator, value)
    return this
  }

  // 等于条件
  eq(column, value) {
    this.query = this.query.eq(column, value)
    return this
  }

  // 大于条件
  gt(column, value) {
    this.query = this.query.gt(column, value)
    return this
  }

  // 小于条件
  lt(column, value) {
    this.query = this.query.lt(column, value)
    return this
  }

  // 包含条件
  in(column, values) {
    this.query = this.query.in(column, values)
    return this
  }

  // 模糊匹配
  like(column, pattern) {
    this.query = this.query.like(column, pattern)
    return this
  }

  // 排序
  order(column, ascending = true) {
    this.query = this.query.order(column, { ascending })
    return this
  }

  // 限制数量
  limit(count) {
    this.query = this.query.limit(count)
    return this
  }

  // 分页
  range(from, to) {
    this.query = this.query.range(from, to)
    return this
  }

  // 执行查询
  async execute() {
    try {
      const { data, error } = await this.query
      
      if (error) {
        throw error
      }
      
      return data
    } catch (error) {
      const errorMessage = handleSupabaseError(error, `Query ${this.tableName}`)
      throw new Error(errorMessage)
    }
  }
}

// 缓存管理器
export class CacheManager {
  constructor() {
    this.cache = new Map()
    this.defaultTTL = 5 * 60 * 1000 // 5分钟
  }

  // 获取缓存
  get(key) {
    const cached = this.cache.get(key)
    
    if (!cached) {
      return null
    }
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  // 设置缓存
  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  // 删除缓存
  delete(key) {
    this.cache.delete(key)
  }

  // 清空缓存
  clear() {
    this.cache.clear()
  }

  // 获取缓存大小
  size() {
    return this.cache.size
  }
}

// 创建全局缓存管理器实例
export const cacheManager = new CacheManager()

// 导出默认配置
export default {
  supabase,
  checkDatabaseConnection,
  getCurrentUser,
  onAuthStateChange,
  realtimeManager,
  handleSupabaseError,
  QueryBuilder,
  cacheManager
}