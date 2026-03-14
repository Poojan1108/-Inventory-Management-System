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
  Printer,
  AlertCircle
} from 'lucide-react';
import { api, DeliveryOrder, DeliveryItem as DeliveryItemType } from '@/lib/api';

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

export default function DeliveryOrdersPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [currentProcessStep, setCurrentProcessStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.deliveryOrders.list().then(data => {
      setOrders(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const processSteps = ['PICK', 'PACK', 'VALIDATE'];

  const handleProcessClick = (order: DeliveryOrder) => {
    setSelectedOrder(order);
    setCurrentProcessStep(0);
  };

  const handleContinue = async () => {
    if (currentProcessStep < processSteps.length - 1) {
      setCurrentProcessStep(currentProcessStep + 1);
    } else if (selectedOrder) {
      try {
        const updated = await api.deliveryOrders.validate(selectedOrder.id);
        setOrders(orders.map(o => o.id === updated.id ? updated : o));
        setSelectedOrder(null);
        setCurrentProcessStep(0);
      } catch {
        alert("Validation failed!");
      }
    }
  };

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
              <Link href="/receipts" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><ArrowDownUp className="w-5 h-5" /><span>Receipts</span></Link>
              <Link href="/delivery" className="flex items-center space-x-3 bg-blue-600/10 text-blue-400 px-4 py-2.5 rounded-lg font-medium transition-all"><ClipboardList className="w-5 h-5" /><span>Delivery</span></Link>
              <Link href="/adjustments" className="flex items-center space-x-3 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-lg transition-all"><Sliders className="w-5 h-5" /><span>Adjustments</span></Link>
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
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Delivery Orders</h1>
              <p className="text-slate-500 text-sm">Manage outgoing shipments to customers.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-64 hidden sm:block">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Search className="w-4 h-4 text-slate-400" /></span>
                <input type="text" placeholder="Search deliveries..." className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-colors" />
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm shrink-0"><Plus className="w-4 h-4" />New Delivery</button>
            </div>
          </header>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto font-sans">
              {loading ? (
                <div className="p-12 text-center text-slate-400">Loading delivery orders...</div>
              ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">REFERENCE</th>
                    <th className="px-6 py-4">CONTACT</th>
                    <th className="px-6 py-4">FROM</th>
                    <th className="px-6 py-4">SCHEDULED DATE</th>
                    <th className="px-6 py-4">STATUS</th>
                    <th className="px-6 py-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5 font-bold text-slate-900">{order.reference}</td>
                      <td className="px-6 py-5 text-slate-600 font-medium">{order.contact_name}</td>
                      <td className="px-6 py-5 text-slate-600">{order.source_location_name}</td>
                      <td className="px-6 py-5 text-slate-600">{order.scheduled_date || '—'}</td>
                      <td className="px-6 py-5"><StatusBadge status={order.status} /></td>
                      <td className="px-6 py-5 text-right font-sans">
                        {order.status === 'done' || order.status === 'canceled' ? (
                          <button className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 font-medium text-sm transition-colors cursor-pointer">View <Eye className="w-4 h-4 ml-0.5" /></button>
                        ) : (
                          <button onClick={() => handleProcessClick(order)} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors cursor-pointer">Process <ArrowRight className="w-4 h-4 ml-0.5" /></button>
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

        {/* Process Delivery Modal */}
        {selectedOrder && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col font-sans max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Process Delivery: {selectedOrder.reference}</h3>
                  <p className="text-sm text-slate-500 mt-1">Contact: {selectedOrder.contact_name}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex items-center text-sm font-medium">
                    {['Draft', 'Waiting', 'Ready', 'Done'].map((step, idx, arr) => (
                      <React.Fragment key={step}>
                        <span className={`px-2 ${step.toLowerCase() === selectedOrder.status ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>{step}</span>
                        {idx < arr.length - 1 && <span className="text-slate-300 px-1">{`>`}</span>}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><Printer className="w-5 h-5" /></button>
                    <button onClick={() => { setSelectedOrder(null); setCurrentProcessStep(0); }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>

              {/* Form Context */}
              <div className="px-6 pt-4 pb-2 grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-400 text-xs uppercase">Delivery Address</span><p className="font-medium text-slate-700 mt-0.5">{selectedOrder.delivery_address}</p></div>
                <div><span className="text-slate-400 text-xs uppercase">Schedule Date</span><p className="font-medium text-slate-700 mt-0.5">{selectedOrder.scheduled_date || '—'}</p></div>
                <div><span className="text-slate-400 text-xs uppercase">Responsible</span><p className="font-medium text-slate-700 mt-0.5">Admin User</p></div>
                <div><span className="text-slate-400 text-xs uppercase">Operation Type</span><p className="font-medium text-slate-700 mt-0.5">Delivery</p></div>
              </div>

              {/* Stepper */}
              <div className="px-6 py-3 flex items-center gap-2">
                {processSteps.map((step, idx) => (
                  <React.Fragment key={step}>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${idx <= currentProcessStep ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <span>{idx + 1}</span>
                      <span>{step}</span>
                    </div>
                    {idx < processSteps.length - 1 && <div className={`flex-1 h-0.5 ${idx < currentProcessStep ? 'bg-blue-600' : 'bg-slate-200'}`}></div>}
                  </React.Fragment>
                ))}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                {currentProcessStep === 0 && (
                  <div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
                      Verify items picked from <strong>{selectedOrder.source_location_name || 'warehouse'}</strong>. Update quantities if any items are missing.
                    </div>
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="pb-3">PRODUCT</th>
                          <th className="pb-3 text-center">ORDERED</th>
                          <th className="pb-3 text-right">PICKED</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedOrder.items.map((item: DeliveryItemType) => {
                          const isOutOfStock = item.picked_qty < item.ordered_qty;
                          return (
                            <tr key={item.id} className={isOutOfStock ? 'bg-red-50' : ''}>
                              <td className="py-4 font-medium text-slate-900">
                                <div className="flex items-center gap-2">
                                  {isOutOfStock && <AlertCircle className="w-4 h-4 text-red-500" />}
                                  [{item.product_sku}] {item.product_name}
                                </div>
                              </td>
                              <td className="py-4 text-center text-slate-600 font-bold">{item.ordered_qty}</td>
                              <td className="py-4 text-right">
                                <input type="number" className="w-20 text-right border border-slate-200 rounded-md py-1.5 px-2 text-sm font-bold text-slate-900" defaultValue={item.picked_qty} min="0" />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="mt-4"><button className="text-sm font-semibold text-blue-600 hover:text-blue-700">+ Add New product</button></div>
                  </div>
                )}
                {currentProcessStep === 1 && (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-lg font-medium mb-2">Pack items for shipment</p>
                    <p className="text-sm">Verify packaging and prepare for dispatch.</p>
                  </div>
                )}
                {currentProcessStep === 2 && (
                  <div className="text-center py-12">
                    <p className="text-lg font-medium text-slate-700 mb-2">Ready to validate delivery</p>
                    <p className="text-sm text-slate-500">Click &quot;Confirm &amp; Validate&quot; to mark as done.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
                <button onClick={() => { setSelectedOrder(null); setCurrentProcessStep(0); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleContinue} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors">
                  {currentProcessStep < processSteps.length - 1 ? 'Continue' : 'Confirm & Validate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }`}} />
    </div>
  );
}
