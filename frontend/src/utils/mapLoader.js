import * as echarts from 'echarts/core'

// 地图数据缓存
const mapCache = new Map()

/**
 * 加载地图数据
 * @param {string} mapName - 地图名称 (如 'world', 'china', 'usa' 等)
 * @param {string} mapPath - 地图文件路径
 * @returns {Promise<boolean>} - 是否加载成功
 */
export async function loadMap(mapName, mapPath) {
  // 如果已经加载过，直接返回成功
  if (mapCache.has(mapName)) {
    console.log(`Map ${mapName} already loaded from cache`)
    return true
  }

  try {
    console.log(`Loading map: ${mapName} from ${mapPath}`)
    
    // 从公共目录加载地图数据
    const response = await fetch(mapPath)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const geoJSON = await response.json()
    
    // 验证 GeoJSON 数据
    if (!geoJSON || !geoJSON.features || !Array.isArray(geoJSON.features)) {
      throw new Error('Invalid GeoJSON format')
    }
    
    console.log(`GeoJSON loaded: ${geoJSON.features.length} features found`)
    
    // 注册地图到 ECharts
    echarts.registerMap(mapName, geoJSON)
    
    // 缓存已加载的地图
    mapCache.set(mapName, geoJSON)
    
    console.log(`Map ${mapName} registered successfully in ECharts`)
    return true
  } catch (error) {
    console.error(`Failed to load map ${mapName}:`, error)
    console.error('Error details:', {
      mapName,
      mapPath,
      error: error.message,
      stack: error.stack
    })
    return false
  }
}

/**
 * 预加载常用地图
 */
export async function preloadMaps() {
  const maps = [
    { name: 'world', path: '/maps/world.json' }
  ]

  const loadPromises = maps.map(map => loadMap(map.name, map.path))
  
  try {
    await Promise.all(loadPromises)
    console.log('All maps preloaded successfully')
  } catch (error) {
    console.error('Some maps failed to preload:', error)
  }
}

/**
 * 检查地图是否已加载
 * @param {string} mapName - 地图名称
 * @returns {boolean} - 是否已加载
 */
export function isMapLoaded(mapName) {
  return mapCache.has(mapName)
}

/**
 * 获取所有已加载的地图列表
 * @returns {string[]} - 已加载的地图名称列表
 */
export function getLoadedMaps() {
  return Array.from(mapCache.keys())
}

export default {
  loadMap,
  preloadMaps,
  isMapLoaded,
  getLoadedMaps
}