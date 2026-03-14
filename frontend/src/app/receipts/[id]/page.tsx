"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Box,
  Home,
  Menu,
  ArrowDownUp,
  ClipboardList,
  Sliders,
  Clock,
  Building2,
  Plus
} from 'lucide-react';

export default function ReceiptDetailPage() {
  const params = useParams();
  const id = params?.id || '0001';

  // State for the stepper and logic
  const steps = ['Draft', 'Ready', 'Done'];
  const [currentStep, setCurrentStep] = useState('Ready');

  // State for the product lines
  const [productLines, setProductLines] = useState([
    { id: 1, product: '[DESK001] Desk', quantity: 10 }
  ]);

  const handleAddProduct = () => {
    setProductLines([
      ...productLines,
      { id: Date.now(), product: '', quantity: 1 }
    ]);
  };

  // Handle validate action
  const handleValidate = () => {
    setCurrentStep('Done');
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
              {/* ACTIVE HIGHLIGHTED STATE for Receipts */}
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
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar bg-slate-50 relative p-8">
        
        {/* Main Card Shell */}
        <div className="bg-white rounded-lg p-6 shadow-sm w-full max-w-6xl mx-auto border border-slate-200">
          
          {/* Header & Actions */}
          <header className="mb-6">
            {/* Top Row: Title */}
            <div className="flex items-center gap-4 mb-4">
              <button className="border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1 text-sm font-medium rounded transition-colors">
                New
              </button>
              <h1 className="text-2xl font-bold text-slate-900">Receipt</h1>
            </div>
            
            {/* Action Bar & Stepper */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                {/* To DO = When in Draft, Validate = When in Ready. */}
                {currentStep === 'Ready' && (
                  <button 
                    onClick={handleValidate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer"
                  >
                    Validate
                  </button>
                )}
                {currentStep === 'Draft' && (
                  <button 
                    onClick={() => setCurrentStep('Ready')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer"
                  >
                    To Do
                  </button>
                )}
                <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer">
                  Print
                </button>
                <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer">
                  Cancel
                </button>
              </div>

              {/* Status Stepper */}
              <div className="flex items-center text-sm">
                {steps.map((step, index) => {
                  const isActive = step === currentStep;
                  const isPast = steps.indexOf(step) < steps.indexOf(currentStep);
                  
                  return (
                    <React.Fragment key={step}>
                      <div className={`px-2 py-1 ${isActive ? 'font-bold text-slate-900' : isPast ? 'text-slate-500 font-medium' : 'text-slate-400'}`}>
                        {step}
                      </div>
                      {index < steps.length - 1 && (
                        <div className="text-slate-400 px-1">{`>`}</div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </header>

          {/* Form Data Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">WH/IN/{id}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {/* Column 1 */}
              <div className="space-y-6">
                <div className="flex items-center border-b border-slate-200 py-2">
                  <label className="w-1/3 text-sm font-medium text-slate-600">Receive From</label>
                  <input 
                    type="text" 
                    defaultValue="Vendor Name"
                    className="w-2/3 text-sm text-slate-900 bg-transparent outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center border-b border-slate-200 py-2">
                  <label className="w-1/3 text-sm font-medium text-slate-600">Responsible</label>
                  <input 
                    type="text" 
                    defaultValue="Admin User"
                    className="w-2/3 text-sm text-slate-900 bg-transparent outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-6">
                <div className="flex items-center border-b border-slate-200 py-2">
                  <label className="w-1/3 text-sm font-medium text-slate-600">Schedule Date</label>
                  <input 
                    type="date" 
                    className="w-2/3 text-sm text-slate-900 bg-transparent outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <hr className="mt-8 border-slate-200" />
          </div>

          {/* Products Table */}
          <div>
            <div className="flex items-center gap-6 text-sm font-medium text-slate-600 mb-2 px-2 border-b-2 border-slate-200 pb-2">
              <div className="w-3/4">Product</div>
              <div className="w-1/4">Quantity</div>
            </div>
            
            <div className="flex flex-col divide-y divide-slate-100">
              {productLines.map((line) => (
                <div key={line.id} className="flex items-center gap-6 text-sm py-3 px-2 hover:bg-slate-50 transition-colors">
                  <div className="w-3/4 text-slate-900 font-medium">
                    <input 
                      type="text" 
                      value={line.product}
                      onChange={(e) => {
                        setProductLines(productLines.map(p => 
                          p.id === line.id ? { ...p, product: e.target.value } : p
                        ));
                      }}
                      placeholder="Product Name"
                      className="w-full bg-transparent outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="w-1/4 text-slate-700">
                    <input 
                      type="number" 
                      value={line.quantity}
                      onChange={(e) => {
                        setProductLines(productLines.map(p => 
                          p.id === line.id ? { ...p, quantity: parseInt(e.target.value) || 0 } : p
                        ));
                      }}
                      className="w-full bg-transparent outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ))}
              
              {/* Add New Product Action */}
              <div className="py-3 px-2 border-b-2 border-slate-200">
                <button 
                  onClick={handleAddProduct}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add New Product
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
