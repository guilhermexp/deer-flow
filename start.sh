#!/bin/bash

echo "🚀 DeerFlow - Complete Application Startup"
echo "=========================================="

# Function to show usage
show_help() {
    echo ""
    echo "Usage: ./start.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --install       Install dependencies before starting"
    echo "  --reload        Start backend with auto-reload"
    echo "  --restart       Kill existing processes before starting"
    echo "  --help, -h      Show this help message"
    echo ""
    echo "Default behavior: Start both backend and frontend services"
    echo "   Backend: http://localhost:8005"
    echo "   Frontend: http://localhost:4000"
    echo ""
}

# Function to install dependencies
install_deps() {
    echo "📦 Installing dependencies..."
    echo "📦 Installing backend dependencies..."
    uv sync
    
    echo "📦 Installing frontend dependencies..."
    cd web
    pnpm install
    cd ..
    echo "✅ Dependencies installed"
}

# Function to kill existing processes
kill_existing() {
    echo "🛑 Stopping existing services..."
    pkill -f "server.py" 2>/dev/null
    pkill -f "next dev" 2>/dev/null
    sleep 2
    echo "✅ Existing services stopped"
}

# Function to start services
start_services() {
    local reload_flag=""
    if [ "$1" = "--with-reload" ]; then
        reload_flag="--reload"
        echo "🚀 Starting backend with auto-reload..."
    else
        echo "🚀 Starting backend..."
    fi
    
    # Start backend in background
    uv run server.py $reload_flag &
    BACKEND_PID=$!
    
    # Wait for backend to start
    sleep 5
    
    # Start frontend in background
    echo "🚀 Starting frontend..."
    cd web
    pnpm dev &
    FRONTEND_PID=$!
    cd ..
    
    return 0
}

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    pkill -f "server.py" 2>/dev/null
    pkill -f "next dev" 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Parse command line arguments
INSTALL_DEPS=false
RELOAD_MODE=false
RESTART_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --install)
            INSTALL_DEPS=true
            shift
            ;;
        --reload)
            RELOAD_MODE=true
            shift
            ;;
        --restart)
            RESTART_MODE=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
echo ""

# Install dependencies if requested
if [ "$INSTALL_DEPS" = true ]; then
    install_deps
    echo ""
fi

# Kill existing processes if restart mode or if processes are detected
if [ "$RESTART_MODE" = true ] || pgrep -f "server.py\|next dev" > /dev/null; then
    kill_existing
    echo ""
fi

# Start services
echo "🚀 Starting DeerFlow services..."
echo "   Backend: http://localhost:8005"
echo "   Frontend: http://localhost:4000"
echo ""

if [ "$RELOAD_MODE" = true ]; then
    start_services "--with-reload"
else
    start_services
fi

# Wait a moment and check if services started successfully
sleep 3

# Check if processes are still running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start"
    cleanup
    exit 1
fi

if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Frontend failed to start"
    cleanup
    exit 1
fi

echo "✅ Both services are running!"
echo "   Backend: http://localhost:8005"
echo "   Frontend: http://localhost:4000"
echo ""
echo "📋 Test login:"
echo "   Username: testuser"
echo "   Password: test123"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID