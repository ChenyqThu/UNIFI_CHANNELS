/**
 * Financial Data Service
 * 负责从 Supabase 和标准化JSON文件加载和处理财报数据
 * 支持数据验证、错误处理和缓存机制
 */

class FinancialDataService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5分钟缓存
  }

  /**
   * 加载财报数据
   * @param {string} version - 数据版本，默认为'latest'
   * @returns {Promise<Object>} 标准化的财报数据
   */
  async loadFinancialData(version = 'latest') {
    const cacheKey = `financial-data-${version}`
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('📋 使用缓存的财报数据')
        return cached.data
      }
    }

    try {
      console.log('📊 加载财报数据...')
      
      // 优先尝试从 Supabase API 获取
      try {
        const { financialAPI } = await import('../api/supabaseAPI.js')
        const supabaseData = await financialAPI.getFinancialData(version)
        
        if (supabaseData) {
          console.log('✅ 从 Supabase 获取财报数据成功')
          const processedData = this.processFinancialData(supabaseData)
          
          // 验证数据完整性
          this.validateFinancialData(processedData)
          
          // 缓存数据
          this.cache.set(cacheKey, {
            data: processedData,
            timestamp: Date.now()
          })
          
          return processedData
        }
      } catch (supabaseError) {
        console.warn('⚠️  从 Supabase 获取财报数据失败，尝试本地文件:', supabaseError)
      }
      
      // 如果 Supabase 获取失败，尝试从本地文件获取
      const response = await fetch('/data/financial-reports.json')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - 无法加载财报数据文件`)
      }
      
      const rawData = await response.json()
      const processedData = this.processFinancialData(rawData)
      
      // 验证数据完整性
      this.validateFinancialData(processedData)
      
      // 缓存数据
      this.cache.set(cacheKey, {
        data: processedData,
        timestamp: Date.now()
      })
      
      console.log('✅ 财报数据加载成功 (本地文件)')
      return processedData
      
    } catch (error) {
      console.error('❌ 财报数据加载失败:', error)
      throw new Error(`财报数据加载失败: ${error.message}`)
    }
  }

  /**
   * 处理和转换财报数据为前端需要的格式
   * @param {Object} rawData - 原始JSON数据
   * @returns {Object} 处理后的数据
   */
  processFinancialData(rawData) {
    const processed = {
      metadata: rawData.metadata,
      
      // 季度数据转换
      quarterly: this.processQuarterlyData(rawData.quarterly_data),
      
      // 年度数据转换
      annual: this.processAnnualData(rawData.annual_data),
      
      // 渠道策略数据
      channelStrategy: rawData.channel_strategy,
      
      // 业务板块数据
      businessSegments: rawData.business_segments,
      
      // 关键指标
      keyMetrics: rawData.key_metrics,
      
      // 战略风险
      strategicRisks: rawData.strategic_risks
    }

    // 计算衍生指标
    processed.computed = this.computeDerivedMetrics(processed)
    
    return processed
  }

  /**
   * 处理季度数据
   */
  processQuarterlyData(quarterlyData) {
    const processed = {}
    
    Object.keys(quarterlyData).forEach(quarter => {
      const data = quarterlyData[quarter]
      processed[quarter] = {
        ...data,
        // 添加计算字段
        enterprise_revenue_percentage: ((data.revenue.enterprise_technology / data.revenue.total) * 100).toFixed(1),
        service_provider_revenue_percentage: ((data.revenue.service_provider_technology / data.revenue.total) * 100).toFixed(1),
        
        // 区域数据验证和补全
        regional_total: Object.values(data.regional_breakdown).reduce((sum, region) => sum + region.amount, 0)
      }
    })
    
    return processed
  }

  /**
   * 处理年度数据
   */
  processAnnualData(annualData) {
    const processed = {}
    
    Object.keys(annualData).forEach(period => {
      processed[period] = {
        ...annualData[period]
      }
    })
    
    return processed
  }

  /**
   * 计算衍生指标
   */
  computeDerivedMetrics(data) {
    const current = data.quarterly.q1_2025
    const previous = data.quarterly.q3_2024
    
    return {
      growth_metrics: {
        revenue_growth: this.calculateGrowth(current.revenue.total, previous.revenue.total),
        enterprise_growth: this.calculateGrowth(
          current.revenue.enterprise_technology, 
          previous.revenue.enterprise_technology
        ),
        north_america_growth: this.calculateGrowth(
          current.regional_breakdown.north_america.amount,
          previous.regional_breakdown.north_america.amount
        ),
        margin_improvement: (current.profitability.gross_margin - previous.profitability.gross_margin).toFixed(1)
      },
      
      nine_months_metrics: {
        revenue_growth: this.calculateGrowth(
          data.annual.nine_months_2025.revenue.total,
          data.annual.nine_months_2024.revenue.total
        ),
        net_income_growth: this.calculateGrowth(
          data.annual.nine_months_2025.profitability.net_income,
          data.annual.nine_months_2024.profitability.net_income
        ),
        margin_improvement: (
          data.annual.nine_months_2025.profitability.gross_margin - 
          data.annual.nine_months_2024.profitability.gross_margin
        ).toFixed(1)
      }
    }
  }

  /**
   * 计算增长率
   */
  calculateGrowth(current, previous) {
    if (!previous || previous === 0) return 0
    return ((current - previous) / previous * 100).toFixed(1)
  }

  /**
   * 验证数据完整性
   */
  validateFinancialData(data) {
    const requiredFields = [
      'metadata',
      'quarterly',
      'annual', 
      'channelStrategy',
      'businessSegments'
    ]
    
    requiredFields.forEach(field => {
      if (!data[field]) {
        throw new Error(`缺少必要字段: ${field}`)
      }
    })
    
    // 验证季度数据
    if (!data.quarterly.q1_2025 || !data.quarterly.q3_2024) {
      throw new Error('缺少关键季度数据')
    }
    
    // 验证收入数据一致性
    const q1Data = data.quarterly.q1_2025
    const calculatedTotal = q1Data.revenue.enterprise_technology + q1Data.revenue.service_provider_technology
    const tolerance = 0.1 // 允许0.1M的误差
    
    if (Math.abs(calculatedTotal - q1Data.revenue.total) > tolerance) {
      console.warn('⚠️  收入数据可能存在不一致:', {
        reported: q1Data.revenue.total,
        calculated: calculatedTotal,
        difference: Math.abs(calculatedTotal - q1Data.revenue.total)
      })
    }
    
    console.log('✅ 数据验证通过')
  }

  /**
   * 获取特定指标
   */
  getMetric(data, metricPath) {
    return metricPath.split('.').reduce((obj, key) => obj?.[key], data)
  }

  /**
   * 格式化货币显示
   */
  formatCurrency(value, unit = 'M') {
    return `$${value}${unit}`
  }

  /**
   * 格式化百分比
   */
  formatPercentage(value) {
    return `${value}%`
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
export const financialDataService = new FinancialDataService()

// 导出类供测试使用
export { FinancialDataService }