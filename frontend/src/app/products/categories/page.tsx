"use client";

import React, { useState, useEffect, useCallback } from "react";
import Logo from '@/components/Logo';
import Link from "next/link";
import {
  Box, Home, Menu, ArrowDownUp, ClipboardList, Sliders, Clock, Building2,
  Search, Plus, X, LogOut, Tag,
} from "lucide-react";
import { api, ProductCategory, Product, ApiError } from "@/lib/api";

// =====================================================================
// Add Category Modal
// =====================================================================

interface AddCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function AddCategoryModal({ open, onClose, onCreated }: AddCategoryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setName("");
    setDescription("");
    setFieldErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    try {
      await api.categories.create({ name, description: description || undefined });
      handleClose();
      onCreated();
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 400 && apiErr.body) {
        const mapped: Record<string, string> = {};
        for (const [key, val] of Object.entries(apiErr.body)) {
          mapped[key] = Array.isArray(val) ? val.join(" ") : String(val);
        }
        setFieldErrors(mapped);
      } else {
        setFieldErrors({ non_field_errors: "Failed to create category. Please try again." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Add Category</h2>
          <button onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fieldErrors.non_field_errors && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
              {fieldErrors.non_field_errors}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. "Raw Materials", "Finished Goods"'
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {fieldErrors.name && <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors">
              {isSubmitting ? "Creating..." : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================================
// Categories Page
// =====================================================================

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([api.categories.list(), api.products.list()])
      .then(([cats, prods]) => {
        setCategories(cats);
        setProducts(prods);
      })
      .catch(() => setError("Failed to load categories"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const q = searchQuery.toLowerCase();
  const filtered = categories.filter(
    (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
  );

  // Count products per category
  const productCount = (catId: number) => products.filter((p) => p.category === catId).length;

  const skeletonRows = Array.from({ length: 4 }, (_, i) => (
    <tr key={`skel-${i}`}>
      <td className="px-6 py-5"><div className="h-4 w-32 bg-slate-200 rounded animate-pulse" /></td>
      <td className="px-6 py-5"><div className="h-4 w-48 bg-slate-200 rounded animate-pulse" /></td>
      <td className="px-6 py-5"><div className="h-4 w-12 bg-slate-200 rounded animate-pulse" /></td>
    </tr>
  ));

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 overflow-hidden shadow-sm"><Logo className="w-10 h-10" /></div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white leading-none tracking-tight mb-1">Inventory</span>
            <span className="text-[10px] sm:text-xs font-semibold text-blue-400 tracking-wider uppercase leading-none">Management System</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 space-y-1 px-4 custom-scrollbar">
          <div className="mb-4">
            <Link href="/" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><Home className="w-5 h-5" /><span>Dashboard</span></Link>
          </div>
          <div className="mb-4">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Inventory</p>
            <div className="space-y-1">
              <Link href="/products" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><Menu className="w-5 h-5" /><span>Products</span></Link>
              <Link href="/products/categories" className="flex items-center space-x-3 bg-blue-600/10 text-blue-400 px-4 py-2.5 rounded-lg font-medium transition-all pl-11"><Tag className="w-4 h-4" /><span>Categories</span></Link>
            </div>
          </div>
          <div className="mb-4">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Operations</p>
            <div className="space-y-1">
              <Link href="/receipts" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><ArrowDownUp className="w-5 h-5" /><span>Receipts</span></Link>
              <Link href="/delivery" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><ClipboardList className="w-5 h-5" /><span>Delivery</span></Link>
              <Link href="/adjustments" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><Sliders className="w-5 h-5" /><span>Adjustments</span></Link>
              <Link href="/move-history" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><Clock className="w-5 h-5" /><span>Move History</span></Link>
            </div>
          </div>
          <div className="mb-4">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Configuration</p>
            <Link href="/warehouse" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><Building2 className="w-5 h-5" /><span>Warehouse</span></Link>
          </div>
        </nav>
        <div className="p-6 border-t border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-slate-700 shrink-0 flex items-center justify-center text-white font-medium text-sm">
                {user ? (user.first_name?.[0] || user.username?.[0] || "U").toUpperCase() : "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username : "User"}</p>
                <p className="text-xs text-slate-500 truncate capitalize">{user?.role || "Staff"}</p>
              </div>
            </div>
            <button onClick={handleLogout} title="Logout" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <header className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Product Categories</h1>
              <p className="text-slate-500 text-sm">Group products into categories for easier management.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-56 hidden sm:block">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Search className="w-4 h-4 text-slate-400" /></span>
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-colors"
                />
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </div>
          </header>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto font-sans">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">NAME</th>
                    <th className="px-6 py-4">DESCRIPTION</th>
                    <th className="px-6 py-4">PRODUCTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? skeletonRows : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                        {searchQuery ? "No categories match your search." : 'No categories yet. Click "Add Category" to create one.'}
                      </td>
                    </tr>
                  ) : filtered.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Tag className="w-3.5 h-3.5 text-blue-600" /></span>
                          <span className="font-medium text-slate-900">{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-slate-600">{cat.description || <span className="text-slate-300 italic">No description</span>}</td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                          {productCount(cat.id)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <AddCategoryModal open={showModal} onClose={() => setShowModal(false)} onCreated={fetchData} />

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}
