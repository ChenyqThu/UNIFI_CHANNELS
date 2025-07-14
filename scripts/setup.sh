#!/bin/bash

# Unifi Distributor Tracking System - Setup Script

set -e

echo "🚀 Setting up Unifi Distributor Tracking System..."

# Check if Python 3.11+ is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "✅ Python version: $PYTHON_VERSION"

# Check if we have the minimum required Python version
if ! python3 -c 'import sys; exit(0 if sys.version_info >= (3, 11) else 1)' 2>/dev/null; then
    echo "⚠️  Python 3.11+ is recommended. Current version: $PYTHON_VERSION"
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📥 Installing requirements..."
pip install -r requirements.txt

# Create .env file from example if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration"
fi

# Create logs directory
if [ ! -d "logs" ]; then
    echo "📁 Creating logs directory..."
    mkdir logs
fi

# Initialize database
echo "🗄️  Initializing database..."
python -m cli init

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Run 'python -m cli scrape' to scrape initial data"
echo "3. Run 'python -m api.main' to start the API server"
echo "4. Run 'python -m scheduler' to start the scheduler"
echo ""
echo "🔗 API Documentation will be available at: http://localhost:8000/docs"