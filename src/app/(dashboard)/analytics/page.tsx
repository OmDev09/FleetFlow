"use client";

import { useCallback, useState } from "react";
import { BarChart3, Download } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePollingRefresh } from "@/lib/usePollingRefresh";

type VehicleMetric = {
  vehicleId: string;
  name: string;
  licensePlate: string;
  fuelEfficiencyKmPerL: number | null;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalOperationalCost: number;
  revenue: number;
  acquisitionCost: number;
  roiPercent: number | null;
};

type TrendPoint = {
  month: string;
  fuelEfficiencyKmPerL: number | null;
};

type CostlyVehiclePoint = {
  vehicle: string;
  totalOperationalCost: number;
};

type MonthlyFinancial = {
  monthKey: string;
  monthLabel: string;
  revenue: number;
  fuelCost: number;
  maintenanceCost: number;
  otherExpense: number;
  totalOperationalCost: number;
  netProfit: number;
  fuelEfficiencyKmPerL: number | null;
};

type AnalyticsResponse = {
  vehicleMetrics: VehicleMetric[];
  fuelEfficiencyTrend: TrendPoint[];
  topCostlyVehicles: CostlyVehiclePoint[];
  monthlyFinancials: MonthlyFinancial[];
  summary: {
    totalFleet: number;
    totalTripsCompleted: number;
    totalFuelCost: number;
    fleetRoiPercent: number | null;
    utilizationRatePercent: number;
  };
};

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<VehicleMetric[]>([]);
  const [fuelEfficiencyTrend, setFuelEfficiencyTrend] = useState<TrendPoint[]>([]);
  const [topCostlyVehicles, setTopCostlyVehicles] = useState<CostlyVehiclePoint[]>([]);
  const [monthlyFinancials, setMonthlyFinancials] = useState<MonthlyFinancial[]>([]);
  const [summary, setSummary] = useState<AnalyticsResponse["summary"]>({
    totalFleet: 0,
    totalTripsCompleted: 0,
    totalFuelCost: 0,
    fleetRoiPercent: null,
    utilizationRatePercent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    fetch("/api/analytics")
      .then(async (r) => {
        const raw = await r.text();
        if (!raw) throw new Error("Empty response from analytics API");
        let data: AnalyticsResponse | null = null;
        try {
          data = JSON.parse(raw) as AnalyticsResponse;
        } catch {
          throw new Error("Invalid analytics response");
        }
        if (!r.ok) {
          throw new Error("Failed to load analytics");
        }
        return data;
      })
      .then((data: AnalyticsResponse) => {
        setMetrics(data.vehicleMetrics ?? []);
        setFuelEfficiencyTrend(data.fuelEfficiencyTrend ?? []);
        setTopCostlyVehicles(data.topCostlyVehicles ?? []);
        setMonthlyFinancials(data.monthlyFinancials ?? []);
        if (data.summary) setSummary(data.summary);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to load analytics");
      })
      .finally(() => setLoading(false));
  }, []);

  usePollingRefresh(load, 5000);

  function formatCurrency(value: number): string {
    return `Rs. ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  }

  function exportCSV() {
    const headers = [
      "Vehicle",
      "License Plate",
      "Fuel efficiency (km/L)",
      "Total fuel cost",
      "Total maintenance cost",
      "Total operational cost",
      "Revenue",
      "Acquisition cost",
      "ROI %",
    ];
    const rows = metrics.map((m) => [
      m.name,
      m.licensePlate,
      m.fuelEfficiencyKmPerL ?? "",
      m.totalFuelCost.toFixed(2),
      m.totalMaintenanceCost.toFixed(2),
      m.totalOperationalCost.toFixed(2),
      m.revenue.toFixed(2),
      m.acquisitionCost.toFixed(2),
      m.roiPercent ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fleetflow-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const table = document.getElementById("analytics-table");
    if (!table) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>FleetFlow Analytics</title></head>
        <body>
          <h1>FleetFlow - Operational Analytics</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          ${table.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  }

  if (loading) return <p className="text-slate-500">Loading...</p>;
  if (error) return <p className="text-rose-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operational Analytics & Reports</h1>
          <p className="text-slate-600">Fuel trends, cost hotspots, monthly financial summary, CSV/PDF export</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={exportCSV} className="btn-secondary inline-flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button type="button" onClick={exportPDF} className="btn-secondary inline-flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Total Fuel Cost</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(summary.totalFuelCost)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Fleet ROI</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {summary.fleetRoiPercent != null ? `${summary.fleetRoiPercent}%` : "N/A"}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Utilization Rate (30d)</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.utilizationRatePercent}%</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card p-4">
          <h2 className="text-base font-semibold text-slate-900">Fuel Efficiency Trend (km/L)</h2>
          <p className="mb-3 text-sm text-slate-500">Last 6 months</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fuelEfficiencyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="fuelEfficiencyKmPerL" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-base font-semibold text-slate-900">Top 5 Costliest Vehicles</h2>
          <p className="mb-3 text-sm text-slate-500">By total operational cost</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCostlyVehicles}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vehicle" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalOperationalCost" fill="#334155" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900">Financial Summary of Month</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Month</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Revenue</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Fuel Cost</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Maintenance</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {monthlyFinancials.map((m) => (
                <tr key={m.monthKey} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">{m.monthLabel}</td>
                  <td className="px-4 py-3">{formatCurrency(m.revenue)}</td>
                  <td className="px-4 py-3">{formatCurrency(m.fuelCost)}</td>
                  <td className="px-4 py-3">{formatCurrency(m.maintenanceCost)}</td>
                  <td className={`px-4 py-3 ${m.netProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {formatCurrency(m.netProfit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-200 p-4 text-slate-700">
          <BarChart3 className="h-5 w-5" />
          <span className="font-medium">Vehicle metrics</span>
        </div>
        <div className="overflow-x-auto">
          <table id="analytics-table" className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Vehicle</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Fuel efficiency (km/L)</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Fuel cost</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Maintenance cost</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Total op. cost</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Revenue</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Acquisition cost</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">ROI %</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.vehicleId} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {m.name} <span className="text-slate-500">({m.licensePlate})</span>
                  </td>
                  <td className="px-4 py-3">{m.fuelEfficiencyKmPerL != null ? m.fuelEfficiencyKmPerL : "N/A"}</td>
                  <td className="px-4 py-3">{formatCurrency(m.totalFuelCost)}</td>
                  <td className="px-4 py-3">{formatCurrency(m.totalMaintenanceCost)}</td>
                  <td className="px-4 py-3">{formatCurrency(m.totalOperationalCost)}</td>
                  <td className="px-4 py-3">{formatCurrency(m.revenue)}</td>
                  <td className="px-4 py-3">{formatCurrency(m.acquisitionCost)}</td>
                  <td className="px-4 py-3">{m.roiPercent != null ? `${m.roiPercent}%` : "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
