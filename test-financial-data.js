// 简单测试脚本验证财报数据加载
// 在浏览器控制台中运行

async function testFinancialData() {
  try {
    console.log('🧪 开始测试财报数据加载...')
    
    // 测试基本文件访问
    const response = await fetch('/data/financial-reports.json')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: 无法访问财报数据文件`)
    }
    
    const data = await response.json()
    console.log('✅ 财报数据文件加载成功')
    
    // 验证数据结构
    const requiredFields = ['metadata', 'quarterly_data', 'channel_strategy']
    const missingFields = requiredFields.filter(field => !data[field])
    
    if (missingFields.length > 0) {
      throw new Error(`缺少必要字段: ${missingFields.join(', ')}`)
    }
    
    console.log('✅ 数据结构验证通过')
    
    // 验证季度数据
    if (!data.quarterly_data.q1_2025 || !data.quarterly_data.q3_2024) {
      throw new Error('缺少必要的季度数据')
    }
    
    // 验证渠道数据
    if (!data.channel_strategy.distribution_mix) {
      throw new Error('缺少渠道分布数据')
    }
    
    const channelMix = data.channel_strategy.distribution_mix
    const expectedSum = channelMix.distributor_channel.percentage + channelMix.direct_sales.percentage
    if (Math.abs(expectedSum - 100) > 0.1) {
      console.warn(`⚠️  渠道占比总和: ${expectedSum}% (期望100%)`)
    }
    
    console.log('✅ 渠道数据验证通过')
    console.log('🎉 所有测试通过！')
    
    return {
      success: true,
      data: {
        metadata: data.metadata,
        quarters: Object.keys(data.quarterly_data),
        channelMix: data.channel_strategy.distribution_mix
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// 运行测试
console.log('财报数据测试脚本已加载')
console.log('运行 testFinancialData() 来测试数据加载')

// 如果在Node.js环境中
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testFinancialData }
}