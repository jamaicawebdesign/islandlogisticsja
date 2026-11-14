import React, { useState, useEffect } from 'react';
import { FleetMap } from '../components/FleetMap';
import { FleetStatus } from '../components/FleetStatus';
import { VehicleDetailModal } from '../components/VehicleDetailModal';
import { VehicleDetailSection } from '../components/VehicleDetailSection';
import { RegisterVehicleModal } from '../components/RegisterVehicleModal';
import { Truck, Shield, Zap, Activity, Loader2, AlertTriangle, X, Fuel, Wrench, Search } from 'lucide-react';
import { Vehicle } from '../types';
import { subscribeToVehicles, updateVehicleStatus } from '../supabase';
import { calculateHealthScore } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function FleetView() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [highlightedVehicleId, setHighlightedVehicleId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleVehicleClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setHighlightedVehicleId(vehicle.id);
  };

  const handleViewDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setHighlightedVehicleId(vehicle.id);
    setIsDetailModalOpen(true);
  };
  const [isLoading, setIsLoading] = useState(true);
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);
  const [lastCriticalCount, setLastCriticalCount] = useState(0);

  const [stats, setStats] = useState({
    safetyScore: 0,
    fuelEfficiency: 0,
    activeHours: 0
  });

  useEffect(() => {
    const unsubscribe = subscribeToVehicles(
      (vehicleData) => {
        setVehicles(vehicleData);

        const totalVehicles = vehicleData.length;
        if (totalVehicles > 0) {
          const avgFuel = vehicleData.reduce((acc, v) => acc + (v.fuelLevel || 0), 0) / totalVehicles;
          const totalOdometer = vehicleData.reduce((acc, v) => acc + (v.odometer || 0), 0);
          const avgSafety = vehicleData.reduce((acc, v) => acc + calculateHealthScore(v), 0) / totalVehicles;

          setStats({
            safetyScore: Math.round(avgSafety),
            fuelEfficiency: Number((avgFuel / 10).toFixed(1)),
            activeHours: Math.round(totalOdometer / 100),
          });
        }

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
  }, []);

  const filteredVehicles = vehicles.filter(v => 
    v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate critical issues
  const lowFuelVehicles = vehicles.filter(v => v.fuelLevel !== undefined && v.fuelLevel <= 20);
  const maintenanceVehicles = vehicles.filter(v => v.status === 'Maintenance');
  const criticalCount = lowFuelVehicles.length + maintenanceVehicles.length;
  const hasCriticalIssues = criticalCount > 0 && !isAlertDismissed;

  // Auto-reset dismissal if new critical issues appear
  useEffect(() => {
    if (criticalCount > lastCriticalCount) {
      setIsAlertDismissed(false);
    }
    setLastCriticalCount(criticalCount);
  }, [criticalCount, lastCriticalCount]);

  // Keep selected vehicle in sync with latest fleet data
  useEffect(() => {
    if (selectedVehicle) {
      const updated = vehicles.find(v => v.id === selectedVehicle.id);
      if (updated && (updated.status !== selectedVehicle.status || updated.fuelLevel !== selectedVehicle.fuelLevel)) {
        setSelectedVehicle(updated);
      }
    }
  }, [vehicles, selectedVehicle?.id]);

  const handleUpdateStatus = async (id: string, status: Vehicle['status']) => {
    try {
      await updateVehicleStatus(id, status);
    } catch (error) {
      console.error('Error updating vehicle status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
        <p className="text-slate-500 font-medium">Loading fleet data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      <AnimatePresence>
        {hasCriticalIssues && (
          <motion.div
            initial={{ height: 0, opacity: 0, scale: 0.95 }}
            animate={{ height: 'auto', opacity: 1, scale: 1 }}
            exit={{ height: 0, opacity: 0, scale: 0.95 }}
            className="overflow-hidden"
          >
            <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 flex items-start justify-between shadow-lg shadow-rose-100/50">
              <div className="flex items-start gap-5">
                <div className="p-3 bg-rose-500 rounded-2xl text-white shadow-md shadow-rose-200 animate-pulse">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-base font-bold text-rose-900">Critical Fleet Alerts</h4>
                    <p className="text-sm text-rose-700/80">Immediate attention required for {criticalCount} vehicles.</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {lowFuelVehicles.map(v => (
                      <button 
                        key={`fuel-${v.id}`}
                        onClick={() => handleVehicleClick(v)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-rose-200 rounded-xl text-rose-700 text-xs font-bold hover:bg-rose-100 transition-all shadow-sm"
                      >
                        <Fuel className="w-3.5 h-3.5" />
                        {v.id}: {v.fuelLevel}% Fuel
                      </button>
                    ))}
                    {maintenanceVehicles.map(v => (
                      <button 
                        key={`maint-${v.id}`}
                        onClick={() => handleVehicleClick(v)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-rose-200 rounded-xl text-rose-700 text-xs font-bold hover:bg-rose-100 transition-all shadow-sm"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        {v.id}: Maintenance
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsAlertDismissed(true)}
                className="p-2 hover:bg-rose-100 rounded-full transition-colors text-rose-400 hover:text-rose-600"
                title="Dismiss Alerts"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Fleet Management</h1>
          <p className="text-slate-500 mt-1">Monitor vehicle health, location, and driver performance.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by ID, driver, or location..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-4 py-2.5 bg-brand-accent text-white font-semibold rounded-xl hover:bg-blue-600 transition-all shadow-md shadow-blue-200 whitespace-nowrap"
          >
            Register Vehicle
          </button>
        </div>
      </div>

      <RegisterVehicleModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Safety Score</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.safetyScore}/100</h3>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Fuel Efficiency</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.fuelEfficiency} km/L</h3>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Hours</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.activeHours.toLocaleString()} hrs</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <FleetMap 
            vehicles={filteredVehicles} 
            onVehicleClick={handleVehicleClick} 
            onViewDetails={handleViewDetails}
            onUpdateStatus={handleUpdateStatus}
            selectedVehicleId={highlightedVehicleId}
          />
        </div>
        <div>
          <FleetStatus 
            vehicles={filteredVehicles} 
            onVehicleClick={handleVehicleClick}
            onViewDetails={handleViewDetails}
            selectedVehicleId={highlightedVehicleId}
          />
        </div>
      </div>

      <VehicleDetailSection 
        vehicle={selectedVehicle} 
        onUpdateStatus={handleUpdateStatus}
        onViewDetails={() => setIsDetailModalOpen(true)}
      />

      <VehicleDetailModal 
        vehicle={selectedVehicle} 
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)} 
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
