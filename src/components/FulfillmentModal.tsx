import React, { useState, useEffect } from 'react';
import { X, Truck, Package, CheckCircle2, AlertCircle, MapPin, User, Fuel } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, Vehicle } from '../types';
import { subscribeToVehicles, fulfillOrder } from '../supabase';
import { useAuth } from './SupabaseProvider';
import { cn } from '../lib/utils';

interface FulfillmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

export function FulfillmentModal({ isOpen, onClose, order }: FulfillmentModalProps) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToVehicles(
      (data) => setVehicles(data),
      { status: 'Active' }
    );
    return () => unsubscribe();
  }, []);

  const handleFulfill = async () => {
    if (!user || !selectedVehicleId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await fulfillOrder(order);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to fulfill order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-accent/10 rounded-xl flex items-center justify-center text-brand-accent">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Fulfill Order</h2>
              <p className="text-sm text-slate-500">{order.orderNumber} • {order.customerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Order Summary</h3>
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3">
              {order.items.map((item) => (
                <div key={item.itemId} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-white border border-slate-200 rounded flex items-center justify-center text-[10px] font-bold text-slate-600">
                      {item.quantity}x
                    </span>
                    <span className="text-sm font-bold text-slate-900">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{item.sku}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">Total Value</span>
                <span className="text-lg font-black text-slate-900">${order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Assign Delivery Vehicle</h3>
            <div className="grid grid-cols-1 gap-3">
              {vehicles.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                  <Truck className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No active vehicles available for assignment.</p>
                </div>
              ) : (
                vehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => setSelectedVehicleId(vehicle.id)}
                    className={cn(
                      "p-4 rounded-2xl border transition-all text-left group",
                      selectedVehicleId === vehicle.id
                        ? "bg-brand-accent/5 border-brand-accent ring-2 ring-brand-accent/10"
                        : "bg-white border-slate-100 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                          selectedVehicleId === vehicle.id ? "bg-brand-accent text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                        )}>
                          <Truck className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{vehicle.id}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{vehicle.type} • {vehicle.driver}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                          <Fuel className="w-3 h-3" />
                          {vehicle.fuelLevel}%
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                          <MapPin className="w-3 h-3" />
                          {vehicle.location}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleFulfill}
            disabled={isSubmitting || !selectedVehicleId}
            className="flex-[2] py-3 px-4 bg-brand-accent text-white font-bold rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:hover:bg-brand-accent flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing Fulfillment...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Confirm & Ship
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
