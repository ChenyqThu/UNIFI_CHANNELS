# Morphing Animation Debug Fix

## Problem Identified

The morphing animation between chart types (pie/bar/map) was not working properly due to several issues:

1. **Missing `notMerge: true` parameter**: Vue-ECharts needs `notMerge: true` when switching between different chart types to enable universal transitions
2. **Manual setOption interference**: The code was manually calling `chart.setOption()` which interfered with vue-echarts' own option management
3. **Inconsistent data IDs**: Data items didn't have stable, consistent IDs across chart types for universal transitions

## Solution Implemented

### 1. Enhanced EChartsComponent.vue

**Added `notMerge` prop support:**
- Added `notMerge` as a prop to the component
- Created `updateOptions` computed property to pass `notMerge` to vue-echarts
- Added `update-options` binding to the v-chart component

### 2. Updated DistributorMap.vue

**Chart Type Change Detection:**
- Added `chartTypeChanged` reactive flag to signal when chart type is changing
- Pass `chartTypeChanged` as `notMerge` prop to trigger proper option merging

**Simplified Chart Mode Switching:**
- Removed manual `chart.setOption()` calls that interfered with vue-echarts
- Use reactive state changes to trigger chart updates
- Added proper timing for animation completion

**Consistent Data ID Format:**
- Unified all data items to use consistent ID format: `item_${name.replace(/\s+/g, '_')}`
- Added `groupId: 'distributors'` to all data items for universalTransition grouping
- Ensured stable IDs across all chart types (region and country views)

### 3. Key Configuration

**Universal Transition Settings (already present):**
```javascript
universalTransition: {
  enabled: true,
  divideShape: 'clone'
}
```

**Animation Configuration:**
```javascript
animationDurationUpdate: 1000,
animationEasingUpdate: 'cubicInOut'
```

**Series ID Consistency:**
All chart series use the same ID: `'distributors'`

## How It Works

1. **Chart Type Switch**: When user clicks pie/bar buttons
2. **Flag Set**: `chartTypeChanged.value = true`
3. **notMerge Triggered**: EChartsComponent receives `notMerge: true`
4. **Vue-ECharts Handling**: Uses `setOption(newOption, { notMerge: true })`
5. **Universal Transition**: ECharts morphs between chart types using matching IDs
6. **Flag Reset**: After animation completes, `chartTypeChanged.value = false`

## Testing

Created `test-morphing.html` to verify universal transition functionality with:
- Bar chart ↔ Pie chart transitions
- Consistent series IDs
- Proper `notMerge: true` usage

## Expected Result

Users should now see smooth morphing animations when switching between:
- Map view ↔ Bar chart
- Bar chart ↔ Pie chart
- Map view ↔ Pie chart
- Region view ↔ Country view

The charts should transform smoothly rather than refreshing/redrawing completely.