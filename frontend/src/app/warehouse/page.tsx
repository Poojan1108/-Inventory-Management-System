"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Logo from '@/components/Logo';
import Link from 'next/link';
import {
  Box, Home, Menu, ArrowDownUp, ClipboardList, Sliders, Clock, Building2, Search, Plus, X, LogOut, MapPin
} from 'lucide-react';
import { api, Location as LocationType, Warehouse as WarehouseType, ApiError } from '@/lib/api';

// =====================================================================
// Create Warehouse Modal
// =====================================================================

interface CreateWarehouseModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreateWarehouseModal({ open, onClose, onCreated }: CreateWarehouseModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setName('');
    setCode('');
    setAddress('');
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
      await api.warehouses.create({ name, code, address });
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
        setFieldErrors({ non_field_errors: 'Failed to create warehouse. Please try again.' });
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
          <h2 className="text-lg font-bold text-slate-900">Add New Warehouse</h2>
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
              placeholder="e.g. Main Distribution Center"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {fieldErrors.name && <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Short Code *</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. WH1"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono"
            />
            {fieldErrors.code && <p className="text-red-600 text-xs mt-1">{fieldErrors.code}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Logistics Blvd, Suite 4"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {fieldErrors.address && <p className="text-red-600 text-xs mt-1">{fieldErrors.address}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Warehouse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================================
// Create Location Modal
// =====================================================================

interface CreateLocationModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  warehouses: WarehouseType[];
}

function CreateLocationModal({ open, onClose, onCreated, warehouses }: CreateLocationModalProps) {
  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [locationType, setLocationType] = useState('internal');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setName('');
    setShortCode('');
    setWarehouseId('');
    setLocationType('internal');
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
      await api.locations.create({
        name,
        short_code: shortCode,
        warehouse: warehouseId ? Number(warehouseId) : undefined,
        location_type: locationType,
        status: 'active',
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
        setFieldErrors({ non_field_errors: 'Failed to create location. Please try again.' });
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
          <h2 className="text-lg font-bold text-slate-900">Add New Location</h2>
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
              placeholder="e.g. Warehouse A / Rack 1"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {fieldErrors.name && <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Short Code *</label>
            <input
              type="text"
              required
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value)}
              placeholder="e.g. A101"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {fieldErrors.short_code && <p className="text-red-600 text-xs mt-1">{fieldErrors.short_code}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse *</label>
              <select
                required
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors"
              >
                <option value="">Select warehouse...</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>[{wh.code}] {wh.name}</option>
                ))}
              </select>
              {fieldErrors.warehouse && <p className="text-red-600 text-xs mt-1">{fieldErrors.warehouse}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location Type</label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors"
              >
                <option value="internal">Internal</option>
                <option value="vendor">Vendor</option>
                <option value="customer">Customer</option>
                <option value="loss">Loss</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================================
// Warehouse & Locations Page
// =====================================================================

type Tab = 'warehouses' | 'locations';

const TYPE_LABELS: Record<string, string> = {
  internal: 'Internal',
  vendor: 'Vendor',
  customer: 'Customer',
  loss: 'Loss',
};

export default function WarehouseConfigPage() {
  const [tab, setTab] = useState<Tab>('warehouses');

  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showWhModal, setShowWhModal] = useState(false);
  const [showLocModal, setShowLocModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const fetchWarehouses = useCallback(() => {
    return api.warehouses.list().then(setWarehouses);
  }, []);

  const fetchLocations = useCallback(() => {
    return api.locations.list().then(setLocations);
  }, []);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchWarehouses(), fetchLocations()])
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  }, [fetchWarehouses, fetchLocations]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // After creating a warehouse, refresh warehouses so the location modal dropdown is up-to-date
  const handleWarehouseCreated = () => {
    fetchWarehouses().catch(() => {});
  };

  const handleLocationCreated = () => {
    fetchLocations().catch(() => {});
  };

  // Filtered data
  const q = searchQuery.toLowerCase();
  const filteredWarehouses = warehouses.filter(
    (wh) => wh.name.toLowerCase().includes(q) || wh.code.toLowerCase().includes(q) || wh.address.toLowerCase().includes(q)
  );
  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(q) ||
      loc.short_code.toLowerCase().includes(q) ||
      loc.warehouse_name.toLowerCase().includes(q)
  );

  // Skeleton rows
  const skeletonRows = (cols: number) =>
    Array.from({ length: 4 }, (_, i) => (
      <tr key={`skel-${i}`}>
        {Array.from({ length: cols }, (__, j) => (
          <td key={j} className="px-6 py-5">
            <div className="h-4 bg-slate-200 rounded animate-pulse" style={{ width: `${60 + Math.random() * 60}px` }} />
          </td>
        ))}
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
          <div className="mb-4"><p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Inventory</p><Link href="/products" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><Menu className="w-5 h-5" /><span>Products</span></Link></div>
          <div className="mb-4">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Operations</p>
            <div className="space-y-1">
              <Link href="/receipts" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><ArrowDownUp className="w-5 h-5" /><span>Receipts</span></Link>
              <Link href="/delivery" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><ClipboardList className="w-5 h-5" /><span>Delivery</span></Link>
              <Link href="/adjustments" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><Sliders className="w-5 h-5" /><span>Adjustments</span></Link>
              <Link href="/move-history" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><Clock className="w-5 h-5" /><span>Move History</span></Link>
            </div>
          </div>
          <div className="mb-4"><p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Configuration</p><Link href="/warehouse" className="flex items-center space-x-3 bg-blue-600/10 text-blue-400 px-4 py-2.5 rounded-lg font-medium transition-all"><Building2 className="w-5 h-5" /><span>Warehouse</span></Link></div>
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {/* Header */}
          <header className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Warehouse & Locations</h1>
              <p className="text-slate-500 text-sm">Manage warehouses, locations, and zones.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-56 hidden sm:block">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Search className="w-4 h-4 text-slate-400" /></span>
                <input
                  type="text"
                  placeholder={tab === 'warehouses' ? 'Search warehouses...' : 'Search locations...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-colors"
                />
              </div>
              <button
                onClick={() => setShowWhModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Warehouse
              </button>
              <button
                onClick={() => setShowLocModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Location
              </button>
            </div>
          </header>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 border-b border-slate-200">
            <button
              onClick={() => { setTab('warehouses'); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === 'warehouses'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Warehouses
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                tab === 'warehouses' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {warehouses.length}
              </span>
            </button>
            <button
              onClick={() => { setTab('locations'); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === 'locations'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Locations
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                tab === 'locations' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {locations.length}
              </span>
            </button>
          </div>

          {/* Warehouses Tab */}
          {tab === 'warehouses' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto font-sans">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">CODE</th>
                      <th className="px-6 py-4">WAREHOUSE NAME</th>
                      <th className="px-6 py-4">ADDRESS</th>
                      <th className="px-6 py-4">LOCATIONS</th>
                      <th className="px-6 py-4">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? skeletonRows(5) : filteredWarehouses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          {searchQuery
                            ? 'No warehouses match your search.'
                            : 'No warehouses found. Click "Add Warehouse" to create one.'}
                        </td>
                      </tr>
                    ) : filteredWarehouses.map((wh) => {
                      const locCount = locations.filter((l) => l.warehouse === wh.id).length;
                      return (
                        <tr key={wh.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-5">
                            <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">{wh.code}</span>
                          </td>
                          <td className="px-6 py-5 font-medium text-slate-900">{wh.name}</td>
                          <td className="px-6 py-5 text-slate-600">{wh.address || <span className="text-slate-300 italic">No address</span>}</td>
                          <td className="px-6 py-5">
                            <span className="text-slate-600">{locCount} location{locCount !== 1 ? 's' : ''}</span>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                              wh.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {wh.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Locations Tab */}
          {tab === 'locations' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto font-sans">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">LOCATION NAME</th>
                      <th className="px-6 py-4">TYPE</th>
                      <th className="px-6 py-4">WAREHOUSE</th>
                      <th className="px-6 py-4">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? skeletonRows(4) : filteredLocations.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                          {searchQuery
                            ? 'No locations match your search.'
                            : 'No locations found. Click "Add Location" to create one.'}
                        </td>
                      </tr>
                    ) : filteredLocations.map((loc) => (
                      <tr key={loc.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <span className="text-blue-600 font-bold">[{loc.short_code}]</span>
                          <span className="ml-2 font-medium text-slate-900">{loc.name}</span>
                        </td>
                        <td className="px-6 py-5 text-slate-600">{TYPE_LABELS[loc.location_type] || loc.location_type}</td>
                        <td className="px-6 py-5 text-slate-600">[{loc.warehouse_code}] {loc.warehouse_name}</td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                            loc.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {loc.status === 'active' ? 'Active' : 'Archived'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <CreateWarehouseModal
        open={showWhModal}
        onClose={() => setShowWhModal(false)}
        onCreated={handleWarehouseCreated}
      />
      <CreateLocationModal
        open={showLocModal}
        onClose={() => setShowLocModal(false)}
        onCreated={handleLocationCreated}
        warehouses={warehouses}
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
