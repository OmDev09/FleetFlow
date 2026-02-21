"use client";

import { useCallback, useState } from "react";
import { AlertCircle, Plus } from "lucide-react";
import type { DriverStatus } from "@/lib/domain";
import { usePollingRefresh } from "@/lib/usePollingRefresh";

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    licenseNumber: "",
    licenseExpiry: "",
    safetyScore: "100",
    status: "AVAILABLE" as DriverStatus,
    vehicleTypes: [] as string[],
  });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCompliance, setFilterCompliance] = useState("");
  const [filterVehicleType, setFilterVehicleType] = useState("");

  const load = useCallback(() => {
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

  usePollingRefresh(load, 5000);

  async function setStatus(id: string, status: DriverStatus) {
    await fetch(`/api/drivers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  function toggleVehicleType(type: "TRUCK" | "VAN" | "BIKE") {
    setForm((prev) => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(type)
        ? prev.vehicleTypes.filter((t) => t !== type)
        : [...prev.vehicleTypes, type],
    }));
  }

  async function submitDriver(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (form.vehicleTypes.length === 0) {
      setFormError("Select at least one vehicle type.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email || undefined,
          licenseNumber: form.licenseNumber,
          licenseExpiry: form.licenseExpiry,
          safetyScore: Number(form.safetyScore),
          status: form.status,
          vehicleTypes: form.vehicleTypes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data?.error?.formErrors?.[0] || data?.error || "Failed to add driver");
        return;
      }
      setShowAddForm(false);
      setForm({
        name: "",
        email: "",
        licenseNumber: "",
        licenseExpiry: "",
        safetyScore: "100",
        status: "AVAILABLE",
        vehicleTypes: [],
      });
      load();
    } finally {
      setSaving(false);
    }
  }

  const statusPill: Record<string, string> = {
    AVAILABLE: "pill-available",
    ON_DUTY: "pill-on-trip",
    OFF_DUTY: "pill-draft",
    SUSPENDED: "pill-out-of-service",
  };

  const filteredDrivers = drivers.filter((d) => {
    const expired = new Date(d.licenseExpiry) < new Date();

    if (filterStatus && d.status !== filterStatus) return false;
    if (filterCompliance === "VALID" && expired) return false;
    if (filterCompliance === "EXPIRED" && !expired) return false;
    if (filterVehicleType && !d.vehicleTypes.split(",").map((t) => t.trim()).includes(filterVehicleType)) {
      return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const completion = tripCounts[d.id];
      const haystack = `${d.name} ${d.licenseNumber} ${d.vehicleTypes} ${d.status} ${
        completion ? `${completion.completed}/${completion.total}` : ""
      }`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Driver Performance & Safety</h1>
          <p className="text-slate-600">License expiry blocks assignment; trip completion and safety scores</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add driver
        </button>
      </div>

      {showAddForm && (
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Add driver</h2>
          <form onSubmit={submitDriver} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email (optional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">License number</label>
                <input
                  value={form.licenseNumber}
                  onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">License expiry</label>
                <input
                  type="date"
                  value={form.licenseExpiry}
                  onChange={(e) => setForm((f) => ({ ...f, licenseExpiry: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Safety score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.safetyScore}
                  onChange={(e) => setForm((f) => ({ ...f, safetyScore: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Authorized vehicle types</label>
              <div className="flex flex-wrap gap-3">
                {(["TRUCK", "VAN", "BIKE"] as const).map((type) => (
                  <label key={type} className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.vehicleTypes.includes(type)}
                      onChange={() => toggleVehicleType(type)}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Current status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as DriverStatus }))}
                className="input-field"
              >
                <option value="AVAILABLE">Available</option>
                <option value="ON_DUTY">On Duty</option>
                <option value="OFF_DUTY">Off Duty</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Adding..." : "Add driver"}
            </button>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, license, type..."
            className="input-field w-auto min-w-[220px]"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field w-auto min-w-[130px]"
          >
            <option value="">All status</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_DUTY">On Duty</option>
            <option value="OFF_DUTY">Off Duty</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <select
            value={filterCompliance}
            onChange={(e) => setFilterCompliance(e.target.value)}
            className="input-field w-auto min-w-[130px]"
          >
            <option value="">All compliance</option>
            <option value="VALID">Valid</option>
            <option value="EXPIRED">Expired</option>
          </select>
          <select
            value={filterVehicleType}
            onChange={(e) => setFilterVehicleType(e.target.value)}
            className="input-field w-auto min-w-[130px]"
          >
            <option value="">All vehicle types</option>
            <option value="TRUCK">Truck</option>
            <option value="VAN">Van</option>
            <option value="BIKE">Bike</option>
          </select>
        </div>
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
              {filteredDrivers.map((d) => {
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
