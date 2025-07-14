/**
 * 国家代码到GeoJSON地图名称的映射
 * 基于world.json中的国家名称与我们数据库中的国家代码进行映射
 * Last updated: 2025-01-12 16:05 - Fixed USA aggregation
 */

// 数据库国家代码到GeoJSON地图名称的映射
// 基于world.json中的实际国家名称
export const COUNTRY_CODE_TO_MAP_NAME = {
  // 欧洲
  'AT': 'Austria',
  'BE': 'Belgium', 
  'BG': 'Bulgaria',
  'HR': 'Croatia',
  'CY': 'Cyprus',
  'CZ': 'Czech Republic',
  'DK': 'Denmark',
  'EE': 'Estonia',
  'FI': 'Finland',
  'FR': 'France',
  'DE': 'Germany',
  'GR': 'Greece',
  'HU': 'Hungary',
  'IE': 'Ireland',
  'IT': 'Italy',
  'LV': 'Latvia',
  'LT': 'Lithuania',
  'LU': 'Luxembourg',
  'MT': 'Malta',
  'NL': 'Netherlands',
  'PL': 'Poland',
  'PT': 'Portugal',
  'RO': 'Romania',
  'SK': 'Slovakia',
  'SI': 'Slovenia',
  'ES': 'Spain',
  'SE': 'Sweden',
  'GB': 'England',  // 修正：world.json中英国是"England"
  'CH': 'Switzerland',
  'NO': 'Norway',
  'RS': 'Republic of Serbia',  // 修正：world.json中塞尔维亚是"Republic of Serbia"
  'AL': 'Albania',
  'ME': 'Montenegro',
  'MK': 'Macedonia',
  'BA': 'Bosnia and Herzegovina',
  'XK': 'Kosovo',
  'UA': 'Ukraine',
  'AM': 'Armenia',
  'AZ': 'Azerbaijan',
  'GE': 'Georgia',
  'TR': 'Turkey',
  'MD': 'Moldova',
  'BY': 'Belarus',
  'IS': 'Iceland',

  // 亚洲
  'CN': 'China',
  'JP': 'Japan',
  'KR': 'South Korea',
  'KP': 'North Korea',
  'TW': 'Taiwan',
  'HK': 'Hong Kong',
  'SG': 'Singapore',
  'MY': 'Malaysia',
  'TH': 'Thailand',
  'VN': 'Vietnam',
  'PH': 'Philippines',
  'ID': 'Indonesia',
  'IN': 'India',
  'PK': 'Pakistan',
  'BD': 'Bangladesh',
  'LK': 'Sri Lanka',
  'NP': 'Nepal',
  'MM': 'Myanmar',
  'KH': 'Cambodia',
  'BN': 'Brunei',
  'MN': 'Mongolia',
  'KZ': 'Kazakhstan',
  'UZ': 'Uzbekistan',
  'KG': 'Kyrgyzstan',
  'TJ': 'Tajikistan',
  'TM': 'Turkmenistan',
  'AF': 'Afghanistan',
  'BT': 'Bhutan',
  'LA': 'Laos',
  'TL': 'East Timor',

  // 中东
  'AE': 'United Arab Emirates',
  'KW': 'Kuwait',
  'BH': 'Bahrain',
  'JO': 'Jordan',
  'IQ': 'Iraq',
  'IR': 'Iran',
  'SA': 'Saudi Arabia',
  'QA': 'Qatar',
  'OM': 'Oman',
  'YE': 'Yemen',
  'IL': 'Israel',
  'LB': 'Lebanon',
  'SY': 'Syria',

  // 非洲
  'ZA': 'South Africa',
  'KE': 'Kenya',
  'NG': 'Nigeria',
  'GH': 'Ghana',
  'TZ': 'United Republic of Tanzania',  // 修正：world.json中坦桑尼亚是"United Republic of Tanzania"
  'UG': 'Uganda',
  'ZW': 'Zimbabwe',
  'NA': 'Namibia',
  'LY': 'Libya',
  'CD': 'Democratic Republic of the Congo',
  'CG': 'Republic of the Congo',
  'EG': 'Egypt',
  'DZ': 'Algeria',
  'MA': 'Morocco',
  'TN': 'Tunisia',
  'ET': 'Ethiopia',
  'SO': 'Somalia',
  'RW': 'Rwanda',
  'BI': 'Burundi',
  'MW': 'Malawi',
  'MZ': 'Mozambique',
  'ZM': 'Zambia',
  'AO': 'Angola',
  'BW': 'Botswana',
  'SZ': 'Swaziland',
  'LS': 'Lesotho',
  'MG': 'Madagascar',

  // 澳新
  'AU': 'Australia',
  'NZ': 'New Zealand',
  'FJ': 'Fiji',
  'PG': 'Papua New Guinea',
  'SB': 'Solomon Islands',
  'VU': 'Vanuatu',

  // 拉美
  'BR': 'Brazil',
  'AR': 'Argentina',
  'CL': 'Chile',
  'PE': 'Peru',
  'CO': 'Colombia',
  'VE': 'Venezuela',
  'EC': 'Ecuador',
  'BO': 'Bolivia',
  'UY': 'Uruguay',
  'PY': 'Paraguay',
  'GY': 'Guyana',
  'SR': 'Suriname',
  'MX': 'Mexico',
  'GT': 'Guatemala',
  'HN': 'Honduras',
  'SV': 'El Salvador',
  'CR': 'Costa Rica',
  'PA': 'Panama',
  'JM': 'Jamaica',
  'BB': 'Barbados',
  'DO': 'Dominican Republic',
  'CU': 'Cuba',
  'HT': 'Haiti',
  'BZ': 'Belize',
  'NI': 'Nicaragua',
  'BS': 'The Bahamas',
  'TT': 'Trinidad and Tobago',
  'PR': 'Puerto Rico',

  // 美国各州 - 这些不在world.json中，需要特殊处理
  // CA在数据中既可能是California(美国)也可能是Canada，需要根据region判断
  'CA': 'USA', // 当region=usa时 - 修正：world.json中美国是"USA"
  'FL': 'USA',
  'IL': 'USA', 
  'NY': 'USA',
  'OH': 'USA',
  'TX': 'USA',
  'PA': 'USA',
  'MD': 'USA',
  'MO': 'USA',
  'OR': 'USA',
  'NJ': 'USA',
  'NC': 'USA',
  'SC': 'USA',

  // 加拿大省份 - 这些不在world.json中，需要特殊处理  
  'ON': 'Canada',
  'QC': 'Canada',
  'AB': 'Canada',
  'BC': 'Canada'
}

/**
 * 将数据库的分销商数据转换为ECharts地图所需的格式
 * @param {Object} countriesData - 数据库中的国家数据
 * @returns {Array} ECharts地图数据格式
 */
export function convertToMapData(countriesData) {
  if (!countriesData) {
    console.warn('🗺️ convertToMapData: No countries data provided!')
    return []
  }
  
  console.log('🗺️ convertToMapData called with:', Object.keys(countriesData).length, 'countries')
  
  if (Object.keys(countriesData).length === 0) {
    console.warn('🗺️ Empty countries data provided!')
    return []
  }
  
  // 先聚合相同国家的数据
  const aggregatedData = {}
  let processedCount = 0
  
  Object.entries(countriesData).forEach(([countryCode, countryInfo]) => {
    let mapName
    
    // 特殊处理CA代码：根据region判断是加拿大还是加利福尼亚
    if (countryCode === 'CA') {
      if (countryInfo.region === 'can') {
        mapName = 'Canada'
      } else if (countryInfo.region === 'usa') {
        mapName = 'USA'  // 修复：world.json中美国名称是"USA"
      } else {
        mapName = COUNTRY_CODE_TO_MAP_NAME[countryCode] || countryInfo.name || countryCode
      }
    }
    // 对于美国各州，都归类为USA（world.json中的名称）
    else if (countryInfo.region === 'usa') {
      mapName = 'USA'
    } 
    // 对于加拿大各省，都归类为Canada  
    else if (countryInfo.region === 'can') {
      mapName = 'Canada'
    }
    // 其他情况使用映射表或原始名称
    else {
      mapName = COUNTRY_CODE_TO_MAP_NAME[countryCode] || countryInfo.name || countryCode
    }
    
    // 检查是否有未映射的国家
    if (!COUNTRY_CODE_TO_MAP_NAME[countryCode] && countryInfo.region !== 'usa' && countryInfo.region !== 'can' && countryCode !== 'CA') {
      console.warn(`⚠️ 未映射的国家代码: ${countryCode} (${countryInfo.name || 'Unknown'}) - 区域: ${countryInfo.region}`)
    }
    
    console.log(`🗺️ Processing ${countryCode} (${countryInfo.region}) -> ${mapName} (${countryInfo.count} distributors)`)
    
    // 聚合相同mapName的数据
    if (aggregatedData[mapName]) {
      aggregatedData[mapName].value += countryInfo.count || 0
      aggregatedData[mapName].masters += countryInfo.masters || 0
      aggregatedData[mapName].resellers += countryInfo.resellers || 0
      aggregatedData[mapName].codes.push(countryCode)
    } else {
      aggregatedData[mapName] = {
        name: mapName,
        value: countryInfo.count || 0,
        codes: [countryCode],
        region: countryInfo.region,
        masters: countryInfo.masters || 0,
        resellers: countryInfo.resellers || 0,
        coordinates: countryInfo.coordinates || [0, 0],
        rawData: countryInfo
      }
    }
    
    processedCount++
  })
  
  const result = Object.values(aggregatedData).filter(item => item.value > 0)
  console.log(`🗺️ Processed ${processedCount} countries into ${result.length} map items`)
  
  // 特别检查美国和加拿大
  const usa = result.find(r => r.name === 'USA')
  const canada = result.find(r => r.name === 'Canada')
  console.log('🇺🇸 USA result:', usa)
  console.log('🇨🇦 Canada result:', canada)
  
  console.log('🗺️ Top 5 countries by distributors:', 
    result.sort((a, b) => b.value - a.value).slice(0, 5).map(r => `${r.name}: ${r.value}`))
  
  return result
}

/**
 * 将地区数据转换为散点图格式（备用方案）
 * @param {Object} regionsData - 地区数据
 * @returns {Array} 散点图数据格式
 */
export function convertToScatterData(regionsData) {
  if (!regionsData) return []
  
  return Object.entries(regionsData).map(([regionCode, regionInfo]) => ({
    name: regionInfo.name,
    value: [regionInfo.coordinates[0], regionInfo.coordinates[1], regionInfo.count],
    itemStyle: {
      color: getRegionColor(regionInfo.count)
    }
  }))
}

/**
 * 根据数量获取颜色
 * @param {number} count - 分销商数量
 * @returns {string} 颜色值
 */
function getRegionColor(count) {
  if (count > 200) return '#EF4444' // red
  if (count > 100) return '#F59E0B' // amber
  if (count > 50) return '#10B981' // emerald
  if (count > 20) return '#3B82F6' // blue
  if (count > 10) return '#8B5CF6' // violet
  return '#6B7280' // gray
}