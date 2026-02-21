"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  Bell,
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
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState<{ id: string; level: "critical" | "warning"; title: string; message: string }[]>([]);

  useEffect(() => {
    let mounted = true;
    async function loadAlerts() {
      try {
        const res = await fetch("/api/alerts");
        const raw = await res.text();
        if (!res.ok || !raw) return;
        const data = JSON.parse(raw) as { alerts?: { id: string; level: "critical" | "warning"; title: string; message: string }[] };
        if (mounted) setAlerts(data.alerts ?? []);
      } catch {
        // Ignore transient notification fetch failures
      }
    }

    if (pathname === "/dashboard") {
      loadAlerts();
    }

    function onRefreshRequest() {
      loadAlerts();
    }

    window.addEventListener("fleetflow:alerts-refresh", onRefreshRequest);
    const timer = setInterval(() => {
      if (pathname === "/dashboard") loadAlerts();
    }, 15000);

    return () => {
      mounted = false;
      window.removeEventListener("fleetflow:alerts-refresh", onRefreshRequest);
      clearInterval(timer);
    };
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#ecfeff_0%,transparent_34%),radial-gradient(circle_at_88%_20%,#dbeafe_0%,transparent_40%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] p-3 md:p-4 dark:bg-[radial-gradient(circle_at_10%_10%,#134e4a_0%,transparent_34%),radial-gradient(circle_at_88%_20%,#1e3a8a_0%,transparent_40%),linear-gradient(180deg,#0b1220_0%,#111827_100%)]">
      {pathname === "/dashboard" && (
        <div className="fixed right-16 top-4 z-50">
          <button
            type="button"
            onClick={() => setAlertsOpen((v) => !v)}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300/70 bg-white/85 text-slate-700 shadow-lg backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-100"
            aria-label="Alerts"
          >
            <Bell className="h-5 w-5" />
            {alerts.length > 0 && (
              <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-rose-600 px-1 text-center text-[10px] font-semibold text-white">
                {alerts.length > 99 ? "99+" : alerts.length}
              </span>
            )}
          </button>
        </div>
      )}
      {alertsOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setAlertsOpen(false)}>
          <div className="absolute inset-0 bg-black/25" />
          <div
            className="absolute right-6 top-16 w-[560px] max-w-[calc(100vw-3rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
              <span className="text-sm text-slate-500 dark:text-slate-400">{alerts.length} active</span>
            </div>
            <div className="max-h-[70vh] space-y-2 overflow-auto pr-1">
              {alerts.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">No active alerts</p>
              )}
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    a.level === "critical"
                      ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-200"
                      : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-200"
                  }`}
                >
                  <p className="font-medium">{a.title}</p>
                  <p>{a.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
