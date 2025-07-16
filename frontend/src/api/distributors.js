/**
 * 分销商 API 接口
 * 直接使用 Supabase 数据库
 */

import supabaseAPI from './supabaseAPI.js'

// 分销商相关 API
export const distributorsAPI = {
  /**
   * 获取分销商概览统计
   */
  async getSummary() {
    try {
      console.log('📊 获取分销商概览统计...')
      
      // 直接从 Supabase 获取数据
      const supabaseData = await supabaseAPI.distributors.getSummary()
      console.log('✅ 从 Supabase 获取分销商数据成功')
      return supabaseData
      
    } catch (error) {
      console.error('❌ 获取分销商概览统计失败:', error)
      
      // 如果 Supabase 失败，返回静态数据作为备选
      console.warn('🔄 使用静态数据作为备选')
      return getFallbackData()
    }
  },

  /**
   * 获取特定地区的分销商详情
   */
  async getByRegion(regionCode) {
    try {
      console.log(`📍 获取地区 ${regionCode} 的分销商数据...`)
      
      const result = await supabaseAPI.distributors.getByRegion(regionCode)
      console.log('✅ 从 Supabase 获取地区分销商数据成功')
      return result
      
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
      console.log(`📋 获取 ${days} 天内的分销商变化历史...`)
      
      const result = await supabaseAPI.distributors.getChangeHistory(days)
      console.log('✅ 从 Supabase 获取变化历史成功')
      return result
      
    } catch (error) {
      console.error('❌ 获取分销商变化历史失败:', error)
      throw error
    }
  },

  /**
   * 搜索分销商
   */
  async searchDistributors(searchTerm, options = {}) {
    try {
      console.log(`🔍 搜索分销商: ${searchTerm}`)
      
      const result = await supabaseAPI.distributors.searchDistributors(searchTerm, options)
      console.log('✅ 分销商搜索成功')
      return result
      
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
      console.log('🔔 订阅分销商数据变更...')
      
      const subscription = await supabaseAPI.distributors.subscribeToChanges(callback)
      console.log('✅ 分销商数据变更订阅成功')
      return subscription
      
    } catch (error) {
      console.error('❌ 订阅分销商数据变更失败:', error)
      throw error
    }
  }
}

// 备选静态数据（当 Supabase 不可用时使用）
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
        },
        'aus-nzl': { 
          name_key: 'oceania', 
          code: 'aus-nzl',
          count: 21, 
          masters: 4,
          resellers: 17,
          coordinates: [133.7751, -25.2744], 
          growth: 5.7,
          lastUpdated: '2024-01-15T10:30:00Z'
        },
        as: { 
          name_key: 'asia', 
          code: 'as',
          count: 90, 
          masters: 34,
          resellers: 56,
          coordinates: [100.6197, 34.0479], 
          growth: 22.4,
          lastUpdated: '2024-01-15T10:30:00Z'
        },
        'lat-a': { 
          name_key: 'latin_america', 
          code: 'lat-a',
          count: 63, 
          masters: 40,
          resellers: 23,
          coordinates: [-58.3816, -14.2350], 
          growth: 18.9,
          lastUpdated: '2024-01-15T10:30:00Z'
        },
        'mid-e': { 
          name_key: 'middle_east', 
          code: 'mid-e',
          count: 44, 
          masters: 12,
          resellers: 32,
          coordinates: [51.1839, 35.6892], 
          growth: 10.3,
          lastUpdated: '2024-01-15T10:30:00Z'
        },
        af: { 
          name_key: 'africa', 
          code: 'af',
          count: 23, 
          masters: 8,
          resellers: 15,
          coordinates: [20.0000, 0.0000], 
          growth: 7.2,
          lastUpdated: '2024-01-15T10:30:00Z'
        }
      },
      topCountries: [
        { name_key: 'usa', count: 156, region: 'usa', growth: 12.3 },
        { name_key: 'germany', count: 45, region: 'eur', growth: 15.1 },
        { name_key: 'canada', count: 47, region: 'can', growth: 8.1 },
        { name_key: 'uk', count: 38, region: 'eur', growth: 8.7 },
        { name_key: 'france', count: 32, region: 'eur', growth: 12.4 },
        { name_key: 'australia', count: 28, region: 'aus-nzl', growth: 5.7 },
        { name_key: 'japan', count: 24, region: 'as', growth: 20.1 },
        { name_key: 'netherlands', count: 22, region: 'eur', growth: 18.3 },
        { name_key: 'brazil', count: 19, region: 'lat-a', growth: 25.1 },
        { name_key: 'italy', count: 18, region: 'eur', growth: 10.2 }
      ]
    },
    timestamp: new Date().toISOString()
  }
}

export default distributorsAPI