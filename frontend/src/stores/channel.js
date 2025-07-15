import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { distributorsAPI } from '@/api/distributors'

// 地区代码到英文翻译key的映射
function getRegionNameKey(regionCode) {
  const regionMapping = {
    'usa': 'usa',
    'can': 'canada', 
    'eur': 'europe',
    'aus-nzl': 'oceania',
    'as': 'asia',
    'lat-a': 'latin_america',
    'mid-e': 'middle_east',
    'af': 'africa'
  }
  return regionMapping[regionCode] || regionCode
}

export const useChannelStore = defineStore('channel', () => {
  // State
  const loading = ref(false)
  const error = ref(null)
  
  // Financial Data
  const financialData = ref({
    q3_2025: {
      total_revenue: 664.2,
      enterprise_revenue: 585.7,
      service_provider_revenue: 78.4,
      north_america_revenue: 322.7,
      emea_revenue: 282.1,
      gross_profit: 295.9,
      gross_margin: 44.5,
      net_income: 180.4,
      eps: 2.98
    },
    q3_2024: {
      total_revenue: 493.0,
      enterprise_revenue: 414.3,
      service_provider_revenue: 78.7,
      north_america_revenue: 242.5,
      emea_revenue: 200.7,
      gross_profit: 174.1,
      gross_margin: 35.3,
      net_income: 76.3,
      eps: 1.26
    }
  })
  
  // Distribution Network Data
  const distributionData = ref({
    us_distributors: [
      {
        name: 'Ingram Micro',
        type: 'global_giant',
        customers: '161,000+',
        suppliers: '1,500+',
        services: ['Xvantage Platform', 'Financial Support', 'Training', 'Marketing'],
        value_proposition_key: 'ingram_micro'
      },
      {
        name: 'Streakwave Wireless',
        type: 'wireless_specialist',
        locations: ['California', 'Utah', 'Ohio'],
        services: ['Wireless Solutions', 'Competitive Pricing'],
        challenges: ['Pre-payment Requirements', 'Stock Transparency'],
        value_proposition_key: 'streakwave'
      },
      {
        name: 'DoubleRadius',
        type: 'value_added',
        since: 2001,
        coverage: ['US', 'Canada', 'Latin America'],
        services: ['Reseller Program', 'Certified Training', 'Technical Support'],
        certifications: ['UWA', 'UBWA', 'UFSPc'],
        value_proposition_key: 'doubleradius'
      }
    ],
    canada_distributors: [
      {
        name: 'TDL Gentek',
        type: 'regional_gateway',
        experience: '40+ years',
        locations: ['Trenton', 'Concord', 'Edmonton', 'Laval'],
        services: ['TDL Gentek University', 'Bulk Discounts', 'French Support'],
        certifications: ['UWA', 'UBWA', 'UFSPc', 'URSCA'],
        value_proposition_key: 'tdl_gentek'
      }
    ]
  })
  
  // Channel Issues
  const channelIssues = ref([
    {
      category: 'inventory',
      severity: 'high',
      title_key: 'inventory_transparency',
      description_key: 'inventory_transparency_desc',
      impact_key: 'inventory_transparency_impact',
      regions_affected: ['US', 'Canada']
    },
    {
      category: 'support',
      severity: 'medium',
      title_key: 'official_support',
      description_key: 'official_support_desc',
      impact_key: 'official_support_impact',
      regions_affected: ['Global']
    },
    {
      category: 'warranty',
      severity: 'medium',
      title_key: 'warranty_fragmentation',
      description_key: 'warranty_fragmentation_desc',
      impact_key: 'warranty_fragmentation_impact',
      regions_affected: ['US', 'Canada']
    }
  ])
  
  // SWOT Analysis Data
  const swotAnalysis = ref({
    strengths_keys: [
      'disruptive_value_proposition',
      'strong_brand_community',
      'comprehensive_ecosystem'
    ],
    weaknesses_keys: [
      'official_support_vacuum',
      'inherent_channel_conflict',
      'supply_chain_instability',
      'fragmented_warranty_policies'
    ],
    opportunities_keys: [
      'deepen_smb_market_penetration',
      'service_layer_formalization'
    ],
    threats_keys: [
      'competitor_exploitation',
      'channel_partner_attrition',
      'brand_reputation_damage'
    ]
  })
  
  // Competitive Intelligence
  const competitiveData = ref([
    {
      competitor: 'Aruba Instant On',
      strengths_keys: ['stable_partner_policy', 'enterprise_support', 'reliable_inventory'],
      market_position_key: 'smb_direct_competitor',
      threat_level: 'high',
      opportunity_key: 'attract_dissatisfied_msp_partners'
    },
    {
      competitor: 'Cisco Meraki',
      strengths_keys: ['cloud_management_advantage', 'enterprise_support', 'complete_channel_system'],
      market_position_key: 'high_end_enterprise_leader',
      threat_level: 'medium',
      opportunity_key: 'price_sensitive_customers_switch'
    }
  ])

  // Computed properties
  const revenueGrowth = computed(() => {
    const current = financialData.value.q3_2025.total_revenue
    const previous = financialData.value.q3_2024.total_revenue
    return ((current - previous) / previous * 100).toFixed(1)
  })

  const enterpriseGrowth = computed(() => {
    const current = financialData.value.q3_2025.enterprise_revenue
    const previous = financialData.value.q3_2024.enterprise_revenue
    return ((current - previous) / previous * 100).toFixed(1)
  })

  const northAmericaGrowth = computed(() => {
    const current = financialData.value.q3_2025.north_america_revenue
    const previous = financialData.value.q3_2024.north_america_revenue
    return ((current - previous) / previous * 100).toFixed(1)
  })

  const marginImprovement = computed(() => {
    const current = financialData.value.q3_2025.gross_margin
    const previous = financialData.value.q3_2024.gross_margin
    return (current - previous).toFixed(1)
  })

  // Actions
  const fetchChannelData = async () => {
    loading.value = true
    error.value = null
    
    try {
      // In real app, this would fetch from API
      // const response = await axios.get('/api/channel-data')
      // For now, we use the static data defined above
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      loading.value = false
    } catch (err) {
      error.value = err.message
      loading.value = false
    }
  }

  // Distributor/Reseller Data (Real database integration)
  const resellerData = ref({
    regions: {
      usa: { name_key: 'usa', count: 30, masters: 11, resellers: 19, coordinates: [-95.7129, 37.0902], growth: '+12%' },
      can: { name_key: 'canada', count: 11, masters: 3, resellers: 8, coordinates: [-106.3468, 56.1304], growth: '+8%' },
      eur: { name_key: 'europe', count: 297, masters: 82, resellers: 215, coordinates: [10.4515, 51.1657], growth: '+15%' },
      'aus-nzl': { name_key: 'oceania', count: 21, masters: 4, resellers: 17, coordinates: [133.7751, -25.2744], growth: '+5%' },
      as: { name_key: 'asia', count: 90, masters: 34, resellers: 56, coordinates: [100.6197, 34.0479], growth: '+22%' },
      'lat-a': { name_key: 'latin_america', count: 63, masters: 40, resellers: 23, coordinates: [-58.3816, -14.2350], growth: '+18%' },
      'mid-e': { name_key: 'middle_east', count: 44, masters: 12, resellers: 32, coordinates: [51.1839, 35.6892], growth: '+10%' },
      af: { name_key: 'africa', count: 23, masters: 8, resellers: 15, coordinates: [20.0000, 0.0000], growth: '+7%' }
    },
    totalCount: 579,
    masterDistributors: 194,
    authorizedResellers: 385,
    topCountries: [
      { name_key: 'usa', count: 156, region: 'usa', growth: 12 },
      { name_key: 'germany', count: 45, region: 'eur', growth: 15 },
      { name_key: 'uk', count: 38, region: 'eur', growth: 8 },
      { name_key: 'canada', count: 47, region: 'can', growth: 8 },
      { name_key: 'australia', count: 28, region: 'aus-nzl', growth: 5 },
      { name_key: 'france', count: 32, region: 'eur', growth: 12 },
      { name_key: 'japan', count: 24, region: 'as', growth: 20 },
      { name_key: 'netherlands', count: 22, region: 'eur', growth: 18 },
      { name_key: 'brazil', count: 19, region: 'lat-a', growth: 25 },
      { name_key: 'italy', count: 18, region: 'eur', growth: 10 }
    ]
  })

  const fetchResellerData = async () => {
    loading.value = true
    error.value = null
    
    try {
      console.log('fetchResellerData: Starting API call...')
      
      // 使用真实的 API 集成
      const response = await distributorsAPI.getSummary()
      console.log('fetchResellerData: API response received:', response)
      
      if (response.success) {
        // 将 API 数据格式化为前端需要的格式
        const apiData = response.data
        console.log('fetchResellerData: Raw API data:', apiData)
        
        // 预处理国家数据，使用 countryMapping 进行映射
        const { convertToMapData } = await import('@/utils/countryMapping')
        const processedCountriesForMap = convertToMapData(apiData.countries || {})
        
        console.log('fetchResellerData: Processed countries for map:', processedCountriesForMap)
        
        const formattedData = {
          regions: apiData.regions ? Object.fromEntries(
            Object.entries(apiData.regions).map(([key, region]) => {
              // 如果 API 数据中没有 masters/resellers 分解，根据总数进行估算
              const totalCount = region.count || 0
              const masters = region.masters || Math.round(totalCount * 0.04) // 约4%为主要分销商
              const resellers = region.resellers || (totalCount - masters) // 其余为授权经销商
              
              return [
                key, 
                {
                  ...region,
                  name_key: getRegionNameKey(key), // 添加翻译用的英文key
                  name: region.name, // 保持原始名称作为备用
                  masters: masters,
                  resellers: resellers,
                  growth: region.growth // 保持数字格式，不添加%符号
                }
              ]
            })
          ) : {},
          countries: apiData.countries || {}, // 原始国家数据
          countriesForMap: processedCountriesForMap, // 预处理的地图数据
          totalCount: apiData.totalCount || 0,
          masterDistributors: apiData.masterDistributors || 0,
          authorizedResellers: apiData.authorizedResellers || 0,
          topCountries: apiData.topCountries || []
        }
        
        console.log('fetchResellerData: Formatted data:', formattedData)
        resellerData.value = formattedData
        console.log('fetchResellerData: Data stored in resellerData.value:', resellerData.value)
      } else {
        console.error('fetchResellerData: API response not successful:', response)
        // 当 API 失败时，使用静态数据作为后备
        console.log('fetchResellerData: Using static fallback data')
        // 静态数据已经包含 masters/resellers，无需修改
      }
      
      loading.value = false
    } catch (err) {
      error.value = err.message
      loading.value = false
      console.error('Failed to fetch reseller data:', err)
      // 当API调用失败时，使用静态数据作为后备
      console.log('fetchResellerData: Using static fallback data due to error')
    }
  }

  const updateFinancialData = (newData) => {
    financialData.value = { ...financialData.value, ...newData }
  }

  return {
    // State
    loading,
    error,
    financialData,
    distributionData,
    channelIssues,
    swotAnalysis,
    competitiveData,
    resellerData,
    
    // Computed
    revenueGrowth,
    enterpriseGrowth,
    northAmericaGrowth,
    marginImprovement,
    
    // Actions
    fetchChannelData,
    fetchResellerData,
    updateFinancialData
  }
})