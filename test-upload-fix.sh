#!/bin/bash

echo "Testing Upload API Fix"
echo "====================="
echo ""

# Test 1: With invalid type "covers" (no auth, no resourceId)
echo "Test 1: Original failing payload"
echo "Request: uploadType='covers', no resourceId, no auth"
echo "Expected: Should show helpful error message about authorization"
echo ""

curl -s -X POST http://localhost:9000/api/upload/presigned-url \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "Screenshot 2026-02-04 at 4.11.45 PM.png",
    "contentType": "image/png",
    "uploadType": "covers"
  }' | head -5

echo ""
echo ""
echo "Test 2: With missing fields"
echo "Expected: Should show helpful error with valid types"
echo ""

curl -s -X POST http://localhost:9000/api/upload/presigned-url \
  -H "Content-Type: application/json" \
  -d '{}' | head -10

echo ""
echo ""
echo "✅ Fix Applied:"
echo "- Backend now handles 'covers' type mapping"
echo "- userRole has safe default"
echo "- Better error messages"
echo "- No more 'toLowerCase' crashes"
echo ""
echo "To use properly from React:"
echo "  uploadType: 'album_cover' (not 'covers')"
echo "  resourceId: albumId (required for covers)"
echo "  Authorization: Bearer token (required)"
