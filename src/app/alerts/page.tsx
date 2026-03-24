"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Plus, Trash2 } from "lucide-react";

interface Alert {
  id: string;
  marketId: string;
  marketName: string;
  platform: string;
  type: "price_above" | "price_below" | "oi_change";
  threshold: number;
  created: number;
  triggered: boolean;
}

const STORAGE_KEY = "predmarket-alerts";

function loadAlerts(): Alert[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: Alert[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    marketId: "",
    marketName: "",
    platform: "polymarket",
    type: "price_above" as Alert["type"],
    threshold: 0.5,
  });

  useEffect(() => {
    setAlerts(loadAlerts());
  }, []);

  const addAlert = useCallback(() => {
    if (!form.marketName.trim()) return;
    const newAlert: Alert = {
      id: crypto.randomUUID(),
      marketId: form.marketId,
      marketName: form.marketName,
      platform: form.platform,
      type: form.type,
      threshold: form.threshold,
      created: Date.now(),
      triggered: false,
    };
    const updated = [...alerts, newAlert];
    setAlerts(updated);
    saveAlerts(updated);
    setShowForm(false);
    setForm({
      marketId: "",
      marketName: "",
      platform: "polymarket",
      type: "price_above",
      threshold: 0.5,
    });
  }, [alerts, form]);

  const removeAlert = useCallback(
    (id: string) => {
      const updated = alerts.filter((a) => a.id !== id);
      setAlerts(updated);
      saveAlerts(updated);
    },
    [alerts]
  );

  const typeLabel = (type: Alert["type"]) => {
    switch (type) {
      case "price_above":
        return "Price Above";
      case "price_below":
        return "Price Below";
      case "oi_change":
        return "OI Change >";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-pm-fg-base">Alerts</h1>
          <p className="mt-1 text-sm text-pm-fg-muted">
            Set price and OI alerts for prediction markets (stored locally)
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-pm-fg-base transition-colors hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          New Alert
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-pm-border-base bg-pm-bg-card p-5">
          <h3 className="mb-4 text-sm font-medium text-pm-fg-subtle">
            Create Alert
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-pm-fg-muted">
                Market Name
              </label>
              <input
                type="text"
                value={form.marketName}
                onChange={(e) =>
                  setForm({ ...form, marketName: e.target.value })
                }
                placeholder="e.g. Bitcoin $100K"
                className="w-full rounded-lg border border-pm-border-base bg-pm-bg-card px-3 py-2 text-sm text-pm-fg-base placeholder:text-pm-fg-faint focus:border-violet-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-pm-fg-muted">
                Platform
              </label>
              <select
                value={form.platform}
                onChange={(e) =>
                  setForm({ ...form, platform: e.target.value })
                }
                className="w-full rounded-lg border border-pm-border-base bg-pm-bg-card px-3 py-2 text-sm text-pm-fg-base focus:border-violet-600 focus:outline-none"
              >
                <option value="polymarket">Polymarket</option>
                <option value="kalshi">Kalshi</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-pm-fg-muted">
                Alert Type
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value as Alert["type"],
                  })
                }
                className="w-full rounded-lg border border-pm-border-base bg-pm-bg-card px-3 py-2 text-sm text-pm-fg-base focus:border-violet-600 focus:outline-none"
              >
                <option value="price_above">Price Above</option>
                <option value="price_below">Price Below</option>
                <option value="oi_change">OI Change %</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-pm-fg-muted">
                Threshold
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={form.threshold}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      threshold: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-lg border border-pm-border-base bg-pm-bg-card px-3 py-2 text-sm text-pm-fg-base focus:border-violet-600 focus:outline-none"
                />
                <button
                  onClick={addAlert}
                  className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-pm-fg-base hover:bg-violet-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="rounded-xl border border-pm-border-base bg-pm-bg-card p-8 text-center">
          <Bell className="mx-auto mb-3 h-8 w-8 text-pm-fg-faint" />
          <p className="text-pm-fg-subtle">No alerts set</p>
          <p className="mt-1 text-xs text-pm-fg-faint">
            Create alerts to track price and OI changes
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center justify-between rounded-xl border px-5 py-4 ${
                alert.triggered
                  ? "border-green-700/50 bg-green-900/10"
                  : "border-pm-border-base bg-pm-bg-card"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-pm-fg-base">
                    {alert.marketName}
                  </span>
                  <span
                    className={`text-xs ${
                      alert.platform === "polymarket"
                        ? "text-pm-polymarket"
                        : "text-pm-kalshi"
                    }`}
                  >
                    {alert.platform}
                  </span>
                </div>
                <div className="mt-1 text-xs text-pm-fg-muted">
                  {typeLabel(alert.type)}:{" "}
                  {alert.type === "oi_change"
                    ? `${(alert.threshold * 100).toFixed(0)}%`
                    : `${(alert.threshold * 100).toFixed(1)}%`}
                </div>
              </div>
              <button
                onClick={() => removeAlert(alert.id)}
                className="rounded-lg p-2 text-pm-fg-muted transition-colors hover:bg-pm-bg-elevated hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
