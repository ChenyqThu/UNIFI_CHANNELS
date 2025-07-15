/**
 * Financial Data Manager Utility
 * 财报数据管理工具 - 用于协助财报数据的更新和验证
 */

export class FinancialDataManager {
  constructor() {
    this.validationRules = {
      revenue_consistency: 0.1, // 允许0.1M的收入误差
      percentage_tolerance: 0.1, // 允许0.1%的百分比误差
      required_fields: [
        'period', 'date_range', 'revenue', 'regional_breakdown', 'profitability'
      ]
    }
  }

  /**
   * 验证季度数据的完整性和一致性
   * @param {Object} quarterData - 季度数据对象
   * @returns {Object} 验证结果
   */
  validateQuarterData(quarterData) {
    const results = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }

    // 检查必填字段
    this.validationRules.required_fields.forEach(field => {
      if (!quarterData[field]) {
        results.errors.push(`缺少必填字段: ${field}`)
        results.isValid = false
      }
    })

    if (!results.isValid) return results

    // 收入一致性检查
    const revenueCheck = this.validateRevenueConsistency(quarterData.revenue)
    results.warnings.push(...revenueCheck.warnings)
    results.errors.push(...revenueCheck.errors)

    // 区域数据一致性检查
    const regionalCheck = this.validateRegionalConsistency(
      quarterData.revenue.total, 
      quarterData.regional_breakdown
    )
    results.warnings.push(...regionalCheck.warnings)
    results.errors.push(...regionalCheck.errors)

    // 百分比总和检查
    const percentageCheck = this.validatePercentageSum(quarterData.regional_breakdown)
    results.warnings.push(...percentageCheck.warnings)

    if (results.errors.length > 0) {
      results.isValid = false
    }

    return results
  }

  /**
   * 验证收入数据一致性
   */
  validateRevenueConsistency(revenue) {
    const results = { errors: [], warnings: [] }
    
    const calculated = revenue.enterprise_technology + revenue.service_provider_technology
    const difference = Math.abs(calculated - revenue.total)
    
    if (difference > this.validationRules.revenue_consistency) {
      results.errors.push(
        `收入数据不一致: 总收入${revenue.total}M vs 计算值${calculated.toFixed(1)}M (差异${difference.toFixed(1)}M)`
      )
    } else if (difference > 0.01) {
      results.warnings.push(
        `收入数据存在小幅差异: 差异${difference.toFixed(2)}M (在允许范围内)`
      )
    }

    return results
  }

  /**
   * 验证区域数据一致性
   */
  validateRegionalConsistency(totalRevenue, regionalData) {
    const results = { errors: [], warnings: [] }
    
    const regionalSum = Object.values(regionalData).reduce((sum, region) => sum + region.amount, 0)
    const difference = Math.abs(regionalSum - totalRevenue)
    
    if (difference > this.validationRules.revenue_consistency) {
      results.errors.push(
        `区域收入总和不匹配: 总收入${totalRevenue}M vs 区域总和${regionalSum.toFixed(1)}M`
      )
    }

    return results
  }

  /**
   * 验证百分比总和
   */
  validatePercentageSum(regionalData) {
    const results = { warnings: [] }
    
    const percentageSum = Object.values(regionalData).reduce((sum, region) => sum + region.percentage, 0)
    const difference = Math.abs(percentageSum - 100)
    
    if (difference > this.validationRules.percentage_tolerance) {
      results.warnings.push(
        `区域百分比总和: ${percentageSum.toFixed(1)}% (期望100%)`
      )
    }

    return results
  }

  /**
   * 自动修复数据一致性问题
   * @param {Object} quarterData - 需要修复的季度数据
   * @returns {Object} 修复后的数据和修复日志
   */
  autoFixData(quarterData) {
    const fixedData = JSON.parse(JSON.stringify(quarterData)) // 深拷贝
    const fixLog = []

    // 修复收入一致性
    const revenueSum = fixedData.revenue.enterprise_technology + fixedData.revenue.service_provider_technology
    if (Math.abs(revenueSum - fixedData.revenue.total) > 0.01) {
      fixedData.revenue.total = Number(revenueSum.toFixed(1))
      fixLog.push(`自动修复总收入: ${fixedData.revenue.total}M`)
    }

    // 修复区域百分比
    const regionalSum = Object.values(fixedData.regional_breakdown).reduce((sum, region) => sum + region.amount, 0)
    if (Math.abs(regionalSum - fixedData.revenue.total) > 0.01) {
      // 按比例调整区域数据
      const scaleFactor = fixedData.revenue.total / regionalSum
      Object.keys(fixedData.regional_breakdown).forEach(region => {
        const oldAmount = fixedData.regional_breakdown[region].amount
        fixedData.regional_breakdown[region].amount = Number((oldAmount * scaleFactor).toFixed(1))
        fixedData.regional_breakdown[region].percentage = Number(
          ((fixedData.regional_breakdown[region].amount / fixedData.revenue.total) * 100).toFixed(1)
        )
      })
      fixLog.push('自动调整区域数据以匹配总收入')
    }

    return { fixedData, fixLog }
  }

  /**
   * 生成季度数据模板
   * @param {string} quarter - 季度标识 (如 'q2_2025')
   * @param {string} period - 季度描述 (如 'Q2 FY2025')
   * @param {string} dateRange - 日期范围
   * @returns {Object} 数据模板
   */
  generateQuarterTemplate(quarter, period, dateRange) {
    return {
      [quarter]: {
        period: period,
        date_range: dateRange,
        revenue: {
          total: 0.0,
          enterprise_technology: 0.0,
          service_provider_technology: 0.0,
          growth_yoy: null
        },
        regional_breakdown: {
          north_america: {
            amount: 0.0,
            percentage: 0.0,
            growth_yoy: null
          },
          emea: {
            amount: 0.0,
            percentage: 0.0,
            growth_yoy: null
          },
          apac: {
            amount: 0.0,
            percentage: 0.0,
            growth_yoy: null
          },
          south_america: {
            amount: 0.0,
            percentage: 0.0,
            growth_yoy: null
          }
        },
        profitability: {
          gross_profit: 0.0,
          gross_margin: 0.0,
          operating_margin: null,
          net_margin: null,
          net_income: 0.0,
          eps_diluted: 0.0
        }
      }
    }
  }

  /**
   * 计算同比增长率
   * @param {number} current - 当期数值
   * @param {number} previous - 上年同期数值
   * @returns {number} 增长率
   */
  calculateYoYGrowth(current, previous) {
    if (!previous || previous === 0) return null
    return Number(((current - previous) / previous * 100).toFixed(1))
  }

  /**
   * 批量计算增长率
   * @param {Object} currentData - 当期数据
   * @param {Object} previousData - 对比期数据
   * @returns {Object} 包含增长率的数据
   */
  addGrowthRates(currentData, previousData) {
    const withGrowth = JSON.parse(JSON.stringify(currentData))
    
    // 收入增长率
    withGrowth.revenue.growth_yoy = this.calculateYoYGrowth(
      currentData.revenue.total,
      previousData.revenue.total
    )

    // 区域增长率
    Object.keys(withGrowth.regional_breakdown).forEach(region => {
      if (previousData.regional_breakdown[region]) {
        withGrowth.regional_breakdown[region].growth_yoy = this.calculateYoYGrowth(
          currentData.regional_breakdown[region].amount,
          previousData.regional_breakdown[region].amount
        )
      }
    })

    return withGrowth
  }

  /**
   * 导出数据验证报告
   * @param {Object} fullData - 完整的财报数据
   * @returns {string} 验证报告
   */
  generateValidationReport(fullData) {
    let report = '# 财报数据验证报告\n\n'
    report += `生成时间: ${new Date().toISOString()}\n`
    report += `数据版本: ${fullData.metadata.version}\n`
    report += `最后更新: ${fullData.metadata.last_updated}\n\n`

    // 验证所有季度数据
    Object.keys(fullData.quarterly_data).forEach(quarter => {
      report += `## ${quarter}\n`
      const validation = this.validateQuarterData(fullData.quarterly_data[quarter])
      
      if (validation.isValid) {
        report += '✅ 数据验证通过\n'
      } else {
        report += '❌ 数据验证失败\n'
        validation.errors.forEach(error => {
          report += `  - 错误: ${error}\n`
        })
      }
      
      validation.warnings.forEach(warning => {
        report += `  - ⚠️  警告: ${warning}\n`
      })
      
      report += '\n'
    })

    return report
  }
}

// 创建默认实例
export const financialDataManager = new FinancialDataManager()