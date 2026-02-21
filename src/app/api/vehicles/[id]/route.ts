import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VEHICLE_STATUS } from "@/lib/domain";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  licensePlate: z.string().min(1).optional(),
  maxLoadCapacityKg: z.number().positive().optional(),
  vehicleType: z.enum(["TRUCK", "VAN", "BIKE"]).optional(),
  region: z.string().optional(),
  odometerKm: z.number().min(0).optional(),
  status: z.enum(["AVAILABLE", "ON_TRIP", "IN_SHOP", "OUT_OF_SERVICE"]).optional(),
  acquisitionCost: z.number().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      maintenanceLogs: { orderBy: { performedAt: "desc" }, take: 10 },
      fuelLogs: { orderBy: { date: "desc" }, take: 10 },
    },
  });
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(vehicle);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const body = await request.json();
    const data = updateSchema.parse({
      ...body,
      maxLoadCapacityKg: body.maxLoadCapacityKg != null ? Number(body.maxLoadCapacityKg) : undefined,
      odometerKm: body.odometerKm != null ? Number(body.odometerKm) : undefined,
      acquisitionCost: body.acquisitionCost != null ? Number(body.acquisitionCost) : undefined,
    });
    if (data.licensePlate) {
      const existing = await prisma.vehicle.findFirst({
        where: { licensePlate: data.licensePlate, id: { not: id } },
      });
      if (existing) return NextResponse.json({ error: "License plate already in use" }, { status: 400 });
    }
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: data as Record<string, unknown>,
    });
    return NextResponse.json(vehicle);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.vehicle.update({
    where: { id },
    data: { status: VEHICLE_STATUS.OUT_OF_SERVICE },
  });
  return NextResponse.json({ success: true });
}
