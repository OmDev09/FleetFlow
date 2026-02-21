"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [splashPhase, setSplashPhase] = useState<"in" | "out" | "done">("in");

  useEffect(() => {
    const outTimer = setTimeout(() => setSplashPhase("out"), 900);
    const doneTimer = setTimeout(() => setSplashPhase("done"), 1500);
    return () => {
      clearTimeout(outTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_15%_20%,#99f6e4_0%,transparent_38%),radial-gradient(circle_at_80%_15%,#93c5fd_0%,transparent_35%),linear-gradient(135deg,#e2e8f0_0%,#cbd5e1_48%,#a5f3fc_100%)] px-4 overflow-hidden dark:bg-[radial-gradient(circle_at_15%_20%,#134e4a_0%,transparent_38%),radial-gradient(circle_at_80%_15%,#1e3a8a_0%,transparent_35%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#0f766e_100%)]">
      {splashPhase !== "done" && (
        <div
          className={[
            "absolute inset-0 z-20 flex items-center justify-center bg-[radial-gradient(circle_at_15%_20%,#99f6e4_0%,transparent_38%),radial-gradient(circle_at_80%_15%,#93c5fd_0%,transparent_35%),linear-gradient(135deg,#e2e8f0_0%,#cbd5e1_48%,#a5f3fc_100%)] dark:bg-[radial-gradient(circle_at_15%_20%,#134e4a_0%,transparent_38%),radial-gradient(circle_at_80%_15%,#1e3a8a_0%,transparent_35%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#0f766e_100%)]",
            splashPhase === "in" ? "animate-fleet-splash-in" : "animate-fleet-splash-out",
          ].join(" ")}
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute h-52 w-52 rounded-full bg-teal-200/50 blur-3xl animate-fleet-pulse dark:bg-teal-400/20" />
            <div className="absolute h-36 w-36 rounded-full border border-teal-300/70 animate-fleet-pulse dark:border-teal-300/30" />
            <h1 className="relative font-display text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              FleetFlow
            </h1>
          </div>
        </div>
      )}

      <div
        className={[
          "w-full max-w-md",
          splashPhase === "done" ? "opacity-100 animate-fleet-card-in" : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-slate-100">FleetFlow</h1>
            <p className="text-slate-700 mt-1 dark:text-slate-300">Fleet & Logistics Management</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@company.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50/85 px-3 py-2 rounded-lg dark:bg-red-500/15 dark:text-red-200">{error}</p>
            )}
            <div className="flex items-center justify-between text-sm">
              <Link href="/forgot-password" className="text-teal-600 hover:text-teal-700">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
            Demo: manager@fleetflow.com / manager123 (Manager, Dispatcher, Safety, Finance)
          </p>
        </div>
      </div>
    </div>
  );
}
