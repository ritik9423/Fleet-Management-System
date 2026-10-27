export type Role = "ADMIN" | "DISPATCHER" | "DRIVER";

export type VehicleStatus = "AVAILABLE" | "ON_TRIP" | "MAINTENANCE" | "OUT_OF_SERVICE";

export type TripStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type MaintenanceType = "OIL_CHANGE" | "TIRE_ROTATION" | "BRAKE_INSPECTION" | "ENGINE_TUNEUP" | "ROUTINE_SERVICE" | "EMERGENCY_REPAIR";

export type MaintenanceStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  type: string;
  username: string;
  role: Role;
}

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  status: VehicleStatus;
  currentMileage: number;
  fuelCapacity: number;
  currentFuelLevel: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Driver {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  active: boolean;
  username?: string;
  totalTrips?: number;
  createdAt?: string;
}

export interface Trip {
  id: number;
  vehicleId: number;
  vehiclePlate?: string;
  vehicleModel?: string;
  driverId: number;
  driverName?: string;
  origin?: string;
  destination?: string;
  startLocation?: string;
  endLocation?: string;
  startTime: string;
  endTime?: string;
  startMileage: number;
  startOdometer?: number;
  endMileage?: number;
  endOdometer?: number;
  distanceCovered?: number;
  distance?: number;
  fuelUsed?: number;
  status: TripStatus;
  notes?: string;
}

export interface MaintenanceRecord {
  id: number;
  vehicleId: number;
  vehiclePlate?: string;
  serviceType?: MaintenanceType;
  type?: MaintenanceType;
  description?: string;
  notes?: string;
  cost?: number;
  scheduledDate: string;
  completedDate?: string;
  status: MaintenanceStatus;
}

export interface AnalyticsSummary {
  totalVehicles: number;
  activeVehicles: number;
  maintenanceVehicles: number;
  totalDrivers: number;
  activeTrips: number;
  completedTrips: number;
  totalMaintenanceCost?: number;
  fleetUtilizationRate?: number;
  fleetUtilizationPercent?: number;
  tripsInProgress?: number;
  tripsCompleted?: number;
  overdueMaintenanceCount?: number;
}
