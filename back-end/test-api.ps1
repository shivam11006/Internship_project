# API Test Script for Legal Aid Backend
# Run this after starting the application with: java -jar target\legalaid-backend-0.0.1-SNAPSHOT.jar

Write-Host "=== Legal Aid Backend API Tests ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Register Lawyer
Write-Host "[1] Registering Lawyer..." -ForegroundColor Green
try {
    $lawyer = Invoke-RestMethod -Uri "http://localhost:8080/api/users/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"username":"john_lawyer","email":"john@lawyer.com","password":"password123","role":"LAWYER","specialization":"Criminal Law","yearsOfExperience":5}'
    Write-Host "✓ Lawyer registered successfully!" -ForegroundColor Green
    Write-Host "  ID: $($lawyer.id), Email: $($lawyer.email), Role: $($lawyer.role)" -ForegroundColor Yellow
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Register NGO
Write-Host "[2] Registering NGO..." -ForegroundColor Green
try {
    $ngo = Invoke-RestMethod -Uri "http://localhost:8080/api/users/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"username":"help_ngo","email":"contact@helpngo.org","password":"password123","role":"NGO","ngoName":"Legal Aid Society","registrationNumber":"NGO12345"}'
    Write-Host "✓ NGO registered successfully!" -ForegroundColor Green
    Write-Host "  ID: $($ngo.id), Email: $($ngo.email), Role: $($ngo.role)" -ForegroundColor Yellow
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Register Citizen
Write-Host "[3] Registering Citizen..." -ForegroundColor Green
try {
    $citizen = Invoke-RestMethod -Uri "http://localhost:8080/api/users/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"username":"jane_citizen","email":"jane@example.com","password":"password123","role":"CITIZEN"}'
    Write-Host "✓ Citizen registered successfully!" -ForegroundColor Green
    Write-Host "  ID: $($citizen.id), Email: $($citizen.email), Role: $($citizen.role)" -ForegroundColor Yellow
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Login
Write-Host "[4] Logging in as Lawyer..." -ForegroundColor Green
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"email":"john@lawyer.com","password":"password123"}'
    $token = $loginResponse.token
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0,20))..." -ForegroundColor Yellow
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Stopping tests - authentication required" -ForegroundColor Red
    exit
}
Write-Host ""

# Test 5: Get All Users
Write-Host "[5] Getting all users..." -ForegroundColor Green
try {
    $allUsers = Invoke-RestMethod -Uri "http://localhost:8080/api/users" `
        -Method GET `
        -Headers @{"Authorization"="Bearer $token"}
    Write-Host "✓ Retrieved $($allUsers.Count) users" -ForegroundColor Green
    foreach ($user in $allUsers) {
        Write-Host "  - $($user.username) ($($user.email)) - Role: $($user.role)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Get User by ID
Write-Host "[6] Getting user by ID (1)..." -ForegroundColor Green
try {
    $userById = Invoke-RestMethod -Uri "http://localhost:8080/api/users/1" `
        -Method GET `
        -Headers @{"Authorization"="Bearer $token"}
    Write-Host "✓ User found!" -ForegroundColor Green
    Write-Host "  Username: $($userById.username), Email: $($userById.email)" -ForegroundColor Yellow
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7: Get User by Email
Write-Host "[7] Getting user by email..." -ForegroundColor Green
try {
    $userByEmail = Invoke-RestMethod -Uri "http://localhost:8080/api/users/email/john@lawyer.com" `
        -Method GET `
        -Headers @{"Authorization"="Bearer $token"}
    Write-Host "✓ User found!" -ForegroundColor Green
    Write-Host "  Username: $($userByEmail.username), Role: $($userByEmail.role)" -ForegroundColor Yellow
    if ($userByEmail.profile) {
        Write-Host "  Specialization: $($userByEmail.profile.specialization)" -ForegroundColor Yellow
        Write-Host "  Experience: $($userByEmail.profile.yearsOfExperience) years" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 8: Test Authentication Error
Write-Host "[8] Testing without authentication (should fail)..." -ForegroundColor Green
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/users" -Method GET
    Write-Host "✗ Unexpected: Request should have been rejected!" -ForegroundColor Red
} catch {
    Write-Host "✓ Correctly rejected unauthenticated request" -ForegroundColor Green
}
Write-Host ""

# Test 9: Test Duplicate Email
Write-Host "[9] Testing duplicate email registration (should fail)..." -ForegroundColor Green
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"username":"john2","email":"john@lawyer.com","password":"pass","role":"CITIZEN"}'
    Write-Host "✗ Unexpected: Duplicate email should be rejected!" -ForegroundColor Red
} catch {
    Write-Host "✓ Correctly rejected duplicate email" -ForegroundColor Green
}
Write-Host ""

Write-Host "=== All Tests Completed! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Application Info:" -ForegroundColor Cyan
Write-Host "  API URL: http://localhost:8080" -ForegroundColor Yellow
Write-Host "  H2 Console: http://localhost:8080/h2-console" -ForegroundColor Yellow
Write-Host "  JDBC URL: jdbc:h2:mem:legalaiddb" -ForegroundColor Yellow
