"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Logo from '@/components/Logo';
import Link from 'next/link';
import {
  Box,
  Home,
  Menu,
  ArrowDownUp,
  ClipboardList,
  Sliders,
  Clock,
  Building2,
  Search,
  Edit3,
  Plus,
  X,
  LogOut,
  Tag,
} from 'lucide-react';
import { api, Product, ProductCategory, ApiError } from '@/lib/api';

// =====================================================================
// Create Category Modal
// =====================================================================

interface CreateCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreateCategoryModal({ open, onClose, onCreated }: CreateCategoryModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const resetForm = () => { setName(''); setDescription(''); setFieldErrors({}); };
  const handleClose = () => { resetForm(); onClose(); };

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
          mapped[key] = Array.isArray(val) ? val.join(' ') : String(val);
        }
        setFieldErrors(mapped);
      } else {
        setFieldErrors({ non_field_errors: 'Failed to create category.' });
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
          <button onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fieldErrors.non_field_errors && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">{fieldErrors.non_field_errors}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder='e.g. "Raw Materials"' className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors" />
            {fieldErrors.name && <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors">{isSubmitting ? 'Creating...' : 'Create Category'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================================
// Create Product Modal
// =====================================================================

interface CreateProductModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  categories: ProductCategory[];
  onOpenCategoryModal: () => void;
}

function CreateProductModal({ open, onClose, onCreated, categories, onOpenCategoryModal }: CreateProductModalProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [uom, setUom] = useState('pcs');
  const [costPrice, setCostPrice] = useState('0');
  const [reorderMinimum, setReorderMinimum] = useState('0');
  const [initialStock, setInitialStock] = useState('0');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setName(''); setSku(''); setCategoryId(''); setUom('pcs');
    setCostPrice('0'); setReorderMinimum('0'); setInitialStock('0'); setFieldErrors({});
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    try {
      await api.products.create({
        name, sku,
        category: categoryId ? Number(categoryId) : null,
        uom, cost_price: Number(costPrice),
        reorder_minimum: Number(reorderMinimum),
        initial_stock: Number(initialStock),
      });
      handleClose();
      onCreated();
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 400 && apiErr.body) {
        const mapped: Record<string, string> = {};
        for (const [key, val] of Object.entries(apiErr.body)) {
          mapped[key] = Array.isArray(val) ? val.join(' ') : String(val);
        }
        setFieldErrors(mapped);
      } else {
        setFieldErrors({ non_field_errors: 'Failed to create product. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">New Product</h2>
          <button onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fieldErrors.non_field_errors && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">{fieldErrors.non_field_errors}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="block w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors" placeholder="e.g. Steel Bar" />
            {fieldErrors.name && <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">SKU *</label>
            <input type="text" required value={sku} onChange={(e) => setSku(e.target.value)} className="block w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors" placeholder="e.g. STL-001" />
            {fieldErrors.sku && <p className="text-red-600 text-xs mt-1">{fieldErrors.sku}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              {categories.length === 0 ? (
                <button type="button" onClick={onOpenCategoryModal} className="w-full text-left text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 hover:bg-amber-100 transition-colors">
                  No categories yet. Click to create one.
                </button>
              ) : (
                <div className="flex gap-1">
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="block w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors">
                    <option value="">None</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={onOpenCategoryModal} title="Add category" className="shrink-0 p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
              {fieldErrors.category && <p className="text-red-600 text-xs mt-1">{fieldErrors.category}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit of Measure</label>
              <select value={uom} onChange={(e) => setUom(e.target.value)} className="block w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors">
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="litre">Litres</option>
                <option value="box">Boxes</option>
                <option value="metre">Metres</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price</label>
              <input type="number" min="0" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="block w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              {fieldErrors.cost_price && <p className="text-red-600 text-xs mt-1">{fieldErrors.cost_price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Min</label>
              <input type="number" min="0" value={reorderMinimum} onChange={(e) => setReorderMinimum(e.target.value)} className="block w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Initial Stock</label>
              <input type="number" min="0" value={initialStock} onChange={(e) => setInitialStock(e.target.value)} className="block w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors">{isSubmitting ? 'Saving...' : 'Create Product'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================================
// Products Page
// =====================================================================

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError(null);
    api.products.list()
      .then(data => setProducts(data))
      .catch(() => setError("Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  const fetchCategories = useCallback(() => {
    api.categories.list().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => { fetchProducts(); fetchCategories(); }, [fetchProducts, fetchCategories]);

  const handleCategoryCreated = () => {
    fetchCategories();
  };

  const handleEditStart = (product: Product) => {
    setEditingId(product.id);
    setEditValue('0');
  };

  const handleEditSave = async (id: number) => {
    setEditingId(null);
  };

  const skeletonRows = Array.from({ length: 4 }, (_, i) => (
    <tr key={`skel-${i}`}>
      <td className="px-6 py-5">
        <div className="space-y-2">
          <div className="h-4 w-36 bg-slate-200 rounded animate-pulse" />
          <div className="h-3 w-48 bg-slate-100 rounded animate-pulse" />
        </div>
      </td>
      <td className="px-6 py-5"><div className="h-4 w-20 bg-slate-200 rounded animate-pulse" /></td>
      <td className="px-6 py-5"><div className="h-4 w-12 bg-slate-200 rounded animate-pulse" /></td>
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
          <div className="mb-4"><Link href="/" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><Home className="w-5 h-5" /><span>Dashboard</span></Link></div>
          <div className="mb-4">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Inventory</p>
            <Link href="/products" className="flex items-center space-x-3 bg-blue-600/10 text-blue-400 px-4 py-2.5 rounded-lg font-medium transition-all"><Menu className="w-5 h-5" /><span>Products</span></Link>
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
          <div className="mb-4"><p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Configuration</p><Link href="/warehouse" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><Building2 className="w-5 h-5" /><span>Warehouse</span></Link></div>
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
            <button onClick={handleLogout} title="Logout" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <header className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Stock</h1>
              <p className="text-slate-500 text-sm">Manage product inventory and stock levels.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64 hidden sm:block">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Search className="w-4 h-4 text-slate-400" /></span>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-colors"
                />
              </div>
              <button onClick={() => setShowCategoryModal(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shrink-0">
                <Tag className="w-4 h-4" />
                Add Category
              </button>
              <button onClick={() => setShowProductModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shrink-0">
                <Plus className="w-4 h-4" />
                New Product
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
                    <th className="px-6 py-4">PRODUCT</th>
                    <th className="px-6 py-4">PER UNIT COST</th>
                    <th className="px-6 py-4">ON HAND</th>
                    <th className="px-6 py-4">FREE TO USE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-slate-200">
                  {loading ? skeletonRows : (() => {
                    const q = searchQuery.toLowerCase();
                    const filtered = q
                      ? products.filter((p) =>
                          p.name.toLowerCase().includes(q) ||
                          p.sku.toLowerCase().includes(q) ||
                          (p.category_name || '').toLowerCase().includes(q)
                        )
                      : products;
                    return filtered.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                          {searchQuery ? 'No products match your search.' : 'No products found. Click "New Product" to add one.'}
                        </td>
                      </tr>
                    ) : filtered.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{product.name}</span>
                          <span className="text-xs text-slate-500 font-medium mt-0.5">[{product.sku}] · {product.category_name || 'Uncategorized'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-slate-700 font-medium">{parseFloat(product.cost_price).toLocaleString()} Rs</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          {editingId === product.id ? (
                            <input type="number" className="w-20 border border-blue-300 rounded-md px-2 py-1 text-sm font-bold text-slate-900 focus:ring-blue-500 outline-none" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => handleEditSave(product.id)} onKeyDown={(e) => e.key === 'Enter' && handleEditSave(product.id)} autoFocus />
                          ) : (
                            <>
                              <span className="font-bold text-slate-900">{product.reorder_minimum}</span>
                              <button onClick={() => handleEditStart(product)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-blue-600"><Edit3 className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 font-medium text-slate-700">{product.reorder_minimum}</td>
                    </tr>
                  ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <CreateCategoryModal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCreated={handleCategoryCreated}
      />
      <CreateProductModal
        open={showProductModal}
        onClose={() => setShowProductModal(false)}
        onCreated={fetchProducts}
        categories={categories}
        onOpenCategoryModal={() => { setShowProductModal(false); setShowCategoryModal(true); }}
      />

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}
