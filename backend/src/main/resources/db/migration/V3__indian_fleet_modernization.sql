-- Fleet Operations Center — Modern Indian Logistics Fleet Migration
-- Updates existing dummy rows in-place to Indian commercial assets

-- 1. Update Existing Commercial Vehicles
UPDATE vehicles SET make='Tata', model='Ultra T.7', year=2023, license_plate='DL-01-AX-1001', vin='MAT612001NKA00101', status='ACTIVE', current_mileage=12450.50, fuel_capacity=90.0 WHERE id=1;
UPDATE vehicles SET make='Mahindra', model='Furio 7', year=2023, license_plate='HR-26-DK-4004', vin='MA1FA4DF6M1100202', status='ACTIVE', current_mileage=34200.00, fuel_capacity=85.0 WHERE id=2;
UPDATE vehicles SET make='Eicher', model='Pro 3015', year=2022, license_plate='UP-16-ZT-5005', vin='ME3TRVDG0PE300303', status='ACTIVE', current_mileage=18750.25, fuel_capacity=160.0 WHERE id=3;
UPDATE vehicles SET make='Ashok Leyland', model='Partner 4 Tyre', year=2023, license_plate='DL-04-MB-2022', vin='MB1PE8CC0L5400404', status='IDLE', current_mileage=5890.75, fuel_capacity=70.0 WHERE id=4;
UPDATE vehicles SET make='Tata', model='Prima 5530.S', year=2021, license_plate='MH-02-BG-2002', vin='MATFW1ET8NFA00505', status='ACTIVE', current_mileage=67300.00, fuel_capacity=365.0 WHERE id=5;

INSERT INTO vehicles (id, make, model, year, license_plate, vin, status, current_mileage, fuel_capacity)
VALUES (6, 'BharatBenz', '1217R Medium', 2022, 'KA-03-TR-3003', 'ME4PE8CC0M5400606', 'MAINTENANCE', 22100.00, 171.0)
ON DUPLICATE KEY UPDATE make=VALUES(make), model=VALUES(model), license_plate=VALUES(license_plate), status=VALUES(status);

-- 2. Update Commercial Drivers
UPDATE drivers SET first_name='Rajesh', last_name='Sharma', email='rajesh@fleetops.com', phone='+91 98110 54321', license_number='DL-0420210089101', license_expiry='2028-06-30', active=true, assigned_vehicle_id=1 WHERE id=1;
UPDATE drivers SET first_name='Sunita', last_name='Roy', email='sunita@fleetops.com', phone='+91 98120 76543', license_number='HR-2620200054302', license_expiry='2027-12-31', active=true, assigned_vehicle_id=2 WHERE id=2;
UPDATE drivers SET first_name='Vikram', last_name='Singh', email='vikram@fleetops.com', phone='+91 98130 98765', license_number='UP-1620220032103', license_expiry='2028-03-15', active=true, assigned_vehicle_id=3 WHERE id=3;
UPDATE drivers SET first_name='Mohit', last_name='Verma', email='mohit@fleetops.com', phone='+91 98140 12345', license_number='DL-0120190045604', license_expiry='2026-09-30', active=true, assigned_vehicle_id=4 WHERE id=4;

INSERT INTO drivers (id, first_name, last_name, email, phone, license_number, license_expiry, active, user_id, assigned_vehicle_id)
VALUES (5, 'Amit', 'Patel', 'apatel@fleetops.com', '+91 98200 45678', 'MH-0220180098705', '2027-08-20', true, NULL, 5)
ON DUPLICATE KEY UPDATE first_name=VALUES(first_name), last_name=VALUES(last_name), phone=VALUES(phone), license_number=VALUES(license_number), assigned_vehicle_id=VALUES(assigned_vehicle_id);

INSERT INTO drivers (id, first_name, last_name, email, phone, license_number, license_expiry, active, user_id, assigned_vehicle_id)
VALUES (6, 'Suresh', 'Kumar', 'skumar@fleetops.com', '+91 98450 67890', 'KA-0320200012306', '2029-01-10', true, NULL, 6)
ON DUPLICATE KEY UPDATE first_name=VALUES(first_name), last_name=VALUES(last_name), phone=VALUES(phone), license_number=VALUES(license_number), assigned_vehicle_id=VALUES(assigned_vehicle_id);

-- 3. Update Corridors & Trips
UPDATE trips SET vehicle_id=1, driver_id=1, origin='Delhi IGI Cargo Terminal Hub', destination='Gurugram Manesar Freight Hub (NH-48)', status='IN_PROGRESS', start_odometer=12400.00, notes='Active high-value cargo run via NH-48 corridor' WHERE id=1;
UPDATE trips SET vehicle_id=2, driver_id=2, origin='Gurugram Manesar Freight Hub', destination='Faridabad Multi-modal Container Depot', status='IN_PROGRESS', start_odometer=34120.00, notes='Industrial auto components transit on Eastern Peripheral Expressway' WHERE id=2;
UPDATE trips SET vehicle_id=3, driver_id=3, origin='Noida Multi-modal Logistics Park', destination='Ghaziabad Inland Container Depot', status='IN_PROGRESS', start_odometer=18700.00, notes='Express e-commerce freight dispatch' WHERE id=3;
UPDATE trips SET vehicle_id=5, driver_id=5, origin='Mumbai JNPT Port Freight Terminal', destination='Pune Chakan Industrial Corridor (Expressway)', status='COMPLETED', start_odometer=67150.00, end_odometer=67300.00, fuel_used=42.0, distance=150.0, notes='40ft container delivered smoothly on Mumbai-Pune Expressway' WHERE id=4;

INSERT INTO trips (id, vehicle_id, driver_id, origin, destination, start_time, end_time, start_odometer, end_odometer, fuel_used, distance, status, notes)
VALUES (5, 4, 4, 'Punjabi Bagh Freight Staging Depot', 'Sonipat Food Logistics Park (NH-44)', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 1 DAY), INTERVAL 2 HOUR), 5820.00, 5890.75, 12.5, 70.75, 'COMPLETED', 'FMCG goods delivered ahead of schedule')
ON DUPLICATE KEY UPDATE origin=VALUES(origin), destination=VALUES(destination);

INSERT INTO trips (id, vehicle_id, driver_id, origin, destination, start_time, end_time, start_odometer, end_odometer, fuel_used, distance, status, notes)
VALUES (6, 6, 6, 'Bengaluru Electronic City Depot', 'Hosur Multi-modal Freight Hub', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 3 DAY), INTERVAL 1 HOUR), 22050.00, 22100.00, 8.0, 50.0, 'COMPLETED', 'Electronics cargo safely delivered')
ON DUPLICATE KEY UPDATE origin=VALUES(origin), destination=VALUES(destination);

-- 4. Update Maintenance Records
UPDATE maintenance_records SET vehicle_id=6, type='ENGINE_SERVICE', status='IN_PROGRESS', notes='DEF and SCR AdBlue exhaust diagnostic & turbocharger inspection at Bengaluru Service Depot', cost=14500.00 WHERE id=1;
UPDATE maintenance_records SET vehicle_id=1, type='OIL_CHANGE', status='SCHEDULED', notes='Routine 15,000 km synthetic engine oil and filter change at Tata Motors Delhi Hub', cost=4200.00 WHERE id=2;
UPDATE maintenance_records SET vehicle_id=2, type='TIRE_ROTATION', status='SCHEDULED', notes='Radial tyre pressure balancing & rotation for high-speed NH-48 operations', cost=2800.00 WHERE id=3;
UPDATE maintenance_records SET vehicle_id=5, type='BRAKE_SERVICE', status='COMPLETED', notes='Heavy-duty pneumatic dual-circuit air brake pads replacement at JNPT Port Workshop', cost=18500.00 WHERE id=4;
UPDATE maintenance_records SET vehicle_id=3, type='FULL_SERVICE', status='SCHEDULED', notes='Periodic 20,000 km chassis grease lubrication and suspension alignment', cost=8900.00 WHERE id=5;
