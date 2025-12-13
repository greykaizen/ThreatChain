# Authentication Setup Checklist

## Pre-Setup
- [ ] MySQL server is running
- [ ] Backend dependencies installed (`npm install`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Database `threadchain_db` exists

## Setup Steps

### 1. Run Setup Script
```bash
SETUP-AUTH-COMPLETE.bat
```

This will:
- [x] Install bcrypt and jsonwebtoken packages
- [x] Create `organizations` table
- [x] Create `users` table
- [x] Add `organization_id` column to `stix_reports`
- [x] Add `user_id` column to `stix_reports`
- [x] Create system organization for legacy reports
- [x] Migrate existing reports to system organization

### 2. Configure Environment
- [ ] Open `.env` file
- [ ] Add or update: `JWT_SECRET=your-secret-key-change-this-in-production`
- [ ] Save the file

### 3. Start Servers
Option A - Use start script:
```bash
START-WITH-AUTH.bat
```

Option B - Manual start:
```bash
# Terminal 1 - Backend
npm run backend

# Terminal 2 - Frontend
npm run dev
```

## Verification

### Database Verification
Run these SQL queries to verify setup:

```sql
-- Check organizations table exists
SHOW TABLES LIKE 'organizations';

-- Check users table exists
SHOW TABLES LIKE 'users';

-- Check stix_reports has new columns
DESCRIBE stix_reports;

-- Check system organization exists
SELECT * FROM organizations WHERE id = 'system-legacy';

-- Check legacy reports are assigned
SELECT COUNT(*) FROM stix_reports WHERE organization_id = 'system-legacy';
```

### API Verification
Test endpoints:

```bash
# Health check
curl http://localhost:3001/api/health

# Test registration (should work)
curl -X POST http://localhost:3001/api/auth/register/individual \
  -H "Content-Type: application/json" \
  -d "{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"test@example.com\",\"password\":\"password123\"}"

# Test login (should work after registration)
curl -X POST http://localhost:3001/api/auth/login/individual \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

### Frontend Verification
- [ ] Visit http://localhost:3000/signup
- [ ] Page loads without errors
- [ ] Can switch between Individual and Organization tabs
- [ ] Form fields are present and functional

- [ ] Visit http://localhost:3000/login
- [ ] Page loads without errors
- [ ] Can switch between Individual and Organization tabs
- [ ] Form fields are present and functional

## Test Flow

### Test Individual Registration
1. [ ] Go to http://localhost:3000/signup
2. [ ] Select "Individual" tab
3. [ ] Fill in:
   - First Name: John
   - Last Name: Doe
   - Email: john@example.com
   - Phone: +1234567890
   - Password: password123
   - Confirm Password: password123
4. [ ] Check "I agree to terms"
5. [ ] Click "Create account"
6. [ ] Should redirect to dashboard
7. [ ] Check localStorage has token

### Test Organization Registration
1. [ ] Go to http://localhost:3000/signup
2. [ ] Select "Organization" tab
3. [ ] Fill in:
   - Organization Name: Acme Corp
   - Admin First Name: Jane
   - Admin Last Name: Smith
   - Email: admin@acme.com
   - Phone: +1234567890
   - Address: 123 Business St
   - Password: password123
   - Confirm Password: password123
4. [ ] Check "I agree to terms"
5. [ ] Click "Create organization account"
6. [ ] Should redirect to dashboard
7. [ ] Check localStorage has token

### Test Login
1. [ ] Go to http://localhost:3000/login
2. [ ] Enter credentials from registration
3. [ ] Click "Sign in"
4. [ ] Should redirect to dashboard
5. [ ] Token should be in localStorage

### Test Upload with Auth
1. [ ] Login first
2. [ ] Go to upload page
3. [ ] Upload a STIX report
4. [ ] Check database:
   ```sql
   SELECT id, title, organization_id, user_id, created_at 
   FROM stix_reports 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
5. [ ] Should see your organization_id or user_id

### Test Access Control
1. [ ] Login as User A
2. [ ] Upload a report
3. [ ] Note the report ID
4. [ ] Logout
5. [ ] Login as User B
6. [ ] Try to access User A's report
7. [ ] Should get "Access denied" error

## Troubleshooting

### "Cannot find module 'bcrypt'"
```bash
npm install bcrypt jsonwebtoken
```

### "Table already exists" error
Tables already created - this is fine, skip to next step

### "JWT_SECRET not defined" warning
Add to .env:
```
JWT_SECRET=your-secret-key-here
```

### "Connection refused" on API calls
- Check backend is running on port 3001
- Check MySQL is running
- Check .env database credentials

### Frontend shows "Failed to fetch"
- Check backend is running
- Check CORS is enabled (already configured)
- Check API URL is http://localhost:3001

### "Invalid credentials" on login
- Verify email and password are correct
- Check user exists in database
- Try registering again with different email

## Success Indicators

✅ No errors during setup script
✅ All database tables created
✅ Backend starts without errors
✅ Frontend starts without errors
✅ Can register new accounts
✅ Can login with credentials
✅ Token stored in localStorage after login
✅ Upload requires authentication
✅ Reports have organization_id or user_id
✅ Can only view own reports

## Files Created

Backend:
- routes/auth.js
- middleware/auth.js
- routes/stix.js (modified)
- server.js (modified)

Frontend:
- app/signup/page.tsx (modified)
- app/login/page.tsx (modified)

Scripts:
- SETUP-AUTH-COMPLETE.bat
- setup-auth-tables.bat
- install-auth-deps.bat
- AUTH-SETUP-GUIDE.bat
- START-WITH-AUTH.bat

Documentation:
- AUTH-API-REFERENCE.md
- AUTH-IMPLEMENTATION-SUMMARY.md
- AUTH-CHECKLIST.md (this file)

Configuration:
- .env.example (modified)

## Next Steps After Setup

1. [ ] Test all authentication flows
2. [ ] Update any custom upload scripts to include auth token
3. [ ] Update API documentation for your team
4. [ ] Consider implementing password reset
5. [ ] Consider adding email verification
6. [ ] Set strong JWT_SECRET in production
7. [ ] Enable HTTPS in production

## Support

If you encounter issues:
1. Check this checklist
2. Review AUTH-API-REFERENCE.md
3. Check AUTH-IMPLEMENTATION-SUMMARY.md
4. Check server logs for errors
5. Check browser console for errors
6. Verify database tables and data

## Rollback (If Needed)

To rollback authentication:
```sql
-- Remove columns from stix_reports
ALTER TABLE stix_reports DROP COLUMN organization_id;
ALTER TABLE stix_reports DROP COLUMN user_id;

-- Drop new tables
DROP TABLE users;
DROP TABLE organizations;
```

Then remove auth routes from server.js and revert stix.js changes.
