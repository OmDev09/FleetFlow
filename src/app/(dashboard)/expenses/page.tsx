"use client";

import { useEffect, useState } from "react";
import { Fuel, DollarSign, Plus } from "lucide-react";

type Vehicle = { id: string; name: string; licensePlate: string };
type ExpenseRow = { id: string; description: string; amount: number; date: string; vehicle: Vehicle };
type FuelRow = { id: string; liters: number; cost: number; date: string; vehicle: Vehicle };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelRow[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [tab, setTab] = useState<"expenses" | "fuel">("fuel");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ vehicleId: "", description: "", amount: "", date: new Date().toISOString().slice(0, 10) });
  const [fuelForm, setFuelForm] = useState({ vehicleId: "", liters: "", cost: "", date: new Date().toISOString().slice(0, 10) });
  const [loading, setLoading] = useState(false);

  function load() {
    fetch("/api/expenses").then((r) => r.json()).then(setExpenses);
    fetch("/api/fuel").then((r) => r.json()).then(setFuelLogs);
    fetch("/api/vehicles").then((r) => r.json()).then(setVehicles);
  }

  useEffect(() => {
    load();
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  async function submitExpense(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: expenseForm.vehicleId,
          description: expenseForm.description,
          amount: Number(expenseForm.amount),
          date: expenseForm.date,
        }),
      });
      setShowExpenseForm(false);
      setExpenseForm({ vehicleId: "", description: "", amount: "", date: new Date().toISOString().slice(0, 10) });
      load();
    } finally {
      setLoading(false);
    }
  }

  async function submitFuel(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/fuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: fuelForm.vehicleId,
          liters: Number(fuelForm.liters),
          cost: Number(fuelForm.cost),
          date: fuelForm.date,
        }),
      });
      setShowFuelForm(false);
      setFuelForm({ vehicleId: "", liters: "", cost: "", date: new Date().toISOString().slice(0, 10) });
      load();
    } finally {
      setLoading(false);
    }
  }

  const fuelByVehicle: Record<string, { liters: number; cost: number }> = {};
  fuelLogs.forEach((f) => {
    const vid = f.vehicle?.id ?? "unknown";
    if (!fuelByVehicle[vid]) fuelByVehicle[vid] = { liters: 0, cost: 0 };
    fuelByVehicle[vid].liters += f.liters;
    fuelByVehicle[vid].cost += f.cost;
  });
  const expenseByVehicle: Record<string, number> = {};
  expenses.forEach((e) => {
    const vid = e.vehicle?.id ?? "unknown";
    expenseByVehicle[vid] = (expenseByVehicle[vid] ?? 0) + e.amount;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Expenses & Fuel Logging</h1>
        <p className="text-slate-600">Financial tracking per asset; total operational cost = Fuel + Maintenance/Expenses</p>
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Total operational cost by vehicle</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="pb-2">Vehicle</th>
                <th className="pb-2">Fuel cost</th>
                <th className="pb-2">Other expenses</th>
                <th className="pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => {
                const fuel = fuelByVehicle[v.id] ?? { cost: 0, liters: 0 };
                const exp = expenseByVehicle[v.id] ?? 0;
                const total = fuel.cost + exp;
                return (
                  <tr key={v.id} className="border-t border-slate-100">
                    <td className="py-2">{v.name} ({v.licensePlate})</td>
                    <td className="py-2">${fuel.cost.toFixed(2)}</td>
                    <td className="py-2">${exp.toFixed(2)}</td>
                    <td className="py-2 font-medium">${total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("fuel")}
          className={`px-4 py-2 text-sm font-medium ${tab === "fuel" ? "border-b-2 border-teal-600 text-teal-600" : "text-slate-600"}`}
        >
          Fuel logs
        </button>
        <button
          type="button"
          onClick={() => setTab("expenses")}
          className={`px-4 py-2 text-sm font-medium ${tab === "expenses" ? "border-b-2 border-teal-600 text-teal-600" : "text-slate-600"}`}
        >
          Expenses
        </button>
      </div>

      {tab === "fuel" && (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowFuelForm(!showFuelForm)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add fuel log
            </button>
          </div>
          {showFuelForm && (
            <div className="card p-6">
              <form onSubmit={submitFuel} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle</label>
                  <select
                    value={fuelForm.vehicleId}
                    onChange={(e) => setFuelForm((f) => ({ ...f, vehicleId: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Select</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Liters</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={fuelForm.liters}
                      onChange={(e) => setFuelForm((f) => ({ ...f, liters: e.target.value }))}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cost</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={fuelForm.cost}
                      onChange={(e) => setFuelForm((f) => ({ ...f, cost: e.target.value }))}
                      className="input-field"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={fuelForm.date}
                    onChange={(e) => setFuelForm((f) => ({ ...f, date: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary">Add fuel log</button>
              </form>
            </div>
          )}
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Vehicle</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Liters</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Cost</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {fuelLogs.map((f) => (
                  <tr key={f.id} className="border-b border-slate-100">
                    <td className="px-4 py-3">{f.vehicle?.name}</td>
                    <td className="px-4 py-3">{f.liters}</td>
                    <td className="px-4 py-3">${f.cost.toFixed(2)}</td>
                    <td className="px-4 py-3">{new Date(f.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "expenses" && (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowExpenseForm(!showExpenseForm)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add expense
            </button>
          </div>
          {showExpenseForm && (
            <div className="card p-6">
              <form onSubmit={submitExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle</label>
                  <select
                    value={expenseForm.vehicleId}
                    onChange={(e) => setExpenseForm((f) => ({ ...f, vehicleId: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Select</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <input
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm((f) => ({ ...f, date: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary">Add expense</button>
              </form>
            </div>
          )}
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Vehicle</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100">
                    <td className="px-4 py-3">{e.vehicle?.name}</td>
                    <td className="px-4 py-3">{e.description}</td>
                    <td className="px-4 py-3">${e.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">{new Date(e.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
