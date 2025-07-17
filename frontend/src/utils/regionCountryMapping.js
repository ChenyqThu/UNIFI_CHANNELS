/**
 * Region to Country Mapping for Unifi Distributor System
 * 
 * Maps the 8 regional classifications used in the system to their corresponding countries
 * in the world.json GeoJSON file. Country names must match exactly as they appear in
 * the GeoJSON properties.name field.
 */

export const regionCountryMapping = {
  // United States
  'usa': [
    'USA'
  ],

  // Europe
  'europe': [
    'Albania',
    'Austria',
    'Belarus',
    'Belgium',
    'Bosnia and Herzegovina',
    'Bulgaria',
    'Croatia',
    'Cyprus',
    'Czech Republic',
    'Denmark',
    'England',  // Note: England appears separately in world.json
    'Estonia',
    'Finland',
    'France',
    'Germany',
    'Greece',
    'Hungary',
    'Iceland',
    'Ireland',
    'Italy',
    'Latvia',
    'Lithuania',
    'Luxembourg',
    'Moldova',
    'Montenegro',
    'Netherlands',
    'Northern Ireland',
    'Norway',
    'Poland',
    'Portugal',
    'Romania',
    'Scotland',
    'Serbia',
    'Slovakia',
    'Slovenia',
    'Spain',
    'Sweden',
    'Switzerland',
    'Ukraine',
    'Wales'
  ],

  // Asia
  'asia': [
    'Afghanistan',
    'Bangladesh',
    'Bhutan',
    'Brunei',
    'Cambodia',
    'China',
    'East Timor',
    'India',
    'Indonesia',
    'Japan',
    'Kazakhstan',
    'Kyrgyzstan',
    'Laos',
    'Malaysia',
    'Maldives',
    'Mongolia',
    'Myanmar',
    'Nepal',
    'North Korea',
    'Pakistan',
    'Philippines',
    'Singapore',
    'South Korea',
    'Sri Lanka',
    'Taiwan',
    'Tajikistan',
    'Thailand',
    'Turkmenistan',
    'Uzbekistan',
    'Vietnam'
  ],

  // Canada
  'canada': [
    'Canada'
  ],

  // Latin America
  'latin_america': [
    'Argentina',
    'Belize',
    'Bolivia',
    'Brazil',
    'Chile',
    'Colombia',
    'Costa Rica',
    'Cuba',
    'Dominican Republic',
    'Ecuador',
    'El Salvador',
    'French Guiana',
    'Guatemala',
    'Guyana',
    'Haiti',
    'Honduras',
    'Jamaica',
    'Mexico',
    'Nicaragua',
    'Panama',
    'Paraguay',
    'Peru',
    'Puerto Rico',
    'Suriname',
    'Uruguay',
    'Venezuela'
  ],

  // Australia & New Zealand (Oceania)
  'oceania': [
    'Australia',
    'Fiji',
    'New Caledonia',
    'New Zealand',
    'Papua New Guinea',
    'Solomon Islands',
    'Vanuatu'
  ],

  // Middle East
  'middle_east': [
    'Armenia',
    'Azerbaijan',
    'Bahrain',
    'Georgia',
    'Iran',
    'Iraq',
    'Israel',
    'Jordan',
    'Kuwait',
    'Lebanon',
    'Oman',
    'Palestine',
    'Qatar',
    'Saudi Arabia',
    'Syria',
    'Turkey',
    'United Arab Emirates',
    'West Bank',
    'Yemen'
  ],

  // Africa
  'africa': [
    'Algeria',
    'Angola',
    'Benin',
    'Botswana',
    'Burkina Faso',
    'Burundi',
    'Cameroon',
    'Central African Republic',
    'Chad',
    'Democratic Republic of the Congo',
    'Djibouti',
    'Egypt',
    'Equatorial Guinea',
    'Eritrea',
    'Ethiopia',
    'Gabon',
    'Ghana',
    'Guinea',
    'Guinea-Bissau',
    'Ivory Coast',
    'Kenya',
    'Lesotho',
    'Liberia',
    'Libya',
    'Madagascar',
    'Malawi',
    'Mali',
    'Mauritania',
    'Morocco',
    'Mozambique',
    'Namibia',
    'Niger',
    'Nigeria',
    'Republic of the Congo',
    'Rwanda',
    'Senegal',
    'Sierra Leone',
    'Somalia',
    'Somaliland',
    'South Africa',
    'South Sudan',
    'Sudan',
    'Swaziland',
    'Tanzania',
    'Togo',
    'Tunisia',
    'Uganda',
    'Zambia',
    'Zimbabwe'
  ]
}

/**
 * Generate country-level data for ECharts map visualization
 * @param {Object} regionsData - Region aggregated data
 * @returns {Array} Country-level data for map visualization
 */
export function generateCountryMapData(regionsData) {
  console.log('generateCountryMapData: Input regionsData:', regionsData)
  
  const countryData = []
  
  // 创建 API region key 到 mapping key 的转换
  const apiToMappingKey = {
    'usa': 'usa',
    'can': 'canada', 
    'eur': 'europe',
    'aus-nzl': 'oceania',
    'as': 'asia',
    'lat-a': 'latin_america',
    'mid-e': 'middle_east',
    'af': 'africa'
  }
  
  Object.entries(regionCountryMapping).forEach(([mappingKey, countries]) => {
    // 查找对应的 API 数据
    const regionInfo = Object.entries(regionsData).find(([apiKey, data]) => {
      return apiToMappingKey[apiKey] === mappingKey || 
             data.name_key === mappingKey ||
             apiKey === mappingKey
    })?.[1]
    
    if (!regionInfo) {
      return
    }
    
    // Get colorful background color for this region
    const regionBackgroundColor = getRegionColorForBackground(mappingKey)
    
    // Add data for each country in this region
    countries.forEach(countryName => {
      countryData.push({
        name: countryName,
        value: regionInfo.count || 0,
        regionKey: mappingKey,
        regionName: regionInfo.name || mappingKey,
        masters: regionInfo.masters || 0,
        resellers: regionInfo.resellers || 0,
        itemStyle: {
          areaColor: regionBackgroundColor,
          borderColor: '#ffffff',
          borderWidth: 0.5
        }
      })
    })
  })
  
  // Generated countryData: ${countryData.length} countries
  return countryData
}

/**
 * Get colorful background color for each region (original scheme)
 * @param {string} regionKey - Region identifier
 * @returns {string} Color hex code
 */
export function getRegionColorForBackground(regionKey) {
  const colorMap = {
    'usa': '#FCA5A5',      // 浅红色 - 美国
    'europe': '#FBB471',   // 浅橙红色 - 欧洲  
    'asia': '#FCD34D',     // 浅橙色 - 亚洲
    'canada': '#86EFAC',   // 浅绿色 - 加拿大
    'latin_america': '#93C5FD', // 浅蓝色 - 拉美
    'oceania': '#C4B5FD',  // 浅紫色 - 澳新
    'middle_east': '#F9A8D4', // 浅品红色 - 中东
    'africa': '#67E8F9'    // 浅青色 - 非洲
  }
  return colorMap[regionKey] || '#D1D5DB' // 浅灰色
}

/**
 * Get blue-green gradient color for scatter plots based on value
 * @param {number} value - Region value
 * @param {number} maxValue - Maximum value (default 350)
 * @returns {string} Color hex code
 */
export function getBlueGreenGradientColor(value, maxValue = 350) {
  if (!value || value <= 0) return '#10B981' // Light green for zero values
  
  // Normalize value to 0-1 range
  const normalizedValue = Math.min(value / maxValue, 1)
  
  // Define colors: light green (#10B981) to deep blue (#1E3A8A)
  const startColor = { r: 16, g: 185, b: 129 }   // #10B981 light green
  const endColor = { r: 30, g: 58, b: 138 }      // #1E3A8A deep blue
  
  // Linear interpolation
  const r = Math.round(startColor.r + (endColor.r - startColor.r) * normalizedValue)
  const g = Math.round(startColor.g + (endColor.g - startColor.g) * normalizedValue)
  const b = Math.round(startColor.b + (endColor.b - startColor.b) * normalizedValue)
  
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Get predefined color for each region based on value
 * @param {string} regionKey - Region identifier
 * @param {number} value - Region value (optional, for intensity calculation)
 * @param {number} maxValue - Maximum value for intensity calculation (optional)
 * @returns {string} Color hex code or rgba
 */
export function getRegionColor(regionKey, value = null, maxValue = null) {
  // If value and maxValue are provided, use intensity-based coloring
  if (value !== null && maxValue !== null && maxValue > 0) {
    const intensity = Math.max(0.3, Math.min(1, value / maxValue))
    return `rgba(59, 130, 246, ${intensity})` // Blue color with variable intensity
  }
  
  // Fallback to original color mapping for backward compatibility
  const colorMap = {
    'usa': '#DC2626',           // 红色 - 美国
    'europe': '#EA580C',        // 橙红色 - 欧洲  
    'asia': '#D97706',          // 橙色 - 亚洲
    'canada': '#059669',        // 绿色 - 加拿大
    'latin_america': '#2563EB', // 蓝色 - 拉美
    'oceania': '#7C3AED',       // 紫色 - 澳新
    'middle_east': '#BE185D',   // 品红色 - 中东
    'africa': '#0891B2'         // 青色 - 非洲
  }
  return colorMap[regionKey] || '#6B7280' // 默认灰色
}

/**
 * Create reverse mapping from country to region
 * @returns {Object} Country name to region key mapping
 */
export function createCountryToRegionMapping() {
  const countryToRegion = {}
  
  Object.entries(regionCountryMapping).forEach(([regionKey, countries]) => {
    countries.forEach(countryName => {
      countryToRegion[countryName] = regionKey
    })
  })
  
  return countryToRegion
}