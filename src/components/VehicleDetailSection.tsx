import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import { 
  Truck, Plane, User, MapPin, Fuel, Activity, 
  Shield, Calendar, Gauge, Thermometer, Package,
  Wrench, AlertCircle, Zap, Navigation, TrendingDown, TrendingUp,
  Phone, MessageSquare, X, Settings2, ExternalLink, Check, Droplets, CircleDot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine 
} from 'recharts';

interface VehicleDetailSectionProps {
  vehicle: Vehicle | null;
  onUpdateStatus?: (id: string, status: Vehicle['status']) => void;
  onViewDetails?: () => void;
}

export function VehicleDetailSection({ vehicle, onUpdateStatus, onViewDetails }: VehicleDetailSectionProps) {
  const [isCalling, setIsCalling] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);

  const healthScore = React.useMemo(() => {
    if (!vehicle) return 0;
    let score = 100;
    if (vehicle.fuelLevel < 20) score -= 15;
    if (vehicle.fuelLevel < 10) score -= 15;
    if ((vehicle.temperature || 0) > 95) score -= 30;
    else if ((vehicle.temperature || 0) > 85) score -= 10;
    if (vehicle.status === 'Maintenance') score -= 50;
    if (vehicle.status === 'Idle' && (vehicle.speed || 0) > 0) score -= 20;
    return Math.max(5, score);
  }, [vehicle]);

  useEffect(() => {
    if (isCalling) {
      const timer = setTimeout(() => {
        setIsCalling(false);
        setShowContactInfo(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCalling]);

  if (!vehicle) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-12 flex flex-col items-center justify-center text-center gap-4 border-dashed border-2 border-slate-200"
      >
        <div className="p-4 bg-slate-50 rounded-full text-slate-300">
          <Truck className="w-12 h-12" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">No Vehicle Selected</h3>
          <p className="text-slate-500 max-w-xs mx-auto">Select a vehicle from the map or status list to view detailed specifications and telemetry.</p>
        </div>
      </motion.div>
    );
  }

  const maintenanceHistory = [
    { date: 'Jan 12, 2026', type: 'Routine', desc: 'Oil change & filter replacement', status: 'Completed', cost: '$145.00' },
    { date: 'Nov 05, 2025', type: 'Repair', desc: 'Brake pad replacement (Front)', status: 'Completed', cost: '$380.00' },
    { date: 'Aug 20, 2025', type: 'Inspection', desc: 'Annual safety certification', status: 'Completed', cost: '$85.00' },
    { date: 'Jun 15, 2025', type: 'Routine', desc: 'Tire rotation & pressure check', status: 'Completed', cost: '$60.00' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-accent" />
          Vehicle Details: {vehicle.id}
        </h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={onViewDetails}
            className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <ExternalLink className="w-3 h-3" />
            Open Full Details
          </button>
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-bold border",
            vehicle.status === 'Active' ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
            vehicle.status === 'Maintenance' ? "text-rose-600 bg-rose-50 border-rose-100" :
            "text-amber-600 bg-amber-50 border-amber-100"
          )}>
            {vehicle.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Specifications */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-brand-accent">
            <Package className="w-5 h-5" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Specifications</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Weight Capacity</span>
              <span className="text-sm font-bold text-slate-900">{vehicle.weightCapacity || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Volume Capacity</span>
              <span className="text-sm font-bold text-slate-900">{vehicle.volumeCapacity || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Type</span>
              <span className="text-sm font-bold text-slate-900">{vehicle.type}</span>
            </div>
          </div>
        </div>

        {/* Telemetry */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-brand-accent">
            <Gauge className="w-5 h-5" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Telemetry</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Odometer</span>
              <span className="text-sm font-bold text-slate-900">{(vehicle.odometer || 0).toLocaleString()} km</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Temperature</span>
              <span className={cn(
                "text-sm font-bold",
                (vehicle.temperature || 0) > 90 ? "text-rose-600" : "text-slate-900"
              )}>
                {vehicle.temperature || 0}°C
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Fuel Level</span>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-slate-900">{vehicle.fuelLevel}%</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Last 24h</span>
                </div>
                <svg className="w-10 h-5 overflow-visible" viewBox="0 0 40 20">
                  <defs>
                    <linearGradient id="fuelGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 15 Q 5 12, 10 14 T 20 8 T 30 12 T 40 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="text-emerald-500"
                  />
                  <circle cx="40" cy="5" r="2" className="fill-emerald-500" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Performance & Health */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-brand-accent">
              <Shield className="w-5 h-5" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Performance</h3>
            </div>
            <div className="flex items-center gap-1">
               <div className={cn(
                 "w-2 h-2 rounded-full",
                 healthScore > 80 ? "bg-emerald-500" : healthScore > 50 ? "bg-amber-500" : "bg-rose-500"
               )} />
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Health</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Gauge */}
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="10"
                />
                <circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke={healthScore > 80 ? '#10b981' : healthScore > 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10"
                  strokeDasharray={`${healthScore * 2.51} 251`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-slate-900 leading-none">{healthScore}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Score</span>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-medium uppercase">Safety</span>
                <span className="text-xs font-bold text-emerald-600">98/100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-medium uppercase">Efficiency</span>
                <span className="text-xs font-bold text-slate-900">92%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-medium uppercase">Active</span>
                <span className="text-xs font-bold text-slate-900">142h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-brand-accent">
            <Calendar className="w-5 h-5" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Maintenance</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Next Service</span>
              <span className="text-sm font-bold text-slate-900">Mar 24, 2026</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Last Service</span>
              <span className="text-sm font-bold text-slate-900">Jan 12, 2026</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Health Status</span>
              <span className="text-sm font-bold text-emerald-600">Optimal</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6 space-y-4 lg:col-span-4">
          <div className="flex items-center gap-2 text-brand-accent">
            <Settings2 className="w-5 h-5" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Quick Actions & Status Control</h3>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px] space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Operational Status</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current:</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-widest",
                    vehicle.status === 'Active' ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
                    vehicle.status === 'Maintenance' ? "text-rose-600 bg-rose-50 border-rose-100" :
                    "text-amber-600 bg-amber-50 border-amber-100"
                  )}>
                    {vehicle.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(['Active', 'Idle', 'Maintenance'] as const).map((status) => {
                  const isActive = vehicle.status === status;
                  return (
                    <button
                      key={status}
                      onClick={() => onUpdateStatus?.(vehicle.id, status)}
                      className={cn(
                        "relative py-4 px-4 rounded-2xl font-bold text-xs transition-all border-2 flex flex-col items-center gap-2 group overflow-hidden",
                        isActive
                          ? status === 'Active' ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg shadow-emerald-100" :
                            status === 'Maintenance' ? "bg-rose-50 border-rose-500 text-rose-700 shadow-lg shadow-rose-100" :
                            "bg-amber-50 border-amber-500 text-amber-700 shadow-lg shadow-amber-100"
                          : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-600"
                      )}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="status-active-glow"
                          className={cn(
                            "absolute inset-0 opacity-10",
                            status === 'Active' ? "bg-emerald-400" :
                            status === 'Maintenance' ? "bg-rose-400" :
                            "bg-amber-400"
                          )}
                        />
                      )}
                      <div className={cn(
                        "w-3 h-3 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-110",
                        status === 'Active' ? "bg-emerald-500" :
                        status === 'Maintenance' ? "bg-rose-500" :
                        "bg-amber-500",
                        isActive && "scale-125"
                      )} />
                      <span className="relative z-10">{status}</span>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2"
                        >
                          <div className={cn(
                            "w-4 h-4 rounded-full flex items-center justify-center",
                            status === 'Active' ? "bg-emerald-500" :
                            status === 'Maintenance' ? "bg-rose-500" :
                            "bg-amber-500"
                          )}>
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex-1 min-w-[300px] space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Commands</p>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-3 px-4 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                  <Wrench className="w-4 h-4" /> Schedule Service
                </button>
                <button className="py-3 px-4 bg-white border-2 border-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all">
                  View Full History
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Telemetry Section */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-accent">
            <Zap className="w-5 h-5" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Real-time Telemetry</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Feed</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Gauge className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Current Speed</p>
              <p className="text-2xl font-black text-slate-900">{vehicle.speed || 0} <span className="text-sm font-bold text-slate-400">km/h</span></p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
              <Thermometer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Engine Temp</p>
              <p className="text-2xl font-black text-slate-900">{vehicle.temperature || 0} <span className="text-sm font-bold text-slate-400">°C</span></p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Altitude</p>
              <p className="text-2xl font-black text-slate-900">{vehicle.altitude || 0} <span className="text-sm font-bold text-slate-400">m</span></p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center space-y-2 lg:col-span-1">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Fuel className="w-6 h-6" />
            </div>
            <div className="w-full">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fuel Consumption Trend</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <p className="text-2xl font-black text-slate-900">
                  {vehicle.type === 'Plane' ? '450' : '12.4'} 
                  <span className="text-sm font-bold text-slate-400 ml-1">{vehicle.type === 'Plane' ? 'L/h' : 'L/100km'}</span>
                </p>
              </div>
              
              {/* Enhanced Trend Graph */}
              <div className="h-24 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { time: '08:00', vehicle: 12.8, average: 12.2 },
                    { time: '10:00', vehicle: 13.2, average: 12.3 },
                    { time: '12:00', vehicle: 12.4, average: 12.1 },
                    { time: '14:00', vehicle: 11.9, average: 12.2 },
                    { time: '16:00', vehicle: 12.6, average: 12.4 },
                    { time: '18:00', vehicle: 12.4, average: 12.3 },
                  ]}>
                    <defs>
                      <linearGradient id="colorVehicle" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}
                    />
                    <ReferenceLine y={12.25} label={{ value: 'Fleet Avg', position: 'right', fill: '#94a3b8', fontSize: 8 }} stroke="#94a3b8" strokeDasharray="3 3" />
                    <Area 
                      type="monotone" 
                      dataKey="vehicle" 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorVehicle)" 
                      strokeWidth={2}
                      name="This Vehicle"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="average" 
                      stroke="#94a3b8" 
                      strokeWidth={1} 
                      dot={false}
                      strokeDasharray="5 5"
                      name="Fleet Average"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-1 mt-2">
                <TrendingDown className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                  {vehicle.type === 'Plane' ? '-1.5% vs fleet avg' : '-3.2% vs fleet avg'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Diagnostics */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-accent">
            <Settings2 className="w-5 h-5" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Sensor Diagnostics</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Check: 2 mins ago</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Tire Pressure */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <CircleDot className="w-4 h-4 text-blue-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Tire Pressure (PSI)</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Front Left', value: vehicle.tirePressure?.fl || 32.5, status: 'Optimal' },
                { label: 'Front Right', value: vehicle.tirePressure?.fr || 31.8, status: 'Optimal' },
                { label: 'Rear Left', value: vehicle.tirePressure?.rl || 33.1, status: 'Optimal' },
                { label: 'Rear Right', value: vehicle.tirePressure?.rr || 29.5, status: 'Warning' },
              ].map((tire) => (
                <div key={tire.label} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{tire.label}</span>
                    <span className={cn(
                      "text-[8px] font-black uppercase px-1.5 py-0.5 rounded",
                      tire.status === 'Optimal' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {tire.status}
                    </span>
                  </div>
                  <p className="text-lg font-black text-slate-900">{tire.value} <span className="text-[10px] font-bold text-slate-400">PSI</span></p>
                </div>
              ))}
            </div>
          </div>

          {/* Engine Oil */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <Droplets className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Engine Oil Status</h4>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600">Oil Level</span>
                  <span className="text-sm font-black text-slate-900">{vehicle.engineOilLevel || 84}%</span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${vehicle.engineOilLevel || 84}%` }}
                    className={cn(
                      "h-full rounded-full",
                      (vehicle.engineOilLevel || 84) > 20 ? "bg-amber-500" : "bg-rose-500"
                    )}
                  />
                </div>
                <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Low</span>
                  <span>Optimal</span>
                  <span>Full</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Oil Temperature</p>
                  <p className="text-sm font-black text-slate-900">92°C</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Oil Life Remaining</p>
                  <p className="text-sm font-black text-emerald-600">6,400 km</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Driver & Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {isCalling ? (
              <motion.div
                key="calling"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute inset-0 bg-brand-accent flex flex-col items-center justify-center text-white z-10"
              >
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse mb-2">
                  <Phone className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest">Calling {vehicle.driver}...</p>
              </motion.div>
            ) : showContactInfo ? (
              <motion.div
                key="info"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <User className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Driver Info</p>
                      <h4 className="text-sm font-bold text-slate-900">{vehicle.driver}</h4>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowContactInfo(false)}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Direct Phone</p>
                      <p className="text-xs font-bold text-slate-900">+1 (555) 012-3456</p>
                    </div>
                    <div className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-bold rounded uppercase">Available</div>
                  </div>
                  <button className="w-full py-2.5 bg-brand-accent text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors shadow-sm">
                    <MessageSquare className="w-3 h-3" /> Send Direct Message
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-100 rounded-xl">
                    <User className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned Driver</p>
                    <h4 className="text-lg font-bold text-slate-900">{vehicle.driver}</h4>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCalling(true)}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <Phone className="w-3 h-3" />
                  Contact
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 bg-slate-100 rounded-xl">
            <MapPin className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Current Location</p>
              <div className="flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded text-[8px] font-bold text-emerald-600 uppercase tracking-tighter border border-emerald-100">
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                Live
              </div>
            </div>
            <h4 className="text-lg font-bold text-slate-900">{vehicle.location}</h4>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-[10px] text-slate-400 font-medium">{vehicle.lat.toFixed(4)}, {vehicle.lng.toFixed(4)}</p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <div className="w-px h-2 bg-slate-200" />
                <span>Last updated: Just Now</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <div className="w-px h-2 bg-slate-200" />
                <span>Accuracy: ±15m</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance History Table */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-accent">
            <Wrench className="w-5 h-5" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Maintenance History</h3>
          </div>
          <button className="text-[10px] font-bold text-brand-accent hover:underline uppercase tracking-widest">
            Export Records
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cost</th>
                <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {maintenanceHistory.map((record, index) => (
                <tr key={index} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 text-xs font-bold text-slate-900">{record.date}</td>
                  <td className="py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter",
                      record.type === 'Repair' ? "bg-rose-50 text-rose-600" : 
                      record.type === 'Routine' ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600"
                    )}>
                      {record.type}
                    </span>
                  </td>
                  <td className="py-4 text-xs text-slate-600">{record.desc}</td>
                  <td className="py-4 text-xs font-bold text-slate-900">{record.cost}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{record.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
