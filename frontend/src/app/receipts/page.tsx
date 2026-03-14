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
  Plus,
  ArrowRight,
  Eye,
  X,
  Printer
} from 'lucide-react';
import { api, Receipt as ReceiptType, ReceiptItem as ReceiptItemType } from '@/lib/api';

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const s = status.toUpperCase();
  const styles: Record<string, string> = {
    'READY': 'bg-blue-100 text-blue-700',
    'WAITING': 'bg-amber-100 text-amber-700',
    'LATE': 'bg-red-100 text-red-700',
    'DONE': 'bg-emerald-100 text-emerald-700',
    'CANCELED': 'bg-slate-100 text-slate-500',
    'DRAFT': 'bg-slate-100 text-slate-600',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${styles[s] || 'bg-slate-100 text-slate-500'}`}>
      {s}
    </span>
  );
};

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptType[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptType | null>(null);
  const [receivedQty, setReceivedQty] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.receipts.list().then(data => {
      setReceipts(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleProcessClick = (receipt: ReceiptType) => {
    setSelectedReceipt(receipt);
    if (receipt.items.length > 0) {
      setReceivedQty(receipt.items[0].expected_qty);
    }
  };

  const handleValidate = async () => {
    if (!selectedReceipt) return;
    try {
      const updated = await api.receipts.validate(selectedReceipt.id);
      setReceipts(receipts.map(r => r.id === updated.id ? updated : r));
      setSelectedReceipt(null);
    } catch {
      alert("Validation failed!");
    }
  };

  const getScheduledDateLabel = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff === -1) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
          
          {/* Header */}
          <header className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Receipts</h1>
              <p className="text-slate-500 text-sm">Process incoming shipments from vendors.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-64 hidden sm:block">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="Search receipts..."
                  className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-colors"
                />
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm shrink-0">
                <Plus className="w-4 h-4" />
                Create Draft Receipt
              </button>
            </div>
          </header>

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto font-sans">
              {loading ? (
                <div className="p-12 text-center text-slate-400">Loading receipts...</div>
              ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">REFERENCE</th>
                    <th className="px-6 py-4">VENDOR</th>
                    <th className="px-6 py-4">SOURCE DOC</th>
                    <th className="px-6 py-4">DESTINATION</th>
                    <th className="px-6 py-4">SCHEDULED DATE</th>
                    <th className="px-6 py-4">STATUS</th>
                    <th className="px-6 py-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5 font-bold text-slate-900">{receipt.reference}</td>
                      <td className="px-6 py-5 text-slate-600 font-medium">{receipt.vendor_name}</td>
                      <td className="px-6 py-5 text-slate-600">{receipt.source_document}</td>
                      <td className="px-6 py-5 text-slate-600 group-hover:text-blue-600 transition-colors cursor-pointer">{receipt.destination_name}</td>
                      <td className="px-6 py-5 text-slate-600">{getScheduledDateLabel(receipt.scheduled_date)}</td>
                      <td className="px-6 py-5">
                        <StatusBadge status={receipt.status} />
                      </td>
                      <td className="px-6 py-5 text-right font-sans">
                        {receipt.status === 'done' || receipt.status === 'waiting' || receipt.status === 'canceled' ? (
                          <button className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 font-medium text-sm transition-colors cursor-pointer disabled:opacity-50">
                            View <Eye className="w-4 h-4 ml-0.5" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleProcessClick(receipt)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors cursor-pointer"
                          >
                            Process <ArrowRight className="w-4 h-4 ml-0.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          </div>
        </div>

        {/* Modal Overlay */}
        {selectedReceipt && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col font-sans">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Process Receipt: {selectedReceipt.reference}</h3>
                  <p className="text-sm text-slate-500 mt-1">Vendor: {selectedReceipt.vendor_name} • {selectedReceipt.destination_name}</p>
                </div>
                
                <div className="flex items-center gap-6">
                  {/* Status Stepper */}
                  <div className="hidden sm:flex items-center text-sm font-medium">
                    {['Draft', 'Waiting', 'Ready', 'Done'].map((step, idx, arr) => (
                      <React.Fragment key={step}>
                        <span className={`px-2 ${step.toLowerCase() === selectedReceipt.status ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                          {step}
                        </span>
                        {idx < arr.length - 1 && <span className="text-slate-300 px-1">{`>`}</span>}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Print Receipt">
                      <Printer className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setSelectedReceipt(null)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 bg-slate-50/50">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="pb-3">PRODUCT</th>
                      <th className="pb-3 text-center">EXPECTED</th>
                      <th className="pb-3 text-right">RECEIVED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedReceipt.items.map((item: ReceiptItemType, idx: number) => (
                      <tr key={idx}>
                        <td className="py-4 font-medium text-slate-900">[{item.product_sku}] {item.product_name}</td>
                        <td className="py-4 text-center text-slate-600 font-bold">{item.expected_qty}</td>
                        <td className="py-4 text-right">
                          <input 
                            type="number" 
                            className="w-24 text-right border border-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500 py-1.5 px-2 text-sm font-bold text-slate-900" 
                            value={receivedQty}
                            onChange={(e) => setReceivedQty(Number(e.target.value))}
                            min="0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4">
                  <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors inline-block cursor-pointer">
                    + Add Item
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-white">
                <div className="flex items-start mb-6">
                  <input 
                    id="backorder" 
                    type="checkbox" 
                    className="h-4 w-4 mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer" 
                  />
                  <div className="ml-3">
                    <label htmlFor="backorder" className="block text-sm font-medium text-slate-700 cursor-pointer">
                      Create backorder for remaining items?
                    </label>
                    <p className="text-xs text-slate-500 mt-0.5">Required if Received Qty is less than Expected Qty.</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-3">
                  <button 
                    onClick={() => setSelectedReceipt(null)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleValidate}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors"
                  >
                    VALIDATE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
