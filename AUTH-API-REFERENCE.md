# Authentication API Reference

## Overview
The authentication system tracks which organization or user uploads each report. All report uploads now require authentication.

## Database Schema

### Organizations Table
- `id` - UUID primary key
- `org_name` - Organization name
- `admin_first_name` - Admin first name
- `admin_last_name` - Admin last name
- `email` - Unique email (used for login)
- `phone` - Phone number
- `address` - Physical address
- `password_hash` - Bcrypt hashed password
- `api_key` - Unique API key for programmatic access
- `status` - active/inactive/suspended
- `created_at`, `updated_at` - Timestamps

### Users Table
- `id` - UUID primary key
- `organization_id` - Foreign key to organizations (nullable)
- `first_name`, `last_name` - User name
- `email` - Unique email (used for login)
- `phone` - Phone number
- `password_hash` - Bcrypt hashed password
- `role` - individual/admin/member
- `status` - active/inactive
- `created_at`, `updated_at` - Timestamps

### STIX Reports Table (Updated)
- Added `organization_id` - Foreign key to organizations
- Added `user_id` - Foreign key to users
- One of these will be set based on who uploaded the report

## API Endpoints

### Register Individual
**POST** `/api/auth/register/individual`

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "john@example.com",
    "role": "individual",
    "token": "jwt-token"
  }
}
```

### Register Organization
**POST** `/api/auth/register/organization`

**Body:**
```json
{
  "orgName": "Acme Corp",
  "adminFirstName": "Jane",
  "adminLastName": "Smith",
  "email": "admin@acme.com",
  "phone": "+1234567890",
  "address": "123 Business St",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "organizationId": "uuid",
    "orgName": "Acme Corp",
    "email": "admin@acme.com",
    "apiKey": "generated-api-key",
    "token": "jwt-token"
  }
}
```

### Login Individual
**POST** `/api/auth/login/individual`

**Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "individual",
    "token": "jwt-token"
  }
}
```

### Login Organization
**POST** `/api/auth/login/organization`

**Body:**
```json
{
  "email": "admin@acme.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "organizationId": "uuid",
    "orgName": "Acme Corp",
    "email": "admin@acme.com",
    "apiKey": "api-key",
    "token": "jwt-token"
  }
}
```

### Get Current User Info
**GET** `/api/auth/me`

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "organization",
    "id": "uuid",
    "org_name": "Acme Corp",
    "email": "admin@acme.com",
    ...
  }
}
```

### Logout
**POST** `/api/auth/logout`

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Protected Endpoints

### Upload STIX Report
**POST** `/api/stix/upload`

**Headers:**
```
Authorization: Bearer <jwt-token>
```

Now requires authentication. The report will be associated with the authenticated user/organization.

### Get Reports
**GET** `/api/stix/reports`

**Headers (Optional):**
```
Authorization: Bearer <jwt-token>
```

- **Authenticated**: Returns only reports belonging to the user/organization
- **Unauthenticated**: Returns only public/system reports

### Get Specific Report
**GET** `/api/stix/reports/:id`

**Headers (Optional):**
```
Authorization: Bearer <jwt-token>
```

Access control:
- Authenticated users can only view their own reports
- Unauthenticated users can only view system reports

### Delete Report
**DELETE** `/api/stix/reports/:id`

**Headers:**
```
Authorization: Bearer <jwt-token>
```

Only the owner can delete their reports.

### Convert to STIX
**POST** `/api/stix/convert`

**Headers:**
```
Authorization: Bearer <jwt-token>
```

Now requires authentication. The converted report will be associated with the authenticated user/organization.

## Frontend Integration

### Storing Token
After successful login/registration:
```javascript
localStorage.setItem('token', data.data.token);
localStorage.setItem('userType', 'organization'); // or 'individual'
localStorage.setItem('userEmail', data.data.email);
```

### Making Authenticated Requests
```javascript
const token = localStorage.getItem('token');

fetch('http://localhost:3001/api/stix/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    // other headers...
  },
  body: formData
});
```

### Logout
```javascript
localStorage.removeItem('token');
localStorage.removeItem('userType');
localStorage.removeItem('userEmail');
window.location.href = '/login';
```

## Security Notes

1. **JWT Secret**: Set `JWT_SECRET` in `.env` to a strong random string in production
2. **Password Hashing**: Uses bcrypt with 10 rounds
3. **Token Expiry**: JWT tokens expire after 7 days
4. **HTTPS**: Use HTTPS in production to protect tokens in transit
5. **API Keys**: Organizations get API keys for programmatic access (future feature)

## Migration

Existing reports without `organization_id` are automatically assigned to the "System" organization (ID: `system-legacy`). This ensures backward compatibility.
