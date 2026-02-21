import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DRIVER_STATUS } from "@/lib/domain";
import { z } from "zod";

const createDriverSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  licenseNumber: z.string().min(3),
  licenseExpiry: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  vehicleTypes: z.array(z.enum(["TRUCK", "VAN", "BIKE"])).min(1),
  safetyScore: z.number().min(0).max(100).optional(),
  status: z.enum(["AVAILABLE", "ON_DUTY", "OFF_DUTY", "SUSPENDED"]).optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const availableOnly = searchParams.get("available") === "true";
  const vehicleType = searchParams.get("vehicleType");

  const where: Record<string, unknown> = {};
  if (availableOnly) {
    where.status = DRIVER_STATUS.AVAILABLE;
    where.licenseExpiry = { gt: new Date() };
  }
  const drivers = await prisma.driver.findMany({
    where,
    orderBy: { name: "asc" },
  });

  let filtered = drivers;
  if (vehicleType) {
    filtered = drivers.filter((d) => d.vehicleTypes.split(",").map((s) => s.trim()).includes(vehicleType));
  }
  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const data = createDriverSchema.parse(body);

    const driver = await prisma.driver.create({
      data: {
        name: data.name,
        email: data.email ?? null,
        licenseNumber: data.licenseNumber,
        licenseExpiry: new Date(data.licenseExpiry),
        vehicleTypes: data.vehicleTypes.join(","),
        safetyScore: data.safetyScore ?? 100,
        status: data.status ?? DRIVER_STATUS.AVAILABLE,
      },
    });

    return NextResponse.json(driver);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
