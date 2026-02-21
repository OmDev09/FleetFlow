import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VEHICLE_STATUS } from "@/lib/domain";
import { z } from "zod";

const createSchema = z.object({
  vehicleId: z.string(),
  description: z.string().min(1),
  cost: z.number().min(0).optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get("vehicleId");

  const where = vehicleId ? { vehicleId } : {};
  const logs = await prisma.maintenanceLog.findMany({
    where,
    orderBy: { performedAt: "desc" },
    include: { vehicle: { select: { id: true, name: true, licensePlate: true, status: true } } },
  });
  return NextResponse.json(logs);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const data = createSchema.parse({
      ...body,
      cost: body.cost != null ? Number(body.cost) : undefined,
    });

    const [log] = await prisma.$transaction([
      prisma.maintenanceLog.create({
        data: {
          vehicleId: data.vehicleId,
          description: data.description,
          cost: data.cost,
        },
      }),
      prisma.vehicle.update({
        where: { id: data.vehicleId },
        data: { status: VEHICLE_STATUS.IN_SHOP },
      }),
    ]);
    return NextResponse.json(log);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
