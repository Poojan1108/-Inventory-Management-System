"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Box, Home, Menu, ArrowDownUp, ClipboardList, Sliders, Clock, Building2, Search, Plus, Upload, Check
} from 'lucide-react';
import { api, StockAdjustment } from '@/lib/api';

export default function StockAdjustmentsPage() {
  const [items, setItems] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adjustments.list().then(data => {
      setItems(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const updatePhysicalQty = async (id: number, val: string) => {
    const newQty = val === '' ? 0 : parseInt(val, 10);
    if (isNaN(newQty)) return;
    setItems(items.map(item => item.id === id ? { ...item, physical_qty: newQty, difference: newQty - item.system_qty } : item));
    api.adjustments.update(id, { physical_qty: newQty }).catch(() => {});
  };

  const updateReason = async (id: number, reason: string) => {
    setItems(items.map(item => item.id === id ? { ...item, reason } : item));
    api.adjustments.update(id, { reason }).catch(() => {});
  };

  const handleApply = async (id: number) => {
    try {
      const updated = await api.adjustments.apply(id);
      setItems(items.map(item => item.id === id ? updated : item));
    } catch {
      alert("Failed to apply adjustment.");
    }
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
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative w-64 hidden sm:block">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Search className="w-4 h-4 text-slate-400" /></span>
                <input type="text" placeholder="Search product or location..." className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 text-sm font-sans outline-none transition-colors" />
              </div>
              <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm shrink-0"><Upload className="w-4 h-4" />Bulk Import</button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm shrink-0"><Plus className="w-4 h-4" />New Adjustment</button>
            </div>
          </header>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto font-sans">
              {loading ? (
                <div className="p-12 text-center text-slate-400">Loading adjustments...</div>
              ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">PRODUCT</th>
                    <th className="px-6 py-4">LOCATION</th>
                    <th className="px-6 py-4">SYSTEM QTY</th>
                    <th className="px-6 py-4 w-40">PHYSICAL COUNT</th>
                    <th className="px-6 py-4 text-center">DIFFERENCE</th>
                    <th className="px-6 py-4">REASON</th>
                    <th className="px-6 py-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const diff = item.difference;
                    const diffText = diff > 0 ? `+${diff}` : diff.toString();
                    let diffColor = 'text-slate-500';
                    let diffBg = 'bg-transparent';
                    if (diff < 0) { diffColor = 'text-rose-700 font-bold'; diffBg = 'bg-rose-50 px-2 py-0.5 rounded'; }
                    else if (diff > 0) { diffColor = 'text-emerald-700 font-bold'; diffBg = 'bg-emerald-50 px-2 py-0.5 rounded'; }
                    const isApplied = item.status === 'applied';

                    return (
                      <tr key={item.id} className={`${isApplied ? 'bg-slate-50/50' : 'hover:bg-slate-50/50'} transition-colors group`}>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.product_name}</span>
                            <span className="text-xs text-slate-500 font-medium mt-0.5 tracking-wide">[{item.product_code}]</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-slate-600">{item.location_name}</td>
                        <td className="px-6 py-5 text-slate-600 font-medium">{item.system_qty} <span className="text-slate-400 text-xs font-normal">pcs</span></td>
                        <td className="px-6 py-5">
                          <input type="number" className={`w-24 text-right border ${isApplied ? 'border-transparent bg-transparent' : 'border-slate-200 bg-white hover:border-blue-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-bold text-slate-900 transition-all px-3 py-1.5 outline-none`} value={item.physical_qty} onChange={(e) => updatePhysicalQty(item.id, e.target.value)} disabled={isApplied} />
                        </td>
                        <td className="px-6 py-5 text-center"><span className={`${diffColor} ${diffBg} inline-block min-w-[40px] text-center`}>{diffText}</span></td>
                        <td className="px-6 py-5">
                          <select className={`border ${isApplied ? 'border-transparent bg-transparent text-slate-500' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'} rounded-md sm:text-sm font-medium transition-all px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`} value={item.reason} onChange={(e) => updateReason(item.id, e.target.value)} disabled={isApplied}>
                            <option value="correction">Correction</option>
                            <option value="damaged">Damaged</option>
                            <option value="lost">Lost</option>
                            <option value="theft">Theft</option>
                            <option value="found">Found</option>
                          </select>
                        </td>
                        <td className="px-6 py-5 text-right font-sans">
                          {isApplied ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold text-sm">Applied <Check className="w-4 h-4" /></span>
                          ) : (
                            <button onClick={() => handleApply(item.id)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded transition-colors shadow-sm disabled:opacity-50" disabled={diff === 0} title={diff === 0 ? "No difference to apply" : "Apply Adjustment"}>Apply</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              )}
            </div>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; } input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; } input[type=number] { -moz-appearance: textfield; }`}} />
    </div>
  );
}
