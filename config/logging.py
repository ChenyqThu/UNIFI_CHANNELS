import logging
import logging.handlers
import os
from datetime import datetime
from config.settings import settings

def setup_logging():
    """Setup logging configuration"""
    # Create logs directory if it doesn't exist
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # Configure log format
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    date_format = '%Y-%m-%d %H:%M:%S'
    
    # Create formatter
    formatter = logging.Formatter(log_format, date_format)
    
    # File handler with rotation
    file_handler = logging.handlers.RotatingFileHandler(
        filename=os.path.join(log_dir, 'unifi_tracker.log'),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setFormatter(formatter)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    
    # Error file handler
    error_handler = logging.handlers.RotatingFileHandler(
        filename=os.path.join(log_dir, 'errors.log'),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    error_handler.setFormatter(formatter)
    error_handler.setLevel(logging.ERROR)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.log_level.upper()))
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Add handlers
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(error_handler)
    
    # Configure specific loggers
    configure_specific_loggers()
    
    # Log startup message
    logging.info(f"Logging initialized - Level: {settings.log_level}")
    
    return root_logger

def configure_specific_loggers():
    """Configure specific loggers for different modules"""
    
    # Reduce noise from third-party libraries
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('requests').setLevel(logging.WARNING)
    logging.getLogger('selenium').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    
    # Application specific loggers
    app_logger = logging.getLogger('unifi_tracker')
    app_logger.setLevel(logging.INFO)
    
    scraper_logger = logging.getLogger('unifi_tracker.scraper')
    scraper_logger.setLevel(logging.INFO)
    
    notion_logger = logging.getLogger('unifi_tracker.notion')
    notion_logger.setLevel(logging.INFO)
    
    api_logger = logging.getLogger('unifi_tracker.api')
    api_logger.setLevel(logging.INFO)

def get_logger(name: str) -> logging.Logger:
    """Get logger with specified name"""
    return logging.getLogger(f"unifi_tracker.{name}")

class LoggerMixin:
    """Mixin class to add logger to any class"""
    
    @property
    def logger(self) -> logging.Logger:
        """Get logger for this class"""
        return get_logger(self.__class__.__name__.lower())