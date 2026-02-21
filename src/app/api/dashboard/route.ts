import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VEHICLE_STATUS } from "@/lib/domain";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [vehicles, trips, cargoCount, pendingCargoItems] = await Promise.all([
    prisma.vehicle.findMany({
      where: { status: { not: VEHICLE_STATUS.OUT_OF_SERVICE } },
      select: { id: true, name: true, model: true, status: true, vehicleType: true, region: true },
    }),
    prisma.trip.findMany({
      where: { status: "DISPATCHED" },
      select: { id: true },
    }),
    prisma.cargo.count({ where: { assignedTripId: null } }),
    prisma.cargo.findMany({
      where: { assignedTripId: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        description: true,
        weightKg: true,
        origin: true,
        destination: true,
        createdAt: true,
      },
    }),
  ]);

  const onTrip = vehicles.filter((v) => v.status === VEHICLE_STATUS.ON_TRIP).length;
  const inShop = vehicles.filter((v) => v.status === VEHICLE_STATUS.IN_SHOP).length;
  const available = vehicles.filter((v) => v.status === VEHICLE_STATUS.AVAILABLE).length;
  const totalActive = vehicles.length;
  const utilizationRate = totalActive ? Math.round(((onTrip + inShop) / totalActive) * 100) : 0;

  return NextResponse.json({
    kpis: {
      activeFleetOnTrip: onTrip,
      maintenanceAlerts: inShop,
      utilizationRate,
      pendingCargo: cargoCount,
      totalFleet: totalActive,
      available,
    },
    vehicles,
    pendingCargoItems,
    filters: {
      types: Array.from(new Set(vehicles.map((v) => v.vehicleType))),
      statuses: [VEHICLE_STATUS.AVAILABLE, VEHICLE_STATUS.ON_TRIP, VEHICLE_STATUS.IN_SHOP],
      regions: Array.from(new Set(vehicles.map((v) => v.region).filter(Boolean))) as string[],
    },
  });
}
