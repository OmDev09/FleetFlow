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
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#ecfeff_0%,transparent_34%),radial-gradient(circle_at_88%_20%,#dbeafe_0%,transparent_40%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] p-3 md:p-4 dark:bg-[radial-gradient(circle_at_10%_10%,#134e4a_0%,transparent_34%),radial-gradient(circle_at_88%_20%,#1e3a8a_0%,transparent_40%),linear-gradient(180deg,#0b1220_0%,#111827_100%)]">
      <div className="flex min-h-[calc(100vh-1.5rem)] gap-3 md:gap-4">
        <aside className="flex w-16 shrink-0 flex-col rounded-2xl border border-white/80 bg-white/85 shadow-xl backdrop-blur-xl dark:border-slate-600/70 dark:bg-slate-900/45 md:w-60">
          <div className="border-b border-slate-200/70 p-4 dark:border-slate-700/70">
            <Link href="/dashboard" className="font-display text-lg font-semibold text-teal-700 dark:text-teal-300">
              <span className="md:hidden">FF</span>
              <span className="hidden md:inline">FleetFlow</span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 p-2">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-teal-600 text-white shadow-md dark:bg-teal-500"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200/70 p-2 dark:border-slate-700/70">
            <div className="truncate px-3 py-2 text-xs text-slate-500 dark:text-slate-400 md:text-sm" title={user.email}>
              <span className="hidden md:inline">{user.name} - {user.role}</span>
              <span className="md:hidden">{user.name.slice(0, 1)}</span>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-100"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Sign out</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto rounded-2xl border border-white/85 bg-white/82 p-5 shadow-xl backdrop-blur-xl dark:border-slate-600/70 dark:bg-slate-900/40 md:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
