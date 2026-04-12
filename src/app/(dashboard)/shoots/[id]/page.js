"use client";

import { useState, useEffect, use, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ClapperboardIcon, ArrowLeftIcon, PlusIcon, LoaderIcon, CheckIcon, XIcon,
  SaveIcon, ReceiptIcon, AlertTriangleIcon, FileIcon, ExternalLinkIcon,
  UploadIcon, Trash2Icon,
} from "lucide-react";

// Categories loaded from DB at runtime

const CATEGORY_COLORS = {
  travel: "bg-blue-500/10 text-blue-400",
  food: "bg-amber-500/10 text-amber-400",
  equipment: "bg-violet-500/10 text-violet-400",
  talent: "bg-pink-500/10 text-pink-400",
  location: "bg-green-500/10 text-green-400",
  transport: "bg-cyan-500/10 text-cyan-400",
  accommodation: "bg-orange-500/10 text-orange-400",
  props: "bg-indigo-500/10 text-indigo-400",
  post_production: "bg-rose-500/10 text-rose-400",
  misc: "bg-zinc-500/10 text-zinc-400",
};

const APPROVAL_COLORS = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-green-500/10 text-green-400 border-green-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_COLORS = {
  upcoming: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export default function ShootDetailPage({ params }) {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center py-16"><LoaderIcon size={20} className="animate-spin text-muted-foreground" /></div>}>
      <ShootDetail params={params} />
    </Suspense>
  );
}

function ShootDetail({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [shoot, setShoot] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPrivileged, setIsPrivileged] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [signedUrls, setSignedUrls] = useState({});
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({
    title: "", category: "misc", amount: "", currency: "INR", expense_date: "",
    vendor_name: "", vendor_gst: "", invoice_number: "", invoice_date: "",
    payment_method: "upi", paid_by: "", billable: true, notes: "",
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        const { data: emp } = await supabase.from("employees").select("role, first_name, last_name").eq("work_email", user.email).maybeSingle();
        if (emp && ["admin", "owner", "hr", "finance"].includes(emp.role)) setIsPrivileged(true);
        if (emp) setForm((p) => ({ ...p, paid_by: `${emp.first_name} ${emp.last_name}` }));
      }

      const { data: s } = await supabase.from("shoots").select("*").eq("id", id).maybeSingle();
      if (s) {
        setShoot(s);
        setForm((p) => ({ ...p, currency: s.currency || "INR" }));
      }

      const { data: exp } = await supabase
        .from("shoot_expenses")
        .select("*")
        .eq("shoot_id", id)
        .order("created_at", { ascending: false });
      if (exp) {
        setExpenses(exp);
        // Resolve receipt signed URLs
        const urls = {};
        for (const e of exp) {
          if (e.receipt_url) {
            const { data: signed } = await supabase.storage.from("employee-documents").createSignedUrl(e.receipt_url, 3600);
            if (signed?.signedUrl) urls[e.id] = signed.signedUrl;
          }
        }
        setSignedUrls(urls);
      }

      // Load categories and vendors
      supabase.from("shoot_categories").select("name").order("name").then(({ data: c }) => {
        if (c) setCategories(c.map((x) => x.name));
      });
      supabase.from("shoot_vendors").select("*").order("name").then(({ data: v }) => {
        if (v) setVendors(v);
      });

      setLoading(false);
    }
    load();
  }, [id]);

  function set(key, val) { setForm((p) => ({ ...p, [key]: val })); }

  async function handleAddExpense(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.amount) return;

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    let receipt_url = null;
    if (receiptFile) {
      const ext = receiptFile.name.split(".").pop();
      const path = `shoot-receipts/${id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("employee-documents").upload(path, receiptFile, { contentType: receiptFile.type });
      if (!uploadErr) receipt_url = path;
    }

    const row = {
      shoot_id: Number(id),
      title: form.title.trim(),
      category: form.category,
      amount: Number(form.amount),
      currency: form.currency,
      expense_date: form.expense_date || null,
      vendor_name: form.vendor_name.trim() || null,
      vendor_gst: form.vendor_gst.trim() || null,
      invoice_number: form.invoice_number.trim() || null,
      invoice_date: form.invoice_date || null,
      payment_method: form.payment_method,
      paid_by: form.paid_by.trim() || null,
      receipt_url,
      billable: form.billable,
      notes: form.notes.trim() || null,
      created_by: user?.id || null,
    };

    const { data: inserted, error: err } = await supabase.from("shoot_expenses").insert(row).select().single();
    if (!err && inserted) {
      setExpenses((prev) => [inserted, ...prev]);
      if (receipt_url) {
        const { data: signed } = await supabase.storage.from("employee-documents").createSignedUrl(receipt_url, 3600);
        if (signed?.signedUrl) setSignedUrls((prev) => ({ ...prev, [inserted.id]: signed.signedUrl }));
      }
      setForm({
        title: "", category: "misc", amount: "", currency: shoot?.currency || "INR", expense_date: "",
        vendor_name: "", vendor_gst: "", invoice_number: "", invoice_date: "",
        payment_method: "upi", paid_by: form.paid_by, billable: true, notes: "",
      });
      setReceiptFile(null);
      setShowForm(false);
    }
    setSaving(false);
  }

  async function handleApproval(expenseId, status) {
    const expense = expenses.find((e) => e.id === expenseId);
    if (status === "approved" && !expense?.receipt_url) return;

    await supabase.from("shoot_expenses").update({ approval_status: status, approved_by: userEmail }).eq("id", expenseId);
    setExpenses((prev) => prev.map((e) => e.id === expenseId ? { ...e, approval_status: status, approved_by: userEmail } : e));
  }

  async function handleDelete(expenseId) {
    if (!confirm("Delete this expense?")) return;
    const expense = expenses.find((e) => e.id === expenseId);
    if (expense?.receipt_url) {
      await supabase.storage.from("employee-documents").remove([expense.receipt_url]);
    }
    await supabase.from("shoot_expenses").delete().eq("id", expenseId);
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
  }

  if (loading) {
    return <div className="flex flex-1 items-center justify-center py-16"><LoaderIcon size={20} className="animate-spin text-muted-foreground" /></div>;
  }

  if (!shoot) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-16 gap-3">
        <ClapperboardIcon size={32} className="text-muted-foreground opacity-40" />
        <p className="text-sm text-muted-foreground">Shoot not found</p>
        <button onClick={() => router.push("/shoots")} className="text-sm text-primary hover:underline">Back to Shoots</button>
      </div>
    );
  }

  const budget = Number(shoot.budget) || 0;
  const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const remaining = budget - totalSpent;
  const pct = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  const overBudget = budget > 0 && totalSpent > budget;
  const nearBudget = budget > 0 && totalSpent >= budget * 0.8 && !overBudget;
  const approvedTotal = expenses.filter((e) => e.approval_status === "approved").reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const pendingCount = expenses.filter((e) => e.approval_status === "pending").length;

  function fmt(amount) {
    const sym = "\u20b9";
    return `${sym}${Number(amount || 0).toLocaleString("en-IN")}`;
  }

  const inputCls = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60";

  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/shoots")} className="p-2 rounded-md border border-border hover:bg-muted transition-colors">
            <ArrowLeftIcon size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{shoot.title}</h1>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[shoot.status] || STATUS_COLORS.upcoming}`}>
                {shoot.status?.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {[shoot.client_name, shoot.location, shoot.shoot_date].filter(Boolean).join(" \u00b7 ")}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <PlusIcon size={14} /> Add Expense
        </button>
      </div>

      {/* Budget warnings */}
      {overBudget && (
        <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertTriangleIcon size={16} /> Over budget by {fmt(totalSpent - budget)}
        </div>
      )}
      {nearBudget && (
        <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <AlertTriangleIcon size={16} /> Approaching budget limit ({Math.round((totalSpent / budget) * 100)}% used)
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Spent</p>
          <p className={`text-lg font-semibold ${overBudget ? "text-red-400" : ""}`}>{fmt(totalSpent)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{budget > 0 ? "Remaining" : "Budget"}</p>
          <p className="text-lg font-semibold">{budget > 0 ? fmt(remaining) : "Not set"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Approved</p>
          <p className="text-lg font-semibold">{fmt(approvedTotal)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Pending</p>
          <p className="text-lg font-semibold">{pendingCount}</p>
        </div>
      </div>

      {/* Budget bar */}
      {budget > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Budget Usage</span>
            <span>{Math.round((totalSpent / budget) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${overBudget ? "bg-red-500" : nearBudget ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Add Expense Form */}
      {showForm && (
        <form onSubmit={handleAddExpense} className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <ReceiptIcon size={16} className="text-muted-foreground" /> New Expense
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium mb-1 block">Title <span className="text-red-400">*</span></label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Camera rental" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Category <span className="text-red-400">*</span></label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
                {categories.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Amount <span className="text-red-400">*</span></label>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Expense Date</label>
              <input type="date" value={form.expense_date} onChange={(e) => set("expense_date", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Vendor</label>
              <select
                value={form.vendor_name}
                onChange={(e) => {
                  const name = e.target.value;
                  set("vendor_name", name);
                  const v = vendors.find((x) => x.name === name);
                  if (v) set("vendor_gst", v.gst_number || "");
                }}
                className={inputCls}
              >
                <option value="">Select vendor...</option>
                {vendors.map((v) => <option key={v.id} value={v.name}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Vendor GST</label>
              <input value={form.vendor_gst} onChange={(e) => set("vendor_gst", e.target.value)} placeholder="Auto-filled from vendor" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Invoice Number</label>
              <input value={form.invoice_number} onChange={(e) => set("invoice_number", e.target.value)} placeholder="INV-001" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Invoice Date</label>
              <input type="date" value={form.invoice_date} onChange={(e) => set("invoice_date", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Payment Method</label>
              <select value={form.payment_method} onChange={(e) => set("payment_method", e.target.value)} className={inputCls}>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Paid By</label>
              <input value={form.paid_by} onChange={(e) => set("paid_by", e.target.value)} placeholder="Name" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Receipt / Invoice</label>
              <label className="flex items-center gap-2 rounded-md border border-dashed border-border hover:border-muted-foreground px-3 py-2 cursor-pointer transition-colors text-xs">
                {receiptFile ? <FileIcon size={12} className="text-green-400" /> : <UploadIcon size={12} className="text-muted-foreground" />}
                <span className="truncate">{receiptFile ? receiptFile.name : "Upload file"}</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
              </label>
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={form.billable} onChange={(e) => set("billable", e.target.checked)} className="rounded" />
                Billable
              </label>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium mb-1 block">Notes</label>
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional notes..." rows={2} className={inputCls} />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {saving ? <LoaderIcon size={14} className="animate-spin" /> : <SaveIcon size={14} />}
              {saving ? "Adding..." : "Add Expense"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {/* Expenses Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <ReceiptIcon size={16} className="text-muted-foreground" /> Expenses ({expenses.length})
          </h2>
        </div>
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ReceiptIcon size={32} className="mb-2 opacity-40" />
            <p className="text-sm">No expenses yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Expense</th>
                <th className="text-center px-4 py-2.5 text-[11px] text-muted-foreground uppercase tracking-wider font-medium w-24">Category</th>
                <th className="text-right px-4 py-2.5 text-[11px] text-muted-foreground uppercase tracking-wider font-medium w-28">Amount</th>
                <th className="text-center px-4 py-2.5 text-[11px] text-muted-foreground uppercase tracking-wider font-medium w-24">Status</th>
                <th className="text-center px-4 py-2.5 text-[11px] text-muted-foreground uppercase tracking-wider font-medium w-20">Receipt</th>
                <th className="text-center px-4 py-2.5 text-[11px] text-muted-foreground uppercase tracking-wider font-medium w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp, i) => (
                <tr key={exp.id} className={`${i < expenses.length - 1 ? "border-b border-border/50" : ""} hover:bg-muted/20 transition-colors`}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{exp.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {[exp.vendor_name, exp.invoice_number, exp.paid_by, exp.expense_date].filter(Boolean).join(" \u00b7 ")}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium capitalize ${CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.misc}`}>
                      {exp.category?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{fmt(exp.amount)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium border capitalize ${APPROVAL_COLORS[exp.approval_status] || APPROVAL_COLORS.pending}`}>
                      {exp.approval_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {signedUrls[exp.id] ? (
                      <a href={signedUrls[exp.id]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-xs">
                        <ExternalLinkIcon size={10} /> View
                      </a>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {isPrivileged && exp.approval_status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApproval(exp.id, "approved")}
                            disabled={!exp.receipt_url}
                            title={!exp.receipt_url ? "Receipt required for approval" : "Approve"}
                            className="p-1.5 rounded text-green-400 hover:bg-green-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <CheckIcon size={14} />
                          </button>
                          <button
                            onClick={() => handleApproval(exp.id, "rejected")}
                            title="Reject"
                            className="p-1.5 rounded text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <XIcon size={14} />
                          </button>
                        </>
                      )}
                      {isPrivileged && (
                        <button
                          onClick={() => handleDelete(exp.id)}
                          title="Delete"
                          className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2Icon size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
