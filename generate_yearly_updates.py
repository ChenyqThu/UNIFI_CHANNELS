#!/usr/bin/env python3
"""
年度渠道更新数据生成脚本
从SQLite数据库查询last_modified_at数据，生成前端所需的JSON文件
包含地区级别和国家级别数据，正确处理美国各州和加拿大各省映射
"""

import sqlite3
import json
from datetime import datetime
import os

# 美国各州代码
USA_STATES = {'CA', 'FL', 'IL', 'NY', 'OH', 'TX', 'PA', 'MD', 'MO', 'OR', 'NJ', 'NC', 'SC'}

# 加拿大各省代码  
CANADA_PROVINCES = {'ON', 'QC', 'AB', 'BC'}

def map_country_code(country_code, region):
    """根据地区映射国家代码到正确的国家名称"""
    # 特殊处理CA：根据region判断
    if country_code == 'CA':
        if region == 'can':
            return 'Canada'
        elif region == 'usa':
            return 'USA'
    
    # 美国各州映射为USA
    if country_code in USA_STATES or region == 'usa':
        return 'USA'
    
    # 加拿大各省映射为Canada
    if country_code in CANADA_PROVINCES or region == 'can':
        return 'Canada'
    
    # 其他情况返回原始代码
    return country_code

def generate_yearly_channel_updates():
    """从数据库生成年度渠道更新数据"""
    
    # 数据库路径
    db_path = os.path.join(os.path.dirname(__file__), 'unifi_distributors.db')
    output_path = os.path.join(os.path.dirname(__file__), 'frontend/public/data/yearly-channel-updates.json')
    
    try:
        # 连接数据库
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 查询年度地区数据
        region_query = """
        SELECT strftime('%Y', last_modified_at) as year, 
               region, 
               COUNT(*) as count 
        FROM distributors 
        WHERE last_modified_at IS NOT NULL AND is_active = 1 
        GROUP BY year, region 
        ORDER BY year, region
        """
        
        cursor.execute(region_query)
        region_results = cursor.fetchall()
        
        # 查询年度国家数据（原始数据）
        country_query = """
        SELECT strftime('%Y', last_modified_at) as year, 
               country_state, 
               region,
               COUNT(*) as count 
        FROM distributors 
        WHERE last_modified_at IS NOT NULL AND is_active = 1 AND country_state IS NOT NULL
        GROUP BY year, country_state, region 
        ORDER BY year, country_state
        """
        
        cursor.execute(country_query)
        country_results = cursor.fetchall()
        
        # 查询年度总数
        total_query = """
        SELECT strftime('%Y', last_modified_at) as year, 
               COUNT(*) as total 
        FROM distributors 
        WHERE last_modified_at IS NOT NULL AND is_active = 1 
        GROUP BY year 
        ORDER BY year
        """
        
        cursor.execute(total_query)
        totals = dict(cursor.fetchall())
        
        # 处理地区数据
        yearly_region_data = {}
        all_regions = set()
        
        for year, region, count in region_results:
            year = int(year)
            if year not in yearly_region_data:
                yearly_region_data[year] = {}
            yearly_region_data[year][region] = count
            all_regions.add(region)
        
        # 处理国家数据 - 应用映射规则
        yearly_country_data = {}
        yearly_mapped_country_data = {}  # 映射后的国家数据
        all_countries = set()
        all_mapped_countries = set()
        country_region_map = {}
        mapped_country_region_map = {}
        
        for year, country, region, count in country_results:
            year = int(year)
            
            # 原始数据
            if year not in yearly_country_data:
                yearly_country_data[year] = {}
            yearly_country_data[year][country] = count
            all_countries.add(country)
            country_region_map[country] = region
            
            # 映射后的数据
            mapped_country = map_country_code(country, region)
            if year not in yearly_mapped_country_data:
                yearly_mapped_country_data[year] = {}
            
            if mapped_country in yearly_mapped_country_data[year]:
                yearly_mapped_country_data[year][mapped_country] += count
            else:
                yearly_mapped_country_data[year][mapped_country] = count
            
            all_mapped_countries.add(mapped_country)
            mapped_country_region_map[mapped_country] = region
        
        # 转换为图表格式（地区）
        chart_data = []
        for year in sorted(yearly_region_data.keys()):
            year_data = {"year": year}
            for region in sorted(all_regions):
                year_data[region] = yearly_region_data[year].get(region, 0)
            year_data["total"] = totals.get(str(year), 0)
            chart_data.append(year_data)
        
        # 生成原始国家数据（按年份组织）
        country_by_year = {}
        for year in sorted(yearly_country_data.keys()):
            country_by_year[year] = yearly_country_data[year]
        
        # 生成映射后的国家数据（用于地图显示）
        mapped_country_by_year = {}
        for year in sorted(yearly_mapped_country_data.keys()):
            mapped_country_by_year[year] = yearly_mapped_country_data[year]
        
        # 计算所有年份的国家汇总（原始）
        country_totals = {}
        for year_data in yearly_country_data.values():
            for country, count in year_data.items():
                country_totals[country] = country_totals.get(country, 0) + count
        
        # 计算所有年份的映射国家汇总（用于地图）
        mapped_country_totals = {}
        for year_data in yearly_mapped_country_data.values():
            for country, count in year_data.items():
                mapped_country_totals[country] = mapped_country_totals.get(country, 0) + count
        
        # 将汇总数据添加到对应的数据结构中
        country_by_year["all"] = country_totals
        mapped_country_by_year["all"] = mapped_country_totals
        
        # 计算洞察
        total_updates = sum(totals.values())
        most_active_year = max(totals.keys(), key=lambda y: totals[y]) if totals else None
        
        # 计算最活跃地区
        region_totals = {}
        for region in all_regions:
            region_totals[region] = sum(yearly_region_data[year].get(region, 0) for year in yearly_region_data.keys())
        
        most_active_region = max(region_totals.keys(), key=lambda r: region_totals[r]) if region_totals else None
        
        # 计算地区增长趋势
        regional_trends = {}
        years = sorted(yearly_region_data.keys())
        
        for region in all_regions:
            region_data = [yearly_region_data[year].get(region, 0) for year in years]
            first_value = region_data[0] if region_data else 1
            last_value = region_data[-1] if region_data else 0
            
            growth_rate = ((last_value - first_value) / first_value * 100) if first_value > 0 else 0
            
            regional_trends[region] = {
                "total_updates": region_totals[region],
                "growth_rate": round(growth_rate, 1),
                "latest_year_updates": last_value
            }
        
        # 计算最活跃国家（按总更新数排序）- 使用映射后的数据
        top_countries = sorted(mapped_country_totals.items(), key=lambda x: x[1], reverse=True)[:10]
        
        # 生成最终数据结构
        output_data = {
            "success": True,
            "timestamp": datetime.now().isoformat() + "Z",
            "source": "unifi_distributors.db",
            "queries": {
                "regions": region_query.strip(),
                "countries": country_query.strip()
            },
            "data": {
                "chart_data": chart_data,
                "regions": sorted(all_regions),
                "years": years,
                "country_data": country_by_year,  # 原始国家数据（用于统计）
                "mapped_country_data": mapped_country_by_year,  # 映射后的国家数据（用于地图）
                "country_region_map": country_region_map,  # 原始映射
                "mapped_country_region_map": mapped_country_region_map,  # 映射后的映射
                "available_years": sorted(years) + ["all"],
                "insights": {
                    "total_channel_updates": total_updates,
                    "most_active_year": int(most_active_year) if most_active_year else None,
                    "most_active_region": most_active_region,
                    "regional_trends": regional_trends,
                    "years_analyzed": len(years),
                    "countries_covered": len(all_countries),
                    "mapped_countries_covered": len(all_mapped_countries),
                    "top_countries": [{"country": country, "count": count, "region": mapped_country_region_map.get(country, "unknown")} for country, count in top_countries],
                    "mapping_info": {
                        "usa_states_count": len([c for c in all_countries if c in USA_STATES or (c == 'CA' and country_region_map.get(c) == 'usa')]),
                        "canada_provinces_count": len([c for c in all_countries if c in CANADA_PROVINCES or (c == 'CA' and country_region_map.get(c) == 'can')]),
                        "usa_total_updates": mapped_country_totals.get('USA', 0),
                        "canada_total_updates": mapped_country_totals.get('Canada', 0)
                    }
                }
            }
        }
        
        # 确保输出目录存在
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # 写入JSON文件
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ 年度渠道更新数据已生成: {output_path}")
        print(f"📊 总更新数: {total_updates}")
        print(f"📅 年份范围: {min(years)}-{max(years)}")
        print(f"🌍 活跃地区数: {len(all_regions)}")
        print(f"🏳️ 原始国家数: {len(all_countries)}")
        print(f"🗺️ 映射后国家数: {len(all_mapped_countries)}")
        print(f"🇺🇸 美国总更新数: {mapped_country_totals.get('USA', 0)}")
        print(f"🇨🇦 加拿大总更新数: {mapped_country_totals.get('Canada', 0)}")
        print(f"🏆 最活跃国家: {top_countries[0][0]} ({top_countries[0][1]}次更新)")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ 生成年度渠道更新数据失败: {e}")
        return False

if __name__ == "__main__":
    generate_yearly_channel_updates()