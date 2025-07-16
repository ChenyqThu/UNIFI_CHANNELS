/**
 * Supabase API 接口
 * 替换原有的 FastAPI 后端调用，使用 Supabase 客户端
 */

import { distributorService } from '../services/distributorService.js'
import { financialReportService } from '../services/financialReportService.js'
import { competitiveDataService } from '../services/competitiveDataService.js'
import { realtimeService } from '../services/realtimeService.js'
import { supabase } from '../services/supabaseClient.js'

// 简化：项目只做 Ubiquiti 竞品研究，直接查询所有分销商数据
async function getUbiquitiCompanyId() {
  // 不需要查询特定公司ID，返回 null 表示查询所有数据
  return null
}

// 分销商相关 API
export const distributorsAPI = {
  /**
   * 获取分销商摘要统计
   */
  async getSummary() {
    try {
      console.log('📊 正在从 Supabase 获取分销商摘要数据...')
      
      const companyId = await getUbiquitiCompanyId()
      // companyId 为 null 表示查询所有数据，这是正常的
      
      // 获取分销商统计数据
      const stats = await distributorService.getStatistics(companyId)
      
      // 获取按地区分组的分销商数据
      const allDistributors = await distributorService.getAll({ 
        companyId, 
        activeOnly: true 
      })
      
      // 按地区分组统计
      const regionStats = {}
      const countryStats = {}
      
      allDistributors.forEach(distributor => {
        const region = distributor.region || 'unknown'
        const country = distributor.country_state || 'unknown'
        
        // 地区统计
        if (!regionStats[region]) {
          regionStats[region] = {
            name_key: getRegionKey(region),
            code: region,
            count: 0,
            masters: 0,
            resellers: 0,
            coordinates: getRegionCoordinates(region),
            growth: Math.random() * 20 + 5, // 临时增长率
            lastUpdated: new Date().toISOString()
          }
        }
        
        regionStats[region].count++
        if (distributor.partner_type === 'master') {
          regionStats[region].masters++
        } else {
          regionStats[region].resellers++
        }
        
        // 国家统计
        if (!countryStats[country]) {
          countryStats[country] = {
            name: country,
            count: 0,
            region: region,
            growth: Math.random() * 15 + 2
          }
        }
        countryStats[country].count++
      })
      
      // 转换为前端需要的格式
      const topCountries = Object.values(countryStats)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
      
      const result = {
        success: true,
        data: {
          totalCount: stats.total_count,
          activeCount: stats.active_count,
          masterDistributors: stats.master_count,
          authorizedResellers: stats.simple_count,
          regions: regionStats,
          topCountries,
          countries: countryStats // 兼容旧格式
        },
        timestamp: new Date().toISOString()
      }
      
      console.log('✅ 分销商摘要数据获取成功:', result)
      return result
      
    } catch (error) {
      console.error('❌ 获取分销商摘要失败:', error)
      
      // 返回静态数据作为备选
      return getFallbackData()
    }
  },

  /**
   * 获取特定地区的分销商详情
   */
  async getByRegion(regionCode) {
    try {
      console.log(`📍 正在获取地区 ${regionCode} 的分销商数据...`)
      
      const companyId = await getUbiquitiCompanyId()
      // companyId 为 null 表示查询所有数据，这是正常的
      
      const distributors = await distributorService.getByRegion(regionCode, companyId)
      
      return {
        success: true,
        data: {
          region: regionCode,
          distributors: distributors.map(dist => ({
            id: dist.id,
            unifi_id: dist.unifi_id,
            name: dist.name,
            type: dist.partner_type,
            country: dist.country_state,
            city: extractCityFromAddress(dist.address),
            status: dist.is_active ? 'active' : 'inactive',
            phone: dist.phone,
            email: dist.contact_email,
            address: dist.address,
            coordinates: dist.latitude && dist.longitude ? [dist.longitude, dist.latitude] : null,
            lastUpdated: dist.updated_at
          }))
        }
      }
      
    } catch (error) {
      console.error(`❌ 获取地区 ${regionCode} 分销商失败:`, error)
      throw error
    }
  },

  /**
   * 获取分销商变化历史
   */
  async getChangeHistory(days = 30) {
    try {
      console.log(`📋 正在获取 ${days} 天内的分销商变化历史...`)
      
      const companyId = await getUbiquitiCompanyId()
      // companyId 为 null 表示查询所有数据，这是正常的
      
      // 获取数据变更历史
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      
      const { data: changes, error } = await supabase
        .from('data_changes')
        .select('*')
        .eq('table_name', 'distributors')
        .gte('detected_at', cutoffDate.toISOString())
        .order('detected_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      // 按变更类型分组统计
      const changeStats = {
        added: { count: 0, regions: new Set() },
        removed: { count: 0, regions: new Set() },
        updated: { count: 0, regions: new Set() }
      }
      
      changes.forEach(change => {
        const type = change.change_type === 'created' ? 'added' : 
                    change.change_type === 'deleted' ? 'removed' : 'updated'
        
        changeStats[type].count++
        
        // 尝试从数据中提取地区信息
        const region = change.new_data?.region || change.old_data?.region
        if (region) {
          changeStats[type].regions.add(region)
        }
      })
      
      // 转换为数组格式
      const changesArray = Object.entries(changeStats).map(([type, stats]) => ({
        type,
        count: stats.count,
        regions: Array.from(stats.regions)
      }))
      
      return {
        success: true,
        data: {
          period: `${days} days`,
          changes: changesArray
        }
      }
      
    } catch (error) {
      console.error('❌ 获取分销商变化历史失败:', error)
      
      // 返回模拟数据
      return {
        success: true,
        data: {
          period: `${days} days`,
          changes: [
            { type: 'added', count: 0, regions: [] },
            { type: 'removed', count: 0, regions: [] },
            { type: 'updated', count: 0, regions: [] }
          ]
        }
      }
    }
  },

  /**
   * 搜索分销商
   */
  async searchDistributors(searchTerm, options = {}) {
    try {
      console.log(`🔍 搜索分销商: ${searchTerm}`)
      
      const companyId = await getUbiquitiCompanyId()
      // companyId 为 null 表示查询所有数据，这是正常的
      
      const results = await distributorService.search(searchTerm, {
        companyId,
        ...options
      })
      
      return {
        success: true,
        data: results.map(dist => ({
          id: dist.id,
          name: dist.name,
          type: dist.partner_type,
          region: dist.region,
          country: dist.country_state,
          address: dist.address,
          status: dist.is_active ? 'active' : 'inactive'
        }))
      }
      
    } catch (error) {
      console.error('❌ 搜索分销商失败:', error)
      throw error
    }
  },

  /**
   * 订阅分销商数据变更
   */
  async subscribeToChanges(callback) {
    try {
      const companyId = await getUbiquitiCompanyId()
      // companyId 为 null 表示查询所有数据，这是正常的
      
      return realtimeService.subscribeToDistributors(companyId, callback)
    } catch (error) {
      console.error('❌ 订阅分销商数据变更失败:', error)
      throw error
    }
  }
}

// 财报相关 API
export const financialAPI = {
  /**
   * 获取财报数据
   */
  async getFinancialData(version = 'latest') {
    try {
      console.log('📊 正在从 Supabase 获取财报数据...')
      
      const companyId = await getUbiquitiCompanyId()
      // companyId 为 null 表示查询所有数据，这是正常的
      
      // 获取最新的季度和年度报告
      const [latestQuarterly, latestAnnual] = await Promise.all([
        financialReportService.getLatest(companyId, 'quarterly'),
        financialReportService.getLatest(companyId, 'annual')
      ])
      
      // 获取所有季度报告
      const quarterlyReports = await financialReportService.getQuarterlyReports(companyId, 8)
      
      // 转换为前端需要的格式
      const quarterlyData = {}
      quarterlyReports.forEach(report => {
        const periodKey = report.period.toLowerCase()
        quarterlyData[periodKey] = {
          revenue: report.revenue_data,
          profitability: report.profitability_data,
          regional_breakdown: report.regional_breakdown,
          business_segments: report.business_segments,
          key_metrics: report.key_metrics
        }
      })
      
      const result = {
        metadata: {
          version,
          last_updated: new Date().toISOString(),
          data_source: 'supabase',
          report_currency: 'USD',
          report_unit: 'millions'
        },
        quarterly_data: quarterlyData,
        annual_data: latestAnnual ? {
          [latestAnnual.fiscal_year]: {
            revenue: latestAnnual.revenue_data,
            profitability: latestAnnual.profitability_data,
            regional_breakdown: latestAnnual.regional_breakdown,
            business_segments: latestAnnual.business_segments,
            key_metrics: latestAnnual.key_metrics
          }
        } : {},
        channel_strategy: latestQuarterly?.channel_strategy || {},
        business_segments: latestQuarterly?.business_segments || {},
        key_metrics: latestQuarterly?.key_metrics || {},
        strategic_risks: latestQuarterly?.strategic_risks || {}
      }
      
      console.log('✅ 财报数据获取成功')
      return result
      
    } catch (error) {
      console.error('❌ 获取财报数据失败:', error)
      
      // 如果 Supabase 获取失败，尝试从静态文件获取
      try {
        const response = await fetch('/data/financial-reports.json')
        if (response.ok) {
          const data = await response.json()
          console.log('📋 使用静态财报数据')
          return data
        }
      } catch (fileError) {
        console.error('❌ 静态文件也获取失败:', fileError)
      }
      
      throw error
    }
  },

  /**
   * 获取财报趋势数据
   */
  async getTrendData(metric, reportType = 'quarterly', periods = 8) {
    try {
      const companyId = await getUbiquitiCompanyId()
      // companyId 为 null 表示查询所有数据，这是正常的
      
      return await financialReportService.getTrendData(companyId, metric, reportType, periods)
    } catch (error) {
      console.error('❌ 获取财报趋势数据失败:', error)
      throw error
    }
  },

  /**
   * 订阅财报数据变更
   */
  async subscribeToChanges(callback) {
    try {
      const companyId = await getUbiquitiCompanyId()
      // companyId 为 null 表示查询所有数据，这是正常的
      
      return realtimeService.subscribeToFinancialReports(companyId, callback)
    } catch (error) {
      console.error('❌ 订阅财报数据变更失败:', error)
      throw error
    }
  }
}

// 竞争数据相关 API
export const competitiveAPI = {
  /**
   * 获取竞争数据
   */
  async getCompetitiveData(category = null) {
    try {
      console.log('🏆 正在获取竞争数据...')
      
      const companyId = await getUbiquitiCompanyId()
      // companyId 为 null 表示查询所有数据，这是正常的
      
      const data = await competitiveDataService.getByCompany(companyId, category)
      
      return {
        success: true,
        data: data.map(item => ({
          id: item.id,
          category: item.category,
          data_type: item.data_type,
          data_value: item.data_value,
          confidence_score: item.confidence_score,
          quality_score: item.quality_score,
          significance_score: item.significance_score,
          source: item.data_source,
          created_at: item.created_at
        }))
      }
      
    } catch (error) {
      console.error('❌ 获取竞争数据失败:', error)
      throw error
    }
  },

  /**
   * 获取按类别分组的竞争数据
   */
  async getByCategory() {
    try {
      const companyId = await getUbiquitiCompanyId()
      // companyId 为 null 表示查询所有数据，这是正常的
      
      return await competitiveDataService.getByCategory(companyId)
    } catch (error) {
      console.error('❌ 获取分类竞争数据失败:', error)
      throw error
    }
  },

  /**
   * 订阅竞争数据变更
   */
  async subscribeToChanges(callback) {
    try {
      const companyId = await getUbiquitiCompanyId()
      // companyId 为 null 表示查询所有数据，这是正常的
      
      return realtimeService.subscribeToCompetitiveData(companyId, callback)
    } catch (error) {
      console.error('❌ 订阅竞争数据变更失败:', error)
      throw error
    }
  }
}

// 实用工具函数
function getRegionKey(regionCode) {
  const regionKeys = {
    'usa': 'usa',
    'can': 'canada',
    'eur': 'europe',
    'aus-nzl': 'oceania',
    'as': 'asia',
    'lat-a': 'latin_america',
    'mid-e': 'middle_east',
    'af': 'africa',
    'US': 'usa',
    'CA': 'canada',
    'EU': 'europe',
    'AU': 'oceania',
    'AS': 'asia',
    'LA': 'latin_america',
    'ME': 'middle_east',
    'AF': 'africa'
  }
  return regionKeys[regionCode] || regionCode.toLowerCase()
}

function getRegionCoordinates(region) {
  const coordinates = {
    'usa': [-95.7129, 37.0902],
    'can': [-106.3468, 56.1304],
    'eur': [10.4515, 51.1657],
    'aus-nzl': [133.7751, -25.2744],
    'as': [100.6197, 34.0479],
    'lat-a': [-58.3816, -14.2350],
    'mid-e': [51.1839, 35.6892],
    'af': [20.0000, 0.0000],
    'US': [-95.7129, 37.0902],
    'CA': [-106.3468, 56.1304],
    'EU': [10.4515, 51.1657],
    'AU': [133.7751, -25.2744],
    'AS': [100.6197, 34.0479],
    'LA': [-58.3816, -14.2350],
    'ME': [51.1839, 35.6892],
    'AF': [20.0000, 0.0000]
  }
  return coordinates[region] || [0, 0]
}

function extractCityFromAddress(address) {
  if (!address) return 'Unknown'
  
  // 简单的城市提取逻辑
  const parts = address.split(',')
  if (parts.length >= 2) {
    return parts[0].trim()
  }
  return address.split(' ')[0]
}

// 备选静态数据
function getFallbackData() {
  return {
    success: true,
    data: {
      totalCount: 579,
      activeCount: 579,
      masterDistributors: 194,
      authorizedResellers: 385,
      regions: {
        usa: { 
          name_key: 'usa', 
          code: 'usa',
          count: 30, 
          masters: 11,
          resellers: 19,
          coordinates: [-95.7129, 37.0902], 
          growth: 12.3,
          lastUpdated: '2024-01-15T10:30:00Z'
        },
        can: { 
          name_key: 'canada', 
          code: 'can',
          count: 11, 
          masters: 3,
          resellers: 8,
          coordinates: [-106.3468, 56.1304], 
          growth: 8.1,
          lastUpdated: '2024-01-15T10:30:00Z'
        },
        eur: { 
          name_key: 'europe', 
          code: 'eur',
          count: 297, 
          masters: 82,
          resellers: 215,
          coordinates: [10.4515, 51.1657], 
          growth: 15.2,
          lastUpdated: '2024-01-15T10:30:00Z'
        }
      },
      topCountries: [
        { name_key: 'usa', count: 156, region: 'usa', growth: 12.3 },
        { name_key: 'germany', count: 45, region: 'eur', growth: 15.1 },
        { name_key: 'canada', count: 47, region: 'can', growth: 8.1 }
      ]
    },
    timestamp: new Date().toISOString()
  }
}

// 导出所有 API 接口
export default {
  distributors: distributorsAPI,
  financial: financialAPI,
  competitive: competitiveAPI
}