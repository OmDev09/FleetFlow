"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Truck } from "lucide-react";
import type { VehicleType, VehicleStatus } from "@/lib/domain";
import { usePollingRefresh } from "@/lib/usePollingRefresh";

type Vehicle = {
  id: string;
  name: string;
  model: string;
  licensePlate: string;
  maxLoadCapacityKg: number;
  vehicleType: VehicleType;
  status: VehicleStatus;
  odometerKm: number;
  region: string | null;
};

const statusClass: Record<string, string> = {
  AVAILABLE: "pill-available",
  ON_TRIP: "pill-on-trip",
  IN_SHOP: "pill-in-shop",
  OUT_OF_SERVICE: "pill-out-of-service",
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then(setVehicles)
      .finally(() => setLoading(false));
  }, []);

  usePollingRefresh(load, 5000);

  async function toggleOutOfService(v: Vehicle) {
    const next = v.status === "OUT_OF_SERVICE" ? "AVAILABLE" : "OUT_OF_SERVICE";
    await fetch(`/api/vehicles/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setVehicles((prev) =>
      prev.map((u) => (u.id === v.id ? { ...u, status: next as VehicleStatus } : u))
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vehicle Registry</h1>
          <p className="text-slate-600">Manage fleet assets</p>
        </div>
        <Link href="/vehicles/new" className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add vehicle
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Name / Model</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">License Plate</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Max Load (kg)</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Odometer (km)</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Region</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-medium">{v.name}</span>
                      <span className="text-slate-500 ml-1">{v.model}</span>
                    </td>
                    <td className="px-4 py-3 font-mono">{v.licensePlate}</td>
                    <td className="px-4 py-3">{v.vehicleType}</td>
                    <td className="px-4 py-3">{v.maxLoadCapacityKg}</td>
                    <td className="px-4 py-3">{v.odometerKm.toLocaleString()}</td>
                    <td className="px-4 py-3">{v.region || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`pill ${statusClass[v.status] || ""}`}>
                        {v.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <Link
                        href={`/vehicles/${v.id}/edit`}
                        className="text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleOutOfService(v)}
                        className="text-amber-600 hover:text-amber-700 text-xs"
                      >
                        {v.status === "OUT_OF_SERVICE" ? "Restore" : "Retire"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
