import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const pendingOnly = searchParams.get("pending") === "true";

  const where = pendingOnly ? { OR: [{ assignedTripId: null }, { assignedTripId: "" }] } : {};
  const cargo = await prisma.cargo.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(cargo);
}
