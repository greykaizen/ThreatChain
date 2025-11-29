# Upload Error Fixes

## Issues Fixed

### 1. ✅ Duplicate Detection Error
**Problem**: When uploading the same STIX report twice, users saw a generic error message and the duplicate file wasn't cleaned up.

**Solution**:
- Enhanced duplicate detection to show clear error messages with details about the existing report
- Added automatic cleanup of duplicate uploaded files
- Improved error message to show when the original report was uploaded
- Frontend now displays specific duplicate error alerts

### 2. ✅ Backend Connection Error
**Problem**: Generic "Failed to process report" error didn't help users understand if the backend was running.

**Solution**:
- Added backend health check on page load
- Visual status indicator (green/red badge) shows backend connection status
- Specific error messages for different failure types:
  - Network/connection errors
  - Duplicate reports
  - Other upload failures
- Better error handling with try-catch for fetch requests

### 3. ✅ User Experience Improvements
- Added "Upload Another Report" button after successful upload
- Backend status badge shows real-time connection status
- More descriptive error alerts with actionable information
- Automatic file cleanup for duplicates to save disk space

## How It Works Now

### Duplicate Detection Flow
1. User uploads a STIX report
2. Backend generates SHA-256 hash of the content
3. Checks database for existing reports with same hash
4. If duplicate found:
   - Deletes the uploaded file immediately
   - Returns 409 status with detailed error message
   - Shows which report already exists and when it was uploaded
5. If unique:
   - Proceeds with normal upload and blockchain recording

### Error Messages
- **Duplicate**: "⚠️ Duplicate Report: A report with identical content already exists..."
- **Backend Offline**: "❌ Cannot connect to backend server. Make sure it is running on port 3001."
- **Other Errors**: Specific error message from the server

### Backend Status Indicator
- 🟢 **Green Badge**: Backend is online and ready
- 🔴 **Red Badge**: Backend is offline or unreachable
- ⚪ **Gray Badge**: Checking connection status

## Testing

### Test Duplicate Detection
1. Upload a STIX report (e.g., `sample-ransomware-attack.json`)
2. Try uploading the same file again
3. You should see: "⚠️ Duplicate Report detected" with details

### Test Backend Connection
1. Stop the backend server
2. Try to upload a report
3. You should see the red "Backend Offline" badge
4. Error message will say: "Cannot connect to backend server"

### Test Normal Upload
1. Make sure backend is running (green badge)
2. Upload a new STIX report
3. Should process successfully and show provenance details
4. Click "Upload Another Report" to reset

## Files Modified

1. **ThreatChain/routes/stix.js**
   - Enhanced duplicate detection with file cleanup
   - Better error messages with timestamps

2. **ThreatChain/components/pages/blockchain-demo.tsx**
   - Added backend status checking
   - Improved error handling and messages
   - Added reset functionality
   - Visual status indicator

## Running the System

Make sure both services are running:

```bash
# Terminal 1: Backend
cd ThreatChain
npm run backend

# Terminal 2: Frontend
cd ThreatChain
npm run dev

# Terminal 3: Ethereum (optional)
cd ThreatChain
npx hardhat node
```

Or use the all-in-one script:
```bash
cd ThreatChain
./start-everything.sh
```

## API Response Examples

### Successful Upload
```json
{
  "success": true,
  "data": {
    "reportId": "uuid-here",
    "reportHash": "sha256-hash-here",
    "stixVersion": "2.1",
    "objectsCount": 15,
    "blockchain": { ... },
    "ethereum": { ... }
  }
}
```

### Duplicate Detected
```json
{
  "success": false,
  "error": "Duplicate report detected",
  "message": "A report with identical content already exists...",
  "existingReport": {
    "id": "existing-uuid",
    "title": "Original Report Title",
    "uploadedAt": "2025-11-28T13:00:00.000Z"
  }
}
```

### Backend Offline
```
Error: Cannot connect to backend server. Make sure it is running on port 3001.
```
