"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Box, Home, Menu, ArrowDownUp, ClipboardList, Sliders, Clock, Building2, Search, Plus, X
} from 'lucide-react';
import { api, Location as LocationType, Warehouse as WarehouseType } from '@/lib/api';

export default function WarehouseConfigPage() {
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newShortCode, setNewShortCode] = useState('');
  const [newWarehouse, setNewWarehouse] = useState<number | ''>('');

  useEffect(() => {
    Promise.all([api.locations.list(), api.warehouses.list()]).then(([locs, whs]) => {
      setLocations(locs);
      setWarehouses(whs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleAddLocation = async () => {
    if (!newName || !newShortCode || !newWarehouse) return;
    try {
      const created = await api.locations.create({ name: newName, short_code: newShortCode, warehouse: newWarehouse as number, location_type: 'internal', status: 'active' });
      setLocations([...locations, created]);
      setIsModalOpen(false);
      setNewName('');
      setNewShortCode('');
      setNewWarehouse('');
    } catch {
      alert("Failed to create location.");
    }
  };

  const getTypeLabel = (t: string) => {
    const labels: Record<string, string> = { internal: 'Internal', vendor: 'Vendor', customer: 'Customer', transit: 'Transit' };
    return labels[t] || t;
  };

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
              <Link href="/adjustments" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><Sliders className="w-5 h-5" /><span>Adjustments</span></Link>
              <Link href="/move-history" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><Clock className="w-5 h-5" /><span>Move History</span></Link>
            </div>
          </div>
          <div className="mb-4"><p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Configuration</p><Link href="/warehouse" className="flex items-center space-x-3 bg-blue-600/10 text-blue-400 px-4 py-2.5 rounded-lg font-medium transition-all"><Building2 className="w-5 h-5" /><span>Warehouse</span></Link></div>
        </nav>
        <div className="p-6 border-t border-slate-800 shrink-0"><div className="flex items-center space-x-3"><div className="w-10 h-10 rounded-full bg-slate-700 shrink-0"></div><div className="overflow-hidden"><p className="text-sm font-medium text-white truncate">Admin User</p><p className="text-xs text-slate-500 truncate">Inventory Manager</p></div></div></div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <header className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Warehouse & Locations</h1>
              <p className="text-slate-500 text-sm">Manage warehouse locations and zones.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-64 hidden sm:block">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Search className="w-4 h-4 text-slate-400" /></span>
                <input type="text" placeholder="Search locations..." className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-colors" />
              </div>
              <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm shrink-0"><Plus className="w-4 h-4" />Add Location</button>
            </div>
          </header>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto font-sans">
              {loading ? (
                <div className="p-12 text-center text-slate-400">Loading locations...</div>
              ) : (
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
                  {locations.map((loc) => (
                    <tr key={loc.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <span className="text-blue-600 font-bold">[{loc.short_code}]</span>
                        <span className="ml-2 font-medium text-slate-900">{loc.name}</span>
                      </td>
                      <td className="px-6 py-5 text-slate-600">{getTypeLabel(loc.location_type)}</td>
                      <td className="px-6 py-5 text-slate-600">[{loc.warehouse_code}] {loc.warehouse_name}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${loc.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {loc.status === 'active' ? 'Active' : 'Archived'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          </div>
        </div>

        {/* Add Location Modal */}
        {isModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden font-sans">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Add New Location</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Warehouse A / Rack 1" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Short Code</label>
                  <input type="text" value={newShortCode} onChange={(e) => setNewShortCode(e.target.value)} placeholder="e.g. A101" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse</label>
                  <select value={newWarehouse} onChange={(e) => setNewWarehouse(Number(e.target.value))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value="">Select warehouse...</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>[{wh.code}] {wh.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleAddLocation} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors">Create</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }`}} />
    </div>
  );
}
