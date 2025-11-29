#!/bin/bash

echo "🧪 Testing Upload Fixes"
echo "======================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if backend is running
echo "Test 1: Backend Health Check"
echo "----------------------------"
HEALTH_CHECK=$(curl -s http://localhost:3001/api/health)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend is running${NC}"
    echo "Response: $HEALTH_CHECK"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    echo "Please start the backend with: npm run backend"
    exit 1
fi
echo ""

# Test 2: Upload a test file
echo "Test 2: Upload STIX Report"
echo "---------------------------"
if [ -f "sample-ransomware-attack.json" ]; then
    UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:3001/api/stix/upload \
        -F "file=@sample-ransomware-attack.json" \
        -F "title=Test Upload" \
        -F "description=Testing upload functionality")
    
    if echo "$UPLOAD_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Upload successful${NC}"
        REPORT_ID=$(echo "$UPLOAD_RESPONSE" | grep -o '"reportId":"[^"]*"' | cut -d'"' -f4)
        echo "Report ID: $REPORT_ID"
    else
        echo -e "${YELLOW}⚠ Upload response:${NC}"
        echo "$UPLOAD_RESPONSE" | jq '.' 2>/dev/null || echo "$UPLOAD_RESPONSE"
    fi
else
    echo -e "${YELLOW}⚠ sample-ransomware-attack.json not found, skipping upload test${NC}"
fi
echo ""

# Test 3: Try duplicate upload
echo "Test 3: Duplicate Detection"
echo "---------------------------"
if [ -f "sample-ransomware-attack.json" ]; then
    DUPLICATE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/stix/upload \
        -F "file=@sample-ransomware-attack.json" \
        -F "title=Duplicate Test" \
        -F "description=Testing duplicate detection")
    
    if echo "$DUPLICATE_RESPONSE" | grep -q '"error":"Duplicate report detected"'; then
        echo -e "${GREEN}✓ Duplicate detection working${NC}"
        echo "Message: $(echo "$DUPLICATE_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)"
    elif echo "$DUPLICATE_RESPONSE" | grep -q '"success":true'; then
        echo -e "${YELLOW}⚠ Duplicate was uploaded (might be first upload)${NC}"
    else
        echo -e "${RED}✗ Unexpected response${NC}"
        echo "$DUPLICATE_RESPONSE" | jq '.' 2>/dev/null || echo "$DUPLICATE_RESPONSE"
    fi
else
    echo -e "${YELLOW}⚠ sample-ransomware-attack.json not found, skipping duplicate test${NC}"
fi
echo ""

# Test 4: Check database for reports
echo "Test 4: Database Check"
echo "----------------------"
REPORTS=$(curl -s http://localhost:3001/api/stix/reports?limit=5)
if echo "$REPORTS" | grep -q '"success":true'; then
    REPORT_COUNT=$(echo "$REPORTS" | grep -o '"total":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✓ Database accessible${NC}"
    echo "Total reports in database: $REPORT_COUNT"
else
    echo -e "${RED}✗ Could not fetch reports${NC}"
fi
echo ""

echo "======================="
echo "✅ Testing Complete"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Navigate to 'Blockchain Demo' page"
echo "3. Check the backend status badge (should be green)"
echo "4. Try uploading sample-ransomware-attack.json"
echo "5. Try uploading the same file again (should show duplicate error)"
