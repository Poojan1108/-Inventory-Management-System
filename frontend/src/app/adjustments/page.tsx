"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Box, Home, Menu, ArrowDownUp, ClipboardList, Sliders, Clock, Building2,
  Search, Plus, Check, X,
} from 'lucide-react';
import {
  api,
  Operation,
  Product,
  Location as LocationType,
  ApiError,
} from '@/lib/api';

// =====================================================================
// Status Badge
// =====================================================================

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  waiting: 'bg-amber-100 text-amber-700',
  ready: 'bg-blue-100 text-blue-700',
  done: 'bg-emerald-100 text-emerald-700',
  canceled: 'bg-slate-100 text-slate-500',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-500'}`}>
      {status}
    </span>
  );
}

// =====================================================================
// Create Adjustment Modal
// =====================================================================

interface CreateAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreateAdjustmentModal({ open, onClose, onCreated }: CreateAdjustmentModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<LocationType[]>([]);

  const [reference, setReference] = useState('');
  const [productId, setProductId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [physicalCount, setPhysicalCount] = useState<string>('');
  const [reason, setReason] = useState('correction');

  const [systemQty, setSystemQty] = useState<number | null>(null);
  const [loadingQty, setLoadingQty] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Fetch products and locations when modal opens
  useEffect(() => {
    if (!open) return;
    Promise.all([api.products.list(), api.locations.list()])
      .then(([p, l]) => {
        setProducts(p);
        setLocations(l.filter(loc => loc.location_type === 'internal'));
      })
      .catch(() => {});
  }, [open]);

  // Fetch system quantity when product + location are both selected
  useEffect(() => {
    if (!productId || !locationId) {
      setSystemQty(null);
      return;
    }
    setLoadingQty(true);
    api.stockQuants.list({ product: productId, location: locationId })
      .then(quants => {
        setSystemQty(quants.length > 0 ? quants[0].quantity : 0);
      })
      .catch(() => setSystemQty(0))
      .finally(() => setLoadingQty(false));
  }, [productId, locationId]);

  const resetForm = () => {
    setReference('');
    setProductId('');
    setLocationId('');
    setPhysicalCount('');
    setReason('correction');
    setSystemQty(null);
    setFieldErrors({});
  };

  const handleClose = () => { resetForm(); onClose(); };

  const difference = systemQty !== null && physicalCount !== ''
    ? Number(physicalCount) - systemQty
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    if (!productId || !locationId || physicalCount === '') {
      setFieldErrors({ non_field_errors: 'Product, location and physical count are required.' });
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Create the adjustment operation
      const op = await api.operations.create({
        reference,
        operation_type: 'adjustment',
        source_location: Number(locationId),
        status: 'ready',
        lines: [{ product: Number(productId), received_qty: Number(physicalCount) }],
      });

      // 2. Immediately validate to apply the correction
      await api.operations.validate(op.id);

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
        const detail = (err as ApiError).body?.detail;
        setFieldErrors({ non_field_errors: typeof detail === 'string' ? detail : 'Failed to apply adjustment. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Create Stock Adjustment</h2>
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

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reference *</label>
            <input
              type="text"
              required
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="e.g. WH/ADJ/001"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {fieldErrors.reference && <p className="text-red-600 text-xs mt-1">{fieldErrors.reference}</p>}
          </div>

          {/* Product */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product *</label>
            <select
              required
              value={productId}
              onChange={e => setProductId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors"
            >
              <option value="">Select product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
            <select
              required
              value={locationId}
              onChange={e => setLocationId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors"
            >
              <option value="">Select location...</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>[{l.short_code}] {l.name}</option>
              ))}
            </select>
          </div>

          {/* System Qty + Physical Count row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">System Quantity</label>
              <div className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500 font-medium">
                {loadingQty
                  ? 'Loading...'
                  : systemQty !== null
                    ? systemQty
                    : '\u2014'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Physical Count *</label>
              <input
                type="number"
                required
                min="0"
                value={physicalCount}
                onChange={e => setPhysicalCount(e.target.value)}
                placeholder="e.g. 48"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {difference !== null && (
                <p className="text-xs mt-1.5 font-medium">
                  Difference:{' '}
                  <span className={difference < 0 ? 'text-red-600' : difference > 0 ? 'text-emerald-600' : 'text-slate-500'}>
                    {difference > 0 ? `+${difference}` : difference}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors"
            >
              <option value="correction">Correction</option>
              <option value="damage">Damage</option>
              <option value="theft">Theft</option>
              <option value="found">Found</option>
            </select>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isSubmitting ? 'Applying...' : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================================
// Stock Adjustments Page
// =====================================================================

export default function StockAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchAdjustments = useCallback(() => {
    setLoading(true);
    setError(null);
    api.operations.list({ operation_type: 'adjustment' })
      .then(data => setAdjustments(data))
      .catch(() => setError("Failed to load adjustments"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAdjustments(); }, [fetchAdjustments]);

  const skeletonRows = Array.from({ length: 4 }, (_, i) => (
    <tr key={`skel-${i}`}>
      <td className="px-6 py-5"><div className="space-y-1"><div className="h-4 w-28 bg-slate-200 rounded animate-pulse" /><div className="h-3 w-20 bg-slate-100 rounded animate-pulse" /></div></td>
      <td className="px-6 py-5"><div className="h-4 w-32 bg-slate-200 rounded animate-pulse" /></td>
      <td className="px-6 py-5"><div className="h-4 w-12 bg-slate-200 rounded animate-pulse" /></td>
      <td className="px-6 py-5"><div className="h-4 w-12 bg-slate-200 rounded animate-pulse" /></td>
      <td className="px-6 py-5"><div className="h-4 w-10 bg-slate-200 rounded animate-pulse" /></td>
      <td className="px-6 py-5"><div className="h-4 w-14 bg-slate-200 rounded animate-pulse" /></td>
    </tr>
  ));

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0"><Box className="w-5 h-5 text-white" /></div>
          <span className="text-xl font-bold text-white tracking-tight">Core Inventory</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 space-y-1 px-4 custom-scrollbar">
          <div className="mb-4"><Link href="/" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><Home className="w-5 h-5" /><span>Dashboard</span></Link></div>
          <div className="mb-4"><p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Inventory</p><Link href="/products" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><Menu className="w-5 h-5" /><span>Products</span></Link></div>
          <div className="mb-4">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Operations</p>
            <div className="space-y-1">
              <Link href="/receipts" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><ArrowDownUp className="w-5 h-5" /><span>Receipts</span></Link>
              <Link href="/delivery" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><ClipboardList className="w-5 h-5" /><span>Delivery</span></Link>
              <Link href="/adjustments" className="flex items-center space-x-3 bg-blue-600/10 text-blue-400 px-4 py-2.5 rounded-lg font-medium transition-all"><Sliders className="w-5 h-5" /><span>Adjustments</span></Link>
              <Link href="/move-history" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><Clock className="w-5 h-5" /><span>Move History</span></Link>
            </div>
          </div>
          <div className="mb-4"><p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Configuration</p><Link href="/warehouse" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><Building2 className="w-5 h-5" /><span>Warehouse</span></Link></div>
        </nav>
        <div className="p-6 border-t border-slate-800 shrink-0"><div className="flex items-center space-x-3"><div className="w-10 h-10 rounded-full bg-slate-700 shrink-0"></div><div className="overflow-hidden"><p className="text-sm font-medium text-white truncate">Admin User</p><p className="text-xs text-slate-500 truncate">Inventory Manager</p></div></div></div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <header className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Stock Adjustments</h1>
              <p className="text-slate-500 text-sm">Reconcile physical stock counts with system records.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-64 hidden sm:block">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Search className="w-4 h-4 text-slate-400" /></span>
                <input type="text" placeholder="Search adjustments..." className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-colors" />
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                New Adjustment
              </button>
            </div>
          </header>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto font-sans">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">PRODUCT</th>
                    <th className="px-6 py-4">LOCATION</th>
                    <th className="px-6 py-4">REFERENCE</th>
                    <th className="px-6 py-4 text-center">PHYSICAL COUNT</th>
                    <th className="px-6 py-4">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? skeletonRows : adjustments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        No adjustments found. Click &quot;New Adjustment&quot; to create one.
                      </td>
                    </tr>
                  ) : adjustments.map(op => {
                    const isDone = op.status === 'done';

                    return (
                      <tr key={op.id} className={`${isDone ? 'bg-slate-50/50' : 'hover:bg-slate-50/50'} transition-colors group`}>
                        <td className="px-6 py-5">
                          {op.lines.length > 0 ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{op.lines[0].product_name}</span>
                              <span className="text-xs text-slate-500 font-medium mt-0.5">[{op.lines[0].product_sku}]</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">\u2014</span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-slate-600">{op.source_location_name || "\u2014"}</td>
                        <td className="px-6 py-5 font-bold text-slate-900">{op.reference}</td>
                        <td className="px-6 py-5 text-center">
                          {op.lines.length > 0 ? (
                            <span className="font-bold text-slate-900">{op.lines[0].received_qty}</span>
                          ) : '\u2014'}
                        </td>
                        <td className="px-6 py-5">
                          {isDone ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold text-sm">
                              Applied <Check className="w-4 h-4" />
                            </span>
                          ) : (
                            <StatusBadge status={op.status} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Create Adjustment Modal */}
      <CreateAdjustmentModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={fetchAdjustments}
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
