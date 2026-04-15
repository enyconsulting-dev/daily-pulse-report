# HR Partner Integration Troubleshooting Guide

## Issue: "EMPLOYEE_NOT_FOUND" Error on Vercel

### Root Cause Analysis

The 401 Unauthorized error with "EMPLOYEE_NOT_FOUND" typically means:
1. Wrong HR Partner API key for the production account
2. Employee code doesn't exist in the HR Partner database
3. Different HR Partner accounts between local and production

### Steps to Debug & Fix

#### 1. Set Up Environment Variables

**Local Development:**
```bash
# Create .env.local file in project root
cp .env.local.example .env.local

# Add your correct HR Partner API key
HR_PARTNER_API_KEY=your_production_api_key
```

**Vercel Production:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `HR_PARTNER_API_KEY` with the correct production API key
3. Redeploy the project

#### 2. Verify Employee Code Mapping

Check that employee codes in your Supabase database match those in HR Partner:

```sql
-- Query to check employee codes in your database
SELECT id, name, employee_code FROM staff_members WHERE employee_code IS NOT NULL;
```

Compare these codes with the employee codes in your HR Partner account.

#### 3. Check API Response Logs

After making changes, submit a timesheet and check:
- **Local:** Browser console → Network tab → `/api/hr-partner/timeclock` response
- **Vercel:** Vercel Dashboard → Function Logs or check cloud logging

The logs will now show:
- Request body being sent
- HR Partner API response
- Specific error details

#### 4. Test API Manually (Local)

```bash
# Test local API endpoint
curl -X POST http://localhost:5173/api/hr-partner/timeclock \
  -H "Content-Type: application/json" \
  -d '{
    "employee_code": "YOUR_EMPLOYEE_CODE",
    "start_time": "2026-04-15 09:00",
    "end_time": "2026-04-15 10:00",
    "notes": "Test entry"
  }'
```

#### 5. Verify HR Partner API Key

1. Log into HR Partner Dashboard
2. Go to Settings → API Keys
3. Verify the API key is active and has required permissions
4. Ensure it's for the correct company/account

### Key Changes Made

✅ **Environment Variable Configuration**: API key now uses `HR_PARTNER_API_KEY` env var
✅ **Better Error Logging**: Full request/response logging for debugging
✅ **Improved Data Format**: Changed to `application/x-www-form-urlencoded` for better Node.js compatibility
✅ **Enhanced Error Messages**: Client now receives detailed error information from HR Partner

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/wrong API key | Verify API key in HR Partner dashboard |
| Employee Not Found | Employee code doesn't exist | Check Supabase employee_code matches HR Partner |
| Works locally, fails on Vercel | Different API keys or environment | Set `HR_PARTNER_API_KEY` in Vercel env vars |
| Missing employee_code | Database migration not applied | Run `20260325155500_add_employee_code.sql` |

### Next Steps

1. ✅ Update `HR_PARTNER_API_KEY` environment variable in Vercel
2. ✅ Verify employee codes match in both systems
3. ✅ Redeploy to Vercel
4. ✅ Test timesheet submission in production
