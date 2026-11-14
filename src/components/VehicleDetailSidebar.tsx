import React, { useState } from 'react';
import { Vehicle } from '../types';
import { X, Truck, Plane, User, MapPin, Fuel, Activity, Shield, Calendar, Settings2, Gauge, Thermometer, Navigation, Wrench, Package, Timer, TrendingUp, AlertTriangle, History, Loader2, Phone, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ConfirmationModal } from './ConfirmationModal';
import { ScheduleMaintenanceModal } from './ScheduleMaintenanceModal';
import { MaintenanceHistoryModal } from './MaintenanceHistoryModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart, Line, LineChart } from 'recharts';

interface VehicleDetailSidebarProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onUpdateStatus?: (id: string, status: Vehicle['status']) => void;
}

export function VehicleDetailSidebar({ vehicle, onClose, onUpdateStatus }: VehicleDetailSidebarProps) {
  const [pendingStatus, setPendingStatus] = useState<Vehicle['status'] | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);

  React.useEffect(() => {
    if (isCalling) {
      const timer = setTimeout(() => {
        setIsCalling(false);
        setShowContactInfo(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isCalling]);

  if (!vehicle) return null;

  const performanceData = [
    { day: 'Mon', events: 2, speed: vehicle.type === 'Plane' ? 450 : 65 },
    { day: 'Tue', events: 0, speed: vehicle.type === 'Plane' ? 480 : 62 },
    { day: 'Wed', events: 4, speed: vehicle.type === 'Plane' ? 460 : 70 },
    { day: 'Thu', events: 1, speed: vehicle.type === 'Plane' ? 470 : 64 },
    { day: 'Fri', events: 2, speed: vehicle.type === 'Plane' ? 490 : 68 },
    { day: 'Sat', events: 0, speed: vehicle.type === 'Plane' ? 440 : 58 },
    { day: 'Sun', events: 1, speed: vehicle.type === 'Plane' ? 455 : 60 },
  ];

  const fuelEfficiencyData = [
    { day: 'Mon', efficiency: 8.2 },
    { day: 'Tue', efficiency: 8.5 },
    { day: 'Wed', efficiency: 7.9 },
    { day: 'Thu', efficiency: 8.1 },
    { day: 'Fri', efficiency: 8.4 },
    { day: 'Sat', efficiency: 8.8 },
    { day: 'Sun', efficiency: 8.6 },
  ];

  const mockHistory = [
    { time: '14:30', location: 'Main Distribution Center', status: 'Departed' },
    { time: '12:15', location: 'North Highway Junction', status: 'Passing' },
    { time: '10:00', location: 'Port Terminal A', status: 'Arrived' },
    { time: '08:45', location: 'Industrial Park East', status: 'Departed' },
    { time: '06:30', location: 'Fleet Depot 4', status: 'Started Shift' },
  ];

  const maintenanceHistory = [
    { date: 'Jan 12, 2026', type: 'Routine', desc: 'Oil change & filter replacement', status: 'Completed' },
    { date: 'Nov 05, 2025', type: 'Repair', desc: 'Brake pad replacement (Front)', status: 'Completed' },
    { date: 'Aug 20, 2025', type: 'Inspection', desc: 'Annual safety certification', status: 'Completed' },
  ];

  const routeHistoryData = Array.from({ length: 24 }, (_, i) => ({
    time: `${23 - i}h ago`,
    speed: Math.floor(Math.random() * (vehicle.type === 'Plane' ? 100 : 40)) + (vehicle.type === 'Plane' ? 400 : 30),
    altitude: vehicle.type === 'Plane' ? Math.floor(Math.random() * 5000) + 30000 : Math.floor(Math.random() * 100) + 50
  })).reverse();

  const statusColors = {
    'Active': 'bg-emerald-500',
    'Maintenance': 'bg-rose-500',
    'Idle': 'bg-amber-500',
  };

  const statusTextColors = {
    'Active': 'text-emerald-600 bg-emerald-50 border-emerald-100',
    'Maintenance': 'text-rose-600 bg-rose-50 border-rose-100',
    'Idle': 'text-amber-600 bg-amber-50 border-amber-100',
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex justify-end pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm pointer-events-auto"
        />
        
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md bg-white h-full shadow-2xl pointer-events-auto flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                {vehicle.type === 'Plane' ? <Plane className="w-6 h-6 text-slate-600" /> : <Truck className="w-6 h-6 text-slate-600" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{vehicle.id}</h2>
                <p className="text-sm text-slate-500">{vehicle.type} Unit</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2",
                  isUpdating ? "opacity-50 grayscale" : statusTextColors[vehicle.status]
                )}>
                  {isUpdating && <Loader2 className="w-3 h-3 animate-spin" />}
                  {vehicle.status}
                </span>
                {isUpdating && (
                  <span className="text-[10px] font-bold text-brand-accent animate-pulse uppercase tracking-widest">
                    Updating...
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Activity className="w-4 h-4" />
                Last updated: Just now
              </div>
            </div>

            {/* Main Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Driver</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{vehicle.driver}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Gauge className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Current Speed</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{vehicle.speed || 0} {vehicle.type === 'Plane' ? 'knots' : 'km/h'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Fuel className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Fuel Level</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">{vehicle.fuelLevel}%</p>
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full",
                        vehicle.fuelLevel < 20 ? "bg-rose-500" : "bg-emerald-500"
                      )}
                      style={{ width: `${vehicle.fuelLevel}%` }}
                    />
                  </div>
                </div>
                {/* Fuel Efficiency Trend */}
                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efficiency Trend</span>
                    <span className="text-[10px] font-bold text-emerald-600">Avg: 8.4 km/L</span>
                  </div>
                  <div className="h-10 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={fuelEfficiencyData}>
                        <Line 
                          type="monotone" 
                          dataKey="efficiency" 
                          stroke="#10b981" 
                          strokeWidth={2} 
                          dot={false}
                          isAnimationActive={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            border: 'none', 
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            padding: '4px 8px'
                          }}
                          labelStyle={{ display: 'none' }}
                          formatter={(value: number) => [`${value} km/L`, 'Efficiency']}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Thermometer className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Engine Temp</span>
                </div>
                <p className={cn(
                  "text-sm font-bold",
                  (vehicle.temperature || 0) > 90 ? "text-rose-600" : "text-slate-900"
                )}>
                  {vehicle.temperature || 0}°C
                </p>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setIsMaintenanceModalOpen(true)}
                className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl hover:border-brand-accent hover:bg-blue-50 transition-all group shadow-sm"
              >
                <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-white transition-colors mb-2">
                  <Wrench className="w-4 h-4 text-slate-600 group-hover:text-brand-accent" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 group-hover:text-brand-accent uppercase tracking-tight text-center">Schedule</span>
              </button>
              <button 
                onClick={() => {
                  const el = document.getElementById('service-history');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl hover:border-brand-accent hover:bg-blue-50 transition-all group shadow-sm"
              >
                <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-white transition-colors mb-2">
                  <History className="w-4 h-4 text-slate-600 group-hover:text-brand-accent" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 group-hover:text-brand-accent uppercase tracking-tight text-center">History</span>
              </button>
              <button 
                onClick={() => {
                  const el = document.getElementById('status-update');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl hover:border-brand-accent hover:bg-blue-50 transition-all group shadow-sm"
              >
                <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-white transition-colors mb-2">
                  <Settings2 className="w-4 h-4 text-slate-600 group-hover:text-brand-accent" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 group-hover:text-brand-accent uppercase tracking-tight text-center">Status</span>
              </button>
            </div>

            {/* Telemetry */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-accent" />
                  Telemetry Data
                </h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Odometer</span>
                  <span className="text-xs font-bold text-slate-900">{(vehicle.odometer || 0).toLocaleString()} km</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Altitude</span>
                  <span className="text-xs font-bold text-slate-900">
                    {vehicle.altitude !== undefined 
                      ? `${vehicle.altitude.toLocaleString()} ${vehicle.type === 'Plane' ? 'ft' : 'm'}` 
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-accent" />
                Vehicle Specifications
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Weight Capacity</span>
                  <span className="text-xs font-bold text-slate-900">{vehicle.weightCapacity || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Volume Capacity</span>
                  <span className="text-xs font-bold text-slate-900">{vehicle.volumeCapacity || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-accent" />
                Current Location
              </h3>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-sm text-slate-700 font-medium">{vehicle.location}</p>
                <p className="text-xs text-slate-500 mt-1">Coordinates: {vehicle.lat.toFixed(4)}, {vehicle.lng.toFixed(4)}</p>
              </div>
            </div>

            {/* Location History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-brand-accent" />
                  Location History (24h)
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mock Data</span>
              </div>
              <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                {mockHistory.map((item, index) => (
                  <div key={index} className="relative">
                    <div className={cn(
                      "absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm",
                      index === 0 ? "bg-brand-accent scale-125" : "bg-slate-300"
                    )} />
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{item.location}</span>
                        <span className="text-[10px] font-bold text-slate-400">{item.time}</span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Performance Metrics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Safety Score</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">98/100</span>
                </div>
                <div className="flex items-center justify-between p-3 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Next Maintenance</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">March 24, 2026</span>
                </div>
              </div>
            </div>

            {/* Maintenance History */}
            <div id="service-history" className="space-y-4">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="group flex items-center gap-2"
                >
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 group-hover:text-brand-accent transition-colors">
                    <Wrench className="w-4 h-4 text-brand-accent" />
                    Maintenance History
                  </h3>
                </button>
                <button 
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="text-[10px] font-bold text-brand-accent hover:text-blue-700 uppercase tracking-widest transition-colors"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {maintenanceHistory.map((record, index) => (
                  <div key={index} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{record.date}</span>
                      <span className={cn(
                        "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter",
                        record.type === 'Repair' ? "bg-rose-50 text-rose-600" : 
                        record.type === 'Routine' ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600"
                      )}>
                        {record.type}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">{record.desc}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                      <span className="text-[9px] font-medium text-slate-500 uppercase tracking-tight">{record.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Driver Performance Metrics */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-accent" />
                Driver Performance
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Gauge className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg. Speed</p>
                      <p className="text-sm font-bold text-slate-900">{vehicle.type === 'Plane' ? '480 knots' : '62 km/h'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">+2% vs last week</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Harsh Braking</p>
                      <p className="text-sm font-bold text-slate-900">2 events <span className="text-xs font-normal text-slate-500">/ 100km</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">Above Target</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Timer className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Idle Time</p>
                      <p className="text-sm font-bold text-slate-900">12m <span className="text-xs font-normal text-slate-500">/ 8h shift</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">Optimal</span>
                  </div>
                </div>
              </div>

              {/* Performance Chart */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weekly Performance Trend</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-400">Events</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-400">Speed</span>
                    </div>
                  </div>
                </div>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                        dy={10}
                      />
                      <YAxis 
                        yAxisId="left"
                        orientation="left"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: '#94a3b8' }}
                        width={20}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: '#10b981' }}
                        width={30}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: 'none', 
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}
                      />
                      <Bar yAxisId="left" dataKey="events" radius={[4, 4, 0, 0]} barSize={20}>
                        {performanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.events > 2 ? '#f43f5e' : '#3b82f6'} />
                        ))}
                      </Bar>
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="speed" 
                        stroke="#10b981" 
                        strokeWidth={2} 
                        dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 5 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Route History Visualization */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-brand-accent" />
                  Route History (24h)
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-0.5 bg-brand-accent rounded-full" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Speed</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={routeHistoryData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="time" 
                        hide 
                      />
                      <YAxis 
                        hide 
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: 'none', 
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}
                        labelStyle={{ display: 'none' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="speed" 
                        stroke="#3b82f6" 
                        strokeWidth={2} 
                        dot={false}
                        activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between mt-2 px-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">24h ago</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Current</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div id="status-update" className="pt-4 space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Settings2 className="w-3 h-3" />
                  Update Status
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {(['Active', 'Idle', 'Maintenance'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setPendingStatus(status)}
                      disabled={vehicle.status === status}
                      className={cn(
                        "py-2 text-[10px] font-bold rounded-lg border transition-all",
                        vehicle.status === status
                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                          : "bg-white text-slate-600 border-slate-200 hover:border-brand-accent hover:text-brand-accent"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-xl">
                  <AnimatePresence mode="wait">
                    {isCalling ? (
                      <motion.div
                        key="calling"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-brand-accent p-4 flex flex-col items-center justify-center text-white"
                      >
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse mb-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest">Connecting to {vehicle.driver}...</p>
                      </motion.div>
                    ) : showContactInfo ? (
                      <motion.div
                        key="info"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-50 p-4 border border-slate-200 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <User className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Driver Contact</p>
                              <p className="text-xs font-bold text-slate-900">{vehicle.driver}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setShowContactInfo(false)}
                            className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                          >
                            <X className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="p-3 bg-white rounded-lg border border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Phone</span>
                            <span className="text-xs font-bold text-slate-900">+1 (555) 012-3456</span>
                          </div>
                          <button className="w-full py-2 bg-brand-accent text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors">
                            <MessageSquare className="w-3 h-3" /> Send Direct Message
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <button 
                        onClick={() => setIsCalling(true)}
                        className="w-full py-3 bg-brand-accent text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        Contact Driver
                      </button>
                    )}
                  </AnimatePresence>
                </div>
                <button 
                  onClick={() => setIsMaintenanceModalOpen(true)}
                  className="w-full py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <Wrench className="w-4 h-4" />
                  Schedule Maintenance
                </button>
                <button className="w-full py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all">
                  View Service History
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <ScheduleMaintenanceModal 
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        vehicle={vehicle}
      />

      <MaintenanceHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        vehicle={vehicle}
      />

      <ConfirmationModal
        isOpen={!!pendingStatus}
        onClose={() => setPendingStatus(null)}
        onConfirm={async () => {
          if (pendingStatus && onUpdateStatus) {
            setIsUpdating(true);
            try {
              await onUpdateStatus(vehicle.id, pendingStatus);
            } finally {
              setIsUpdating(false);
            }
          }
          setPendingStatus(null);
        }}
        title="Update Vehicle Status"
        message={`Are you sure you want to change the status of ${vehicle.id} to ${pendingStatus}? This will be reflected in the global fleet monitoring system.`}
        confirmLabel="Update Status"
        variant="info"
      />
    </AnimatePresence>
  );
}
