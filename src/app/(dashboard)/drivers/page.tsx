"use client";

import { useEffect, useState } from "react";
import { UserCheck, AlertCircle } from "lucide-react";
import type { DriverStatus } from "@/lib/domain";

type Driver = {
  id: string;
  name: string;
  licenseNumber: string;
  licenseExpiry: string;
  vehicleTypes: string;
  status: DriverStatus;
  safetyScore: number;
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [tripCounts, setTripCounts] = useState<Record<string, { total: number; completed: number }>>({});

  useEffect(() => {
    fetch("/api/drivers")
      .then((r) => r.json())
      .then((list: Driver[]) => {
        setDrivers(list);
        return Promise.all(list.map((d) => fetch(`/api/drivers/${d.id}`).then((r) => r.json())));
      })
      .then((details) => {
        const counts: Record<string, { total: number; completed: number }> = {};
        details.forEach((d: { id: string; trips: { status: string }[] }) => {
          const total = d.trips?.length ?? 0;
          const completed = d.trips?.filter((t) => t.status === "COMPLETED").length ?? 0;
          counts[d.id] = { total, completed };
        });
        setTripCounts(counts);
      });
  }, []);

  async function setStatus(id: string, status: DriverStatus) {
    await fetch(`/api/drivers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
  }

  const statusPill: Record<string, string> = {
    AVAILABLE: "pill-available",
    ON_DUTY: "pill-on-trip",
    OFF_DUTY: "pill-draft",
    SUSPENDED: "pill-out-of-service",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Driver Performance & Safety</h1>
        <p className="text-slate-600">License expiry blocks assignment; trip completion and safety scores</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Driver</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">License</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Expiry</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Compliance</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Vehicle types</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Trip completion</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Safety score</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => {
                const expired = new Date(d.licenseExpiry) < new Date();
                const c = tripCounts[d.id];
                const completionRate = c && c.total > 0 ? Math.round((c.completed / c.total) * 100) : null;
                return (
                  <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{d.name}</td>
                    <td className="px-4 py-3 font-mono">{d.licenseNumber}</td>
                    <td className="px-4 py-3">{new Date(d.licenseExpiry).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {expired ? (
                        <span className="text-red-600 inline-flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          Expired (blocked)
                        </span>
                      ) : (
                        <span className="text-emerald-600">Valid</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{d.vehicleTypes}</td>
                    <td className="px-4 py-3">
                      {completionRate != null ? `${completionRate}% (${c!.completed}/${c!.total})` : "—"}
                    </td>
                    <td className="px-4 py-3">{d.safetyScore}</td>
                    <td className="px-4 py-3">
                      <span className={`pill ${statusPill[d.status] || ""}`}>
                        {d.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={d.status}
                        onChange={(e) => setStatus(d.id, e.target.value as DriverStatus)}
                        className="input-field w-auto text-xs py-1"
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="ON_DUTY">On Duty</option>
                        <option value="OFF_DUTY">Off Duty</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
