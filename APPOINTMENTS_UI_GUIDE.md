# Appointments UI Documentation

## Overview
The MyAppointments component is a comprehensive UI for managing legal consultation appointments between Citizens and Providers (Lawyers/NGOs). It provides a full-featured interface for viewing, accepting, rescheduling, and canceling appointments.

## Features

### 1. **Multiple View Filters**
- **All Appointments**: View all your appointments
- **Upcoming**: See only future appointments
- **Pending Action**: Shows appointments requiring your response (with badge counter)
- **Past**: View completed or past appointments

### 2. **Appointment Details Display**
Each appointment card shows:
- Case title and appointment type (Call/In-Person)
- Status badge with color coding
- Date and time information
- Venue/meeting link details
- Location and address (for offline meetings)
- Provider/Citizen information
- Duration
- Status description
- Action required alerts

### 3. **Actions Available**

#### **Accept Appointment**
- Citizens can accept appointments created by providers
- Providers can accept appointments created by citizens
- Changes status to CONFIRMED

#### **Request Reschedule**
- Either party can request a different time
- Includes:
  - Preferred date picker
  - Preferred time picker
  - Reason dropdown (Schedule conflict, Emergency, Illness, etc.)
  - Optional additional message
- Notifies the other party for approval

#### **Cancel Appointment**
- Either party can cancel with a reason
- Changes status to CANCELLED
- Requires cancellation reason input

### 4. **Detailed View Modal**
Click "View Details" to see complete information:
- Full appointment details
- Complete contact information
- Meeting agenda
- Notes from appointment creator
- Location/address/meeting link
- Creation timestamp and creator
- All available actions in one place

### 5. **Responsive Design**
- Mobile-friendly layout
- Touch-optimized buttons
- Collapsible sections for small screens
- Print-friendly styles

## User Interface Components

### Status Indicators
- **CONFIRMED**: Green badge - Appointment is confirmed by both parties
- **PENDING_CITIZEN_APPROVAL**: Yellow badge - Waiting for citizen to accept
- **PENDING_PROVIDER_APPROVAL**: Yellow badge - Waiting for provider to accept
- **RESCHEDULE_REQUESTED**: Orange badge - Someone requested a reschedule
- **CANCELLED**: Red badge - Appointment was cancelled
- **COMPLETED**: Blue badge - Appointment was successfully completed
- **NO_SHOW**: Dark red badge - One or both parties did not attend

### Action Buttons
- **✓ Accept** (Green): Accept the appointment
- **🔄 Request Reschedule** (Orange): Ask to change the time
- **✕ Cancel** (Red): Cancel the appointment
- **View Details** (Blue): See complete information

## API Integration

The component uses the `appointmentService.js` which provides these methods:

### Fetch Appointments
```javascript
appointmentService.getMyAppointments()      // All appointments
appointmentService.getUpcomingAppointments() // Future appointments
appointmentService.getPendingAppointments()  // Requiring action
appointmentService.getPastAppointments()     // Past appointments
```

### Actions
```javascript
appointmentService.confirmAppointment(id)    // Citizen accepts
appointmentService.acceptAppointment(id)     // Provider accepts
appointmentService.requestReschedule(id, data) // Request new time
appointmentService.cancelAppointment(id, reason) // Cancel
```

## Usage

### 1. **Add to Navigation**
In your dashboard components, add a link to appointments:

```jsx
import { Link } from 'react-router-dom';

<Link to="/appointments">
  📅 My Appointments
</Link>
```

### 2. **Access Directly**
Navigate to `/appointments` when logged in:
```
http://localhost:5173/appointments
```

### 3. **Integration in Dashboards**
You can also integrate appointment sections directly in dashboards:

```jsx
import MyAppointments from './MyAppointments';

// In your dashboard component
<MyAppointments />
```

## Workflow Examples

### Example 1: Citizen Accepts Provider's Appointment
1. Provider creates appointment → Status: PENDING_CITIZEN_APPROVAL
2. Citizen sees it in "Pending Action" tab
3. Citizen clicks "View Details" or "Accept"
4. Status changes to CONFIRMED
5. Both parties can now see full details

### Example 2: Requesting a Reschedule
1. User views confirmed appointment
2. Clicks "Request Reschedule"
3. Fills in:
   - New preferred date
   - New preferred time
   - Reason (e.g., "Schedule conflict")
   - Optional message
4. Submits request
5. Status changes to RESCHEDULE_REQUESTED
6. Other party receives notification and can accept/decline

### Example 3: Filtering and Managing
1. User logs in and navigates to `/appointments`
2. Sees badge on "Pending Action" tab (e.g., "3" appointments)
3. Clicks "Pending Action" to see only action-required items
4. Reviews and responds to each pending appointment
5. Badge count updates automatically

## Styling

The component uses `MyAppointments.css` which includes:
- Modern card-based design
- Gradient headers
- Status-based color coding
- Smooth animations and transitions
- Modal dialogs for detailed views
- Responsive grid layouts
- Print-friendly styles

### Color Scheme
- Primary Blue: `#3b82f6` - Main actions, headers
- Success Green: `#10b981` - Accept buttons, confirmed status
- Warning Orange: `#f59e0b` - Reschedule actions
- Danger Red: `#ef4444` - Cancel actions, errors
- Gray Tones: `#64748b`, `#e2e8f0` - Text, borders

## Accessibility Features

- Clear status indicators with text (not just colors)
- High contrast text and backgrounds
- Keyboard navigation support
- Focus indicators on interactive elements
- Screen reader friendly labels
- Clear error messages
- Confirmation prompts for destructive actions

## Error Handling

The component handles:
- Network errors with retry button
- Empty states with helpful messages
- Loading states with spinner
- API errors with clear messages
- Validation for reschedule forms
- Confirmation for cancellations

## Backend Requirements

Ensure these API endpoints are available:
- `GET /api/appointments/my` - Get all user's appointments
- `GET /api/appointments/upcoming` - Get upcoming appointments
- `GET /api/appointments/pending` - Get pending appointments
- `GET /api/appointments/past` - Get past appointments
- `POST /api/appointments/{id}/confirm` - Citizen accepts
- `POST /api/appointments/{id}/accept` - Provider accepts
- `POST /api/appointments/{id}/request-reschedule` - Request reschedule
- `POST /api/appointments/{id}/cancel` - Cancel appointment

## Security

- JWT authentication required for all requests
- User can only see their own appointments
- Role-based access control (Citizen vs Provider actions)
- Authorization token automatically included in requests
- Secure data transmission

## Future Enhancements

Potential improvements:
- Calendar view option
- Email/SMS notifications
- Appointment reminders
- Video call integration
- Document sharing during appointments
- Appointment notes/outcomes
- Rating system after completion
- Export appointments to calendar apps
- Bulk actions (accept/cancel multiple)
- Advanced filtering (by case type, provider, date range)

## Troubleshooting

### Appointments not loading
- Check backend server is running
- Verify JWT token is valid
- Check browser console for errors
- Ensure user is authenticated

### Actions not working
- Verify user has permission for the action
- Check appointment status allows the action
- Ensure backend endpoints are accessible
- Look for error messages in alerts

### Styling issues
- Verify MyAppointments.css is imported
- Check for CSS conflicts with other components
- Ensure all required CSS classes are present

## Testing Checklist

- [ ] Can view all appointments
- [ ] Filter tabs work correctly
- [ ] Badge counter shows correct count
- [ ] Can accept pending appointments
- [ ] Can request reschedule
- [ ] Can cancel appointments
- [ ] Modals open and close properly
- [ ] Form validation works
- [ ] Error states display correctly
- [ ] Empty states show appropriate messages
- [ ] Responsive on mobile devices
- [ ] Loading states appear during API calls
- [ ] Status badges show correct colors
- [ ] Action buttons are role-appropriate

## Support

For issues or questions:
1. Check the API documentation in `APPOINTMENT_SCHEDULING_API.md`
2. Review the backend implementation
3. Check browser console for errors
4. Verify authentication is working
5. Test API endpoints with Postman/curl

---

**Component File**: `MyAppointments.jsx`  
**Styles File**: `MyAppointments.css`  
**Service File**: `services/appointmentService.js`  
**Route**: `/appointments`
