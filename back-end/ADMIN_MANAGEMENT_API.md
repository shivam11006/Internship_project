# Admin Management APIs - Milestone 4 (Responsibility B)

## Overview
This document describes the Admin Management APIs implemented for Milestone 4 Responsibility B. All endpoints require **Admin authentication** and are protected with `@PreAuthorize("hasRole('ADMIN')")`.

**Base URL:** `http://localhost:8080/api/admin`

---

## 1. PUT /api/admin/users/{id}/status

**Description:** Update user status (enable/disable account and/or change approval status)

**Request:**
```http
PUT /api/admin/users/{id}/status
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | Long | User ID |

**Request Body:**
```json
{
  "enabled": true,
  "approvalStatus": "APPROVED"
}
```

| Field | Type | Description |
|-------|------|-------------|
| enabled | Boolean | Enable (true) or disable (false) the user account |
| approvalStatus | String | One of: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `REAPPROVAL_PENDING` |

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "John Doe",
  "role": "LAWYER",
  "approvalStatus": "APPROVED",
  "message": "User status updated successfully"
}
```

---

## 2. GET /api/admin/verifications

**Description:** Get all pending verifications for Lawyers and NGOs awaiting admin approval

**Request:**
```http
GET /api/admin/verifications
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "email": "lawyer@example.com",
    "username": "Jane Lawyer",
    "role": "LAWYER",
    "barNumber": "BAR12345",
    "registrationNumber": null,
    "specialization": "Criminal Law",
    "approvalStatus": "PENDING",
    "createdAt": "2026-01-14T10:00:00"
  },
  {
    "id": 2,
    "email": "ngo@example.com",
    "username": "Help Foundation",
    "role": "NGO",
    "barNumber": null,
    "registrationNumber": "NGO-2024-001",
    "specialization": "Family Support",
    "approvalStatus": "PENDING",
    "createdAt": "2026-01-13T15:30:00"
  }
]
```

---

## 3. PUT /api/admin/verify/lawyer/{id}

**Description:** Verify and approve a lawyer's registration

**Request:**
```http
PUT /api/admin/verify/lawyer/{id}
Authorization: Bearer <admin_token>
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | Long | Lawyer's User ID |

**Response (200 OK):**
```json
{
  "id": 5,
  "email": "lawyer@example.com",
  "username": "Jane Lawyer",
  "role": "LAWYER",
  "approvalStatus": "APPROVED",
  "message": "Lawyer verified successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "User is not a lawyer"
}
```

---

## 4. PUT /api/admin/verify/ngo/{id}

**Description:** Verify and approve an NGO's registration

**Request:**
```http
PUT /api/admin/verify/ngo/{id}
Authorization: Bearer <admin_token>
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | Long | NGO's User ID |

**Response (200 OK):**
```json
{
  "id": 8,
  "email": "ngo@example.com",
  "username": "Help Foundation",
  "role": "NGO",
  "approvalStatus": "APPROVED",
  "message": "NGO verified successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "User is not an NGO"
}
```

---

## 5. GET /api/admin/cases

**Description:** Get all cases in the system with pagination and sorting (Admin view)

**Request:**
```http
GET /api/admin/cases?page=0&size=20&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <admin_token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 0 | Page number (0-indexed) |
| size | int | 20 | Number of cases per page |
| sortBy | String | createdAt | Sort field (createdAt, status, caseType, priority) |
| sortOrder | String | desc | Sort order (asc or desc) |
| noPagination | boolean | false | If true, returns all cases without pagination |

**Response (200 OK) - Paginated:**
```json
{
  "content": [
    {
      "id": 1,
      "caseNumber": "CASE-2026-0001",
      "title": "Property Dispute",
      "caseType": "CIVIL",
      "status": "OPEN",
      "priority": "HIGH",
      "location": "Mumbai",
      "citizenId": 5,
      "citizenName": "Jane Citizen",
      "citizenEmail": "jane@example.com",
      "matchCount": 3,
      "hasActiveMatch": true,
      "createdAt": "2026-01-10T10:00:00",
      "updatedAt": "2026-01-14T10:00:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 45,
  "totalPages": 3,
  "last": false,
  "first": true
}
```

**Response (200 OK) - No Pagination:**
```json
[
  {
    "id": 1,
    "caseNumber": "CASE-2026-0001",
    "title": "Property Dispute",
    ...
  }
]
```

---

## 6. GET /api/admin/system/logs

**Description:** Get system logs with optional filtering

**Request:**
```http
GET /api/admin/system/logs?level=ERROR&page=0&size=50
Authorization: Bearer <admin_token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| level | String | null | Log level filter (INFO, WARN, ERROR, DEBUG) |
| startDate | String | null | Start date filter (ISO 8601 format) |
| endDate | String | null | End date filter (ISO 8601 format) |
| endpoint | String | null | Filter by API endpoint |
| username | String | null | Filter by username |
| page | int | 0 | Page number |
| size | int | 50 | Results per page |
| sortBy | String | timestamp | Sort field |
| sortOrder | String | desc | Sort order (asc or desc) |

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": 1,
      "timestamp": "2026-01-14T15:30:00",
      "level": "ERROR",
      "message": "Failed to process case submission",
      "endpoint": "/api/cases",
      "username": "citizen@example.com",
      "ipAddress": "192.168.1.100",
      "stackTrace": "..."
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 50
  },
  "totalElements": 150,
  "totalPages": 3
}
```

---

## 7. GET /api/admin/health

**Description:** Get system health status including database, memory, and system metrics

**Request:**
```http
GET /api/admin/health
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "status": "UP",
  "timestamp": "2026-01-14T15:30:00",
  "database": {
    "status": "UP",
    "responseTime": 5
  },
  "memory": {
    "used": 256,
    "free": 512,
    "total": 1024,
    "max": 2048
  },
  "uptime": 86400,
  "activeUsers": 25
}
```

| Field | Description |
|-------|-------------|
| status | Overall system status (UP/DOWN) |
| timestamp | Current server time |
| database.status | Database connection status |
| database.responseTime | Database response time in ms |
| memory.used | Used heap memory in MB |
| memory.free | Free heap memory in MB |
| memory.total | Total allocated heap in MB |
| memory.max | Maximum heap size in MB |
| uptime | System uptime in seconds |
| activeUsers | Number of currently active users |

---

## Error Responses

All endpoints return standard error responses:

**401 Unauthorized:**
```json
{
  "error": "Full authentication is required to access this resource"
}
```

**403 Forbidden:**
```json
{
  "error": "Access Denied - Admin role required"
}
```

**404 Not Found:**
```json
{
  "error": "User not found with id: 999"
}
```

**400 Bad Request:**
```json
{
  "error": "Invalid request parameters"
}
```

---

## Testing with cURL

### 1. Update User Status
```bash
curl -X PUT "http://localhost:8080/api/admin/users/5/status" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "approvalStatus": "APPROVED"}'
```

### 2. Get Pending Verifications
```bash
curl -X GET "http://localhost:8080/api/admin/verifications" \
  -H "Authorization: Bearer <token>"
```

### 3. Verify Lawyer
```bash
curl -X PUT "http://localhost:8080/api/admin/verify/lawyer/5" \
  -H "Authorization: Bearer <token>"
```

### 4. Verify NGO
```bash
curl -X PUT "http://localhost:8080/api/admin/verify/ngo/8" \
  -H "Authorization: Bearer <token>"
```

### 5. Get All Cases
```bash
curl -X GET "http://localhost:8080/api/admin/cases?page=0&size=10" \
  -H "Authorization: Bearer <token>"
```

### 6. Get System Logs
```bash
curl -X GET "http://localhost:8080/api/admin/system/logs?level=ERROR&size=20" \
  -H "Authorization: Bearer <token>"
```

### 7. Get System Health
```bash
curl -X GET "http://localhost:8080/api/admin/health" \
  -H "Authorization: Bearer <token>"
```

---

## Implementation Details

### Files Created/Modified

| File | Type | Description |
|------|------|-------------|
| `AdminController.java` | Controller | Added 7 new endpoints |
| `AdminService.java` | Service | Added business logic for admin operations |
| `UserStatusUpdateRequest.java` | DTO | Request body for status update |
| `VerificationResponse.java` | DTO | Response for verification list |
| `AdminCaseResponse.java` | DTO | Case details for admin view |
| `SystemHealthResponse.java` | DTO | System health metrics |

### Security

- All endpoints require `ADMIN` role
- JWT token authentication required
- Endpoints are logged with MDC for audit trail
