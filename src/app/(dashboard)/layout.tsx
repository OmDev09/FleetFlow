import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, role: true },
  });
  if (!user) redirect("/login");
  return (
    <AppShell user={{ ...user, role: user.role }}>{children}</AppShell>
  );
}
