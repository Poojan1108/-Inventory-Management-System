/**
 * API utility for connecting to the Django backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ---- Typed helpers ----

export const api = {
  // Dashboard
  dashboard: () => apiFetch<DashboardSummary>("dashboard/"),

  // Products
  products: {
    list: () => apiFetch<Product[]>("products/"),
    update: (id: number, data: Partial<Product>) =>
      apiFetch<Product>(`products/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  },

  // Warehouses & Locations
  warehouses: {
    list: () => apiFetch<Warehouse[]>("warehouses/"),
    create: (data: Partial<Warehouse>) =>
      apiFetch<Warehouse>("warehouses/", { method: "POST", body: JSON.stringify(data) }),
  },
  locations: {
    list: () => apiFetch<Location[]>("locations/"),
    create: (data: Partial<Location>) =>
      apiFetch<Location>("locations/", { method: "POST", body: JSON.stringify(data) }),
  },

  // Receipts
  receipts: {
    list: () => apiFetch<Receipt[]>("receipts/"),
    get: (id: number) => apiFetch<Receipt>(`receipts/${id}/`),
    validate: (id: number) =>
      apiFetch<Receipt>(`receipts/${id}/validate/`, { method: "POST" }),
  },
  receiptItems: {
    create: (data: Partial<ReceiptItem>) =>
      apiFetch<ReceiptItem>("receipt-items/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<ReceiptItem>) =>
      apiFetch<ReceiptItem>(`receipt-items/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  },

  // Delivery Orders
  deliveryOrders: {
    list: () => apiFetch<DeliveryOrder[]>("delivery-orders/"),
    get: (id: number) => apiFetch<DeliveryOrder>(`delivery-orders/${id}/`),
    validate: (id: number) =>
      apiFetch<DeliveryOrder>(`delivery-orders/${id}/validate/`, { method: "POST" }),
  },

  // Adjustments
  adjustments: {
    list: () => apiFetch<StockAdjustment[]>("adjustments/"),
    update: (id: number, data: Partial<StockAdjustment>) =>
      apiFetch<StockAdjustment>(`adjustments/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
    apply: (id: number) =>
      apiFetch<StockAdjustment>(`adjustments/${id}/apply/`, { method: "POST" }),
  },

  // Stock Moves
  stockMoves: {
    list: () => apiFetch<StockMove[]>("stock-moves/"),
  },

  // Contacts
  contacts: {
    list: () => apiFetch<Contact[]>("contacts/"),
  },
};

// ---- Types ----

export interface DashboardSummary {
  total_products: number;
  pending_receipts: number;
  pending_deliveries: number;
  late_receipts: number;
  late_deliveries: number;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: number | null;
  category_name: string;
  uom: number | null;
  uom_abbr: string;
  cost_price: string;
  reorder_minimum: number;
  is_active: boolean;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address: string;
  is_active: boolean;
}

export interface Location {
  id: number;
  name: string;
  short_code: string;
  warehouse: number;
  warehouse_name: string;
  warehouse_code: string;
  location_type: string;
  status: string;
}

export interface Receipt {
  id: number;
  reference: string;
  vendor: number | null;
  vendor_name: string;
  source_document: string;
  destination: number | null;
  destination_name: string;
  scheduled_date: string | null;
  status: string;
  items: ReceiptItem[];
}

export interface ReceiptItem {
  id: number;
  receipt: number;
  product: number;
  product_name: string;
  product_sku: string;
  expected_qty: number;
  received_qty: number;
}

export interface DeliveryOrder {
  id: number;
  reference: string;
  contact: number | null;
  contact_name: string;
  source_document: string;
  source_location: number | null;
  source_location_name: string;
  delivery_address: string;
  scheduled_date: string | null;
  status: string;
  items: DeliveryItem[];
}

export interface DeliveryItem {
  id: number;
  delivery_order: number;
  product: number;
  product_name: string;
  product_sku: string;
  ordered_qty: number;
  picked_qty: number;
}

export interface StockAdjustment {
  id: number;
  product: number;
  product_name: string;
  product_code: string;
  location: number | null;
  location_name: string;
  system_qty: number;
  physical_qty: number;
  difference: number;
  reason: string;
  status: string;
}

export interface StockMove {
  id: number;
  reference: string;
  product: number;
  product_name: string;
  contact: number | null;
  contact_name: string;
  from_location: string;
  to_location: string;
  quantity: number;
  date: string;
  status: string;
}

export interface Contact {
  id: number;
  name: string;
  contact_type: string;
  email: string;
  phone: string;
  address: string;
}
