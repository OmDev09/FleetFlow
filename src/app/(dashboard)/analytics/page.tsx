"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download } from "lucide-react";

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

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<VehicleMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((data) => setMetrics(data.vehicleMetrics ?? []))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operational Analytics & Reports</h1>
          <p className="text-slate-600">Fuel efficiency (km/L), Vehicle ROI, one-click CSV/PDF export</p>
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

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2 text-slate-700">
          <BarChart3 className="h-5 w-5" />
          <span className="font-medium">Vehicle metrics</span>
        </div>
        <div className="overflow-x-auto">
          <table id="analytics-table" className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Vehicle</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Fuel efficiency (km/L)</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Fuel cost</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Maintenance cost</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Total op. cost</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Revenue</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Acquisition cost</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">ROI %</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.vehicleId} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {m.name} <span className="text-slate-500">({m.licensePlate})</span>
                  </td>
                  <td className="px-4 py-3">{m.fuelEfficiencyKmPerL != null ? m.fuelEfficiencyKmPerL : "N/A"}</td>
                  <td className="px-4 py-3">₹{m.totalFuelCost.toFixed(2)}</td>
                  <td className="px-4 py-3">₹{m.totalMaintenanceCost.toFixed(2)}</td>
                  <td className="px-4 py-3">₹{m.totalOperationalCost.toFixed(2)}</td>
                  <td className="px-4 py-3">₹{m.revenue.toFixed(2)}</td>
                  <td className="px-4 py-3">₹{m.acquisitionCost.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    {m.roiPercent != null ? `${m.roiPercent}%` : "N/A"}
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

