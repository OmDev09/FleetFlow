"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<"none" | "type" | "status" | "region">("none");
  const [filterBy, setFilterBy] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"name" | "odometer" | "maxLoad" | "type" | "status">("name");

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
    setVehicles((prev) => prev.map((u) => (u.id === v.id ? { ...u, status: next as VehicleStatus } : u)));
  }

  const searchedVehicles = vehicles.filter((v) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const haystack = `${v.name} ${v.model} ${v.licensePlate} ${v.vehicleType} ${v.status} ${v.region ?? ""}`.toLowerCase();
    return haystack.includes(q);
  });

  const filteredVehicles = searchedVehicles.filter((v) => {
    if (filterBy === "ALL") return true;
    if (filterBy.startsWith("TYPE:")) return v.vehicleType === filterBy.replace("TYPE:", "");
    if (filterBy.startsWith("STATUS:")) return v.status === filterBy.replace("STATUS:", "");
    if (filterBy.startsWith("REGION:")) return (v.region ?? "") === filterBy.replace("REGION:", "");
    return true;
  });

  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    switch (sortBy) {
      case "odometer":
        return b.odometerKm - a.odometerKm;
      case "maxLoad":
        return b.maxLoadCapacityKg - a.maxLoadCapacityKg;
      case "type":
        return a.vehicleType.localeCompare(b.vehicleType);
      case "status":
        return a.status.localeCompare(b.status);
      default:
        return `${a.name} ${a.model}`.localeCompare(`${b.name} ${b.model}`);
    }
  });

  const grouped = sortedVehicles.reduce<Record<string, Vehicle[]>>((acc, v) => {
    let key = "All Vehicles";
    if (groupBy === "type") key = v.vehicleType;
    if (groupBy === "status") key = v.status;
    if (groupBy === "region") key = v.region || "Unassigned";
    if (!acc[key]) acc[key] = [];
    acc[key].push(v);
    return acc;
  }, {});

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
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field min-w-[220px]"
              placeholder="Search bar ......"
            />
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as "none" | "type" | "status" | "region")}
              className="input-field w-auto min-w-[120px]"
            >
              <option value="none">Group by</option>
              <option value="type">Group by Type</option>
              <option value="status">Group by Status</option>
              <option value="region">Group by Region</option>
            </select>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="input-field w-auto min-w-[120px]"
            >
              <option value="ALL">Filter</option>
              <option value="TYPE:TRUCK">Type: Truck</option>
              <option value="TYPE:VAN">Type: Van</option>
              <option value="TYPE:BIKE">Type: Bike</option>
              <option value="STATUS:AVAILABLE">Status: Available</option>
              <option value="STATUS:ON_TRIP">Status: On Trip</option>
              <option value="STATUS:IN_SHOP">Status: In Shop</option>
              <option value="STATUS:OUT_OF_SERVICE">Status: Out of Service</option>
              <option value="REGION:North">Region: North</option>
              <option value="REGION:South">Region: South</option>
              <option value="REGION:Central">Region: Central</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "odometer" | "maxLoad" | "type" | "status")}
              className="input-field w-auto min-w-[120px]"
            >
              <option value="name">Sort by Name</option>
              <option value="odometer">Sort by Odometer</option>
              <option value="maxLoad">Sort by Max Load</option>
              <option value="type">Sort by Type</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>

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
              {Object.entries(grouped).map(([groupName, list]) => (
                <tbody key={groupName}>
                  {groupBy !== "none" && (
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                      <td colSpan={8} className="px-4 py-2 text-xs font-semibold text-slate-600">
                        {groupName}
                      </td>
                    </tr>
                  )}
                  {list.map((v) => (
                    <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-medium">{v.name}</span>
                        <span className="text-slate-500 ml-1">{v.model}</span>
                      </td>
                      <td className="px-4 py-3 font-mono">{v.licensePlate}</td>
                      <td className="px-4 py-3">{v.vehicleType}</td>
                      <td className="px-4 py-3">{v.maxLoadCapacityKg}</td>
                      <td className="px-4 py-3">{v.odometerKm.toLocaleString()}</td>
                      <td className="px-4 py-3">{v.region || "-"}</td>
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
              ))}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
