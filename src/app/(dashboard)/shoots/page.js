"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ClapperboardIcon, PlusIcon, SearchIcon, LoaderIcon,
  MapPinIcon, CalendarIcon, UserIcon,
} from "lucide-react";

const STATUS_COLORS = {
  upcoming: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const STATUS_LABELS = {
  upcoming: "Upcoming",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function Shoots() {
  const router = useRouter();
  const [shoots, setShoots] = useState([]);
  const [expenses, setExpenses] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPrivileged, setIsPrivileged] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: emp } = await supabase
          .from("employees")
          .select("role")
          .eq("work_email", user.email)
          .maybeSingle();
        if (emp && ["admin", "owner", "hr", "finance"].includes(emp.role)) {
          setIsPrivileged(true);
        }
      }

      const { data } = await supabase
        .from("shoots")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setShoots(data);

      const { data: exp } = await supabase
        .from("shoot_expenses")
        .select("shoot_id, amount");
      if (exp) {
        const map = {};
        exp.forEach((e) => {
          if (!map[e.shoot_id]) map[e.shoot_id] = { total: 0, count: 0 };
          map[e.shoot_id].total += Number(e.amount) || 0;
          map[e.shoot_id].count += 1;
        });
        setExpenses(map);
      }

      setLoading(false);
    }
    load();
  }, []);

  const filtered = shoots
    .filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          s.title?.toLowerCase().includes(q) ||
          s.client_name?.toLowerCase().includes(q) ||
          s.location?.toLowerCase().includes(q)
        );
      }
      return true;
    });

  function getBudgetColor(spent, budget) {
    if (!budget || budget <= 0) return "bg-muted";
    const pct = (spent / budget) * 100;
    if (pct > 100) return "bg-red-500";
    if (pct >= 80) return "bg-amber-500";
    return "bg-emerald-500";
  }

  function formatCurrency(amount, currency) {
    const sym = currency === "USD" ? "$" : currency === "EUR" ? "\u20ac" : currency === "GBP" ? "\u00a3" : "\u20b9";
    return `${sym}${Number(amount || 0).toLocaleString("en-IN")}`;
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <LoaderIcon size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <ClapperboardIcon size={24} className="text-primary" />
            Shoots
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{shoots.length} shoot{shoots.length !== 1 ? "s" : ""}</p>
        </div>
        {isPrivileged && (
          <button
            onClick={() => router.push("/shoots/add")}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <PlusIcon size={14} /> Add Shoot
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, client, or location..."
            className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
        >
          <option value="all">All statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Shoot Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <ClapperboardIcon size={32} className="mb-2 opacity-40" />
          <p className="text-sm">No shoots found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((shoot) => {
            const exp = expenses[shoot.id] || { total: 0, count: 0 };
            const budget = Number(shoot.budget) || 0;
            const pct = budget > 0 ? Math.min((exp.total / budget) * 100, 100) : 0;
            const overBudget = budget > 0 && exp.total > budget;

            return (
              <div
                key={shoot.id}
                onClick={() => router.push(`/shoots/${shoot.id}`)}
                className="rounded-xl border border-border bg-card p-5 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate">{shoot.title}</h3>
                    {shoot.client_name && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <UserIcon size={10} /> {shoot.client_name}
                      </p>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${STATUS_COLORS[shoot.status] || STATUS_COLORS.upcoming}`}>
                    {STATUS_LABELS[shoot.status] || shoot.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                  {shoot.shoot_date && (
                    <span className="flex items-center gap-1"><CalendarIcon size={10} /> {shoot.shoot_date}</span>
                  )}
                  {shoot.location && (
                    <span className="flex items-center gap-1"><MapPinIcon size={10} /> {shoot.location}</span>
                  )}
                </div>

                {/* Budget bar */}
                {budget > 0 ? (
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className={`font-medium ${overBudget ? "text-red-400" : "text-muted-foreground"}`}>
                        {formatCurrency(exp.total, shoot.currency)} / {formatCurrency(budget, shoot.currency)}
                      </span>
                      <span className="text-muted-foreground">{exp.count} expense{exp.count !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getBudgetColor(exp.total, budget)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {overBudget && (
                      <p className="text-[10px] text-red-400 mt-1">Over budget by {formatCurrency(exp.total - budget, shoot.currency)}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{formatCurrency(exp.total, shoot.currency)} spent</span>
                    <span>{exp.count} expense{exp.count !== 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
