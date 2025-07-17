/**
 * 统一竞争数据服务
 * 单一数据源，统一处理分销商、财报、竞争数据
 * 解决数据传递链条过长导致的不一致问题
 */

import { supabase } from './supabaseClient.js'
import { distributorService } from './distributorService.js'
import { financialReportService } from './financialReportService.js'
import { COUNTRY_CODE_TO_MAP_NAME } from '../utils/countryMapping.js'

export class CompetitiveDataService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5分钟缓存
  }

  /**
   * 获取完整的竞争数据概览
   * 包含分销商、财报、国家地图数据
   * @returns {Promise<Object>} 标准化的数据结构
   */
  async getCompetitiveOverview() {
    const cacheKey = 'competitive_overview'
    const cached = this.getCachedData(cacheKey)
    if (cached) {
      console.log('🎯 使用缓存的竞争数据')
      return cached
    }

    try {
      console.log('🔄 开始获取完整竞争数据概览...')

      // 清除分销商服务缓存，确保数据新鲜
      distributorService.clearCache()

      // 获取原始分销商数据（所有数据源共用）
      const allDistributors = await distributorService.getAll({ 
        activeOnly: true 
      })
      
      console.log(`📋 获取到 ${allDistributors.length} 个活跃分销商`)

      // 并行处理分销商数据和年度趋势
      const [distributorData, yearlyTrends] = await Promise.all([
        this.processDistributorData(allDistributors),
        this.processYearlyTrends(allDistributors)
      ])

      // 构建标准化输出格式
      const overview = {
        timestamp: new Date().toISOString(),
        distributors: distributorData,
        yearlyTrends: yearlyTrends,
        metadata: {
          dataSource: 'supabase',
          cacheExpiry: this.cacheTimeout,
          version: '2.0'
        }
      }

      // 缓存结果
      this.setCachedData(cacheKey, overview)
      
      console.log('✅ 竞争数据概览获取完成')
      return overview

    } catch (error) {
      console.error('❌ 获取竞争数据概览失败:', error)
      throw error
    }
  }

  /**
   * 处理分销商数据（内部方法，使用已获取的数据）
   * 实现早期国家映射转换，避免数据传递链条中的错误
   * @param {Array} allDistributors 已获取的分销商数据
   * @returns {Object} 处理后的分销商数据
   */
  processDistributorData(allDistributors) {
    console.log('📊 开始处理分销商数据...')

    // 实现region-first过滤，避免国家代码冲突
    const processedData = this.processDistributorsByRegion(allDistributors)
    
    // 早期进行国家映射转换，传入regionStats确保正确处理北美数据
    const mapData = this.convertToMapFormat(processedData.countries, processedData.regions)
    
    return {
      summary: {
        totalCount: allDistributors.length,
        activeCount: allDistributors.length,
        masterDistributors: allDistributors.filter(d => d.partner_type === 'master').length,
        authorizedResellers: allDistributors.filter(d => d.partner_type !== 'master').length
      },
      regions: processedData.regions,
      countries: processedData.countries,
      mapData: mapData,
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * 按地区优先处理分销商数据
   * 解决IL(Illinois)与IL(Israel)等国家代码冲突问题
   * @param {Array} distributors 原始分销商数组
   * @returns {Object} 按地区和国家分组的数据
   */
  processDistributorsByRegion(distributors) {
    console.log('🔧 开始region-first数据处理...')
    
    const regionStats = {}
    const countryStats = {}
    
    // 首先按region分组，避免country_state冲突
    const distributorsByRegion = {}
    distributors.forEach(distributor => {
      const region = distributor.region || 'unknown'
      if (!distributorsByRegion[region]) {
        distributorsByRegion[region] = []
      }
      distributorsByRegion[region].push(distributor)
    })

    // 处理每个地区
    Object.entries(distributorsByRegion).forEach(([region, regionDistributors]) => {
      console.log(`🌍 处理地区 ${region}: ${regionDistributors.length} 个分销商`)
      
      // 地区统计
      regionStats[region] = {
        name_key: this.getRegionKey(region),
        code: region,
        count: regionDistributors.length,
        masters: regionDistributors.filter(d => d.partner_type === 'master').length,
        resellers: regionDistributors.filter(d => d.partner_type !== 'master').length,
        coordinates: this.getRegionCoordinates(region),
        growth: Math.random() * 20 + 5, // 临时增长率
        lastUpdated: new Date().toISOString()
      }

      // 在该地区内按country_state分组
      regionDistributors.forEach(distributor => {
        const countryKey = `${distributor.country_state}_${region}` // 使用复合key避免冲突
        
        if (!countryStats[countryKey]) {
          countryStats[countryKey] = {
            original_code: distributor.country_state,
            region: region,
            count: 0,
            masters: 0,
            resellers: 0,
            growth: Math.random() * 15 + 2,
            coordinates: [0, 0]
          }
        }
        
        countryStats[countryKey].count++
        if (distributor.partner_type === 'master') {
          countryStats[countryKey].masters++
        } else {
          countryStats[countryKey].resellers++
        }
      })
    })

    // 验证美国数据
    if (regionStats.usa) {
      console.log(`🇺🇸 美国地区处理结果: ${regionStats.usa.count} 个 (${regionStats.usa.masters} masters, ${regionStats.usa.resellers} resellers)`)
      
      // 检查美国各州数据
      const usaStates = Object.keys(countryStats).filter(key => countryStats[key].region === 'usa')
      let totalUSAFromStates = 0
      usaStates.forEach(stateKey => {
        totalUSAFromStates += countryStats[stateKey].count
      })
      
      console.log(`🔍 美国各州合计: ${totalUSAFromStates} vs 地区统计: ${regionStats.usa.count}`)
      
      if (totalUSAFromStates !== regionStats.usa.count) {
        console.warn('⚠️ 数据不一致，这不应该发生在region-first处理中')
      }
    }

    return {
      regions: regionStats,
      countries: countryStats
    }
  }

  /**
   * 转换为地图显示格式
   * 使用region-first逻辑，对于北美直接用region数据
   * @param {Object} countryStats 按国家统计的数据  
   * @param {Object} regionStats 按地区统计的数据
   * @returns {Array} 地图显示用的数据数组
   */
  convertToMapFormat(countryStats, regionStats) {
    console.log('🗺️ 开始转换地图显示格式...')
    
    const mapData = {}
    
    // 对于北美地区(USA/Canada)，直接使用region数据避免country_state冲突
    if (regionStats.usa) {
      mapData['USA'] = {
        name: 'USA',
        region: 'usa',
        value: regionStats.usa.count, // 使用value字段供ECharts组件使用
        count: regionStats.usa.count, // 保留count字段作为备用
        masters: regionStats.usa.masters,
        resellers: regionStats.usa.resellers,
        growth: regionStats.usa.growth
      }
      console.log(`🇺🇸 使用region数据: USA = ${regionStats.usa.count} 个 (${regionStats.usa.masters} masters, ${regionStats.usa.resellers} resellers)`)
    }
    
    if (regionStats.can) {
      mapData['Canada'] = {
        name: 'Canada',
        region: 'can',
        value: regionStats.can.count, // 使用value字段供ECharts组件使用
        count: regionStats.can.count, // 保留count字段作为备用
        masters: regionStats.can.masters,
        resellers: regionStats.can.resellers,
        growth: regionStats.can.growth
      }
      console.log(`🇨🇦 使用region数据: Canada = ${regionStats.can.count} 个`)
    }
    
    // 对于其他地区，按region分组处理country_state映射
    Object.entries(countryStats).forEach(([countryKey, countryData]) => {
      const originalCode = countryData.original_code
      const region = countryData.region
      
      // 跳过北美地区的country_state，因为已经用region数据处理了
      if (region === 'usa' || region === 'can') {
        return
      }
      
      // 使用基于region的动态映射
      const mapName = this.getCountryMapName(originalCode, region)
      
      // 如果映射失败，跳过该数据
      if (!mapName) {
        console.warn(`⚠️ 无法映射: ${originalCode} (region=${region})`)
        return
      }
      
      // 如果映射后的名称已存在，累加数据
      if (mapData[mapName]) {
        mapData[mapName].count += countryData.count
        mapData[mapName].value += countryData.count // 同步更新value字段
        mapData[mapName].masters += countryData.masters
        mapData[mapName].resellers += countryData.resellers
        console.log(`🔄 累加数据到 ${mapName}: +${countryData.count} (来自 ${originalCode}, region=${region})`)
      } else {
        mapData[mapName] = {
          name: mapName,
          original_codes: [originalCode],
          region: region,
          value: countryData.count, // 使用value字段供ECharts组件使用
          count: countryData.count, // 保留count字段作为备用
          masters: countryData.masters,
          resellers: countryData.resellers,
          growth: countryData.growth
        }
        console.log(`🆕 新建国家数据 ${mapName}: ${countryData.count} (来自 ${originalCode}, region=${region})`)
      }
    })

    // 转换为数组格式
    const mapArray = Object.values(mapData).sort((a, b) => b.count - a.count)
    
    console.log(`🗺️ 地图数据转换完成: ${mapArray.length} 个国家/地区`)
    
    // 验证美国数据
    const usaMapData = mapArray.find(item => item.name === 'USA')
    if (usaMapData) {
      console.log(`🇺🇸 最终美国地图数据: ${usaMapData.count} 个 (${usaMapData.masters} masters, ${usaMapData.resellers} resellers)`)
    }
    
    return mapArray
  }

  /**
   * 处理年度渠道更新趋势（内部方法，使用已获取的数据）
   * 使用真实的last_modified_at字段数据
   * @param {Array} allDistributors 已获取的分销商数据
   * @returns {Object} 年度趋势数据
   */
  processYearlyTrends(allDistributors) {
    console.log('📈 处理年度渠道更新趋势...')

    // 按年份分组统计
    const yearlyStats = {}
    const regionYearlyStats = {}

    allDistributors.forEach(dist => {
      if (!dist.last_modified_at) return
      
      const year = new Date(dist.last_modified_at).getFullYear()
      const region = dist.region || 'unknown'
      
      // 全球年度统计
      if (!yearlyStats[year]) {
        yearlyStats[year] = 0
      }
      yearlyStats[year]++
      
      // 地区年度统计
      if (!regionYearlyStats[region]) {
        regionYearlyStats[region] = {}
      }
      if (!regionYearlyStats[region][year]) {
        regionYearlyStats[region][year] = 0
      }
      regionYearlyStats[region][year]++
    })

    console.log('📈 年度趋势数据处理完成')
    
    return {
      global: yearlyStats,
      byRegion: regionYearlyStats,
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * 获取地区映射key
   */
  getRegionKey(regionCode) {
    const regionKeys = {
      'usa': 'usa',
      'can': 'canada',
      'eur': 'europe',
      'aus-nzl': 'oceania',
      'as': 'asia',
      'lat-a': 'latin_america',
      'mid-e': 'middle_east',
      'af': 'africa'
    }
    return regionKeys[regionCode] || regionCode.toLowerCase()
  }

  /**
   * 基于region的动态国家映射
   * 解决相同代码在不同region代表不同国家的问题
   */
  getCountryMapName(countryCode, region) {
    // 针对特定region的映射规则
    const regionSpecificMapping = {
      'eur': {
        'IL': 'Israel',
        'MD': 'Moldova', 
        'PA': 'Paraguay', // 如果欧洲有PA的话
        'MA': 'Morocco',
        'DE': 'Germany',
        'FR': 'France',
        'IT': 'Italy',
        'GB': 'United Kingdom',
        'ES': 'Spain',
        'NL': 'Netherlands',
        'BE': 'Belgium',
        'AT': 'Austria',
        'CH': 'Switzerland',
        'PL': 'Poland',
        'CZ': 'Czech Republic',
        'GR': 'Greece',
        'PT': 'Portugal',
        'HU': 'Hungary',
        'RO': 'Romania',
        'BG': 'Bulgaria',
        'HR': 'Croatia',
        'SK': 'Slovakia',
        'SI': 'Slovenia',
        'LT': 'Lithuania',
        'LV': 'Latvia',
        'EE': 'Estonia',
        'FI': 'Finland',
        'SE': 'Sweden',
        'DK': 'Denmark',
        'NO': 'Norway',
        'IE': 'Ireland'
      },
      'mid-e': {
        'IL': 'Israel',
        'AE': 'United Arab Emirates',
        'SA': 'Saudi Arabia',
        'KW': 'Kuwait',
        'QA': 'Qatar',
        'BH': 'Bahrain',
        'OM': 'Oman',
        'JO': 'Jordan',
        'LB': 'Lebanon',
        'IQ': 'Iraq',
        'TR': 'Turkey',
        'IR': 'Iran'
      },
      'lat-a': {
        'PA': 'Panama',
        'BR': 'Brazil',
        'AR': 'Argentina',
        'MX': 'Mexico',
        'CO': 'Colombia',
        'PE': 'Peru',
        'VE': 'Venezuela',
        'CL': 'Chile',
        'EC': 'Ecuador',
        'BO': 'Bolivia',
        'UY': 'Uruguay',
        'PY': 'Paraguay',
        'CR': 'Costa Rica',
        'GT': 'Guatemala',
        'HN': 'Honduras',
        'SV': 'El Salvador',
        'NI': 'Nicaragua',
        'DO': 'Dominican Republic',
        'CU': 'Cuba'
      },
      'as': {
        'MA': 'Malaysia', // 如果亚洲有MA的话，可能是马来西亚的某个州
        'CN': 'China',
        'JP': 'Japan',
        'KR': 'South Korea',
        'IN': 'India',
        'TH': 'Thailand',
        'VN': 'Vietnam',
        'PH': 'Philippines',
        'SG': 'Singapore',
        'MY': 'Malaysia',
        'ID': 'Indonesia',
        'TW': 'Taiwan',
        'HK': 'Hong Kong',
        'MO': 'Macau',
        'KH': 'Cambodia',
        'LA': 'Laos',
        'MM': 'Myanmar',
        'BN': 'Brunei',
        'BD': 'Bangladesh',
        'LK': 'Sri Lanka',
        'PK': 'Pakistan',
        'AF': 'Afghanistan',
        'MN': 'Mongolia',
        'KZ': 'Kazakhstan',
        'UZ': 'Uzbekistan',
        'KG': 'Kyrgyzstan',
        'TJ': 'Tajikistan',
        'TM': 'Turkmenistan'
      },
      'af': {
        'ZA': 'South Africa',
        'NG': 'Nigeria',
        'KE': 'Kenya',
        'TZ': 'Tanzania',
        'UG': 'Uganda',
        'ET': 'Ethiopia',
        'GH': 'Ghana',
        'CI': 'Ivory Coast',
        'SN': 'Senegal',
        'MA': 'Morocco',
        'DZ': 'Algeria',
        'TN': 'Tunisia',
        'LY': 'Libya',
        'EG': 'Egypt',
        'SD': 'Sudan',
        'ZW': 'Zimbabwe',
        'BW': 'Botswana',
        'NA': 'Namibia',
        'ZM': 'Zambia',
        'MW': 'Malawi',
        'MZ': 'Mozambique'
      },
      'aus-nzl': {
        'AU': 'Australia',
        'NZ': 'New Zealand',
        'FJ': 'Fiji',
        'PG': 'Papua New Guinea',
        'NC': 'New Caledonia',
        'VU': 'Vanuatu',
        'SB': 'Solomon Islands',
        'TO': 'Tonga',
        'WS': 'Samoa',
        'FM': 'Micronesia',
        'PW': 'Palau',
        'MH': 'Marshall Islands',
        'KI': 'Kiribati',
        'NR': 'Nauru',
        'TV': 'Tuvalu'
      }
    }

    // 先尝试region特定映射
    if (regionSpecificMapping[region] && regionSpecificMapping[region][countryCode]) {
      return regionSpecificMapping[region][countryCode]
    }

    // 如果没有region特定映射，使用原来的全局映射（但排除会冲突的代码）
    if (COUNTRY_CODE_TO_MAP_NAME[countryCode]) {
      // 排除容易冲突的代码，这些必须通过region确定
      const conflictingCodes = ['IL', 'PA', 'MD', 'MA', 'CA']
      if (conflictingCodes.includes(countryCode)) {
        console.warn(`⚠️ 冲突代码 ${countryCode} 在 region ${region} 中没有映射`)
        return null
      }
      return COUNTRY_CODE_TO_MAP_NAME[countryCode]
    }

    // 如果都没有，返回原代码作为国家名
    return countryCode
  }

  /**
   * 获取地区坐标
   */
  getRegionCoordinates(region) {
    const coordinates = {
      'usa': [-95.7129, 37.0902],
      'can': [-106.3468, 56.1304],
      'eur': [10.4515, 51.1657],
      'aus-nzl': [133.7751, -25.2744],
      'as': [100.6197, 34.0479],
      'lat-a': [-58.3816, -14.2350],
      'mid-e': [51.1839, 35.6892],
      'af': [20.0000, 0.0000]
    }
    return coordinates[region] || [0, 0]
  }

  /**
   * 缓存管理
   */
  getCachedData(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    return null
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  clearCache() {
    this.cache.clear()
    console.log('🗑️ 竞争数据服务缓存已清除')
  }

  /**
   * 向后兼容的旧API方法
   * 保持现有API接口的兼容性
   */
  async getByCompany(companyId, category = null, limit = 100) {
    console.log('⚠️ 使用了旧的getByCompany API，建议使用新的getCompetitiveOverview')
    const overview = await this.getCompetitiveOverview()
    return overview.distributors || []
  }

  async getByCategory(companyId) {
    console.log('⚠️ 使用了旧的getByCategory API，建议使用新的getCompetitiveOverview')
    const overview = await this.getCompetitiveOverview()
    return {
      distributors: overview.distributors || {},
      yearly_trends: overview.yearlyTrends || {}
    }
  }
}

// 创建单例实例
export const competitiveDataService = new CompetitiveDataService()

// 导出类供测试使用
export default CompetitiveDataService