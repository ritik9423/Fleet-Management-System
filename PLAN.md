# Fleet Operations Center API — Build Plan

## What We're Building
A production-quality Fleet Management REST API built with Java Spring Boot.
Designed as a portfolio project targeting the Parsons Smart Mobility Junior Full Stack Developer role.

## Tech Stack
| Layer | Technology |
|---|---|
| Language | Java 17 |
| Framework | Spring Boot 3.3.4 |
| Security | Spring Security 6 + JWT (jjwt 0.12) |
| ORM | Spring Data JPA + Hibernate |
| Database | PostgreSQL |
| Migrations | Flyway |
| API Docs | SpringDoc OpenAPI (Swagger UI) |
| Validation | Bean Validation (jakarta.validation) |
| Build | Maven |
| Tests | JUnit 5 + Mockito |

## Prerequisites (Install Before Running)
1. **Java 17+** — https://adoptium.net (Temurin 17 LTS)
2. **Maven 3.9+** — https://maven.apache.org/download.cgi
3. **PostgreSQL 15+** — https://www.postgresql.org/download/
4. Create DB: `CREATE DATABASE fleet_ops;`

## Domain Model
```
User         — auth accounts (ADMIN / DISPATCHER / DRIVER)
Vehicle      — fleet vehicles with status tracking
Driver       — drivers linked to vehicles
Trip         — logged journeys (vehicle + driver + route)
Maintenance  — scheduled/completed service records
```

## API Surface
| Module | Endpoints |
|---|---|
| Auth | POST /login, POST /register |
| Vehicles | CRUD + status update + history |
| Drivers | CRUD + vehicle assignment |
| Trips | Start, close, cancel, list |
| Maintenance | Schedule, complete, overdue list |
| Analytics | Fleet summary, per-vehicle stats, per-driver stats |

## Build Stages

### Stage 1 — Project Foundation
Files: `pom.xml`, `FleetOpsApplication.java`, `application.yml`, `.gitignore`
Verify: `mvn compile` exits 0

### Stage 2 — Database Schema
Files: `V1__init_schema.sql`, `V2__seed_data.sql`
Verify: `mvn flyway:migrate` applies both migrations cleanly

### Stage 3 — Domain Models & Enums
Files: 5 enums, 5 entities
Verify: `mvn compile` exits 0 with all entities

### Stage 4 — Repositories
Files: 5 Spring Data JPA repositories
Verify: `mvn compile` exits 0

### Stage 5 — Security Layer
Files: `JwtUtil`, `JwtAuthFilter`, `UserDetailsServiceImpl`, `SecurityConfig`, `OpenApiConfig`
Verify: App starts, `/swagger-ui.html` loads, unauthenticated request to `/api/vehicles` returns 401

### Stage 6 — Exception Handling + DTOs
Files: custom exceptions, `GlobalExceptionHandler`, all request/response DTOs
Verify: `mvn compile` exits 0

### Stage 7 — Auth Module
Files: `AuthService`, `AuthController`
Verify: POST `/api/auth/login` with seed credentials returns a JWT

### Stage 8 — Vehicles Module
Files: `VehicleService`, `VehicleController`
Verify: Full CRUD via Swagger UI with Bearer token

### Stage 9 — Drivers Module
Files: `DriverService`, `DriverController`
Verify: CRUD + assign/unassign vehicle endpoints work

### Stage 10 — Trips Module
Files: `TripService`, `TripController`
Verify: Start trip, close trip, cancel trip all work; vehicle status updates correctly

### Stage 11 — Maintenance Module
Files: `MaintenanceService`, `MaintenanceController`
Verify: Schedule, complete, overdue list all work; `@Scheduled` job flags overdue records

### Stage 12 — Analytics Module
Files: `AnalyticsService`, `AnalyticsController`
Verify: Summary endpoint returns correct fleet metrics

### Stage 13 — Tests
Files: `VehicleServiceTest`, `DriverServiceTest`, `TripServiceTest`
Verify: `mvn test` exits 0

### Stage 14 — Final Documentation
Files: `README.md` (full), Swagger annotations polished
Verify: README has setup guide, API reference, and deploy instructions

