# 📚 Legal Aid Matching Platform - Complete Project Documentation

## 🌟 Executive Summary

The **Legal Aid Matching Platform** is a full-stack web application designed to bridge the gap between citizens in need of legal assistance and verified pro bono lawyers and NGOs. The platform uses an intelligent matching algorithm to connect users based on case type, location, expertise, and language preferences.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Technology Stack](#-technology-stack)
4. [System Architecture](#-system-architecture)
5. [User Roles & Permissions](#-user-roles--permissions)
6. [Core Modules](#-core-modules)
7. [How It Works](#-how-it-works)
8. [Getting Started](#-getting-started)
9. [API Documentation](#-api-documentation)
10. [Database Structure](#-database-structure)
11. [Security Features](#-security-features)
12. [Future Enhancements](#-future-enhancements)

---

## 🎯 Project Overview

### What Problem Does This Solve?

Many citizens who need legal assistance don't know where to find affordable or free legal help. At the same time, pro bono lawyers and legal aid NGOs struggle to find clients who genuinely need their services. This platform solves this problem by:

- **Connecting** citizens with verified legal professionals
- **Matching** cases with the most suitable lawyers/NGOs based on expertise
- **Streamlining** the entire process from case submission to appointment scheduling
- **Providing** a secure communication channel between all parties

### Who Is This For?

| User Type | Description |
|-----------|-------------|
| **Citizens** | People seeking free legal aid for their cases |
| **Lawyers** | Verified attorneys offering pro bono services |
| **NGOs** | Legal aid organizations providing assistance |
| **Admins** | Platform administrators managing users and analytics |

---

## ✨ Key Features

### 1. 🔐 Authentication & Security
- **JWT-based Authentication** with access and refresh tokens
- **Role-based Access Control** (Citizen, Lawyer, NGO, Admin)
- **Password Recovery** via email OTP
- **Account Verification** for lawyers and NGOs

### 2. 📝 Case Management
- Submit legal cases with detailed descriptions
- Upload supporting documents (evidence, attachments)
- Track case status (Open → Assigned → Closed)
- Priority levels (Low, Medium, High)
- Case categorization by legal type

### 3. 🤖 Intelligent Matching Engine
- **Multi-factor Scoring Algorithm** (0-100 points):
  - Expertise Match: 40 points
  - Location Match: 30 points
  - Language Match: 20 points
  - Verification Status: 10 points
- Automatic matching of cases to suitable providers
- Citizens can select preferred matches

### 4. 📅 Appointment Scheduling
- **Call Appointments**: Video/phone consultations
- **Offline Appointments**: In-person meetings
- Venue and location management
- Appointment status tracking

### 5. 💬 Real-time Chat
- **WebSocket-based messaging** for instant communication
- Secure conversations between citizens and providers
- Message history and notifications

### 6. 🔔 Notifications
- Real-time notification system
- Email alerts for important updates
- In-app notification panel

### 7. 📊 Analytics Dashboard (Admin Only)
- **Overview**: Total users, cases, matches, appointments
- **User Analytics**: Growth trends, retention rates
- **Case Analytics**: Status distribution, resolution rates
- **Match Analytics**: Success rates, response times

### 8. 🗂️ Directory & Bulk Import
- Browse verified lawyers and NGOs
- Admin bulk import via Excel files
- Advanced filtering and search

### 9. 🏥 Health Monitoring
- System health dashboard
- API endpoint monitoring
- Database connection status

---

## 🛠️ Technology Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Java 17** | Programming language |
| **Spring Boot 3.2** | Application framework |
| **Spring Security** | Authentication & authorization |
| **Spring Data JPA** | Database access layer |
| **PostgreSQL** | Production database |
| **JWT (jjwt)** | Token-based authentication |
| **WebSockets** | Real-time messaging |
| **Maven** | Build tool & dependency management |
| **Lombok** | Boilerplate code reduction |
| **Apache POI** | Excel file processing |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **Vite** | Build tool & dev server |
| **React Router 7** | Client-side routing |
| **Axios** | HTTP client |
| **Recharts** | Data visualization |
| **Leaflet** | Maps integration |
| **STOMP.js** | WebSocket client |
| **Zustand** | State management |
| **Tailwind CSS** | Styling framework |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  SignIn  │ │Dashboard │ │  Cases   │ │   Chat   │    ...    │
│  │  Signup  │ │ (Roles)  │ │ Matches  │ │ WebSocket│           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                           │                                     │
│                    Axios HTTP Requests                          │
│                    STOMP WebSocket                              │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Spring Boot)                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Security Layer                           │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │ │
│  │  │ JWT Filter  │  │ CORS Config  │  │ Role Validation │    │ │
│  │  └─────────────┘  └──────────────┘  └─────────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      Controllers                            │ │
│  │  Auth │ Case │ Match │ Appointment │ Chat │ Analytics      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                       Services                              │ │
│  │  AuthService │ MatchService │ CaseService │ EmailService   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     Repositories                            │ │
│  │  UserRepo │ CaseRepo │ MatchRepo │ AppointmentRepo         │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                       │
│  ┌────────┐ ┌───────┐ ┌─────────┐ ┌─────────────┐ ┌──────────┐ │
│  │ Users  │ │ Cases │ │ Matches │ │Appointments │ │ Messages │ │
│  └────────┘ └───────┘ └─────────┘ └─────────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 👥 User Roles & Permissions

### 1. 👤 Citizen
- Register and create account
- Submit legal cases with documents
- View matched lawyers/NGOs
- Select preferred match
- Schedule appointments
- Chat with assigned provider
- View appointment history

### 2. ⚖️ Lawyer
- Register with credentials (requires admin approval)
- View assigned cases
- Accept or decline case assignments
- Schedule appointments with citizens
- Chat with assigned citizens
- Manage profile and specializations

### 3. 🏛️ NGO
- Register organization (requires admin approval)
- View assigned cases
- Accept or decline assignments
- Coordinate with citizens
- Manage organization profile

### 4. 🔧 Admin
- Approve/reject lawyer and NGO registrations
- View platform analytics and reports
- Manage all users
- Bulk import lawyers/NGOs via Excel
- Monitor system health
- Access audit logs

---

## 📦 Core Modules

### 1. Authentication Module
```
📁 back-end/src/main/java/com/example/legalaid_backend/
├── 📁 controller/
│   └── AuthController.java          # Login, Register, Password Reset
├── 📁 security/
│   ├── JwtTokenProvider.java        # JWT generation & validation
│   ├── JwtAuthenticationFilter.java # Request authentication
│   └── SecurityConfig.java          # Security configuration
└── 📁 service/
    ├── AuthService.java             # Authentication logic
    └── EmailService.java            # OTP & notifications
```

### 2. Case Management Module
```
📁 Handles the lifecycle of legal cases
├── CaseController.java    # REST endpoints for cases
├── Case.java              # Case entity with attachments
├── CaseService.java       # Business logic
└── CaseRepository.java    # Database operations
```

### 3. Matching Engine Module
```
📁 Intelligent matching algorithm
├── MatchController.java   # Match endpoints
├── MatchService.java      # Scoring algorithm
├── Match.java             # Match entity
└── MatchResultDTO.java    # Response format
```

### 4. Appointment Module
```
📁 Scheduling system
├── AppointmentController.java  # CRUD operations
├── Appointment.java            # Entity (CALL/OFFLINE types)
├── AppointmentService.java     # Booking logic
└── AppointmentType.java        # Enum for appointment types
```

### 5. Chat Module
```
📁 Real-time messaging
├── ChatWebSocketController.java  # WebSocket handler
├── ChatRestController.java       # Message history
├── ChatMessage.java              # Message entity
└── ChatService.java              # Messaging logic
```

### 6. Analytics Module
```
📁 Admin dashboard data
├── AnalyticsController.java  # Statistics endpoints
├── AnalyticsService.java     # Data aggregation
└── DTOs/                     # Response objects
```

---

## 🔄 How It Works

### User Journey: Citizen Seeking Legal Aid

```
Step 1: Registration
┌──────────────────────────────────────────────┐
│  Citizen signs up with email and password    │
│  Receives verification email                  │
│  Completes profile with location & language  │
└──────────────────────────────────────────────┘
                    ▼
Step 2: Case Submission
┌──────────────────────────────────────────────┐
│  Citizen describes their legal issue         │
│  Selects case type (Family, Property, etc.)  │
│  Uploads evidence documents                  │
│  Sets priority level                         │
└──────────────────────────────────────────────┘
                    ▼
Step 3: Automatic Matching
┌──────────────────────────────────────────────┐
│  System analyzes case details                │
│  Searches for matching lawyers/NGOs          │
│  Calculates compatibility scores             │
│  Returns ranked list of matches              │
└──────────────────────────────────────────────┘
                    ▼
Step 4: Match Selection
┌──────────────────────────────────────────────┐
│  Citizen reviews matched providers           │
│  Views profiles, specializations, ratings    │
│  Selects preferred lawyer/NGO                │
└──────────────────────────────────────────────┘
                    ▼
Step 5: Provider Acceptance
┌──────────────────────────────────────────────┐
│  Selected provider receives notification     │
│  Reviews case details and attachments        │
│  Accepts or declines the assignment          │
└──────────────────────────────────────────────┘
                    ▼
Step 6: Appointment & Communication
┌──────────────────────────────────────────────┐
│  Citizen schedules appointment               │
│  Choose CALL (video) or OFFLINE (in-person)  │
│  Chat enabled for ongoing communication      │
│  Case progresses to resolution               │
└──────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Java 17** or higher
- **Node.js 18** or higher
- **PostgreSQL 14** or higher
- **Maven 3.8+**

### 1. Clone the Repository
```bash
git clone https://github.com/springboardmentor7777/legal-aid-matching-platform.git
cd legal-aid-matching-platform
```

### 2. Database Setup
```sql
-- Create PostgreSQL database
CREATE DATABASE legalaiddb;
```

### 3. Backend Configuration
Edit `back-end/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/legalaiddb
spring.datasource.username=your_username
spring.datasource.password=your_password
```

### 4. Start Backend
```bash
cd back-end
mvn spring-boot:run
```
Backend runs at: `http://localhost:8080`

### 5. Start Frontend
```bash
cd front-end/legal-aid-matching-platform
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

---

## 📡 API Documentation

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### Case Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cases` | Create new case |
| GET | `/api/cases/my-cases` | Get user's cases |
| GET | `/api/cases/{id}` | Get case details |
| PUT | `/api/cases/{id}` | Update case |
| DELETE | `/api/cases/{id}` | Delete case |

### Match Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/matches/case/{caseId}/generate` | Generate matches |
| GET | `/api/matches/case/{caseId}` | Get matches for case |
| POST | `/api/matches/{matchId}/select` | Select a match |
| POST | `/api/matches/{matchId}/accept-assignment` | Accept assignment |

### Appointment Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/appointments` | Create appointment |
| GET | `/api/appointments/my-appointments` | Get my appointments |
| PUT | `/api/appointments/{id}` | Update appointment |
| DELETE | `/api/appointments/{id}` | Cancel appointment |

### Analytics Endpoints (Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/overview` | Platform overview |
| GET | `/api/analytics/users` | User analytics |
| GET | `/api/analytics/cases` | Case analytics |
| GET | `/api/analytics/matches` | Match analytics |

---

## 🗄️ Database Structure

### Core Entities

```
┌─────────────────┐       ┌─────────────────┐
│      User       │       │      Case       │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ email           │       │ title           │
│ password        │       │ description     │
│ fullName        │       │ caseType        │
│ role            │◄──────│ citizenId       │
│ approvalStatus  │       │ status          │
│ location        │       │ priority        │
│ languages       │       │ createdAt       │
└─────────────────┘       └─────────────────┘
         │                         │
         │                         │
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│     Match       │       │  Appointment    │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ caseId          │       │ caseId          │
│ providerId      │       │ citizenId       │
│ score           │       │ providerId      │
│ status          │       │ type (CALL/     │
│ createdAt       │       │       OFFLINE)  │
│ respondedAt     │       │ scheduledAt     │
└─────────────────┘       │ venue           │
                          │ status          │
                          └─────────────────┘
```

### Key Relationships
- **User → Cases**: One-to-Many (Citizen creates cases)
- **Case → Matches**: One-to-Many (Case has multiple potential matches)
- **Match → User**: Many-to-One (Match assigned to provider)
- **Case → Appointments**: One-to-Many (Case can have multiple appointments)

---

## 🔒 Security Features

### 1. JWT Authentication
- **Access Token**: Short-lived (1 hour)
- **Refresh Token**: Long-lived (24 hours)
- Tokens stored securely in localStorage

### 2. Password Security
- BCrypt password hashing
- Password reset via email OTP
- Maximum 5 OTP attempts

### 3. Role-Based Access Control
- Routes protected by user role
- API endpoints secured by role validation
- Admin-only analytics and management

### 4. API Security
- CORS configuration for frontend origin
- CSRF protection
- Input validation on all endpoints

### 5. Data Protection
- Sensitive data encryption
- File upload validation
- SQL injection prevention via JPA

---

## 🔮 Future Enhancements

### Planned Features
- [ ] **Mobile App** (React Native)
- [ ] **Video Calling** (WebRTC integration)
- [ ] **AI Case Classification** (NLP-based case categorization)
- [ ] **Payment Integration** (for premium services)
- [ ] **Lawyer Ratings & Reviews**
- [ ] **Multi-language Support** (i18n)
- [ ] **Document E-Signing**
- [ ] **Calendar Integration** (Google/Outlook)

### Scalability Improvements
- [ ] Redis caching for sessions
- [ ] Elasticsearch for advanced search
- [ ] Microservices architecture
- [ ] Docker containerization
- [ ] Kubernetes deployment

---

## 📞 Support & Contact

For questions or support regarding this project:
- **Repository**: [GitHub - Legal Aid Matching Platform](https://github.com/springboardmentor7777/legal-aid-matching-platform)
- **Branch**: team-three

---

## 📄 License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.

---

*Documentation last updated: January 2026*
