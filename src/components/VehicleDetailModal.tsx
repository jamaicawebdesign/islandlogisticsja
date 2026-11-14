import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import { 
  X, Truck, Plane, User, MapPin, Fuel, Activity, 
  Shield, Calendar, Gauge, Thermometer, Package,
  Wrench, AlertCircle, Zap, Navigation, TrendingDown, TrendingUp,
  Phone, MessageSquare, Settings2, History, Loader2, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, calculateHealthScore } from '../lib/utils';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine,
  ComposedChart, Bar, Cell, BarChart
} from 'recharts';

interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (id: string, status: Vehicle['status']) => void;
}

export function VehicleDetailModal({ vehicle, isOpen, onClose, onUpdateStatus }: VehicleDetailModalProps) {
  const [isCalling, setIsCalling] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'telemetry' | 'maintenance' | 'performance'>('overview');

  useEffect(() => {
    if (isCalling) {
      const timer = setTimeout(() => {
        setIsCalling(false);
        setShowContactInfo(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCalling]);

  if (!vehicle) return null;

  const healthScore = calculateHealthScore(vehicle);

  const CircularProgress = ({ value, size = 48, strokeWidth = 4 }: { value: number, size?: number, strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;
    
    const color = value > 80 ? '#10b981' : value > 50 ? '#f59e0b' : '#f43f5e';

    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-[10px] font-black text-slate-900">{value}%</span>
      </div>
    );
  };

  const performanceData = [
    { day: 'Mon', events: 2, speed: vehicle.type === 'Plane' ? 450 : 65 },
    { day: 'Tue', events: 0, speed: vehicle.type === 'Plane' ? 480 : 62 },
    { day: 'Wed', events: 4, speed: vehicle.type === 'Plane' ? 460 : 70 },
    { day: 'Thu', events: 1, speed: vehicle.type === 'Plane' ? 470 : 64 },
    { day: 'Fri', events: 2, speed: vehicle.type === 'Plane' ? 490 : 68 },
    { day: 'Sat', events: 0, speed: vehicle.type === 'Plane' ? 440 : 58 },
    { day: 'Sun', events: 1, speed: vehicle.type === 'Plane' ? 455 : 60 },
  ];

  const maintenanceHistory = [
    { date: 'Jan 12, 2026', type: 'Routine', desc: 'Oil change & filter replacement', status: 'Completed', cost: '$145.00', technician: 'Alex Rivera' },
    { date: 'Nov 05, 2025', type: 'Repair', desc: 'Brake pad replacement (Front)', status: 'Completed', cost: '$380.00', technician: 'Sarah Chen' },
    { date: 'Aug 20, 2025', type: 'Inspection', desc: 'Annual safety certification', status: 'Completed', cost: '$85.00', technician: 'Marcus Thorne' },
    { date: 'Jun 15, 2025', type: 'Routine', desc: 'Tire rotation & pressure check', status: 'Completed', cost: '$60.00', technician: 'Alex Rivera' },
  ];

  const fleetComparisonData = [
    { metric: 'On-Time %', driver: 96.4, fleet: 94.2 },
    { metric: 'Safety Score', driver: 98, fleet: 92 },
    { metric: 'Fuel Eff. %', driver: 84, fleet: 78 },
    { metric: 'Harsh Braking', driver: 2, fleet: 1.5 },
  ];

  const telemetry24h = React.useMemo(() => Array.from({ length: 24 }, (_, i) => {
    const hour = (new Date().getHours() - (23 - i) + 24) % 24;
    const timeLabel = `${hour}:00`;
    
    // Base values based on vehicle type
    let baseSpeed = vehicle.type === 'Plane' ? 850 : 65;
    let baseAltitude = vehicle.type === 'Plane' ? 35000 : 0;
    
    // Add some variance
    const speed = Math.max(0, baseSpeed + Math.sin(i * 0.5) * (baseSpeed * 0.1) + (Math.random() - 0.5) * 20);
    const altitude = Math.max(0, baseAltitude + Math.cos(i * 0.5) * (baseAltitude * 0.05) + (Math.random() - 0.5) * 500);
    
    return {
      time: timeLabel,
      speed: Math.round(speed),
      altitude: Math.round(altitude),
    };
  }), [vehicle.type]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'telemetry', label: 'Telemetry', icon: Zap },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
  ];

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
            className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-accent text-white rounded-2xl shadow-lg shadow-blue-100">
                  {vehicle.type === 'Plane' ? <Plane className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-900">{vehicle.id}</h2>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest",
                        vehicle.status === 'Active' ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
                        vehicle.status === 'Maintenance' ? "text-rose-600 bg-rose-50 border-rose-100" :
                        "text-amber-600 bg-amber-50 border-amber-100"
                      )}>
                        {vehicle.status}
                      </span>
                      <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-help group relative">
                        <CircularProgress value={healthScore} size={40} strokeWidth={4} />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-0.5">Health</span>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            healthScore > 80 ? "text-emerald-600" : healthScore > 50 ? "text-amber-600" : "text-rose-600"
                          )}>
                            {healthScore > 80 ? 'Excellent' : healthScore > 50 ? 'Fair' : 'Critical'}
                          </span>
                        </div>
                        
                        {/* Tooltip-style info */}
                        <div className="absolute top-full left-0 mt-2 w-48 p-3 bg-slate-900 text-white rounded-xl text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-800">
                          <p className="font-bold mb-1 border-b border-white/10 pb-1">Health Calculation</p>
                          <ul className="space-y-1 opacity-80">
                            <li>• Fuel Level: {vehicle.fuelLevel}%</li>
                            <li>• Temperature: {vehicle.temperature || 0}°C</li>
                            <li>• Status: {vehicle.status}</li>
                            <li>• Speed: {vehicle.speed || 0} km/h</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 font-medium">{vehicle.type} Unit • Assigned to {vehicle.driver}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                  <ExternalLink className="w-5 h-5" />
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-100 px-6 bg-white sticky top-0 z-10">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative",
                    activeTab === tab.id 
                      ? "text-brand-accent" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-brand-accent rounded-t-full"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left Column: Key Stats */}
                      <div className="lg:col-span-2 space-y-8">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                            <div className="flex justify-between items-start mb-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fuel Level</p>
                              <Fuel className={cn("w-3.5 h-3.5", vehicle.fuelLevel < 20 ? "text-rose-500" : "text-emerald-500")} />
                            </div>
                            <div className="flex items-baseline gap-1 mb-2">
                              <span className="text-xl font-black text-slate-900">{vehicle.fuelLevel}%</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Current</span>
                            </div>
                            
                            {/* Sparkline Chart */}
                            <div className="h-10 w-full -mx-1">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={Array.from({ length: 12 }, (_, i) => ({
                                  val: Math.min(100, Math.max(0, vehicle.fuelLevel + Math.sin(i) * 10 + (10 - i) * 2))
                                }))}>
                                  <defs>
                                    <linearGradient id="fuelGradient" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor={vehicle.fuelLevel < 20 ? "#f43f5e" : "#10b981"} stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor={vehicle.fuelLevel < 20 ? "#f43f5e" : "#10b981"} stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <Area 
                                    type="monotone" 
                                    dataKey="val" 
                                    stroke={vehicle.fuelLevel < 20 ? "#f43f5e" : "#10b981"} 
                                    strokeWidth={2} 
                                    fillOpacity={1} 
                                    fill="url(#fuelGradient)" 
                                    isAnimationActive={false}
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">24h Trend</p>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Speed</p>
                            <div className="flex items-end gap-2">
                              <span className="text-xl font-black text-slate-900">{vehicle.speed || 0}</span>
                              <span className="text-[10px] font-bold text-slate-400 mb-1 uppercase">km/h</span>
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Temp</p>
                            <div className="flex items-end gap-2">
                              <span className="text-xl font-black text-slate-900">{vehicle.temperature || 0}°</span>
                              <Thermometer className={cn("w-4 h-4 mb-1", (vehicle.temperature || 0) > 90 ? "text-rose-500" : "text-slate-400")} />
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Health</p>
                            <div className="flex items-end gap-2">
                              <span className="text-xl font-black text-slate-900">{healthScore}</span>
                              <Shield className="w-4 h-4 mb-1 text-emerald-500" />
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-brand-accent" />
                            Current Location & Route
                          </h3>
                          <div className="h-64 bg-slate-100 rounded-2xl relative overflow-hidden flex items-center justify-center">
                             <div className="text-center">
                               <MapPin className="w-8 h-8 text-brand-accent mx-auto mb-2 animate-bounce" />
                               <p className="text-sm font-bold text-slate-900">{vehicle.location}</p>
                               <p className="text-xs text-slate-500">{vehicle.lat.toFixed(4)}, {vehicle.lng.toFixed(4)}</p>
                             </div>
                             {/* Mock Map Background */}
                             <div className="absolute inset-0 opacity-20 pointer-events-none">
                               <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                 <path d="M0 20 L20 40 L40 30 L60 50 L80 40 L100 60" stroke="#3b82f6" fill="none" strokeWidth="2" />
                                 <path d="M0 80 L30 70 L50 90 L70 80 L100 95" stroke="#3b82f6" fill="none" strokeWidth="2" />
                               </svg>
                             </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Driver & Quick Actions */}
                      <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <User className="w-4 h-4 text-brand-accent" />
                            Driver Information
                          </h3>
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                              <User className="w-8 h-8 text-slate-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">{vehicle.driver}</h4>
                              <p className="text-xs text-slate-500">Senior Logistics Specialist</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Shield className="w-3 h-3 text-emerald-500" />
                                <span className="text-[10px] font-bold text-emerald-600 uppercase">Top Rated</span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <button 
                              onClick={() => setIsCalling(true)}
                              disabled={isCalling}
                              className={cn(
                                "py-2.5 text-white text-[10px] font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                                isCalling ? "bg-amber-500 cursor-not-allowed" : "bg-brand-accent hover:bg-blue-600"
                              )}
                            >
                              {isCalling ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" /> Calling...
                                </>
                              ) : (
                                <>
                                  <Phone className="w-3 h-3" /> Call
                                </>
                              )}
                            </button>
                            <button 
                              onClick={() => {
                                console.log('Message sending feature is not implemented yet.');
                              }}
                              className="py-2.5 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 border border-slate-100"
                            >
                              <MessageSquare className="w-3 h-3" /> Message
                            </button>
                          </div>

                          <AnimatePresence>
                            {showContactInfo && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Direct Line</span>
                                    <span className="text-[10px] font-black text-slate-900">+1 (555) 0123-4567</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Radio ID</span>
                                    <span className="text-[10px] font-black text-slate-900">CH-72 / ALPHA</span>
                                  </div>
                                  <button 
                                    onClick={() => setShowContactInfo(false)}
                                    className="w-full py-1 text-[8px] font-bold text-emerald-700 hover:text-emerald-900 uppercase tracking-widest text-center"
                                  >
                                    Hide Contact Info
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Settings2 className="w-4 h-4 text-brand-accent" />
                            Operational Controls
                          </h3>
                          <div className="space-y-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Status</p>
                            <div className="grid grid-cols-1 gap-2">
                              {(['Active', 'Idle', 'Maintenance'] as const).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => onUpdateStatus?.(vehicle.id, status)}
                                  className={cn(
                                    "py-3 px-4 rounded-xl font-bold text-xs transition-all border-2 flex items-center justify-between",
                                    vehicle.status === status
                                      ? "bg-blue-50 border-brand-accent text-brand-accent"
                                      : "bg-white border-slate-50 text-slate-500 hover:border-slate-100 hover:bg-slate-50"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-2 h-2 rounded-full",
                                      status === 'Active' ? "bg-emerald-500" :
                                      status === 'Maintenance' ? "bg-rose-500" :
                                      "bg-amber-500"
                                    )} />
                                    {status}
                                  </div>
                                  {vehicle.status === status && <div className="w-1.5 h-1.5 bg-brand-accent rounded-full" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'telemetry' && (
                  <motion.div
                    key="telemetry"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-8"
                  >
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-brand-accent" />
                          24-Hour Telemetry (Speed & Altitude)
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-blue-500 rounded-full" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Speed (km/h)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Altitude (ft)</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={telemetry24h}>
                            <defs>
                              <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="altGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="time" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fontSize: 10, fill: '#94a3b8'}} 
                              interval={2}
                            />
                            <YAxis 
                              yAxisId="left"
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fontSize: 10, fill: '#3b82f6'}} 
                              label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#3b82f6', fontWeight: 'bold' } }}
                            />
                            <YAxis 
                              yAxisId="right"
                              orientation="right"
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fontSize: 10, fill: '#10b981'}} 
                              label={{ value: 'Altitude (ft)', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: '#10b981', fontWeight: 'bold' } }}
                            />
                            <Tooltip 
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area 
                              yAxisId="left"
                              type="monotone" 
                              dataKey="speed" 
                              stroke="#3b82f6" 
                              fillOpacity={1} 
                              fill="url(#speedGrad)" 
                              strokeWidth={3} 
                            />
                            <Area 
                              yAxisId="right"
                              type="monotone" 
                              dataKey="altitude" 
                              stroke="#10b981" 
                              fillOpacity={1} 
                              fill="url(#altGrad)" 
                              strokeWidth={3} 
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Fuel className="w-4 h-4 text-brand-accent" />
                          Fuel Consumption Analytics
                        </h3>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={performanceData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                              <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              />
                              <Line type="monotone" dataKey="speed" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-brand-accent" />
                          Engine Performance
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Oil Pressure</p>
                            <p className="text-lg font-black text-slate-900">42 PSI</p>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2">
                              <div className="h-full bg-emerald-500 w-[75%] rounded-full" />
                            </div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Coolant Temp</p>
                            <p className="text-lg font-black text-slate-900">195°F</p>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2">
                              <div className="h-full bg-amber-500 w-[85%] rounded-full" />
                            </div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Battery Voltage</p>
                            <p className="text-lg font-black text-slate-900">14.2V</p>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2">
                              <div className="h-full bg-emerald-500 w-[90%] rounded-full" />
                            </div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Load Factor</p>
                            <p className="text-lg font-black text-slate-900">68%</p>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2">
                              <div className="h-full bg-blue-500 w-[68%] rounded-full" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'maintenance' && (
                  <motion.div
                    key="maintenance"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-8"
                  >
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-brand-accent" />
                          Service History Records
                        </h3>
                        <button className="text-[10px] font-bold text-brand-accent uppercase tracking-widest hover:underline">
                          Download Logs
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/50">
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cost</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Technician</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {maintenanceHistory.map((record, index) => (
                              <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-6 py-4 text-xs font-bold text-slate-900">{record.date}</td>
                                <td className="px-6 py-4">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter",
                                    record.type === 'Repair' ? "bg-rose-50 text-rose-600" : 
                                    record.type === 'Routine' ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600"
                                  )}>
                                    {record.type}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-600">{record.desc}</td>
                                <td className="px-6 py-4 text-xs font-bold text-slate-900">{record.cost}</td>
                                <td className="px-6 py-4 text-xs text-slate-600">{record.technician}</td>
                                <td className="px-6 py-4">
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
                )}

                {activeTab === 'performance' && (
                  <motion.div
                    key="performance"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                       <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                         <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                           <TrendingUp className="w-4 h-4 text-brand-accent" />
                           Weekly Performance Score
                         </h3>
                         <div className="h-64 w-full">
                           <ResponsiveContainer width="100%" height="100%">
                             <ComposedChart data={performanceData}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                               <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                               <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                               <Tooltip 
                                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                               />
                               <Bar dataKey="events" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30}>
                                 {performanceData.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={entry.events > 2 ? '#f43f5e' : '#3b82f6'} />
                                 ))}
                               </Bar>
                               <Line type="monotone" dataKey="speed" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                             </ComposedChart>
                           </ResponsiveContainer>
                         </div>
                       </div>

                       <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                         <h3 className="text-sm font-bold text-slate-900">Efficiency Metrics</h3>
                         <div className="space-y-6">
                           <div className="space-y-2">
                             <div className="flex justify-between items-center">
                               <span className="text-xs font-medium text-slate-500">Safety Score</span>
                               <span className="text-xs font-bold text-emerald-600">98%</span>
                             </div>
                             <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-emerald-500 w-[98%]" />
                             </div>
                           </div>
                           <div className="space-y-2">
                             <div className="flex justify-between items-center">
                               <span className="text-xs font-medium text-slate-500">Fuel Efficiency</span>
                               <span className="text-xs font-bold text-blue-600">84%</span>
                             </div>
                             <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-blue-500 w-[84%]" />
                             </div>
                           </div>
                           <div className="space-y-2">
                             <div className="flex justify-between items-center">
                               <span className="text-xs font-medium text-slate-500">On-time Delivery</span>
                               <span className="text-xs font-bold text-purple-600">95%</span>
                             </div>
                             <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-purple-500 w-[95%]" />
                             </div>
                           </div>
                         </div>
                       </div>
                    </div>

                    {/* Driver Performance Metrics Section */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <User className="w-4 h-4 text-brand-accent" />
                          Driver Performance Metrics: {vehicle.driver}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last 30 Days</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                            <Activity className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">On-Time Pickups</p>
                            <h4 className="text-xl font-black text-slate-900">96.4%</h4>
                            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                              <TrendingUp className="w-3 h-3" /> +1.2%
                            </p>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                          <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Harsh Braking</p>
                            <h4 className="text-xl font-black text-slate-900">2</h4>
                            <p className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5">
                              <TrendingUp className="w-3 h-3" /> +1 vs avg
                            </p>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <Gauge className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg. Speed</p>
                            <h4 className="text-xl font-black text-slate-900">{vehicle.type === 'Plane' ? '465' : '64'}</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">km/h</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fleet Comparison Section */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-brand-accent" />
                          Fleet Benchmarking
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-brand-accent rounded-sm" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Driver</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-slate-200 rounded-sm" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Fleet Avg</span>
                          </div>
                        </div>
                      </div>

                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={fleetComparisonData} layout="vertical" margin={{ left: 20, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis 
                              dataKey="metric" 
                              type="category" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}}
                              width={100}
                            />
                            <Tooltip 
                              cursor={{fill: 'transparent'}}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="driver" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            <Bar dataKey="fleet" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <p className="text-xs text-blue-700 leading-relaxed">
                          <span className="font-bold">Performance Insight:</span> {vehicle.driver} is performing <span className="font-bold">above fleet average</span> in 3 out of 4 key metrics. Harsh braking incidents are slightly higher than average, suggesting a need for smoother deceleration coaching.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Online</span>
                </div>
                <div className="w-px h-4 bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Sync: Just Now</span>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                >
                  Close
                </button>
                <button className="px-6 py-2.5 bg-brand-accent text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-100">
                  Generate Report
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
