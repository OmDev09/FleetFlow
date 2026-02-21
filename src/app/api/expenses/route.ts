import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  vehicleId: z.string(),
  description: z.string().min(1),
  amount: z.number().min(0),
  date: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get("vehicleId");

  const where = vehicleId ? { vehicleId } : {};
  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    include: { vehicle: { select: { id: true, name: true, licensePlate: true } } },
  });
  return NextResponse.json(expenses);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const data = createSchema.parse({
      ...body,
      amount: Number(body.amount),
    });
    const expense = await prisma.expense.create({
      data: {
        vehicleId: data.vehicleId,
        description: data.description,
        amount: data.amount,
        date: data.date ? new Date(data.date) : new Date(),
      },
    });
    return NextResponse.json(expense);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
