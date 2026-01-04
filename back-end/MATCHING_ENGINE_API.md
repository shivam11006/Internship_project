# Matching Engine API Documentation

## Overview
The matching engine automatically matches legal cases with lawyers and NGOs based on expertise, location, and language preferences.

**Privacy Protection:** Full case details (description, evidence, citizen contact) are only visible to providers **after** the citizen selects them. Before selection, providers only see basic case information. 

## Workflow
1. **Citizen generates matches** - Call the generate API to find suitable lawyers/NGOs for the case
2. **Review match results** - The API returns top matches sorted by score
3. **Citizen selects best match** - Citizen chooses a lawyer/NGO from the results
4. **Provider receives assignment** - Selected lawyer/NGO sees the case in their assigned cases
5. **Provider responds** - Lawyer/NGO accepts or declines the case assignment

## Endpoints

### 1. Generate Matches for a Case (Citizen Only)
**POST** `/api/matches/case/{caseId}/generate?limit={n}`

Generates new matches for a specific case by evaluating all approved lawyers and NGOs. Returns matches sorted by score (highest first).

**Query Parameters:**
- `limit` (optional): Number of top matches to return. If not specified, returns all matches.
  - Example: `?limit=3` returns top 3 matches
  - Example: `?limit=10` returns top 10 matches
  - No limit parameter returns all matches

**Response Example (with ?limit=3):**
```json
{
  "totalMatches": 3,
  "matches": [
    {
      "id": 1,
      "caseId": 5,
      "caseTitle": "Property Dispute Case",
      "caseType": "PROPERTY",
      "caseLocation": "Hyderabad",
      "providerId": 30,
      "providerName": "Jane Lawyer",
      "providerType": "LAWYER",
      "providerSpecialization": "PROPERTY",
      "providerLocation": "Hyderabad",
      "status": "PENDING",
      "matchScore": 96.0,
      "matchReason": "Expertise matches case type, Same location, Verified provider",
      "rejectionReason": null,
      "createdAt": "2026-01-01T10:00:00",
      "acceptedAt": null,
      "rejectedAt": null
    },
    {
      "id": 2,
      "caseId": 5,
      "providerId": 31,
      "providerName": "Another Lawyer",
      "providerType": "LAWYER",
      "matchScore": 85.0,
      "status": "PENDING"
    },
    {
      "id": 3,
      "caseId": 5,
      "providerId": 32,
      "providerName": "Third Lawyer",
      "providerType": "LAWYER",
      "matchScore": 75.0,
      "status": "PENDING"
    }
  ],
  "message": "5 new matches generated. Returning top 3 of 10 total matches"
}
```

**Note:** The response returns only the limited number of matches, but the message shows how many were created and the total available.

---

### 2. Select Match (Citizen Only)
**POST** `/api/matches/{matchId}/select`

Citizen selects a specific lawyer/NGO for their case from the available matches.

**Response:**
```json
{
  "id": 1,
  "status": "SELECTED_BY_CITIZEN",
  "updatedAt": "2026-01-01T10:30:00",
  ...
}
```

---

### 4. Reject Match (Citizen Only)
**POST** `/api/matches/{matchId}/reject`

Citizen rejects a match with an optional reason.

**Request Body:**
```json
{
  "reason": "Looking for someone with more experience"
}
```

**Response:**
```json
{
  "id": 1,
  "status": "REJECTED_BY_CITIZEN",
  "rejectedAt": "2026-01-01T10:30:00",
  "rejectionReason": "Looking for someone with more experience",
  ...
}
```

---

### 5. Get Assigned Cases (Lawyer/NGO Only)
**GET** `/api/matches/assigned-cases`

Returns all cases where citizens have selected this lawyer or NGO. Includes full case details, evidence attachments, and citizen contact information.

**Response:**
```json
[
  {
    "id": 1,
    "caseId": 5,
    "caseTitle": "Property Dispute Case",
    "caseType": "PROPERTY",
    "caseLocation": "Hyderabad",
    "caseDescription": "Detailed description of the property dispute...",
    "casePriority": "HIGH",
    "preferredLanguage": "English",
    "expertiseTags": ["property law", "real estate"],
    "attachments": [
      {
        "id": 1,
        "fileName": "property_deed.pdf",
        "fileType": "application/pdf",
        "fileSize": 245632
      },
      {
        "id": 2,
        "fileName": "dispute_letter.pdf",
        "fileType": "application/pdf",
        "fileSize": 128456
      }
    ],
    "citizenName": "John Doe",
    "citizenEmail": "john@example.com",
    "citizenPhone": "+91-9876543210",
    "providerId": 30,
    "providerName": "Jane Lawyer",
    "providerType": "LAWYER",
    "status": "SELECTED_BY_CITIZEN",
    "matchScore": 96.0,
    "createdAt": "2026-01-01T10:00:00"
  }
]
```

**Note:** Full case details (description, attachments, citizen contact info) are only shown for matches with status `SELECTED_BY_CITIZEN` or `ACCEPTED_BY_PROVIDER`.

---

### 6. Accept Case Assignment (Lawyer/NGO Only)
**POST** `/api/matches/{matchId}/accept-assignment`

Accept a case that a citizen has selected you for.

**Response:**
```json
{
  "id": 1,
  "status": "ACCEPTED_BY_PROVIDER",
  "acceptedAt": "2026-01-01T11:00:00",
  ...
}
```

---

### 7. Download Case Attachment (Lawyer/NGO Only)
**GET** `/api/matches/case/{caseId}/attachment/{attachmentId}`

Download a specific evidence attachment for an assigned case. Only accessible if the provider has been selected for the case.

**Path Parameters:**
- `caseId` - The case ID
- `attachmentId` - The attachment ID (from the attachments array)

**Response:**
- Returns the file content with appropriate headers
- Content-Type: Based on file type (application/pdf, image/jpeg, etc.)
- Content-Disposition: attachment with original filename

**Access Control:**
- Only lawyers/NGOs who have been selected for the case can download attachments
- Match status must be `SELECTED_BY_CITIZEN` or `ACCEPTED_BY_PROVIDER`

---

### 8. Decline Case Assignment (Lawyer/NGO Only)
**POST** `/api/matches/{matchId}/decline-assignment`

Decline a case that a citizen has selected you for, with an optional reason.

**Request Body:**
```json
{
  "reason": "Schedule conflict - too busy with current cases"
}
```

**Response:**
```json
{
  "id": 1,
  "status": "REJECTED_BY_PROVIDER",
  "rejectedAt": "2026-01-01T11:00:00",
  "rejectionReason": "Schedule conflict - too busy with current cases",
  ...
}
```

---

## Matching Algorithm

The matching engine uses a weighted scoring system (max 100 points):

1. **Expertise/Focus Area Match (40 points max)**
   - Perfect match: Case type matches provider's specialization/focus area
   - Partial match: Expertise tags match
   - Minimal: Provider has some relevant experience

2. **Location Match (30 points max)**
   - Exact match: Same city/location
   - Partial match: Same state or region
   - No match: Different locations

3. **Language Match (20 points max)**
   - Perfect match: Provider speaks preferred language
   - No match: Language not available

4. **Verification Status (10 points)**
   - Approved providers get full points

**Example Score Breakdown:**
- Jane Lawyer: 96 points
  - Expertise: 40 (Perfect match - PROPERTY)
  - Location: 30 (Exact - Hyderabad)
  - Language: 20 (Speaks preferred language)
  - Verification: 10 (Approved)
  - **Total: 100** (capped at 100)

- Abhi Chimmili: 40 points
  - Expertise: 10 (Different specialization)
  - Location: 20 (Same city, partial match)
  - Language: 5 (No language match)
  - Verification: 10 (Approved)
  - **Total: 45**

---

## Testing with cURL

### Generate Matches - Get All (Citizen)
```bash
curl -X POST http://localhost:8080/api/matches/case/1/generate \
  -H "Authorization: Bearer CITIZEN_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Generate Matches - Get Top 3 (Citizen)
```bash
curl -X POST "http://localhost:8080/api/matches/case/1/generate?limit=3" \
  -H "Authorization: Bearer CITIZEN_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Generate Matches - Get Top 5 (Citizen)
```bash
curl -X POST "http://localhost:8080/api/matches/case/1/generate?limit=5" \
  -H "Authorization: Bearer CITIZEN_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Select Match (Citizen)
```bash
curl -X POST http://localhost:8080/api/matches/1/select \
  -H "Authorization: Bearer CITIZEN_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Reject Match (Citizen)
```bash
curl -X POST http://localhost:8080/api/matches/1/reject \
  -H "Authorization: Bearer CITIZEN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Looking for more experience"}'
```

### Get Assigned Cases (Lawyer/NGO)
```bash
curl -X GET http://localhost:8080/api/matches/assigned-cases \
  -H "Authorization: Bearer LAWYER_OR_NGO_JWT_TOKEN"
```

### Accept Case Assignment (Lawyer/NGO)
```bash
curl -X POST http://localhost:8080/api/matches/1/accept-assignment \
  -H "Authorization: Bearer LAWYER_OR_NGO_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Download Case Attachment (Lawyer/NGO)
```bash
curl -X GET http://localhost:8080/api/matches/case/5/attachment/1 \
  -H "Authorization: Bearer LAWYER_OR_NGO_JWT_TOKEN" \
  -o property_deed.pdf
```

### Decline Case Assignment (Lawyer/NGO)
```bash
curl -X POST http://localhost:8080/api/matches/1/decline-assignment \
  -H "Authorization: Bearer LAWYER_OR_NGO_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Not available at this time"}'
```

---

## Database Schema

The matching engine uses the existing `matches` table:

```sql
CREATE TABLE matches (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    case_id BIGINT NOT NULL,
    lawyer_id BIGINT,
    ngo_id BIGINT,
    status VARCHAR(30) NOT NULL, -- PENDING, SELECTED_BY_CITIZEN, ACCEPTED_BY_PROVIDER, REJECTED_BY_CITIZEN, REJECTED_BY_PROVIDER, EXPIRED
    match_score DOUBLE NOT NULL,
    match_reason VARCHAR(1000),
    rejection_reason VARCHAR(1000),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    accepted_at TIMESTAMP,
    rejected_at TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (lawyer_id) REFERENCES users(id),
    FOREIGN KEY (ngo_id) REFERENCES users(id)
);
```

---

## Features

✅ **Automatic Matching**: Intelligent algorithm matches cases with the most suitable providers
✅ **Duplicate Prevention**: Prevents creating duplicate matches for the same case-provider pair
✅ **Weighted Scoring**: Multi-factor scoring considers expertise, location, and language
✅ **Top N Results**: Use `limit` parameter to get only the best matches
✅ **Sorted by Score**: Results always sorted from highest to lowest score
✅ **Full Case Access**: Selected providers get complete case details, evidence, and citizen contact info
✅ **Evidence Download**: Providers can download all case attachments/documents
✅ **Citizen Control**: Citizens select which lawyer/NGO they want to work with
✅ **Provider Choice**: Lawyers/NGOs can accept or decline case assignments
✅ **Access Control**: Providers only see full details after being selected by citizen
✅ **Match Management**: Full workflow from generation to final acceptance
✅ **Comprehensive Logging**: All actions are logged for audit trails
✅ **RESTful API**: Clean REST endpoints following best practices

---

## Frequently Asked Questions

### Q: How do I get only the top 3 matches?
A: Use the `limit` parameter: `POST /api/matches/case/123/generate?limit=3`

### Q: Why do matches show old lawyer details?
A: The match data is stored at the time of generation. To get updated provider info, generate new matches.

### Q: What's the difference between totalMatches and the message?
A: `totalMatches` shows how many matches are returned in the response. The message shows how many were newly created and the total available in the database.

### Q: Can I regenerate matches for the same case?
A: Yes! The system prevents duplicates. If you call generate again, it will:
- Skip providers that already have matches
- Create matches for any new approved providers
- Return the limited set of top matches

### Q: How are matches scored?
A: Matches are scored 0-100 based on:
- Expertise match (40 points)
- Location match (30 points)
- Language match (20 points)
- Verification status (10 points)

### Q: What happens after I select a match?
A: The match status changes to `SELECTED_BY_CITIZEN` and the lawyer/NGO can see it in their assigned cases with full details including:
- Complete case description
- All evidence attachments
- Your contact information (name, email, phone)
- Priority level and preferred language

### Q: Can lawyers/NGOs see my case details before I select them?
A: No. Before selection, providers only see basic information (case title, type, location). Full details, evidence, and your contact info are only revealed after you select them.

### Q: How do lawyers/NGOs download evidence files?
A: After being selected, they use the download attachment endpoint: `/api/matches/case/{caseId}/attachment/{attachmentId}`
