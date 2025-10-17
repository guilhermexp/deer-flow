#!/bin/bash

echo "🚀 DeerFlow - Development Mode"
echo "=============================="

# Function to kill existing processes
kill_existing() {
    echo "🛑 Stopping existing services..."
    pkill -f "server.py" 2>/dev/null
    pkill -f "next dev" 2>/dev/null
    sleep 2
    echo "✅ Existing services stopped"
}

# Function to start services in development mode
start_dev_services() {
    echo "🚀 Starting DeerFlow in development mode..."
    echo "   Backend: http://localhost:8005 (with auto-reload)"
    echo "   Frontend: http://localhost:4000 (with hot-reload)"
    echo ""
    
    # Start backend with auto-reload in background
    echo "🚀 Starting backend with auto-reload..."
    uv run server.py --reload &
    BACKEND_PID=$!
    
    # Wait for backend to start
    sleep 5
    
    # Start frontend with hot-reload in background
    echo "🚀 Starting frontend with hot-reload..."
    cd web
    pnpm dev &
    FRONTEND_PID=$!
    cd ..
    
    return 0
}

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping development services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    pkill -f "server.py" 2>/dev/null
    pkill -f "next dev" 2>/dev/null
    echo "✅ Development services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if environment is set up
echo "🔍 Checking environment setup..."

if [ ! -f "web/.env" ]; then
    echo "⚠️ web/.env not found! Run ./bootstrap.sh first to setup the environment."
    exit 1
fi

echo "✅ Environment configured"
echo ""

# Kill existing processes if any
if pgrep -f "server.py\|next dev" > /dev/null; then
    kill_existing
    echo ""
fi

# Start development services
start_dev_services

# Wait a moment and check if services started successfully
sleep 3

# Check if processes are still running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start"
    echo "💡 Try running: uv run server.py --reload"
    cleanup
    exit 1
fi

if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Frontend failed to start"
    echo "💡 Try running: cd web && pnpm dev"
    cleanup
    exit 1
fi

echo "✅ Development services are running!"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://localhost:4000"
echo "   Backend API: http://localhost:8005"
echo ""
echo "🔄 Features enabled:"
echo "   - Backend auto-reload on file changes"
echo "   - Frontend hot-reload on file changes"
echo "   - TypeScript type checking"
echo ""
echo "📋 Test login with your Clerk credentials"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID 