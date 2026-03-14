/**
 * API utility for connecting to the Django backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}/${endpoint}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    let body: Record<string, unknown> | null = null;
    try { body = await res.json(); } catch { /* empty */ }
    const err = new Error(`API error: ${res.status} ${res.statusText}`) as ApiError;
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return res.json();
}

export interface ApiError extends Error {
  status: number;
  body: Record<string, unknown> | null;
}

// ---- Typed helpers ----

export const api = {
  // Dashboard
  dashboard: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<DashboardSummary>(`dashboard/stats/${qs}`);
  },

  // Products
  products: {
    list: () => apiFetch<Product[]>("products/"),
    create: (data: CreateProductPayload) =>
      apiFetch<Product>("products/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Product>) =>
      apiFetch<Product>(`products/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  },

  // Product Categories
  categories: {
    list: () => apiFetch<ProductCategory[]>("categories/"),
    create: (data: { name: string; description?: string }) =>
      apiFetch<ProductCategory>("categories/", { method: "POST", body: JSON.stringify(data) }),
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

  // Operations (unified: receipt, delivery, internal, adjustment)
  operations: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return apiFetch<Operation[]>(`operations/${qs}`);
    },
    get: (id: number) => apiFetch<Operation>(`operations/${id}/`),
    create: (data: CreateOperationPayload) =>
      apiFetch<Operation>("operations/", { method: "POST", body: JSON.stringify(data) }),
    validate: (id: number) =>
      apiFetch<Operation>(`operations/${id}/validate_operation/`, { method: "POST" }),
  },

  // Stock Moves
  stockMoves: {
    list: () => apiFetch<StockMove[]>("stock-moves/"),
  },

  // Stock Quants (on-hand stock per product+location)
  stockQuants: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return apiFetch<StockQuant[]>(`stock-quants/${qs}`);
    },
  },

  // Contacts
  contacts: {
    list: () => apiFetch<Contact[]>("contacts/"),
    create: (data: { name: string; contact_type: string; email?: string; phone?: string; address?: string }) =>
      apiFetch<Contact>("contacts/", { method: "POST", body: JSON.stringify(data) }),
  },

  // Auth
  auth: {
    login: (data: LoginPayload) =>
      apiFetch<LoginResponse>("auth/login/", { method: "POST", body: JSON.stringify(data) }),
    signup: (data: SignupPayload) =>
      apiFetch<{ detail: string }>("auth/signup/", { method: "POST", body: JSON.stringify(data) }),
    requestOtp: (data: { email: string }) =>
      apiFetch<{ detail: string }>("auth/request-otp/", { method: "POST", body: JSON.stringify(data) }),
    verifyOtp: (data: { email: string; otp: string }) =>
      apiFetch<{ detail: string }>("auth/verify-otp/", { method: "POST", body: JSON.stringify(data) }),
    resetPassword: (data: { email: string; otp: string; new_password: string }) =>
      apiFetch<{ detail: string }>("auth/reset-password/", { method: "POST", body: JSON.stringify(data) }),
  },
};

// ---- Types ----

export interface DashboardSummary {
  total_in_stock: number;
  low_stock_items: number;
  pending_receipts: number;
  pending_deliveries: number;
  scheduled_transfers: number;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: number | null;
  category_name: string;
  uom: string;
  cost_price: string;
  reorder_minimum: number;
  is_active: boolean;
}

export interface ProductCategory {
  id: number;
  name: string;
  description: string;
}

export interface CreateProductPayload {
  name: string;
  sku: string;
  category?: number | null;
  uom?: string;
  cost_price?: number;
  reorder_minimum?: number;
  initial_stock?: number;
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

export interface StockQuant {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  location: number;
  location_name: string;
  quantity: number;
}

export interface Contact {
  id: number;
  name: string;
  contact_type: string;
  email: string;
  phone: string;
  address: string;
}

export interface OperationLine {
  id: number;
  operation: number;
  product: number;
  product_name: string;
  product_sku: string;
  expected_qty: number;
  received_qty: number;
  done_qty: number;
}

export interface Operation {
  id: number;
  reference: string;
  operation_type: string;
  contact: number | null;
  contact_name: string;
  source_location: number | null;
  source_location_name: string;
  destination_location: number | null;
  destination_location_name: string;
  scheduled_date: string | null;
  status: string;
  lines: OperationLine[];
}

export interface CreateOperationPayload {
  reference: string;
  operation_type: string;
  contact?: number | null;
  source_location?: number | null;
  destination_location?: number | null;
  scheduled_date?: string | null;
  status?: string;
  lines?: {
    product: number;
    expected_qty?: number;
    received_qty?: number;
  }[];
}

// ---- Auth Types ----

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
}
