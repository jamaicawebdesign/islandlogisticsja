import React, { useState, useEffect } from 'react';
import { MOCK_VEHICLES, Vehicle } from '../types';
import { Truck, MapPin, Fuel, User, Loader2, Gauge, ChevronDown, Package, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToVehicles, updateVehicleStatus } from '../supabase';

interface FleetStatusProps {
  vehicles?: Vehicle[];
  onVehicleClick?: (vehicle: Vehicle) => void;
  onViewDetails?: (vehicle: Vehicle) => void;
  selectedVehicleId?: string | null;
}

export function FleetStatus({ vehicles: initialVehicles, onVehicleClick, onViewDetails, selectedVehicleId }: FleetStatusProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles || []);
  const [isLoading, setIsLoading] = useState(!initialVehicles);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedVehicleId && listRef.current) {
      const element = listRef.current.querySelector(`[data-vehicle-id="${selectedVehicleId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedVehicleId]);

  const statusColors = {
    'Active': 'bg-emerald-500',
    'Maintenance': 'bg-rose-500',
    'Idle': 'bg-amber-500',
  };

  const statuses: Vehicle['status'][] = ['Active', 'Idle', 'Maintenance'];

  useEffect(() => {
    if (initialVehicles) {
      setVehicles(initialVehicles);
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToVehicles(
      (vehicleData) => {
        setVehicles(vehicleData);
        setIsLoading(false);
      },
      {
        onError: (error) => {
          console.error('Error fetching vehicles:', error);
          setIsLoading(false);
        },
      }
    );

    return () => unsubscribe();
  }, [initialVehicles]);

  const handleStatusUpdate = async (vehicleId: string, newStatus: Vehicle['status'], e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setUpdatingId(vehicleId);
    
    try {
      await updateVehicleStatus(vehicleId, newStatus);
    } catch (error) {
      console.error('Error updating vehicle status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const activeCount = vehicles.filter(v => v.status === 'Active').length;

  return (
    <div className="glass-card p-6 flex flex-col gap-6 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-3xl">
          <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
        </div>
      )}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Fleet Status</h3>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{activeCount} Active</span>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar" ref={listRef}>
        <AnimatePresence mode="popLayout">
          {vehicles.map((vehicle) => (
            <motion.div 
              key={vehicle.id} 
              data-vehicle-id={vehicle.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: selectedVehicleId === vehicle.id ? 1.02 : 1,
                borderColor: selectedVehicleId === vehicle.id ? 'var(--brand-accent)' : 'rgb(241 245 249)'
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => onVehicleClick?.(vehicle)}
              className={cn(
                "p-4 rounded-xl border transition-all group cursor-pointer hover:shadow-md",
                selectedVehicleId === vehicle.id 
                  ? "bg-blue-50/50 border-brand-accent shadow-sm ring-1 ring-brand-accent/20" 
                  : "border-slate-100 hover:border-brand-accent/30 hover:bg-slate-50/50"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-brand-accent/10 transition-colors">
                    <Truck className="w-5 h-5 text-slate-600 group-hover:text-brand-accent transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{vehicle.id} - {vehicle.type}</h4>
                    <div className="relative mt-0.5">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === vehicle.id ? null : vehicle.id);
                        }}
                        className="flex items-center gap-1.5 hover:bg-slate-100 px-1.5 py-0.5 rounded-md transition-colors group/status"
                      >
                        <motion.div 
                          layout
                          className={cn(
                            "w-2 h-2 rounded-full", 
                            updatingId === vehicle.id ? "bg-slate-300 animate-pulse" : statusColors[vehicle.status]
                          )}
                        ></motion.div>
                        <span className="text-xs text-slate-500 font-medium">{vehicle.status}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400 group-hover/status:text-slate-600 transition-colors" />
                      </button>

                      <AnimatePresence>
                        {menuOpenId === vehicle.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-20" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(null);
                              }}
                            />
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute left-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-30 overflow-hidden"
                            >
                              {statuses.map((s) => (
                                <button
                                  key={s}
                                  onClick={(e) => handleStatusUpdate(vehicle.id, s, e)}
                                  className={cn(
                                    "w-full text-left px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50",
                                    vehicle.status === s ? "text-brand-accent bg-blue-50/50" : "text-slate-600"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", statusColors[s])} />
                                    {s}
                                  </div>
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                    <Fuel className="w-3 h-3" />
                    {vehicle.fuelLevel}%
                  </div>
                  <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <motion.div 
                      initial={false}
                      animate={{ width: `${vehicle.fuelLevel}%` }}
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        vehicle.fuelLevel < 20 ? "bg-rose-500" : "bg-emerald-500"
                      )} 
                    ></motion.div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-600 truncate">{vehicle.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-600 truncate">{vehicle.driver}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-600">{(vehicle.odometer || 0).toLocaleString()} km</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-600 truncate">
                    {vehicle.weightCapacity || 'N/A'} | {vehicle.volumeCapacity || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails?.(vehicle);
                  }}
                  className="text-[10px] font-bold text-brand-accent hover:underline uppercase tracking-widest flex items-center gap-1"
                >
                  View Full Details
                  <ExternalLink className="w-3 h-3" />
                </button>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Live Telemetry</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button className="w-full py-3 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors mt-2">
        Fleet Details
      </button>
    </div>
  );
}
