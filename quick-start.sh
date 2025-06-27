#!/bin/bash

# N8N Exam Proctoring System - Quick Start Script
# This script will set up and run the entire system

set -e  # Exit on any error

echo "🚀 N8N Exam Proctoring System - Quick Start"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.8+ and try again."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+ and try again."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    print_success "All requirements satisfied!"
}

# Setup configuration
setup_config() {
    print_status "Setting up configuration..."
    
    if [ ! -f "config.env" ]; then
        cp config.env.example config.env
        print_warning "Created config.env from template. Please edit it with your actual values:"
        print_warning "- GOOGLE_AI_API_KEY (required)"
        print_warning "- SMTP_USER and SMTP_PASSWORD (for email notifications)"
        echo ""
        read -p "Press Enter to continue after editing config.env, or Ctrl+C to exit..."
    else
        print_success "config.env already exists"
    fi
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d ".venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv .venv
    fi
    
    # Activate virtual environment
    print_status "Activating virtual environment..."
    source .venv/bin/activate
    
    # Install requirements
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    print_success "Backend setup complete!"
    cd ..
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install npm dependencies
    if [ ! -d "node_modules" ]; then
        print_status "Installing Node.js dependencies..."
        npm install
    else
        print_status "Node.js dependencies already installed"
    fi
    
    print_success "Frontend setup complete!"
    cd ..
}

# Install N8N globally
setup_n8n() {
    print_status "Setting up N8N..."
    
    # Check if N8N is already installed
    if ! command -v n8n &> /dev/null; then
        print_status "Installing N8N globally..."
        npm install -g n8n
    else
        print_success "N8N is already installed"
    fi
}

# Start all services
start_services() {
    print_status "Starting all services..."
    
    # Create log directory
    mkdir -p logs
    
    # Start backend
    print_status "Starting backend server..."
    cd backend
    source .venv/bin/activate
    python main.py > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Wait a moment for backend to start
    sleep 3
    
    # Start frontend
    print_status "Starting frontend server..."
    cd frontend
    npm start > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Wait a moment for frontend to start
    sleep 3
    
    # Start N8N
    print_status "Starting N8N server..."
    n8n start > logs/n8n.log 2>&1 &
    N8N_PID=$!
    
    # Save PIDs for cleanup
    echo $BACKEND_PID > logs/backend.pid
    echo $FRONTEND_PID > logs/frontend.pid
    echo $N8N_PID > logs/n8n.pid
    
    print_success "All services started!"
}

# Display service URLs
show_urls() {
    echo ""
    echo "🎉 Setup Complete! Services are running:"
    echo "========================================"
    echo "📱 Frontend:    http://localhost:3000"
    echo "🔧 Backend API: http://localhost:8000"
    echo "⚙️  N8N:        http://localhost:5678"
    echo ""
    echo "📝 Logs are available in the 'logs/' directory"
    echo ""
    echo "To stop all services, run: ./stop-services.sh"
    echo ""
}

# Create stop script
create_stop_script() {
    cat > stop-services.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping N8N Exam Proctoring System services..."

# Function to kill process if PID file exists
kill_service() {
    local service=$1
    local pidfile="logs/${service}.pid"
    
    if [ -f "$pidfile" ]; then
        local pid=$(cat "$pidfile")
        if kill -0 "$pid" 2>/dev/null; then
            echo "Stopping $service (PID: $pid)..."
            kill "$pid"
            rm "$pidfile"
        else
            echo "$service was not running"
            rm "$pidfile"
        fi
    else
        echo "No PID file found for $service"
    fi
}

# Stop all services
kill_service "backend"
kill_service "frontend" 
kill_service "n8n"

echo "✅ All services stopped!"
EOF
    chmod +x stop-services.sh
}

# Main execution
main() {
    check_requirements
    setup_config
    setup_backend
    setup_frontend
    setup_n8n
    create_stop_script
    start_services
    show_urls
    
    print_status "Quick start completed successfully!"
    print_warning "Remember to configure your API keys in config.env"
    print_warning "Import N8N workflows from the workflows/ directory"
}

# Run main function
main 