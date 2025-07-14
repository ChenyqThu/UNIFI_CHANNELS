#!/usr/bin/env python3
"""
Notion Research Fields Mapping Configuration
用于AI调研结果的Notion字段映射配置
"""

from datetime import datetime
from typing import Dict, Any, Optional

class NotionResearchFieldsMapping:
    """Notion调研字段映射配置类"""
    
    # AI调研相关的Notion字段定义
    RESEARCH_FIELDS = {
        # 分析状态和优先级
        "Analysis Status": {
            "type": "select",
            "options": ["Not Analyzed", "In Progress", "Completed"],
            "mapping_key": "analysis_status"
        },
        "Priority": {
            "type": "select", 
            "options": ["High", "Medium", "Low"],
            "mapping_key": "priority"
        },
        
        # 转化相关评分（数值字段）
        "Conversion Potential": {
            "type": "number",
            "range": [1, 10],
            "mapping_key": "conversion_potential",
            "description": "转化潜力评分"
        },
        "Overall Score": {
            "type": "number",
            "range": [1, 10], 
            "mapping_key": "overall_score",
            "description": "综合评分"
        },
        
        # 业务匹配度评估
        "Business Alignment": {
            "type": "select",
            "options": ["High", "Medium", "Low"],
            "mapping_key": "business_alignment"
        },
        "Conversion Difficulty": {
            "type": "select",
            "options": ["Easy", "Medium", "Hard"],
            "mapping_key": "conversion_difficulty"
        },
        
        # 战略分类
        "Strategic Priority": {
            "type": "select",
            "options": ["A", "B", "C"],
            "mapping_key": "strategic_priority"
        },
        "Recommended Action": {
            "type": "select",
            "options": ["Immediate Contact", "Observe", "Hold"],
            "mapping_key": "recommended_action"
        },
        
        # 时间字段
        "Research Date": {
            "type": "date",
            "mapping_key": "research_date"
        },
        "Last Research": {
            "type": "date", 
            "mapping_key": "last_research_date"
        },
        
        # 文本字段
        "Research Notes": {
            "type": "rich_text",
            "mapping_key": "research_notes",
            "description": "AI调研详细报告"
        },
        "Analyst": {
            "type": "rich_text",
            "mapping_key": "analyst",
            "description": "分析师标识"
        }
    }
    
    # 维度评分字段（可选扩展字段）
    DIMENSIONAL_SCORE_FIELDS = {
        "Channel Foundation Score": {
            "type": "number",
            "range": [1, 10],
            "mapping_key": "channel_foundation"
        },
        "Business Alignment Score": {
            "type": "number", 
            "range": [1, 10],
            "mapping_key": "business_alignment_score"
        },
        "Market Opportunity Score": {
            "type": "number",
            "range": [1, 10], 
            "mapping_key": "market_opportunities"
        },
        "Conversion Feasibility Score": {
            "type": "number",
            "range": [1, 10],
            "mapping_key": "conversion_feasibility"
        }
    }
    
    @classmethod
    def build_notion_properties(cls, research_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        将AI调研结果转换为Notion页面属性格式
        
        Args:
            research_data: AI调研结果JSON数据
            
        Returns:
            Notion页面属性字典
        """
        properties = {}
        
        # 处理page_properties部分
        page_props = research_data.get("page_properties", {})
        
        for field_name, field_config in cls.RESEARCH_FIELDS.items():
            mapping_key = field_config["mapping_key"]
            field_type = field_config["type"]
            
            if mapping_key in page_props:
                value = page_props[mapping_key]
                
                if field_type == "select":
                    properties[field_name] = {
                        "select": {"name": str(value)}
                    }
                elif field_type == "number":
                    properties[field_name] = {
                        "number": float(value)
                    }
                elif field_type == "date":
                    if isinstance(value, str):
                        properties[field_name] = {
                            "date": {"start": value}
                        }
                    else:
                        properties[field_name] = {
                            "date": {"start": datetime.now().isoformat()[:10]}
                        }
                elif field_type == "rich_text":
                    properties[field_name] = {
                        "rich_text": [{"text": {"content": str(value)}}]
                    }
        
        return properties
    
    @classmethod
    def build_research_content(cls, research_data: Dict[str, Any]) -> str:
        """
        构建调研报告的正文内容
        
        Args:
            research_data: AI调研结果JSON数据
            
        Returns:
            格式化的调研报告正文
        """
        content_parts = []
        
        # 维度评分摘要
        dimensional_scores = research_data.get("dimensional_scores", {})
        if dimensional_scores:
            content_parts.append("## 📊 维度评分分析")
            for dimension, score in dimensional_scores.items():
                dimension_name = cls._get_dimension_display_name(dimension)
                content_parts.append(f"- **{dimension_name}**: {score}/10")
            content_parts.append("")
        
        # SWOT分析
        key_insights = research_data.get("key_insights", {})
        if key_insights:
            content_parts.append("## 🎯 SWOT分析")
            
            strengths = key_insights.get("strengths", [])
            if strengths:
                content_parts.append("### ✅ 优势 (Strengths)")
                for strength in strengths:
                    content_parts.append(f"- {strength}")
                content_parts.append("")
            
            weaknesses = key_insights.get("weaknesses", [])
            if weaknesses:
                content_parts.append("### ⚠️ 劣势 (Weaknesses)")
                for weakness in weaknesses:
                    content_parts.append(f"- {weakness}")
                content_parts.append("")
            
            opportunities = key_insights.get("opportunities", [])
            if opportunities:
                content_parts.append("### 🚀 机会 (Opportunities)")
                for opportunity in opportunities:
                    content_parts.append(f"- {opportunity}")
                content_parts.append("")
            
            threats = key_insights.get("threats", [])
            if threats:
                content_parts.append("### 🚨 威胁 (Threats)")
                for threat in threats:
                    content_parts.append(f"- {threat}")
                content_parts.append("")
        
        # 转化策略
        conversion_strategy = research_data.get("conversion_strategy", {})
        if conversion_strategy:
            content_parts.append("## 🎯 转化策略建议")
            
            if "contact_approach" in conversion_strategy:
                content_parts.append(f"**接触方式**: {conversion_strategy['contact_approach']}")
            
            if "value_proposition" in conversion_strategy:
                content_parts.append(f"**价值主张**: {conversion_strategy['value_proposition']}")
            
            if "cooperation_model" in conversion_strategy:
                content_parts.append(f"**合作模式**: {conversion_strategy['cooperation_model']}")
            
            if "timeline" in conversion_strategy:
                content_parts.append(f"**预期时间**: {conversion_strategy['timeline']}")
            
            success_metrics = conversion_strategy.get("success_metrics", [])
            if success_metrics:
                content_parts.append("**成功指标**:")
                for metric in success_metrics:
                    content_parts.append(f"- {metric}")
        
        # 添加生成时间戳
        content_parts.append("")
        content_parts.append("---")
        content_parts.append(f"*AI调研报告生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*")
        
        return "\n".join(content_parts)
    
    @classmethod
    def _get_dimension_display_name(cls, dimension_key: str) -> str:
        """获取维度的显示名称"""
        dimension_names = {
            "channel_foundation": "渠道基础实力",
            "business_alignment": "业务契合度", 
            "competitive_relationship": "竞争关系状态",
            "market_opportunities": "市场机会潜力",
            "channel_capabilities": "渠道能力匹配",
            "conversion_feasibility": "转化可行性"
        }
        return dimension_names.get(dimension_key, dimension_key.replace("_", " ").title())

    @classmethod
    def validate_research_data(cls, research_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        验证调研数据格式和数值范围
        
        Args:
            research_data: AI调研结果
            
        Returns:
            验证结果和错误信息
        """
        errors = []
        warnings = []
        
        # 验证必需字段
        required_sections = ["page_properties", "dimensional_scores", "key_insights"]
        for section in required_sections:
            if section not in research_data:
                errors.append(f"Missing required section: {section}")
        
        # 验证page_properties中的数值范围
        page_props = research_data.get("page_properties", {})
        for field_name, field_config in cls.RESEARCH_FIELDS.items():
            mapping_key = field_config["mapping_key"]
            if mapping_key in page_props and field_config["type"] == "number":
                value = page_props[mapping_key]
                field_range = field_config.get("range", [1, 10])
                if not (field_range[0] <= value <= field_range[1]):
                    errors.append(f"{field_name} value {value} out of range {field_range}")
        
        # 验证选择字段的选项
        for field_name, field_config in cls.RESEARCH_FIELDS.items():
            mapping_key = field_config["mapping_key"]
            if mapping_key in page_props and field_config["type"] == "select":
                value = page_props[mapping_key]
                valid_options = field_config["options"]
                if value not in valid_options:
                    errors.append(f"{field_name} value '{value}' not in valid options: {valid_options}")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }

# 使用示例
if __name__ == "__main__":
    # 示例调研数据
    sample_research_data = {
        "page_properties": {
            "analysis_status": "Completed",
            "priority": "High",
            "conversion_potential": 8.5,
            "business_alignment": "High",
            "conversion_difficulty": "Medium",
            "strategic_priority": "A",
            "recommended_action": "Immediate Contact",
            "overall_score": 8.2,
            "research_date": "2024-01-15",
            "analyst": "AI Research System"
        },
        "dimensional_scores": {
            "channel_foundation": 8.0,
            "business_alignment": 8.5,
            "competitive_relationship": 6.5,
            "market_opportunities": 7.8,
            "channel_capabilities": 8.2,
            "conversion_feasibility": 7.5
        },
        "key_insights": {
            "strengths": ["Strong enterprise client base", "Multi-brand operation experience"],
            "weaknesses": ["High dependency on Ubiquiti"],
            "opportunities": ["Price-sensitive market segment"],
            "threats": ["Existing contract constraints"]
        },
        "conversion_strategy": {
            "contact_approach": "Direct sales team engagement",
            "value_proposition": "15-20% better profit margins",
            "cooperation_model": "Parallel operation",
            "timeline": "3-6 months",
            "success_metrics": ["Monthly Omada sales target"]
        }
    }
    
    # 验证数据
    validation = NotionResearchFieldsMapping.validate_research_data(sample_research_data)
    print("Validation Result:", validation)
    
    # 生成Notion属性
    properties = NotionResearchFieldsMapping.build_notion_properties(sample_research_data)
    print("\nNotion Properties:")
    for key, value in properties.items():
        print(f"  {key}: {value}")
    
    # 生成报告内容
    content = NotionResearchFieldsMapping.build_research_content(sample_research_data)
    print("\nReport Content:")
    print(content)