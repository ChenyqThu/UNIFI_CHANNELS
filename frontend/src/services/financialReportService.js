/**
 * 财报数据服务
 * 负责管理财报数据的 CRUD 操作和业务逻辑
 */

import { supabase, QueryBuilder, cacheManager, handleSupabaseError } from './supabaseClient.js'

export class FinancialReportService {
  constructor() {
    this.tableName = 'financial_reports'
    this.cache = cacheManager
  }

  /**
   * 获取公司的财报数据
   * @param {string} companyId - 公司 ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 财报数据数组
   */
  async getByCompany(companyId, options = {}) {
    try {
      const {
        reportType,
        fiscalYear,
        limit = 20
      } = options

      const cacheKey = `financial_reports_${companyId}_${JSON.stringify(options)}`
      const cached = this.cache.get(cacheKey)
      
      if (cached) {
        console.log('📋 使用缓存的财报数据')
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
        .eq('company_id', companyId)
        .order('fiscal_year', false)
        .order('quarter', false)
        .limit(limit)

      if (reportType) {
        query.eq('report_type', reportType)
      }

      if (fiscalYear) {
        query.eq('fiscal_year', fiscalYear)
      }

      const data = await query.execute()
      
      // 缓存数据
      this.cache.set(cacheKey, data, 10 * 60 * 1000) // 10分钟缓存
      
      console.log(`✅ 获取财报数据成功: ${data.length} 条`)
      return data
      
    } catch (error) {
      console.error('❌ 获取财报数据失败:', error)
      throw error
    }
  }

  /**
   * 获取最新财报
   * @param {string} companyId - 公司 ID
   * @param {string} reportType - 报告类型
   * @returns {Promise<Object>} 最新财报数据
   */
  async getLatest(companyId, reportType = 'quarterly') {
    try {
      const cacheKey = `latest_financial_report_${companyId}_${reportType}`
      const cached = this.cache.get(cacheKey)
      
      if (cached) {
        console.log('📋 使用缓存的最新财报数据')
        return cached
      }

      const { data, error } = await supabase
        .rpc('get_latest_financial_report', {
          p_company_id: companyId,
          p_report_type: reportType
        })

      if (error) {
        throw error
      }

      const result = data[0] || null
      
      // 缓存数据
      if (result) {
        this.cache.set(cacheKey, result, 10 * 60 * 1000) // 10分钟缓存
      }
      
      console.log('✅ 获取最新财报数据成功:', result?.period)
      return result
      
    } catch (error) {
      console.error('❌ 获取最新财报数据失败:', error)
      throw error
    }
  }

  /**
   * 根据 ID 获取财报
   * @param {string} id - 财报 ID
   * @returns {Promise<Object>} 财报数据
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

      console.log('✅ 获取财报详情成功:', data.period)
      return data
      
    } catch (error) {
      const errorMessage = handleSupabaseError(error, '获取财报详情')
      console.error('❌ 获取财报详情失败:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * 创建财报
   * @param {Object} data - 财报数据
   * @returns {Promise<Object>} 创建的财报
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

      console.log('✅ 创建财报成功:', result.period)
      return result
      
    } catch (error) {
      const errorMessage = handleSupabaseError(error, '创建财报')
      console.error('❌ 创建财报失败:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * 更新财报
   * @param {string} id - 财报 ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>} 更新后的财报
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

      console.log('✅ 更新财报成功:', result.period)
      return result
      
    } catch (error) {
      const errorMessage = handleSupabaseError(error, '更新财报')
      console.error('❌ 更新财报失败:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * 删除财报
   * @param {string} id - 财报 ID
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

      console.log('✅ 删除财报成功:', id)
      return true
      
    } catch (error) {
      const errorMessage = handleSupabaseError(error, '删除财报')
      console.error('❌ 删除财报失败:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * 获取季度财报
   * @param {string} companyId - 公司 ID
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 季度财报数组
   */
  async getQuarterlyReports(companyId, limit = 8) {
    try {
      return await this.getByCompany(companyId, {
        reportType: 'quarterly',
        limit
      })
    } catch (error) {
      console.error('❌ 获取季度财报失败:', error)
      throw error
    }
  }

  /**
   * 获取年度财报
   * @param {string} companyId - 公司 ID
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 年度财报数组
   */
  async getAnnualReports(companyId, limit = 5) {
    try {
      return await this.getByCompany(companyId, {
        reportType: 'annual',
        limit
      })
    } catch (error) {
      console.error('❌ 获取年度财报失败:', error)
      throw error
    }
  }

  /**
   * 获取财报趋势数据
   * @param {string} companyId - 公司 ID
   * @param {string} metric - 指标名称
   * @param {string} reportType - 报告类型
   * @param {number} periods - 期间数量
   * @returns {Promise<Array>} 趋势数据
   */
  async getTrendData(companyId, metric, reportType = 'quarterly', periods = 8) {
    try {
      const reports = await this.getByCompany(companyId, {
        reportType,
        limit: periods
      })

      const trendData = reports.map(report => {
        const value = this.extractMetricValue(report, metric)
        return {
          period: report.period,
          fiscal_year: report.fiscal_year,
          quarter: report.quarter,
          value,
          date: this.formatPeriodDate(report)
        }
      }).reverse() // 按时间正序排列

      console.log(`✅ 获取趋势数据成功: ${metric}, ${trendData.length} 个数据点`)
      return trendData
      
    } catch (error) {
      console.error('❌ 获取趋势数据失败:', error)
      throw error
    }
  }

  /**
   * 计算增长率
   * @param {string} companyId - 公司 ID
   * @param {string} metric - 指标名称
   * @param {string} reportType - 报告类型
   * @returns {Promise<Object>} 增长率数据
   */
  async getGrowthRate(companyId, metric, reportType = 'quarterly') {
    try {
      const reports = await this.getByCompany(companyId, {
        reportType,
        limit: 2
      })

      if (reports.length < 2) {
        throw new Error('需要至少两个报告期间来计算增长率')
      }

      const current = this.extractMetricValue(reports[0], metric)
      const previous = this.extractMetricValue(reports[1], metric)

      const growthRate = previous !== 0 ? ((current - previous) / previous * 100) : 0

      const result = {
        current,
        previous,
        growth_rate: parseFloat(growthRate.toFixed(2)),
        current_period: reports[0].period,
        previous_period: reports[1].period
      }

      console.log('✅ 计算增长率成功:', result)
      return result
      
    } catch (error) {
      console.error('❌ 计算增长率失败:', error)
      throw error
    }
  }

  /**
   * 获取区域分布数据
   * @param {string} companyId - 公司 ID
   * @param {string} period - 期间 (可选)
   * @returns {Promise<Array>} 区域分布数据
   */
  async getRegionalBreakdown(companyId, period = null) {
    try {
      let report
      
      if (period) {
        const { data, error } = await supabase
          .from(this.tableName)
          .select('regional_breakdown')
          .eq('company_id', companyId)
          .eq('period', period)
          .single()

        if (error) {
          throw error
        }
        
        report = data
      } else {
        report = await this.getLatest(companyId)
      }

      if (!report || !report.regional_breakdown) {
        return []
      }

      // 转换为数组格式
      const breakdown = Object.entries(report.regional_breakdown).map(([region, data]) => ({
        region,
        ...data
      }))

      console.log('✅ 获取区域分布数据成功:', breakdown.length)
      return breakdown
      
    } catch (error) {
      console.error('❌ 获取区域分布数据失败:', error)
      throw error
    }
  }

  /**
   * 提取指标值
   * @param {Object} report - 财报数据
   * @param {string} metric - 指标路径
   * @returns {number} 指标值
   */
  extractMetricValue(report, metric) {
    const path = metric.split('.')
    let value = report
    
    for (const key of path) {
      value = value?.[key]
      if (value === undefined) break
    }
    
    return typeof value === 'number' ? value : 0
  }

  /**
   * 格式化期间日期
   * @param {Object} report - 财报数据
   * @returns {string} 格式化的日期
   */
  formatPeriodDate(report) {
    if (report.report_type === 'quarterly') {
      return `${report.fiscal_year}Q${report.quarter}`
    } else {
      return report.fiscal_year.toString()
    }
  }

  /**
   * 批量创建财报
   * @param {Array} dataArray - 财报数据数组
   * @returns {Promise<Array>} 创建的财报数组
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

      console.log(`✅ 批量创建财报成功: ${results.length} 条`)
      return results
      
    } catch (error) {
      const errorMessage = handleSupabaseError(error, '批量创建财报')
      console.error('❌ 批量创建财报失败:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * 搜索财报
   * @param {string} companyId - 公司 ID
   * @param {string} searchTerm - 搜索词
   * @returns {Promise<Array>} 搜索结果
   */
  async search(companyId, searchTerm) {
    try {
      const query = new QueryBuilder(this.tableName)
        .select(`
          *,
          companies:company_id (
            id,
            name,
            website_url
          )
        `)
        .eq('company_id', companyId)
        .or(`period.ilike.%${searchTerm}%,analyst_notes.ilike.%${searchTerm}%`)
        .order('fiscal_year', false)
        .order('quarter', false)

      const data = await query.execute()
      
      console.log(`✅ 搜索财报成功: ${data.length} 条`)
      return data
      
    } catch (error) {
      console.error('❌ 搜索财报失败:', error)
      throw error
    }
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear()
    console.log('🗑️  财报数据缓存已清除')
  }
}

// 创建单例实例
export const financialReportService = new FinancialReportService()

// 导出类供测试使用
export default FinancialReportService