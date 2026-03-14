"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Box, Home, Menu, ArrowDownUp, ClipboardList, Sliders, Clock, Building2, Search, Bell, MoreVertical, LogOut
} from 'lucide-react';
import { api, DashboardSummary, Warehouse as WarehouseType, Location as LocationType, ProductCategory, Contact } from '@/lib/api';

export default function InventoryDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter data
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Filter selections
  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [contactId, setContactId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // Fetch filter dropdown data on mount
  useEffect(() => {
    api.warehouses.list().then(setWarehouses).catch(() => {});
    api.locations.list().then(setLocations).catch(() => {});
    api.categories.list().then(setCategories).catch(() => {});
    api.contacts.list().then(setContacts).catch(() => {});
  }, []);

  // Fetch dashboard stats whenever filters change
  const fetchDashboard = useCallback(() => {
    setLoading(true);
    setError(null);
    const params: Record<string, string> = {};
    if (locationId) params.location_id = locationId;
    else if (warehouseId) params.warehouse_id = warehouseId;
    if (categoryId) params.category_id = categoryId;
    if (contactId) params.contact_id = contactId;

    api.dashboard(Object.keys(params).length > 0 ? params : undefined)
      .then(data => setSummary(data))
      .catch(() => setError("Failed to load dashboard statistics"))
      .finally(() => setLoading(false));
  }, [warehouseId, locationId, categoryId, contactId]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // Filter locations by selected warehouse
  const filteredLocations = warehouseId
    ? locations.filter((l) => l.warehouse === Number(warehouseId))
    : locations;

  const kpi = summary || { total_in_stock: 0, low_stock_items: 0, pending_receipts: 0, pending_deliveries: 0, scheduled_transfers: 0 };

  // Handle search — navigate to the relevant page
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Box className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Core Inventory</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 space-y-1 px-4 custom-scrollbar">
          <div className="mb-4">
            <Link href="/" className="flex items-center space-x-3 bg-blue-600/10 text-blue-400 px-4 py-2.5 rounded-lg font-medium transition-all">
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
          </div>

          <div className="mb-4">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Inventory</p>
            <Link href="/products" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all">
              <Menu className="w-5 h-5" />
              <span>Products</span>
            </Link>
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
            <Link href="/warehouse" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all">
              <Building2 className="w-5 h-5" />
              <span>Warehouse</span>
            </Link>
          </div>
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-semibold text-slate-800 flex-1">Inventory Overview</h1>
          <div className="flex items-center space-x-6">
            <form onSubmit={handleSearch} className="relative w-64 hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="w-5 h-5 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-colors"
              />
            </form>
            <button className="p-2 text-slate-400 hover:text-slate-600 relative transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">

          {/* Filter Bar */}
          <section className="flex flex-wrap gap-4">
            <select
              value={warehouseId}
              onChange={(e) => { setWarehouseId(e.target.value); setLocationId(''); }}
              className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg px-4 py-2 min-w-[160px] focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>[{wh.code}] {wh.name}</option>
              ))}
            </select>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg px-4 py-2 min-w-[160px] focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="">All Locations</option>
              {filteredLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>[{loc.short_code}] {loc.name}</option>
              ))}
            </select>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg px-4 py-2 min-w-[160px] focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg px-4 py-2 min-w-[160px] focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="">All Contacts</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.contact_type})</option>
              ))}
            </select>
            {(warehouseId || locationId || categoryId || contactId) && (
              <button
                onClick={() => { setWarehouseId(''); setLocationId(''); setCategoryId(''); setContactId(''); }}
                className="text-sm text-slate-500 hover:text-red-600 px-3 py-2 transition-colors"
              >
                Clear filters
              </button>
            )}
          </section>

          {/* KPI Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {error && (
              <div className="col-span-full bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm font-medium text-slate-500 mb-1">Total Products in Stock</p>
              {loading
                ? <div className="h-9 w-20 bg-slate-200 rounded animate-pulse" />
                : <p className="text-3xl font-bold text-slate-900">{kpi.total_in_stock}</p>}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm font-medium text-slate-500 mb-1">Pending Receipts</p>
              {loading
                ? <div className="h-9 w-20 bg-slate-200 rounded animate-pulse" />
                : <p className="text-3xl font-bold text-slate-900">{kpi.pending_receipts}</p>}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm font-medium text-slate-500 mb-1">Pending Deliveries</p>
              {loading
                ? <div className="h-9 w-20 bg-slate-200 rounded animate-pulse" />
                : <p className="text-3xl font-bold text-slate-900">{kpi.pending_deliveries}</p>}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm font-medium text-slate-500 mb-1">Low Stock Alerts</p>
              {loading
                ? <div className="h-9 w-20 bg-slate-200 rounded animate-pulse" />
                : <p className="text-3xl font-bold text-red-600">{kpi.low_stock_items}</p>}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm font-medium text-slate-500 mb-1">Internal Transfers</p>
              {loading
                ? <div className="h-9 w-20 bg-slate-200 rounded animate-pulse" />
                : <p className="text-3xl font-bold text-slate-900">{kpi.scheduled_transfers}</p>}
            </div>
          </section>

          {/* Action Board (Kanban Cards) */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">

            {/* Receipts Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[300px]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800">Receipts</h3>
                <button className="text-blue-600 hover:text-blue-700 p-1 transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <Link href="/receipts" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-bold transition-colors shadow-lg shadow-blue-200">
                  {kpi.pending_receipts} to receive
                </Link>
                <div className="flex items-center space-x-4 text-sm font-bold tracking-wider">
                  <span className="text-slate-600">{kpi.pending_receipts} OPERATIONS</span>
                </div>
              </div>
            </div>

            {/* Delivery Orders Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[300px]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800">Delivery Orders</h3>
                <button className="text-blue-600 hover:text-blue-700 p-1 transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <Link href="/delivery" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-bold transition-colors shadow-lg shadow-blue-200">
                  {kpi.pending_deliveries} to Deliver
                </Link>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm font-bold tracking-wider">
                  <span className="text-slate-600">{kpi.pending_deliveries} OPERATIONS</span>
                </div>
              </div>
            </div>

          </section>

        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}
