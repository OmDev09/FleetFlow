import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { DRIVER_STATUS, ROLE, VEHICLE_STATUS, VEHICLE_TYPE } from "../src/lib/domain";

const prisma = new PrismaClient();

async function main() {
  const managerHash = await bcrypt.hash("manager123", 10);
  const dispatcherHash = await bcrypt.hash("dispatcher123", 10);
  const safetyHash = await bcrypt.hash("safety123", 10);
  const financeHash = await bcrypt.hash("finance123", 10);

  await prisma.user.upsert({
    where: { email: "manager@fleetflow.com" },
    update: {},
    create: {
      email: "manager@fleetflow.com",
      password: managerHash,
      name: "Fleet Manager",
      role: ROLE.MANAGER,
    },
  });
  await prisma.user.upsert({
    where: { email: "dispatcher@fleetflow.com" },
    update: {},
    create: {
      email: "dispatcher@fleetflow.com",
      password: dispatcherHash,
      name: "Dispatch Lead",
      role: ROLE.DISPATCHER,
    },
  });
  await prisma.user.upsert({
    where: { email: "safety@fleetflow.com" },
    update: {},
    create: {
      email: "safety@fleetflow.com",
      password: safetyHash,
      name: "Safety Officer",
      role: ROLE.SAFETY_OFFICER,
    },
  });
  await prisma.user.upsert({
    where: { email: "finance@fleetflow.com" },
    update: {},
    create: {
      email: "finance@fleetflow.com",
      password: financeHash,
      name: "Financial Analyst",
      role: ROLE.FINANCIAL_ANALYST,
    },
  });

  const exp = new Date();
  exp.setFullYear(exp.getFullYear() + 1);
  await prisma.driver.createMany({
    data: [
      { name: "Alex Chen", licenseNumber: "DL-001", licenseExpiry: exp, vehicleTypes: "VAN,TRUCK", status: DRIVER_STATUS.AVAILABLE, safetyScore: 95 },
      { name: "Sam Rivera", licenseNumber: "DL-002", licenseExpiry: exp, vehicleTypes: "TRUCK", status: DRIVER_STATUS.AVAILABLE, safetyScore: 88 },
      { name: "Jordan Lee", licenseNumber: "DL-003", licenseExpiry: exp, vehicleTypes: "VAN,BIKE", status: DRIVER_STATUS.OFF_DUTY, safetyScore: 92 },
    ],
  });

  await prisma.vehicle.createMany({
    data: [
      { name: "Van-05", model: "Transit 350", licensePlate: "VAN-05", maxLoadCapacityKg: 500, vehicleType: VEHICLE_TYPE.VAN, status: VEHICLE_STATUS.AVAILABLE, odometerKm: 45000, region: "North", acquisitionCost: 35000 },
      { name: "Truck-12", model: "F-150", licensePlate: "TRK-12", maxLoadCapacityKg: 1200, vehicleType: VEHICLE_TYPE.TRUCK, status: VEHICLE_STATUS.AVAILABLE, odometerKm: 78000, region: "South", acquisitionCost: 42000 },
      { name: "Bike-01", model: "Cargo Bike", licensePlate: "BIK-01", maxLoadCapacityKg: 80, vehicleType: VEHICLE_TYPE.BIKE, status: VEHICLE_STATUS.AVAILABLE, odometerKm: 12000, region: "Central", acquisitionCost: 2500 },
    ],
  });

  await prisma.cargo.createMany({
    data: [
      { description: "Electronics batch A", weightKg: 450, origin: "Warehouse A", destination: "Store B" },
      { description: "Pallet goods", weightKg: 800, origin: "DC North", destination: "Retail South" },
    ],
  });

  console.log("Seed complete.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
