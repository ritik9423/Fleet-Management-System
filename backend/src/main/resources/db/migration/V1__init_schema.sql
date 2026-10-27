-- Fleet Operations Center — Initial Schema (MySQL & PostgreSQL Compatible)
-- V1: creates all tables with constraints and indexes

CREATE TABLE IF NOT EXISTS users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    make             VARCHAR(50)    NOT NULL,
    model            VARCHAR(50)    NOT NULL,
    year             INTEGER        NOT NULL,
    license_plate    VARCHAR(20)    NOT NULL UNIQUE,
    vin              VARCHAR(17)    NOT NULL UNIQUE,
    status           VARCHAR(20)    NOT NULL DEFAULT 'IDLE',
    current_mileage  DECIMAL(10,2)  NOT NULL DEFAULT 0,
    fuel_capacity    DECIMAL(6,2)   NOT NULL,
    created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_name          VARCHAR(50)  NOT NULL,
    last_name           VARCHAR(50)  NOT NULL,
    email               VARCHAR(100) NOT NULL UNIQUE,
    phone               VARCHAR(20)  NOT NULL,
    license_number      VARCHAR(30)  NOT NULL UNIQUE,
    license_expiry      DATE         NOT NULL,
    active              BOOLEAN      NOT NULL DEFAULT TRUE,
    assigned_vehicle_id BIGINT       NULL,
    user_id             BIGINT       NULL,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_drivers_vehicle FOREIGN KEY (assigned_vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    CONSTRAINT fk_drivers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS trips (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id       BIGINT         NOT NULL,
    driver_id        BIGINT         NOT NULL,
    origin           VARCHAR(200)   NOT NULL,
    destination      VARCHAR(200)   NOT NULL,
    start_time       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time         TIMESTAMP      NULL,
    start_odometer   DECIMAL(10,2)  NOT NULL,
    end_odometer     DECIMAL(10,2)  NULL,
    fuel_used        DECIMAL(6,2)   NULL,
    distance         DECIMAL(10,2)  NULL,
    status           VARCHAR(20)    NOT NULL DEFAULT 'IN_PROGRESS',
    notes            TEXT           NULL,
    created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_trips_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    CONSTRAINT fk_trips_driver FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

CREATE TABLE IF NOT EXISTS maintenance_records (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id      BIGINT          NOT NULL,
    type            VARCHAR(30)     NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'SCHEDULED',
    scheduled_date  DATE            NOT NULL,
    completed_date  DATE            NULL,
    cost            DECIMAL(10,2)   NULL,
    notes           TEXT            NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_maintenance_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- Indexes
CREATE INDEX idx_vehicles_status        ON vehicles(status);
CREATE INDEX idx_drivers_active         ON drivers(active);
CREATE INDEX idx_drivers_vehicle        ON drivers(assigned_vehicle_id);
CREATE INDEX idx_trips_vehicle          ON trips(vehicle_id);
CREATE INDEX idx_trips_driver           ON trips(driver_id);
CREATE INDEX idx_trips_status           ON trips(status);
CREATE INDEX idx_maintenance_vehicle    ON maintenance_records(vehicle_id);
CREATE INDEX idx_maintenance_status     ON maintenance_records(status);
CREATE INDEX idx_maintenance_scheduled  ON maintenance_records(scheduled_date);
