"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  TagIcon, PlusIcon, Trash2Icon, LoaderIcon, PencilIcon, CheckIcon, XIcon,
} from "lucide-react";

export default function ShootCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const { data } = await supabase.from("shoot_categories").select("*").order("name");
    if (data) setCategories(data);
    setLoading(false);
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    setError("");
    const { data, error: err } = await supabase
      .from("shoot_categories")
      .insert({ name: newName.trim().toLowerCase() })
      .select()
      .single();
    if (err) {
      setError(err.message.includes("unique") ? "Category already exists." : err.message);
    } else {
      setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
    }
    setAdding(false);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this category?")) return;
    await supabase.from("shoot_categories").delete().eq("id", id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleEdit(id) {
    if (!editName.trim()) return;
    const { error: err } = await supabase
      .from("shoot_categories")
      .update({ name: editName.trim().toLowerCase() })
      .eq("id", id);
    if (!err) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: editName.trim().toLowerCase() } : c)).sort((a, b) => a.name.localeCompare(b.name))
      );
    }
    setEditId(null);
    setEditName("");
  }

  if (loading) {
    return <div className="flex flex-1 items-center justify-center py-16"><LoaderIcon size={20} className="animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <TagIcon size={24} className="text-primary" />
          Expense Categories
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{categories.length} categories</p>
      </div>

      {/* Add new */}
      <div className="flex items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="New category name..."
          className="flex-1 max-w-sm rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
        />
        <button
          onClick={handleAdd}
          disabled={!newName.trim() || adding}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <PlusIcon size={14} /> {adding ? "Adding..." : "Add"}
        </button>
      </div>
      {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>}

      {/* List */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2.5 text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Category</th>
              <th className="text-right px-4 py-2.5 text-[11px] text-muted-foreground uppercase tracking-wider font-medium w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, i) => (
              <tr key={cat.id} className={`${i < categories.length - 1 ? "border-b border-border/50" : ""} hover:bg-muted/20 transition-colors`}>
                <td className="px-4 py-3">
                  {editId === cat.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleEdit(cat.id); if (e.key === "Escape") setEditId(null); }}
                      className="rounded-md border border-primary/50 bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 w-full max-w-xs"
                    />
                  ) : (
                    <span className="font-medium capitalize">{cat.name.replace(/_/g, " ")}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {editId === cat.id ? (
                      <>
                        <button onClick={() => handleEdit(cat.id)} className="p-1.5 rounded text-green-400 hover:bg-green-500/10 transition-colors"><CheckIcon size={14} /></button>
                        <button onClick={() => setEditId(null)} className="p-1.5 rounded text-muted-foreground hover:bg-muted transition-colors"><XIcon size={14} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditId(cat.id); setEditName(cat.name); }} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><PencilIcon size={14} /></button>
                        <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2Icon size={14} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
