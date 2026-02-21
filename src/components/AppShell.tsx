"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROLE, type Role } from "@/lib/domain";
import {
  LayoutDashboard,
  Truck,
  MapPin,
  Wrench,
  Fuel,
  UserCheck,
  BarChart3,
  LogOut,
} from "lucide-react";

const nav: { href: string; label: string; icon: React.ElementType; roles?: Role[] }[] = [
  { href: "/dashboard", label: "Command Center", icon: LayoutDashboard },
  { href: "/vehicles", label: "Vehicle Registry", icon: Truck, roles: [ROLE.MANAGER, ROLE.DISPATCHER] },
  { href: "/trips", label: "Trip Dispatcher", icon: MapPin, roles: [ROLE.MANAGER, ROLE.DISPATCHER] },
  { href: "/maintenance", label: "Maintenance & Service", icon: Wrench, roles: [ROLE.MANAGER] },
  { href: "/expenses", label: "Expenses & Fuel", icon: Fuel, roles: [ROLE.MANAGER, ROLE.FINANCIAL_ANALYST] },
  { href: "/drivers", label: "Driver Performance", icon: UserCheck, roles: [ROLE.MANAGER, ROLE.SAFETY_OFFICER] },
  { href: "/analytics", label: "Analytics & Reports", icon: BarChart3, roles: [ROLE.MANAGER, ROLE.FINANCIAL_ANALYST] },
];

export default function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const role = user.role as Role;
  const filteredNav = nav.filter((n) => !n.roles || n.roles.includes(role));

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-slate-200 bg-slate-900 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <Link href="/dashboard" className="font-bold text-teal-400">FleetFlow</Link>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-teal-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-slate-700">
          <div className="px-3 py-2 text-xs text-slate-400 truncate" title={user.email}>
            {user.name} · {user.role}
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-slate-50 p-6">{children}</main>
    </div>
  );
}
