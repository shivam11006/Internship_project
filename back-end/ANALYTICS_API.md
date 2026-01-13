# Impact Analytics Engine - API Documentation

## Overview
The Impact Analytics Engine provides comprehensive admin-only endpoints for analyzing platform usage, user engagement, case management, and matching performance. All endpoints require `ADMIN` role authorization.

## Base URL
```
/api/analytics
```

## Authentication
All endpoints require:
- Valid JWT Bearer token
- User must have `ROLE_ADMIN`
- MDC logging includes username and endpoint for audit trails

## Endpoints

### 1. GET /api/analytics/overview
**Description:** Returns high-level platform analytics overview including user counts, case counts, match statistics, and system health.

**Authentication:** Required (ADMIN)

**Response:** `AnalyticsOverviewDTO`

**Response Fields:**
```json
{
  "totalUsers": 150,
  "totalCases": 342,
  "totalMatches": 1205,
  "totalAppointments": 450,
  "newUsersThisMonth": 25,
  "newCasesThisMonth": 45,
  "newMatchesThisMonth": 180,
  "usersByRole": {
    "LAWYER": 80,
    "NGO": 45,
    "CITIZEN": 20,
    "ADMIN": 5
  },
  "usersByApprovalStatus": {
    "PENDING": 12,
    "APPROVED": 135,
    "REJECTED": 3
  },
  "casesByStatus": {
    "OPEN": 120,
    "ASSIGNED": 150,
    "CLOSED": 72
  },
  "casesByPriority": {
    "HIGH": 85,
    "MEDIUM": 180,
    "LOW": 77
  },
  "matchesByStatus": {
    "PENDING": 200,
    "ACCEPTED_BY_PROVIDER": 850,
    "REJECTED_BY_CITIZEN": 120,
    "REJECTED_BY_PROVIDER": 35
  },
  "topExpertiseTags": [
    "Family Law",
    "Criminal Law",
    "Property Law",
    "Labor Law",
    "Constitutional Law"
  ],
  "systemHealthScore": 87.5,
  "lastUpdated": "2026-01-13T10:30:00"
}
```

**Example Request:**
```bash
curl -X GET "http://localhost:8080/api/analytics/overview" \
  -H "Authorization: Bearer <jwt-token>"
```

---

### 2. GET /api/analytics/users
**Description:** Detailed user analytics including demographics, growth trends, approval metrics, engagement rates, and geographic distribution.

**Authentication:** Required (ADMIN)

**Response:** `AnalyticsUsersDTO`

**Response Fields:**
```json
{
  "totalUsers": 150,
  "totalLawyers": 80,
  "totalNgos": 45,
  "totalCitizens": 20,
  "pendingApprovals": 12,
  "approvedUsers": 135,
  "rejectedUsers": 3,
  "reapprovalPendingUsers": 0,
  "usersByLocation": {
    "New York": 45,
    "Los Angeles": 28,
    "Chicago": 22,
    "Houston": 18,
    "Phoenix": 15,
    "Philadelphia": 12,
    "San Antonio": 10
  },
  "topLocations": [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Phoenix"
  ],
  "userGrowthTrend": [
    {
      "period": "Monthly",
      "timestamp": "2025-01-13T00:00:00",
      "count": 8,
      "percentageChange": 5.6,
      "trend": "UP"
    }
  ],
  "lawyerGrowthTrend": [...],
  "ngoGrowthTrend": [...],
  "activeUsersThisMonth": 142,
  "activeUsersThisWeek": 98,
  "activeUsersToday": 45,
  "userRetentionRate": 89.5,
  "averageUserLifetime": 145.3,
  "approvalRate": 90.0,
  "rejectionRate": 2.0,
  "averageApprovalTime": 3,
  "lastUpdated": "2026-01-13T10:30:00"
}
```

**Key Metrics:**
- **Active Users:** Users with login activity in the specified timeframe
- **Retention Rate:** Percentage of users active in current period vs. previous period
- **Average Approval Time:** Days from user creation to approval
- **Top Locations:** Geographic breakdown of user distribution

**Example Request:**
```bash
curl -X GET "http://localhost:8080/api/analytics/users" \
  -H "Authorization: Bearer <jwt-token>"
```

---

### 3. GET /api/analytics/cases
**Description:** Detailed case analytics including status distribution, priority breakdown, expertise tag analysis, trends, and resolution metrics.

**Authentication:** Required (ADMIN)

**Response:** `AnalyticsCasesDTO`

**Response Fields:**
```json
{
  "totalCases": 342,
  "openCases": 120,
  "assignedCases": 150,
  "closedCases": 72,
  "pendingMatchCases": 0,
  "casesByStatus": {
    "OPEN": 120,
    "ASSIGNED": 150,
    "CLOSED": 72
  },
  "casesByPriority": {
    "HIGH": 85,
    "MEDIUM": 180,
    "LOW": 77
  },
  "casesByType": {
    "Family Law": 95,
    "Criminal Law": 78,
    "Property Law": 62,
    "Labor Law": 52,
    "Constitutional Law": 45,
    "Other": 10
  },
  "casesByLocation": {
    "New York": 68,
    "Los Angeles": 52,
    "Chicago": 41,
    "Houston": 38,
    "Phoenix": 35
  },
  "topCaseLocations": [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Phoenix"
  ],
  "casesByExpertiseTag": {
    "Family Law": 95,
    "Criminal Defense": 78,
    "Property Rights": 62,
    "Labor Rights": 52,
    "Constitutional Law": 45
  },
  "mostRequestedExpertiseTags": [
    "Family Law",
    "Criminal Defense",
    "Property Rights",
    "Labor Rights",
    "Constitutional Law"
  ],
  "leastRequestedExpertiseTags": [
    "Maritime Law",
    "Patent Law",
    "Admiralty Law",
    "International Law",
    "Tax Law"
  ],
  "casesCreatedTrend": [...],
  "casesClosedTrend": [...],
  "casesByPriorityTrend": [...],
  "averageCaseAge": 45,
  "medianCaseAge": 38,
  "averageResolutionTime": 52,
  "caseResolutionRate": 21.05,
  "lastUpdated": "2026-01-13T10:30:00"
}
```

**Key Metrics:**
- **Case Age:** Days since case creation
- **Resolution Time:** Days from case creation to closure
- **Resolution Rate:** Percentage of closed cases vs. total cases
- **Expertise Tags:** Analysis of required specializations

**Example Request:**
```bash
curl -X GET "http://localhost:8080/api/analytics/cases" \
  -H "Authorization: Bearer <jwt-token>"
```

---

### 4. GET /api/analytics/matches
**Description:** Detailed match analytics including quality metrics, acceptance rates, geographic distribution, and matching performance trends.

**Authentication:** Required (ADMIN)

**Response:** `AnalyticsMatchesDTO`

**Response Fields:**
```json
{
  "totalMatches": 1205,
  "pendingMatches": 200,
  "acceptedMatches": 850,
  "rejectedMatches": 155,
  "matchesByStatus": {
    "PENDING": 200,
    "ACCEPTED_BY_PROVIDER": 850,
    "REJECTED_BY_CITIZEN": 120,
    "REJECTED_BY_PROVIDER": 35
  },
  "averageMatchScore": 78.5,
  "highQualityMatchesPercentage": 65.3,
  "mediumQualityMatchesPercentage": 28.9,
  "lowQualityMatchesPercentage": 5.8,
  "matchesByLocation": {
    "New York": 245,
    "Los Angeles": 185,
    "Chicago": 168,
    "Houston": 145,
    "Phoenix": 135
  },
  "topMatchLocations": [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Phoenix"
  ],
  "matchesGeneratedTrend": [...],
  "matchesAcceptedTrend": [...],
  "matchesRejectedTrend": [...],
  "acceptanceRate": 70.45,
  "rejectionRate": 12.86,
  "pendingRate": 16.59,
  "averageTimeToAcceptance": 2,
  "averageTimeToRejection": 1,
  "matchRatioPerCase": 3.52,
  "lastUpdated": "2026-01-13T10:30:00"
}
```

**Key Metrics:**
- **Match Quality Tiers:**
  - High Quality: Score > 0.7 (70%)
  - Medium Quality: Score 0.4-0.7 (40-70%)
  - Low Quality: Score < 0.4 (less than 40%)
- **Acceptance Rate:** Percentage of accepted matches
- **Match Ratio:** Average number of matches per case
- **Time to Decision:** Average days to acceptance/rejection

**Example Request:**
```bash
curl -X GET "http://localhost:8080/api/analytics/matches" \
  -H "Authorization: Bearer <jwt-token>"
```

---

### 5. GET /api/analytics/activity
**Description:** Platform activity analytics including appointment statistics, chat activity, engagement rates, and notification metrics.

**Authentication:** Required (ADMIN)

**Response:** `AnalyticsActivityDTO`

**Response Fields:**
```json
{
  "totalAppointments": 450,
  "appointmentsThisMonth": 156,
  "appointmentsThisWeek": 42,
  "appointmentsToday": 8,
  "completedAppointments": 385,
  "cancelledAppointments": 45,
  "rescheduleCount": 72,
  "totalChatMessages": 3240,
  "messagesThisMonth": 945,
  "activeConversations": 285,
  "appointmentBookingTrend": [...],
  "chatActivityTrend": [...],
  "caseSubmissionTrend": [...],
  "activityByUserRole": {
    "LAWYER": 98,
    "NGO": 45,
    "CITIZEN": 15
  },
  "peakHourActivityPercentage": 28.5,
  "peakActivityHours": [
    "9-10",
    "14-15",
    "18-19"
  ],
  "activityByLocation": {
    "New York": 125,
    "Los Angeles": 98,
    "Chicago": 85,
    "Houston": 72,
    "Phoenix": 65
  },
  "mostActiveLocations": [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Phoenix"
  ],
  "averageResponseTime": 45,
  "averageCaseReviewTime": 24,
  "averageMatchDecisionTime": 48,
  "lawyerEngagementRate": 92.5,
  "ngoEngagementRate": 88.9,
  "citizenEngagementRate": 75.0,
  "totalNotificationsSent": 2840,
  "notificationsThisMonth": 845,
  "notificationsByType": {
    "MATCH_UPDATE": 450,
    "APPOINTMENT": 280,
    "MESSAGE": 185,
    "CASE_STATUS": 125,
    "OTHER": 50
  },
  "lastUpdated": "2026-01-13T10:30:00"
}
```

**Key Metrics:**
- **Response Time:** Average minutes to respond to messages
- **Engagement Rate:** Percentage of role-based users active in past month
- **Peak Hours:** Times with highest activity
- **Notification Breakdown:** Distribution of notification types

**Example Request:**
```bash
curl -X GET "http://localhost:8080/api/analytics/activity" \
  -H "Authorization: Bearer <jwt-token>"
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing JWT token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "User must have ADMIN role to access analytics"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Failed to generate analytics",
  "timestamp": "2026-01-13T10:30:00"
}
```

---

## Data Types

### AnalyticsTrendDTO
```json
{
  "period": "Monthly",
  "timestamp": "2025-12-13T00:00:00",
  "count": 12,
  "percentageChange": 8.5,
  "trend": "UP"
}
```

**Fields:**
- `period`: "Daily", "Weekly", or "Monthly"
- `timestamp`: LocalDateTime of the period
- `count`: Numeric value for the period
- `percentageChange`: Percentage change from previous period
- `trend`: "UP", "DOWN", or "STABLE"

---

## Usage Examples

### Python Example
```python
import requests
import json

API_BASE = "http://localhost:8080/api/analytics"
HEADERS = {"Authorization": f"Bearer {jwt_token}"}

# Get overview analytics
response = requests.get(f"{API_BASE}/overview", headers=HEADERS)
overview = response.json()
print(f"System Health Score: {overview['systemHealthScore']}")

# Get users analytics
response = requests.get(f"{API_BASE}/users", headers=HEADERS)
users = response.json()
print(f"Active Users This Month: {users['activeUsersThisMonth']}")

# Get matches analytics
response = requests.get(f"{API_BASE}/matches", headers=HEADERS)
matches = response.json()
print(f"Average Match Score: {matches['averageMatchScore']}")
```

### JavaScript Example
```javascript
async function fetchAnalytics(endpoint, token) {
  const response = await fetch(`/api/analytics/${endpoint}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
  }
  
  return response.json();
}

// Usage
const overview = await fetchAnalytics('overview', jwtToken);
console.log(`System Health: ${overview.systemHealthScore}%`);

const users = await fetchAnalytics('users', jwtToken);
console.log(`Total Users: ${users.totalUsers}`);

const cases = await fetchAnalytics('cases', jwtToken);
console.log(`Case Resolution Rate: ${cases.caseResolutionRate}%`);
```

---

## Rate Limiting
Currently, there are no rate limits on analytics endpoints. However, all requests are logged for audit purposes.

## Performance Notes
- All endpoints perform full data scans from repositories
- For large datasets (>10,000 records), responses may take 2-5 seconds
- Consider caching analytics results on the frontend for frequently accessed data
- Recommended refresh interval: 5-10 minutes

## Audit Logging
All analytics requests are logged with:
- Username (from JWT token)
- Endpoint accessed
- Timestamp
- Request/response status

Log entries are stored in `ApplicationLog` table for compliance tracking.

---

## Future Enhancements
1. **Date Range Filtering:** Add optional query parameters for custom date ranges
2. **Comparison Analytics:** Compare metrics between time periods
3. **Custom Dashboards:** Allow admins to save custom analytics views
4. **Export Functionality:** Export analytics data to CSV/Excel
5. **Real-time Metrics:** WebSocket-based real-time analytics updates
6. **Predictive Analytics:** ML-based forecasting of trends
7. **Alerting System:** Automatic alerts for critical metrics
