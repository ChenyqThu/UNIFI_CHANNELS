/**
 * 国际化数据工具函数
 * 用于在store和组件中获取国际化的数据内容
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * 获取国际化的分销商数据
 * @param {string} distributorKey - 分销商键值
 * @returns {object} 国际化的分销商信息
 */
export function useDistributorData(distributorKey) {
  const { t } = useI18n()
  
  const valueProposition = computed(() => 
    t(`channel_data.distributors.${distributorKey}.value_proposition`)
  )
  
  return {
    valueProposition
  }
}

/**
 * 获取国际化的竞争对手数据
 * @param {object} competitorData - 竞争对手原始数据
 * @returns {object} 国际化的竞争对手信息
 */
export function useCompetitorData(competitorData) {
  const { t } = useI18n()
  
  return {
    strengths: computed(() => 
      competitorData.strengths_keys?.map(key => t(`competitive.${key}`)) || []
    ),
    marketPosition: computed(() => 
      competitorData.market_position_key ? t(`competitive.${competitorData.market_position_key}`) : ''
    ),
    opportunity: computed(() => 
      competitorData.opportunity_key ? t(`competitive.${competitorData.opportunity_key}`) : ''
    )
  }
}

/**
 * 获取国际化的地区数据
 * @param {object} regionData - 地区原始数据
 * @returns {object} 国际化的地区信息
 */
export function useRegionData(regionData) {
  const { t } = useI18n()
  
  return {
    name: computed(() => 
      regionData.name_key ? t(`regions.${regionData.name_key}`) : regionData.name || ''
    )
  }
}

/**
 * 获取国际化的国家数据
 * @param {object} countryData - 国家原始数据
 * @returns {object} 国际化的国家信息
 */
export function useCountryData(countryData) {
  const { t } = useI18n()
  
  return {
    name: computed(() => 
      countryData.name_key ? t(`regions.${countryData.name_key}`) : countryData.name || ''
    )
  }
}

/**
 * 获取国际化的渠道问题数据
 * @param {string} issueKey - 问题键值
 * @returns {object} 国际化的问题信息
 */
export function useChannelIssueData(issueKey) {
  const { t } = useI18n()
  
  return {
    title: computed(() => t(`channel_data.issues.${issueKey}.title`)),
    description: computed(() => t(`channel_data.issues.${issueKey}.description`)),
    impact: computed(() => t(`channel_data.issues.${issueKey}.impact`))
  }
}

/**
 * 获取国际化的SWOT分析数据
 * @returns {object} 国际化的SWOT数据
 */
export function useSwotData() {
  const { t } = useI18n()
  
  return {
    strengths: computed(() => [
      t('channel_data.disruptive_value_proposition'),
      t('channel_data.strong_brand_community'),
      t('channel_data.comprehensive_ecosystem')
    ]),
    weaknesses: computed(() => [
      t('channel_data.official_support_vacuum'),
      t('channel_data.inherent_channel_conflict'),
      t('channel_data.supply_chain_instability'),
      t('channel_data.fragmented_warranty_policies')
    ]),
    opportunities: computed(() => [
      t('channel_data.deepen_smb_market_penetration'),
      t('channel_data.service_layer_formalization')
    ]),
    threats: computed(() => [
      t('channel_data.competitor_exploitation'),
      t('channel_data.channel_partner_attrition'),
      t('channel_data.brand_reputation_damage')
    ])
  }
}

/**
 * 获取带有国际化键值的分销商基础数据
 * 这些数据结构保持不变，只有显示文本会被国际化
 */
export function getDistributorBaseData() {
  return {
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
  }
}

/**
 * 获取带有国际化键值的渠道问题数据
 */
export function getChannelIssuesBaseData() {
  return [
    {
      category: 'inventory',
      severity: 'high',
      issue_key: 'inventory_transparency',
      regions_affected: ['US', 'Canada']
    },
    {
      category: 'support',
      severity: 'medium',
      issue_key: 'official_support',
      regions_affected: ['Global']
    },
    {
      category: 'warranty',
      severity: 'medium',
      issue_key: 'warranty_fragmentation',
      regions_affected: ['US', 'Canada']
    }
  ]
}