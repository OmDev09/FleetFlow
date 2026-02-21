import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["AVAILABLE", "ON_DUTY", "OFF_DUTY", "SUSPENDED"]).optional(),
  safetyScore: z.number().min(0).max(100).optional(),
  name: z.string().min(1).optional(),
  licenseNumber: z.string().optional(),
  licenseExpiry: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const driver = await prisma.driver.findUnique({
    where: { id },
    include: {
      trips: {
        select: { id: true, status: true, completedAt: true },
      },
    },
  });
  if (!driver) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(driver);
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
    const data = updateSchema.parse(body);
    const update: Record<string, unknown> = {};
    if (data.status !== undefined) update.status = data.status;
    if (data.safetyScore !== undefined) update.safetyScore = data.safetyScore;
    if (data.name !== undefined) update.name = data.name;
    if (data.licenseNumber !== undefined) update.licenseNumber = data.licenseNumber;
    if (data.licenseExpiry !== undefined) update.licenseExpiry = new Date(data.licenseExpiry);
    const driver = await prisma.driver.update({
      where: { id },
      data: update,
    });
    return NextResponse.json(driver);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
