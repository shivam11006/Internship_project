# Appointment Type API Documentation

## Overview
The appointment scheduling system now supports two types of appointments:
- **CALL**: Video or phone call appointments
- **OFFLINE**: In-person meetings at a physical location

## Enum Definition

```java
public enum AppointmentType {
    CALL,           // Video/Phone call appointment
    OFFLINE         // In-person/offline meeting
}
```

## API Endpoints

### Create Appointment
**Endpoint**: `POST /api/appointments`

**Request Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "matchId": 123,
  "scheduledDateTime": "2026-01-15T10:30:00",
  "appointmentTime": "10:30:00",
  "appointmentType": "CALL",
  "venue": "Zoom Meeting Room",
  "location": "Online",
  "address": null,
  "notes": "Please join 5 minutes early",
  "agenda": "Initial case consultation"
}
```

**Field Descriptions**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `matchId` | Long | Yes | ID of the accepted match |
| `scheduledDateTime` | DateTime | Yes | ISO 8601 format: `YYYY-MM-DDTHH:mm:ss` |
| `appointmentTime` | Time | No | HH:mm:ss format |
| `appointmentType` | String | No | "CALL" or "OFFLINE" (default: "OFFLINE") |
| `venue` | String | Yes | Meeting venue/platform name |
| `location` | String | No | General location (e.g., "Downtown", "Online") |
| `address` | String | No | Full physical address (for OFFLINE) |
| `notes` | String | No | Additional notes |
| `agenda` | String | No | Meeting agenda items |

**Response** (200 OK):
```json
{
  "id": 456,
  "matchId": 123,
  "caseId": 789,
  "caseTitle": "Property Dispute Case",
  "caseType": "PROPERTY",
  "citizenId": 10,
  "citizenName": "John Doe",
  "citizenEmail": "john@example.com",
  "providerId": 20,
  "providerName": "Jane Smith",
  "providerEmail": "jane@lawfirm.com",
  "providerRole": "LAWYER",
  "scheduledDateTime": "2026-01-15T10:30:00",
  "appointmentTime": "10:30:00",
  "appointmentType": "CALL",
  "venue": "Zoom Meeting Room",
  "location": "Online",
  "address": null,
  "notes": "Please join 5 minutes early",
  "agenda": "Initial case consultation",
  "status": "PENDING_PROVIDER_APPROVAL",
  "citizenConfirmed": true,
  "providerConfirmed": false,
  "actionRequiredByCitizen": false,
  "actionRequiredByProvider": true,
  "statusDescription": "Awaiting provider's approval",
  "createdAt": "2026-01-07T14:30:00",
  "updatedAt": "2026-01-07T14:30:00",
  "createdByName": "John Doe"
}
```

## Usage Examples

### Example 1: Video Call Appointment
```json
{
  "matchId": 1,
  "scheduledDateTime": "2026-01-20T15:00:00",
  "appointmentTime": "15:00:00",
  "appointmentType": "CALL",
  "venue": "Google Meet",
  "notes": "Meeting link will be shared via email",
  "agenda": "1. Review case details\n2. Discuss legal options\n3. Next steps"
}
```

### Example 2: Phone Call Appointment
```json
{
  "matchId": 2,
  "scheduledDateTime": "2026-01-18T11:00:00",
  "appointmentTime": "11:00:00",
  "appointmentType": "CALL",
  "venue": "Phone Call",
  "location": "Remote",
  "notes": "Call on +1-234-567-8900"
}
```

### Example 3: In-Person Meeting
```json
{
  "matchId": 3,
  "scheduledDateTime": "2026-01-25T10:00:00",
  "appointmentTime": "10:00:00",
  "appointmentType": "OFFLINE",
  "venue": "City Legal Aid Center",
  "location": "Downtown",
  "address": "123 Main Street, Suite 400, New York, NY 10001",
  "notes": "Please bring all relevant documents and IDs",
  "agenda": "1. Document verification\n2. Case assessment\n3. Legal strategy discussion"
}
```

### Example 4: Office Visit
```json
{
  "matchId": 4,
  "scheduledDateTime": "2026-01-22T14:30:00",
  "appointmentTime": "14:30:00",
  "appointmentType": "OFFLINE",
  "venue": "Law Office of Jane Smith",
  "location": "Manhattan",
  "address": "456 Legal Avenue, 5th Floor, New York, NY 10002",
  "notes": "Reception will check you in"
}
```

## Business Rules

### Appointment Type Rules

#### CALL Appointments:
- `venue` can be platform name (Zoom, Google Meet, Teams, Phone, etc.)
- `location` typically "Online" or "Remote" (optional)
- `address` not required (can be null)
- Meeting links can be added in `notes` field

#### OFFLINE Appointments:
- `venue` is the physical location name (required)
- `location` is general area/district (recommended)
- `address` is full physical address (recommended)
- Consider parking, accessibility notes in `notes` field

### Status Flow
Both appointment types follow the same status workflow:

1. **Creation**:
   - By Provider → `PENDING_CITIZEN_APPROVAL`
   - By Citizen → `PENDING_PROVIDER_APPROVAL`

2. **Acceptance** → `CONFIRMED`

3. **Completion** → `COMPLETED`, `CANCELLED`, or `NO_SHOW`

### Validation Rules

1. **Match must be accepted** before creating appointment
2. **Scheduled time must be in future**
3. **Venue is required** for both types
4. **AppointmentType enum** only accepts "CALL" or "OFFLINE"
5. If `appointmentType` is not provided, defaults to "OFFLINE"

## Frontend Integration

### TypeScript/JavaScript Type
```typescript
interface AppointmentFormData {
  matchId: number;
  scheduledDateTime: string;      // ISO 8601 format
  appointmentTime?: string;        // HH:mm:ss format
  appointmentType: 'CALL' | 'OFFLINE';
  venue: string;
  location?: string;
  address?: string;
  notes?: string;
  agenda?: string;
}
```

### Form Validation (Client-Side)
```javascript
function validateAppointmentForm(formData) {
  const errors = [];
  
  // Required fields
  if (!formData.matchId) errors.push('Match ID is required');
  if (!formData.scheduledDateTime) errors.push('Date and time are required');
  if (!formData.venue?.trim()) errors.push('Venue is required');
  
  // Type-specific validation
  if (formData.appointmentType === 'OFFLINE') {
    if (!formData.venue?.trim()) {
      errors.push('Venue is required for offline meetings');
    }
  }
  
  // Date validation
  const scheduledDate = new Date(formData.scheduledDateTime);
  if (scheduledDate <= new Date()) {
    errors.push('Scheduled time must be in the future');
  }
  
  return errors;
}
```

### UI Recommendations

#### For CALL Type:
- Show platform selector (Zoom, Google Meet, Teams, Phone)
- Option to auto-generate meeting link
- Reminder to share meeting credentials
- Show estimated duration

#### For OFFLINE Type:
- Map integration for address
- Transit/parking information
- Accessibility notes
- Weather forecast on appointment day
- Reminder to bring documents

## Database Schema

### appointments table

```sql
CREATE TABLE appointments (
  id BIGSERIAL PRIMARY KEY,
  match_id BIGINT NOT NULL,
  citizen_id BIGINT NOT NULL,
  provider_id BIGINT NOT NULL,
  case_id BIGINT NOT NULL,
  scheduled_date_time TIMESTAMP NOT NULL,
  appointment_time TIME,
  appointment_type VARCHAR(50) DEFAULT 'OFFLINE',  -- NEW COLUMN
  venue VARCHAR(500),
  location VARCHAR(500),
  address VARCHAR(500),
  notes TEXT,
  agenda VARCHAR(500),
  status VARCHAR(50) NOT NULL,
  citizen_confirmed BOOLEAN DEFAULT FALSE,
  provider_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- ... other fields
  CONSTRAINT fk_match FOREIGN KEY (match_id) REFERENCES matches(id),
  CONSTRAINT fk_citizen FOREIGN KEY (citizen_id) REFERENCES users(id),
  CONSTRAINT fk_provider FOREIGN KEY (provider_id) REFERENCES users(id),
  CONSTRAINT fk_case FOREIGN KEY (case_id) REFERENCES cases(id)
);
```

### Index Recommendations
```sql
-- Index on appointment_type for filtering
CREATE INDEX idx_appointments_type ON appointments(appointment_type);

-- Composite index for queries by type and status
CREATE INDEX idx_appointments_type_status ON appointments(appointment_type, status);

-- Index for user-specific queries
CREATE INDEX idx_appointments_citizen_type ON appointments(citizen_id, appointment_type, scheduled_date_time);
CREATE INDEX idx_appointments_provider_type ON appointments(provider_id, appointment_type, scheduled_date_time);
```

## Analytics & Reporting

### Useful Queries

#### Count appointments by type
```sql
SELECT 
  appointment_type,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) as confirmed,
  COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed
FROM appointments
GROUP BY appointment_type;
```

#### Average appointments per user by type
```sql
SELECT 
  appointment_type,
  COUNT(*) / COUNT(DISTINCT citizen_id) as avg_per_citizen
FROM appointments
GROUP BY appointment_type;
```

#### Appointment type preferences by case type
```sql
SELECT 
  c.case_type,
  a.appointment_type,
  COUNT(*) as count
FROM appointments a
JOIN cases c ON a.case_id = c.id
GROUP BY c.case_type, a.appointment_type
ORDER BY c.case_type, count DESC;
```

## Future Enhancements

1. **Video Integration**: Direct video call integration for CALL appointments
2. **Calendar Sync**: Export to Google Calendar, Outlook
3. **Reminders**: Email/SMS reminders before appointments
4. **Meeting Links**: Auto-generate and store meeting links
5. **Time Zones**: Support for different time zones
6. **Recurring Appointments**: Schedule series of appointments
7. **Appointment Templates**: Save common appointment setups
8. **Location Services**: Map integration for OFFLINE appointments
9. **Weather Integration**: Weather forecast for offline meetings
10. **Accessibility**: Special accommodation requests

## Migration Path for Existing Data

```sql
-- Update existing appointments without type to OFFLINE
UPDATE appointments 
SET appointment_type = 'OFFLINE' 
WHERE appointment_type IS NULL;

-- Identify potential CALL appointments from venue data
UPDATE appointments 
SET appointment_type = 'CALL'
WHERE venue ILIKE '%zoom%' 
   OR venue ILIKE '%meet%' 
   OR venue ILIKE '%teams%'
   OR venue ILIKE '%phone%'
   OR venue ILIKE '%video%'
   OR venue ILIKE '%call%';
```

## Support & Troubleshooting

### Common Issues

1. **Wrong Enum Value**: Use "CALL" or "OFFLINE" (uppercase)
2. **Null appointmentType**: Backend defaults to "OFFLINE"
3. **Missing Venue**: Always provide venue regardless of type
4. **Date Format**: Use ISO 8601 format with timezone

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid appointment type" | Wrong enum value | Use "CALL" or "OFFLINE" |
| "Venue is required" | Missing venue | Always provide venue |
| "Match must be accepted" | Match not accepted yet | Provider must accept match first |
| "Scheduled time must be in future" | Past date | Select future date/time |

## API Versioning

Current Version: **v1**  
Introduced: **January 2026**  
Breaking Changes: None (additive only)

Future versions may include:
- v2: Enhanced video call integration
- v3: Multi-participant appointments
