#!/bin/bash
# Script to verify the build process works correctly

# Set up colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Verifying build process for CollabCode server...${NC}"

# Clean any previous builds
echo -e "${YELLOW}Cleaning previous builds...${NC}"
npm run clean

# Check if npx is available
echo -e "${YELLOW}Checking if npx is available...${NC}"
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx not found. Please install Node.js >= 20.0.0${NC}"
    exit 1
else
    echo -e "${GREEN}✅ npx is available${NC}"
fi

# Check if TypeScript is installed
echo -e "${YELLOW}Checking if TypeScript is installed...${NC}"
if ! npm list typescript &> /dev/null; then
    echo -e "${RED}❌ TypeScript not found in dependencies${NC}"
    echo -e "${YELLOW}Installing TypeScript...${NC}"
    npm install typescript
else
    echo -e "${GREEN}✅ TypeScript is installed${NC}"
fi

# Try to build using the same command Railway will use
echo -e "${YELLOW}Attempting to build using Railway's build command...${NC}"
if mkdir -p dist && npx tsc; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed. See errors above.${NC}"
    exit 1
fi

# Check if the build artifacts exist
echo -e "${YELLOW}Checking build artifacts...${NC}"
if [ -f "./dist/src/index.js" ]; then
    echo -e "${GREEN}✅ Build artifacts exist${NC}"
else
    echo -e "${RED}❌ Build artifacts not found. Build may have failed.${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Verification completed successfully! The build process should work on Railway.${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Commit these changes to GitHub"
echo -e "2. Trigger a new deployment on Railway"
echo -e "3. Update the client's NEXT_PUBLIC_SOCKET_URL with the Railway URL"
