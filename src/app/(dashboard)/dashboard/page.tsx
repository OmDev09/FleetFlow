"use client";

import { useCallback, useState } from "react";
import { Truck, AlertTriangle, Percent, Package } from "lucide-react";
import { usePollingRefresh } from "@/lib/usePollingRefresh";

type KPIs = {
  activeFleetOnTrip: number;
  maintenanceAlerts: number;
  utilizationRate: number;
  pendingCargo: number;
  totalFleet: number;
  available: number;
};

type Vehicle = {
  id: string;
  name: string;
  model: string;
  status: string;
  vehicleType: string;
  region: string | null;
};

export default function CommandCenterPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterRegion, setFilterRegion] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("tripNo");

  const load = useCallback(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setKpis(data.kpis);
        setVehicles(data.vehicles || []);
      });
  }, []);

  usePollingRefresh(load, 5000);

  const filtered = vehicles.filter((v) => {
    if (filterType && v.vehicleType !== filterType) return false;
    if (filterStatus && v.status !== filterStatus) return false;
    if (filterRegion && v.region !== filterRegion) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = `${v.name} ${v.model} ${v.id} ${v.vehicleType} ${v.region ?? ""} ${v.status}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "vehicleId":
        return a.id.localeCompare(b.id);
      case "vehicleName":
        return `${a.name} ${a.model}`.localeCompare(`${b.name} ${b.model}`);
      case "type":
        return a.vehicleType.localeCompare(b.vehicleType);
      case "region":
        return (a.region ?? "").localeCompare(b.region ?? "");
      case "status":
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  function toNumericVehicleId(rawId: string): string {
    let sum = 0;
    for (let i = 0; i < rawId.length; i += 1) {
      sum = (sum * 31 + rawId.charCodeAt(i)) % 1000000;
    }
    return `VH-${(sum + 100000).toString().padStart(6, "0")}`;
  }

  const statusClass: Record<string, string> = {
    AVAILABLE: "pill-available",
    ON_TRIP: "pill-on-trip",
    IN_SHOP: "pill-in-shop",
    OUT_OF_SERVICE: "pill-out-of-service",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Command Center</h1>
        <p className="text-slate-600">At-a-glance fleet oversight</p>
      </div>

      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 flex items-center gap-4">
            <div className="rounded-lg bg-amber-100 p-3">
              <Truck className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Active Fleet (On Trip)</p>
              <p className="text-2xl font-bold text-slate-900">{kpis.activeFleetOnTrip}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-4">
            <div className="rounded-lg bg-rose-100 p-3">
              <AlertTriangle className="h-6 w-6 text-rose-700" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Maintenance Alerts</p>
              <p className="text-2xl font-bold text-slate-900">{kpis.maintenanceAlerts}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-4">
            <div className="rounded-lg bg-teal-100 p-3">
              <Percent className="h-6 w-6 text-teal-700" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Utilization Rate</p>
              <p className="text-2xl font-bold text-slate-900">{kpis.utilizationRate}%</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-4">
            <div className="rounded-lg bg-slate-100 p-3">
              <Package className="h-6 w-6 text-slate-700" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Pending Cargo</p>
              <p className="text-2xl font-bold text-slate-900">{kpis.pendingCargo}</p>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-auto min-w-[180px]"
            placeholder="Search"
          />
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-700">Filters:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field w-auto min-w-[100px]"
            >
              <option value="">All types</option>
              <option value="TRUCK">Truck</option>
              <option value="VAN">Van</option>
              <option value="BIKE">Bike</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-auto min-w-[120px]"
            >
              <option value="">All statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="IN_SHOP">In Shop</option>
              <option value="OUT_OF_SERVICE">Out of Service</option>
            </select>
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="input-field w-auto min-w-[100px]"
            >
              <option value="">All regions</option>
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="Central">Central</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field w-auto min-w-[160px]"
            >
              <option value="tripNo">Sort by: Trip No</option>
              <option value="vehicleId">Sort by: Vehicle ID</option>
              <option value="vehicleName">Sort by: Vehicle Name/Model</option>
              <option value="type">Sort by: Type</option>
              <option value="region">Sort by: Region</option>
              <option value="status">Sort by: Status</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Trip No</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Vehicle ID</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Vehicle Name/Model</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Region</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((v, idx) => (
                <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono">{idx + 1}</td>
                  <td className="px-4 py-3 font-mono">{toNumericVehicleId(v.id)}</td>
                  <td className="px-4 py-3">{v.name} / {v.model}</td>
                  <td className="px-4 py-3">{v.vehicleType}</td>
                  <td className="px-4 py-3">{v.region || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`pill ${statusClass[v.status] || "pill-out-of-service"}`}>
                      {v.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
