"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase"; // for auth token
import {
  BuildingIcon, SearchIcon, LoaderIcon, ChevronLeftIcon, ChevronRightIcon,
  MapPinIcon, CalendarIcon,
} from "lucide-react";

const PAGE_SIZE = 25;

export default function MSMEDirectory() {
  const [records, setRecords] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [district, setDistrict] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [token, setToken] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) setToken(data.session.access_token);
    });
  }, []);

  const fetchData = useCallback(async () => {
    if (!token || !district) return;
    setLoading(true);
    const params = new URLSearchParams({
      district,
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (search.trim()) params.set("q", search.trim());

    const res = await fetch(`/api/msme?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.records) {
      setRecords(data.records);
      setTotal(data.total || 0);
      if (data.districts?.length > 0 && districts.length === 0) {
        setDistricts(data.districts);
      }
    }
    setLoading(false);
  }, [token, district, page, search]);

  useEffect(() => {
    if (district) fetchData();
  }, [fetchData, district]);

  // Load districts that have synced data in Neon
  useEffect(() => {
    if (!token) return;
    fetch("/api/msme?limit=1", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.districts?.length > 0) setDistricts(data.districts);
      })
      .catch(() => {});
  }, [token]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function parseActivities(activities) {
    if (!activities) return [];
    if (typeof activities === "string") {
      try { return JSON.parse(activities); } catch { return []; }
    }
    return Array.isArray(activities) ? activities : [];
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <BuildingIcon size={24} className="text-primary" />
          MSME Directory
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          UDYAM registered enterprises — Tamil Nadu {total > 0 ? `· ${total.toLocaleString("en-IN")} enterprises` : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={district}
          onChange={(e) => { setDistrict(e.target.value); setPage(1); }}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
        >
          <option value="">Select district...</option>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            onKeyDown={(e) => e.key === "Enter" && fetchData()}
            placeholder="Search enterprise name..."
            className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
        </div>
        <button
          onClick={fetchData}
          disabled={!district || loading}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? <LoaderIcon size={14} className="animate-spin" /> : <SearchIcon size={14} />}
          Search
        </button>
      </div>

      {/* Results */}
      {!district ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <MapPinIcon size={32} className="mb-2 opacity-40" />
          <p className="text-sm">Select a district to browse MSME enterprises</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <LoaderIcon size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BuildingIcon size={32} className="mb-2 opacity-40" />
          <p className="text-sm">No enterprises found. Try syncing this district first.</p>
          <p className="text-xs mt-1">Run: /api/cron/msme-sync?district={district}</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Enterprise</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-muted-foreground uppercase tracking-wider font-medium w-24">Pincode</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-muted-foreground uppercase tracking-wider font-medium w-28">Registered</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Activities</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const acts = parseActivities(r.activities);
                  return (
                    <tr key={r.id} className={`${i < records.length - 1 ? "border-b border-border/50" : ""} hover:bg-muted/20 transition-colors`}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{r.enterprise_name}</p>
                        {r.address && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[300px]" title={r.address}>{r.address}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{r.pincode || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{r.registration_date || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {acts.slice(0, 3).map((a, j) => (
                            <span key={j} className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded truncate max-w-[200px]" title={a.Description}>
                              {a.Description}
                            </span>
                          ))}
                          {acts.length > 3 && <span className="text-[10px] text-muted-foreground">+{acts.length - 3} more</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Page {page} of {totalPages} ({total.toLocaleString("en-IN")} total)</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 w-8 rounded-md border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
                >
                  <ChevronLeftIcon size={14} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 w-8 rounded-md border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
                >
                  <ChevronRightIcon size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
