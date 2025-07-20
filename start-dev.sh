#!/bin/bash

echo "🚀 DeerFlow Development Mode"
echo "============================="
echo ""
echo "Starting both services in development mode..."
echo "   Backend: http://localhost:8005"
echo "   Frontend: http://localhost:4000"
echo ""

# Start backend in background
echo "🚀 Starting backend..."
uv run server.py --reload &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend in background
echo "🚀 Starting frontend..."
cd web
pnpm dev &
FRONTEND_PID=$!

# Wait for both processes and handle cleanup
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    pkill -f "server.py" 2>/dev/null
    pkill -f "next dev" 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo "✅ Both services are running!"
echo "   Backend: http://localhost:8005"
echo "   Frontend: http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID