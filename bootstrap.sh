#!/bin/bash

echo "🚀 DeerFlow - Bootstrap Setup + Start"
echo "===================================="

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

# Function to setup environment
setup_env() {
    echo "⚙️ Setting up environment..."
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            echo "📄 Creating .env from .env.example..."
            cp .env.example .env
        else
            echo "⚠️ No .env.example found. You may need to create .env manually."
        fi
    else
        echo "✅ .env already exists"
    fi
    
    # Check if web/.env exists
    if [ ! -f "web/.env" ]; then
        echo "⚠️  web/.env not found!"
        echo "📄 Please configure your environment:"
        echo "   1. Copy the template: cp env.example web/.env"
        echo "   2. Edit web/.env with your Supabase credentials"
        echo "   3. Run this script again"
        echo ""
        echo "🔒 For security, credentials are not hardcoded in scripts."
        exit 1
    else
        echo "✅ web/.env already exists"
        
        # Validate required environment variables
        if ! grep -q "NEXT_PUBLIC_SUPABASE_URL.*supabase.co" web/.env || \
           ! grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY.*eyJ" web/.env; then
            echo "⚠️  web/.env seems incomplete. Please check:"
            echo "   - NEXT_PUBLIC_SUPABASE_URL should be a valid Supabase URL"
            echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY should be a valid JWT token"
            echo ""
            echo "📖 See env.example for template"
            exit 1
        fi
    fi
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
    echo "🚀 Starting DeerFlow services..."
    echo "   Backend: http://localhost:8005"
    echo "   Frontend: http://localhost:4000"
    echo ""
    
    # Start backend in background
    echo "🚀 Starting backend..."
    uv run server.py &
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

# Main execution
echo ""

# Install dependencies
install_deps
echo ""

# Setup environment
setup_env
echo ""

# Kill existing processes
kill_existing
echo ""

# Start services
start_services

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
echo "📋 Test login with your Supabase credentials"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID 