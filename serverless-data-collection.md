# Serverless 数据收集管道架构
# Serverless Data Collection Pipeline Architecture

## 1. 架构概述 / Architecture Overview

### 1.1 设计理念 / Design Philosophy

**中文**: 构建一个基于 Serverless 的多维度数据收集管道，通过云函数实现自动化、可扩展的竞品数据收集。采用事件驱动架构，支持多种数据源的并行收集和处理。

**English**: Build a serverless multi-dimensional data collection pipeline that enables automated, scalable competitive data collection through cloud functions. Uses event-driven architecture to support parallel collection and processing from multiple data sources.

### 1.2 核心优势 / Core Advantages

- **成本效益**: 按需付费，无需维护服务器
- **自动扩展**: 根据负载自动调整资源
- **高可用性**: 云平台提供的高可用性保障
- **易维护**: 函数式编程，模块化管理
- **快速部署**: 支持快速迭代和部署

## 2. 技术架构设计 / Technical Architecture

### 2.1 整体架构图 / Overall Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Serverless 数据收集架构                                    │
│                    Serverless Data Collection Architecture                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         调度层 / Scheduler Layer                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │ │
│  │  │  GitHub     │  │  Vercel     │  │  Supabase   │  │  External   │        │ │
│  │  │  Actions    │  │  Cron Jobs  │  │  Triggers   │  │  Webhooks   │        │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                         │
│                                      ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                        函数执行层 / Function Execution Layer                │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │ │
│  │  │  Financial  │  │  Channel    │  │  Product    │  │  Sentiment  │        │ │
│  │  │  Collector  │  │  Collector  │  │  Collector  │  │  Analyzer   │        │ │
│  │  │  财务收集器  │  │  渠道收集器  │  │  产品收集器  │  │  舆情分析器  │        │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │ │
│  │  │  Patent     │  │  Personnel  │  │  Data       │  │  Quality    │        │ │
│  │  │  Tracker    │  │  Monitor    │  │  Processor  │  │  Validator  │        │ │
│  │  │  专利跟踪器  │  │  人员监控器  │  │  数据处理器  │  │  质量验证器  │        │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                         │
│                                      ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                        数据存储层 / Data Storage Layer                      │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │ │
│  │  │  Supabase   │  │  File       │  │  Cache      │  │  Queue      │        │ │
│  │  │  PostgreSQL │  │  Storage    │  │  Redis      │  │  System     │        │ │
│  │  │  数据库      │  │  文件存储    │  │  缓存       │  │  队列系统    │        │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈选择 / Technology Stack

```javascript
// 技术栈配置
const techStack = {
  runtime: 'Node.js 18+',
  platforms: {
    primary: 'Vercel Functions',
    secondary: 'Netlify Functions',
    alternative: 'Supabase Edge Functions'
  },
  databases: {
    primary: 'Supabase PostgreSQL',
    cache: 'Redis (Upstash)',
    queue: 'Supabase Realtime'
  },
  scheduling: {
    cron: 'Vercel Cron Jobs',
    github: 'GitHub Actions',
    manual: 'API Triggers'
  },
  monitoring: {
    logs: 'Vercel Analytics',
    errors: 'Sentry',
    metrics: 'Custom Dashboard'
  }
}
```

## 3. 数据收集器设计 / Data Collector Design

### 3.1 财务数据收集器 / Financial Data Collector

```javascript
// api/collectors/financial-data.js
import { createClient } from '@supabase/supabase-js'
import { SECDataScraper } from '../scrapers/sec-data-scraper.js'
import { EarningsCallScraper } from '../scrapers/earnings-call-scraper.js'
import { FinancialDataProcessor } from '../processors/financial-data-processor.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const startTime = Date.now()
  const results = []

  try {
    // 获取需要收集的公司列表
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, ticker_symbol, metadata')
      .eq('status', 'active')
      .not('ticker_symbol', 'is', null)
    
    if (companiesError) throw companiesError

    // 并行处理多个公司
    const collectionPromises = companies.map(async (company) => {
      const companyResult = {
        company_id: company.id,
        company_name: company.name,
        ticker: company.ticker_symbol,
        status: 'pending',
        data_points: 0,
        errors: []
      }

      try {
        // 收集 SEC 数据
        const secScraper = new SECDataScraper()
        const secData = await secScraper.getLatestFilings(company.ticker_symbol)
        
        // 收集财报电话会议数据
        const earningsCallScraper = new EarningsCallScraper()
        const earningsData = await earningsCallScraper.getLatestCalls(company.ticker_symbol)
        
        // 数据处理和标准化
        const processor = new FinancialDataProcessor()
        const processedData = await processor.processFinancialData({
          secData,
          earningsData,
          company
        })

        // 存储到数据库
        const { data: insertedData, error: insertError } = await supabase
          .from('competitive_data')
          .insert(processedData.map(item => ({
            company_id: company.id,
            category_id: await getCategoryId('financial'),
            data_type_id: await getDataTypeId(item.type),
            data_source: item.source,
            source_url: item.sourceUrl,
            raw_data: item.rawData,
            processed_data: item.processedData,
            confidence_score: item.confidenceScore,
            relevance_score: item.relevanceScore,
            quality_score: item.qualityScore,
            collected_at: new Date()
          })))

        if (insertError) throw insertError

        companyResult.status = 'success'
        companyResult.data_points = processedData.length
        
      } catch (error) {
        companyResult.status = 'error'
        companyResult.errors.push({
          message: error.message,
          stack: error.stack,
          timestamp: new Date()
        })
      }

      return companyResult
    })

    // 等待所有任务完成
    const companyResults = await Promise.allSettled(collectionPromises)
    
    // 汇总结果
    companyResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        results.push({
          company_id: companies[index].id,
          company_name: companies[index].name,
          status: 'failed',
          errors: [{ message: result.reason.message }]
        })
      }
    })

    // 记录执行日志
    await logCollectionExecution({
      function_name: 'financial-data-collector',
      execution_time: Date.now() - startTime,
      companies_processed: companies.length,
      success_count: results.filter(r => r.status === 'success').length,
      error_count: results.filter(r => r.status === 'error').length,
      results: results
    })

    res.status(200).json({
      success: true,
      message: 'Financial data collection completed',
      execution_time: Date.now() - startTime,
      results: results
    })

  } catch (error) {
    console.error('Financial data collection error:', error)
    
    await logCollectionExecution({
      function_name: 'financial-data-collector',
      execution_time: Date.now() - startTime,
      error: error.message,
      status: 'failed'
    })

    res.status(500).json({
      success: false,
      error: error.message,
      execution_time: Date.now() - startTime
    })
  }
}

// 工具函数
async function getCategoryId(categoryName) {
  const { data, error } = await supabase
    .from('data_categories')
    .select('id')
    .eq('name', categoryName)
    .single()
  
  if (error) throw error
  return data.id
}

async function getDataTypeId(typeName) {
  const { data, error } = await supabase
    .from('data_types')
    .select('id')
    .eq('name', typeName)
    .single()
  
  if (error) throw error
  return data.id
}

async function logCollectionExecution(logData) {
  await supabase
    .from('collection_execution_logs')
    .insert({
      function_name: logData.function_name,
      execution_time: logData.execution_time,
      status: logData.status || 'success',
      metadata: logData,
      executed_at: new Date()
    })
}
```

### 3.2 舆情分析收集器 / Sentiment Analysis Collector

```javascript
// api/collectors/sentiment-analysis.js
import { createClient } from '@supabase/supabase-js'
import { RedditScraper } from '../scrapers/reddit-scraper.js'
import { TwitterScraper } from '../scrapers/twitter-scraper.js'
import { NewsScraper } from '../scrapers/news-scraper.js'
import { SentimentAnalyzer } from '../analyzers/sentiment-analyzer.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const startTime = Date.now()
  const results = []

  try {
    // 获取需要分析的公司列表
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, metadata')
      .eq('status', 'active')
    
    if (companiesError) throw companiesError

    // 初始化分析器
    const sentimentAnalyzer = new SentimentAnalyzer()
    
    // 并行处理多个公司
    const analysisPromises = companies.map(async (company) => {
      const companyResult = {
        company_id: company.id,
        company_name: company.name,
        status: 'pending',
        sentiment_data: [],
        errors: []
      }

      try {
        // 收集 Reddit 数据
        const redditScraper = new RedditScraper()
        const redditData = await redditScraper.searchMentions(company.name, {
          timeframe: '24h',
          limit: 100
        })

        // 收集 Twitter 数据
        const twitterScraper = new TwitterScraper()
        const twitterData = await twitterScraper.searchMentions(company.name, {
          timeframe: '24h',
          limit: 100
        })

        // 收集新闻数据
        const newsScraper = new NewsScraper()
        const newsData = await newsScraper.searchMentions(company.name, {
          timeframe: '24h',
          limit: 50
        })

        // 合并所有数据
        const allMentions = [
          ...redditData.map(item => ({ ...item, source: 'reddit' })),
          ...twitterData.map(item => ({ ...item, source: 'twitter' })),
          ...newsData.map(item => ({ ...item, source: 'news' }))
        ]

        // 批量情感分析
        const sentimentResults = await sentimentAnalyzer.analyzeBatch(allMentions)

        // 处理和存储结果
        const processedResults = await Promise.all(
          sentimentResults.map(async (result) => {
            const processedData = {
              source: result.source,
              content: result.content,
              sentiment_score: result.sentiment_score,
              sentiment_label: result.sentiment_label,
              confidence: result.confidence,
              topics: result.topics,
              keywords: result.keywords,
              metrics: result.metrics,
              author_info: result.author_info,
              published_at: result.published_at
            }

            // 存储到数据库
            const { data: insertedData, error: insertError } = await supabase
              .from('competitive_data')
              .insert({
                company_id: company.id,
                category_id: await getCategoryId('sentiment'),
                data_type_id: await getDataTypeId('sentiment_analysis'),
                data_source: result.source,
                source_url: result.source_url,
                raw_data: result.raw_data,
                processed_data: processedData,
                confidence_score: result.confidence,
                relevance_score: result.relevance_score,
                quality_score: result.quality_score,
                collected_at: new Date()
              })

            if (insertError) throw insertError
            return processedData
          })
        )

        companyResult.status = 'success'
        companyResult.sentiment_data = processedResults
        
      } catch (error) {
        companyResult.status = 'error'
        companyResult.errors.push({
          message: error.message,
          stack: error.stack,
          timestamp: new Date()
        })
      }

      return companyResult
    })

    // 等待所有任务完成
    const companyResults = await Promise.allSettled(analysisPromises)
    
    // 处理结果
    companyResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        results.push({
          company_id: companies[index].id,
          company_name: companies[index].name,
          status: 'failed',
          errors: [{ message: result.reason.message }]
        })
      }
    })

    // 记录执行日志
    await logCollectionExecution({
      function_name: 'sentiment-analysis-collector',
      execution_time: Date.now() - startTime,
      companies_processed: companies.length,
      success_count: results.filter(r => r.status === 'success').length,
      error_count: results.filter(r => r.status === 'error').length,
      results: results
    })

    res.status(200).json({
      success: true,
      message: 'Sentiment analysis collection completed',
      execution_time: Date.now() - startTime,
      results: results
    })

  } catch (error) {
    console.error('Sentiment analysis collection error:', error)
    
    await logCollectionExecution({
      function_name: 'sentiment-analysis-collector',
      execution_time: Date.now() - startTime,
      error: error.message,
      status: 'failed'
    })

    res.status(500).json({
      success: false,
      error: error.message,
      execution_time: Date.now() - startTime
    })
  }
}
```

### 3.3 产品发布跟踪器 / Product Release Tracker

```javascript
// api/collectors/product-releases.js
import { createClient } from '@supabase/supabase-js'
import { GitHubScraper } from '../scrapers/github-scraper.js'
import { ProductAnnouncementScraper } from '../scrapers/product-announcement-scraper.js'
import { ProductDataProcessor } from '../processors/product-data-processor.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const startTime = Date.now()
  const results = []

  try {
    // 获取需要跟踪的公司列表
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, website, metadata')
      .eq('status', 'active')
    
    if (companiesError) throw companiesError

    // 初始化处理器
    const productProcessor = new ProductDataProcessor()
    
    // 并行处理多个公司
    const trackingPromises = companies.map(async (company) => {
      const companyResult = {
        company_id: company.id,
        company_name: company.name,
        status: 'pending',
        products: [],
        errors: []
      }

      try {
        // 收集 GitHub 发布信息
        const githubScraper = new GitHubScraper()
        const githubReleases = await githubScraper.getLatestReleases(company.name)

        // 收集产品公告
        const announcementScraper = new ProductAnnouncementScraper()
        const announcements = await announcementScraper.getLatestAnnouncements(company.website)

        // 合并和处理数据
        const allProductData = [...githubReleases, ...announcements]
        const processedProducts = await productProcessor.processProductData(allProductData, company)

        // 存储到数据库
        const insertPromises = processedProducts.map(async (product) => {
          const { data: insertedData, error: insertError } = await supabase
            .from('competitive_data')
            .insert({
              company_id: company.id,
              category_id: await getCategoryId('products'),
              data_type_id: await getDataTypeId('product_release'),
              data_source: product.source,
              source_url: product.source_url,
              raw_data: product.raw_data,
              processed_data: product.processed_data,
              confidence_score: product.confidence_score,
              relevance_score: product.relevance_score,
              quality_score: product.quality_score,
              collected_at: new Date()
            })

          if (insertError) throw insertError
          return insertedData
        })

        await Promise.all(insertPromises)

        companyResult.status = 'success'
        companyResult.products = processedProducts
        
      } catch (error) {
        companyResult.status = 'error'
        companyResult.errors.push({
          message: error.message,
          stack: error.stack,
          timestamp: new Date()
        })
      }

      return companyResult
    })

    // 等待所有任务完成
    const companyResults = await Promise.allSettled(trackingPromises)
    
    // 处理结果
    companyResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        results.push({
          company_id: companies[index].id,
          company_name: companies[index].name,
          status: 'failed',
          errors: [{ message: result.reason.message }]
        })
      }
    })

    // 记录执行日志
    await logCollectionExecution({
      function_name: 'product-release-tracker',
      execution_time: Date.now() - startTime,
      companies_processed: companies.length,
      success_count: results.filter(r => r.status === 'success').length,
      error_count: results.filter(r => r.status === 'error').length,
      results: results
    })

    res.status(200).json({
      success: true,
      message: 'Product release tracking completed',
      execution_time: Date.now() - startTime,
      results: results
    })

  } catch (error) {
    console.error('Product release tracking error:', error)
    
    await logCollectionExecution({
      function_name: 'product-release-tracker',
      execution_time: Date.now() - startTime,
      error: error.message,
      status: 'failed'
    })

    res.status(500).json({
      success: false,
      error: error.message,
      execution_time: Date.now() - startTime
    })
  }
}
```

## 4. 数据处理器设计 / Data Processor Design

### 4.1 通用数据处理器 / Generic Data Processor

```javascript
// processors/base-data-processor.js
export class BaseDataProcessor {
  constructor() {
    this.validationRules = {}
    this.processingRules = {}
  }

  async processData(rawData, dataType, company) {
    try {
      // 1. 数据验证
      const validationResult = await this.validateData(rawData, dataType)
      if (!validationResult.isValid) {
        throw new Error(`Data validation failed: ${validationResult.errors.join(', ')}`)
      }

      // 2. 数据清洗
      const cleanedData = await this.cleanData(rawData, dataType)

      // 3. 数据标准化
      const normalizedData = await this.normalizeData(cleanedData, dataType)

      // 4. 数据丰富
      const enrichedData = await this.enrichData(normalizedData, company)

      // 5. 质量评分
      const qualityScore = await this.calculateQualityScore(enrichedData, dataType)

      return {
        raw_data: rawData,
        processed_data: enrichedData,
        confidence_score: validationResult.confidence,
        relevance_score: this.calculateRelevanceScore(enrichedData, company),
        quality_score: qualityScore,
        processing_metadata: {
          processed_at: new Date(),
          processor_version: this.getVersion(),
          processing_time: Date.now() - this.startTime
        }
      }

    } catch (error) {
      throw new Error(`Data processing failed: ${error.message}`)
    }
  }

  async validateData(data, dataType) {
    // 基础验证逻辑
    if (!data || typeof data !== 'object') {
      return { isValid: false, errors: ['Invalid data format'], confidence: 0 }
    }

    const errors = []
    let confidence = 1.0

    // 根据数据类型执行特定验证
    const rules = this.validationRules[dataType] || {}
    
    for (const [field, rule] of Object.entries(rules)) {
      const fieldValue = data[field]
      
      if (rule.required && !fieldValue) {
        errors.push(`Required field missing: ${field}`)
        confidence *= 0.8
      }
      
      if (fieldValue && rule.type && typeof fieldValue !== rule.type) {
        errors.push(`Invalid type for field ${field}: expected ${rule.type}`)
        confidence *= 0.9
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      confidence: Math.max(0, confidence)
    }
  }

  async cleanData(data, dataType) {
    // 移除空值和无效字段
    const cleanedData = {}
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined && value !== '') {
        cleanedData[key] = value
      }
    }

    return cleanedData
  }

  async normalizeData(data, dataType) {
    // 数据标准化逻辑
    const normalized = { ...data }
    
    // 时间戳标准化
    if (normalized.timestamp) {
      normalized.timestamp = new Date(normalized.timestamp).toISOString()
    }
    
    // 文本标准化
    if (normalized.text) {
      normalized.text = normalized.text.trim()
    }
    
    return normalized
  }

  async enrichData(data, company) {
    // 数据丰富逻辑
    const enriched = { ...data }
    
    // 添加公司信息
    enriched.company_info = {
      id: company.id,
      name: company.name,
      industry: company.industry
    }
    
    // 添加处理时间戳
    enriched.processed_at = new Date().toISOString()
    
    return enriched
  }

  calculateQualityScore(data, dataType) {
    // 质量评分算法
    let score = 1.0
    
    // 完整性检查
    const completeness = this.checkCompleteness(data, dataType)
    score *= completeness
    
    // 数据新鲜度检查
    const freshness = this.checkFreshness(data)
    score *= freshness
    
    // 数据一致性检查
    const consistency = this.checkConsistency(data)
    score *= consistency
    
    return Math.max(0, Math.min(1, score))
  }

  checkCompleteness(data, dataType) {
    // 完整性检查逻辑
    const requiredFields = this.getRequiredFields(dataType)
    const presentFields = Object.keys(data).filter(key => 
      data[key] !== null && data[key] !== undefined && data[key] !== ''
    )
    
    return presentFields.length / requiredFields.length
  }

  checkFreshness(data) {
    // 数据新鲜度检查
    if (!data.timestamp) return 0.8
    
    const dataAge = Date.now() - new Date(data.timestamp).getTime()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    return Math.max(0, 1 - (dataAge / maxAge))
  }

  checkConsistency(data) {
    // 数据一致性检查
    // 这里可以添加更复杂的一致性检查逻辑
    return 0.95
  }

  calculateRelevanceScore(data, company) {
    // 相关性评分
    let score = 0.5 // 基础分
    
    // 如果数据中包含公司名称，增加相关性
    if (data.text && data.text.toLowerCase().includes(company.name.toLowerCase())) {
      score += 0.3
    }
    
    // 如果数据来源可信，增加相关性
    if (data.source && this.isTrustedSource(data.source)) {
      score += 0.2
    }
    
    return Math.min(1, score)
  }

  isTrustedSource(source) {
    const trustedSources = ['sec.gov', 'company-website', 'github', 'nasdaq']
    return trustedSources.some(trusted => source.includes(trusted))
  }

  getRequiredFields(dataType) {
    const requiredFieldsMap = {
      'quarterly_earnings': ['quarter', 'revenue', 'timestamp'],
      'product_release': ['product_name', 'release_date', 'version'],
      'sentiment_analysis': ['content', 'sentiment_score', 'timestamp'],
      'distributor_network': ['distributors', 'region', 'timestamp']
    }
    
    return requiredFieldsMap[dataType] || []
  }

  getVersion() {
    return '1.0.0'
  }
}
```

### 4.2 专门的财务数据处理器 / Specialized Financial Data Processor

```javascript
// processors/financial-data-processor.js
import { BaseDataProcessor } from './base-data-processor.js'

export class FinancialDataProcessor extends BaseDataProcessor {
  constructor() {
    super()
    this.validationRules = {
      'quarterly_earnings': {
        quarter: { required: true, type: 'string' },
        revenue: { required: true, type: 'number' },
        net_income: { required: false, type: 'number' },
        eps: { required: false, type: 'number' }
      }
    }
  }

  async processFinancialData({ secData, earningsData, company }) {
    const processedData = []

    // 处理 SEC 数据
    if (secData && secData.length > 0) {
      for (const filing of secData) {
        const processed = await this.processData(filing, 'sec_filing', company)
        processedData.push({
          ...processed,
          type: 'sec_filing',
          source: 'sec.gov',
          sourceUrl: filing.url
        })
      }
    }

    // 处理财报电话会议数据
    if (earningsData && earningsData.length > 0) {
      for (const call of earningsData) {
        const processed = await this.processData(call, 'earnings_call', company)
        processedData.push({
          ...processed,
          type: 'earnings_call',
          source: 'earnings_call',
          sourceUrl: call.url
        })
      }
    }

    return processedData
  }

  async normalizeData(data, dataType) {
    const normalized = await super.normalizeData(data, dataType)

    // 财务数据特定的标准化
    if (dataType === 'quarterly_earnings') {
      // 标准化季度格式
      if (normalized.quarter) {
        normalized.quarter = this.normalizeQuarter(normalized.quarter)
      }

      // 标准化货币单位
      if (normalized.revenue) {
        normalized.revenue = this.normalizeCurrency(normalized.revenue)
      }

      // 计算增长率
      if (normalized.revenue && normalized.previous_revenue) {
        normalized.revenue_growth = (normalized.revenue - normalized.previous_revenue) / normalized.previous_revenue
      }
    }

    return normalized
  }

  normalizeQuarter(quarter) {
    // 将不同格式的季度标准化为 "YYYY-QN" 格式
    const quarterRegex = /(\d{4})[Q\s-]?(\d)/
    const match = quarter.match(quarterRegex)
    
    if (match) {
      return `${match[1]}-Q${match[2]}`
    }
    
    return quarter
  }

  normalizeCurrency(amount) {
    // 标准化货币金额（转换为美元）
    if (typeof amount === 'string') {
      // 移除货币符号和逗号
      amount = amount.replace(/[$,]/g, '')
      amount = parseFloat(amount)
    }
    
    return amount
  }

  async enrichData(data, company) {
    const enriched = await super.enrichData(data, company)

    // 添加行业平均值比较
    if (enriched.revenue && company.industry) {
      const industryAverage = await this.getIndustryAverage(company.industry, 'revenue')
      enriched.industry_comparison = {
        revenue_vs_industry: enriched.revenue / industryAverage,
        industry_average: industryAverage
      }
    }

    return enriched
  }

  async getIndustryAverage(industry, metric) {
    // 这里可以从外部数据源获取行业平均值
    // 暂时返回模拟数据
    const industryAverages = {
      'technology': { revenue: 1000000000 },
      'healthcare': { revenue: 500000000 },
      'finance': { revenue: 2000000000 }
    }

    return industryAverages[industry]?.[metric] || 0
  }
}
```

## 5. 调度和监控系统 / Scheduling and Monitoring System

### 5.1 Vercel Cron 配置 / Vercel Cron Configuration

```javascript
// vercel.json
{
  "functions": {
    "api/collectors/financial-data.js": {
      "maxDuration": 300,
      "memory": 1024
    },
    "api/collectors/sentiment-analysis.js": {
      "maxDuration": 180,
      "memory": 512
    },
    "api/collectors/product-releases.js": {
      "maxDuration": 240,
      "memory": 768
    },
    "api/collectors/patent-tracker.js": {
      "maxDuration": 200,
      "memory": 512
    }
  },
  "crons": [
    {
      "path": "/api/collectors/financial-data",
      "schedule": "0 9 * * 1"
    },
    {
      "path": "/api/collectors/sentiment-analysis", 
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/collectors/product-releases",
      "schedule": "0 */12 * * *"
    },
    {
      "path": "/api/collectors/patent-tracker",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/maintenance/cleanup-old-data",
      "schedule": "0 3 * * *"
    }
  ]
}
```

### 5.2 GitHub Actions 调度 / GitHub Actions Scheduling

```yaml
# .github/workflows/data-collection.yml
name: Data Collection Pipeline

on:
  schedule:
    # 每天凌晨 2 点执行
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  collect-financial-data:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Financial Data Collection
        run: |
          curl -X POST "${{ secrets.VERCEL_FUNCTION_URL }}/api/collectors/financial-data" \
            -H "Authorization: Bearer ${{ secrets.COLLECTION_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"trigger": "github-actions"}'

  collect-sentiment-data:
    runs-on: ubuntu-latest
    needs: collect-financial-data
    steps:
      - name: Trigger Sentiment Analysis
        run: |
          curl -X POST "${{ secrets.VERCEL_FUNCTION_URL }}/api/collectors/sentiment-analysis" \
            -H "Authorization: Bearer ${{ secrets.COLLECTION_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"trigger": "github-actions"}'

  collect-product-data:
    runs-on: ubuntu-latest
    needs: collect-financial-data
    steps:
      - name: Trigger Product Release Tracking
        run: |
          curl -X POST "${{ secrets.VERCEL_FUNCTION_URL }}/api/collectors/product-releases" \
            -H "Authorization: Bearer ${{ secrets.COLLECTION_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"trigger": "github-actions"}'

  monitor-and-alert:
    runs-on: ubuntu-latest
    needs: [collect-financial-data, collect-sentiment-data, collect-product-data]
    if: always()
    steps:
      - name: Check Collection Status
        run: |
          curl -X GET "${{ secrets.VERCEL_FUNCTION_URL }}/api/monitoring/collection-status" \
            -H "Authorization: Bearer ${{ secrets.COLLECTION_API_KEY }}"
```

### 5.3 监控和告警系统 / Monitoring and Alerting System

```javascript
// api/monitoring/collection-status.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  try {
    // 获取最近 24 小时的收集状态
    const { data: executions, error } = await supabase
      .from('collection_execution_logs')
      .select('*')
      .gte('executed_at', new Date(Date.now() - 24 * 60 * 60 * 1000))
      .order('executed_at', { ascending: false })

    if (error) throw error

    // 分析执行状态
    const analysis = analyzeExecutionStatus(executions)

    // 检查是否需要发送告警
    const alerts = checkForAlerts(analysis)

    // 如果有告警，发送通知
    if (alerts.length > 0) {
      await sendAlerts(alerts)
    }

    res.status(200).json({
      success: true,
      analysis,
      alerts,
      executions: executions.slice(0, 20) // 返回最近20条记录
    })

  } catch (error) {
    console.error('Monitoring error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

function analyzeExecutionStatus(executions) {
  const analysis = {
    total_executions: executions.length,
    success_rate: 0,
    average_execution_time: 0,
    failed_functions: [],
    performance_issues: []
  }

  if (executions.length === 0) {
    analysis.success_rate = 0
    return analysis
  }

  // 计算成功率
  const successfulExecutions = executions.filter(e => e.status === 'success')
  analysis.success_rate = successfulExecutions.length / executions.length

  // 计算平均执行时间
  const totalTime = executions.reduce((sum, e) => sum + (e.execution_time || 0), 0)
  analysis.average_execution_time = totalTime / executions.length

  // 识别失败的函数
  const failedExecutions = executions.filter(e => e.status === 'failed')
  analysis.failed_functions = [...new Set(failedExecutions.map(e => e.function_name))]

  // 检查性能问题
  const slowExecutions = executions.filter(e => e.execution_time > 60000) // 超过1分钟
  analysis.performance_issues = slowExecutions.map(e => ({
    function_name: e.function_name,
    execution_time: e.execution_time,
    executed_at: e.executed_at
  }))

  return analysis
}

function checkForAlerts(analysis) {
  const alerts = []

  // 成功率过低告警
  if (analysis.success_rate < 0.8) {
    alerts.push({
      type: 'low_success_rate',
      severity: 'high',
      message: `Success rate is ${(analysis.success_rate * 100).toFixed(1)}%, below 80% threshold`,
      data: analysis
    })
  }

  // 执行时间过长告警
  if (analysis.average_execution_time > 120000) { // 超过2分钟
    alerts.push({
      type: 'slow_execution',
      severity: 'medium',
      message: `Average execution time is ${(analysis.average_execution_time / 1000).toFixed(1)}s, above 2 minutes threshold`,
      data: analysis
    })
  }

  // 特定函数失败告警
  if (analysis.failed_functions.length > 0) {
    alerts.push({
      type: 'function_failures',
      severity: 'medium',
      message: `Functions with failures: ${analysis.failed_functions.join(', ')}`,
      data: analysis
    })
  }

  return alerts
}

async function sendAlerts(alerts) {
  // 发送到 Slack
  if (process.env.SLACK_WEBHOOK_URL) {
    await sendSlackAlert(alerts)
  }

  // 发送邮件
  if (process.env.ALERT_EMAIL) {
    await sendEmailAlert(alerts)
  }

  // 存储到数据库
  await storeAlerts(alerts)
}

async function sendSlackAlert(alerts) {
  const webhook = process.env.SLACK_WEBHOOK_URL
  const message = {
    text: 'Data Collection Pipeline Alert',
    attachments: alerts.map(alert => ({
      color: alert.severity === 'high' ? 'danger' : 'warning',
      title: alert.type.replace('_', ' ').toUpperCase(),
      text: alert.message,
      timestamp: Math.floor(Date.now() / 1000)
    }))
  }

  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  })
}

async function storeAlerts(alerts) {
  const alertRecords = alerts.map(alert => ({
    type: alert.type,
    severity: alert.severity,
    message: alert.message,
    data: alert.data,
    created_at: new Date()
  }))

  await supabase
    .from('system_alerts')
    .insert(alertRecords)
}
```

## 6. 错误处理和重试机制 / Error Handling and Retry Mechanism

### 6.1 重试机制 / Retry Mechanism

```javascript
// utils/retry-handler.js
export class RetryHandler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3
    this.baseDelay = options.baseDelay || 1000
    this.maxDelay = options.maxDelay || 10000
    this.exponentialBackoff = options.exponentialBackoff !== false
  }

  async executeWithRetry(fn, context = {}) {
    let lastError
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await fn()
        
        // 记录成功执行
        await this.logAttempt({
          ...context,
          attempt,
          status: 'success',
          timestamp: new Date()
        })
        
        return result
      } catch (error) {
        lastError = error
        
        // 记录失败尝试
        await this.logAttempt({
          ...context,
          attempt,
          status: 'failed',
          error: error.message,
          timestamp: new Date()
        })

        // 如果是最后一次尝试，直接抛出错误
        if (attempt === this.maxRetries) {
          throw error
        }

        // 检查是否应该重试
        if (!this.shouldRetry(error)) {
          throw error
        }

        // 计算延迟时间
        const delay = this.calculateDelay(attempt)
        await this.sleep(delay)
      }
    }
    
    throw lastError
  }

  shouldRetry(error) {
    // 网络错误和超时错误应该重试
    const retryableErrors = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EAI_AGAIN'
    ]

    // HTTP 状态码 5xx 应该重试
    const retryableStatusCodes = [500, 502, 503, 504]

    return retryableErrors.some(code => error.code === code) ||
           retryableStatusCodes.includes(error.status) ||
           error.message.includes('timeout')
  }

  calculateDelay(attempt) {
    if (this.exponentialBackoff) {
      // 指数退避
      const delay = this.baseDelay * Math.pow(2, attempt - 1)
      return Math.min(delay, this.maxDelay)
    } else {
      // 固定延迟
      return this.baseDelay
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async logAttempt(attemptData) {
    try {
      await supabase
        .from('retry_attempts')
        .insert({
          function_name: attemptData.function_name,
          attempt_number: attemptData.attempt,
          status: attemptData.status,
          error_message: attemptData.error,
          execution_time: attemptData.execution_time,
          timestamp: attemptData.timestamp
        })
    } catch (error) {
      console.error('Failed to log retry attempt:', error)
    }
  }
}
```

### 6.2 错误分类和处理 / Error Classification and Handling

```javascript
// utils/error-handler.js
export class ErrorHandler {
  constructor() {
    this.errorTypes = {
      NETWORK_ERROR: 'network_error',
      RATE_LIMIT_ERROR: 'rate_limit_error',
      AUTHENTICATION_ERROR: 'authentication_error',
      DATA_VALIDATION_ERROR: 'data_validation_error',
      DATABASE_ERROR: 'database_error',
      TIMEOUT_ERROR: 'timeout_error',
      UNKNOWN_ERROR: 'unknown_error'
    }
  }

  classifyError(error) {
    // 网络错误
    if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
      return this.errorTypes.NETWORK_ERROR
    }

    // 速率限制错误
    if (error.status === 429 || error.message.includes('rate limit')) {
      return this.errorTypes.RATE_LIMIT_ERROR
    }

    // 认证错误
    if (error.status === 401 || error.status === 403) {
      return this.errorTypes.AUTHENTICATION_ERROR
    }

    // 数据验证错误
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return this.errorTypes.DATA_VALIDATION_ERROR
    }

    // 数据库错误
    if (error.message.includes('database') || error.code === 'PGRST') {
      return this.errorTypes.DATABASE_ERROR
    }

    // 超时错误
    if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
      return this.errorTypes.TIMEOUT_ERROR
    }

    return this.errorTypes.UNKNOWN_ERROR
  }

  async handleError(error, context = {}) {
    const errorType = this.classifyError(error)
    const errorData = {
      type: errorType,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date(),
      severity: this.determineSeverity(errorType)
    }

    // 记录错误
    await this.logError(errorData)

    // 根据错误类型决定处理策略
    switch (errorType) {
      case this.errorTypes.RATE_LIMIT_ERROR:
        return this.handleRateLimitError(error, context)
      
      case this.errorTypes.AUTHENTICATION_ERROR:
        return this.handleAuthenticationError(error, context)
      
      case this.errorTypes.DATA_VALIDATION_ERROR:
        return this.handleValidationError(error, context)
      
      default:
        return this.handleGenericError(error, context)
    }
  }

  async handleRateLimitError(error, context) {
    // 从错误信息中提取重试时间
    const retryAfter = this.extractRetryAfter(error)
    
    // 等待指定时间后重试
    if (retryAfter > 0) {
      await this.sleep(retryAfter * 1000)
      return { shouldRetry: true, delay: retryAfter * 1000 }
    }
    
    return { shouldRetry: false, error: 'Rate limit exceeded' }
  }

  async handleAuthenticationError(error, context) {
    // 尝试刷新认证令牌
    try {
      await this.refreshAuthToken(context)
      return { shouldRetry: true, delay: 0 }
    } catch (refreshError) {
      return { shouldRetry: false, error: 'Authentication refresh failed' }
    }
  }

  async handleValidationError(error, context) {
    // 数据验证错误通常不需要重试
    return { shouldRetry: false, error: error.message }
  }

  async handleGenericError(error, context) {
    // 通用错误处理
    return { shouldRetry: true, delay: 5000 }
  }

  determineSeverity(errorType) {
    const severityMap = {
      [this.errorTypes.NETWORK_ERROR]: 'medium',
      [this.errorTypes.RATE_LIMIT_ERROR]: 'low',
      [this.errorTypes.AUTHENTICATION_ERROR]: 'high',
      [this.errorTypes.DATA_VALIDATION_ERROR]: 'medium',
      [this.errorTypes.DATABASE_ERROR]: 'high',
      [this.errorTypes.TIMEOUT_ERROR]: 'medium',
      [this.errorTypes.UNKNOWN_ERROR]: 'medium'
    }

    return severityMap[errorType] || 'medium'
  }

  extractRetryAfter(error) {
    // 从错误响应中提取 Retry-After 头
    if (error.response && error.response.headers) {
      const retryAfter = error.response.headers['retry-after']
      return parseInt(retryAfter) || 0
    }
    return 0
  }

  async logError(errorData) {
    try {
      await supabase
        .from('error_logs')
        .insert({
          error_type: errorData.type,
          message: errorData.message,
          stack_trace: errorData.stack,
          context: errorData.context,
          severity: errorData.severity,
          timestamp: errorData.timestamp
        })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
  }

  async refreshAuthToken(context) {
    // 实现认证令牌刷新逻辑
    // 这里需要根据具体的认证方式实现
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

## 7. 性能优化 / Performance Optimization

### 7.1 缓存策略 / Caching Strategy

```javascript
// utils/cache-manager.js
import { createClient } from '@supabase/supabase-js'

export class CacheManager {
  constructor() {
    this.memoryCache = new Map()
    this.defaultTTL = 5 * 60 * 1000 // 5分钟
    this.maxMemorySize = 100 // 最大内存缓存项数
  }

  async get(key, options = {}) {
    const { ttl = this.defaultTTL, skipMemory = false } = options

    // 首先检查内存缓存
    if (!skipMemory) {
      const memoryResult = this.getFromMemory(key)
      if (memoryResult) {
        return memoryResult
      }
    }

    // 检查 Redis 缓存
    try {
      const redisResult = await this.getFromRedis(key)
      if (redisResult) {
        // 将结果存储到内存缓存
        this.setInMemory(key, redisResult.data, ttl)
        return redisResult.data
      }
    } catch (error) {
      console.warn('Redis cache error:', error)
    }

    return null
  }

  async set(key, value, ttl = this.defaultTTL) {
    // 存储到内存缓存
    this.setInMemory(key, value, ttl)

    // 存储到 Redis 缓存
    try {
      await this.setInRedis(key, value, ttl)
    } catch (error) {
      console.warn('Redis cache set error:', error)
    }
  }

  getFromMemory(key) {
    const item = this.memoryCache.get(key)
    if (!item) return null

    if (Date.now() > item.expiresAt) {
      this.memoryCache.delete(key)
      return null
    }

    return item.data
  }

  setInMemory(key, value, ttl) {
    // 检查内存缓存大小
    if (this.memoryCache.size >= this.maxMemorySize) {
      // 删除最旧的缓存项
      const firstKey = this.memoryCache.keys().next().value
      this.memoryCache.delete(firstKey)
    }

    this.memoryCache.set(key, {
      data: value,
      expiresAt: Date.now() + ttl
    })
  }

  async getFromRedis(key) {
    // 这里需要实现 Redis 缓存获取逻辑
    // 可以使用 Upstash Redis 或其他 Redis 服务
    return null
  }

  async setInRedis(key, value, ttl) {
    // 这里需要实现 Redis 缓存设置逻辑
    // 可以使用 Upstash Redis 或其他 Redis 服务
  }

  async invalidate(pattern) {
    // 清除匹配模式的缓存
    for (const [key, value] of this.memoryCache.entries()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key)
      }
    }

    // 清除 Redis 缓存
    try {
      await this.invalidateRedis(pattern)
    } catch (error) {
      console.warn('Redis cache invalidation error:', error)
    }
  }

  async invalidateRedis(pattern) {
    // 实现 Redis 缓存清除逻辑
  }
}

// 使用示例
const cacheManager = new CacheManager()

export async function getCachedData(key, fetchFunction, ttl = 5 * 60 * 1000) {
  // 尝试从缓存获取数据
  const cachedData = await cacheManager.get(key)
  if (cachedData) {
    return cachedData
  }

  // 如果缓存中没有，执行获取函数
  const freshData = await fetchFunction()
  
  // 将结果存储到缓存
  await cacheManager.set(key, freshData, ttl)
  
  return freshData
}
```

### 7.2 批量处理优化 / Batch Processing Optimization

```javascript
// utils/batch-processor.js
export class BatchProcessor {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 10
    this.concurrency = options.concurrency || 3
    this.delayBetweenBatches = options.delayBetweenBatches || 1000
  }

  async processBatch(items, processorFunction) {
    const results = []
    const batches = this.createBatches(items, this.batchSize)

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      
      console.log(`Processing batch ${i + 1}/${batches.length} with ${batch.length} items`)
      
      try {
        // 并发处理批次内的项目
        const batchResults = await this.processBatchConcurrently(batch, processorFunction)
        results.push(...batchResults)
        
        // 批次间延迟
        if (i < batches.length - 1) {
          await this.sleep(this.delayBetweenBatches)
        }
        
      } catch (error) {
        console.error(`Error processing batch ${i + 1}:`, error)
        // 可以选择继续处理下一批次或者抛出错误
        throw error
      }
    }

    return results
  }

  async processBatchConcurrently(batch, processorFunction) {
    const semaphore = new Semaphore(this.concurrency)
    
    const promises = batch.map(async (item) => {
      return semaphore.acquire(async () => {
        try {
          return await processorFunction(item)
        } catch (error) {
          console.error('Error processing item:', item, error)
          return { error: error.message, item }
        }
      })
    })

    return await Promise.all(promises)
  }

  createBatches(items, batchSize) {
    const batches = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 信号量实现
class Semaphore {
  constructor(maxConcurrency) {
    this.maxConcurrency = maxConcurrency
    this.currentConcurrency = 0
    this.queue = []
  }

  async acquire(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject })
      this.process()
    })
  }

  async process() {
    if (this.currentConcurrency >= this.maxConcurrency || this.queue.length === 0) {
      return
    }

    this.currentConcurrency++
    const { fn, resolve, reject } = this.queue.shift()

    try {
      const result = await fn()
      resolve(result)
    } catch (error) {
      reject(error)
    } finally {
      this.currentConcurrency--
      this.process()
    }
  }
}
```

## 8. 总结 / Summary

这个 Serverless 数据收集管道架构提供了：

1. **高可扩展性**: 基于云函数的架构，自动扩展和按需付费
2. **多维度收集**: 支持财务、舆情、产品、专利等多种数据源
3. **智能处理**: 内置数据验证、清洗、标准化和质量评分
4. **可靠性**: 完善的错误处理和重试机制
5. **高性能**: 批量处理和缓存策略优化
6. **易监控**: 全面的监控和告警系统
7. **成本效益**: 无服务器架构，运营成本低

这个架构为构建一个强大的竞品数据收集系统提供了坚实的技术基础。