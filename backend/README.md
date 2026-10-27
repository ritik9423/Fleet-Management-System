# Fleet Operations Center — Backend API

Backend REST API for the Fleet Management system, built with **Java 17**, **Spring Boot 3.3.4**, **Spring Security 6 (JWT)**, **PostgreSQL 15**, and **Flyway**.

---

## 📁 Backend Directory & Package Structure (Folder Explanation)

```
backend/
├── pom.xml                               # Maven project configuration & dependencies
├── README.md                             # This documentation file
└── src/
    ├── main/
    │   ├── java/com/fleetops/
    │   │   ├── FleetOpsApplication.java  # Main application entry point (@SpringBootApplication, @EnableScheduling)
    │   │   │
    │   │   ├── config/                   # Configuration classes
    │   │   │   ├── SecurityConfig.java   # Spring Security, password hashing (BCrypt), JWT filter, route permissions
    │   │   │   └── OpenApiConfig.java    # Swagger / OpenAPI 3 configuration with JWT Bearer auth
    │   │   │
    │   │   ├── controller/               # REST Controllers (API Endpoints layer)
    │   │   │   ├── AuthController.java        # POST /api/auth/login, POST /api/auth/register
    │   │   │   ├── VehicleController.java     # CRUD + status update for vehicles
    │   │   │   ├── DriverController.java      # CRUD + vehicle assignment for drivers
    │   │   │   ├── TripController.java        # Start, close, cancel, and list trips
    │   │   │   ├── MaintenanceController.java # Schedule, complete, overdue maintenance
    │   │   │   └── AnalyticsController.java   # Fleet summaries, vehicle KPIs, driver KPIs
    │   │   │
    │   │   ├── service/                  # Business Logic Layer
    │   │   │   ├── AuthService.java           # Authentication, credentials verification, JWT issuance
    │   │   │   ├── VehicleService.java        # Vehicle validations, status transitions
    │   │   │   ├── DriverService.java         # Driver licensing checks, assignment logic
    │   │   │   ├── TripService.java           # Trip workflows, odometer tracking, vehicle status sync
    │   │   │   ├── MaintenanceService.java    # Service records, @Scheduled daily cron for overdue checks
    │   │   │   └── AnalyticsService.java      # Fleet metrics calculation, utilization, cost aggregation
    │   │   │
    │   │   ├── repository/               # Data Access Layer (Spring Data JPA)
    │   │   │   ├── UserRepository.java        # User DB operations (findByUsername)
    │   │   │   ├── VehicleRepository.java     # Vehicle DB queries (findByStatus, count, etc.)
    │   │   │   ├── DriverRepository.java      # Driver DB queries
    │   │   │   ├── TripRepository.java        # Trip queries by vehicle, driver, date
    │   │   │   └── MaintenanceRepository.java # Maintenance queries by vehicle, status, date
    │   │   │
    │   │   ├── model/                    # JPA Entities & Domain Enums
    │   │   │   ├── User.java                  # User credentials and role
    │   │   │   ├── Vehicle.java               # Vehicle specs, license plate, status, odometer
    │   │   │   ├── Driver.java                # Driver info, license expiry, assigned vehicle
    │   │   │   ├── Trip.java                  # Journey details, route, start/end odometer, fuel
    │   │   │   ├── MaintenanceRecord.java     # Service logs, cost, scheduled & completed dates
    │   │   │   └── enums/                     # Type-safe status & role enums
    │   │   │       ├── Role.java              # ADMIN, DISPATCHER, DRIVER
    │   │   │       ├── VehicleStatus.java     # ACTIVE, IDLE, MAINTENANCE, RETIRED
    │   │   │       ├── TripStatus.java        # DISPATCHED, IN_PROGRESS, COMPLETED, CANCELLED
    │   │   │       ├── MaintenanceStatus.java # SCHEDULED, IN_PROGRESS, COMPLETED, OVERDUE
    │   │   │       └── MaintenanceType.java   # OIL_CHANGE, TIRE_ROTATION, BRAKE_SERVICE, etc.
    │   │   │
    │   │   ├── dto/                      # Data Transfer Objects (Request & Response schemas)
    │   │   │   ├── request/                   # Incoming payload models with Jakarta Validation
    │   │   │   │   ├── AuthRequest.java
    │   │   │   │   ├── RegisterRequest.java
    │   │   │   │   ├── VehicleRequest.java
    │   │   │   │   ├── VehicleStatusUpdateRequest.java
    │   │   │   │   ├── DriverRequest.java
    │   │   │   │   ├── TripStartRequest.java
    │   │   │   │   ├── TripCloseRequest.java
    │   │   │   │   ├── MaintenanceRequest.java
    │   │   │   │   └── MaintenanceCompleteRequest.java
    │   │   │   └── response/                  # Outgoing JSON responses
    │   │   │       ├── AuthResponse.java
    │   │   │       ├── VehicleResponse.java
    │   │   │       ├── VehicleStatsResponse.java
    │   │   │       ├── DriverResponse.java
    │   │   │       ├── DriverStatsResponse.java
    │   │   │       ├── TripResponse.java
    │   │   │       ├── MaintenanceResponse.java
    │   │   │       ├── AnalyticsSummaryResponse.java
    │   │   │       └── ErrorResponse.java
    │   │   │
    │   │   ├── security/                 # Security Implementation (JWT)
    │   │   │   ├── JwtUtil.java               # Token generation, signing, decoding, expiration validation
    │   │   │   ├── JwtAuthFilter.java         # Intercepts requests, validates Authorization: Bearer <token>
    │   │   │   └── UserDetailsServiceImpl.java# Bridge between Spring Security and UserRepository
    │   │   │
    │   │   └── exception/                # Exception Handling
    │   │       ├── ResourceNotFoundException.java # Thrown when entity not found (404)
    │   │       ├── BusinessException.java         # Thrown for domain validation violations (400)
    │   │       └── GlobalExceptionHandler.java    # @RestControllerAdvice converting exceptions to ErrorResponse
    │   │
    │   └── resources/
    │       ├── application.yml           # Database credentials, JPA settings, JWT secret, server port (8080)
    │       └── db/migration/             # Flyway SQL Migrations
    │           ├── V1__init_schema.sql   # Creates users, vehicles, drivers, trips, maintenance tables
    │           └── V2__seed_data.sql     # Initial seed data for testing
    │
    └── test/                             # Unit & Integration Tests (JUnit 5 & Mockito)
        └── java/com/fleetops/service/
            ├── VehicleServiceTest.java   # Tests vehicle CRUD and status rules
            ├── DriverServiceTest.java    # Tests driver assignment logic
            └── TripServiceTest.java      # Tests trip lifecycle and odometer updates
```

---

## 🔄 Architecture & Request Flow

```
[Client (Frontend / Swagger)]
             │
             ▼
     [JwtAuthFilter] ──(Validates Bearer token & sets SecurityContext)
             │
             ▼
       [Controller]   ──(Validates @Valid DTO, maps HTTP verbs)
             │
             ▼
        [Service]     ──(Business logic, transactional boundaries)
             │
             ▼
       [Repository]   ──(Spring Data JPA / Hibernate)
             │
             ▼
     [PostgreSQL DB]  ──(Versioned via Flyway V1, V2)
```

---

## 🚀 How to Run the Backend
### 1. Prerequisites
- **Java 17+** (`java -version`)
- **Maven 3.9+** (`mvn -version`)
- **MySQL 8.0+ / MySQL Workbench** running on port `3306`

### 2. Database Connection (MySQL)
Backend is pre-configured in [`backend/src/main/resources/application.yml`](file:///c:/Users/Ritik%20Kumar/Desktop/fleet-ops/backend/src/main/resources/application.yml) to connect to MySQL on `localhost:3306` with database name `fleet_ops`:
- **Database:** `fleet_ops` (Automatically created if it doesn't exist)
- **User:** `root`
- **Password:** `root`

In MySQL Workbench:
1. Connect to your Local MySQL 8.0 instance.
2. In the SCHEMAS panel, refresh and you will see the `fleet_ops` database with all tables (`users`, `vehicles`, `drivers`, `trips`, `maintenance_records`).
3. You can run queries like `SELECT * FROM fleet_ops.users;` or `SELECT * FROM fleet_ops.vehicles;`.

### 3. Build & Run
From inside the `backend` directory:
```bash
cd backend
mvn spring-boot:run
```

The API will start on: `http://localhost:8080`

### 4. Run Tests
```bash
mvn test
```

### 5. Interactive API Documentation (Swagger)
Open in browser:
- **Swagger UI:** `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON:** `http://localhost:8080/v3/api-docs`

---

## 🔐 Default Demo Accounts (From `V2__seed_data.sql`)

| Username | Password | Role | Permissions |
|---|---|---|---|
| `admin` | `password` | `ADMIN` | Full access to all endpoints |
| `dispatcher` | `password` | `DISPATCHER` | Fleet management, trips, assignments |
| `driver` | `password` | `DRIVER` | Read-only / assigned trips & vehicles |
