/**
 * Data Scraping Service
 * 数据抓取服务 - 从 Unifi 官方源抓取渠道数据并同步到 Supabase
 */

import channelMonitoringService from './channelMonitoringService.js';
import { supabase } from '../api/supabaseAPI.js';
import { REGIONS, REGION_MAPPING } from '../utils/regionCountryMapping.js';

class DataScrapingService {
    constructor() {
        this.baseUrl = 'https://www.ui.com/api/v1/search/distributors';
        this.rateLimitDelay = 1000; // 1 second between requests
        this.maxRetries = 3;
        this.batchSize = 100;
        this.requestTimeout = 30000; // 30 seconds
        this.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
        
        // 状态跟踪
        this.isRunning = false;
        this.currentSession = null;
        this.progressCallback = null;
        this.abortController = null;
    }

    // ====================================================================
    // 1. 核心抓取逻辑
    // ====================================================================

    /**
     * 启动完整的数据抓取流程
     * @param {Object} options - 抓取选项
     * @returns {Promise<Object>} 抓取结果
     */
    async startFullScraping(options = {}) {
        if (this.isRunning) {
            throw new Error('数据抓取已在进行中');
        }

        try {
            this.isRunning = true;
            this.abortController = new AbortController();
            
            const {
                regions = Object.keys(REGIONS),
                onProgress = null,
                maxConcurrency = 3,
                retryFailed = true
            } = options;

            this.progressCallback = onProgress;
            
            // 创建监控会话
            const sessionId = await this.createScrapingSession({
                regions,
                maxConcurrency,
                retryFailed
            });

            this.currentSession = sessionId;
            
            const results = {
                sessionId,
                totalRegions: regions.length,
                processedRegions: 0,
                totalChannels: 0,
                newChannels: 0,
                updatedChannels: 0,
                deactivatedChannels: 0,
                errors: [],
                startTime: new Date(),
                endTime: null
            };

            // 并发抓取各个地区
            const regionPromises = this.createConcurrentBatches(
                regions,
                maxConcurrency,
                async (region) => {
                    try {
                        const regionResult = await this.scrapeRegion(region, sessionId);
                        results.processedRegions++;
                        results.totalChannels += regionResult.channelCount;
                        
                        this.notifyProgress({
                            type: 'region_completed',
                            region,
                            result: regionResult,
                            overall: results
                        });
                        
                        return regionResult;
                    } catch (error) {
                        console.error(`地区 ${region} 抓取失败:`, error);
                        results.errors.push({
                            region,
                            error: error.message,
                            timestamp: new Date()
                        });
                        
                        if (retryFailed) {
                            console.log(`重试地区 ${region}...`);
                            return await this.scrapeRegion(region, sessionId);
                        }
                        
                        throw error;
                    }
                }
            );

            // 等待所有地区抓取完成
            const regionResults = await Promise.allSettled(regionPromises);
            
            // 处理所有抓取到的数据
            const allChannelData = [];
            for (const result of regionResults) {
                if (result.status === 'fulfilled' && result.value.channels) {
                    allChannelData.push(...result.value.channels);
                }
            }

            // 使用监控服务处理数据
            if (allChannelData.length > 0) {
                const processingResult = await channelMonitoringService.processScrapedChannelData(
                    allChannelData,
                    {
                        dataSource: 'full_scraping',
                        metadata: {
                            regions,
                            totalFound: allChannelData.length,
                            scrapingDuration: Date.now() - results.startTime.getTime()
                        }
                    }
                );

                results.newChannels = processingResult.newChannels;
                results.updatedChannels = processingResult.updatedChannels;
                results.deactivatedChannels = processingResult.deactivatedChannels;
            }

            results.endTime = new Date();
            
            // 完成会话
            await this.completeScrapingSession(sessionId, results);
            
            this.notifyProgress({
                type: 'scraping_completed',
                result: results
            });

            return results;

        } catch (error) {
            console.error('数据抓取失败:', error);
            
            if (this.currentSession) {
                await this.completeScrapingSession(this.currentSession, {
                    error: error.message,
                    status: 'failed'
                });
            }
            
            throw error;
        } finally {
            this.isRunning = false;
            this.currentSession = null;
            this.progressCallback = null;
            this.abortController = null;
        }
    }

    /**
     * 抓取单个地区的数据
     * @param {string} region - 地区代码
     * @param {string} sessionId - 会话ID
     * @returns {Promise<Object>} 地区抓取结果
     */
    async scrapeRegion(region, sessionId) {
        const regionInfo = REGIONS[region];
        if (!regionInfo) {
            throw new Error(`未知地区: ${region}`);
        }

        const channels = [];
        const errors = [];

        try {
            // 获取地区的所有国家/州
            const countries = regionInfo.countries || [];
            
            for (const countryCode of countries) {
                try {
                    // 检查是否被中止
                    if (this.abortController?.signal.aborted) {
                        throw new Error('抓取被用户中止');
                    }

                    const countryChannels = await this.scrapeCountry(region, countryCode);
                    channels.push(...countryChannels);
                    
                    // 速率限制
                    await this.delay(this.rateLimitDelay);
                    
                } catch (error) {
                    console.error(`国家 ${countryCode} 抓取失败:`, error);
                    errors.push({
                        country: countryCode,
                        error: error.message
                    });
                }
            }

            return {
                region,
                channelCount: channels.length,
                channels,
                errors,
                timestamp: new Date()
            };

        } catch (error) {
            console.error(`地区 ${region} 抓取失败:`, error);
            throw error;
        }
    }

    /**
     * 抓取单个国家/州的数据
     * @param {string} region - 地区代码
     * @param {string} countryCode - 国家/州代码
     * @returns {Promise<Array>} 渠道数据数组
     */
    async scrapeCountry(region, countryCode) {
        const url = `${this.baseUrl}?region=${region}&country=${countryCode}`;
        
        try {
            const response = await this.makeRequest(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // 解析响应数据
            const channels = this.parseChannelData(data, region, countryCode);
            
            console.log(`✅ 地区 ${region} 国家 ${countryCode}: 获取到 ${channels.length} 个渠道`);
            
            return channels;

        } catch (error) {
            console.error(`抓取 ${region}/${countryCode} 失败:`, error);
            throw error;
        }
    }

    /**
     * 解析渠道数据
     * @param {Object} rawData - 原始API响应数据
     * @param {string} region - 地区代码
     * @param {string} countryCode - 国家代码
     * @returns {Array} 解析后的渠道数据
     */
    parseChannelData(rawData, region, countryCode) {
        const channels = [];
        
        try {
            // 根据 Unifi API 结构解析数据
            const results = rawData.results || rawData.data || [];
            
            for (const item of results) {
                const channel = {
                    unifi_id: item.id,
                    name: item.name?.trim() || '',
                    address: item.address?.trim() || '',
                    latitude: item.latitude ? parseFloat(item.latitude) : null,
                    longitude: item.longitude ? parseFloat(item.longitude) : null,
                    phone: item.phone?.trim() || null,
                    contact_email: item.email?.trim() || null,
                    region: region,
                    country_state: countryCode,
                    country_code: this.getCountryCode(countryCode),
                    partner_type: item.partner_type || 'simple',
                    scraped_at: new Date().toISOString(),
                    data_source: 'api_scraping'
                };

                // 验证必要字段
                if (channel.unifi_id && channel.name && channel.address) {
                    channels.push(channel);
                } else {
                    console.warn('跳过无效渠道数据:', item);
                }
            }

        } catch (error) {
            console.error('解析渠道数据失败:', error);
            throw error;
        }

        return channels;
    }

    // ====================================================================
    // 2. 网络请求处理
    // ====================================================================

    /**
     * 发起网络请求
     * @param {string} url - 请求URL
     * @param {Object} options - 请求选项
     * @returns {Promise<Response>} 响应对象
     */
    async makeRequest(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache',
                    ...options.headers
                },
                signal: controller.signal,
                ...options
            });

            clearTimeout(timeoutId);
            return response;

        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('请求超时');
            }
            
            throw error;
        }
    }

    /**
     * 重试请求
     * @param {Function} requestFn - 请求函数
     * @param {number} retries - 重试次数
     * @returns {Promise<any>} 请求结果
     */
    async retryRequest(requestFn, retries = this.maxRetries) {
        for (let i = 0; i <= retries; i++) {
            try {
                return await requestFn();
            } catch (error) {
                if (i === retries) {
                    throw error;
                }
                
                const delay = Math.pow(2, i) * 1000; // 指数退避
                console.log(`请求失败，${delay}ms 后重试... (${i + 1}/${retries})`);
                await this.delay(delay);
            }
        }
    }

    // ====================================================================
    // 3. 会话管理
    // ====================================================================

    /**
     * 创建抓取会话
     * @param {Object} metadata - 会话元数据
     * @returns {Promise<string>} 会话ID
     */
    async createScrapingSession(metadata) {
        try {
            const { data, error } = await supabase
                .rpc('create_monitoring_session', {
                    p_data_source: 'data_scraping_service',
                    p_metadata: metadata
                });

            if (error) throw error;
            
            console.log('✅ 创建抓取会话:', data);
            return data;

        } catch (error) {
            console.error('创建抓取会话失败:', error);
            throw error;
        }
    }

    /**
     * 完成抓取会话
     * @param {string} sessionId - 会话ID
     * @param {Object} results - 抓取结果
     * @returns {Promise<void>}
     */
    async completeScrapingSession(sessionId, results) {
        try {
            const status = results.error ? 'failed' : 'completed';
            const errorMessage = results.error || null;

            await supabase.rpc('complete_monitoring_session', {
                p_session_id: sessionId,
                p_status: status,
                p_error_message: errorMessage
            });

            console.log('✅ 完成抓取会话:', sessionId);

        } catch (error) {
            console.error('完成抓取会话失败:', error);
            throw error;
        }
    }

    // ====================================================================
    // 4. 并发控制
    // ====================================================================

    /**
     * 创建并发批次
     * @param {Array} items - 要处理的项目
     * @param {number} concurrency - 并发数
     * @param {Function} processFn - 处理函数
     * @returns {Promise<Array>} 处理结果
     */
    async createConcurrentBatches(items, concurrency, processFn) {
        const results = [];
        
        for (let i = 0; i < items.length; i += concurrency) {
            const batch = items.slice(i, i + concurrency);
            const batchPromises = batch.map(item => processFn(item));
            
            const batchResults = await Promise.allSettled(batchPromises);
            results.push(...batchResults);
            
            // 批次间延迟
            if (i + concurrency < items.length) {
                await this.delay(this.rateLimitDelay);
            }
        }
        
        return results;
    }

    // ====================================================================
    // 5. 增量抓取
    // ====================================================================

    /**
     * 增量抓取特定地区
     * @param {string} region - 地区代码
     * @param {Object} options - 选项
     * @returns {Promise<Object>} 抓取结果
     */
    async incrementalScrapeRegion(region, options = {}) {
        try {
            const sessionId = await this.createScrapingSession({
                type: 'incremental',
                region,
                ...options
            });

            const result = await this.scrapeRegion(region, sessionId);
            
            // 处理数据
            if (result.channels.length > 0) {
                const processingResult = await channelMonitoringService.processScrapedChannelData(
                    result.channels,
                    {
                        dataSource: 'incremental_scraping',
                        metadata: { region, ...options }
                    }
                );

                result.newChannels = processingResult.newChannels;
                result.updatedChannels = processingResult.updatedChannels;
                result.deactivatedChannels = processingResult.deactivatedChannels;
            }

            await this.completeScrapingSession(sessionId, result);
            
            return result;

        } catch (error) {
            console.error(`增量抓取地区 ${region} 失败:`, error);
            throw error;
        }
    }

    // ====================================================================
    // 6. 控制方法
    // ====================================================================

    /**
     * 停止当前抓取
     */
    stopScraping() {
        if (this.isRunning && this.abortController) {
            this.abortController.abort();
            console.log('⏹️ 抓取已被用户停止');
        }
    }

    /**
     * 获取抓取状态
     * @returns {Object} 状态信息
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            currentSession: this.currentSession,
            hasAbortController: !!this.abortController
        };
    }

    // ====================================================================
    // 7. 辅助方法
    // ====================================================================

    /**
     * 获取国家代码
     * @param {string} countryCode - 国家/州代码
     * @returns {string} 标准国家代码
     */
    getCountryCode(countryCode) {
        // 根据 REGION_MAPPING 转换为标准国家代码
        const mapping = REGION_MAPPING[countryCode];
        return mapping?.country || countryCode;
    }

    /**
     * 通知进度
     * @param {Object} progressData - 进度数据
     */
    notifyProgress(progressData) {
        if (this.progressCallback) {
            this.progressCallback(progressData);
        }
    }

    /**
     * 延迟函数
     * @param {number} ms - 毫秒数
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 清理资源
     */
    cleanup() {
        this.stopScraping();
        this.isRunning = false;
        this.currentSession = null;
        this.progressCallback = null;
        this.abortController = null;
    }

    // ====================================================================
    // 8. 手动数据处理
    // ====================================================================

    /**
     * 手动处理已有的渠道数据
     * @param {Array} channelData - 渠道数据
     * @param {Object} options - 选项
     * @returns {Promise<Object>} 处理结果
     */
    async processManualChannelData(channelData, options = {}) {
        try {
            return await channelMonitoringService.processScrapedChannelData(
                channelData,
                {
                    dataSource: 'manual_input',
                    metadata: options
                }
            );
        } catch (error) {
            console.error('手动处理渠道数据失败:', error);
            throw error;
        }
    }

    /**
     * 验证渠道数据格式
     * @param {Object} channelData - 渠道数据
     * @returns {boolean} 是否有效
     */
    validateChannelData(channelData) {
        const requiredFields = ['unifi_id', 'name', 'address'];
        return requiredFields.every(field => 
            channelData.hasOwnProperty(field) && channelData[field]
        );
    }
}

// 创建单例实例
const dataScrapingService = new DataScrapingService();

// 页面卸载时清理资源
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        dataScrapingService.cleanup();
    });
}

export default dataScrapingService;
export { DataScrapingService };