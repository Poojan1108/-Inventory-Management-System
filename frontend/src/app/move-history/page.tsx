"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Box, Home, Menu, ArrowDownUp, ClipboardList, Sliders, Clock, Building2, Search, List, LayoutGrid
} from 'lucide-react';
import { api, StockMove } from '@/lib/api';

const StatusBadge = ({ status }: { status: string }) => {
  const s = status.toUpperCase();
  const styles: Record<string, string> = {
    'READY': 'bg-blue-100 text-blue-700',
    'WAITING': 'bg-amber-100 text-amber-700',
    'DONE': 'bg-emerald-100 text-emerald-700',
    'DRAFT': 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${styles[s] || 'bg-slate-100 text-slate-500'}`}>{s}</span>
  );
};

export default function MoveHistoryPage() {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.stockMoves.list().then(data => {
      setMoves(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

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
              <Link href="/move-history" className="flex items-center space-x-3 bg-blue-600/10 text-blue-400 px-4 py-2.5 rounded-lg font-medium transition-all"><Clock className="w-5 h-5" /><span>Move History</span></Link>
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
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Move History</h1>
              <p className="text-slate-500 text-sm">Full audit trail of all inventory movements between locations.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-200 p-1 rounded-lg">
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><List className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><LayoutGrid className="w-4 h-4" /></button>
              </div>
              <div className="relative w-64 hidden sm:block">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Search className="w-4 h-4 text-slate-400" /></span>
                <input type="text" placeholder="Search by reference or contact..." className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 text-sm font-sans outline-none transition-colors" />
              </div>
            </div>
          </header>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center bg-white">
              <button className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-sm">NEW</button>
            </div>
            <div className="overflow-x-auto font-sans">
              {loading ? (
                <div className="p-12 text-center text-slate-400">Loading move history...</div>
              ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">REFERENCE</th>
                    <th className="px-6 py-4">DATE</th>
                    <th className="px-6 py-4">CONTACT</th>
                    <th className="px-6 py-4">FROM</th>
                    <th className="px-6 py-4">TO</th>
                    <th className="px-6 py-4">QUANTITY</th>
                    <th className="px-6 py-4">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {moves.map((move) => {
                    const isIN = move.reference.startsWith('WH/IN');
                    const moveTextColor = isIN ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold';
                    const moveBgColor = isIN ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-rose-50 hover:bg-rose-100';
                    return (
                      <tr key={move.id} className={`${moveBgColor} transition-colors group`}>
                        <td className={`px-6 py-5 ${moveTextColor}`}>
                          <div className="flex flex-col">
                            <span>{move.reference}</span>
                            <span className="text-xs text-slate-500 font-normal mt-0.5 tracking-wide">{move.product_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-slate-600 font-medium">{move.date}</td>
                        <td className="px-6 py-5 text-slate-600">{move.contact_name}</td>
                        <td className="px-6 py-5 text-slate-600">{move.from_location}</td>
                        <td className="px-6 py-5 text-slate-600">{move.to_location}</td>
                        <td className="px-6 py-5 font-bold text-slate-800">{move.quantity} pcs</td>
                        <td className="px-6 py-5"><StatusBadge status={move.status} /></td>
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

      <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }`}} />
    </div>
  );
}
