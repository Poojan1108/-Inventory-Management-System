"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Box, Home, Menu, ArrowDownUp, ClipboardList, Sliders, Clock, Building2,
  Search, Plus, ArrowRight, Eye, X, Trash2, LogOut,
} from 'lucide-react';
import {
  api,
  Operation,
  Product,
  Contact,
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
// Create Contact Modal (inline)
// =====================================================================

interface CreateContactModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (contact: Contact) => void;
  defaultType: 'supplier' | 'customer';
}

function CreateContactModal({ open, onClose, onCreated, defaultType }: CreateContactModalProps) {
  const [name, setName] = useState('');
  const [contactType, setContactType] = useState<string>(defaultType);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setContactType(defaultType);
    setEmail('');
    setPhone('');
    setAddress('');
    setError('');
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const created = await api.contacts.create({
        name: name.trim(),
        contact_type: contactType,
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      onCreated(created);
      handleClose();
    } catch {
      setError('Failed to create contact. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">New Contact</h2>
          <button onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Acme Supplies"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
            <select
              value={contactType}
              onChange={e => setContactType(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              <option value="supplier">Supplier / Vendor</option>
              <option value="customer">Customer</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 234 567 890"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Street, City, Country"
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================================
// Create Receipt Modal
// =====================================================================

interface CreateReceiptModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface DraftLine {
  key: number;
  product: string;
  expected_qty: string;
}

function CreateReceiptModal({ open, onClose, onCreated }: CreateReceiptModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [reference, setReference] = useState('');
  const [contactId, setContactId] = useState<string>('');
  const [destinationId, setDestinationId] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([{ key: Date.now(), product: '', expected_qty: '' }]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      api.contacts.list(),
      api.locations.list(),
      api.products.list(),
    ]).then(([c, l, p]) => {
      setContacts(c);
      setLocations(l.filter(loc => loc.location_type === 'internal'));
      setProducts(p);
    }).catch(() => {});
  }, [open]);

  const resetForm = () => {
    setReference('');
    setContactId('');
    setDestinationId('');
    setScheduledDate('');
    setLines([{ key: Date.now(), product: '', expected_qty: '' }]);
    setFieldErrors({});
  };

  const handleClose = () => { resetForm(); onClose(); };

  const addLine = () => {
    setLines([...lines, { key: Date.now(), product: '', expected_qty: '' }]);
  };

  const removeLine = (key: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter(l => l.key !== key));
  };

  const updateLine = (key: number, field: keyof DraftLine, value: string) => {
    setLines(lines.map(l => l.key === key ? { ...l, [field]: value } : l));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    const validLines = lines
      .filter(l => l.product && Number(l.expected_qty) > 0)
      .map(l => ({ product: Number(l.product), expected_qty: Number(l.expected_qty) }));

    if (validLines.length === 0) {
      setFieldErrors({ lines: 'Add at least one product line with a quantity.' });
      setIsSubmitting(false);
      return;
    }

    try {
      await api.operations.create({
        reference,
        operation_type: 'receipt',
        contact: contactId ? Number(contactId) : null,
        destination_location: destinationId ? Number(destinationId) : null,
        scheduled_date: scheduledDate || null,
        status: 'draft',
        lines: validLines,
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
        setFieldErrors({ non_field_errors: 'Failed to create receipt. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-900">New Receipt</h2>
          <button onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
              placeholder="e.g. WH/IN/001"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {fieldErrors.reference && <p className="text-red-600 text-xs mt-1">{fieldErrors.reference}</p>}
          </div>

          {/* Vendor + Destination row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
              <div className="flex gap-2">
                <select
                  value={contactId}
                  onChange={e => setContactId(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors"
                >
                  <option value="">Select vendor...</option>
                  {contacts.filter(c => c.contact_type === 'supplier').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  {contacts.filter(c => c.contact_type === 'supplier').length === 0 && contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowContactModal(true)}
                  className="shrink-0 w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                  title="Create new vendor"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Destination Location</label>
              <select
                value={destinationId}
                onChange={e => setDestinationId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors"
              >
                <option value="">Select destination...</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>[{l.short_code}] {l.name}</option>
                ))}
              </select>
              {fieldErrors.destination_location && <p className="text-red-600 text-xs mt-1">{fieldErrors.destination_location}</p>}
            </div>
          </div>

          {/* Scheduled Date */}
          <div className="w-1/2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Date</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Lines */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Product Lines</label>
            {fieldErrors.lines && <p className="text-red-600 text-xs mb-2">{fieldErrors.lines}</p>}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-left w-28">Expected Qty</th>
                    <th className="px-3 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map(line => (
                    <tr key={line.key}>
                      <td className="px-3 py-2">
                        <select
                          value={line.product}
                          onChange={e => updateLine(line.key, 'product', e.target.value)}
                          className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                        >
                          <option value="">Select product...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          value={line.expected_qty}
                          onChange={e => updateLine(line.key, 'expected_qty', e.target.value)}
                          placeholder="0"
                          className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm font-bold outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(line.key)}
                          className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addLine}
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Line
            </button>
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
              {isSubmitting ? 'Creating...' : 'Create Receipt'}
            </button>
          </div>
        </form>
      </div>

      {/* Nested Contact Modal */}
      <CreateContactModal
        open={showContactModal}
        onClose={() => setShowContactModal(false)}
        defaultType="supplier"
        onCreated={(newContact) => {
          setContacts(prev => [...prev, newContact]);
          setContactId(String(newContact.id));
        }}
      />
    </div>
  );
}

// =====================================================================
// Receipts List Page
// =====================================================================

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const fetchReceipts = useCallback(() => {
    setLoading(true);
    setError(null);
    api.operations.list({ operation_type: 'receipt' })
      .then(data => setReceipts(data))
      .catch(() => setError("Failed to load receipts"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchReceipts(); }, [fetchReceipts]);

  const handleValidate = async (id: number) => {
    setValidatingId(id);
    try {
      await api.operations.validate(id);
      fetchReceipts();
    } catch (err) {
      const apiErr = err as ApiError;
      const msg = apiErr.body?.detail || 'Validation failed';
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setValidatingId(null);
    }
  };

  const getDateLabel = (dateStr: string | null) => {
    if (!dateStr) return "\u2014";
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff === -1) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const isPending = (s: string) => s === 'draft' || s === 'waiting' || s === 'ready';

  const skeletonRows = Array.from({ length: 4 }, (_, i) => (
    <tr key={`skel-${i}`}>
      <td className="px-6 py-5"><div className="h-4 w-24 bg-slate-200 rounded animate-pulse" /></td>
      <td className="px-6 py-5"><div className="h-4 w-28 bg-slate-200 rounded animate-pulse" /></td>
      <td className="px-6 py-5"><div className="h-4 w-32 bg-slate-200 rounded animate-pulse" /></td>
      <td className="px-6 py-5"><div className="h-4 w-20 bg-slate-200 rounded animate-pulse" /></td>
      <td className="px-6 py-5"><div className="h-4 w-14 bg-slate-200 rounded animate-pulse" /></td>
      <td className="px-6 py-5"><div className="h-4 w-16 bg-slate-200 rounded animate-pulse" /></td>
    </tr>
  ));

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden">
      {/* Sidebar */}
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
              <Link href="/receipts" className="flex items-center space-x-3 bg-blue-600/10 text-blue-400 px-4 py-2.5 rounded-lg font-medium transition-all"><ArrowDownUp className="w-5 h-5" /><span>Receipts</span></Link>
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
                <p className="text-sm font-medium text-white truncate">
                  {user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username : "User"}
                </p>
                <p className="text-xs text-slate-500 truncate capitalize">{user?.role || "Staff"}</p>
              </div>
            </div>
            <button onClick={handleLogout} title="Logout" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <header className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Receipts</h1>
              <p className="text-slate-500 text-sm">Process incoming shipments from vendors.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-64 hidden sm:block">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Search className="w-4 h-4 text-slate-400" /></span>
                <input
                  type="text"
                  placeholder="Search receipts..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-colors"
                />
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                Create Receipt
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
                <thead className="bg-white border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">REFERENCE</th>
                    <th className="px-6 py-4">VENDOR</th>
                    <th className="px-6 py-4">DESTINATION</th>
                    <th className="px-6 py-4">SCHEDULED DATE</th>
                    <th className="px-6 py-4">STATUS</th>
                    <th className="px-6 py-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? skeletonRows : (() => {
                    const q = searchQuery.toLowerCase();
                    const filtered = q
                      ? receipts.filter(r =>
                          r.reference.toLowerCase().includes(q) ||
                          (r.contact_name || '').toLowerCase().includes(q) ||
                          (r.destination_location_name || '').toLowerCase().includes(q) ||
                          r.status.toLowerCase().includes(q)
                        )
                      : receipts;

                    return filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        {searchQuery ? 'No receipts match your search.' : 'No receipts found. Click "Create Receipt" to add one.'}
                      </td>
                    </tr>
                  ) : filtered.map(receipt => (
                    <tr key={receipt.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5 font-bold text-slate-900">{receipt.reference}</td>
                      <td className="px-6 py-5 text-slate-600 font-medium">{receipt.contact_name || "\u2014"}</td>
                      <td className="px-6 py-5 text-slate-600">{receipt.destination_location_name || "\u2014"}</td>
                      <td className="px-6 py-5 text-slate-600">{getDateLabel(receipt.scheduled_date)}</td>
                      <td className="px-6 py-5"><StatusBadge status={receipt.status} /></td>
                      <td className="px-6 py-5 text-right">
                        {isPending(receipt.status) ? (
                          <button
                            onClick={() => handleValidate(receipt.id)}
                            disabled={validatingId === receipt.id}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors disabled:opacity-50"
                          >
                            {validatingId === receipt.id ? 'Processing...' : <>Validate <ArrowRight className="w-4 h-4 ml-0.5" /></>}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 text-sm">
                            <Eye className="w-4 h-4" /> View
                          </span>
                        )}
                      </td>
                    </tr>
                  ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Create Receipt Modal */}
      <CreateReceiptModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={fetchReceipts}
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
