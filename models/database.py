from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Index
from sqlalchemy.types import Numeric
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Company(Base):
    __tablename__ = 'companies'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)
    website_url = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    distributors = relationship("Distributor", back_populates="company", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_company_name', 'name'),
    )
    
    def __repr__(self):
        return f"<Company(id={self.id}, name='{self.name}')>"

class Distributor(Base):
    __tablename__ = 'distributors'
    
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    partner_type = Column(String(20), nullable=False)  # 'master' or 'simple'
    address = Column(Text, nullable=False)
    latitude = Column(Numeric(10, 8))
    longitude = Column(Numeric(11, 8))
    phone = Column(String(50))
    contact_email = Column(String(255))
    region = Column(String(10))
    country_state = Column(String(10))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # JSON API enhanced fields
    unifi_id = Column(Integer, unique=True)  # Official Unifi ID
    last_modified_at = Column(DateTime)  # Last modification time from API
    order_weight = Column(Integer)  # Sorting/importance weight
    logo_url = Column(Text)  # Company logo URL
    sunmax_partner = Column(Boolean, default=False)  # SunMax partnership status
    data_source = Column(String(20), default="json_api")  # Data source tracking
    scraped_at = Column(DateTime)  # When data was scraped
    
    # Notion integration fields
    notion_page_id = Column(Text)  # Store Notion page ID for direct access
    notion_last_sync = Column(DateTime)  # Last successful sync to Notion
    notion_sync_status = Column(String(20), default="pending")  # pending, synced, error
    
    # Relationships
    company = relationship("Company", back_populates="distributors")
    changes = relationship("ChangeHistory", back_populates="distributor", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_distributor_company', 'company_id'),
        Index('idx_distributor_region', 'region'),
        Index('idx_distributor_type', 'partner_type'),
        Index('idx_distributor_active', 'is_active'),
        Index('idx_distributor_location', 'latitude', 'longitude'),
        Index('idx_unifi_id_unique', 'unifi_id'),
        Index('idx_last_modified', 'last_modified_at'),
        Index('idx_order_weight', 'order_weight'),
        Index('idx_data_source', 'data_source'),
        Index('idx_scraped_at', 'scraped_at'),
        Index('idx_sunmax_partner', 'sunmax_partner'),
        Index('idx_notion_page_id', 'notion_page_id'),
        Index('idx_notion_sync_status', 'notion_sync_status'),
        Index('idx_notion_last_sync', 'notion_last_sync'),
    )
    
    def __repr__(self):
        return f"<Distributor(id={self.id}, unifi_id={self.unifi_id}, company_id={self.company_id}, type='{self.partner_type}')>"

class ChangeHistory(Base):
    __tablename__ = 'change_history'
    
    id = Column(Integer, primary_key=True)
    distributor_id = Column(Integer, ForeignKey('distributors.id'), nullable=True)
    change_type = Column(String(20), nullable=False)  # 'created', 'updated', 'deleted'
    old_data = Column(Text)  # JSON string
    new_data = Column(Text)  # JSON string
    detected_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    distributor = relationship("Distributor", back_populates="changes")
    
    # Indexes
    __table_args__ = (
        Index('idx_change_distributor', 'distributor_id'),
        Index('idx_change_type', 'change_type'),
        Index('idx_change_date', 'detected_at'),
    )
    
    def __repr__(self):
        return f"<ChangeHistory(id={self.id}, type='{self.change_type}', detected_at={self.detected_at})>"