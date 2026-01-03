# Matching Engine Implementation Summary

## ✅ Completed Components

### 1. **MatchService.java** - Core Matching Engine
Located: `back-end/src/main/java/com/example/legalaid_backend/service/MatchService.java`

**Key Features:**
- **Intelligent Scoring Algorithm**: Multi-factor scoring (0-100 points)
  - Expertise Match: 40 points max
  - Location Match: 30 points max
  - Language Match: 20 points max
  - Verification Status: 10 points max

- **Main Methods:**
  - `generateMatches(Long caseId)` - Creates matches for a case
  - `getMatchesForCase(Long caseId)` - Returns matches in simplified format
  - `acceptMatch(Long matchId)` - Provider accepts a match
  - `rejectMatch(Long matchId, String reason)` - Provider rejects a match
  - `getMyMatches()` - Returns matches for logged-in lawyer/NGO

- **Duplicate Prevention**: Checks if matches already exist before creating new ones
- **Access Control**: Ensures users can only access their own matches

### 2. **MatchController.java** - REST API Endpoints
Located: `back-end/src/main/java/com/example/legalaid_backend/controller/MatchController.java`

**Endpoints:**
- `POST /api/matches/case/{caseId}/generate?limit=N` - Generate and return top N matches
- `POST /api/matches/{matchId}/select` - Citizen selects a match
- `POST /api/matches/{matchId}/reject` - Citizen rejects a match
- `GET /api/matches/assigned-cases` - Get cases with full details (for selected providers)
- `GET /api/matches/case/{caseId}/attachment/{attachmentId}` - Download evidence file
- `POST /api/matches/{matchId}/accept-assignment` - Provider accepts assignment
- `POST /api/matches/{matchId}/decline-assignment` - Provider declines assignment

### 3. **MatchResultDTO.java** - Output Format
Located: `back-end/src/main/java/com/example/legalaid_backend/DTO/MatchResultDTO.java`

Simplified format for match listings.

### 4. **MatchResponse.java** - Detailed Response Format
Located: `back-end/src/main/java/com/example/legalaid_backend/DTO/MatchResponse.java`

Includes full case details when match is selected:
```json
{
  "id": 1,
  "caseId": 5,
  "caseTitle": "Property Dispute",
  "caseDescription": "Full description...",
  "casePriority": "HIGH",
  "attachments": [
    {
      "id": 1,
      "fileName": "evidence.pdf",
      "fileType": "application/pdf",
      "fileSize": 245632
    }
  ],
  "citizenName": "John Doe",
  "citizenEmail": "john@example.com",
  "citizenPhone": "+91-9876543210",
  "status": "SELECTED_BY_CITIZEN",
  ...
}
```

## 📊 Matching Algorithm Details

### Score Calculation Example

**Case Details:**
- Type: PROPERTY
- Location: Hyderabad
- Language: English
- Expertise Tags: ["property law", "real estate"]

**Provider 1: Jane Lawyer**
- Specialization: PROPERTY LAW
- Location: Hyderabad
- Languages: English, Hindi, Marathi
- Status: APPROVED
- **Score: 96 points**
  - Expertise: 40 (perfect match)
  - Location: 30 (exact match)
  - Language: 20 (speaks English)
  - Verification: 10 (approved)
  - **Total: 100** (capped at 100)

**Provider 2: Abhi Chimmili**
- Specialization: Family Law
- Location: Hyderabad
- Languages: Hindi
- Status: APPROVED
- **Score: 40 points**
  - Expertise: 10 (minimal match)
  - Location: 20 (same city)
  - Language: 5 (no match)
  - Verification: 10 (approved)
  - **Total: 45**

## 🔧 Integration Points

### Existing Code Used:
- ✅ `MatchRepository` - Already exists with all necessary queries
- ✅ `Match` entity - Already defined with all required fields
- ✅ `User` entity - With LawyerProfile and NgoProfile
- ✅ `Case` entity - With expertise tags and location
- ✅ `MatchStatus` enum - PENDING, ACCEPTED, REJECTED, EXPIRED
- ✅ `MatchResponse` DTO - For detailed match responses
- ✅ `GenerateMatchesResponse` DTO - For batch match responses

### New Code Added:
- ✅ `MatchService` - Complete matching engine
- ✅ `MatchController` - REST API endpoints
- ✅ `MatchResultDTO` - Simplified output format

## 🚀 How to Use

### For Citizens:
1. **Create a case** using existing case submission API
2. **Generate matches**: `POST /api/matches/case/{caseId}/generate?limit=3`
   - Use `limit` parameter to get top N matches (e.g., `?limit=3` for top 3)
   - Omit `limit` to get all matches
3. **Review match results** returned in the response
   - Matches are sorted by score (highest first)
   - Each match shows provider details and match score
4. **Select a match**: `POST /api/matches/{matchId}/select`
5. **Wait for provider** to accept or decline

### For Lawyers/NGOs:
1. View assigned matches: `GET /api/matches/assigned-cases`
   - After citizen selection, see **full case details** including:
     - Complete case description
     - Evidence attachments list
     - Citizen contact information
     - Priority and preferred language
2. Download evidence: `GET /api/matches/case/{caseId}/attachment/{attachmentId}`
3. Review case details and match score
4. Accept match: `POST /api/matches/{matchId}/accept-assignment`
5. Or decline: `POST /api/matches/{matchId}/decline-assignment` with reason

## 📝 Testing

### Sample Request (Generate Top 3 Matches):
```bash
POST http://localhost:8080/api/matches/case/1/generate?limit=3
Authorization: Bearer <JWT_TOKEN>
```

### Sample Response:
```json
{
  "totalMatches": 2,
  "matches": [
    {
      "id": 1,
      "providerId": 30,
      "providerName": "Jane Lawyer",
      "providerType": "LAWYER",
      "matchScore": 96.0,
      "status": "PENDING",
      "matchReason": "Expertise matches case type, Same location, Language: English, Verified provider"
    }
  ],
  "message": "2 new matches generated. Total matches: 2"
}
```

**Note:** The generate matches API now returns matches directly. Use `?limit=3` to get top 3 matches, `?limit=5` for top 5, etc.

## ✨ Key Features

1. **Smart Matching**: Algorithm scores 0-100 based on expertise, location, language, and verification
2. **Top N Results**: Use `?limit=3` to get only the best 3 matches (or any number)
3. **Auto-Sorted**: Results always sorted by score from highest to lowest
4. **Privacy Protection**: Full case details only visible after citizen selects a provider
5. **Evidence Access**: Selected providers can download all case attachments/documents
6. **Citizen Contact Info**: Providers receive contact details only after selection
7. **Duplicate Prevention**: Won't create duplicate matches for same case-provider pair
8. **Access Control**: Citizens see only their cases; Providers see only their assignments
9. **Status Tracking**: Complete lifecycle from PENDING → SELECTED → ACCEPTED/REJECTED
10. **Comprehensive Logging**: All actions logged for audit trails

## 🔍 Quick Start Guide

### Step 1: Test Generate Matches
```bash
curl -X POST "http://localhost:8080/api/matches/case/3/generate?limit=3" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 2: Review the Response
- Check `totalMatches` - shows how many returned
- Check `message` - shows total available in database
- Review match scores and provider details

### Step 3: Select a Match (Citizen)
```bash
curl -X POST "http://localhost:8080/api/matches/123/select" \
  -H "Authorization: Bearer CITIZEN_JWT_TOKEN"
```

### Step 4: Provider Accepts/Declines
```bash
# View assigned cases (includes full details)
curl -X GET "http://localhost:8080/api/matches/assigned-cases" \
  -H "Authorization: Bearer LAWYER_JWT_TOKEN"

# Download evidence attachment
curl -X GET "http://localhost:8080/api/matches/case/3/attachment/1" \
  -H "Authorization: Bearer LAWYER_JWT_TOKEN" \
  -o evidence.pdf

# Accept
curl -X POST "http://localhost:8080/api/matches/123/accept-assignment" \
  -H "Authorization: Bearer LAWYER_JWT_TOKEN"

# Decline
curl -X POST "http://localhost:8080/api/matches/123/decline-assignment" \
  -H "Authorization: Bearer LAWYER_JWT_TOKEN" \
  -d '{"reason": "Schedule conflict"}'
```

## 🔧 Integration Tips

1. **Always use limit parameter**: Get top 3-5 matches instead of all matches
2. **Show match scores**: Display the match percentage to users (score out of 100)
3. **Display match reason**: Show why the match was suggested
4. **Privacy first**: Don't show full case details until citizen selects a provider
5. **Evidence preview**: Show attachment list (filename, type, size) before download
6. **Download links**: Provide direct download links for each attachment
7. **Contact info**: Display citizen contact info prominently for selected providers
8. **Handle rejections gracefully**: Allow users to provide rejection reasons
9. **Refresh after profile updates**: Regenerate matches if provider updates their profile

## 📚 Documentation

Full API documentation available in: `MATCHING_ENGINE_API.md`

## ✅ Status: COMPLETE

All matching engine components are implemented and ready for testing!
