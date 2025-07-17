import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { distributorsAPI } from '@/api/distributors'
import { financialDataService } from '@/services/financialDataService'

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
  
  // Financial Data - 现在从JSON文件动态加载
  const financialData = ref({
    q1_2025: null,
    q3_2024: null,
    nine_months_2025: null,
    nine_months_2024: null
  })
  const channelData = ref({
    distribution_mix: null
  })
  const financialMetadata = ref({})
  const financialComputed = ref({})
  
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

  // Computed properties - 适配新的数据结构
  const revenueGrowth = computed(() => {
    return financialComputed.value?.growth_metrics?.revenue_growth || '0.0'
  })

  const enterpriseGrowth = computed(() => {
    return financialComputed.value?.growth_metrics?.enterprise_growth || '0.0'
  })

  const northAmericaGrowth = computed(() => {
    return financialComputed.value?.growth_metrics?.north_america_growth || '0.0'
  })

  const marginImprovement = computed(() => {
    return financialComputed.value?.growth_metrics?.margin_improvement || '0.0'
  })

  // 新的computed属性用于九个月数据
  const nineMonthsRevenueGrowth = computed(() => {
    return financialComputed.value?.nine_months_metrics?.revenue_growth || '0.0'
  })

  const nineMonthsNetIncomeGrowth = computed(() => {
    return financialComputed.value?.nine_months_metrics?.net_income_growth || '0.0'
  })

  const nineMonthsMarginImprovement = computed(() => {
    return financialComputed.value?.nine_months_metrics?.margin_improvement || '0.0'
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

  // 新的财报数据加载action
  const fetchFinancialData = async () => {
    loading.value = true
    error.value = null
    
    try {
      if (import.meta.env.VITE_DEBUG_MODE === 'true') {
        console.log('🏪 Store: 开始加载财报数据...')
      }
      
      // 使用财报数据服务加载数据
      const data = await financialDataService.loadFinancialData()
      
      // 更新store中的数据
      financialMetadata.value = data.metadata
      financialComputed.value = data.computed
      
      // 转换数据格式以兼容现有组件
      // 处理不同数据源的结构差异
      const q1_2025 = data.quarterly?.q1_2025 || {}
      const q3_2024 = data.quarterly?.q3_2024 || {}
      const nine_months_2025 = data.annual?.nine_months_2025 || {}
      const nine_months_2024 = data.annual?.nine_months_2024 || {}

      financialData.value = {
        q1_2025: {
          total_revenue: q1_2025.revenue?.total || 0,
          enterprise_revenue: q1_2025.revenue?.enterprise_technology || 0,
          service_provider_revenue: q1_2025.revenue?.service_provider_technology || 0,
          north_america_revenue: q1_2025.regional_breakdown?.north_america?.amount || 0,
          emea_revenue: q1_2025.regional_breakdown?.emea?.amount || 0,
          apac_revenue: q1_2025.regional_breakdown?.apac?.amount || 0,
          south_america_revenue: q1_2025.regional_breakdown?.south_america?.amount || 0,
          gross_profit: q1_2025.profitability?.gross_profit || 0,
          gross_margin: q1_2025.profitability?.gross_margin || 0,
          operating_margin: q1_2025.profitability?.operating_margin || 0,
          net_margin: q1_2025.profitability?.net_margin || 0,
          net_income: q1_2025.profitability?.net_income || 0,
          eps: q1_2025.profitability?.eps_diluted || 0
        },
        q3_2024: {
          total_revenue: q3_2024.revenue?.total || 0,
          enterprise_revenue: q3_2024.revenue?.enterprise_technology || 0,
          service_provider_revenue: q3_2024.revenue?.service_provider_technology || 0,
          north_america_revenue: q3_2024.regional_breakdown?.north_america?.amount || 0,
          emea_revenue: q3_2024.regional_breakdown?.emea?.amount || 0,
          gross_profit: q3_2024.profitability?.gross_profit || 0,
          gross_margin: q3_2024.profitability?.gross_margin || 0,
          operating_margin: q3_2024.profitability?.operating_margin || 0,
          net_margin: q3_2024.profitability?.net_margin || 0,
          net_income: q3_2024.profitability?.net_income || 0,
          eps: q3_2024.profitability?.eps_diluted || 0
        },
        nine_months_2025: {
          total_revenue: nine_months_2025.revenue?.total || 0,
          net_income: nine_months_2025.profitability?.net_income || 0,
          gross_margin: nine_months_2025.profitability?.gross_margin || 0,
          inventory_increase: nine_months_2025.inventory?.increase || 0
        },
        nine_months_2024: {
          total_revenue: nine_months_2024.revenue?.total || 0,
          net_income: nine_months_2024.profitability?.net_income || 0,
          gross_margin: nine_months_2024.profitability?.gross_margin || 0
        }
      }

      // 渠道数据
      channelData.value = {
        distribution_mix: {
          distributor_channel: data.channelStrategy.distribution_mix.distributor_channel.percentage,
          direct_sales: data.channelStrategy.distribution_mix.direct_sales.percentage
        },
        channel_insights: data.channelStrategy.strategic_insights,
        business_segments: data.businessSegments,
        strategic_risks: data.strategicRisks
      }
      
      if (import.meta.env.VITE_DEBUG_MODE === 'true') {
        console.log('✅ Store: 财报数据加载完成', {
          metadata: financialMetadata.value,
          quarterlyPeriods: Object.keys(data.quarterly),
          channelMix: channelData.value.distribution_mix
        })
      }
      
      loading.value = false
      
    } catch (err) {
      console.error('❌ Store: 财报数据加载失败:', err)
      error.value = err.message
      loading.value = false
      throw err
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
      console.log('🔄 Store: 使用新的统一数据服务获取分销商数据...')
      
      // 使用新的统一竞争数据服务
      const { competitiveDataService } = await import('@/services/competitiveDataService')
      const overview = await competitiveDataService.getCompetitiveOverview()
      
      console.log('✅ Store: 统一数据服务返回结果:', overview)
      
      // 使用标准化的数据结构
      const distributorData = overview.distributors
      
      // 验证美国数据
      const usaRegion = distributorData.regions?.usa
      if (usaRegion) {
        console.log(`🇺🇸 Store: 美国地区数据 - ${usaRegion.count} 个 (${usaRegion.masters} masters, ${usaRegion.resellers} resellers)`)
      }
      
      // 验证地图数据中的美国数据
      const usaMapData = distributorData.mapData?.find(item => item.name === 'USA')
      if (usaMapData) {
        console.log(`🗺️ Store: 美国地图数据 - ${usaMapData.count} 个 (${usaMapData.masters} masters, ${usaMapData.resellers} resellers)`)
      }
      
      // 直接使用处理好的数据，无需额外转换
      resellerData.value = {
        regions: distributorData.regions || {},
        countries: distributorData.countries || {},
        countriesForMap: distributorData.mapData || [], // 使用预处理的地图数据
        totalCount: distributorData.summary?.totalCount || 0,
        masterDistributors: distributorData.summary?.masterDistributors || 0,
        authorizedResellers: distributorData.summary?.authorizedResellers || 0,
        topCountries: distributorData.mapData?.slice(0, 10) || [], // 使用地图数据作为top countries
        lastUpdated: distributorData.lastUpdated
      }
      
      console.log('✅ Store: 分销商数据更新完成，使用统一数据服务')
      loading.value = false
      
    } catch (err) {
      console.error('❌ Store: 使用统一数据服务获取数据失败:', err)
      error.value = err.message
      loading.value = false
      
      // 降级到旧API作为备用
      console.log('🔄 Store: 降级使用旧API...')
      try {
        const response = await distributorsAPI.getSummary()
        if (response.success) {
          // 简化处理，直接使用API数据
          const apiData = response.data
          resellerData.value = {
            regions: apiData.regions || {},
            countries: apiData.countries || {},
            countriesForMap: Object.values(apiData.countries || {}),
            totalCount: apiData.totalCount || 0,
            masterDistributors: apiData.masterDistributors || 0,
            authorizedResellers: apiData.authorizedResellers || 0,
            topCountries: apiData.topCountries || []
          }
          console.log('✅ Store: 使用旧API获取数据成功')
        }
      } catch (fallbackErr) {
        console.error('❌ Store: 旧API也失败了:', fallbackErr)
      }
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
    channelData,
    financialMetadata,
    financialComputed,
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
    nineMonthsRevenueGrowth,
    nineMonthsNetIncomeGrowth,
    nineMonthsMarginImprovement,
    
    // Actions
    fetchChannelData,
    fetchFinancialData,
    fetchResellerData,
    updateFinancialData
  }
})