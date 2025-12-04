# Legal Aid Backend API - Testing Guide

## Application is running on: http://localhost:8080

---

## Test 1: Register a Lawyer

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/users/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{
        "username": "john_lawyer",
        "email": "john@lawyer.com",
        "password": "password123",
        "role": "LAWYER",
        "specialization": "Criminal Law",
        "yearsOfExperience": 5
    }'
```

---

## Test 2: Register an NGO

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/users/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{
        "username": "help_ngo",
        "email": "contact@helpngo.org",
        "password": "password123",
        "role": "NGO",
        "ngoName": "Legal Aid Society",
        "registrationNumber": "NGO12345"
    }'
```

---

## Test 3: Register a Citizen

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/users/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{
        "username": "jane_citizen",
        "email": "jane@example.com",
        "password": "password123",
        "role": "CITIZEN"
    }'
```

---

## Test 4: Login (Get JWT Token)

```powershell
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{
        "email": "john@lawyer.com",
        "password": "password123"
    }'

$token = $loginResponse.token
Write-Host "Token: $token"
```

---

## Test 5: Get All Users (Requires Authentication)

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/users" `
    -Method GET `
    -Headers @{
        "Authorization" = "Bearer $token"
    }
```

---

## Test 6: Get User by ID (Requires Authentication)

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/users/1" `
    -Method GET `
    -Headers @{
        "Authorization" = "Bearer $token"
    }
```

---

## Test 7: Get User by Email (Requires Authentication)

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/users/email/john@lawyer.com" `
    -Method GET `
    -Headers @{
        "Authorization" = "Bearer $token"
    }
```

---

## Test 8: Delete User (Requires Authentication)

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/users/3" `
    -Method DELETE `
    -Headers @{
        "Authorization" = "Bearer $token"
    }
```

---

## Quick Test All Commands (Copy and paste in PowerShell)

```powershell
# Register Lawyer
Write-Host "`n=== Registering Lawyer ===" -ForegroundColor Green
$lawyer = Invoke-RestMethod -Uri "http://localhost:8080/api/users/register" -Method POST -ContentType "application/json" -Body '{"username":"john_lawyer","email":"john@lawyer.com","password":"password123","role":"LAWYER","specialization":"Criminal Law","yearsOfExperience":5}'
$lawyer | ConvertTo-Json

# Register NGO
Write-Host "`n=== Registering NGO ===" -ForegroundColor Green
$ngo = Invoke-RestMethod -Uri "http://localhost:8080/api/users/register" -Method POST -ContentType "application/json" -Body '{"username":"help_ngo","email":"contact@helpngo.org","password":"password123","role":"NGO","ngoName":"Legal Aid Society","registrationNumber":"NGO12345"}'
$ngo | ConvertTo-Json

# Register Citizen
Write-Host "`n=== Registering Citizen ===" -ForegroundColor Green
$citizen = Invoke-RestMethod -Uri "http://localhost:8080/api/users/register" -Method POST -ContentType "application/json" -Body '{"username":"jane_citizen","email":"jane@example.com","password":"password123","role":"CITIZEN"}'
$citizen | ConvertTo-Json

# Login
Write-Host "`n=== Logging in as Lawyer ===" -ForegroundColor Green
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"john@lawyer.com","password":"password123"}'
$token = $loginResponse.token
Write-Host "Token received: $token" -ForegroundColor Yellow

# Get all users
Write-Host "`n=== Getting All Users ===" -ForegroundColor Green
$allUsers = Invoke-RestMethod -Uri "http://localhost:8080/api/users" -Method GET -Headers @{"Authorization"="Bearer $token"}
$allUsers | ConvertTo-Json

# Get user by ID
Write-Host "`n=== Getting User by ID (1) ===" -ForegroundColor Green
$userById = Invoke-RestMethod -Uri "http://localhost:8080/api/users/1" -Method GET -Headers @{"Authorization"="Bearer $token"}
$userById | ConvertTo-Json

# Get user by email
Write-Host "`n=== Getting User by Email ===" -ForegroundColor Green
$userByEmail = Invoke-RestMethod -Uri "http://localhost:8080/api/users/email/john@lawyer.com" -Method GET -Headers @{"Authorization"="Bearer $token"}
$userByEmail | ConvertTo-Json

Write-Host "`n=== All Tests Completed! ===" -ForegroundColor Cyan
```

---

## H2 Database Console

Access the H2 database console:
- URL: http://localhost:8080/h2-console
- JDBC URL: `jdbc:h2:mem:legalaiddb`
- Username: `sa`
- Password: (leave empty)

---

## Expected Behavior

✅ **Registration** - Users registered with encrypted passwords
✅ **Login** - Returns JWT token valid for 24 hours
✅ **Protected Endpoints** - Require Bearer token in Authorization header
✅ **Validation** - Email format, required fields validated
✅ **Error Handling** - Proper error messages for duplicates, not found, etc.
