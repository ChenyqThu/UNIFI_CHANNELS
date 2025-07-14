#!/usr/bin/env python3
"""
Dynamic Region Mapping Manager
Automatically extracts and manages region-country mappings from Unifi website
"""

import requests
import re
import json
import sqlite3
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from config.settings import settings
from config.logging import LoggerMixin


@dataclass
class RegionCountryMapping:
    """区域-国家映射数据结构"""
    region_code: str
    region_name: str
    country_code: str
    country_name: str
    is_active: bool = True
    discovered_at: Optional[datetime] = None
    last_verified_at: Optional[datetime] = None


class RegionMappingManager(LoggerMixin):
    """动态区域映射管理器"""
    
    def __init__(self, db_path: str = "unifi_distributors.db"):
        self.db_path = db_path
        self.base_url = "https://www.ui.com/distributors/"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': settings.user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive'
        })
        
        # Initialize database table
        self.init_mapping_table()
        self.logger.info("Region mapping manager initialized")
    
    def init_mapping_table(self):
        """初始化区域映射数据表"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # 创建区域映射表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS region_mappings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    region_code TEXT NOT NULL,
                    region_name TEXT,
                    country_code TEXT NOT NULL,
                    country_name TEXT,
                    is_active BOOLEAN DEFAULT 1,
                    discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(region_code, country_code)
                )
            """)
            
            # 创建索引
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_region_mapping_region ON region_mappings(region_code)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_region_mapping_country ON region_mappings(country_code)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_region_mapping_active ON region_mappings(is_active)")
            
            conn.commit()
            self.logger.info("Region mapping table initialized")
            
        except Exception as e:
            self.logger.error(f"Error initializing mapping table: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def extract_mappings_from_website(self) -> Optional[Dict[str, List[str]]]:
        """从Unifi网站提取完整的区域-国家映射"""
        self.logger.info("Extracting region mappings from Unifi website...")
        
        try:
            response = self.session.get(self.base_url, timeout=30)
            response.raise_for_status()
            html_content = response.text
            
            # 尝试多种提取方法
            mappings = self._extract_from_main_regions_data(html_content)
            
            if not mappings:
                mappings = self._extract_from_select_options(html_content)
            
            if not mappings:
                mappings = self._extract_from_javascript_vars(html_content)
            
            if mappings:
                self.logger.info(f"Successfully extracted mappings for {len(mappings)} regions")
                total_countries = sum(len(countries) for countries in mappings.values())
                self.logger.info(f"Total country/state combinations: {total_countries}")
                return mappings
            else:
                self.logger.warning("No mappings extracted from website")
                return None
                
        except Exception as e:
            self.logger.error(f"Error extracting mappings from website: {e}")
            return None
    
    def _extract_from_main_regions_data(self, html_content: str) -> Optional[Dict[str, List[str]]]:
        """从mainRegionsData变量提取映射"""
        patterns = [
            r'mainRegionsData\s*=\s*(\[.*?\]);',
            r'var\s+mainRegionsData\s*=\s*(\[.*?\]);',
            r'mainRegionsData\s*[:=]\s*(\[.*?\])',
            r'window\.mainRegionsData\s*=\s*(\[.*?\]);'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, html_content, re.DOTALL)
            if match:
                try:
                    js_data = match.group(1)
                    # 清理JavaScript数据
                    js_data = re.sub(r"'([^']*)'", r'"\1"', js_data)
                    js_data = re.sub(r',\s*}', '}', js_data)
                    js_data = re.sub(r',\s*]', ']', js_data)
                    
                    regions_data = json.loads(js_data)
                    
                    mappings = {}
                    for region_data in regions_data:
                        region_code = region_data.get('s', '')
                        countries_data = region_data.get('i', [])
                        
                        if region_code:
                            countries = [c.get('s', '') for c in countries_data if c.get('s')]
                            if countries:
                                mappings[region_code] = countries
                    
                    if mappings:
                        self.logger.info(f"Extracted mappings from mainRegionsData: {len(mappings)} regions")
                        return mappings
                        
                except Exception as e:
                    self.logger.debug(f"Failed to parse mainRegionsData: {e}")
                    continue
        
        return None
    
    def _extract_from_select_options(self, html_content: str) -> Optional[Dict[str, List[str]]]:
        """从选择框选项提取映射"""
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # 查找区域选择框
            region_select = soup.find('select', {'name': 'region'}) or soup.find('select', {'id': 'region'})
            country_select = soup.find('select', {'name': 'country_state'}) or soup.find('select', {'id': 'country_state'})
            
            if region_select and country_select:
                regions = [opt.get('value') for opt in region_select.find_all('option') if opt.get('value')]
                countries = [opt.get('value') for opt in country_select.find_all('option') if opt.get('value')]
                
                if regions and countries:
                    # 这种方法需要进一步验证每个组合
                    self.logger.info(f"Found {len(regions)} regions and {len(countries)} countries in select options")
                    return self._validate_region_country_combinations(regions, countries)
            
        except Exception as e:
            self.logger.debug(f"Failed to extract from select options: {e}")
        
        return None
    
    def _extract_from_javascript_vars(self, html_content: str) -> Optional[Dict[str, List[str]]]:
        """从其他JavaScript变量提取映射"""
        # 查找可能包含映射的其他JavaScript变量
        js_var_patterns = [
            r'regionData\s*=\s*(\{.*?\});',
            r'countryData\s*=\s*(\{.*?\});',
            r'distributorRegions\s*=\s*(\[.*?\]);'
        ]
        
        for pattern in js_var_patterns:
            match = re.search(pattern, html_content, re.DOTALL)
            if match:
                try:
                    js_data = match.group(1)
                    # 尝试解析并提取有用信息
                    # 这里可以根据实际的JavaScript结构来调整
                    self.logger.debug(f"Found potential mapping data: {js_data[:100]}...")
                except Exception as e:
                    self.logger.debug(f"Failed to parse JS variable: {e}")
                    continue
        
        return None
    
    def _validate_region_country_combinations(self, regions: List[str], countries: List[str]) -> Optional[Dict[str, List[str]]]:
        """验证区域-国家组合的有效性"""
        self.logger.info("Validating region-country combinations...")
        valid_mappings = {}
        
        for region in regions:
            valid_countries = []
            for country in countries[:10]:  # 限制测试数量以避免过多请求
                try:
                    url = f"{self.base_url}?region={region}&country_state={country}"
                    response = self.session.get(url, timeout=10)
                    
                    if response.status_code == 200 and 'mapInit' in response.text:
                        # 检查是否返回了实际数据
                        map_init_match = re.search(r'var\s+mapInit\s*=\s*(\[.*?\]);', response.text, re.DOTALL)
                        if map_init_match and len(map_init_match.group(1)) > 10:  # 有实际内容
                            valid_countries.append(country)
                    
                    # 避免请求过于频繁
                    import time
                    time.sleep(0.2)
                    
                except Exception as e:
                    self.logger.debug(f"Validation failed for {region}-{country}: {e}")
                    continue
            
            if valid_countries:
                valid_mappings[region] = valid_countries
        
        return valid_mappings if valid_mappings else None
    
    def discover_new_mappings(self) -> Dict[str, List[str]]:
        """发现新的区域-国家映射"""
        self.logger.info("Starting comprehensive mapping discovery...")
        
        # 首先尝试从网站提取
        website_mappings = self.extract_mappings_from_website()
        
        if website_mappings:
            return website_mappings
        
        # 如果网站提取失败，使用探索性发现
        return self._exploratory_discovery()
    
    def _exploratory_discovery(self) -> Dict[str, List[str]]:
        """探索性发现映射"""
        self.logger.info("Using exploratory discovery method...")
        
        # 已知的区域列表
        known_regions = ['af', 'as', 'aus-nzl', 'can', 'eur', 'lat-a', 'mid-e', 'usa']
        
        # 常见的国家/州代码列表（基于ISO标准和常见缩写）
        potential_countries = [
            # 欧洲
            'DE', 'FR', 'GB', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'PL', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'GR', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU', 'AL', 'BA', 'MK', 'ME', 'RS', 'XK', 'MD', 'UA', 'AM', 'GE', 'AZ', 'TR',
            # 亚洲
            'CN', 'JP', 'KR', 'IN', 'ID', 'TH', 'VN', 'MY', 'SG', 'PH', 'TW', 'HK', 'MO', 'KH', 'MM', 'BD', 'PK', 'LK', 'NP', 'BN', 'MV', 'MN', 'KZ', 'UZ',
            # 美洲
            'US', 'CA', 'MX', 'BR', 'AR', 'CO', 'PE', 'VE', 'CL', 'EC', 'BO', 'PY', 'UY', 'GY', 'SR', 'GF', 'CR', 'PA', 'GT', 'HN', 'SV', 'NI', 'BZ', 'DO', 'HT', 'JM', 'TT', 'BB', 'BS', 'CU',
            # 美国州
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
            # 加拿大省
            'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
            # 非洲
            'ZA', 'NG', 'KE', 'GH', 'TZ', 'UG', 'ZW', 'NA', 'BW', 'ZM', 'MW', 'MZ', 'MG', 'MU', 'SC', 'CD', 'CM', 'CI', 'SN', 'ML', 'BF', 'NE', 'TD', 'CF', 'CG', 'GA', 'GQ', 'ST', 'AO', 'LY', 'DZ', 'TN', 'MA', 'EG', 'SD', 'SS', 'ET', 'ER', 'DJ', 'SO',
            # 中东
            'SA', 'AE', 'IL', 'IQ', 'IR', 'JO', 'LB', 'SY', 'YE', 'OM', 'QA', 'KW', 'BH', 'AF', 'PK',
            # 大洋洲
            'AU', 'NZ', 'FJ', 'PG', 'NC', 'VU', 'SB', 'PF', 'WS', 'KI', 'TO', 'MH', 'FM', 'PW', 'NR', 'TV'
        ]
        
        discovered_mappings = {}
        
        for region in known_regions:
            self.logger.info(f"Discovering mappings for region: {region}")
            valid_countries = []
            
            for country in potential_countries:
                try:
                    url = f"{self.base_url}?region={region}&country_state={country}"
                    response = self.session.get(url, timeout=15)
                    
                    if response.status_code == 200:
                        # 检查是否有实际的分销商数据
                        if 'mapInit' in response.text:
                            map_init_match = re.search(r'var\s+mapInit\s*=\s*(\[.*?\]);', response.text, re.DOTALL)
                            if map_init_match:
                                map_data = map_init_match.group(1)
                                # 检查是否有真实数据（不只是空数组）
                                if len(map_data) > 10 and 'location' in map_data:
                                    valid_countries.append(country)
                                    self.logger.debug(f"Found distributors in {region}-{country}")
                    
                    # 控制请求频率
                    import time
                    time.sleep(0.3)
                    
                except Exception as e:
                    self.logger.debug(f"Discovery failed for {region}-{country}: {e}")
                    continue
                
                # 每个区域最多测试前100个国家以控制时间
                if len(valid_countries) > 50:
                    break
            
            if valid_countries:
                discovered_mappings[region] = valid_countries
                self.logger.info(f"Discovered {len(valid_countries)} valid countries for {region}")
        
        return discovered_mappings
    
    def update_mappings_in_database(self, mappings: Dict[str, List[str]]) -> Tuple[int, int]:
        """更新数据库中的映射"""
        self.logger.info("Updating mappings in database...")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        new_count = 0
        updated_count = 0
        
        try:
            current_time = datetime.now().isoformat()
            
            for region_code, countries in mappings.items():
                for country_code in countries:
                    # 检查是否已存在
                    cursor.execute(
                        "SELECT id, is_active FROM region_mappings WHERE region_code = ? AND country_code = ?",
                        (region_code, country_code)
                    )
                    existing = cursor.fetchone()
                    
                    if existing:
                        # 更新现有记录
                        if not existing[1]:  # 如果之前被标记为不活跃
                            cursor.execute("""
                                UPDATE region_mappings 
                                SET is_active = 1, last_verified_at = ?, updated_at = ?
                                WHERE region_code = ? AND country_code = ?
                            """, (current_time, current_time, region_code, country_code))
                            updated_count += 1
                        else:
                            # 只更新验证时间
                            cursor.execute("""
                                UPDATE region_mappings 
                                SET last_verified_at = ?, updated_at = ?
                                WHERE region_code = ? AND country_code = ?
                            """, (current_time, current_time, region_code, country_code))
                    else:
                        # 插入新记录
                        cursor.execute("""
                            INSERT INTO region_mappings 
                            (region_code, country_code, is_active, discovered_at, last_verified_at, created_at, updated_at)
                            VALUES (?, ?, 1, ?, ?, ?, ?)
                        """, (region_code, country_code, current_time, current_time, current_time, current_time))
                        new_count += 1
            
            # 标记未在最新发现中出现的映射为不活跃
            all_current_combinations = [(r, c) for r, countries in mappings.items() for c in countries]
            if all_current_combinations:
                placeholders = ','.join(['(?,?)'] * len(all_current_combinations))
                flat_combinations = [item for pair in all_current_combinations for item in pair]
                
                cursor.execute(f"""
                    UPDATE region_mappings 
                    SET is_active = 0, updated_at = ?
                    WHERE is_active = 1 AND (region_code, country_code) NOT IN (VALUES {placeholders})
                """, [current_time] + flat_combinations)
            
            conn.commit()
            self.logger.info(f"Database updated: {new_count} new, {updated_count} updated mappings")
            
        except Exception as e:
            self.logger.error(f"Error updating database: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
        
        return new_count, updated_count
    
    def get_current_mappings(self) -> Dict[str, List[str]]:
        """获取当前数据库中的活跃映射"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT region_code, country_code 
                FROM region_mappings 
                WHERE is_active = 1 
                ORDER BY region_code, country_code
            """)
            
            mappings = {}
            for region_code, country_code in cursor.fetchall():
                if region_code not in mappings:
                    mappings[region_code] = []
                mappings[region_code].append(country_code)
            
            return mappings
            
        finally:
            conn.close()
    
    def get_mapping_statistics(self) -> Dict:
        """获取映射统计信息"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # 总体统计
            cursor.execute("SELECT COUNT(*) FROM region_mappings WHERE is_active = 1")
            total_active = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM region_mappings WHERE is_active = 0")
            total_inactive = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(DISTINCT region_code) FROM region_mappings WHERE is_active = 1")
            active_regions = cursor.fetchone()[0]
            
            # 按区域统计
            cursor.execute("""
                SELECT region_code, COUNT(*) as count
                FROM region_mappings 
                WHERE is_active = 1 
                GROUP BY region_code 
                ORDER BY region_code
            """)
            region_stats = dict(cursor.fetchall())
            
            # 最近更新统计
            cursor.execute("""
                SELECT 
                    COUNT(*) as recent_updates
                FROM region_mappings 
                WHERE datetime(updated_at) >= datetime('now', '-7 days')
            """)
            recent_updates = cursor.fetchone()[0]
            
            return {
                'total_active_mappings': total_active,
                'total_inactive_mappings': total_inactive,
                'active_regions': active_regions,
                'region_distribution': region_stats,
                'recent_updates': recent_updates
            }
            
        finally:
            conn.close()
    
    def refresh_mappings(self) -> Dict:
        """刷新所有映射"""
        self.logger.info("Starting full mapping refresh...")
        
        try:
            # 发现新映射
            new_mappings = self.discover_new_mappings()
            
            if not new_mappings:
                self.logger.warning("No mappings discovered")
                return {'success': False, 'error': 'No mappings discovered'}
            
            # 更新数据库
            new_count, updated_count = self.update_mappings_in_database(new_mappings)
            
            # 获取统计信息
            stats = self.get_mapping_statistics()
            
            result = {
                'success': True,
                'new_mappings': new_count,
                'updated_mappings': updated_count,
                'total_mappings': stats['total_active_mappings'],
                'regions': list(new_mappings.keys()),
                'statistics': stats
            }
            
            self.logger.info(f"Mapping refresh completed: {result}")
            return result
            
        except Exception as e:
            self.logger.error(f"Error refreshing mappings: {e}")
            return {'success': False, 'error': str(e)}