"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ClapperboardIcon, ArrowLeftIcon, SaveIcon, LoaderIcon } from "lucide-react";

export default function AddShoot() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    client_name: "",
    description: "",
    shoot_date: "",
    location: "",
    budget: "",
    currency: "INR",
    status: "upcoming",
  });

  function set(key, val) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }

    setSaving(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();

    const { error: err } = await supabase.from("shoots").insert({
      title: form.title.trim(),
      client_name: form.client_name.trim() || null,
      description: form.description.trim() || null,
      shoot_date: form.shoot_date || null,
      location: form.location.trim() || null,
      budget: Number(form.budget) || 0,
      currency: form.currency,
      status: form.status,
      created_by: user?.id || null,
    });

    if (err) {
      setError(err.message);
      setSaving(false);
    } else {
      router.push("/shoots");
    }
  }

  const inputCls = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60";

  return (
    <div className="flex flex-1 flex-col gap-6 py-4 max-w-2xl">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/shoots")} className="p-2 rounded-md border border-border hover:bg-muted transition-colors">
          <ArrowLeftIcon size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <ClapperboardIcon size={24} className="text-primary" />
            Add Shoot
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Create a new shoot to track expenses</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium mb-1 block">Title <span className="text-red-400">*</span></label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Product Launch Shoot" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Client Name</label>
            <input value={form.client_name} onChange={(e) => set("client_name", e.target.value)} placeholder="Client or brand name" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Location</label>
            <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Shoot location" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Shoot Date</label>
            <input type="date" value={form.shoot_date} onChange={(e) => set("shoot_date", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Status</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
              <option value="upcoming">Upcoming</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Budget</label>
            <input type="number" min="0" step="0.01" value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="0" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Currency</label>
            <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className={inputCls}>
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium mb-1 block">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Brief about the shoot..." rows={3} className={inputCls} />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button type="submit" disabled={saving} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {saving ? <LoaderIcon size={14} className="animate-spin" /> : <SaveIcon size={14} />}
            {saving ? "Creating..." : "Create Shoot"}
          </button>
          <button type="button" onClick={() => router.push("/shoots")} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
