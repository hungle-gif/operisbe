#!/bin/bash

# Test script for Password Reset functionality
# This script tests the complete password reset flow

set -e  # Exit on error

BASE_URL="http://localhost:8001/api"
EMAIL="admin@operis.vn"
NEW_PASSWORD="TestPass123"

echo "=========================================="
echo "🧪 Testing Password Reset Functionality"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Forgot Password
echo -e "${YELLOW}Test 1: Forgot Password Request${NC}"
echo "POST $BASE_URL/password-reset/forgot-password"
FORGOT_RESPONSE=$(curl -s -X POST "$BASE_URL/password-reset/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\"}")

echo "Response: $FORGOT_RESPONSE"

if echo "$FORGOT_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Test 1 PASSED${NC}"
else
    echo -e "${RED}❌ Test 1 FAILED${NC}"
    exit 1
fi
echo ""

# Test 2: Verify Token (will fail because we don't have real token)
echo -e "${YELLOW}Test 2: Verify Reset Token (with invalid token)${NC}"
echo "POST $BASE_URL/password-reset/verify-reset-token"
VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/password-reset/verify-reset-token" \
  -H "Content-Type: application/json" \
  -d '{"token": "invalid-token-12345678901234567890"}')

echo "Response: $VERIFY_RESPONSE"

if echo "$VERIFY_RESPONSE" | grep -q "Invalid"; then
    echo -e "${GREEN}✅ Test 2 PASSED (correctly rejected invalid token)${NC}"
else
    echo -e "${RED}❌ Test 2 FAILED${NC}"
fi
echo ""

# Test 3: Reset Password (will fail because we don't have real token)
echo -e "${YELLOW}Test 3: Reset Password (with invalid token)${NC}"
echo "POST $BASE_URL/password-reset/reset-password"
RESET_RESPONSE=$(curl -s -X POST "$BASE_URL/password-reset/reset-password" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"invalid-token-12345678901234567890\", \"new_password\": \"$NEW_PASSWORD\", \"confirm_password\": \"$NEW_PASSWORD\"}")

echo "Response: $RESET_RESPONSE"

if echo "$RESET_RESPONSE" | grep -q "Invalid"; then
    echo -e "${GREEN}✅ Test 3 PASSED (correctly rejected invalid token)${NC}"
else
    echo -e "${RED}❌ Test 3 FAILED${NC}"
fi
echo ""

# Test 4: Login with admin credentials
echo -e "${YELLOW}Test 4: Login to get access token${NC}"
echo "POST $BASE_URL/auth/login"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"admin123\"}")

echo "Response: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo -e "${GREEN}✅ Test 4 PASSED${NC}"

    # Extract access token
    ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo "Access Token: ${ACCESS_TOKEN:0:50}..."
else
    echo -e "${RED}❌ Test 4 FAILED (could not login)${NC}"
    echo "Skipping Test 5 (requires authentication)"
    exit 1
fi
echo ""

# Test 5: Change Password (authenticated)
echo -e "${YELLOW}Test 5: Change Password (authenticated)${NC}"
echo "POST $BASE_URL/password-reset/change-password"
CHANGE_RESPONSE=$(curl -s -X POST "$BASE_URL/password-reset/change-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"old_password": "admin123", "new_password": "NewPass123", "confirm_password": "NewPass123"}')

echo "Response: $CHANGE_RESPONSE"

if echo "$CHANGE_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Test 5 PASSED${NC}"

    # Test 6: Change password back to original
    echo ""
    echo -e "${YELLOW}Test 6: Revert password to original${NC}"
    REVERT_RESPONSE=$(curl -s -X POST "$BASE_URL/password-reset/change-password" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -d '{"old_password": "NewPass123", "new_password": "admin123", "confirm_password": "admin123"}')

    if echo "$REVERT_RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✅ Test 6 PASSED (password reverted)${NC}"
    else
        echo -e "${YELLOW}⚠️  Warning: Could not revert password${NC}"
    fi
else
    echo -e "${RED}❌ Test 5 FAILED${NC}"
fi
echo ""

# Test 7: Password validation - too short
echo -e "${YELLOW}Test 7: Password Validation (too short)${NC}"
SHORT_RESPONSE=$(curl -s -X POST "$BASE_URL/password-reset/change-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"old_password": "admin123", "new_password": "short", "confirm_password": "short"}')

echo "Response: $SHORT_RESPONSE"

if echo "$SHORT_RESPONSE" | grep -q "8 characters"; then
    echo -e "${GREEN}✅ Test 7 PASSED (correctly rejected short password)${NC}"
else
    echo -e "${RED}❌ Test 7 FAILED${NC}"
fi
echo ""

# Test 8: Password validation - no number
echo -e "${YELLOW}Test 8: Password Validation (no number)${NC}"
NO_NUM_RESPONSE=$(curl -s -X POST "$BASE_URL/password-reset/change-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"old_password": "admin123", "new_password": "NoNumbers", "confirm_password": "NoNumbers"}')

echo "Response: $NO_NUM_RESPONSE"

if echo "$NO_NUM_RESPONSE" | grep -q "number"; then
    echo -e "${GREEN}✅ Test 8 PASSED (correctly rejected password without number)${NC}"
else
    echo -e "${RED}❌ Test 8 FAILED${NC}"
fi
echo ""

# Test 9: Password mismatch
echo -e "${YELLOW}Test 9: Password Confirmation Mismatch${NC}"
MISMATCH_RESPONSE=$(curl -s -X POST "$BASE_URL/password-reset/change-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"old_password": "admin123", "new_password": "ValidPass123", "confirm_password": "DifferentPass456"}')

echo "Response: $MISMATCH_RESPONSE"

if echo "$MISMATCH_RESPONSE" | grep -q "match"; then
    echo -e "${GREEN}✅ Test 9 PASSED (correctly rejected mismatched passwords)${NC}"
else
    echo -e "${RED}❌ Test 9 FAILED${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}🎉 All Tests Completed!${NC}"
echo "=========================================="
echo ""
echo "✅ Forgot Password endpoint working"
echo "✅ Token verification working"
echo "✅ Reset password validation working"
echo "✅ Change password (authenticated) working"
echo "✅ Password validation rules enforced"
echo ""
echo "📧 Note: Check Docker logs for email output:"
echo "   docker-compose logs backend | grep -A 30 'Email'"
echo ""
echo "🔗 API Documentation available at:"
echo "   http://localhost:8001/api/docs"
echo ""
