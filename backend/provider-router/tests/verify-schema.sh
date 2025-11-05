#!/bin/bash

# Schema Verification Script
# Verifies that the database schema matches Phase 1 requirements

DB_PATH="data/provider-router.db"

echo "=========================================="
echo "Schema Verification Report"
echo "=========================================="
echo ""

# Check database exists
if [ ! -f "$DB_PATH" ]; then
    echo "ERROR: Database not found at $DB_PATH"
    exit 1
fi

echo "1. Schema Version Check"
echo "----------------------"
sqlite3 "$DB_PATH" "SELECT 'Current Version: ' || value FROM metadata WHERE key='schema_version'"
echo ""

echo "2. Tables Check"
echo "---------------"
echo "Expected tables: metadata, sessions, requests, responses, settings, schema_version"
echo "Actual tables:"
sqlite3 "$DB_PATH" "SELECT '  - ' || name FROM sqlite_master WHERE type='table' ORDER BY name"
echo ""

echo "3. Foreign Keys Check"
echo "--------------------"
sqlite3 "$DB_PATH" "PRAGMA foreign_keys"
FK_VIOLATIONS=$(sqlite3 "$DB_PATH" "PRAGMA foreign_key_check" | wc -l)
if [ $FK_VIOLATIONS -eq 0 ]; then
    echo "Foreign key constraints: OK (0 violations)"
else
    echo "WARNING: Foreign key violations found: $FK_VIOLATIONS"
fi
echo ""

echo "4. Indexes Check"
echo "----------------"
echo "Expected: 12 indexes"
INDEX_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
echo "Actual: $INDEX_COUNT indexes"
sqlite3 "$DB_PATH" "SELECT '  - ' || name || ' on ' || tbl_name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY tbl_name, name"
echo ""

echo "5. Record Counts"
echo "----------------"
sqlite3 "$DB_PATH" "SELECT 'Sessions: ' || COUNT(*) FROM sessions; SELECT 'Requests: ' || COUNT(*) FROM requests; SELECT 'Responses: ' || COUNT(*) FROM responses;"
echo ""

echo "6. Sample Data Integrity"
echo "------------------------"
echo "Checking request-response relationships..."
TOTAL_REQUESTS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM requests")
MATCHED_RESPONSES=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM requests r JOIN responses res ON r.id = res.request_id")
echo "Total requests: $TOTAL_REQUESTS"
echo "Matched responses: $MATCHED_RESPONSES"
if [ $TOTAL_REQUESTS -eq $MATCHED_RESPONSES ]; then
    echo "Status: OK (all requests have responses)"
else
    echo "WARNING: Some requests missing responses"
fi
echo ""

echo "7. Schema Details"
echo "-----------------"
echo ""
echo "Sessions Table:"
sqlite3 "$DB_PATH" ".schema sessions"
echo ""
echo "Requests Table:"
sqlite3 "$DB_PATH" ".schema requests"
echo ""
echo "Responses Table:"
sqlite3 "$DB_PATH" ".schema responses"
echo ""
echo "Metadata Table:"
sqlite3 "$DB_PATH" ".schema metadata"
echo ""

echo "=========================================="
echo "Verification Complete"
echo "=========================================="
