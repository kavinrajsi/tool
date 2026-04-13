"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  DatabaseIcon, PlayIcon, SquareIcon, LoaderIcon, CheckCircleIcon,
  AlertTriangleIcon, RefreshCwIcon,
} from "lucide-react";

export default function MSMESyncDashboard() {
  const [districts, setDistricts] = useState([]);
  const [selected, setSelected] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState({ inserted: 0, total: 0, done: false });
  const abortRef = useRef(false);
  const logsEndRef = useRef(null);

  useEffect(() => {
    supabase
      .from("udyam_districts")
      .select("district_name")
      .eq("state_name", "TAMIL NADU")
      .order("district_name")
      .then(({ data }) => {
        if (data) setDistricts(data.map((d) => d.district_name));
      });
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  function addLog(msg, type = "info") {
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs((prev) => [...prev, { msg, type, time }]);
  }

  async function startSync() {
    if (!selected || syncing) return;
    setSyncing(true);
    abortRef.current = false;
    setLogs([]);
    setProgress({ inserted: 0, total: 0, done: false });

    addLog(`Starting sync for ${selected}...`);

    let url = `/api/msme-sync?district=${encodeURIComponent(selected)}&offset=0&fresh=true`;
    let totalInserted = 0;

    while (url && !abortRef.current) {
      try {
        addLog(`Fetching batch at offset ${totalInserted}...`);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 55000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) {
          addLog(`HTTP ${res.status}: ${res.statusText}`, "error");
          break;
        }
        const data = await res.json();

        if (data.error) {
          addLog(`Error: ${data.error}`, "error");
          break;
        }

        totalInserted += data.inserted || 0;
        const dbTotal = data.dbTotal || totalInserted;
        setProgress({ inserted: dbTotal, total: data.apiTotal || 0, done: data.done });

        addLog(`Inserted ${data.inserted} records — DB has ${dbTotal.toLocaleString("en-IN")} / ${(data.apiTotal || 0).toLocaleString("en-IN")}`, "success");

        if (data.done) {
          addLog(`Sync complete! ${totalInserted.toLocaleString("en-IN")} records synced for ${selected}.`, "success");
          url = null;
        } else {
          url = data.next;
        }
      } catch (err) {
        if (err.name === "AbortError") {
          addLog(`Request timed out (55s). Retrying...`, "warn");
          continue;
        }
        addLog(`Network error: ${err.message}`, "error");
        break;
      }
    }

    if (abortRef.current) {
      addLog(`Sync stopped by user at ${totalInserted.toLocaleString("en-IN")} records.`, "warn");
    }

    setSyncing(false);
  }

  function stopSync() {
    abortRef.current = true;
  }

  const pct = progress.total > 0 ? Math.min((progress.inserted / progress.total) * 100, 100) : 0;

  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <DatabaseIcon size={24} className="text-primary" />
          MSME Data Sync
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Sync UDYAM registered enterprises from data.gov.in to local database
        </p>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 max-w-xs">
            <label className="text-xs font-medium mb-1 block">District</label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={syncing}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 disabled:opacity-50"
            >
              <option value="">Select district...</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          {syncing ? (
            <button
              onClick={stopSync}
              className="flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <SquareIcon size={14} /> Stop
            </button>
          ) : (
            <button
              onClick={startSync}
              disabled={!selected}
              className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <PlayIcon size={14} /> Start Sync
            </button>
          )}
        </div>

        {/* Progress bar */}
        {(syncing || progress.inserted > 0) && (
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>
                {syncing && <LoaderIcon size={12} className="animate-spin inline mr-1" />}
                {progress.inserted.toLocaleString("en-IN")} / {progress.total.toLocaleString("en-IN")} records
              </span>
              <span>{Math.round(pct)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progress.done ? "bg-emerald-500" : "bg-primary"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {progress.done && (
              <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
                <CheckCircleIcon size={12} /> Sync complete
              </p>
            )}
          </div>
        )}
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Sync Log</span>
            <button onClick={() => setLogs([])} className="text-[10px] text-muted-foreground hover:text-foreground">Clear</button>
          </div>
          <div className="max-h-[400px] overflow-y-auto p-4 space-y-1 font-mono text-xs">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-muted-foreground shrink-0 w-16">{log.time}</span>
                {log.type === "error" && <AlertTriangleIcon size={12} className="text-red-400 shrink-0 mt-0.5" />}
                {log.type === "success" && <CheckCircleIcon size={12} className="text-emerald-400 shrink-0 mt-0.5" />}
                {log.type === "warn" && <AlertTriangleIcon size={12} className="text-amber-400 shrink-0 mt-0.5" />}
                {log.type === "info" && <RefreshCwIcon size={12} className="text-blue-400 shrink-0 mt-0.5" />}
                <span className={`${log.type === "error" ? "text-red-400" : log.type === "success" ? "text-emerald-400" : log.type === "warn" ? "text-amber-400" : "text-muted-foreground"}`}>
                  {log.msg}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
