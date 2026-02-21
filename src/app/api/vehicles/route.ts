import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VEHICLE_STATUS } from "@/lib/domain";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  model: z.string().min(1),
  licensePlate: z.string().min(1),
  maxLoadCapacityKg: z.number().positive(),
  odometerKm: z.number().min(0).optional(),
  vehicleType: z.enum(["TRUCK", "VAN", "BIKE"]),
  region: z.string().optional(),
  acquisitionCost: z.number().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const availableOnly = searchParams.get("available") === "true";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (type) where.vehicleType = type;
  if (availableOnly) {
    where.status = VEHICLE_STATUS.AVAILABLE;
  }

  const vehicles = await prisma.vehicle.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { trips: true } } },
  });
  return NextResponse.json(vehicles);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const data = createSchema.parse({
      ...body,
      maxLoadCapacityKg: Number(body.maxLoadCapacityKg),
      odometerKm: body.odometerKm != null ? Number(body.odometerKm) : undefined,
      acquisitionCost: body.acquisitionCost != null ? Number(body.acquisitionCost) : undefined,
    });
    const existing = await prisma.vehicle.findUnique({
      where: { licensePlate: data.licensePlate },
    });
    if (existing) {
      return NextResponse.json({ error: "License plate already exists" }, { status: 400 });
    }
    const vehicle = await prisma.vehicle.create({
      data: {
        ...data,
        status: VEHICLE_STATUS.AVAILABLE,
        odometerKm: data.odometerKm ?? 0,
      },
    });
    return NextResponse.json(vehicle);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
