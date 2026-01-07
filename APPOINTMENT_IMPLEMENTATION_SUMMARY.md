# Appointment Scheduling Implementation Summary

## Overview
Complete implementation of appointment scheduling with support for both **CALL** (video/phone) and **OFFLINE** (in-person) appointment types, fully integrated between frontend and backend.

## Backend Changes

### 1. New Enum: `AppointmentType.java`
**Location:** `back-end/src/main/java/com/example/legalaid_backend/util/AppointmentType.java`

```java
public enum AppointmentType {
    CALL,           // Video/Phone call appointment
    OFFLINE         // In-person/offline meeting
}
```

### 2. Updated Entity: `Appointment.java`
**Changes:**
- Added import for `AppointmentType`
- Added new field:
  ```java
  @Enumerated(EnumType.STRING)
  @Column(name = "appointment_type", length = 50)
  private AppointmentType appointmentType = AppointmentType.OFFLINE;
  ```

### 3. Updated DTOs

#### `CreateAppointmentRequest.java`
- Added import for `AppointmentType`
- Added field: `private AppointmentType appointmentType;`

#### `AppointmentResponse.java`
- Added import for `AppointmentType`
- Added field: `private AppointmentType appointmentType;`

### 4. Updated Service: `AppointmentService.java`
**Changes:**
- Added import for `AppointmentType`
- Updated `createAppointment()` method:
  - Sets default appointment type to OFFLINE if not provided
  - Handles appointmentType in appointment creation
- Updated response builder to include `appointmentType`

### 5. Database Migration
**File:** `back-end/add_appointment_type_migration.sql`

Run this SQL to add the appointment_type column:
```sql
ALTER TABLE appointments 
ADD COLUMN appointment_type VARCHAR(50) DEFAULT 'OFFLINE';

UPDATE appointments 
SET appointment_type = 'OFFLINE' 
WHERE appointment_type IS NULL;
```

## Frontend Changes

### 1. Fixed `appointmentService.js`
**Issue Fixed:** 
- Changed from `authService.getToken()` to `localStorage.getItem('accessToken')`
- This resolves the "authService.getToken is not a function" error

### 2. Updated `DashboardCitizen.jsx`

#### Added State Management:
```javascript
const [appointmentForm, setAppointmentForm] = useState({
  appointmentType: 'call', // 'call' or 'offline'
  date: '',
  time: '',
  venue: '',
  location: '',
  address: '',
  notes: '',
  agenda: ''
});
const [submittingAppointment, setSubmittingAppointment] = useState(false);
const [appointmentError, setAppointmentError] = useState(null);
```

#### New Functions:
- `handleOpenScheduleModal()` - Resets and opens modal with default values
- `handleCloseScheduleModal()` - Closes modal and clears errors
- `handleAppointmentFormChange()` - Updates form fields
- `handleTimeSlotSelect()` - Handles time slot selection
- `handleSubmitAppointment()` - Validates and submits appointment

#### Updated Modal UI:
- **Appointment Type Selector** with two buttons:
  - 📞 Call
  - 🏢 Offline Meeting
- **Dynamic Form Fields:**
  - Venue label changes based on type:
    - Call: "Meeting Platform (Optional)"
    - Offline: "Venue *" (required)
  - Location and Address fields only show for offline meetings
- **Time Selection:**
  - Quick-select time slot buttons
  - Custom time input field
- **Date Picker** with minimum date validation
- **Error Display** with styled error messages
- **Loading States** during submission

## API Integration

### Request Format
```javascript
{
  "matchId": 123,
  "scheduledDateTime": "2026-01-15T10:30:00",
  "appointmentTime": "10:30:00",
  "appointmentType": "CALL",  // or "OFFLINE"
  "venue": "Video/Phone Call", // or venue name for offline
  "location": "Downtown",      // optional
  "address": "123 Main St",    // optional
  "notes": "Initial consultation",
  "agenda": "Case overview"
}
```

### Response Format
```javascript
{
  "id": 1,
  "matchId": 123,
  "caseId": 456,
  "appointmentType": "CALL",
  "scheduledDateTime": "2026-01-15T10:30:00",
  "venue": "Video/Phone Call",
  "status": "PENDING_PROVIDER_APPROVAL",
  "statusDescription": "Awaiting provider's approval",
  ...
}
```

## Validation Rules

### Frontend Validation:
1. Date and time are required
2. For OFFLINE appointments: venue is required
3. Date must be in the future (minimum = today)
4. Contact must be selected

### Backend Validation:
1. Match must exist and be accepted by provider
2. Scheduled time must be in the future
3. Venue is required (for both types)
4. Valid appointment type (CALL or OFFLINE)

## User Flow

1. **Open Modal**: User clicks schedule button in chat
2. **Select Type**: Choose between Call or Offline meeting
3. **Fill Details**:
   - Pick date (date picker)
   - Select time (quick slots or custom)
   - Enter venue/platform
   - Add location/address (offline only)
   - Add notes and agenda (optional)
4. **Submit**: Click "Confirm Appointment"
5. **Response**: 
   - Success: Shows status message and closes modal
   - Error: Displays error message in modal

## Testing Checklist

### Backend:
- [ ] Run database migration script
- [ ] Restart Spring Boot application
- [ ] Test POST `/api/appointments` with CALL type
- [ ] Test POST `/api/appointments` with OFFLINE type
- [ ] Verify GET endpoints return appointmentType

### Frontend:
- [ ] Clear browser cache and localStorage
- [ ] Login as citizen
- [ ] Open chat with a matched provider
- [ ] Click schedule button
- [ ] Test CALL appointment creation
- [ ] Test OFFLINE appointment creation
- [ ] Verify validation messages
- [ ] Check error handling

## Dependencies

### Backend:
- No new dependencies required
- Uses existing: Lombok, Spring Boot, JPA

### Frontend:
- No new dependencies required
- Uses existing: React, Axios

## Notes

1. **Default Type**: If appointmentType is not provided, defaults to OFFLINE
2. **Venue Field**: Required for both types but serves different purposes:
   - CALL: Platform name (e.g., "Zoom", "Google Meet")
   - OFFLINE: Physical venue name
3. **Authentication**: Fixed token retrieval using localStorage directly
4. **Status Flow**: Follows existing appointment status workflow
5. **Backward Compatibility**: Existing appointments will default to OFFLINE type

## Files Modified

### Backend (6 files):
1. `util/AppointmentType.java` (NEW)
2. `entity/Appointment.java`
3. `DTO/CreateAppointmentRequest.java`
4. `DTO/AppointmentResponse.java`
5. `service/AppointmentService.java`
6. `add_appointment_type_migration.sql` (NEW)

### Frontend (2 files):
1. `services/appointmentService.js`
2. `DashboardCitizen.jsx`

## Next Steps

1. **Run Database Migration**:
   ```bash
   # Connect to your database and run:
   psql -U your_user -d your_database -f back-end/add_appointment_type_migration.sql
   ```

2. **Restart Backend**:
   ```bash
   cd back-end
   mvn spring-boot:run
   ```

3. **Test Frontend**:
   - Ensure backend is running on `http://localhost:8080`
   - Frontend should be running on default port
   - Login and test appointment creation

## Support

For any issues:
1. Check browser console for frontend errors
2. Check backend logs for API errors
3. Verify database migration completed successfully
4. Ensure JWT token is valid in localStorage
