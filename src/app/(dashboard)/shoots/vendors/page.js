"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  BuildingIcon, PlusIcon, Trash2Icon, LoaderIcon, PencilIcon, SearchIcon,
  XIcon, SaveIcon, MailIcon, PhoneIcon, MapPinIcon, FileTextIcon,
} from "lucide-react";

const EMPTY = { name: "", email: "", contact_number: "", address: "", gst_number: "" };

export default function ShootVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadVendors();
  }, []);

  async function loadVendors() {
    const { data } = await supabase.from("shoot_vendors").select("*").order("name");
    if (data) setVendors(data);
    setLoading(false);
  }

  function set(key, val) { setForm((p) => ({ ...p, [key]: val })); }

  function startEdit(vendor) {
    setEditId(vendor.id);
    setForm({ name: vendor.name || "", email: vendor.email || "", contact_number: vendor.contact_number || "", address: vendor.address || "", gst_number: vendor.gst_number || "" });
    setShowForm(true);
    setError("");
  }

  function startAdd() {
    setEditId(null);
    setForm({ ...EMPTY });
    setShowForm(true);
    setError("");
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Vendor name is required."); return; }
    setSaving(true);
    setError("");

    const row = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      contact_number: form.contact_number.trim() || null,
      address: form.address.trim() || null,
      gst_number: form.gst_number.trim() || null,
    };

    if (editId) {
      const { error: err } = await supabase.from("shoot_vendors").update(row).eq("id", editId);
      if (err) { setError(err.message); } else {
        setVendors((prev) => prev.map((v) => v.id === editId ? { ...v, ...row } : v).sort((a, b) => a.name.localeCompare(b.name)));
        setShowForm(false);
        setEditId(null);
      }
    } else {
      const { data, error: err } = await supabase.from("shoot_vendors").insert(row).select().single();
      if (err) { setError(err.message); } else {
        setVendors((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        setShowForm(false);
      }
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this vendor?")) return;
    await supabase.from("shoot_vendors").delete().eq("id", id);
    setVendors((prev) => prev.filter((v) => v.id !== id));
  }

  const filtered = vendors.filter((v) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return v.name?.toLowerCase().includes(q) || v.email?.toLowerCase().includes(q) || v.gst_number?.toLowerCase().includes(q);
  });

  if (loading) {
    return <div className="flex flex-1 items-center justify-center py-16"><LoaderIcon size={20} className="animate-spin text-muted-foreground" /></div>;
  }

  const inputCls = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60";

  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <BuildingIcon size={24} className="text-primary" />
            Vendors
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{vendors.length} vendor{vendors.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={startAdd} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <PlusIcon size={14} /> Add Vendor
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or GST..."
          className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
        />
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold">{editId ? "Edit Vendor" : "New Vendor"}</h2>
          {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium mb-1 block">Name <span className="text-red-400">*</span></label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Vendor name" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="vendor@example.com" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Contact Number</label>
              <input value={form.contact_number} onChange={(e) => set("contact_number", e.target.value)} placeholder="Phone number" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">GST Number</label>
              <input value={form.gst_number} onChange={(e) => set("gst_number", e.target.value)} placeholder="GST number" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium mb-1 block">Address</label>
              <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Full address" className={inputCls} />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {saving ? <LoaderIcon size={14} className="animate-spin" /> : <SaveIcon size={14} />}
              {saving ? "Saving..." : editId ? "Update" : "Add Vendor"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {/* Vendors List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BuildingIcon size={32} className="mb-2 opacity-40" />
          <p className="text-sm">No vendors found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Vendor</th>
                <th className="text-left px-4 py-2.5 text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Contact</th>
                <th className="text-left px-4 py-2.5 text-[11px] text-muted-foreground uppercase tracking-wider font-medium">GST</th>
                <th className="text-left px-4 py-2.5 text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Address</th>
                <th className="text-right px-4 py-2.5 text-[11px] text-muted-foreground uppercase tracking-wider font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <tr key={v.id} className={`${i < filtered.length - 1 ? "border-b border-border/50" : ""} hover:bg-muted/20 transition-colors`}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{v.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {v.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><MailIcon size={10} /> {v.email}</p>}
                      {v.contact_number && <p className="text-xs text-muted-foreground flex items-center gap-1"><PhoneIcon size={10} /> {v.contact_number}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-muted-foreground">{v.gst_number || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">{v.address || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => startEdit(v)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><PencilIcon size={14} /></button>
                      <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2Icon size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
