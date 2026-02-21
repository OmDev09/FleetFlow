import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DRIVER_STATUS, TRIP_STATUS, VEHICLE_STATUS } from "@/lib/domain";
import { z } from "zod";

const createSchema = z.object({
  vehicleId: z.string(),
  driverId: z.string(),
  cargoWeightKg: z.number().positive(),
  origin: z.string().min(1),
  destination: z.string().min(1),
  cargoId: z.string().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trips = await prisma.trip.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: { select: { id: true, name: true, licensePlate: true, maxLoadCapacityKg: true } },
      driver: { select: { id: true, name: true, licenseNumber: true } },
    },
  });
  return NextResponse.json(trips);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const data = createSchema.parse({
      ...body,
      cargoWeightKg: Number(body.cargoWeightKg),
    });

    const [vehicle, driver] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id: data.vehicleId } }),
      prisma.driver.findUnique({ where: { id: data.driverId } }),
    ]);

    if (!vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    if (vehicle.status !== VEHICLE_STATUS.AVAILABLE) {
      return NextResponse.json({ error: "Vehicle is not available" }, { status: 400 });
    }
    if (driver.status !== DRIVER_STATUS.AVAILABLE) {
      return NextResponse.json({ error: "Driver is not available" }, { status: 400 });
    }
    if (new Date() > driver.licenseExpiry) {
      return NextResponse.json({ error: "Driver license has expired" }, { status: 400 });
    }
    const driverTypes = driver.vehicleTypes.split(",").map((s) => s.trim());
    if (!driverTypes.includes(vehicle.vehicleType)) {
      return NextResponse.json({ error: "Driver not authorized for this vehicle type" }, { status: 400 });
    }
    if (data.cargoWeightKg > vehicle.maxLoadCapacityKg) {
      return NextResponse.json(
        { error: `Cargo weight (${data.cargoWeightKg} kg) exceeds vehicle max capacity (${vehicle.maxLoadCapacityKg} kg)` },
        { status: 400 }
      );
    }

    const trip = await prisma.trip.create({
      data: {
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        cargoWeightKg: data.cargoWeightKg,
        origin: data.origin,
        destination: data.destination,
        status: TRIP_STATUS.DRAFT,
      },
    });

    if (data.cargoId) {
      await prisma.cargo.update({
        where: { id: data.cargoId },
        data: { assignedTripId: trip.id },
      });
    }

    return NextResponse.json(trip);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
