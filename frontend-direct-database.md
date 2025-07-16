# 前端直连数据库技术实现方案
# Frontend Direct Database Connection Technical Implementation

## 1. 技术方案概述 / Technical Solution Overview

### 1.1 核心理念 / Core Concept

**中文**: 通过 Supabase 实现前端直接连接数据库，消除传统的后端 API 开发需求，提供类型安全的数据访问和实时数据同步。

**English**: Enable frontend direct database connection through Supabase, eliminating traditional backend API development requirements while providing type-safe data access and real-time data synchronization.

### 1.2 架构优势 / Architecture Advantages

- **零 API 开发**: 前端直接使用 Supabase 客户端
- **类型安全**: 自动生成 TypeScript 类型定义
- **实时同步**: WebSocket 实时数据订阅
- **行级安全**: 数据库层面的权限控制
- **开发效率**: 快速迭代，减少前后端协调

## 2. Supabase 客户端配置 / Supabase Client Configuration

### 2.1 基础配置 / Basic Configuration

```typescript
// src/services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  }
})

// 类型安全的表引用
export const tables = {
  companies: () => supabase.from('companies'),
  competitive_data: () => supabase.from('competitive_data'),
  data_categories: () => supabase.from('data_categories'),
  data_types: () => supabase.from('data_types'),
  data_changes: () => supabase.from('data_changes'),
  notifications: () => supabase.from('notifications'),
  users: () => supabase.from('users'),
  user_company_access: () => supabase.from('user_company_access'),
  user_category_permissions: () => supabase.from('user_category_permissions')
} as const
```

### 2.2 类型定义生成 / Type Definition Generation

```bash
# 生成 TypeScript 类型定义
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/types/database.ts
```

```typescript
// src/types/database.ts (自动生成)
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          display_name: string | null
          industry: string | null
          founded_date: string | null
          headquarters: string | null
          website: string | null
          ticker_symbol: string | null
          status: 'active' | 'inactive' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name?: string | null
          industry?: string | null
          founded_date?: string | null
          headquarters?: string | null
          website?: string | null
          ticker_symbol?: string | null
          status?: 'active' | 'inactive' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string | null
          industry?: string | null
          founded_date?: string | null
          headquarters?: string | null
          website?: string | null
          ticker_symbol?: string | null
          status?: 'active' | 'inactive' | 'archived'
          updated_at?: string
        }
      }
      competitive_data: {
        Row: {
          id: string
          company_id: string
          category_id: string
          data_type_id: string
          data_source: string
          raw_data: any
          processed_data: any | null
          confidence_score: number
          quality_score: number
          collected_at: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          category_id: string
          data_type_id: string
          data_source: string
          raw_data: any
          processed_data?: any | null
          confidence_score?: number
          quality_score?: number
          collected_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          category_id?: string
          data_type_id?: string
          data_source?: string
          raw_data?: any
          processed_data?: any | null
          confidence_score?: number
          quality_score?: number
          collected_at?: string
        }
      }
      // ... 其他表定义
    }
    Views: {
      // 视图定义
    }
    Functions: {
      // 函数定义
    }
    Enums: {
      company_status: 'active' | 'inactive' | 'archived'
      change_type_enum: 'created' | 'updated' | 'deleted' | 'restored' | 'archived'
      notification_type: 'data_change' | 'system_alert' | 'task_completion' | 'quality_issue'
    }
  }
}
```

## 3. 数据服务层设计 / Data Service Layer Design

### 3.1 通用数据服务 / Generic Data Service

```typescript
// src/services/baseDataService.ts
import { PostgrestError, PostgrestResponse } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import type { Database } from '../types/database'

export class BaseDataService<T extends keyof Database['public']['Tables']> {
  protected tableName: T
  protected table: ReturnType<typeof supabase.from<T>>

  constructor(tableName: T) {
    this.tableName = tableName
    this.table = supabase.from(tableName)
  }

  // 获取所有记录
  async getAll(options: {
    select?: string
    filters?: Record<string, any>
    orderBy?: { column: string; ascending?: boolean }
    limit?: number
    offset?: number
  } = {}) {
    try {
      let query = this.table.select(options.select || '*')

      // 应用过滤条件
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      // 应用排序
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        })
      }

      // 应用分页
      if (options.limit) {
        query = query.limit(options.limit)
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error } = await query
      
      if (error) throw error
      return data
    } catch (error) {
      console.error(`Error fetching ${this.tableName}:`, error)
      throw error
    }
  }

  // 根据ID获取记录
  async getById(id: string, select?: string) {
    try {
      const { data, error } = await this.table
        .select(select || '*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error(`Error fetching ${this.tableName} by ID:`, error)
      throw error
    }
  }

  // 创建记录
  async create(data: Database['public']['Tables'][T]['Insert']) {
    try {
      const { data: newData, error } = await this.table
        .insert(data)
        .select()
        .single()

      if (error) throw error
      return newData
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error)
      throw error
    }
  }

  // 更新记录
  async update(id: string, data: Database['public']['Tables'][T]['Update']) {
    try {
      const { data: updatedData, error } = await this.table
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return updatedData
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error)
      throw error
    }
  }

  // 删除记录
  async delete(id: string) {
    try {
      const { error } = await this.table
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error)
      throw error
    }
  }

  // 批量创建
  async batchCreate(data: Database['public']['Tables'][T]['Insert'][]) {
    try {
      const { data: newData, error } = await this.table
        .insert(data)
        .select()

      if (error) throw error
      return newData
    } catch (error) {
      console.error(`Error batch creating ${this.tableName}:`, error)
      throw error
    }
  }

  // 批量更新
  async batchUpdate(updates: Array<{ id: string; data: Database['public']['Tables'][T]['Update'] }>) {
    try {
      const promises = updates.map(({ id, data }) => this.update(id, data))
      return await Promise.all(promises)
    } catch (error) {
      console.error(`Error batch updating ${this.tableName}:`, error)
      throw error
    }
  }

  // 计数
  async count(filters?: Record<string, any>) {
    try {
      let query = this.table.select('*', { count: 'exact', head: true })

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      const { count, error } = await query
      
      if (error) throw error
      return count || 0
    } catch (error) {
      console.error(`Error counting ${this.tableName}:`, error)
      throw error
    }
  }

  // 分页查询
  async paginate(options: {
    page: number
    pageSize: number
    select?: string
    filters?: Record<string, any>
    orderBy?: { column: string; ascending?: boolean }
  }) {
    const { page, pageSize, ...queryOptions } = options
    const offset = (page - 1) * pageSize

    try {
      // 获取总数
      const totalCount = await this.count(options.filters)
      
      // 获取数据
      const data = await this.getAll({
        ...queryOptions,
        limit: pageSize,
        offset
      })

      return {
        data,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
          hasNextPage: page < Math.ceil(totalCount / pageSize),
          hasPreviousPage: page > 1
        }
      }
    } catch (error) {
      console.error(`Error paginating ${this.tableName}:`, error)
      throw error
    }
  }
}
```

### 3.2 竞品数据服务 / Competitive Data Service

```typescript
// src/services/competitiveDataService.ts
import { BaseDataService } from './baseDataService'
import { supabase } from './supabaseClient'
import type { Database } from '../types/database'

type CompetitiveData = Database['public']['Tables']['competitive_data']['Row']
type CompetitiveDataInsert = Database['public']['Tables']['competitive_data']['Insert']

export class CompetitiveDataService extends BaseDataService<'competitive_data'> {
  constructor() {
    super('competitive_data')
  }

  // 获取公司的竞品数据
  async getByCompany(companyId: string, options: {
    categoryId?: string
    dataTypeId?: string
    dateRange?: { start: string; end: string }
    limit?: number
    includeRelated?: boolean
  } = {}) {
    try {
      let query = this.table
        .select(options.includeRelated ? `
          *,
          companies(*),
          data_categories(*),
          data_types(*)
        ` : '*')
        .eq('company_id', companyId)
        .eq('is_active', true)

      if (options.categoryId) {
        query = query.eq('category_id', options.categoryId)
      }

      if (options.dataTypeId) {
        query = query.eq('data_type_id', options.dataTypeId)
      }

      if (options.dateRange) {
        query = query
          .gte('collected_at', options.dateRange.start)
          .lte('collected_at', options.dateRange.end)
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      query = query.order('collected_at', { ascending: false })

      const { data, error } = await query
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching competitive data by company:', error)
      throw error
    }
  }

  // 获取数据变化
  async getDataChanges(companyId: string, options: {
    significanceThreshold?: number
    limit?: number
    dateRange?: { start: string; end: string }
  } = {}) {
    try {
      let query = supabase
        .from('data_changes')
        .select(`
          *,
          competitive_data!inner(
            company_id,
            companies(name),
            data_categories(display_name_zh, display_name_en),
            data_types(display_name_zh, display_name_en)
          )
        `)
        .eq('competitive_data.company_id', companyId)

      if (options.significanceThreshold) {
        query = query.gte('significance_score', options.significanceThreshold)
      }

      if (options.dateRange) {
        query = query
          .gte('changed_at', options.dateRange.start)
          .lte('changed_at', options.dateRange.end)
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      query = query.order('changed_at', { ascending: false })

      const { data, error } = await query
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching data changes:', error)
      throw error
    }
  }

  // 跨维度分析
  async getCrossDimensionAnalysis(companyId: string, options: {
    dimensionIds: string[]
    dateRange: { start: string; end: string }
    aggregationType?: 'daily' | 'weekly' | 'monthly'
  }) {
    try {
      // 使用 Supabase 的 RPC 功能调用数据库函数
      const { data, error } = await supabase
        .rpc('get_cross_dimension_analysis', {
          company_id: companyId,
          dimension_ids: options.dimensionIds,
          start_date: options.dateRange.start,
          end_date: options.dateRange.end,
          aggregation_type: options.aggregationType || 'daily'
        })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching cross-dimension analysis:', error)
      throw error
    }
  }

  // 获取质量评分统计
  async getQualityMetrics(companyId: string, categoryId?: string) {
    try {
      let query = this.table
        .select('quality_score, confidence_score, collected_at')
        .eq('company_id', companyId)
        .eq('is_active', true)

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      const { data, error } = await query
      
      if (error) throw error

      // 计算质量指标
      const metrics = {
        averageQuality: data.reduce((sum, item) => sum + item.quality_score, 0) / data.length,
        averageConfidence: data.reduce((sum, item) => sum + item.confidence_score, 0) / data.length,
        totalDataPoints: data.length,
        qualityTrend: this.calculateTrend(data.map(item => ({
          value: item.quality_score,
          timestamp: item.collected_at
        })))
      }

      return metrics
    } catch (error) {
      console.error('Error fetching quality metrics:', error)
      throw error
    }
  }

  // 搜索数据
  async search(query: string, options: {
    companyId?: string
    categoryId?: string
    limit?: number
  } = {}) {
    try {
      let searchQuery = this.table
        .select(`
          *,
          companies(*),
          data_categories(*),
          data_types(*)
        `)
        .textSearch('processed_data', query)

      if (options.companyId) {
        searchQuery = searchQuery.eq('company_id', options.companyId)
      }

      if (options.categoryId) {
        searchQuery = searchQuery.eq('category_id', options.categoryId)
      }

      if (options.limit) {
        searchQuery = searchQuery.limit(options.limit)
      }

      searchQuery = searchQuery.order('collected_at', { ascending: false })

      const { data, error } = await searchQuery
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error searching competitive data:', error)
      throw error
    }
  }

  // 计算趋势
  private calculateTrend(data: Array<{ value: number; timestamp: string }>) {
    if (data.length < 2) return 0

    const sortedData = data.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    const firstValue = sortedData[0].value
    const lastValue = sortedData[sortedData.length - 1].value

    return (lastValue - firstValue) / firstValue
  }
}
```

### 3.3 公司数据服务 / Company Data Service

```typescript
// src/services/companyService.ts
import { BaseDataService } from './baseDataService'
import { supabase } from './supabaseClient'
import type { Database } from '../types/database'

type Company = Database['public']['Tables']['companies']['Row']
type CompanyInsert = Database['public']['Tables']['companies']['Insert']

export class CompanyService extends BaseDataService<'companies'> {
  constructor() {
    super('companies')
  }

  // 获取用户有权限的公司
  async getAuthorizedCompanies(userId?: string) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          user_company_access!inner(
            access_level,
            is_active
          )
        `)
        .eq('user_company_access.user_id', userId || supabase.auth.user()?.id)
        .eq('user_company_access.is_active', true)
        .eq('status', 'active')

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching authorized companies:', error)
      throw error
    }
  }

  // 获取公司详细信息
  async getCompanyDetails(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          competitive_data(
            count
          ),
          data_categories(
            id,
            name,
            display_name_zh,
            display_name_en,
            competitive_data(count)
          )
        `)
        .eq('id', companyId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching company details:', error)
      throw error
    }
  }

  // 获取公司统计信息
  async getCompanyStatistics(companyId: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_company_statistics', {
          company_id: companyId
        })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching company statistics:', error)
      throw error
    }
  }

  // 搜索公司
  async searchCompanies(query: string, options: {
    industry?: string
    status?: string
    limit?: number
  } = {}) {
    try {
      let searchQuery = this.table
        .select('*')
        .or(`name.ilike.%${query}%,display_name.ilike.%${query}%`)

      if (options.industry) {
        searchQuery = searchQuery.eq('industry', options.industry)
      }

      if (options.status) {
        searchQuery = searchQuery.eq('status', options.status)
      }

      if (options.limit) {
        searchQuery = searchQuery.limit(options.limit)
      }

      searchQuery = searchQuery.order('name')

      const { data, error } = await searchQuery
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error searching companies:', error)
      throw error
    }
  }

  // 获取行业分组
  async getIndustryGroups() {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('industry')
        .not('industry', 'is', null)
        .eq('status', 'active')

      if (error) throw error

      // 计算每个行业的公司数量
      const industryGroups = data.reduce((acc: Record<string, number>, company) => {
        if (company.industry) {
          acc[company.industry] = (acc[company.industry] || 0) + 1
        }
        return acc
      }, {})

      return Object.entries(industryGroups).map(([industry, count]) => ({
        industry,
        count
      }))
    } catch (error) {
      console.error('Error fetching industry groups:', error)
      throw error
    }
  }
}
```

## 4. 实时数据订阅 / Real-time Data Subscription

### 4.1 实时服务设计 / Real-time Service Design

```typescript
// src/services/realtimeService.ts
import { supabase } from './supabaseClient'
import { RealtimeChannel } from '@supabase/supabase-js'
import type { Database } from '../types/database'

export class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map()
  private subscriptions: Map<string, Array<(payload: any) => void>> = new Map()

  // 订阅竞品数据变化
  subscribeToCompetitiveData(
    companyId: string,
    callback: (payload: any) => void,
    options: {
      categoryId?: string
      dataTypeId?: string
    } = {}
  ) {
    const channelName = `competitive-data-${companyId}`
    
    let channel = this.channels.get(channelName)
    
    if (!channel) {
      channel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'competitive_data',
          filter: `company_id=eq.${companyId}`
        }, (payload) => {
          this.handleCompetitiveDataChange(payload, companyId)
        })
        .subscribe()
      
      this.channels.set(channelName, channel)
    }

    // 添加回调函数
    const callbacks = this.subscriptions.get(channelName) || []
    callbacks.push(callback)
    this.subscriptions.set(channelName, callbacks)

    // 返回取消订阅的函数
    return () => {
      const callbacks = this.subscriptions.get(channelName) || []
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
      
      // 如果没有更多回调，取消订阅
      if (callbacks.length === 0) {
        channel?.unsubscribe()
        this.channels.delete(channelName)
        this.subscriptions.delete(channelName)
      }
    }
  }

  // 订阅数据变化
  subscribeToDataChanges(
    companyId: string,
    callback: (payload: any) => void,
    options: {
      significanceThreshold?: number
    } = {}
  ) {
    const channelName = `data-changes-${companyId}`
    
    let channel = this.channels.get(channelName)
    
    if (!channel) {
      channel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'data_changes'
        }, (payload) => {
          this.handleDataChange(payload, companyId, options.significanceThreshold)
        })
        .subscribe()
      
      this.channels.set(channelName, channel)
    }

    // 添加回调函数
    const callbacks = this.subscriptions.get(channelName) || []
    callbacks.push(callback)
    this.subscriptions.set(channelName, callbacks)

    // 返回取消订阅的函数
    return () => {
      const callbacks = this.subscriptions.get(channelName) || []
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
      
      if (callbacks.length === 0) {
        channel?.unsubscribe()
        this.channels.delete(channelName)
        this.subscriptions.delete(channelName)
      }
    }
  }

  // 订阅通知
  subscribeToNotifications(
    userId: string,
    callback: (payload: any) => void
  ) {
    const channelName = `notifications-${userId}`
    
    let channel = this.channels.get(channelName)
    
    if (!channel) {
      channel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          this.handleNotification(payload, userId)
        })
        .subscribe()
      
      this.channels.set(channelName, channel)
    }

    const callbacks = this.subscriptions.get(channelName) || []
    callbacks.push(callback)
    this.subscriptions.set(channelName, callbacks)

    return () => {
      const callbacks = this.subscriptions.get(channelName) || []
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
      
      if (callbacks.length === 0) {
        channel?.unsubscribe()
        this.channels.delete(channelName)
        this.subscriptions.delete(channelName)
      }
    }
  }

  // 处理竞品数据变化
  private async handleCompetitiveDataChange(payload: any, companyId: string) {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    // 获取相关的公司和分类信息
    const enrichedPayload = await this.enrichPayload(payload, companyId)
    
    // 通知所有订阅者
    const channelName = `competitive-data-${companyId}`
    const callbacks = this.subscriptions.get(channelName) || []
    
    callbacks.forEach(callback => {
      callback({
        type: 'competitive_data_change',
        event: eventType,
        data: enrichedPayload,
        timestamp: new Date()
      })
    })
  }

  // 处理数据变化
  private async handleDataChange(payload: any, companyId: string, significanceThreshold?: number) {
    const { new: newRecord } = payload
    
    // 检查重要性阈值
    if (significanceThreshold && newRecord.significance_score < significanceThreshold) {
      return
    }

    // 获取相关的竞品数据信息
    const { data: competitiveData } = await supabase
      .from('competitive_data')
      .select(`
        *,
        companies(*),
        data_categories(*),
        data_types(*)
      `)
      .eq('id', newRecord.data_id)
      .single()

    if (competitiveData && competitiveData.companies.id === companyId) {
      const channelName = `data-changes-${companyId}`
      const callbacks = this.subscriptions.get(channelName) || []
      
      callbacks.forEach(callback => {
        callback({
          type: 'data_change',
          change: newRecord,
          data: competitiveData,
          timestamp: new Date()
        })
      })
    }
  }

  // 处理通知
  private handleNotification(payload: any, userId: string) {
    const { new: newRecord } = payload
    
    const channelName = `notifications-${userId}`
    const callbacks = this.subscriptions.get(channelName) || []
    
    callbacks.forEach(callback => {
      callback({
        type: 'notification',
        notification: newRecord,
        timestamp: new Date()
      })
    })
  }

  // 丰富 payload 数据
  private async enrichPayload(payload: any, companyId: string) {
    const { new: newRecord } = payload
    
    if (!newRecord) return payload

    try {
      // 获取相关的公司、分类和数据类型信息
      const { data: enrichedData } = await supabase
        .from('competitive_data')
        .select(`
          *,
          companies(*),
          data_categories(*),
          data_types(*)
        `)
        .eq('id', newRecord.id)
        .single()

      return {
        ...payload,
        enriched_data: enrichedData
      }
    } catch (error) {
      console.error('Error enriching payload:', error)
      return payload
    }
  }

  // 取消所有订阅
  unsubscribeAll() {
    this.channels.forEach(channel => {
      channel.unsubscribe()
    })
    this.channels.clear()
    this.subscriptions.clear()
  }

  // 获取连接状态
  getConnectionStatus() {
    return {
      connected: supabase.realtime.isConnected(),
      channels: Array.from(this.channels.keys()),
      subscriptions: Array.from(this.subscriptions.keys())
    }
  }
}

// 单例模式
export const realtimeService = new RealtimeService()
```

### 4.2 Vue 组合式函数集成 / Vue Composables Integration

```typescript
// src/composables/useCompetitiveData.ts
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { CompetitiveDataService } from '../services/competitiveDataService'
import { realtimeService } from '../services/realtimeService'

export function useCompetitiveData(companyId: string, options: {
  categoryId?: string
  dataTypeId?: string
  autoRefresh?: boolean
  realtimeUpdates?: boolean
} = {}) {
  const competitiveDataService = new CompetitiveDataService()
  
  // 响应式数据
  const data = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  // 加载数据
  const loadData = async () => {
    loading.value = true
    error.value = null
    
    try {
      const result = await competitiveDataService.getByCompany(companyId, {
        categoryId: options.categoryId,
        dataTypeId: options.dataTypeId,
        includeRelated: true
      })
      
      data.value = result
      lastUpdated.value = new Date()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  // 刷新数据
  const refresh = () => {
    loadData()
  }

  // 计算属性
  const dataByCategory = computed(() => {
    return data.value.reduce((acc, item) => {
      const categoryName = item.data_categories?.name || 'unknown'
      if (!acc[categoryName]) {
        acc[categoryName] = []
      }
      acc[categoryName].push(item)
      return acc
    }, {} as Record<string, any[]>)
  })

  const qualityMetrics = computed(() => {
    if (data.value.length === 0) return null
    
    const totalQuality = data.value.reduce((sum, item) => sum + item.quality_score, 0)
    const totalConfidence = data.value.reduce((sum, item) => sum + item.confidence_score, 0)
    
    return {
      averageQuality: totalQuality / data.value.length,
      averageConfidence: totalConfidence / data.value.length,
      totalDataPoints: data.value.length
    }
  })

  // 实时更新
  let unsubscribe: (() => void) | null = null
  
  if (options.realtimeUpdates) {
    unsubscribe = realtimeService.subscribeToCompetitiveData(
      companyId,
      (payload) => {
        // 处理实时更新
        if (payload.event === 'INSERT') {
          data.value.unshift(payload.enriched_data)
        } else if (payload.event === 'UPDATE') {
          const index = data.value.findIndex(item => item.id === payload.enriched_data.id)
          if (index > -1) {
            data.value[index] = payload.enriched_data
          }
        } else if (payload.event === 'DELETE') {
          data.value = data.value.filter(item => item.id !== payload.enriched_data.id)
        }
        
        lastUpdated.value = new Date()
      },
      {
        categoryId: options.categoryId,
        dataTypeId: options.dataTypeId
      }
    )
  }

  // 生命周期
  onMounted(() => {
    loadData()
  })

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
    }
  })

  return {
    data,
    loading,
    error,
    lastUpdated,
    dataByCategory,
    qualityMetrics,
    refresh,
    loadData
  }
}
```

### 4.3 数据变化监控组合式函数 / Data Change Monitoring Composable

```typescript
// src/composables/useDataChanges.ts
import { ref, onMounted, onUnmounted } from 'vue'
import { CompetitiveDataService } from '../services/competitiveDataService'
import { realtimeService } from '../services/realtimeService'

export function useDataChanges(companyId: string, options: {
  significanceThreshold?: number
  autoRefresh?: boolean
  realtimeUpdates?: boolean
} = {}) {
  const competitiveDataService = new CompetitiveDataService()
  
  // 响应式数据
  const changes = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const unreadCount = ref(0)

  // 加载数据变化
  const loadChanges = async () => {
    loading.value = true
    error.value = null
    
    try {
      const result = await competitiveDataService.getDataChanges(companyId, {
        significanceThreshold: options.significanceThreshold,
        limit: 100
      })
      
      changes.value = result
      unreadCount.value = result.filter(change => !change.is_read).length
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  // 标记为已读
  const markAsRead = async (changeId: string) => {
    try {
      await supabase
        .from('data_changes')
        .update({ is_read: true })
        .eq('id', changeId)
      
      // 更新本地状态
      const change = changes.value.find(c => c.id === changeId)
      if (change && !change.is_read) {
        change.is_read = true
        unreadCount.value--
      }
    } catch (err) {
      console.error('Error marking change as read:', err)
    }
  }

  // 全部标记为已读
  const markAllAsRead = async () => {
    try {
      const unreadChanges = changes.value.filter(change => !change.is_read)
      
      if (unreadChanges.length > 0) {
        await supabase
          .from('data_changes')
          .update({ is_read: true })
          .in('id', unreadChanges.map(c => c.id))
        
        // 更新本地状态
        changes.value.forEach(change => {
          if (!change.is_read) {
            change.is_read = true
          }
        })
        unreadCount.value = 0
      }
    } catch (err) {
      console.error('Error marking all changes as read:', err)
    }
  }

  // 实时更新
  let unsubscribe: (() => void) | null = null
  
  if (options.realtimeUpdates) {
    unsubscribe = realtimeService.subscribeToDataChanges(
      companyId,
      (payload) => {
        // 添加新的变化到列表顶部
        changes.value.unshift(payload.change)
        unreadCount.value++
      },
      {
        significanceThreshold: options.significanceThreshold
      }
    )
  }

  // 生命周期
  onMounted(() => {
    loadChanges()
  })

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
    }
  })

  return {
    changes,
    loading,
    error,
    unreadCount,
    loadChanges,
    markAsRead,
    markAllAsRead
  }
}
```

## 5. 状态管理集成 / State Management Integration

### 5.1 Pinia Store 设计 / Pinia Store Design

```typescript
// src/stores/competitiveIntelligence.ts
import { defineStore } from 'pinia'
import { CompetitiveDataService } from '../services/competitiveDataService'
import { CompanyService } from '../services/companyService'
import { realtimeService } from '../services/realtimeService'

interface CompetitiveIntelligenceState {
  companies: any[]
  selectedCompany: any | null
  competitiveData: any[]
  dataChanges: any[]
  dataCategories: any[]
  loading: boolean
  error: string | null
  filters: {
    dateRange: { start: string; end: string }
    categoryIds: string[]
    dataTypeIds: string[]
    significanceThreshold: number
  }
  realtimeSubscriptions: Map<string, () => void>
}

export const useCompetitiveIntelligenceStore = defineStore('competitiveIntelligence', {
  state: (): CompetitiveIntelligenceState => ({
    companies: [],
    selectedCompany: null,
    competitiveData: [],
    dataChanges: [],
    dataCategories: [],
    loading: false,
    error: null,
    filters: {
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      },
      categoryIds: [],
      dataTypeIds: [],
      significanceThreshold: 0.5
    },
    realtimeSubscriptions: new Map()
  }),

  getters: {
    // 过滤后的竞品数据
    filteredCompetitiveData: (state) => {
      return state.competitiveData.filter(item => {
        const matchesDateRange = new Date(item.collected_at) >= new Date(state.filters.dateRange.start) &&
                                new Date(item.collected_at) <= new Date(state.filters.dateRange.end)
        
        const matchesCategory = state.filters.categoryIds.length === 0 ||
                               state.filters.categoryIds.includes(item.category_id)
        
        const matchesDataType = state.filters.dataTypeIds.length === 0 ||
                               state.filters.dataTypeIds.includes(item.data_type_id)
        
        return matchesDateRange && matchesCategory && matchesDataType
      })
    },

    // 重要的数据变化
    significantChanges: (state) => {
      return state.dataChanges.filter(change => 
        change.significance_score >= state.filters.significanceThreshold
      )
    },

    // 按分类分组的数据
    dataByCategory: (state) => {
      return state.competitiveData.reduce((acc, item) => {
        const categoryName = item.data_categories?.name || 'unknown'
        if (!acc[categoryName]) {
          acc[categoryName] = []
        }
        acc[categoryName].push(item)
        return acc
      }, {} as Record<string, any[]>)
    },

    // 数据质量指标
    qualityMetrics: (state) => {
      if (state.competitiveData.length === 0) {
        return {
          averageQuality: 0,
          averageConfidence: 0,
          totalDataPoints: 0
        }
      }

      const totalQuality = state.competitiveData.reduce((sum, item) => sum + item.quality_score, 0)
      const totalConfidence = state.competitiveData.reduce((sum, item) => sum + item.confidence_score, 0)

      return {
        averageQuality: totalQuality / state.competitiveData.length,
        averageConfidence: totalConfidence / state.competitiveData.length,
        totalDataPoints: state.competitiveData.length
      }
    }
  },

  actions: {
    // 初始化
    async initialize() {
      this.loading = true
      this.error = null

      try {
        await Promise.all([
          this.fetchCompanies(),
          this.fetchDataCategories()
        ])
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Initialization failed'
      } finally {
        this.loading = false
      }
    },

    // 获取公司列表
    async fetchCompanies() {
      const companyService = new CompanyService()
      
      try {
        this.companies = await companyService.getAuthorizedCompanies()
      } catch (error) {
        throw new Error(`Failed to fetch companies: ${error}`)
      }
    },

    // 获取数据分类
    async fetchDataCategories() {
      try {
        const { data, error } = await supabase
          .from('data_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order')

        if (error) throw error
        this.dataCategories = data
      } catch (error) {
        throw new Error(`Failed to fetch data categories: ${error}`)
      }
    },

    // 选择公司
    async selectCompany(companyId: string) {
      const company = this.companies.find(c => c.id === companyId)
      if (!company) {
        throw new Error('Company not found')
      }

      this.selectedCompany = company
      
      // 取消之前的订阅
      this.unsubscribeAll()
      
      // 获取竞品数据
      await this.fetchCompetitiveData(companyId)
      
      // 获取数据变化
      await this.fetchDataChanges(companyId)
      
      // 设置实时订阅
      this.setupRealtimeSubscriptions(companyId)
    },

    // 获取竞品数据
    async fetchCompetitiveData(companyId: string) {
      const competitiveDataService = new CompetitiveDataService()
      
      try {
        this.competitiveData = await competitiveDataService.getByCompany(companyId, {
          dateRange: this.filters.dateRange,
          includeRelated: true
        })
      } catch (error) {
        throw new Error(`Failed to fetch competitive data: ${error}`)
      }
    },

    // 获取数据变化
    async fetchDataChanges(companyId: string) {
      const competitiveDataService = new CompetitiveDataService()
      
      try {
        this.dataChanges = await competitiveDataService.getDataChanges(companyId, {
          significanceThreshold: this.filters.significanceThreshold,
          dateRange: this.filters.dateRange
        })
      } catch (error) {
        throw new Error(`Failed to fetch data changes: ${error}`)
      }
    },

    // 设置实时订阅
    setupRealtimeSubscriptions(companyId: string) {
      // 订阅竞品数据变化
      const dataUnsubscribe = realtimeService.subscribeToCompetitiveData(
        companyId,
        (payload) => {
          this.handleRealtimeDataUpdate(payload)
        }
      )

      // 订阅数据变化
      const changesUnsubscribe = realtimeService.subscribeToDataChanges(
        companyId,
        (payload) => {
          this.handleRealtimeChangeUpdate(payload)
        },
        {
          significanceThreshold: this.filters.significanceThreshold
        }
      )

      this.realtimeSubscriptions.set('data', dataUnsubscribe)
      this.realtimeSubscriptions.set('changes', changesUnsubscribe)
    },

    // 处理实时数据更新
    handleRealtimeDataUpdate(payload: any) {
      if (payload.event === 'INSERT') {
        this.competitiveData.unshift(payload.enriched_data)
      } else if (payload.event === 'UPDATE') {
        const index = this.competitiveData.findIndex(item => item.id === payload.enriched_data.id)
        if (index > -1) {
          this.competitiveData[index] = payload.enriched_data
        }
      } else if (payload.event === 'DELETE') {
        this.competitiveData = this.competitiveData.filter(item => item.id !== payload.enriched_data.id)
      }
    },

    // 处理实时变化更新
    handleRealtimeChangeUpdate(payload: any) {
      this.dataChanges.unshift(payload.change)
    },

    // 更新过滤器
    updateFilters(newFilters: Partial<typeof this.filters>) {
      this.filters = { ...this.filters, ...newFilters }
      
      // 如果选择了公司，重新获取数据
      if (this.selectedCompany) {
        this.fetchCompetitiveData(this.selectedCompany.id)
        this.fetchDataChanges(this.selectedCompany.id)
      }
    },

    // 取消所有订阅
    unsubscribeAll() {
      this.realtimeSubscriptions.forEach(unsubscribe => {
        unsubscribe()
      })
      this.realtimeSubscriptions.clear()
    },

    // 清除错误
    clearError() {
      this.error = null
    }
  }
})
```

## 6. 错误处理和类型安全 / Error Handling and Type Safety

### 6.1 错误处理包装器 / Error Handling Wrapper

```typescript
// src/utils/errorHandler.ts
import { PostgrestError } from '@supabase/supabase-js'

export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

export class DatabaseError extends Error {
  public code: string
  public details?: any
  public timestamp: Date

  constructor(error: PostgrestError | Error, context?: string) {
    super(error.message)
    this.name = 'DatabaseError'
    this.code = 'code' in error ? error.code : 'UNKNOWN_ERROR'
    this.details = 'details' in error ? error.details : undefined
    this.timestamp = new Date()
    
    if (context) {
      this.message = `${context}: ${this.message}`
    }
  }
}

export function handleDatabaseError(error: PostgrestError | Error, context?: string): never {
  console.error('Database error:', error, context)
  throw new DatabaseError(error, context)
}

export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error
      }
      throw new DatabaseError(error as Error, context)
    }
  }
}
```

### 6.2 类型安全的查询构建器 / Type-safe Query Builder

```typescript
// src/utils/queryBuilder.ts
import type { Database } from '../types/database'
import { supabase } from '../services/supabaseClient'

type TableName = keyof Database['public']['Tables']
type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row']
type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert']
type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update']

export class TypeSafeQueryBuilder<T extends TableName> {
  private tableName: T
  private query: any

  constructor(tableName: T) {
    this.tableName = tableName
    this.query = supabase.from(tableName)
  }

  select<K extends keyof TableRow<T>>(columns: K[] | '*' = '*') {
    if (columns === '*') {
      this.query = this.query.select('*')
    } else {
      this.query = this.query.select(columns.join(','))
    }
    return this
  }

  where<K extends keyof TableRow<T>>(column: K, operator: string, value: TableRow<T>[K]) {
    switch (operator) {
      case '=':
        this.query = this.query.eq(column, value)
        break
      case '!=':
        this.query = this.query.neq(column, value)
        break
      case '>':
        this.query = this.query.gt(column, value)
        break
      case '>=':
        this.query = this.query.gte(column, value)
        break
      case '<':
        this.query = this.query.lt(column, value)
        break
      case '<=':
        this.query = this.query.lte(column, value)
        break
      case 'in':
        this.query = this.query.in(column, value)
        break
      case 'like':
        this.query = this.query.like(column, value)
        break
      case 'ilike':
        this.query = this.query.ilike(column, value)
        break
      default:
        throw new Error(`Unsupported operator: ${operator}`)
    }
    return this
  }

  orderBy<K extends keyof TableRow<T>>(column: K, ascending: boolean = true) {
    this.query = this.query.order(column, { ascending })
    return this
  }

  limit(count: number) {
    this.query = this.query.limit(count)
    return this
  }

  offset(start: number) {
    this.query = this.query.range(start, start + 1000) // 默认范围
    return this
  }

  async execute(): Promise<TableRow<T>[]> {
    const { data, error } = await this.query
    if (error) {
      throw new DatabaseError(error, `Query execution failed for table ${this.tableName}`)
    }
    return data
  }

  async executeSingle(): Promise<TableRow<T> | null> {
    const { data, error } = await this.query.maybeSingle()
    if (error) {
      throw new DatabaseError(error, `Single query execution failed for table ${this.tableName}`)
    }
    return data
  }

  async executeWithCount(): Promise<{ data: TableRow<T>[]; count: number }> {
    const { data, error, count } = await this.query
    if (error) {
      throw new DatabaseError(error, `Count query execution failed for table ${this.tableName}`)
    }
    return { data, count: count || 0 }
  }
}

// 便捷函数
export function createQuery<T extends TableName>(tableName: T): TypeSafeQueryBuilder<T> {
  return new TypeSafeQueryBuilder(tableName)
}
```

## 7. 性能优化 / Performance Optimization

### 7.1 查询优化和缓存 / Query Optimization and Caching

```typescript
// src/utils/queryCache.ts
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export class QueryCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL = 5 * 60 * 1000 // 5分钟

  set<T>(key: string, data: T, ttl: number = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  invalidate(pattern: string) {
    for (const [key] of this.cache.entries()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  clear() {
    this.cache.clear()
  }

  size() {
    return this.cache.size
  }
}

export const queryCache = new QueryCache()

// 缓存装饰器
export function cached<T extends any[], R>(
  ttl: number = 5 * 60 * 1000,
  keyGenerator?: (...args: T) => string
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: T): Promise<R> {
      const cacheKey = keyGenerator ? 
        keyGenerator(...args) : 
        `${target.constructor.name}.${propertyKey}:${JSON.stringify(args)}`

      // 尝试从缓存获取
      const cachedResult = queryCache.get<R>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args)
      
      // 存储到缓存
      queryCache.set(cacheKey, result, ttl)
      
      return result
    }

    return descriptor
  }
}
```

### 7.2 批量操作优化 / Batch Operation Optimization

```typescript
// src/utils/batchOperations.ts
import { supabase } from '../services/supabaseClient'
import type { Database } from '../types/database'

export class BatchOperations {
  private batchSize = 1000

  async batchInsert<T extends keyof Database['public']['Tables']>(
    tableName: T,
    data: Database['public']['Tables'][T]['Insert'][],
    options: { batchSize?: number; onProgress?: (progress: number) => void } = {}
  ) {
    const { batchSize = this.batchSize, onProgress } = options
    const results = []
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      
      const { data: batchResult, error } = await supabase
        .from(tableName)
        .insert(batch)
        .select()

      if (error) {
        throw new DatabaseError(error, `Batch insert failed for ${tableName}`)
      }

      results.push(...batchResult)
      
      if (onProgress) {
        onProgress(Math.min(i + batchSize, data.length) / data.length)
      }
    }

    return results
  }

  async batchUpdate<T extends keyof Database['public']['Tables']>(
    tableName: T,
    updates: Array<{
      id: string
      data: Database['public']['Tables'][T]['Update']
    }>,
    options: { batchSize?: number; onProgress?: (progress: number) => void } = {}
  ) {
    const { batchSize = this.batchSize, onProgress } = options
    const results = []
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)
      
      const batchPromises = batch.map(({ id, data }) =>
        supabase
          .from(tableName)
          .update(data)
          .eq('id', id)
          .select()
          .single()
      )

      const batchResults = await Promise.all(batchPromises)
      
      for (const result of batchResults) {
        if (result.error) {
          throw new DatabaseError(result.error, `Batch update failed for ${tableName}`)
        }
        results.push(result.data)
      }
      
      if (onProgress) {
        onProgress(Math.min(i + batchSize, updates.length) / updates.length)
      }
    }

    return results
  }

  async batchDelete<T extends keyof Database['public']['Tables']>(
    tableName: T,
    ids: string[],
    options: { batchSize?: number; onProgress?: (progress: number) => void } = {}
  ) {
    const { batchSize = this.batchSize, onProgress } = options
    
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .in('id', batch)

      if (error) {
        throw new DatabaseError(error, `Batch delete failed for ${tableName}`)
      }
      
      if (onProgress) {
        onProgress(Math.min(i + batchSize, ids.length) / ids.length)
      }
    }

    return true
  }
}

export const batchOperations = new BatchOperations()
```

## 8. 总结 / Summary

这个前端直连数据库的技术实现方案提供了：

1. **类型安全**: 完整的 TypeScript 类型定义和类型检查
2. **实时数据**: WebSocket 实时数据订阅和更新
3. **高性能**: 查询优化、缓存策略和批量操作
4. **开发效率**: 无需后端 API 开发，快速迭代
5. **错误处理**: 完善的错误处理和异常管理
6. **状态管理**: 与 Pinia 的深度集成
7. **Vue 集成**: 组合式函数和响应式数据

这个方案显著降低了开发和维护成本，同时提供了强大的数据访问能力。