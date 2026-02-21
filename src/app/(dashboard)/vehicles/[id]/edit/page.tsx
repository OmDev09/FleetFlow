"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type Vehicle = {
  id: string;
  name: string;
  model: string;
  licensePlate: string;
  maxLoadCapacityKg: number;
  vehicleType: string;
  status: string;
  odometerKm: number;
  region: string | null;
  acquisitionCost: number | null;
};

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState({
    name: "",
    model: "",
    licensePlate: "",
    maxLoadCapacityKg: "",
    vehicleType: "VAN",
    region: "",
    odometerKm: "",
    status: "AVAILABLE",
    acquisitionCost: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/vehicles/${id}`)
      .then((r) => r.json())
      .then((v) => {
        setVehicle(v);
        setForm({
          name: v.name,
          model: v.model,
          licensePlate: v.licensePlate,
          maxLoadCapacityKg: String(v.maxLoadCapacityKg),
          vehicleType: v.vehicleType,
          region: v.region || "",
          odometerKm: String(v.odometerKm),
          status: v.status,
          acquisitionCost: v.acquisitionCost != null ? String(v.acquisitionCost) : "",
        });
      });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          maxLoadCapacityKg: Number(form.maxLoadCapacityKg),
          odometerKm: Number(form.odometerKm),
          acquisitionCost: form.acquisitionCost ? Number(form.acquisitionCost) : undefined,
          region: form.region || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Update failed");
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

  if (!vehicle) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit vehicle</h1>
        <p className="text-slate-600">{vehicle.licensePlate}</p>
      </div>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
          <input
            value={form.model}
            onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">License plate</label>
          <input
            value={form.licensePlate}
            onChange={(e) => setForm((f) => ({ ...f, licensePlate: e.target.value }))}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Max load (kg)</label>
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
          <label className="block text-sm font-medium text-slate-700 mb-1">Odometer (km)</label>
          <input
            type="number"
            min="0"
            value={form.odometerKm}
            onChange={(e) => setForm((f) => ({ ...f, odometerKm: e.target.value }))}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="input-field"
          >
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="IN_SHOP">In Shop</option>
            <option value="OUT_OF_SERVICE">Out of Service</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
          <input
            value={form.region}
            onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Acquisition cost</label>
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
            {loading ? "Saving…" : "Save"}
          </button>
          <Link href="/vehicles" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
