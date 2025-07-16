/**
 * 竞争数据服务
 * 负责管理多维度竞争情报数据的 CRUD 操作
 */

import { supabase, QueryBuilder, cacheManager, handleSupabaseError } from './supabaseClient.js'

export class CompetitiveDataService {
  constructor() {
    this.tableName = 'competitive_data'
    this.cache = cacheManager
  }

  /**
   * 获取公司的竞争数据
   * @param {string} companyId - 公司 ID
   * @param {string} category - 数据类别 (可选)
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 竞争数据数组
   */
  async getByCompany(companyId, category = null, limit = 100) {
    try {
      const cacheKey = `competitive_data_${companyId}_${category || 'all'}_${limit}`
      const cached = this.cache.get(cacheKey)
      
      if (cached) {
        console.log('📋 使用缓存的竞争数据')
        return cached
      }

      const query = new QueryBuilder(this.tableName)
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', false)
        .limit(limit)

      if (category) {
        query.eq('category', category)
      }

      const data = await query.execute()
      
      // 缓存数据
      this.cache.set(cacheKey, data, 5 * 60 * 1000) // 5分钟缓存
      
      console.log(`✅ 获取竞争数据成功: ${data.length} 条`)
      return data
      
    } catch (error) {
      console.error('❌ 获取竞争数据失败:', error)
      throw error
    }
  }

  /**
   * 获取按类别分组的竞争数据
   * @param {string} companyId - 公司 ID
   * @returns {Promise<Object>} 按类别分组的数据
   */
  async getByCategory(companyId) {
    try {
      const cacheKey = `competitive_data_grouped_${companyId}`
      const cached = this.cache.get(cacheKey)
      
      if (cached) {
        console.log('📋 使用缓存的分组竞争数据')
        return cached
      }

      const data = await this.getByCompany(companyId)
      
      // 按类别分组
      const grouped = data.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = []
        }
        acc[item.category].push(item)
        return acc
      }, {})

      // 缓存分组数据
      this.cache.set(cacheKey, grouped, 5 * 60 * 1000)
      
      return grouped
      
    } catch (error) {
      console.error('❌ 获取分组竞争数据失败:', error)
      throw error
    }
  }

  /**
   * 创建竞争数据
   * @param {Object} data - 竞争数据对象
   * @returns {Promise<Object>} 创建的数据
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
      this.cache.delete(`competitive_data_${data.company_id}_all_100`)
      this.cache.delete(`competitive_data_${data.company_id}_${data.category}_100`)
      this.cache.delete(`competitive_data_grouped_${data.company_id}`)

      console.log('✅ 创建竞争数据成功:', result.id)
      return result
      
    } catch (error) {
      const errorMessage = handleSupabaseError(error, '创建竞争数据')
      console.error('❌ 创建竞争数据失败:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * 更新竞争数据
   * @param {string} id - 数据 ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object>} 更新后的数据
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
      this.cache.delete(`competitive_data_${result.company_id}_all_100`)
      this.cache.delete(`competitive_data_${result.company_id}_${result.category}_100`)
      this.cache.delete(`competitive_data_grouped_${result.company_id}`)

      console.log('✅ 更新竞争数据成功:', result.id)
      return result
      
    } catch (error) {
      const errorMessage = handleSupabaseError(error, '更新竞争数据')
      console.error('❌ 更新竞争数据失败:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * 删除竞争数据
   * @param {string} id - 数据 ID
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

      console.log('✅ 删除竞争数据成功:', id)
      return true
      
    } catch (error) {
      const errorMessage = handleSupabaseError(error, '删除竞争数据')
      console.error('❌ 删除竞争数据失败:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * 获取高质量数据
   * @param {string} companyId - 公司 ID
   * @param {number} qualityThreshold - 质量阈值
   * @returns {Promise<Array>} 高质量数据数组
   */
  async getHighQualityData(companyId, qualityThreshold = 0.8) {
    try {
      const data = await new QueryBuilder(this.tableName)
        .select('*')
        .eq('company_id', companyId)
        .gte('quality_score', qualityThreshold)
        .order('quality_score', false)
        .execute()

      console.log(`✅ 获取高质量数据成功: ${data.length} 条`)
      return data
      
    } catch (error) {
      console.error('❌ 获取高质量数据失败:', error)
      throw error
    }
  }

  /**
   * 获取重要数据
   * @param {string} companyId - 公司 ID
   * @param {number} significanceThreshold - 重要性阈值
   * @returns {Promise<Array>} 重要数据数组
   */
  async getSignificantData(companyId, significanceThreshold = 0.7) {
    try {
      const data = await new QueryBuilder(this.tableName)
        .select('*')
        .eq('company_id', companyId)
        .gte('significance_score', significanceThreshold)
        .order('significance_score', false)
        .execute()

      console.log(`✅ 获取重要数据成功: ${data.length} 条`)
      return data
      
    } catch (error) {
      console.error('❌ 获取重要数据失败:', error)
      throw error
    }
  }

  /**
   * 搜索竞争数据
   * @param {string} companyId - 公司 ID
   * @param {string} searchTerm - 搜索词
   * @param {string} category - 数据类别 (可选)
   * @returns {Promise<Array>} 搜索结果
   */
  async search(companyId, searchTerm, category = null) {
    try {
      const query = new QueryBuilder(this.tableName)
        .select('*')
        .eq('company_id', companyId)
        .like('data_value', `%${searchTerm}%`)
        .order('created_at', false)

      if (category) {
        query.eq('category', category)
      }

      const data = await query.execute()
      
      console.log(`✅ 搜索竞争数据成功: ${data.length} 条`)
      return data
      
    } catch (error) {
      console.error('❌ 搜索竞争数据失败:', error)
      throw error
    }
  }

  /**
   * 获取数据统计
   * @param {string} companyId - 公司 ID
   * @returns {Promise<Object>} 统计数据
   */
  async getStatistics(companyId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('category, confidence_score, quality_score, significance_score')
        .eq('company_id', companyId)

      if (error) {
        throw error
      }

      const stats = {
        total: data.length,
        categories: {},
        averageScores: {
          confidence: 0,
          quality: 0,
          significance: 0
        }
      }

      if (data.length > 0) {
        // 按类别统计
        data.forEach(item => {
          stats.categories[item.category] = (stats.categories[item.category] || 0) + 1
        })

        // 计算平均分
        stats.averageScores.confidence = data.reduce((sum, item) => sum + item.confidence_score, 0) / data.length
        stats.averageScores.quality = data.reduce((sum, item) => sum + item.quality_score, 0) / data.length
        stats.averageScores.significance = data.reduce((sum, item) => sum + item.significance_score, 0) / data.length
      }

      console.log('✅ 获取数据统计成功:', stats)
      return stats
      
    } catch (error) {
      console.error('❌ 获取数据统计失败:', error)
      throw error
    }
  }

  /**
   * 批量创建竞争数据
   * @param {Array} dataArray - 竞争数据数组
   * @returns {Promise<Array>} 创建的数据数组
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

      console.log(`✅ 批量创建竞争数据成功: ${results.length} 条`)
      return results
      
    } catch (error) {
      const errorMessage = handleSupabaseError(error, '批量创建竞争数据')
      console.error('❌ 批量创建竞争数据失败:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear()
    console.log('🗑️  竞争数据缓存已清除')
  }
}

// 创建单例实例
export const competitiveDataService = new CompetitiveDataService()

// 导出类供测试使用
export default CompetitiveDataService