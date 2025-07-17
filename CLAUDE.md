# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

**Comprehensive Competitive Intelligence Platform** - A next-generation multi-dimensional competitive intelligence platform that provides real-time monitoring, analysis, and insights across financial performance, distribution networks, product releases, market sentiment, patents, and strategic initiatives. Built on modern serverless architecture with direct frontend-database connectivity.

[... existing content remains unchanged ...]

## Recent Updates (2025-01-17)

### 年度渠道更新趋势功能完善
**关键修复**：
- ✅ **独立颜色Scale**: 实现"全部年份"和"单个年份"使用不同的颜色范围，解决数据显示过淡问题
- ✅ **图表稳定性**: 修复地区趋势图表在标签页切换后消失的问题
- ✅ **视觉优化**: 增加图表高度从 h-80 到 h-96，提供更好的数据展示
- ✅ **界面优化**: 将"国家地图视图"更名为"国家更新动态"，中英文同步更新

**技术实现**：
- 在 `updateWorldMap()` 函数中实现独立的 maxValue 计算逻辑
- 优化 `initChart()` 函数，添加图表状态检查和错误处理
- 增强标签页切换逻辑，使用延迟初始化和重试机制
- 清理临时调试文件，保持代码库整洁

**核心文件**：
- `frontend/src/components/charts/YearlyChannelUpdates.vue` - 主要功能实现
- `frontend/src/locales/zh.json` & `en.json` - 多语言支持
- `frontend/README.md` - 文档更新

## Memory 

### To Memorize
- Region-first 数据处理逻辑是解决国家代码冲突的关键
- 独立颜色Scale确保不同数据范围的可视化效果
- 图表组件需要考虑容器初始化时机和状态管理
- 多语言支持需要同步更新所有相关文件