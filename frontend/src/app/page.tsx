"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Box, Home, Menu, ArrowDownUp, ClipboardList, Sliders, Clock, Building2, Search, Bell, MoreVertical
} from 'lucide-react';
import { api, DashboardSummary } from '@/lib/api';

export default function InventoryDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    api.dashboard().then(data => setSummary(data)).catch(() => {});
  }, []);

  const kpi = summary || { total_products: 0, pending_receipts: 0, pending_deliveries: 0, late_receipts: 0, late_deliveries: 0 };

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
              <Link href="/receipts" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all">
                <ArrowDownUp className="w-5 h-5" />
                <span>Receipts</span>
              </Link>
              <Link href="/delivery" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all">
                <ClipboardList className="w-5 h-5" />
                <span>Delivery</span>
              </Link>
              <Link href="/adjustments" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all">
                <Sliders className="w-5 h-5" />
                <span>Adjustments</span>
              </Link>
              <Link href="/move-history" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all">
                <Clock className="w-5 h-5" />
                <span>Move History</span>
              </Link>
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
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 shrink-0"></div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-slate-500 truncate">Warehouse Lead</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-semibold text-slate-800 flex-1">Inventory Overview</h1>
          <div className="flex items-center space-x-6">
            <div className="relative w-64 hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="w-5 h-5 text-slate-400" />
              </span>
              <input type="text" placeholder="Search operations..." className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-colors" />
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 relative transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
          
          {/* Filter Bar */}
          <section className="flex flex-wrap gap-4">
            <select className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg px-4 py-2 min-w-[140px] focus:ring-blue-500 outline-none cursor-pointer">
              <option>Document Type</option>
              <option>Receipt</option>
              <option>Delivery</option>
              <option>Internal Move</option>
            </select>
            <select className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg px-4 py-2 min-w-[140px] focus:ring-blue-500 outline-none cursor-pointer">
              <option>Status</option>
              <option>Ready</option>
              <option>Waiting</option>
              <option>Late</option>
            </select>
            <select className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg px-4 py-2 min-w-[140px] focus:ring-blue-500 outline-none cursor-pointer">
              <option>Location</option>
              <option>North Wing</option>
              <option>South Sector</option>
            </select>
            <select className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg px-4 py-2 min-w-[140px] focus:ring-blue-500 outline-none cursor-pointer">
              <option>Product Category</option>
              <option>Electronics</option>
              <option>Furniture</option>
              <option>Supplies</option>
            </select>
          </section>

          {/* KPI Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm font-medium text-slate-500 mb-1">Total Products in Stock</p>
              <p className="text-3xl font-bold text-slate-900">{kpi.total_products}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm font-medium text-slate-500 mb-1">Pending Receipts</p>
              <p className="text-3xl font-bold text-slate-900">{kpi.pending_receipts}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm font-medium text-slate-500 mb-1">Pending Deliveries</p>
              <p className="text-3xl font-bold text-slate-900">{kpi.pending_deliveries}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm font-medium text-slate-500 mb-1">Low / Out of Stock Items</p>
              <p className="text-3xl font-bold text-red-600">0</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <p className="text-sm font-medium text-slate-500 mb-1">Internal Transfers Scheduled</p>
              <p className="text-3xl font-bold text-slate-900">0</p>
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
                  <span className="text-red-600">{kpi.late_receipts} LATE</span>
                  <span className="text-slate-400">|</span>
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
                  <span className="text-red-600">{kpi.late_deliveries} LATE</span>
                  <span className="text-slate-400">|</span>
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
