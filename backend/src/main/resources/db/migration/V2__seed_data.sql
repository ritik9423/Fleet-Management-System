-- Fleet Operations Center — Indian Logistics National Corridor Seed Data
-- V2: Realistic Indian Commercial Fleet, Pilots, Real Routes, Maintenance
-- All passwords are BCrypt hash of "password"

-- 1. System Users with RBAC Roles
INSERT INTO users (username, email, password, role) VALUES
('admin',          'admin@fleetops.com',      '$2a$10$iemnD83XgNZYsLIiU3AttuL6NpdXXZrgf2FcreE.ScEcw8R6Kz5SW', 'ADMIN'),
('dispatcher',     'dispatcher@fleetops.com', '$2a$10$iemnD83XgNZYsLIiU3AttuL6NpdXXZrgf2FcreE.ScEcw8R6Kz5SW', 'DISPATCHER'),
('rajesh.sharma',  'rajesh@fleetops.com',     '$2a$10$iemnD83XgNZYsLIiU3AttuL6NpdXXZrgf2FcreE.ScEcw8R6Kz5SW', 'DRIVER'),
('sunita.roy',     'sunita@fleetops.com',     '$2a$10$iemnD83XgNZYsLIiU3AttuL6NpdXXZrgf2FcreE.ScEcw8R6Kz5SW', 'DRIVER'),
('vikram.singh',   'vikram@fleetops.com',     '$2a$10$iemnD83XgNZYsLIiU3AttuL6NpdXXZrgf2FcreE.ScEcw8R6Kz5SW', 'DRIVER'),
('mohit.verma',    'mohit@fleetops.com',      '$2a$10$iemnD83XgNZYsLIiU3AttuL6NpdXXZrgf2FcreE.ScEcw8R6Kz5SW', 'DRIVER');

-- 2. Commercial Vehicles (Tata, Mahindra, Eicher, Ashok Leyland, BharatBenz)
INSERT INTO vehicles (make, model, year, license_plate, vin, status, current_mileage, fuel_capacity) VALUES
('Tata',         'Ultra T.7',      2023, 'DL-01-AX-1001', 'MAT612001NKA00101', 'ACTIVE',      12450.50,  90.0),
('Mahindra',     'Furio 7',        2023, 'HR-26-DK-4004', 'MA1FA4DF6M1100202', 'ACTIVE',      34200.00,  85.0),
('Eicher',       'Pro 3015',       2022, 'UP-16-ZT-5005', 'ME3TRVDG0PE300303', 'ACTIVE',      18750.25, 160.0),
('Ashok Leyland','Partner 4 Tyre', 2023, 'DL-04-MB-2022', 'MB1PE8CC0L5400404', 'IDLE',        5890.75,  70.0),
('Tata',         'Prima 5530.S',   2021, 'MH-02-BG-2002', 'MATFW1ET8NFA00505', 'ACTIVE',      67300.00, 365.0),
('BharatBenz',   '1217R Medium',   2022, 'KA-03-TR-3003', 'ME4PE8CC0M5400606', 'MAINTENANCE', 22100.00, 171.0);

-- 3. Commercial Fleet Pilots / Drivers
INSERT INTO drivers (first_name, last_name, email, phone, license_number, license_expiry, active, user_id) VALUES
('Rajesh', 'Sharma', 'rajesh@fleetops.com', '+91 98110 54321', 'DL-0420210089101', '2028-06-30', true, 3),
('Sunita', 'Roy',    'sunita@fleetops.com', '+91 98120 76543', 'HR-2620200054302', '2027-12-31', true, 4),
('Vikram', 'Singh',  'vikram@fleetops.com', '+91 98130 98765', 'UP-1620220032103', '2028-03-15', true, 5),
('Mohit',  'Verma',  'mohit@fleetops.com',  '+91 98140 12345', 'DL-0120190045604', '2026-09-30', true, 6),
('Amit',   'Patel',  'apatel@fleetops.com', '+91 98200 45678', 'MH-0220180098705', '2027-08-20', true, NULL),
('Suresh', 'Kumar',  'skumar@fleetops.com', '+91 98450 67890', 'KA-0320200012306', '2029-01-10', true, NULL);

-- Assign Drivers to Primary Corridor Units
UPDATE drivers SET assigned_vehicle_id = 1 WHERE id = 1;
UPDATE drivers SET assigned_vehicle_id = 2 WHERE id = 2;
UPDATE drivers SET assigned_vehicle_id = 3 WHERE id = 3;
UPDATE drivers SET assigned_vehicle_id = 4 WHERE id = 4;
UPDATE drivers SET assigned_vehicle_id = 5 WHERE id = 5;
UPDATE drivers SET assigned_vehicle_id = 6 WHERE id = 6;

-- 4. Realistic Indian Corridors & Freight Route Trips
INSERT INTO trips (vehicle_id, driver_id, origin, destination, start_time, end_time, start_odometer, end_odometer, fuel_used, distance, status, notes) VALUES
(1, 1, 'Delhi IGI Cargo Terminal Hub', 'Gurugram Manesar Freight Hub (NH-48)', DATE_SUB(NOW(), INTERVAL 2 HOUR), NULL, 12400.00, NULL, NULL, NULL, 'IN_PROGRESS', 'Active high-value cargo run via NH-48 corridor'),
(2, 2, 'Gurugram Manesar Freight Hub', 'Faridabad Multi-modal Container Depot', DATE_SUB(NOW(), INTERVAL 3 HOUR), NULL, 34120.00, NULL, NULL, NULL, 'IN_PROGRESS', 'Industrial auto components transit on Eastern Peripheral Expressway'),
(3, 3, 'Noida Multi-modal Logistics Park', 'Ghaziabad Inland Container Depot', DATE_SUB(NOW(), INTERVAL 1 HOUR), NULL, 18700.00, NULL, NULL, NULL, 'IN_PROGRESS', 'Express e-commerce freight dispatch'),
(5, 5, 'Mumbai JNPT Port Freight Terminal', 'Pune Chakan Industrial Corridor (Expressway)', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 2 DAY), INTERVAL 4 HOUR), 67150.00, 67300.00, 42.0, 150.0, 'COMPLETED', '40ft container delivered smoothly on Mumbai-Pune Expressway'),
(4, 4, 'Punjabi Bagh Freight Staging Depot', 'Sonipat Food Logistics Park (NH-44)', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 1 DAY), INTERVAL 2 HOUR), 5820.00, 5890.75, 12.5, 70.75, 'COMPLETED', 'FMCG goods delivered ahead of schedule'),
(6, 6, 'Bengaluru Electronic City Depot', 'Hosur Multi-modal Freight Hub', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 3 DAY), INTERVAL 1 HOUR), 22050.00, 22100.00, 8.0, 50.0, 'COMPLETED', 'Electronics cargo safely delivered');

-- 5. Indian Fleet Maintenance Operations
INSERT INTO maintenance_records (vehicle_id, type, status, scheduled_date, completed_date, cost, notes) VALUES
(6, 'ENGINE_SERVICE', 'IN_PROGRESS', DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), NULL, NULL, 'DEF and SCR AdBlue exhaust diagnostic & turbocharger inspection at Bengaluru Service Depot'),
(1, 'OIL_CHANGE',    'SCHEDULED',   DATE_ADD(CURRENT_DATE, INTERVAL 5 DAY), NULL, NULL, 'Routine 15,000 km synthetic engine oil and filter change at Tata Motors Delhi Hub'),
(2, 'TIRE_ROTATION', 'SCHEDULED',   DATE_ADD(CURRENT_DATE, INTERVAL 12 DAY), NULL, NULL, 'Radial tyre pressure balancing & rotation for high-speed NH-48 operations'),
(5, 'BRAKE_SERVICE', 'COMPLETED',   DATE_SUB(CURRENT_DATE, INTERVAL 20 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 19 DAY), 18500.00, 'Heavy-duty pneumatic dual-circuit air brake pads replacement at JNPT Port Workshop'),
(3, 'FULL_SERVICE',  'SCHEDULED',   DATE_ADD(CURRENT_DATE, INTERVAL 8 DAY), NULL, NULL, 'Periodic 20,000 km chassis grease lubrication and suspension alignment');
