/**
 * Channel Monitoring Service
 * 渠道监控服务 - 处理 Unifi 渠道的全生命周期跟踪
 */

import { supabase } from './supabaseClient.js';

class ChannelMonitoringService {
    constructor() {
        this.subscriptions = new Map();
        this.sessionCache = new Map();
    }

    // ====================================================================
    // 1. 渠道数据管理
    // ====================================================================

    /**
     * 获取所有活跃渠道
     * @param {Object} filters - 过滤条件
     * @returns {Promise<Array>} 活跃渠道列表
     */
    async getActiveChannels(filters = {}) {
        try {
            let query = supabase
                .from('active_channels_detailed')
                .select('*')
                .eq('is_active', true);

            // 应用过滤条件
            if (filters.region) {
                query = query.eq('region', filters.region);
            }
            if (filters.country_code) {
                query = query.eq('country_code', filters.country_code);
            }
            if (filters.partner_type) {
                query = query.eq('partner_type', filters.partner_type);
            }
            if (filters.activity_status) {
                query = query.eq('activity_status', filters.activity_status);
            }

            const { data, error } = await query.order('last_seen_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('获取活跃渠道失败:', error);
            throw error;
        }
    }

    /**
     * 获取渠道详细信息
     * @param {string} distributorId - 分销商ID
     * @returns {Promise<Object>} 渠道详细信息
     */
    async getChannelDetails(distributorId) {
        try {
            const { data, error } = await supabase
                .from('distributors')
                .select('*')
                .eq('id', distributorId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('获取渠道详情失败:', error);
            throw error;
        }
    }

    /**
     * 根据 Unifi ID 获取渠道
     * @param {number} unifiId - Unifi ID
     * @returns {Promise<Object>} 渠道信息
     */
    async getChannelByUnifiId(unifiId) {
        try {
            const { data, error } = await supabase
                .from('distributors')
                .select('*')
                .eq('unifi_id', unifiId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('根据 Unifi ID 获取渠道失败:', error);
            throw error;
        }
    }

    // ====================================================================
    // 2. 生命周期事件跟踪
    // ====================================================================

    /**
     * 获取渠道生命周期事件
     * @param {string} distributorId - 分销商ID
     * @param {Object} options - 选项
     * @returns {Promise<Array>} 生命周期事件列表
     */
    async getChannelLifecycleEvents(distributorId, options = {}) {
        try {
            let query = supabase
                .from('channel_lifecycle_events')
                .select('*')
                .eq('distributor_id', distributorId);

            if (options.eventType) {
                query = query.eq('event_type', options.eventType);
            }

            if (options.limit) {
                query = query.limit(options.limit);
            }

            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('获取生命周期事件失败:', error);
            throw error;
        }
    }

    /**
     * 获取最近的渠道变更
     * @param {Object} options - 选项
     * @returns {Promise<Array>} 最近变更列表
     */
    async getRecentChannelChanges(options = {}) {
        try {
            let query = supabase
                .from('recent_channel_changes')
                .select('*');

            if (options.days) {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - options.days);
                query = query.gte('created_at', startDate.toISOString());
            }

            if (options.eventType) {
                query = query.eq('event_type', options.eventType);
            }

            if (options.limit) {
                query = query.limit(options.limit);
            }

            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('获取最近变更失败:', error);
            throw error;
        }
    }

    // ====================================================================
    // 3. 统计和分析
    // ====================================================================

    /**
     * 获取渠道趋势数据
     * @param {number} days - 天数
     * @returns {Promise<Array>} 趋势数据
     */
    async getChannelTrends(days = 30) {
        try {
            const { data, error } = await supabase
                .rpc('get_channel_trends', { days });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('获取渠道趋势失败:', error);
            throw error;
        }
    }

    /**
     * 获取渠道生命周期统计
     * @returns {Promise<Object>} 生命周期统计
     */
    async getChannelLifecycleStats() {
        try {
            const { data, error } = await supabase
                .rpc('get_channel_lifecycle_stats');

            if (error) throw error;
            return data?.[0] || {};
        } catch (error) {
            console.error('获取生命周期统计失败:', error);
            throw error;
        }
    }

    /**
     * 获取渠道分布统计
     * @returns {Promise<Array>} 分布统计
     */
    async getChannelDistributionStats() {
        try {
            const { data, error } = await supabase
                .rpc('get_channel_distribution_stats');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('获取分布统计失败:', error);
            throw error;
        }
    }

    // ====================================================================
    // 4. 监控会话管理
    // ====================================================================

    /**
     * 获取监控会话列表
     * @param {Object} options - 选项
     * @returns {Promise<Array>} 会话列表
     */
    async getMonitoringSessions(options = {}) {
        try {
            let query = supabase
                .from('session_summary')
                .select('*');

            if (options.status) {
                query = query.eq('status', options.status);
            }

            if (options.limit) {
                query = query.limit(options.limit);
            }

            const { data, error } = await query.order('session_start', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('获取监控会话失败:', error);
            throw error;
        }
    }

    /**
     * 获取最新的监控会话
     * @returns {Promise<Object>} 最新会话
     */
    async getLatestMonitoringSession() {
        try {
            const { data, error } = await supabase
                .from('channel_monitoring_sessions')
                .select('*')
                .order('session_start', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('获取最新监控会话失败:', error);
            throw error;
        }
    }

    // ====================================================================
    // 5. 数据抓取集成
    // ====================================================================

    /**
     * 处理抓取到的渠道数据
     * @param {Array} channelDataList - 渠道数据列表
     * @param {Object} options - 选项
     * @returns {Promise<Object>} 处理结果
     */
    async processScrapedChannelData(channelDataList, options = {}) {
        try {
            // 创建监控会话
            const { data: sessionData, error: sessionError } = await supabase
                .rpc('create_monitoring_session', {
                    p_data_source: options.dataSource || 'frontend_scraping',
                    p_metadata: options.metadata || {}
                });

            if (sessionError) throw sessionError;
            const sessionId = sessionData;

            const results = {
                sessionId,
                processed: 0,
                newChannels: 0,
                updatedChannels: 0,
                errors: []
            };

            // 处理每个渠道数据
            for (const channelData of channelDataList) {
                try {
                    const { data: result, error } = await supabase
                        .rpc('upsert_channel_data', {
                            p_unifi_id: channelData.unifi_id,
                            p_channel_data: channelData,
                            p_session_id: sessionId
                        });

                    if (error) throw error;

                    const [resultData] = result;
                    if (resultData.is_new) {
                        results.newChannels++;
                    } else if (resultData.has_changes) {
                        results.updatedChannels++;
                    }
                    results.processed++;

                } catch (error) {
                    console.error(`处理渠道 ${channelData.unifi_id} 失败:`, error);
                    results.errors.push({
                        unifi_id: channelData.unifi_id,
                        error: error.message
                    });
                }
            }

            // 标记失踪的渠道为不活跃
            const foundUnifiIds = channelDataList.map(c => c.unifi_id);
            const { data: deactivatedCount, error: deactivateError } = await supabase
                .rpc('mark_missing_channels_inactive', {
                    p_session_id: sessionId,
                    p_found_unifi_ids: foundUnifiIds
                });

            if (deactivateError) throw deactivateError;
            results.deactivatedChannels = deactivatedCount;

            // 完成监控会话
            const status = results.errors.length > 0 ? 'completed_with_errors' : 'completed';
            await supabase.rpc('complete_monitoring_session', {
                p_session_id: sessionId,
                p_status: status,
                p_error_message: results.errors.length > 0 ? `${results.errors.length} errors occurred` : null
            });

            return results;

        } catch (error) {
            console.error('处理抓取数据失败:', error);
            throw error;
        }
    }

    // ====================================================================
    // 6. 实时订阅
    // ====================================================================

    /**
     * 订阅渠道变更
     * @param {Function} callback - 回调函数
     * @param {Object} options - 选项
     * @returns {Function} 取消订阅函数
     */
    subscribeToChannelChanges(callback, options = {}) {
        const channelName = `channel_changes_${Date.now()}`;
        
        const subscription = supabase
            .channel(channelName)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'channel_lifecycle_events'
            }, callback)
            .subscribe();

        this.subscriptions.set(channelName, subscription);

        return () => {
            subscription.unsubscribe();
            this.subscriptions.delete(channelName);
        };
    }

    /**
     * 订阅监控会话变更
     * @param {Function} callback - 回调函数
     * @returns {Function} 取消订阅函数
     */
    subscribeToSessionChanges(callback) {
        const channelName = `session_changes_${Date.now()}`;
        
        const subscription = supabase
            .channel(channelName)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'channel_monitoring_sessions'
            }, callback)
            .subscribe();

        this.subscriptions.set(channelName, subscription);

        return () => {
            subscription.unsubscribe();
            this.subscriptions.delete(channelName);
        };
    }

    /**
     * 取消所有订阅
     */
    unsubscribeAll() {
        for (const [channelName, subscription] of this.subscriptions) {
            subscription.unsubscribe();
        }
        this.subscriptions.clear();
    }

    // ====================================================================
    // 7. 缓存管理
    // ====================================================================

    /**
     * 清除缓存
     */
    clearCache() {
        this.sessionCache.clear();
    }

    /**
     * 获取缓存的会话数据
     * @param {string} sessionId - 会话ID
     * @returns {Object|null} 缓存的会话数据
     */
    getCachedSession(sessionId) {
        return this.sessionCache.get(sessionId);
    }

    /**
     * 设置会话缓存
     * @param {string} sessionId - 会话ID
     * @param {Object} sessionData - 会话数据
     */
    setCachedSession(sessionId, sessionData) {
        this.sessionCache.set(sessionId, sessionData);
    }

    // ====================================================================
    // 8. 辅助方法
    // ====================================================================

    /**
     * 格式化渠道数据用于显示
     * @param {Object} channel - 渠道数据
     * @returns {Object} 格式化后的渠道数据
     */
    formatChannelForDisplay(channel) {
        return {
            ...channel,
            displayName: channel.name || 'Unknown',
            locationString: this.formatLocation(channel),
            activityStatus: this.getActivityStatus(channel),
            lifespanDays: this.calculateLifespan(channel)
        };
    }

    /**
     * 格式化位置信息
     * @param {Object} channel - 渠道数据
     * @returns {string} 格式化的位置字符串
     */
    formatLocation(channel) {
        const parts = [];
        if (channel.region) parts.push(channel.region);
        if (channel.country_code) parts.push(channel.country_code);
        return parts.join(', ');
    }

    /**
     * 获取活动状态
     * @param {Object} channel - 渠道数据
     * @returns {string} 活动状态
     */
    getActivityStatus(channel) {
        if (!channel.is_active) return 'inactive';
        
        const now = new Date();
        const lastSeen = new Date(channel.last_seen_at);
        const daysSinceLastSeen = (now - lastSeen) / (1000 * 60 * 60 * 24);

        if (daysSinceLastSeen > 7) return 'stale';
        if (daysSinceLastSeen > 1) return 'recent';
        return 'active';
    }

    /**
     * 计算生命周期天数
     * @param {Object} channel - 渠道数据
     * @returns {number} 生命周期天数
     */
    calculateLifespan(channel) {
        const startDate = new Date(channel.first_seen_at);
        const endDate = channel.deactivated_at ? new Date(channel.deactivated_at) : new Date();
        return Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    }

    // ====================================================================
    // 9. 错误处理
    // ====================================================================

    /**
     * 标准化错误处理
     * @param {Error} error - 错误对象
     * @returns {Object} 标准化的错误信息
     */
    handleError(error) {
        console.error('Channel Monitoring Service Error:', error);
        
        return {
            message: error.message || 'Unknown error occurred',
            code: error.code || 'UNKNOWN_ERROR',
            details: error.details || null,
            hint: error.hint || null
        };
    }
}

// 创建单例实例
const channelMonitoringService = new ChannelMonitoringService();

export default channelMonitoringService;
export { ChannelMonitoringService };