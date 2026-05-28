export interface Breadcrumb {
  label: string;
  link?: string;
}

export interface StatItem {
  label: string;
  value: string | number;
  color?: 'success' | 'warning' | 'danger' | 'info' | 'primary';
  icon?: string;
}

export interface Product {
  id: number;
  sku?: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  supplierId: string;
  warehouseId: string;
  discount?: number;
}

export interface OrderItem {
  productId: number;
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  customer: string;
  customerName: string;
  status: 'Processing' | 'Pending' | 'Completed' | 'Shipped' | 'Cancelled';
  amount: number;
  totalAmount: number;
  date: string;
  priority: boolean;
  items: OrderItem[];
  createdBy?: 'Customer' | 'Admin';
}

export interface Customer {
  id: string;
  avatarUrl?: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  location?: string;
  status: 'Active' | 'Inactive';
  joinDate: string;
  segment: string;
  orders: number;
  spend: number;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  email?: string;
  phone: string;
  location: string;
  status: 'Active' | 'Inactive' | 'Critical' | 'Pending';
  reliability: number;
}

export interface WarehouseZone {
  id: string;
  name: string;
  description: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  utilization: number;
  totalCapacity: number;
  currentStock: number;
  manager?: string;
  lastAudit?: string;
  status: 'Active' | 'Inactive';
  zones: WarehouseZone[];
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number;
  category?: string;
  productId?: number;
  expiryDate: string;
  color: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  date: string;
  method: string;
  status: 'Pending' | 'Completed' | 'Failed';
  transactionId: string;
  reference: string;
  recipient: string;
}

export interface PurchaseOrderItem {
  productId: number;
  name: string;
  qty: number;
  price: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  status: 'Ordered' | 'Delivered' | 'Processing' | 'Cancelled';
  amount: number;
  date: string;
  items: PurchaseOrderItem[];
}

export interface StockMovement {
  id: string;
  productId: number;
  type: 'Transfer' | 'Arrival' | 'Departure' | 'Inbound' | 'Outbound';
  qty: number;
  fromLocation: string;
  toLocation: string;
  date: string;
  reason: string;
  user: string;
}
