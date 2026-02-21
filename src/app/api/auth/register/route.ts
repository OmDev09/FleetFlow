import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { register } from "@/lib/auth";
import { ROLE } from "@/lib/domain";

const bodySchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum([ROLE.MANAGER, ROLE.DISPATCHER, ROLE.SAFETY_OFFICER, ROLE.FINANCIAL_ANALYST]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role } = bodySchema.parse(body);
    const result = await register(name, email, password, role);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
