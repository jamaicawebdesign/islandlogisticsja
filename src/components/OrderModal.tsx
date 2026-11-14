import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Search, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderItem, InventoryItem } from '../types';
import { subscribeToInventory, createOrder } from '../supabase';
import { useAuth } from './SupabaseProvider';
import { cn } from '../lib/utils';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: Order | null;
}

export function OrderModal({ isOpen, onClose, order }: OrderModalProps) {
  const { user } = useAuth();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order) {
      setCustomerName(order.customerName);
      setCustomerEmail(order.customerEmail || '');
      setShippingAddress(order.shippingAddress || '');
      setItems(order.items);
    } else {
      setCustomerName('');
      setCustomerEmail('');
      setShippingAddress('');
      setItems([]);
    }
  }, [order, isOpen]);

  useEffect(() => {
    const unsubscribe = subscribeToInventory((data) => {
      setInventory(data);
    });
    return () => unsubscribe();
  }, []);

  const addItem = (item: InventoryItem) => {
    const existing = items.find(i => i.itemId === item.id);
    if (existing) {
      setItems(items.map(i => i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, {
        itemId: item.id,
        sku: item.sku,
        name: item.name,
        quantity: 1,
        price: item.value || 0
      }]);
    }
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter(i => i.itemId !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) return;
    setItems(items.map(i => i.itemId === itemId ? { ...i, quantity } : i));
  };

  const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || items.length === 0) return;

    setIsSubmitting(true);
    try {
      await createOrder({
        orderNumber: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        customerName,
        customerEmail,
        shippingAddress,
        items,
        totalAmount,
        status: 'Pending',
      });
      onClose();
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{order ? 'Edit Order' : 'Create New Order'}</h2>
            <p className="text-sm text-slate-500">Enter customer details and select items</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="flex-1 p-6 overflow-y-auto space-y-6 border-r border-slate-100">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1">Customer Name</label>
                  <input
                    required
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1">Email Address</label>
                  <input
                    required
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 ml-1">Shipping Address</label>
                <textarea
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all resize-none"
                  placeholder="123 Logistics Way, Suite 100..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Order Items</h3>
                <span className="text-xs font-bold text-brand-accent bg-blue-50 px-2 py-1 rounded-lg">
                  {items.length} Items Selected
                </span>
              </div>
              
              <div className="space-y-3">
                {items.length === 0 ? (
                  <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                    <Package className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No items added yet. Select from inventory.</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.itemId} className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.sku}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                            className="px-2 py-1 hover:bg-slate-50 text-slate-500"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 text-xs font-bold text-slate-900 border-x border-slate-200 min-w-[40px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                            className="px-2 py-1 hover:bg-slate-50 text-slate-500"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <p className="text-sm font-bold text-slate-900">${(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.itemId)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="w-full md:w-80 bg-slate-50 p-6 flex flex-col">
            <div className="flex-1 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Inventory Search</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                    placeholder="Search items..."
                  />
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {filteredInventory.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addItem(item)}
                      disabled={item.quantity <= 0}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-left hover:border-brand-accent hover:shadow-sm transition-all group disabled:opacity-50 disabled:hover:border-slate-200"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-brand-accent transition-colors">{item.name}</p>
                        <Plus className="w-3 h-3 text-slate-300 group-hover:text-brand-accent" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.sku}</span>
                        <span className={cn(
                          "text-[10px] font-bold",
                          item.quantity <= item.minStock ? "text-rose-500" : "text-emerald-500"
                        )}>
                          {item.quantity} in stock
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">Total Amount</span>
                <span className="text-xl font-black text-slate-900">${totalAmount.toLocaleString()}</span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="w-full py-3 bg-brand-accent text-white font-bold rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:hover:bg-brand-accent flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Order...
                  </>
                ) : (
                  'Confirm Order'
                )}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
