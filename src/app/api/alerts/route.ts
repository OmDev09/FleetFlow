import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AlertLevel = "critical" | "warning";

type AlertItem = {
  id: string;
  level: AlertLevel;
  title: string;
  message: string;
  createdAt: string;
};

const TRIP_OVERDUE_HOURS = 24;
const LICENSE_EXPIRY_DAYS = 7;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const overdueCutoff = new Date(now.getTime() - TRIP_OVERDUE_HOURS * 60 * 60 * 1000);
  const licenseCutoff = new Date(now.getTime() + LICENSE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const [overdueTrips, expiringDrivers, vehicles, vehiclesInShop, fuelLogs, maintenanceLogs, expenses, tripsWithRevenue] =
    await Promise.all([
      prisma.trip.findMany({
        where: { status: "DISPATCHED", createdAt: { lt: overdueCutoff } },
        select: {
          id: true,
          createdAt: true,
          vehicle: { select: { name: true, licensePlate: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.driver.findMany({
        where: { licenseExpiry: { gte: now, lte: licenseCutoff } },
        select: { id: true, name: true, licenseExpiry: true },
        orderBy: { licenseExpiry: "asc" },
      }),
      prisma.vehicle.findMany({
        select: { id: true, name: true, licensePlate: true, acquisitionCost: true },
      }),
      prisma.vehicle.findMany({
        where: { status: "IN_SHOP" },
        select: { id: true, name: true, licensePlate: true, updatedAt: true },
      }),
      prisma.fuelLog.findMany({
        select: { vehicleId: true, cost: true },
      }),
      prisma.maintenanceLog.findMany({
        select: { vehicleId: true, cost: true },
      }),
      prisma.expense.findMany({
        select: { vehicleId: true, amount: true },
      }),
      prisma.trip.findMany({
        where: { revenue: { not: null } },
        select: { vehicleId: true, revenue: true },
      }),
    ]);

  const alerts: AlertItem[] = [];

  overdueTrips.forEach((t) => {
    alerts.push({
      id: `trip-overdue-${t.id}`,
      level: "critical",
      title: "Vehicle overdue on trip",
      message: `${t.vehicle.name} (${t.vehicle.licensePlate}) dispatch is overdue.`,
      createdAt: t.createdAt.toISOString(),
    });
  });

  expiringDrivers.forEach((d) => {
    const daysLeft = Math.max(
      0,
      Math.ceil((new Date(d.licenseExpiry).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    );
    alerts.push({
      id: `license-expiry-${d.id}`,
      level: "warning",
      title: "License expiring soon",
      message: `${d.name} license expires in ${daysLeft} day(s).`,
      createdAt: new Date(d.licenseExpiry).toISOString(),
    });
  });

  vehiclesInShop.forEach((v) => {
    alerts.push({
      id: `maintenance-active-${v.id}`,
      level: "warning",
      title: "Maintenance request active",
      message: `${v.name} (${v.licensePlate}) is currently in shop.`,
      createdAt: new Date(v.updatedAt).toISOString(),
    });
  });

  const fuelByVehicle: Record<string, number> = {};
  const maintenanceCostByVehicle: Record<string, number> = {};
  const expenseByVehicle: Record<string, number> = {};
  const revenueByVehicle: Record<string, number> = {};

  fuelLogs.forEach((f) => {
    fuelByVehicle[f.vehicleId] = (fuelByVehicle[f.vehicleId] ?? 0) + f.cost;
  });
  maintenanceLogs.forEach((m) => {
    maintenanceCostByVehicle[m.vehicleId] = (maintenanceCostByVehicle[m.vehicleId] ?? 0) + (m.cost ?? 0);
  });
  expenses.forEach((e) => {
    expenseByVehicle[e.vehicleId] = (expenseByVehicle[e.vehicleId] ?? 0) + e.amount;
  });
  tripsWithRevenue.forEach((t) => {
    revenueByVehicle[t.vehicleId] = (revenueByVehicle[t.vehicleId] ?? 0) + (t.revenue ?? 0);
  });

  vehicles.forEach((v) => {
    const acq = v.acquisitionCost ?? 0;
    if (acq <= 0) return;
    const totalCost =
      (fuelByVehicle[v.id] ?? 0) +
      (maintenanceCostByVehicle[v.id] ?? 0) +
      (expenseByVehicle[v.id] ?? 0);
    const revenue = revenueByVehicle[v.id] ?? 0;
    const roi = ((revenue - totalCost) / acq) * 100;
    if (roi < 0) {
      alerts.push({
        id: `negative-roi-${v.id}`,
        level: "critical",
        title: "Negative ROI detected",
        message: `${v.name} (${v.licensePlate}) has negative ROI (${roi.toFixed(1)}%).`,
        createdAt: now.toISOString(),
      });
    }
  });

  alerts.sort((a, b) => {
    if (a.level !== b.level) return a.level === "critical" ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const critical = alerts.filter((a) => a.level === "critical").length;
  const warning = alerts.filter((a) => a.level === "warning").length;

  return NextResponse.json({
    alerts,
    summary: {
      total: alerts.length,
      critical,
      warning,
    },
  });
}
