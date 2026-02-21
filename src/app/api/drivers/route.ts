import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DRIVER_STATUS } from "@/lib/domain";

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
