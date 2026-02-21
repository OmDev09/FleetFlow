export const ROLE = {
  MANAGER: "MANAGER",
  DISPATCHER: "DISPATCHER",
  SAFETY_OFFICER: "SAFETY_OFFICER",
  FINANCIAL_ANALYST: "FINANCIAL_ANALYST",
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

export const VEHICLE_TYPE = {
  TRUCK: "TRUCK",
  VAN: "VAN",
  BIKE: "BIKE",
} as const;

export type VehicleType = (typeof VEHICLE_TYPE)[keyof typeof VEHICLE_TYPE];

export const VEHICLE_STATUS = {
  AVAILABLE: "AVAILABLE",
  ON_TRIP: "ON_TRIP",
  IN_SHOP: "IN_SHOP",
  OUT_OF_SERVICE: "OUT_OF_SERVICE",
} as const;

export type VehicleStatus = (typeof VEHICLE_STATUS)[keyof typeof VEHICLE_STATUS];

export const DRIVER_STATUS = {
  AVAILABLE: "AVAILABLE",
  ON_DUTY: "ON_DUTY",
  OFF_DUTY: "OFF_DUTY",
  SUSPENDED: "SUSPENDED",
} as const;

export type DriverStatus = (typeof DRIVER_STATUS)[keyof typeof DRIVER_STATUS];

export const TRIP_STATUS = {
  DRAFT: "DRAFT",
  DISPATCHED: "DISPATCHED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type TripStatus = (typeof TRIP_STATUS)[keyof typeof TRIP_STATUS];
