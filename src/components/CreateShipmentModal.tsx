import React, { useState, useEffect } from 'react';
import { X, Package, MapPin, User, Calendar, Truck, Activity, AlertCircle, Edit3, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { createShipment, updateShipment } from '../supabase';
import { Shipment } from '../types';

interface CreateShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment?: Shipment | null;
}

export function CreateShipmentModal({ isOpen, onClose, shipment }: CreateShipmentModalProps) {
  const [formData, setFormData] = useState({
    customer: '',
    origin: '',
    destination: '',
    type: 'Standard',
    priority: 'Normal',
    direction: 'Outbound',
    cargoType: '',
    specialHandling: '',
    estimatedArrival: '',
  });

  useEffect(() => {
    if (shipment) {
      setFormData({
        customer: shipment.customer || '',
        origin: shipment.origin,
        destination: shipment.destination,
        type: shipment.type || 'Standard',
        priority: shipment.priority || 'Normal',
        direction: shipment.direction,
        cargoType: shipment.cargoType || '',
        specialHandling: shipment.specialHandling || '',
        estimatedArrival: shipment.estimatedArrival || '',
      });
    } else {
      setFormData({
        customer: '',
        origin: '',
        destination: '',
        type: 'Standard',
        priority: 'Normal',
        direction: 'Outbound',
        cargoType: '',
        specialHandling: '',
        estimatedArrival: '',
      });
    }
  }, [shipment, isOpen]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isShaking, setIsShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.customer.trim()) {
      newErrors.customer = 'Please enter a customer name to proceed.';
    } else if (formData.customer.trim().length < 3) {
      newErrors.customer = 'Customer name is too short (minimum 3 characters).';
    }

    if (!formData.origin.trim()) {
      newErrors.origin = 'Origin location is required.';
    } else if (!formData.origin.includes(',')) {
      newErrors.origin = 'Invalid format. Please use "City, State" (e.g., New York, NY).';
    }

    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination location is required.';
    } else if (!formData.destination.includes(',')) {
      newErrors.destination = 'Invalid format. Please use "City, State" (e.g., Austin, TX).';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const generateTrackingNumber = () => {
    return `TRK-${Math.floor(10000 + Math.random() * 90000)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        if (shipment && shipment.id) {
          await updateShipment(shipment.id, {
            ...formData,
            direction: formData.direction as Shipment['direction'],
            customer: formData.customer.trim(),
          });
          showToast('Shipment updated successfully');
        } else {
          const trackingNumber = generateTrackingNumber();

          const originLat = 25 + Math.random() * 24;
          const originLng = -125 + Math.random() * 58;
          const destLat = 25 + Math.random() * 24;
          const destLng = -125 + Math.random() * 58;

          await createShipment({
            ...formData,
            direction: formData.direction as Shipment['direction'],
            customer: formData.customer.trim(),
            trackingNumber,
            status: 'Pending',
            estimatedArrival:
              formData.estimatedArrival ||
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: Math.floor(Math.random() * 20000) + 1000,
            weight: `${Math.floor(Math.random() * 500) + 10}kg`,
            originLat,
            originLng,
            destLat,
            destLng,
          });
          showToast(`Shipment ${trackingNumber} created successfully`);
        }

        setTimeout(() => {
          onClose();
          if (!shipment) {
            setFormData({
              customer: '',
              origin: '',
              destination: '',
              type: 'Standard',
              priority: 'Normal',
              direction: 'Outbound',
              cargoType: '',
              specialHandling: '',
              estimatedArrival: '',
            });
          }
          setErrors({});
        }, 1000);
      } catch (error) {
        console.error('Shipment save error:', error);
        showToast('An error occurred. Please try again.', 'error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const errorVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              x: isShaking ? [0, -10, 10, -10, 10, 0] : 0
            }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: isShaking ? 0.4 : 0.3 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-accent text-white rounded-xl">
                  {shipment ? <Edit3 className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {shipment ? 'Edit Shipment' : 'Create New Shipment'}
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <AnimatePresence>
                  {Object.keys(errors).length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-3 text-rose-700 text-sm font-medium"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      Please correct the highlighted fields below.
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      Customer Name
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Global Tech Solutions"
                      className={cn(
                        "w-full bg-slate-50 border rounded-xl py-2.5 px-4 text-sm outline-none transition-all",
                        errors.customer ? "border-rose-500 ring-2 ring-rose-500/10" : "border-slate-200 focus:ring-2 focus:ring-brand-accent/20"
                      )}
                      value={formData.customer}
                      onChange={(e) => {
                        setFormData({...formData, customer: e.target.value});
                        if (errors.customer) setErrors({...errors, customer: ''});
                      }}
                    />
                    <AnimatePresence mode="wait">
                      {errors.customer && (
                        <motion.p 
                          variants={errorVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3" />
                          {errors.customer}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-400" />
                      Cargo Type
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Electronics, Perishables, Machinery"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                      value={formData.cargoType}
                      onChange={(e) => setFormData({...formData, cargoType: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        Origin
                      </label>
                      <input 
                        type="text" 
                        placeholder="City, State"
                        className={cn(
                          "w-full bg-slate-50 border rounded-xl py-2.5 px-4 text-sm outline-none transition-all",
                          errors.origin ? "border-rose-500 ring-2 ring-rose-500/10" : "border-slate-200 focus:ring-2 focus:ring-brand-accent/20"
                        )}
                        value={formData.origin}
                        onChange={(e) => {
                          setFormData({...formData, origin: e.target.value});
                          if (errors.origin) setErrors({...errors, origin: ''});
                        }}
                      />
                      <AnimatePresence mode="wait">
                        {errors.origin && (
                          <motion.p 
                            variants={errorVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1"
                          >
                            <AlertCircle className="w-3 h-3" />
                            {errors.origin}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        Destination
                      </label>
                      <input 
                        type="text" 
                        placeholder="City, State"
                        className={cn(
                          "w-full bg-slate-50 border rounded-xl py-2.5 px-4 text-sm outline-none transition-all",
                          errors.destination ? "border-rose-500 ring-2 ring-rose-500/10" : "border-slate-200 focus:ring-2 focus:ring-brand-accent/20"
                        )}
                        value={formData.destination}
                        onChange={(e) => {
                          setFormData({...formData, destination: e.target.value});
                          if (errors.destination) setErrors({...errors, destination: ''});
                        }}
                      />
                      <AnimatePresence mode="wait">
                        {errors.destination && (
                          <motion.p 
                            variants={errorVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1"
                          >
                            <AlertCircle className="w-3 h-3" />
                            {errors.destination}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-400" />
                        Service Type
                      </label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                      >
                        <option>Standard</option>
                        <option>Express</option>
                        <option>Overnight</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        Priority
                      </label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                        value={formData.priority}
                        onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      >
                        <option>Normal</option>
                        <option>High</option>
                        <option>Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      Estimated Arrival Date (Optional)
                    </label>
                    <input 
                      type="date" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                      value={formData.estimatedArrival}
                      onChange={(e) => setFormData({...formData, estimatedArrival: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-slate-400" />
                      Special Handling Instructions
                    </label>
                    <textarea 
                      placeholder="e.g. Fragile, Keep Refrigerated, Do Not Stack"
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all resize-none"
                      value={formData.specialHandling}
                      onChange={(e) => setFormData({...formData, specialHandling: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                      Shipment Direction
                    </label>
                    <div className="flex gap-4">
                      {['Inbound', 'Outbound'].map((dir) => (
                        <label key={dir} className="flex-1 cursor-pointer">
                          <input 
                            type="radio" 
                            name="direction" 
                            className="sr-only peer" 
                            checked={formData.direction === dir}
                            onChange={() => setFormData({...formData, direction: dir})}
                          />
                          <div className="p-3 text-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-semibold peer-checked:bg-brand-accent peer-checked:text-white peer-checked:border-brand-accent transition-all">
                            {dir}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3 flex-shrink-0">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "flex-1 py-3 bg-brand-accent text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2",
                    isSubmitting && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Activity className="w-5 h-5 animate-spin" />
                      {shipment ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    shipment ? 'Update Shipment' : 'Create Shipment'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110]"
          >
            <div className={cn(
              "px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 min-w-[300px]",
              toast.type === 'success' 
                ? "bg-emerald-600 text-white border-emerald-500" 
                : "bg-rose-600 text-white border-rose-500"
            )}>
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="text-sm font-bold">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
