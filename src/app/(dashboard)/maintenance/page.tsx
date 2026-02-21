"use client";

import { useEffect, useState } from "react";
import { Wrench, Plus } from "lucide-react";

type Vehicle = { id: string; name: string; licensePlate: string; status: string };
type Log = {
  id: string;
  description: string;
  cost: number | null;
  performedAt: string;
  vehicle: { id: string; name: string; licensePlate: string; status: string };
};

export default function MaintenancePage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicleId: "", description: "", cost: "" });
  const [loading, setLoading] = useState(false);

  function load() {
    fetch("/api/maintenance").then((r) => r.json()).then(setLogs);
    fetch("/api/vehicles").then((r) => r.json()).then(setVehicles);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: form.vehicleId,
          description: form.description,
          cost: form.cost ? Number(form.cost) : undefined,
        }),
      });
      window.dispatchEvent(new Event("fleetflow:alerts-refresh"));
      setShowForm(false);
      setForm({ vehicleId: "", description: "", cost: "" });
      load();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance & Service Logs</h1>
          <p className="text-slate-600">Adding a log sets vehicle to In Shop (removed from dispatcher pool)</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add service log
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle</label>
              <select
                value={form.vehicleId}
                onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">Select vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.licensePlate})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="input-field"
                placeholder="e.g. Oil change, brake check"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cost (optional)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                className="input-field"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Addingâ€¦" : "Add log (vehicle In Shop)"}
            </button>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Vehicle</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Description</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Cost</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {l.vehicle?.name} ({l.vehicle?.licensePlate})
                  </td>
                  <td className="px-4 py-3">{l.description}</td>
                  <td className="px-4 py-3">{l.cost != null ? `₹${l.cost.toFixed(2)}` : "â€”"}</td>
                  <td className="px-4 py-3">{new Date(l.performedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
