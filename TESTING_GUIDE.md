# Quick Testing Guide for Appointment Scheduling

## Prerequisites
1. **Backend running**: `http://localhost:8080`
2. **Frontend running**: Default port (usually 3000 or 5173)
3. **Database migration applied**: Run the SQL script first

## Database Migration

```bash
# Option 1: Using psql
psql -U postgres -d legalaid_db -f back-end/add_appointment_type_migration.sql

# Option 2: Using pgAdmin
# - Connect to your database
# - Open Query Tool
# - Paste and execute the SQL from add_appointment_type_migration.sql
```

## Start Backend
```bash
cd back-end
mvn clean install
mvn spring-boot:run
```

## Start Frontend
```bash
cd front-end/legal-aid-matching-platform
npm install
npm run dev
```

## Test Steps

### 1. Login as Citizen
- Email: (use existing citizen account)
- Password: (your password)

### 2. Navigate to Secure Chat
- Click on "Secure Chat" in sidebar
- Select a conversation with a matched provider

### 3. Test CALL Appointment
1. Click the calendar icon (schedule button)
2. Select "📞 Call" appointment type
3. Choose date (tomorrow or later)
4. Select time slot or enter custom time
5. Enter meeting platform (e.g., "Zoom", "Google Meet") - optional
6. Add notes/agenda - optional
7. Click "Confirm Appointment"

**Expected Result:**
- Success alert: "Appointment scheduled successfully! Status: Awaiting provider's approval"
- Modal closes
- No errors in console

### 4. Test OFFLINE Appointment
1. Click the calendar icon again
2. Select "🏢 Offline Meeting" appointment type
3. Choose date
4. Select time
5. **Enter venue** (required) - e.g., "City Legal Aid Center"
6. Enter location (optional) - e.g., "Downtown"
7. Enter address (optional) - e.g., "123 Main Street"
8. Add notes/agenda - optional
9. Click "Confirm Appointment"

**Expected Result:**
- Success alert with appointment status
- Modal closes
- Check backend logs for appointment creation

### 5. Validation Tests

#### Missing Venue (Offline)
1. Select "Offline Meeting"
2. Choose date and time
3. Leave venue empty
4. Click confirm
- **Expected**: Error message "Please provide a venue for offline meeting"

#### Missing Date/Time
1. Select any type
2. Leave date or time empty
3. Click confirm
- **Expected**: Error message "Please select date and time"

## Backend API Testing (Optional)

### Using cURL or Postman

```bash
# Get JWT token first (from login)
TOKEN="your_jwt_token_here"

# Create CALL appointment
curl -X POST http://localhost:8080/api/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": 1,
    "scheduledDateTime": "2026-01-15T10:30:00",
    "appointmentTime": "10:30:00",
    "appointmentType": "CALL",
    "venue": "Zoom Meeting",
    "notes": "Initial consultation",
    "agenda": "Discuss case details"
  }'

# Create OFFLINE appointment
curl -X POST http://localhost:8080/api/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": 1,
    "scheduledDateTime": "2026-01-15T14:00:00",
    "appointmentTime": "14:00:00",
    "appointmentType": "OFFLINE",
    "venue": "City Legal Aid Center",
    "location": "Downtown",
    "address": "123 Main Street, Suite 400",
    "notes": "Bring all relevant documents",
    "agenda": "Case overview and document review"
  }'

# Get all appointments
curl -X GET http://localhost:8080/api/appointments/my \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### Error: "authService.getToken is not a function"
**Cause**: Old browser cache
**Solution**: 
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Clear localStorage: Open DevTools > Application > Local Storage > Clear All

### Error: "Cannot create appointment: Match must be accepted by provider"
**Cause**: The match hasn't been accepted yet
**Solution**: 
1. Login as the provider (lawyer/NGO)
2. Accept the match first
3. Then create appointment

### Error: Database column not found
**Cause**: Migration not applied
**Solution**: Run the SQL migration script again

### Backend won't start
**Cause**: Compilation errors
**Solution**:
```bash
cd back-end
mvn clean compile
# Check for any compilation errors
```

### Frontend shows old version
**Solution**:
```bash
# Stop the dev server
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Verification Checklist

- [ ] Database migration successful
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can login as citizen
- [ ] Schedule modal opens
- [ ] Can switch between CALL and OFFLINE types
- [ ] Venue field changes based on type
- [ ] Location/Address only show for OFFLINE
- [ ] Can create CALL appointment
- [ ] Can create OFFLINE appointment
- [ ] Validation works correctly
- [ ] Success message appears
- [ ] No console errors
- [ ] Backend logs show appointment creation

## Common Issues

### 1. Token Expiration
**Symptom**: 401 errors after some time
**Solution**: Login again to get fresh token

### 2. CORS Errors
**Check**: Backend CORS configuration allows frontend origin

### 3. Time Format Issues
**Check**: Ensure time is in HH:mm format (24-hour)

### 4. Date in Past
**Check**: Selected date should be today or future

## Success Indicators

✅ **Backend**: 
- Log shows: "Appointment created successfully: ID X"
- Response status: 200 OK
- Returns AppointmentResponse with appointmentType field

✅ **Frontend**:
- Alert shows success message
- Modal closes automatically
- No red errors in browser console
- Network tab shows 200 response

✅ **Database**:
```sql
-- Check latest appointment
SELECT id, appointment_type, venue, scheduled_date_time, status 
FROM appointments 
ORDER BY created_at DESC 
LIMIT 5;
```

## Next Steps After Testing

1. **Add to Provider Dashboards**: Similar functionality for lawyers and NGOs
2. **Appointment Management**: View, edit, cancel appointments
3. **Notifications**: Email/SMS reminders
4. **Calendar Integration**: Export to Google Calendar, Outlook
5. **Video Call Links**: Auto-generate meeting links for CALL appointments
