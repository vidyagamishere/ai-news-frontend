#!/bin/bash

# Local Testing Script for AI News React Frontend
echo "🧪 AI News React Frontend - Local Testing"
echo "======================================="

cd /Users/vijayansubramaniyan/Desktop/AI-ML/Projects/ai-news-react

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Function to print info
print_info() {
    echo -e "${YELLOW}📋 $1${NC}"
}

print_info "Step 1: Checking prerequisites..."

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "   Node.js: $NODE_VERSION"
    print_status 0 "Node.js is installed"
else
    print_status 1 "Node.js not found - please install Node.js 18+"
    exit 1
fi

# Check project structure
if [ -d "src/components" ]; then
    COMPONENT_COUNT=$(find src/components -name "*.tsx" | wc -l)
    echo "   Components found: $COMPONENT_COUNT"
    print_status 0 "Project structure exists"
else
    print_status 1 "Project structure missing"
    exit 1
fi

print_info "Step 2: Testing API connection..."

# Test API connection
if node test-api.js > /tmp/api_test.log 2>&1; then
    print_status 0 "API connection successful"
    grep "Total Updates:" /tmp/api_test.log | head -1
    grep "Sources loaded:" /tmp/api_test.log | head -1
else
    print_status 1 "API connection failed"
    echo "API test output:"
    cat /tmp/api_test.log
    exit 1
fi

print_info "Step 3: Checking dependencies..."

# Check if dependencies are installed
if [ -d "node_modules" ]; then
    print_status 0 "Dependencies are installed"
    
    # Check key dependencies
    if [ -d "node_modules/react" ]; then
        REACT_VERSION=$(grep '"version"' node_modules/react/package.json | head -1 | cut -d'"' -f4)
        echo "   React version: $REACT_VERSION"
    fi
    
    if [ -d "node_modules/axios" ]; then
        echo "   Axios: ✅ installed"
    else
        echo "   Axios: ❌ missing"
    fi
    
    if [ -d "node_modules/lucide-react" ]; then
        echo "   Lucide React: ✅ installed"
    else
        echo "   Lucide React: ❌ missing"
    fi
    
else
    print_status 1 "Dependencies not installed"
    echo ""
    echo "📦 Installing dependencies..."
    
    if command -v yarn &> /dev/null; then
        echo "Using yarn..."
        yarn install
    elif command -v pnpm &> /dev/null; then
        echo "Using pnpm..."
        pnpm install
    else
        echo "Using npm..."
        npm install
    fi
    
    if [ $? -eq 0 ]; then
        print_status 0 "Dependencies installed successfully"
    else
        print_status 1 "Failed to install dependencies"
        exit 1
    fi
fi

print_info "Step 4: Testing build process..."

# Test build
echo "   Building for production..."
if npm run build > /tmp/build.log 2>&1; then
    print_status 0 "Production build successful"
    
    # Check build output
    if [ -d "dist" ]; then
        BUILD_SIZE=$(du -sh dist/ | cut -f1)
        echo "   Build size: $BUILD_SIZE"
        
        # Check for important files
        if [ -f "dist/index.html" ]; then
            echo "   index.html: ✅"
        else
            echo "   index.html: ❌"
        fi
        
        if [ -d "dist/assets" ]; then
            JS_FILES=$(find dist/assets -name "*.js" | wc -l)
            CSS_FILES=$(find dist/assets -name "*.css" | wc -l)
            echo "   JavaScript files: $JS_FILES"
            echo "   CSS files: $CSS_FILES"
        fi
    fi
else
    print_status 1 "Production build failed"
    echo "Build errors:"
    cat /tmp/build.log
    exit 1
fi

print_info "Step 5: Testing TypeScript compilation..."

# Check TypeScript
if npx tsc --noEmit > /tmp/tsc.log 2>&1; then
    print_status 0 "TypeScript compilation successful"
else
    print_status 1 "TypeScript compilation failed"
    echo "TypeScript errors:"
    cat /tmp/tsc.log
fi

print_info "Step 6: Code quality checks..."

# Check for common issues in code
echo "   Checking for potential issues..."

# Check for console.log statements
CONSOLE_LOGS=$(grep -r "console\.log" src/ | wc -l)
if [ $CONSOLE_LOGS -gt 0 ]; then
    echo "   Console logs found: $CONSOLE_LOGS (consider removing for production)"
else
    echo "   Console logs: ✅ clean"
fi

# Check for TODO comments
TODOS=$(grep -r "TODO\|FIXME" src/ | wc -l)
if [ $TODOS -gt 0 ]; then
    echo "   TODO/FIXME comments: $TODOS"
else
    echo "   TODO/FIXME comments: ✅ none"
fi

print_info "Step 7: Configuration check..."

# Check important configuration files
CONFIG_FILES=("package.json" "tsconfig.json" "vite.config.ts")
for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   $file: ✅"
    else
        echo "   $file: ❌ missing"
    fi
done

# Check API configuration
if grep -q "ai-news-scraper.vercel.app" src/services/api.ts; then
    echo "   API endpoint: ✅ configured correctly"
else
    echo "   API endpoint: ⚠️  check configuration"
fi

print_info "Testing Summary:"
echo "======================================="
echo ""
echo "🎉 Local testing completed!"
echo ""
echo "📋 Next Steps:"
echo "   1. Start dev server: npm run dev"
echo "   2. Open browser: http://localhost:5173"
echo "   3. Follow LOCAL_TESTING.md for manual testing"
echo "   4. When ready, deploy: vercel --prod"
echo ""
echo "📁 Important files:"
echo "   • LOCAL_TESTING.md  - Complete testing guide"
echo "   • SETUP.md          - Quick setup instructions" 
echo "   • DEPLOYMENT.md     - Deployment options"
echo ""
echo "🚀 Your app is ready for local testing!"

# Clean up temp files
rm -f /tmp/api_test.log /tmp/build.log /tmp/tsc.log