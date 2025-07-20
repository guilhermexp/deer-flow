#\!/bin/bash

echo "🔄 Restarting DeerFlow services..."

# Kill existing processes
echo "🛑 Stopping existing services..."
pkill -f "server.py"
pkill -f "next dev"

sleep 2

echo "🚀 Starting backend..."
cd /Users/guilhermevarela/Public/FlowDeep/Deep-flow
uv run server.py &

sleep 5

echo "🚀 Starting frontend..."
cd /Users/guilhermevarela/Public/FlowDeep/Deep-flow/web
pnpm dev --port 4000 &

echo "✅ Services restarted\!"
echo "   Backend: http://localhost:8005"
echo "   Frontend: http://localhost:4000"
echo ""
echo "📋 Test login:"
echo "   Username: testuser"
echo "   Password: test123"
EOF < /dev/null