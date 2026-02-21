"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewVehiclePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    model: "",
    licensePlate: "",
    maxLoadCapacityKg: "",
    odometerKm: "",
    vehicleType: "VAN",
    region: "",
    acquisitionCost: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          maxLoadCapacityKg: Number(form.maxLoadCapacityKg) || 0,
          odometerKm: form.odometerKm ? Number(form.odometerKm) : undefined,
          acquisitionCost: form.acquisitionCost ? Number(form.acquisitionCost) : undefined,
          region: form.region || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create vehicle");
        return;
      }
      router.push("/vehicles");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add vehicle</h1>
        <p className="text-slate-600">Register a new fleet asset</p>
      </div>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="input-field"
            placeholder="e.g. Van-05"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
          <input
            value={form.model}
            onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
            className="input-field"
            placeholder="e.g. Transit 350"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">License plate (unique)</label>
          <input
            value={form.licensePlate}
            onChange={(e) => setForm((f) => ({ ...f, licensePlate: e.target.value }))}
            className="input-field"
            placeholder="e.g. VAN-05"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Max load capacity (kg)</label>
          <input
            type="number"
            min="1"
            value={form.maxLoadCapacityKg}
            onChange={(e) => setForm((f) => ({ ...f, maxLoadCapacityKg: e.target.value }))}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Initial Odometer (km)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={form.odometerKm}
            onChange={(e) => setForm((f) => ({ ...f, odometerKm: e.target.value }))}
            className="input-field"
            placeholder="e.g. 45000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle type</label>
          <select
            value={form.vehicleType}
            onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value }))}
            className="input-field"
          >
            <option value="TRUCK">Truck</option>
            <option value="VAN">Van</option>
            <option value="BIKE">Bike</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Region (optional)</label>
          <input
            value={form.region}
            onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            className="input-field"
            placeholder="North / South / Central"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Acquisition cost (optional)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.acquisitionCost}
            onChange={(e) => setForm((f) => ({ ...f, acquisitionCost: e.target.value }))}
            className="input-field"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Creating…" : "Create vehicle"}
          </button>
          <Link href="/vehicles" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
