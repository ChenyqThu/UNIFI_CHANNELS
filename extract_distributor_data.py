#!/usr/bin/env python3
"""
提取分销商数据从SQLite数据库并生成JSON文件供前端使用
"""

import sqlite3
import json
import re
from datetime import datetime

# 地区映射字典 - 基于地址和国家信息进行智能映射
REGION_MAPPING = {
    # 北美
    'usa': ['united states', 'usa', 'us', 'america'],
    'can': ['canada', 'canadian'],
    
    # 欧洲
    'eur': [
        'austria', 'belgium', 'bulgaria', 'croatia', 'cyprus', 'czech', 'denmark', 
        'estonia', 'finland', 'france', 'germany', 'greece', 'hungary', 'ireland', 
        'italy', 'latvia', 'lithuania', 'luxembourg', 'malta', 'netherlands', 
        'poland', 'portugal', 'romania', 'slovakia', 'slovenia', 'spain', 'sweden',
        'united kingdom', 'uk', 'britain', 'england', 'scotland', 'wales',
        'switzerland', 'norway', 'iceland', 'serbia', 'albania', 'montenegro',
        'macedonia', 'bosnia', 'kosovo', 'ukraine', 'belarus', 'moldova'
    ],
    
    # 亚洲
    'as': [
        'china', 'japan', 'korea', 'taiwan', 'hong kong', 'singapore', 'malaysia',
        'thailand', 'vietnam', 'philippines', 'indonesia', 'india', 'pakistan',
        'bangladesh', 'sri lanka', 'nepal', 'myanmar', 'cambodia', 'laos',
        'brunei', 'mongolia', 'kazakhstan', 'uzbekistan', 'kyrgyzstan', 'tajikistan',
        'turkmenistan', 'afghanistan', 'iran', 'iraq', 'turkey', 'syria', 'lebanon',
        'jordan', 'palestine', 'israel', 'cyprus', 'georgia', 'armenia', 'azerbaijan'
    ],
    
    # 中东
    'mid-e': [
        'saudi arabia', 'uae', 'emirates', 'qatar', 'kuwait', 'bahrain', 'oman',
        'yemen', 'iran', 'iraq', 'israel', 'palestine', 'jordan', 'lebanon',
        'syria', 'turkey', 'egypt'
    ],
    
    # 非洲
    'af': [
        'south africa', 'egypt', 'nigeria', 'kenya', 'ghana', 'morocco', 'algeria',
        'tunisia', 'libya', 'sudan', 'ethiopia', 'uganda', 'tanzania', 'zambia',
        'zimbabwe', 'botswana', 'namibia', 'angola', 'mozambique', 'madagascar',
        'mauritius', 'senegal', 'ivory coast', 'burkina faso', 'mali', 'niger',
        'chad', 'cameroon', 'gabon', 'congo', 'drc', 'rwanda', 'burundi',
        'malawi', 'lesotho', 'swaziland', 'gambia', 'guinea', 'sierra leone',
        'liberia', 'togo', 'benin', 'central african republic', 'equatorial guinea',
        'djibouti', 'eritrea', 'somalia', 'comoros', 'seychelles', 'cabo verde'
    ],
    
    # 拉美
    'lat-a': [
        'brazil', 'argentina', 'chile', 'peru', 'colombia', 'venezuela', 'ecuador',
        'bolivia', 'paraguay', 'uruguay', 'guyana', 'suriname', 'french guiana',
        'mexico', 'guatemala', 'belize', 'honduras', 'el salvador', 'nicaragua',
        'costa rica', 'panama', 'cuba', 'jamaica', 'haiti', 'dominican republic',
        'puerto rico', 'trinidad', 'barbados', 'grenada', 'saint lucia',
        'saint vincent', 'dominica', 'antigua', 'saint kitts', 'bahamas'
    ],
    
    # 澳新
    'aus-nzl': ['australia', 'new zealand', 'fiji', 'papua new guinea', 'vanuatu', 'solomon islands']
}

def get_region_from_address(address, country_state=None, full_country_name=None):
    """基于地址信息智能判断地区"""
    
    # 合并所有地址相关信息
    text_to_check = []
    if address:
        text_to_check.append(address.lower())
    if country_state:
        text_to_check.append(country_state.lower())
    if full_country_name:
        text_to_check.append(full_country_name.lower())
    
    combined_text = ' '.join(text_to_check)
    
    # 检查每个地区的关键词
    for region, keywords in REGION_MAPPING.items():
        for keyword in keywords:
            if keyword in combined_text:
                return region
    
    # 特殊处理一些明显的地址模式
    if any(keyword in combined_text for keyword in ['nairobi', 'kenya']):
        return 'af'
    if any(keyword in combined_text for keyword in ['accra', 'ghana']):
        return 'af'
    if any(keyword in combined_text for keyword in ['lagos', 'nigeria']):
        return 'af'
    if any(keyword in combined_text for keyword in ['tripoli', 'libya']):
        return 'af'
    if any(keyword in combined_text for keyword in ['windhoek', 'namibia']):
        return 'af'
    if any(keyword in combined_text for keyword in ['kinshasa', 'congo']):
        return 'af'
    
    # 默认返回unknown，后续可以手动处理
    return 'unknown'

def get_region_display_name(region_code):
    """获取地区显示名称"""
    region_names = {
        'usa': '美国',
        'can': '加拿大', 
        'eur': '欧洲',
        'aus-nzl': '澳新',
        'as': '亚洲',
        'lat-a': '拉美',
        'mid-e': '中东',
        'af': '非洲'
    }
    return region_names.get(region_code, region_code)

def extract_distributor_data():
    """从数据库提取分销商数据"""
    
    try:
        # 连接数据库
        conn = sqlite3.connect('unifi_distributors.db')
        cursor = conn.cursor()
        
        # 查询所有活跃的分销商 - 直接使用数据库中已正确映射的地区信息
        query = '''
        SELECT 
            d.id,
            d.partner_type,
            d.address,
            d.latitude,
            d.longitude,
            d.phone,
            d.contact_email,
            d.region,
            d.country_state,
            d.full_country_name,
            d.city,
            d.unifi_id,
            c.name as company_name,
            c.website_url
        FROM distributors d
        LEFT JOIN companies c ON d.company_id = c.id
        WHERE d.is_active = 1
        ORDER BY d.id
        '''
        
        cursor.execute(query)
        distributors = cursor.fetchall()
        
        print(f"找到 {len(distributors)} 个活跃分销商")
        
        # 统计数据 - 使用数据库中已正确的地区信息
        region_stats = {}
        processed_distributors = []
        
        for row in distributors:
            (dist_id, partner_type, address, latitude, longitude, phone, contact_email,
             region, country_state, full_country_name, city, unifi_id,
             company_name, website_url) = row
            
            # 直接使用数据库中的地区信息（已经正确）
            if region not in region_stats:
                region_stats[region] = {
                    'count': 0,
                    'master': 0,
                    'simple': 0,
                    'coordinates': [],
                    'locations': []
                }
            
            region_stats[region]['count'] += 1
            
            if partner_type == 'master':
                region_stats[region]['master'] += 1
            else:
                region_stats[region]['simple'] += 1
            
            # 添加坐标信息
            if latitude and longitude:
                region_stats[region]['coordinates'].append({
                    'lat': float(latitude),
                    'lng': float(longitude)
                })
            
            # 添加位置信息（使用country_state作为主要标识）
            location_name = country_state or city or full_country_name or "未知位置"
            found_location = False
            for loc in region_stats[region]['locations']:
                if loc['name'] == location_name:
                    loc['count'] += 1
                    found_location = True
                    break
            
            if not found_location:
                region_stats[region]['locations'].append({
                    'name': location_name,
                    'count': 1
                })
            
            # 添加到处理列表
            processed_distributors.append({
                'id': dist_id,
                'company_name': company_name,
                'partner_type': partner_type,
                'address': address,
                'region': region,
                'latitude': latitude,
                'longitude': longitude,
                'phone': phone,
                'email': contact_email,
                'unifi_id': unifi_id,
                'website': website_url
            })
        
        # 计算地区中心坐标
        for region, stats in region_stats.items():
            if stats['coordinates']:
                avg_lat = sum(coord['lat'] for coord in stats['coordinates']) / len(stats['coordinates'])
                avg_lng = sum(coord['lng'] for coord in stats['coordinates']) / len(stats['coordinates'])
                stats['center_coordinates'] = [avg_lng, avg_lat]
            else:
                # 使用默认坐标
                default_coords = {
                    'usa': [-95.7129, 37.0902],
                    'can': [-106.3468, 56.1304],
                    'eur': [10.4515, 51.1657],
                    'aus-nzl': [133.7751, -25.2744],
                    'as': [100.6197, 34.0479],
                    'lat-a': [-58.3816, -14.2350],
                    'mid-e': [51.1839, 35.6892],
                    'af': [20.0000, 0.0000],
                    'unknown': [0.0, 0.0]
                }
                stats['center_coordinates'] = default_coords.get(region, [0.0, 0.0])
        
        # 按国家统计数据
        country_stats = {}
        cursor.execute('''
        SELECT 
            country_state,
            full_country_name,
            region,
            COUNT(*) as count,
            AVG(latitude) as avg_lat,
            AVG(longitude) as avg_lng,
            SUM(CASE WHEN partner_type = 'master' THEN 1 ELSE 0 END) as masters,
            SUM(CASE WHEN partner_type != 'master' THEN 1 ELSE 0 END) as resellers
        FROM distributors 
        WHERE is_active = 1 AND latitude IS NOT NULL AND longitude IS NOT NULL
        GROUP BY country_state, full_country_name, region
        ORDER BY count DESC
        ''')
        
        country_results = cursor.fetchall()
        for country_state, full_country_name, region, count, avg_lat, avg_lng, masters, resellers in country_results:
            country_name = full_country_name or country_state or "未知国家"
            country_key = country_state or country_name
            
            country_stats[country_key] = {
                'name': country_name,
                'code': country_state,
                'region': region,
                'count': count,
                'coordinates': [float(avg_lng), float(avg_lat)],
                'masters': masters,
                'resellers': resellers,
                'growth': round(count * 0.12 + 3, 1),  # 模拟增长率
                'lastUpdated': datetime.now().isoformat()
            }

        # 生成前端需要的数据格式
        frontend_data = {
            'success': True,
            'data': {
                'totalCount': len(distributors),
                'activeCount': len(distributors),
                'masterDistributors': sum(1 for d in processed_distributors if d['partner_type'] == 'master'),
                'authorizedResellers': sum(1 for d in processed_distributors if d['partner_type'] != 'master'),
                'regions': {},
                'countries': country_stats,
                'topCountries': []
            },
            'timestamp': datetime.now().isoformat()
        }
        
        # 构建地区数据
        for region, stats in region_stats.items():
            if region != 'unknown':  # 跳过未知地区
                frontend_data['data']['regions'][region] = {
                    'name': get_region_display_name(region),
                    'code': region,
                    'count': stats['count'],
                    'coordinates': stats['center_coordinates'],
                    'growth': round(stats['count'] * 0.1 + 5, 1),  # 模拟增长率
                    'lastUpdated': datetime.now().isoformat()
                }
        
        # 构建顶级国家/地区列表
        all_locations = []
        for region, stats in region_stats.items():
            if region != 'unknown':
                for location in stats['locations']:
                    all_locations.append({
                        'name': location['name'],
                        'count': location['count'],
                        'region': region,
                        'growth': round(location['count'] * 0.15 + 2, 1)
                    })
        
        # 按数量排序并取前10
        all_locations.sort(key=lambda x: x['count'], reverse=True)
        frontend_data['data']['topCountries'] = all_locations[:10]
        
        # 保存到JSON文件
        output_file = 'frontend/public/data/distributors.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(frontend_data, f, ensure_ascii=False, indent=2)
        
        print(f"数据已保存到: {output_file}")
        
        # 打印统计信息
        print("\n地区分布统计:")
        for region, stats in region_stats.items():
            display_name = get_region_display_name(region)
            print(f"{display_name} ({region}): {stats['count']} 个分销商")
        
        print(f"\n总计: {len(distributors)} 个分销商")
        print(f"主要分销商: {frontend_data['data']['masterDistributors']} 个")
        print(f"授权经销商: {frontend_data['data']['authorizedResellers']} 个")
        
        # 打印前端数据格式预览
        print(f"\n前端地区数据预览:")
        for region_code, region_data in frontend_data['data']['regions'].items():
            print(f"  {region_data['name']} ({region_code}): {region_data['count']} 个, 坐标 {region_data['coordinates']}")
        
        return frontend_data
        
        conn.close()
        return frontend_data
        
    except Exception as e:
        print(f"提取数据时出错: {e}")
        return None

if __name__ == "__main__":
    extract_distributor_data()