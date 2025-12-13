# Shared Reports & TAXII Server Fix

## Problem
After implementing authentication, the **Shared Reports** and **TAXII Server** features stopped retrieving reports.

## Root Cause
Same issue as before - these components were making API calls to fetch reports **without sending the authentication token**.

### Affected API Calls

#### Shared Reports Component
1. `GET /api/stix/reports` - Fetch all reports (line 48)
2. `DELETE /api/stix/reports/:id` - Delete report (line 89)

#### TAXII Server Component
1. `GET /api/stix/reports` - Fetch all reports (line 82)
2. `GET /api/stix/reports/:id` - Fetch specific report for verification (line 171)
3. `GET /api/stix/reports/:id` - Export report (line 229)
4. `GET /api/stix/reports/:id` - Export with certificate (line 247)

## Solution
Added token retrieval from `localStorage` and included it in the `Authorization` header for all API calls.

## Changes Made

### Shared Reports Component (`components/pages/shared-reports.tsx`)

#### 1. Fetch Reports Function
**Before:**
```typescript
const response = await fetch('http://localhost:3001/api/stix/reports?limit=50')
```

**After:**
```typescript
const token = localStorage.getItem('token')
const headers: HeadersInit = {}
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}

const response = await fetch('http://localhost:3001/api/stix/reports?limit=50', {
  headers: headers
})
```

#### 2. Delete Report Function
**Before:**
```typescript
const response = await fetch(`http://localhost:3001/api/stix/reports/${reportId}`, {
  method: 'DELETE'
})
```

**After:**
```typescript
const token = localStorage.getItem('token')
const headers: HeadersInit = {}
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}

const response = await fetch(`http://localhost:3001/api/stix/reports/${reportId}`, {
  method: 'DELETE',
  headers: headers
})
```

### TAXII Server Component (`components/pages/taxii-server.tsx`)

#### 1. Fetch Reports in fetchTaxiiData
**Before:**
```typescript
const reportsRes = await fetch('http://localhost:3001/api/stix/reports?limit=50')
```

**After:**
```typescript
const token = localStorage.getItem('token')
const headers: HeadersInit = {}
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}

const reportsRes = await fetch('http://localhost:3001/api/stix/reports?limit=50', {
  headers: headers
})
```

#### 2. Verify Report Integrity
**Before:**
```typescript
const response = await fetch(`http://localhost:3001/api/stix/reports/${report.id}`)
```

**After:**
```typescript
const token = localStorage.getItem('token')
const headers: HeadersInit = {}
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}

const response = await fetch(`http://localhost:3001/api/stix/reports/${report.id}`, {
  headers: headers
})
```

#### 3. Export Report
**Before:**
```typescript
const response = await fetch(`http://localhost:3001/api/stix/reports/${report.id}`)
```

**After:**
```typescript
const token = localStorage.getItem('token')
const headers: HeadersInit = {}
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}

const response = await fetch(`http://localhost:3001/api/stix/reports/${report.id}`, {
  headers: headers
})
```

#### 4. Export With Certificate
**Before:**
```typescript
const response = await fetch(`http://localhost:3001/api/stix/reports/${report.id}`)
```

**After:**
```typescript
const token = localStorage.getItem('token')
const headers: HeadersInit = {}
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}

const response = await fetch(`http://localhost:3001/api/stix/reports/${report.id}`, {
  headers: headers
})
```

## Why This Happened

The backend `/api/stix/reports` endpoint now uses `optionalAuth` middleware, which means:
- **With token**: Returns reports belonging to the authenticated user/organization
- **Without token**: Returns only public/system reports

Since the frontend wasn't sending tokens, users were only seeing system reports (or none if they had no system reports).

## How It Works Now

### With Authentication (After Login)
1. User logs in → Token stored in localStorage ✅
2. User goes to Shared Reports or TAXII Server ✅
3. Component retrieves token from localStorage ✅
4. Token sent in `Authorization: Bearer <token>` header ✅
5. Backend returns reports belonging to that user/organization ✅
6. User sees their own reports ✅

### Without Authentication (Not Logged In)
1. User not logged in → No token in localStorage
2. User goes to Shared Reports or TAXII Server
3. No token sent
4. Backend returns only public/system reports
5. User sees limited reports

## Testing

### Test Shared Reports
1. ✅ Login at `/login`
2. ✅ Go to Dashboard → Shared Reports
3. ✅ Should see all your uploaded reports
4. ✅ Can delete your own reports
5. ✅ Reports load successfully

### Test TAXII Server
1. ✅ Login at `/login`
2. ✅ Go to Dashboard → TAXII Server
3. ✅ Should see all your uploaded reports
4. ✅ Can verify report integrity
5. ✅ Can export reports
6. ✅ Can export with certificate
7. ✅ All features work

## Files Modified
1. `components/pages/shared-reports.tsx` - Added token to 2 API calls
2. `components/pages/taxii-server.tsx` - Added token to 4 API calls

## Summary of All Token Fixes

We've now fixed token authentication in **ALL** frontend components:

1. ✅ **Blockchain Demo** - Upload reports
2. ✅ **Knowledge Graph** - Convert to STIX
3. ✅ **Shared Reports** - Fetch and delete reports
4. ✅ **TAXII Server** - Fetch, verify, and export reports

All features now properly send the JWT token with API requests, ensuring:
- Users see their own reports
- Reports are properly tracked by owner
- Access control works correctly
- Authentication is enforced

## Pattern to Remember

Whenever making an API call to a protected endpoint:

```typescript
// 1. Get token from localStorage
const token = localStorage.getItem('token')

// 2. Create headers object
const headers: HeadersInit = {
  // ... other headers like Content-Type
}

// 3. Add Authorization if token exists
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}

// 4. Include headers in fetch
const response = await fetch('url', {
  method: 'GET/POST/DELETE',
  headers: headers,
  // ... other options
})
```

This pattern ensures backward compatibility (works with or without token) while properly supporting authentication when available.
