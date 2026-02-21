import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DRIVER_STATUS, TRIP_STATUS, VEHICLE_STATUS } from "@/lib/domain";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"]).optional(),
  endOdometerKm: z.number().min(0).optional(),
  revenue: z.number().min(0).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      vehicle: true,
      driver: true,
    },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(trip);
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
      endOdometerKm: body.endOdometerKm != null ? Number(body.endOdometerKm) : undefined,
      revenue: body.revenue != null ? Number(body.revenue) : undefined,
    });

    const trip = await prisma.trip.findUnique({ where: { id }, include: { vehicle: true } });
    if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (data.status === "DISPATCHED") {
      await prisma.$transaction([
        prisma.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: VEHICLE_STATUS.ON_TRIP },
        }),
        prisma.driver.update({
          where: { id: trip.driverId },
          data: { status: DRIVER_STATUS.ON_DUTY },
        }),
        prisma.trip.update({
          where: { id },
          data: { status: TRIP_STATUS.DISPATCHED, startOdometerKm: trip.vehicle.odometerKm },
        }),
      ]);
      const updated = await prisma.trip.findUnique({ where: { id }, include: { vehicle: true, driver: true } });
      return NextResponse.json(updated);
    }

    if (data.status === "COMPLETED") {
      const endKm = data.endOdometerKm ?? trip.vehicle.odometerKm;
      await prisma.$transaction([
        prisma.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: VEHICLE_STATUS.AVAILABLE, odometerKm: endKm },
        }),
        prisma.driver.update({
          where: { id: trip.driverId },
          data: { status: DRIVER_STATUS.AVAILABLE },
        }),
        prisma.trip.update({
          where: { id },
          data: {
            status: TRIP_STATUS.COMPLETED,
            endOdometerKm: endKm,
            completedAt: new Date(),
            ...(data.revenue != null && { revenue: data.revenue }),
          },
        }),
      ]);
      const updated = await prisma.trip.findUnique({ where: { id }, include: { vehicle: true, driver: true } });
      return NextResponse.json(updated);
    }

    if (data.status === "CANCELLED") {
      if (trip.status === TRIP_STATUS.DISPATCHED) {
        await prisma.$transaction([
          prisma.vehicle.update({
            where: { id: trip.vehicleId },
            data: { status: VEHICLE_STATUS.AVAILABLE },
          }),
          prisma.driver.update({
            where: { id: trip.driverId },
            data: { status: DRIVER_STATUS.AVAILABLE },
          }),
        ]);
      }
      await prisma.trip.update({
        where: { id },
        data: { status: TRIP_STATUS.CANCELLED },
      });
      const updated = await prisma.trip.findUnique({ where: { id }, include: { vehicle: true, driver: true } });
      return NextResponse.json(updated);
    }

    const updated = await prisma.trip.update({
      where: { id },
      data: data as Record<string, unknown>,
      include: { vehicle: true, driver: true },
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
