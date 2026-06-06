import type { CartItem, Product } from './types';

const STORAGE_KEY = 'adam-shop-cart';

export class Cart {
  private items: CartItem[] = [];
  private listeners: Array<(items: CartItem[]) => void> = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.items = raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      this.items = [];
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    this.listeners.forEach((fn) => fn(this.items));
  }

  onChange(fn: (items: CartItem[]) => void): void {
    this.listeners.push(fn);
  }

  add(product: Product): void {
    const existing = this.items.find((i) => i.product.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({ product, quantity: 1 });
    }
    this.save();
  }

  remove(productId: number): void {
    this.items = this.items.filter((i) => i.product.id !== productId);
    this.save();
  }

  setQuantity(productId: number, qty: number): void {
    if (qty <= 0) {
      this.remove(productId);
      return;
    }
    const item = this.items.find((i) => i.product.id === productId);
    if (item) {
      item.quantity = qty;
      this.save();
    }
  }

  clear(): void {
    this.items = [];
    this.save();
  }

  getItems(): CartItem[] {
    return [...this.items];
  }

  getCount(): number {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  getTotal(): number {
    return this.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }
}
