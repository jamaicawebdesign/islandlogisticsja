import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Plus, Search, Filter, MoreVertical, 
  Package, Truck, CheckCircle2, Clock, XCircle,
  ArrowRight, ExternalLink, Calendar, User, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order } from '../types';
import { subscribeToOrders, deleteOrder } from '../supabase';
import { cn } from '../lib/utils';
import { OrderModal } from '../components/OrderModal';
import { FulfillmentModal } from '../components/FulfillmentModal';

export function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isFulfillmentModalOpen, setIsFulfillmentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToOrders(
      (data) => {
        setOrders(data);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching orders:', error);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      await deleteOrder(id);
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Processing': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Fulfilled': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return <Clock className="w-3 h-3" />;
      case 'Processing': return <Package className="w-3 h-3" />;
      case 'Fulfilled': return <CheckCircle2 className="w-3 h-3" />;
      case 'Cancelled': return <XCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Order Management</h1>
          <p className="text-slate-500 font-medium">Process customer orders and manage fulfillment</p>
        </div>
        <button
          onClick={() => {
            setSelectedOrder(null);
            setIsOrderModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-accent text-white font-bold rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-100 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Create New Order
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending', value: orders.filter(o => o.status === 'Pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Processing', value: orders.filter(o => o.status === 'Processing').length, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Fulfilled', value: orders.filter(o => o.status === 'Fulfilled').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4 flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg)}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order # or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200">
            {['All', 'Pending', 'Processing', 'Fulfilled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  statusFilter === status 
                    ? "bg-brand-accent text-white shadow-md" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Items</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-400">Loading orders...</p>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-400">No orders found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-brand-accent/10 group-hover:text-brand-accent transition-colors">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{order.orderNumber}</p>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-slate-400" />
                          <p className="text-sm font-bold text-slate-700">{order.customerName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <p className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{order.shippingAddress}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div 
                            key={idx}
                            title={item.name}
                            className="w-8 h-8 rounded-lg bg-white border-2 border-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm"
                          >
                            {item.name.charAt(0)}
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border-2 border-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-slate-900">${order.totalAmount.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                        getStatusColor(order.status)
                      )}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {order.status === 'Pending' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsFulfillmentModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-accent text-white text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-blue-600 transition-all shadow-sm"
                          >
                            <Truck className="w-3 h-3" />
                            Fulfill
                          </button>
                        )}
                        {order.status === 'Fulfilled' && order.shipmentId && (
                          <button
                            onClick={() => {
                              // Link to shipment tracking or details
                              window.location.hash = `#/shipments?id=${order.shipmentId}`;
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-emerald-600 transition-all shadow-sm"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Track
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OrderModal 
        isOpen={isOrderModalOpen} 
        onClose={() => setIsOrderModalOpen(false)} 
        order={selectedOrder}
      />

      {selectedOrder && (
        <FulfillmentModal
          isOpen={isFulfillmentModalOpen}
          onClose={() => setIsFulfillmentModalOpen(false)}
          order={selectedOrder}
        />
      )}
    </div>
  );
}
