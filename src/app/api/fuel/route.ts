import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  vehicleId: z.string(),
  liters: z.number().positive(),
  cost: z.number().min(0),
  date: z.string().optional(),
  tripId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get("vehicleId");

  const where = vehicleId ? { vehicleId } : {};
  const logs = await prisma.fuelLog.findMany({
    where,
    orderBy: { date: "desc" },
    include: { vehicle: { select: { id: true, name: true, licensePlate: true } } },
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
      liters: Number(body.liters),
      cost: Number(body.cost),
    });
    const log = await prisma.fuelLog.create({
      data: {
        vehicleId: data.vehicleId,
        liters: data.liters,
        cost: data.cost,
        date: data.date ? new Date(data.date) : new Date(),
        tripId: data.tripId,
      },
    });
    return NextResponse.json(log);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
