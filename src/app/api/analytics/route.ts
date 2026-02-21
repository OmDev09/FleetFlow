import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [vehicles, fuelLogs, maintenanceLogs, trips] = await Promise.all([
    prisma.vehicle.findMany({
      where: { status: { not: "OUT_OF_SERVICE" } },
      include: { fuelLogs: true, maintenanceLogs: true, expenses: true },
    }),
    prisma.fuelLog.findMany(),
    prisma.maintenanceLog.findMany(),
    prisma.trip.findMany({
      where: { status: "COMPLETED" },
      include: { vehicle: true },
    }),
  ]);

  const fuelByVehicle: Record<string, { liters: number; cost: number; km: number }> = {};
  trips.forEach((t) => {
    if (!t.vehicleId || !t.endOdometerKm || !t.startOdometerKm) return;
    const km = t.endOdometerKm - t.startOdometerKm;
    if (!fuelByVehicle[t.vehicleId]) fuelByVehicle[t.vehicleId] = { liters: 0, cost: 0, km: 0 };
    fuelByVehicle[t.vehicleId].km += km;
  });
  fuelLogs.forEach((f) => {
    if (!fuelByVehicle[f.vehicleId]) fuelByVehicle[f.vehicleId] = { liters: 0, cost: 0, km: 0 };
    fuelByVehicle[f.vehicleId].liters += f.liters;
    fuelByVehicle[f.vehicleId].cost += f.cost;
  });

  const maintenanceCostByVehicle: Record<string, number> = {};
  maintenanceLogs.forEach((m) => {
    maintenanceCostByVehicle[m.vehicleId] = (maintenanceCostByVehicle[m.vehicleId] ?? 0) + (m.cost ?? 0);
  });
  const expenseByVehicle: Record<string, number> = {};
  const expenses = await prisma.expense.findMany();
  expenses.forEach((e) => {
    expenseByVehicle[e.vehicleId] = (expenseByVehicle[e.vehicleId] ?? 0) + e.amount;
  });

  const revenueByVehicle: Record<string, number> = {};
  trips.forEach((t) => {
    const rev = (t as { revenue?: number | null }).revenue ?? 0;
    if (t.vehicleId) revenueByVehicle[t.vehicleId] = (revenueByVehicle[t.vehicleId] ?? 0) + rev;
  });

  const vehicleMetrics = vehicles.map((v) => {
    const fuel = fuelByVehicle[v.id] ?? { liters: 0, cost: 0, km: 0 };
    const maintenanceCost = maintenanceCostByVehicle[v.id] ?? 0;
    const otherExpense = expenseByVehicle[v.id] ?? 0;
    const totalCost = fuel.cost + maintenanceCost + otherExpense;
    const revenue = revenueByVehicle[v.id] ?? 0;
    const acq = v.acquisitionCost ?? 0;
    const roi = acq > 0 ? ((revenue - totalCost) / acq) * 100 : null;
    const kmPerL = fuel.liters > 0 ? fuel.km / fuel.liters : null;
    return {
      vehicleId: v.id,
      name: v.name,
      licensePlate: v.licensePlate,
      fuelEfficiencyKmPerL: kmPerL != null ? Math.round(kmPerL * 10) / 10 : null,
      totalFuelCost: fuel.cost,
      totalMaintenanceCost: maintenanceCost,
      totalOperationalCost: totalCost,
      revenue,
      acquisitionCost: acq,
      roiPercent: roi != null ? Math.round(roi * 10) / 10 : null,
    };
  });

  return NextResponse.json({
    vehicleMetrics,
    summary: {
      totalFleet: vehicles.length,
      totalTripsCompleted: trips.length,
    },
  });
}
