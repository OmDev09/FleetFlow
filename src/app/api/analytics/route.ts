import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function monthKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelFromKey(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [vehicles, fuelLogs, maintenanceLogs, trips, expenses] = await Promise.all([
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
    prisma.expense.findMany(),
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

  const monthlyMap: Record<
    string,
    { revenue: number; fuelCost: number; maintenanceCost: number; otherExpense: number; fuelLiters: number; tripKm: number }
  > = {};

  function initMonth(key: string) {
    if (!monthlyMap[key]) {
      monthlyMap[key] = {
        revenue: 0,
        fuelCost: 0,
        maintenanceCost: 0,
        otherExpense: 0,
        fuelLiters: 0,
        tripKm: 0,
      };
    }
  }

  fuelLogs.forEach((f) => {
    const key = monthKeyFromDate(f.date);
    initMonth(key);
    monthlyMap[key].fuelCost += f.cost;
    monthlyMap[key].fuelLiters += f.liters;
  });

  maintenanceLogs.forEach((m) => {
    const key = monthKeyFromDate(m.performedAt);
    initMonth(key);
    monthlyMap[key].maintenanceCost += m.cost ?? 0;
  });

  expenses.forEach((e) => {
    const key = monthKeyFromDate(e.date);
    initMonth(key);
    monthlyMap[key].otherExpense += e.amount;
  });

  trips.forEach((t) => {
    const tripDate = t.completedAt ?? t.createdAt;
    const key = monthKeyFromDate(tripDate);
    initMonth(key);
    monthlyMap[key].revenue += t.revenue ?? 0;
    if (t.startOdometerKm != null && t.endOdometerKm != null && t.endOdometerKm >= t.startOdometerKm) {
      monthlyMap[key].tripKm += t.endOdometerKm - t.startOdometerKm;
    }
  });

  const monthlyFinancials = Object.keys(monthlyMap)
    .sort()
    .map((key) => {
      const m = monthlyMap[key];
      const totalOperationalCost = m.fuelCost + m.maintenanceCost + m.otherExpense;
      const netProfit = m.revenue - totalOperationalCost;
      const fuelEfficiencyKmPerL = m.fuelLiters > 0 ? Math.round((m.tripKm / m.fuelLiters) * 10) / 10 : null;
      return {
        monthKey: key,
        monthLabel: monthLabelFromKey(key),
        revenue: Math.round(m.revenue * 100) / 100,
        fuelCost: Math.round(m.fuelCost * 100) / 100,
        maintenanceCost: Math.round(m.maintenanceCost * 100) / 100,
        otherExpense: Math.round(m.otherExpense * 100) / 100,
        totalOperationalCost: Math.round(totalOperationalCost * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        fuelEfficiencyKmPerL,
      };
    });

  const fuelEfficiencyTrend = monthlyFinancials.slice(-6).map((m) => ({
    month: m.monthLabel,
    fuelEfficiencyKmPerL: m.fuelEfficiencyKmPerL,
  }));

  const topCostlyVehicles = [...vehicleMetrics]
    .sort((a, b) => b.totalOperationalCost - a.totalOperationalCost)
    .slice(0, 5)
    .map((v) => ({
      vehicle: v.licensePlate,
      totalOperationalCost: Math.round(v.totalOperationalCost * 100) / 100,
    }));

  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const totalRevenue = vehicleMetrics.reduce((sum, v) => sum + v.revenue, 0);
  const totalOperationalCost = vehicleMetrics.reduce((sum, v) => sum + v.totalOperationalCost, 0);
  const totalAcquisitionCost = vehicleMetrics.reduce((sum, v) => sum + v.acquisitionCost, 0);
  const fleetRoiPercent = totalAcquisitionCost > 0 ? ((totalRevenue - totalOperationalCost) / totalAcquisitionCost) * 100 : null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const utilizedVehicleIds = new Set(
    trips
      .filter((t) => {
        const tripDate = t.completedAt ?? t.createdAt;
        return tripDate >= thirtyDaysAgo;
      })
      .map((t) => t.vehicleId)
  );
  const utilizationRatePercent = vehicles.length > 0 ? (utilizedVehicleIds.size / vehicles.length) * 100 : 0;

  return NextResponse.json({
    vehicleMetrics,
    fuelEfficiencyTrend,
    topCostlyVehicles,
    monthlyFinancials,
    summary: {
      totalFleet: vehicles.length,
      totalTripsCompleted: trips.length,
      totalFuelCost: Math.round(totalFuelCost * 100) / 100,
      fleetRoiPercent: fleetRoiPercent != null ? Math.round(fleetRoiPercent * 10) / 10 : null,
      utilizationRatePercent: Math.round(utilizationRatePercent * 10) / 10,
    },
  });
}
