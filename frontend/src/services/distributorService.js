/**
 * 分销商数据服务
 * 负责管理分销商数据的 CRUD 操作和业务逻辑
 */

import { supabase, QueryBuilder, cacheManager, handleSupabaseError } from './supabaseClient.js'

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
        console.log('📋 使用缓存的分销商数据')
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
      
      console.log(`✅ 获取分销商数据成功: ${data.length} 条`)
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

      console.log('✅ 获取分销商详情成功:', data.name)
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

      console.log('✅ 获取分销商详情成功 (Unifi ID):', data.name)
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

      console.log('✅ 创建分销商成功:', result.name)
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

      console.log('✅ 更新分销商成功:', result.name)
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

      console.log('✅ 删除分销商成功:', id)
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

      console.log(`✅ 批量创建分销商成功: ${results.length} 条`)
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

      console.log(`✅ 批量更新分销商成功: ${successData.length} 条`)
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
        console.log('📋 使用缓存的分销商统计数据')
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

      console.log('✅ 获取分销商统计数据成功:', stats)
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
      
      console.log(`✅ 搜索分销商成功: ${data.length} 条`)
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
      
      console.log(`✅ 获取地理位置数据成功: ${data.length} 条`)
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
    console.log('🗑️  分销商数据缓存已清除')
  }
}

// 创建单例实例
export const distributorService = new DistributorService()

// 导出类供测试使用
export default DistributorService