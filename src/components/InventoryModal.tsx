import React, { useState, useEffect } from 'react';
import { 
  X, 
  Package, 
  Tag, 
  Layers, 
  MapPin, 
  DollarSign, 
  AlertCircle,
  Activity,
  Plus,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createInventoryItem, updateInventoryItem } from '../supabase';
import { useAuth } from './SupabaseProvider';
import { InventoryItem } from '../types';
import { cn } from '../lib/utils';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: InventoryItem;
}

export function InventoryModal({ isOpen, onClose, item }: InventoryModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    quantity: 0,
    minStock: 10,
    location: '',
    value: 0,
    status: 'In Stock' as 'In Stock' | 'Low Stock' | 'Out of Stock'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setFormData({
        sku: item.sku,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        minStock: item.minStock,
        location: item.location,
        value: item.value,
        status: item.status
      });
    } else {
      setFormData({
        sku: '',
        name: '',
        category: '',
        quantity: 0,
        minStock: 10,
        location: '',
        value: 0,
        status: 'In Stock'
      });
    }
    setErrors({});
  }, [item, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.sku) newErrors.sku = 'SKU is required';
    if (!formData.name) newErrors.name = 'Item name is required';
    if (formData.quantity < 0) newErrors.quantity = 'Quantity cannot be negative';
    if (!formData.category) newErrors.category = 'Category is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;

    setIsSubmitting(true);
    try {
      const status: InventoryItem['status'] =
        formData.quantity === 0 ? 'Out of Stock' :
        formData.quantity <= formData.minStock ? 'Low Stock' : 'In Stock';

      if (item) {
        await updateInventoryItem(item.id, {
          ...formData,
          status,
        });
      } else {
        await createInventoryItem({
          ...formData,
          status,
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving inventory item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-accent text-white rounded-xl">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {item ? 'Edit Inventory Item' : 'Add New Item'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">Warehouse Management System</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-slate-400" />
                      SKU Code
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. ELEC-001"
                      className={cn(
                        "w-full bg-slate-50 border rounded-xl py-2.5 px-4 text-sm outline-none transition-all",
                        errors.sku ? "border-rose-500 ring-2 ring-rose-500/10" : "border-slate-200 focus:ring-2 focus:ring-brand-accent/20"
                      )}
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-400" />
                      Category
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Electronics"
                      className={cn(
                        "w-full bg-slate-50 border rounded-xl py-2.5 px-4 text-sm outline-none transition-all",
                        errors.category ? "border-rose-500 ring-2 ring-rose-500/10" : "border-slate-200 focus:ring-2 focus:ring-brand-accent/20"
                      )}
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-400" />
                    Item Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Wireless Headphones Pro"
                    className={cn(
                      "w-full bg-slate-50 border rounded-xl py-2.5 px-4 text-sm outline-none transition-all",
                      errors.name ? "border-rose-500 ring-2 ring-rose-500/10" : "border-slate-200 focus:ring-2 focus:ring-brand-accent/20"
                    )}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                      Current Quantity
                    </label>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, quantity: Math.max(0, formData.quantity - 1)})}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                      >
                        <Minus className="w-4 h-4 text-slate-600" />
                      </button>
                      <input 
                        type="number" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-center focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                      />
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, quantity: formData.quantity + 1})}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                      >
                        <Plus className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                      Min Stock Level
                    </label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                      value={formData.minStock}
                      onChange={(e) => setFormData({...formData, minStock: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      Storage Location
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Aisle 4, Shelf B"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      Unit Value ($)
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                      value={formData.value}
                      onChange={(e) => setFormData({...formData, value: parseFloat(e.target.value) || 0})}
                    />
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
                    Saving...
                  </>
                ) : (
                  item ? 'Update Item' : 'Add to Inventory'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
