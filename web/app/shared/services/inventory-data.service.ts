import { Injectable, signal } from '@angular/core';
import type {
  Customer,
  Offer,
  Order,
  Payment,
  Product,
  PurchaseOrder,
  StockMovement,
  Supplier,
  Warehouse,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class InventoryDataService {
  loading = signal(false);
  baseUrl = 'http://localhost:3000/api';

  settings = signal({
    currency: 'USD',
    lowStockThreshold: 20,
    autoRefresh: true,
  });

  // State Signals
  private _products = signal<Product[]>([]);
  products = this._products.asReadonly();

  private _offers = signal<Offer[]>([]);
  offers = this._offers.asReadonly();

  private _orders = signal<Order[]>([]);
  orders = this._orders.asReadonly();

  private _customers = signal<Customer[]>([]);
  customers = this._customers.asReadonly();

  private _suppliers = signal<Supplier[]>([]);
  suppliers = this._suppliers.asReadonly();

  private _warehouses = signal<Warehouse[]>([]);
  warehouses = this._warehouses.asReadonly();

  private _purchaseOrders = signal<PurchaseOrder[]>([]);
  purchaseOrders = this._purchaseOrders.asReadonly();

  private _movements = signal<StockMovement[]>([]);
  movements = this._movements.asReadonly();

  private _payments = signal<Payment[]>([]);
  payments = this._payments.asReadonly();

  // State Update Methods
  setProducts(data: Product[]) {
    this._products.set(data);
  }
  setOffers(data: Offer[]) {
    this._offers.set(data);
  }
  setOrders(data: Order[]) {
    this._orders.set(data);
  }
  setCustomers(data: Customer[]) {
    this._customers.set(data);
  }
  setSuppliers(data: Supplier[]) {
    this._suppliers.set(data);
  }
  setWarehouses(data: Warehouse[]) {
    this._warehouses.set(data);
  }
  setPurchaseOrders(data: PurchaseOrder[]) {
    this._purchaseOrders.set(data);
  }
  setMovements(data: StockMovement[]) {
    this._movements.set(data);
  }
  setPayments(data: Payment[]) {
    this._payments.set(data);
  }

  // Partial Update Helpers (useful for keeping UI in sync after single mutations)
  updateProductInState(product: Product) {
    this._products.update((prev) => prev.map((p) => (p.id === product.id ? product : p)));
  }
  addProductToState(product: Product) {
    this._products.update((prev) => [...prev, product]);
  }
  updateOrderInState(order: Order) {
    this._orders.update((prev) => prev.map((o) => (o.id === order.id ? order : o)));
  }
  addOrderToState(order: Order) {
    this._orders.update((prev) => [...prev, order]);
  }
  updateSupplierInState(supplier: Supplier) {
    this._suppliers.update((prev) => prev.map((s) => (s.id === supplier.id ? supplier : s)));
  }
  addSupplierToState(supplier: Supplier) {
    this._suppliers.update((prev) => [...prev, supplier]);
  }
  updateCustomerInState(customer: Customer) {
    this._customers.update((prev) => prev.map((c) => (c.id === customer.id ? customer : c)));
  }
  addCustomerToState(customer: Customer) {
    this._customers.update((prev) => [...prev, customer]);
  }
  updateWarehouseInState(warehouse: Warehouse) {
    this._warehouses.update((prev) => prev.map((w) => (w.id === warehouse.id ? warehouse : w)));
  }
  addWarehouseToState(warehouse: Warehouse) {
    this._warehouses.update((prev) => [...prev, warehouse]);
  }
  updatePaymentInState(payment: Payment) {
    this._payments.update((prev) => prev.map((p) => (p.id === payment.id ? payment : p)));
  }
  addOfferToState(offer: Offer) {
    this._offers.update((prev) => [offer, ...prev]);
  }
  updateOfferInState(offer: Offer) {
    this._offers.update((prev) => prev.map((o) => (o.id === offer.id ? offer : o)));
  }
  removeOfferFromState(id: string) {
    this._offers.update((prev) => prev.filter((o) => o.id !== id));
  }
  addPaymentToState(payment: Payment) {
    this._payments.update((prev) => [...prev, payment]);
  }

  // Cross-domain lookup methods (still useful to keep here)
  getOrdersForCustomer(customerName: string): Order[] {
    return this.orders().filter((o) => o.customer === customerName);
  }

  getPaymentsByOrderId(orderId: string): Payment[] {
    return this.payments().filter((p) => p.orderId === orderId);
  }
}
