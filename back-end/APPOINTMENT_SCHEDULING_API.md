# Appointment Scheduling API Guide

## Overview

The Appointment Scheduling API enables bidirectional scheduling between **Citizens** and **Providers** (Lawyers/NGOs). Either party can create an appointment request, and the other party can accept, reschedule, or decline.

---

## Prerequisites

> **Important:** Appointments can only be created after a match has been accepted.

### Required Flow Before Scheduling:

```
1. Citizen submits a case
2. System generates matches (Lawyers/NGOs)
3. Citizen views matches and selects a provider
4. Provider (Lawyer/NGO) ACCEPTS the match
5. ✅ Now appointments can be created by either party
```

If you try to create an appointment for a match that hasn't been accepted by the provider, you will receive an error:
```json
{
  "message": "Cannot create appointment: Match must be accepted by provider"
}
```

---

## Base URL

```
http://localhost:8080/api/appointments
```

## Authentication

All endpoints require authentication via JWT Bearer token.

```
Authorization: Bearer <your_jwt_token>
```

---

## Appointment Status Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APPOINTMENT LIFECYCLE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Provider creates          Citizen creates                        │
│         │                         │                                │
│         ▼                         ▼                                │
│   PENDING_CITIZEN_APPROVAL   PENDING_PROVIDER_APPROVAL             │
│         │                         │                                │
│         │    Citizen accepts      │    Provider accepts            │
│         ▼                         ▼                                │
│         └──────────► CONFIRMED ◄──────────┘                        │
│                          │                                         │
│         ┌────────────────┼────────────────┐                        │
│         │                │                │                        │
│         ▼                ▼                ▼                        │
│    COMPLETED        CANCELLED        NO_SHOW                       │
│                                                                     │
│   Either party can request reschedule at any active state:         │
│   RESCHEDULE_REQUESTED → Other party accepts → CONFIRMED           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Status Definitions

| Status | Description |
|--------|-------------|
| `PENDING_CITIZEN_APPROVAL` | Created by provider (Lawyer/NGO), waiting for citizen to accept |
| `PENDING_PROVIDER_APPROVAL` | Created by citizen, waiting for provider to accept |
| `SCHEDULED` | Appointment scheduled, awaiting final confirmation |
| `CONFIRMED` | Both parties have confirmed the appointment |
| `RESCHEDULE_REQUESTED` | One party has requested a different time |
| `RESCHEDULED` | Appointment time changed, needs re-confirmation |
| `CANCELLED` | Appointment was cancelled by either party |
| `COMPLETED` | Appointment was successfully completed |
| `NO_SHOW` | One or both parties did not attend |

---

## API Endpoints

### 1. Create Appointment

Creates a new offline appointment request.

**Endpoint:** `POST /api/appointments`

**Access:** All authenticated users (Citizen, Lawyer, NGO)

**Request Body:**
```json
{
  "matchId": 1,
  "scheduledDateTime": "2026-01-15T10:00:00",
  "appointmentTime": "10:00:00",
  "venue": "City Legal Aid Center",
  "location": "Downtown",
  "address": "123 Main Street, Suite 400, City, State 12345",
  "notes": "Initial consultation regarding property dispute",
  "agenda": "1. Case overview\n2. Document review\n3. Next steps"
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `matchId` | Long | Yes | ID of the accepted match |
| `scheduledDateTime` | DateTime | Yes | Date and time of appointment |
| `appointmentTime` | Time | No | Specific time (HH:mm:ss format) |
| `venue` | String | Yes | Name of the meeting venue |
| `location` | String | No | General location/area |
| `address` | String | No | Full address of the venue |
| `notes` | String | No | Additional notes |
| `agenda` | String | No | Meeting agenda items |

**Response:**
```json
{
  "id": 1,
  "matchId": 1,
  "caseId": 5,
  "caseTitle": "Property Dispute Case",
  "caseType": "PROPERTY",
  "citizenId": 10,
  "citizenName": "John Doe",
  "citizenEmail": "john@example.com",
  "providerId": 20,
  "providerName": "Jane Smith",
  "providerEmail": "jane@lawfirm.com",
  "providerRole": "LAWYER",
  "scheduledDateTime": "2026-01-15T10:00:00",
  "appointmentTime": "10:00:00",
  "venue": "City Legal Aid Center",
  "location": "Downtown",
  "address": "123 Main Street, Suite 400, City, State 12345",
  "notes": "Initial consultation regarding property dispute",
  "agenda": "1. Case overview\n2. Document review\n3. Next steps",
  "status": "PENDING_CITIZEN_APPROVAL",
  "citizenConfirmed": false,
  "providerConfirmed": true,
  "actionRequiredByCitizen": true,
  "actionRequiredByProvider": false,
  "statusDescription": "Awaiting citizen's approval",
  "createdAt": "2026-01-05T14:30:00",
  "updatedAt": "2026-01-05T14:30:00",
  "createdByName": "Jane Smith"
}
```

---

### 2. Get My Appointments

Get all appointments for the current user.

**Endpoint:** `GET /api/appointments/my`

**Response:** Array of `AppointmentResponse` objects

---

### 3. Get Upcoming Appointments

Get future appointments with active statuses.

**Endpoint:** `GET /api/appointments/upcoming`

**Response:** Array of `AppointmentResponse` objects (sorted by date ascending)

---

### 4. Get Past Appointments

Get appointments that have already occurred.

**Endpoint:** `GET /api/appointments/past`

**Response:** Array of `AppointmentResponse` objects (sorted by date descending)

---

### 5. Get Pending Appointments

Get appointments requiring your action (accept/respond).

**Endpoint:** `GET /api/appointments/pending`

**Response:** Array of `AppointmentResponse` objects requiring user action

---

### 6. Get Appointment by ID

Get details of a specific appointment.

**Endpoint:** `GET /api/appointments/{id}`

**Response:** Single `AppointmentResponse` object

---

### 7. Get Appointments by Case

Get all appointments related to a specific case.

**Endpoint:** `GET /api/appointments/case/{caseId}`

**Response:** Array of `AppointmentResponse` objects

---

### 8. Update Appointment

Update appointment details (time, venue, location, notes, etc.).

**Endpoint:** `PUT /api/appointments/{id}`

**Request Body:**
```json
{
  "scheduledDateTime": "2026-01-16T14:00:00",
  "appointmentTime": "14:00:00",
  "venue": "District Court Building",
  "location": "Court District",
  "address": "456 Justice Avenue, City, State 12345",
  "notes": "Updated notes",
  "agenda": "Updated agenda"
}
```

> **Note:** Changing the scheduled time will require the other party to re-confirm.

---

### 9. Citizen Accepts Appointment

Citizen accepts an appointment created by a provider.

**Endpoint:** `POST /api/appointments/{id}/confirm`

**Access:** CITIZEN role only

**Response:** Updated `AppointmentResponse` with status `CONFIRMED`

---

### 10. Provider Accepts Appointment

Provider (Lawyer/NGO) accepts an appointment created by a citizen.

**Endpoint:** `POST /api/appointments/{id}/accept`

**Access:** LAWYER or NGO role only

**Response:** Updated `AppointmentResponse` with status `CONFIRMED`

---

### 11. Request Reschedule

Either party can request a different time.

**Endpoint:** `POST /api/appointments/{id}/request-reschedule`

**Request Body:**
```json
{
  "preferredDateTime": "2026-01-20T11:00:00",
  "reason": "Schedule conflict with another appointment",
  "message": "Could we move this to next week? I have a court hearing on the original date."
}
```

**Response:** Updated `AppointmentResponse` with status `RESCHEDULE_REQUESTED`

---

### 12. Cancel Appointment

Cancel an appointment with a reason.

**Endpoint:** `POST /api/appointments/{id}/cancel`

**Request Body:**
```json
{
  "cancellationReason": "Case has been resolved through mediation"
}
```

**Response:** Updated `AppointmentResponse` with status `CANCELLED`

---

### 13. Complete Appointment

Mark an appointment as completed (provider only).

**Endpoint:** `POST /api/appointments/{id}/complete`

**Access:** Provider or Admin only

**Request Body (optional):**
```json
{
  "completionNotes": "Discussed all case details. Client will provide additional documents by next week."
}
```

**Response:** Updated `AppointmentResponse` with status `COMPLETED`

---

### 14. Mark No-Show

Mark an appointment as no-show (provider only).

**Endpoint:** `POST /api/appointments/{id}/no-show`

**Access:** Provider or Admin only

**Response:** Updated `AppointmentResponse` with status `NO_SHOW`

---

## Workflow Examples

### Example 1: Lawyer Creates Appointment for Citizen

```
1. Lawyer calls POST /api/appointments
   → Status: PENDING_CITIZEN_APPROVAL
   → actionRequiredByCitizen: true

2. Citizen sees pending appointment via GET /api/appointments/pending

3. Citizen calls POST /api/appointments/{id}/confirm
   → Status: CONFIRMED
   → Both parties confirmed

4. After meeting, Lawyer calls POST /api/appointments/{id}/complete
   → Status: COMPLETED
```

### Example 2: Citizen Creates Appointment for NGO

```
1. Citizen calls POST /api/appointments
   → Status: PENDING_PROVIDER_APPROVAL
   → actionRequiredByProvider: true

2. NGO sees pending appointment via GET /api/appointments/pending

3. NGO calls POST /api/appointments/{id}/accept
   → Status: CONFIRMED
```

### Example 3: Reschedule Flow

```
1. Appointment is CONFIRMED

2. Citizen requests reschedule:
   POST /api/appointments/{id}/request-reschedule
   → Status: RESCHEDULE_REQUESTED
   → actionRequiredByProvider: true

3. Provider reviews and accepts:
   POST /api/appointments/{id}/accept
   → Status: CONFIRMED
   
   OR Provider suggests different time:
   PUT /api/appointments/{id} (with new scheduledDateTime)
   → Status: PENDING_CITIZEN_APPROVAL
```

---

## Response Fields Reference

| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Unique appointment ID |
| `matchId` | Long | Associated match ID |
| `caseId` | Long | Associated case ID |
| `caseTitle` | String | Title of the case |
| `caseType` | String | Type of case |
| `citizenId` | Long | Citizen's user ID |
| `citizenName` | String | Citizen's name |
| `citizenEmail` | String | Citizen's email |
| `providerId` | Long | Provider's user ID |
| `providerName` | String | Provider's name |
| `providerEmail` | String | Provider's email |
| `providerRole` | String | LAWYER or NGO |
| `scheduledDateTime` | DateTime | Scheduled date and time |
| `appointmentTime` | Time | Specific meeting time (HH:mm:ss) |
| `venue` | String | Name of the meeting venue |
| `location` | String | General location/area |
| `address` | String | Full address of the venue |
| `notes` | String | Appointment notes |
| `agenda` | String | Meeting agenda |
| `status` | Enum | Current appointment status |
| `citizenConfirmed` | Boolean | Whether citizen has confirmed |
| `providerConfirmed` | Boolean | Whether provider has confirmed |
| `actionRequiredByCitizen` | Boolean | Citizen needs to take action |
| `actionRequiredByProvider` | Boolean | Provider needs to take action |
| `statusDescription` | String | Human-readable status message |
| `cancellationReason` | String | Reason for cancellation |
| `cancelledAt` | DateTime | When appointment was cancelled |
| `cancelledByName` | String | Who cancelled the appointment |
| `completedAt` | DateTime | When appointment was completed |
| `completionNotes` | String | Notes after completion |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |
| `createdByName` | String | Who created the appointment |

---

## Error Responses

| HTTP Code | Error | Description |
|-----------|-------|-------------|
| 400 | Bad Request | Invalid request body or parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | User doesn't have permission for this action |
| 404 | Not Found | Appointment or related resource not found |
| 500 | Internal Server Error | Server-side error |

**Error Response Format:**
```json
{
  "timestamp": "2026-01-05T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Scheduled time must be in the future",
  "path": "/api/appointments"
}
```

---

## Best Practices

1. **Check pending appointments regularly** - Use `GET /api/appointments/pending` to see appointments requiring your action.

2. **Provide clear reasons** - When rescheduling or cancelling, provide detailed reasons for better communication.

3. **Specify complete venue details** - Include venue name, location, and full address for easy navigation.

4. **Add agenda items** - Help both parties prepare by specifying discussion topics.

5. **Confirm appointment time** - Use `appointmentTime` field to specify exact meeting time.
