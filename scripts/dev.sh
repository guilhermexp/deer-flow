#!/bin/bash

# Deer Flow Development Script
# Start both frontend and backend together

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    🦌 DEER FLOW DEV SERVER                   ║"
    echo "║                   Frontend + Backend Together                 ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Function to cleanup on exit
cleanup() {
    print_status "Shutting down servers..."
    jobs -p | xargs -r kill
    print_status "All servers stopped"
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup SIGINT SIGTERM

# Check if we're in the right directory
if [ ! -f "pyproject.toml" ] || [ ! -d "web" ]; then
    print_error "Please run this script from the deer-flow root directory"
    exit 1
fi

print_header

# Check dependencies
print_status "Checking dependencies..."

# Check Python/UV
if ! command -v uv &> /dev/null; then
    print_error "uv is not installed. Please install it first."
    exit 1
fi

# Check Node.js/PNPM
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install it first."
    exit 1
fi

# Install dependencies if needed
print_status "Installing dependencies..."
if [ ! -d "web/node_modules" ]; then
    print_status "Installing frontend dependencies..."
    cd web && pnpm install && cd ..
fi

if [ ! -d ".venv" ]; then
    print_status "Installing backend dependencies..."
    uv pip install -e ".[dev]"
fi

# Create logs directory
mkdir -p logs

print_status "Starting development servers..."
print_status "Frontend: ${CYAN}http://localhost:4000${NC}"
print_status "Backend:  ${CYAN}http://localhost:8000${NC}"
print_warning "Press Ctrl+C to stop both servers"
echo ""

# Start frontend in background
print_status "Starting frontend server..."
cd web
pnpm dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 3

# Start backend in background
print_status "Starting backend server..."
uv run server.py --reload > logs/backend.log 2>&1 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

print_status "✅ Both servers are running!"
print_status "📝 Logs are available in ./logs/"
echo ""

# Monitor processes
print_status "Monitoring servers (Ctrl+C to stop)..."
while true; do
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        print_error "Frontend server stopped unexpectedly"
        cleanup
    fi

    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        print_error "Backend server stopped unexpectedly"
        cleanup
    fi

    sleep 5
done
