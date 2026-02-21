"use client";

import { useCallback, useState } from "react";
import {
  Plus,
  Send,
  Check,
  X,
  MapPin,
} from "lucide-react";
import type { TripStatus } from "@/lib/domain";
import { usePollingRefresh } from "@/lib/usePollingRefresh";

type Vehicle = { id: string; name: string; licensePlate: string; maxLoadCapacityKg: number; vehicleType: string };
type Driver = { id: string; name: string; licenseNumber: string; vehicleTypes: string };
type Cargo = { id: string; description: string; weightKg: number; origin: string; destination: string };
type Trip = {
  id: string;
  status: TripStatus;
  cargoWeightKg: number;
  origin: string;
  destination: string;
  startOdometerKm: number | null;
  endOdometerKm: number | null;
  vehicle: Vehicle;
  driver: Driver;
};

const timelineStages = ["Draft", "Dispatched", "On Route", "Completed"] as const;

const statusPill: Record<string, string> = {
  DRAFT: "pill-draft",
  DISPATCHED: "pill-dispatched",
  COMPLETED: "pill-completed",
  CANCELLED: "pill-cancelled",
};

function getCurrentStageIndex(trip: Trip): number {
  if (trip.status === "DRAFT") return 0;
  if (trip.status === "DISPATCHED") return 2;
  if (trip.status === "COMPLETED") return 3;
  if (trip.status === "CANCELLED") {
    return trip.startOdometerKm != null ? 2 : 0;
  }
  return 0;
}

function TripTimeline({ trip }: { trip: Trip }) {
  const currentStage = getCurrentStageIndex(trip);
  return (
    <div className="min-w-[360px]">
      <div className="flex items-center gap-1.5">
        {timelineStages.map((stage, idx) => {
          const isDone = idx < currentStage;
          const isCurrent = idx === currentStage;
          return (
            <div key={stage} className="flex items-center gap-1.5">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={[
                    "h-2.5 w-2.5 rounded-full border",
                    isCurrent
                      ? "border-teal-600 bg-teal-600"
                      : isDone
                        ? "border-teal-400 bg-teal-400"
                        : "border-slate-300 bg-white",
                  ].join(" ")}
                />
                <span
                  className={[
                    "text-[10px] whitespace-nowrap",
                    isCurrent ? "font-semibold text-teal-700" : isDone ? "text-slate-700" : "text-slate-400",
                  ].join(" ")}
                >
                  {stage}
                </span>
              </div>
              {idx < timelineStages.length - 1 && (
                <span className={["h-px w-7", idx < currentStage ? "bg-teal-400" : "bg-slate-200"].join(" ")} />
              )}
            </div>
          );
        })}
      </div>
      {trip.status === "CANCELLED" && (
        <p className="mt-1 text-[10px] font-medium text-rose-600">Cancelled</p>
      )}
    </div>
  );
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [cargo, setCargo] = useState<Cargo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    vehicleId: "",
    driverId: "",
    cargoWeightKg: "",
    origin: "",
    destination: "",
    cargoId: "",
  });
  const [completeOdometer, setCompleteOdometer] = useState<{ tripId: string; value: string; revenue: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    fetch("/api/trips").then((r) => r.json()).then(setTrips);
    fetch("/api/vehicles?available=true").then((r) => r.json()).then(setVehicles);
    fetch("/api/drivers?available=true").then((r) => r.json()).then(setDrivers);
    fetch("/api/cargo?pending=true").then((r) => r.json()).then(setCargo);
  }, []);

  usePollingRefresh(load, 5000);

  const vehicle = vehicles.find((v) => v.id === form.vehicleId);
  const maxCap = vehicle?.maxLoadCapacityKg ?? 0;
  const cargoKg = form.cargoId ? cargo.find((c) => c.id === form.cargoId)?.weightKg : Number(form.cargoWeightKg) || 0;
  const weightToUse = form.cargoId ? cargo.find((c) => c.id === form.cargoId)?.weightKg : Number(form.cargoWeightKg);
  const overCapacity = weightToUse != null && maxCap > 0 && weightToUse > maxCap;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (overCapacity) {
      setError(`Cargo weight (${weightToUse} kg) exceeds vehicle capacity (${maxCap} kg).`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: form.vehicleId,
          driverId: form.driverId,
          cargoWeightKg: weightToUse ?? Number(form.cargoWeightKg),
          origin: form.origin,
          destination: form.destination,
          cargoId: form.cargoId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create trip");
        return;
      }
      setShowForm(false);
      setForm({ vehicleId: "", driverId: "", cargoWeightKg: "", origin: "", destination: "", cargoId: "" });
      load();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(tripId: string, status: "DISPATCHED" | "COMPLETED" | "CANCELLED", endOdometerKm?: number, revenue?: number) {
    const res = await fetch(`/api/trips/${tripId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, endOdometerKm, revenue }),
    });
    if (res.ok) {
      setCompleteOdometer(null);
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trip Dispatcher</h1>
          <p className="text-slate-600">Create and manage trips</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New trip
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Create trip</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Available vehicle</label>
                <select
                  value={form.vehicleId}
                  onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
                  className="input-field"
                  required
                >
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.licensePlate}) — {v.maxLoadCapacityKg} kg max
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Available driver</label>
                <select
                  value={form.driverId}
                  onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))}
                  className="input-field"
                  required
                >
                  <option value="">Select driver</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.licenseNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pending cargo (optional)</label>
              <select
                value={form.cargoId}
                onChange={(e) => {
                  const c = cargo.find((x) => x.id === e.target.value);
                  setForm((f) => ({
                    ...f,
                    cargoId: e.target.value,
                    cargoWeightKg: c ? String(c.weightKg) : f.cargoWeightKg,
                    origin: c?.origin ?? f.origin,
                    destination: c?.destination ?? f.destination,
                  }));
                }}
                className="input-field"
              >
                <option value="">Manual entry</option>
                {cargo.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.description} — {c.weightKg} kg
                  </option>
                ))}
              </select>
            </div>
            {!form.cargoId && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cargo weight (kg)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={form.cargoWeightKg}
                  onChange={(e) => setForm((f) => ({ ...f, cargoWeightKg: e.target.value }))}
                  className="input-field"
                  required={!form.cargoId}
                />
              </div>
            )}
            {vehicle && (
              <p className="text-sm text-slate-600">
                Max capacity: {vehicle.maxLoadCapacityKg} kg
                {overCapacity && <span className="text-red-600 ml-2">— Exceeds capacity!</span>}
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Origin</label>
                <input
                  value={form.origin}
                  onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Destination</label>
                <input
                  value={form.destination}
                  onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading || overCapacity} className="btn-primary">
              {loading ? "Creating…" : "Create trip (Draft)"}
            </button>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Trip</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Vehicle / Driver</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Cargo (kg)</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Timeline</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {t.origin} → {t.destination}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {t.vehicle?.name} / {t.driver?.name}
                  </td>
                  <td className="px-4 py-3">{t.cargoWeightKg}</td>
                  <td className="px-4 py-3">
                    <span className={`pill ${statusPill[t.status] || "pill-draft"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <TripTimeline trip={t} />
                  </td>
                  <td className="px-4 py-3 flex flex-wrap gap-2">
                    {t.status === "DRAFT" && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateStatus(t.id, "DISPATCHED")}
                          className="text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 text-xs"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Dispatch
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(t.id, "CANCELLED")}
                          className="text-slate-500 hover:text-slate-700 inline-flex items-center gap-1 text-xs"
                        >
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </button>
                      </>
                    )}
                    {t.status === "DISPATCHED" && (
                      <>
                        {completeOdometer?.tripId === t.id ? (
                          <span className="flex items-center gap-2 flex-wrap">
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={completeOdometer.value}
                              onChange={(e) => setCompleteOdometer((o) => o ? { ...o, value: e.target.value } : null)}
                              className="input-field w-24 text-xs"
                              placeholder="End km"
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={completeOdometer.revenue}
                              onChange={(e) => setCompleteOdometer((o) => o ? { ...o, revenue: e.target.value } : null)}
                              className="input-field w-24 text-xs"
                              placeholder="Revenue"
                            />
                            <button
                              type="button"
                              onClick={() => updateStatus(t.id, "COMPLETED", Number(completeOdometer?.value), completeOdometer?.revenue ? Number(completeOdometer.revenue) : undefined)}
                              className="text-emerald-600 hover:text-emerald-700 text-xs"
                            >
                              Confirm
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCompleteOdometer({ tripId: t.id, value: String(t.startOdometerKm ?? ""), revenue: "" })}
                            className="text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 text-xs"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Complete (enter odometer)
                          </button>
                        )}
                      </>
                    )}
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
