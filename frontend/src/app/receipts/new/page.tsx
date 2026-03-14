"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Box,
  Home,
  Menu,
  ArrowDownUp,
  ClipboardList,
  Sliders,
  Clock,
  Building2,
  Trash2,
  Plus
} from 'lucide-react';

interface ReceiptLine {
  id: number;
  product: string;
  expectedQty: number;
  uom: string;
}

export default function CreateReceiptPage() {
  const router = useRouter();
  const [lines, setLines] = useState<ReceiptLine[]>([
    { id: 1, product: 'Ergonomic Desk (SKU-001)', expectedQty: 0, uom: 'pcs' }
  ]);

  const handleAddLine = () => {
    setLines([...lines, { id: Date.now(), product: '', expectedQty: 0, uom: 'pcs' }]);
  };

  const handleRemoveLine = (id: number) => {
    setLines(lines.filter(line => line.id !== id));
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
            <Link href="/products" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all">
              <Menu className="w-5 h-5" />
              <span>Products</span>
            </Link>
          </div>

          <div className="mb-4">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Operations</p>
            <div className="space-y-1">
              <Link href="/receipts" className="flex items-center space-x-3 bg-blue-600/10 text-blue-400 px-4 py-2.5 rounded-lg font-medium transition-all">
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
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar p-8 bg-slate-50 relative">
        <div className="max-w-5xl mx-auto w-full">
          
          {/* Header & Workflow Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold text-slate-900">New Receipt</h1>
            
            <div className="flex items-center gap-6">
              {/* Status Indicator */}
              <div className="hidden sm:flex items-center text-sm font-medium bg-white px-4 py-2 rounded-lg border border-slate-200">
                <span className="text-slate-900 font-bold">Draft</span>
                <span className="text-slate-300 px-2">{`>`}</span>
                <span className="text-slate-400">Waiting</span>
                <span className="text-slate-300 px-2">{`>`}</span>
                <span className="text-slate-400">Ready</span>
                <span className="text-slate-300 px-2">{`>`}</span>
                <span className="text-slate-400">Done</span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3 mb-8">
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors">
              Confirm Order
            </button>
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg shadow-sm transition-colors">
              Save Draft
            </button>
            <button 
              onClick={() => router.push('/receipts')}
              className="px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors ml-auto"
            >
              Cancel
            </button>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            {/* General Information */}
            <div className="p-8 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Column 1 */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Vendor
                  </label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                    <option value="">Select a vendor...</option>
                    <option value="1">TechSupplies Inc.</option>
                    <option value="2">Furniture World</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Source Document
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g., PO-2026-006" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Destination Location
                  </label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                    <option value="">Select destination...</option>
                    <option value="1">[A101] Warehouse A / Rack 1</option>
                    <option value="2">[B-BLK] Warehouse B / Bulky</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Scheduled Date
                  </label>
                  <input 
                    type="date" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Product Lines Table */}
            <div className="p-8 bg-slate-50/30">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
                Operations
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="pb-3 px-2">PRODUCT</th>
                      <th className="pb-3 px-2 w-32">EXPECTED QTY</th>
                      <th className="pb-3 px-2 w-24">UoM</th>
                      <th className="pb-3 px-2 w-16 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map((line, index) => (
                      <tr key={line.id} className="group">
                        <td className="py-3 px-2">
                          <select className="w-full max-w-sm border border-slate-200 rounded-md py-1.5 px-2 text-sm font-medium text-slate-900 focus:ring-blue-500 outline-none bg-white">
                            <option value="">Select product...</option>
                            <option value="1" selected={line.product === 'Ergonomic Desk (SKU-001)'}>[SKU-001] Ergonomic Desk</option>
                            <option value="2">[KEY042] Mechanical Keyboard</option>
                          </select>
                        </td>
                        <td className="py-3 px-2">
                          <input 
                            type="number" 
                            className="w-full border border-slate-200 rounded-md py-1.5 px-3 text-sm font-bold text-slate-900 focus:ring-blue-500 outline-none" 
                            placeholder="0"
                            defaultValue={line.expectedQty || ''}
                            min="0"
                          />
                        </td>
                        <td className="py-3 px-2 text-slate-600 font-medium">
                          {line.uom}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button 
                            onClick={() => handleRemoveLine(line.id)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Remove Line"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 px-2">
                <button 
                  onClick={handleAddLine}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Line
                </button>
              </div>
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
