"use client";

import React, { useState, useEffect } from 'react';
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
  Edit3
} from 'lucide-react';
import { api, Product } from '@/lib/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    api.products.list().then(data => {
      setProducts(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleEditStart = (product: Product) => {
    setEditingId(product.id);
    setEditValue('0'); // Placeholder — on_hand comes from stock calculations
  };

  const handleEditSave = async (id: number) => {
    setEditingId(null);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden">
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
            <Link href="/" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all">
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
          </div>
          <div className="mb-4">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Inventory</p>
            <Link href="/products" className="flex items-center space-x-3 bg-blue-600/10 text-blue-400 px-4 py-2.5 rounded-lg font-medium transition-all">
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
              <p className="text-xs text-slate-500 truncate">Inventory Manager</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <header className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Stock</h1>
              <p className="text-slate-500 text-sm">Manage product inventory and stock levels.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-64 hidden sm:block">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="w-4 h-4 text-slate-400" />
                </span>
                <input type="text" placeholder="Search products..." className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-colors" />
              </div>
            </div>
          </header>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto font-sans">
              {loading ? (
                <div className="p-12 text-center text-slate-400">Loading products...</div>
              ) : (
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
                  {products.map((product) => (
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
                            <input
                              type="number"
                              className="w-20 border border-blue-300 rounded-md px-2 py-1 text-sm font-bold text-slate-900 focus:ring-blue-500 outline-none"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => handleEditSave(product.id)}
                              onKeyDown={(e) => e.key === 'Enter' && handleEditSave(product.id)}
                              autoFocus
                            />
                          ) : (
                            <>
                              <span className="font-bold text-slate-900">{product.reorder_minimum}</span>
                              <button onClick={() => handleEditStart(product)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-blue-600">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 font-medium text-slate-700">{product.reorder_minimum}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          </div>
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
