import React, { useState } from 'react';
import { X, Truck, User, MapPin, Fuel, Activity, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Vehicle } from '../types';
import { createVehicle } from '../supabase';

interface RegisterVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegisterVehicleModal({ isOpen, onClose }: RegisterVehicleModalProps) {
  const [formData, setFormData] = useState({
    id: '',
    type: 'Truck' as Vehicle['type'],
    driver: '',
    location: '',
    fuelLevel: 100,
    status: 'Active' as Vehicle['status'],
    weightCapacity: '',
    volumeCapacity: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Generate random coordinates within USA for the map
    const lat = 30 + Math.random() * 15;
    const lng = -120 + Math.random() * 40;

    try {
      await createVehicle({
        ...formData,
        lat,
        lng,
        speed: Math.floor(Math.random() * 70),
        altitude: Math.floor(Math.random() * 500),
        odometer: Math.floor(Math.random() * 100000),
        temperature: Math.floor(Math.random() * 30) + 10,
      });

      setFormData({
        id: '',
        type: 'Truck',
        driver: '',
        location: '',
        fuelLevel: 100,
        status: 'Active',
        weightCapacity: '',
        volumeCapacity: '',
      });
      onClose();
    } catch (error) {
      console.error('Error registering vehicle:', error);
    } finally {
      setIsSubmitting(false);
    }
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
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-accent text-white rounded-xl">
                  <Truck className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Register New Vehicle</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Vehicle ID</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. V-501"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                      value={formData.id}
                      onChange={(e) => setFormData({...formData, id: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Vehicle Type</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as Vehicle['type']})}
                    >
                      <option value="Truck">Truck</option>
                      <option value="Van">Van</option>
                      <option value="Plane">Plane</option>
                      <option value="Ship">Ship</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    Assigned Driver
                  </label>
                  <input 
                    required
                    type="text" 
                    placeholder="Full Name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                    value={formData.driver}
                    onChange={(e) => setFormData({...formData, driver: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    Initial Location
                  </label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Warehouse B, Chicago"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Fuel className="w-4 h-4 text-slate-400" />
                      Fuel Level (%)
                    </label>
                    <input 
                      required
                      type="number" 
                      min="0"
                      max="100"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                      value={formData.fuelLevel}
                      onChange={(e) => setFormData({...formData, fuelLevel: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                      Initial Status
                    </label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as Vehicle['status']})}
                    >
                      <option value="Active">Active</option>
                      <option value="Idle">Idle</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Weight Capacity</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 20 tons"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                      value={formData.weightCapacity}
                      onChange={(e) => setFormData({...formData, weightCapacity: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Volume Capacity</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 80 m³"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
                      value={formData.volumeCapacity}
                      onChange={(e) => setFormData({...formData, volumeCapacity: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
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
                  className="flex-1 py-3 bg-brand-accent text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register Vehicle'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
