#!/bin/bash

echo "🚀 Starting Ubiquiti Channel Intelligence Development Server"
echo "📍 Project: Ubiquiti 渠道情报分析平台"
echo "🌐 Technology Stack: Vue.js 3 + TailwindCSS + Chart.js"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🔥 Starting development server..."
echo "🌍 Local: http://localhost:3000"
echo "📱 To access from other devices: npm run dev -- --host"
echo ""

npm run dev