# 🗺️ 全球地图数据获取指南

## 已实现方案

### ✅ 方案1: GitHub 开源地图数据 (当前使用)

**数据源**: https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson
- **优点**: 免费、开源、质量高
- **格式**: GeoJSON
- **大小**: ~250KB
- **覆盖**: 全球所有国家
- **更新**: 相对稳定

**集成状态**: ✅ 已完成
- 文件位置: `/public/maps/world.json`
- 加载工具: `/src/utils/mapLoader.js`
- 使用组件: `DistributorMap.vue`

---

## 其他可选方案

### 方案2: Natural Earth 数据

**数据源**: https://www.naturalearthdata.com/
- **优点**: 制图专业标准、多分辨率、免费
- **格式**: Shapefile, GeoJSON, TopoJSON
- **分辨率**: 1:10m, 1:50m, 1:110m
- **使用方式**:
```bash
# 下载不同分辨率的世界地图
curl -o world-110m.json "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
curl -o world-50m.json "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"
```

### 方案3: 阿里云 DataV 地图数据

**数据源**: https://datav.aliyun.com/portal/school/atlas/area_selector
- **优点**: 中文支持好、多层级
- **缺点**: 主要针对中国
- **使用方式**:
```bash
# 世界地图
curl -o world.json "https://geo.datav.aliyun.com/areas_v3/bound/world.json"

# 中国地图
curl -o china.json "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json"

# 美国地图
curl -o usa.json "https://geo.datav.aliyun.com/areas_v3/bound/usa.json"
```

### 方案4: ECharts 官方示例地图

**数据源**: Apache ECharts 官方仓库
- **优点**: 与 ECharts 完美兼容
- **使用方式**:
```bash
# 从 ECharts 示例获取
curl -o world.json "https://echarts.apache.org/examples/data/asset/geo/world.json"
```

### 方案5: OpenStreetMap 数据

**数据源**: https://www.openstreetmap.org/
- **优点**: 开源、详细、实时更新
- **处理**: 需要处理 OSM 格式转 GeoJSON
- **工具**: 使用 osmtogeojson 转换

---

## 🔧 扩展地图功能

### 添加更多地图

1. **区域地图** (已预留接口):
```javascript
// 加载特定国家/地区地图
await loadMap('china', '/maps/china.json')
await loadMap('usa', '/maps/usa.json')
await loadMap('europe', '/maps/europe.json')
```

2. **多层级地图**:
```javascript
// 支持从世界 -> 大洲 -> 国家 -> 省/州的钻取
const mapHierarchy = {
  world: '/maps/world.json',
  'north-america': '/maps/north-america.json',
  usa: '/maps/usa-states.json',
  california: '/maps/california-counties.json'
}
```

### 地图优化建议

1. **压缩地图文件**:
```bash
# 使用 mapshaper 简化地图
npm install -g mapshaper
mapshaper world.json -simplify 0.1 -o world-simplified.json
```

2. **按需加载**:
```javascript
// 只在需要时加载地图
const lazyLoadMap = async (region) => {
  if (!isMapLoaded(region)) {
    await loadMap(region, `/maps/${region}.json`)
  }
}
```

3. **CDN 加速**:
```javascript
// 使用 CDN 加速地图加载
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/your-repo/maps/'
await loadMap('world', `${CDN_BASE}world.json`)
```

---

## 📊 当前实现特色

### 智能降级
- **优先使用**: 真实世界地图
- **备选方案**: 散点图模拟（当地图加载失败时）
- **状态指示**: 显示当前使用的是地图还是备选方案

### 交互功能
- **缩放漫游**: 支持鼠标滚轮缩放和拖拽
- **悬停提示**: 显示分销商数量和增长率
- **点击响应**: 可扩展为钻取功能
- **图表切换**: 地图/柱状图/饼图无缝切换

### 数据可视化
- **颜色编码**: 根据分销商数量自动分配颜色
- **大小编码**: 圆点大小反映分销商数量
- **阴影效果**: 增强视觉层次
- **动画过渡**: 平滑的交互动画

---

## 🚀 使用建议

1. **生产环境**: 建议使用 Natural Earth 数据，更稳定
2. **开发测试**: 当前 GitHub 数据源已足够
3. **中国用户**: 可额外集成阿里云 DataV 数据
4. **移动端**: 使用简化版地图减少加载时间

**访问地址**: http://localhost:3000/distribution-network

地图功能已完全集成并可正常使用！ 🎉