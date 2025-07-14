import axios from 'axios'

// API 基础配置 - 连接到真实的后端API
const API_BASE = 'http://localhost:8000/api'

// 配置 axios 实例
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 分销商相关 API
export const distributorsAPI = {
  // 获取分析概览统计 (使用真实数据库数据)
  async getSummary() {
    try {
      console.log('Fetching distributor summary from database...')
      
      // 先尝试从本地JSON文件读取真实数据库数据
      try {
        const response = await fetch('/data/distributors.json')
        if (response.ok) {
          const realData = await response.json()
          console.log('Successfully loaded real database data:', realData)
          console.log('Real data has countries?', !!realData.data.countries)
          console.log('Countries count:', Object.keys(realData.data.countries || {}).length)
          return realData
        }
      } catch (fileError) {
        console.warn('Failed to load real database data from file:', fileError)
      }
      
      // 如果本地文件不可用，尝试后端API
      const healthCheck = await api.get('/health').catch(() => null)
      
      if (healthCheck) {
        console.log('Backend API is available, trying API endpoints...')
        
        // 调用真实的后端API
        const [analyticsResponse, geoResponse, coverageResponse] = await Promise.allSettled([
          api.get('/analytics/summary'),
          api.get('/analytics/geographic-distribution'),
          api.get('/analytics/coverage-analysis')
        ])
        
        if (analyticsResponse.status === 'fulfilled') {
        const analytics = analyticsResponse.value.data
        const geo = geoResponse.status === 'fulfilled' ? geoResponse.value.data : null
        const coverage = coverageResponse.status === 'fulfilled' ? coverageResponse.value.data : null
        
        // 处理真实数据并转换为前端需要的格式
        const regionData = {}
        const topCountries = []
        
        // 从地理分布数据构建区域信息
        if (geo && geo.geographic_distribution) {
          Object.entries(geo.geographic_distribution).forEach(([region, data]) => {
            // 获取该地区的坐标数据
            let coordinates = [0, 0]
            if (coverage && coverage.coverage_analysis && coverage.coverage_analysis[region] && 
                coverage.coverage_analysis[region].coordinates.length > 0) {
              // 计算该地区所有分销商的中心点
              const coords = coverage.coverage_analysis[region].coordinates
              const avgLat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length
              const avgLng = coords.reduce((sum, c) => sum + c.lng, 0) / coords.length
              coordinates = [avgLng, avgLat]
            }
            
            regionData[region] = {
              name_key: getRegionKey(region),
              code: region,
              count: data.total,
              coordinates: coordinates,
              growth: Math.random() * 20 + 5, // 临时增长率，真实API暂无此数据
              lastUpdated: new Date().toISOString()
            }
            
            // 添加该地区的国家到 topCountries
            if (data.locations) {
              data.locations.forEach(location => {
                topCountries.push({
                  name: location.country_state,
                  count: location.total,
                  region: region,
                  growth: Math.random() * 15 + 2
                })
              })
            }
          })
        }
        
        // 按分销商数量排序
        topCountries.sort((a, b) => b.count - a.count)
        
          return {
            success: true,
            data: {
              totalCount: analytics.total_distributors,
              activeCount: analytics.active_distributors,
              masterDistributors: analytics.master_distributors,
              authorizedResellers: analytics.reseller_distributors,
              regions: regionData,
              topCountries: topCountries.slice(0, 10) // 取前10个
            },
            timestamp: new Date().toISOString()
          }
        } else {
          console.warn('Backend API failed, using fallback data')
          return getFallbackData()
        }
      } else {
        console.warn('Backend API is not available, using fallback data')
        return getFallbackData()
      }
    } catch (error) {
      console.error('Failed to fetch distributor summary:', error)
      
      // 如果API调用失败，返回静态数据作为备选
      console.warn('Falling back to static data due to API error')
      return getFallbackData()
    }
  },

  // 获取特定地区的分销商详情
  async getByRegion(regionCode) {
    try {
      // TODO: 连接到真实的后端 API
      // const response = await axios.get(`${API_BASE}/distributors/region/${regionCode}`)
      // return response.data
      
      await new Promise(resolve => setTimeout(resolve, 300))
      
      return {
        success: true,
        data: {
          region: regionCode,
          distributors: [
            // 模拟分销商详细数据
            {
              id: 'unifi_001',
              name: 'Ingram Micro Inc.',
              type: 'master',
              country: 'USA',
              city: 'Santa Ana',
              status: 'active',
              lastUpdated: '2024-01-15T10:30:00Z'
            }
          ]
        }
      }
    } catch (error) {
      console.error(`Failed to fetch distributors for region ${regionCode}:`, error)
      throw error
    }
  },

  // 获取分销商变化历史
  async getChangeHistory(days = 30) {
    try {
      // TODO: 连接到真实的后端 API
      // const response = await axios.get(`${API_BASE}/distributors/changes?days=${days}`)
      // return response.data
      
      await new Promise(resolve => setTimeout(resolve, 400))
      
      return {
        success: true,
        data: {
          period: `${days} days`,
          changes: [
            {
              type: 'added',
              count: 12,
              regions: ['eur', 'as', 'lat-a']
            },
            {
              type: 'removed',
              count: 3,
              regions: ['usa', 'can']
            },
            {
              type: 'updated',
              count: 25,
              regions: ['eur', 'usa', 'as']
            }
          ]
        }
      }
    } catch (error) {
      console.error('Failed to fetch change history:', error)
      throw error
    }
  }
}

// 地区显示名称映射
function getRegionKey(regionCode) {
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
  return regionKeys[regionCode] || regionCode
}

// 备选静态数据（当API调用失败时使用）
function getFallbackData() {
  return {
    success: true,
    data: {
      totalCount: 634,
      activeCount: 618,
      masterDistributors: 28,
      authorizedResellers: 606,
      regions: {
        usa: { 
          name_key: 'usa', 
          code: 'usa',
          count: 156, 
          coordinates: [-95.7129, 37.0902], 
          growth: 12.3,
          lastUpdated: '2024-01-15T10:30:00Z'
        },
        can: { 
          name_key: 'canada', 
          code: 'can',
          count: 47, 
          coordinates: [-106.3468, 56.1304], 
          growth: 8.1,
          lastUpdated: '2024-01-15T10:30:00Z'
        },
        eur: { 
          name_key: 'europe', 
          code: 'eur',
          count: 203, 
          coordinates: [10.4515, 51.1657], 
          growth: 15.2,
          lastUpdated: '2024-01-15T10:30:00Z'
        },
        'aus-nzl': { 
          name_key: 'oceania', 
          code: 'aus-nzl',
          count: 34, 
          coordinates: [133.7751, -25.2744], 
          growth: 5.7,
          lastUpdated: '2024-01-15T10:30:00Z'
        },
        as: { 
          name_key: 'asia', 
          code: 'as',
          count: 89, 
          coordinates: [100.6197, 34.0479], 
          growth: 22.4,
          lastUpdated: '2024-01-15T10:30:00Z'
        },
        'lat-a': { 
          name_key: 'latin_america', 
          code: 'lat-a',
          count: 67, 
          coordinates: [-58.3816, -14.2350], 
          growth: 18.9,
          lastUpdated: '2024-01-15T10:30:00Z'
        },
        'mid-e': { 
          name_key: 'middle_east', 
          code: 'mid-e',
          count: 23, 
          coordinates: [51.1839, 35.6892], 
          growth: 10.3,
          lastUpdated: '2024-01-15T10:30:00Z'
        },
        af: { 
          name_key: 'africa', 
          code: 'af',
          count: 15, 
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