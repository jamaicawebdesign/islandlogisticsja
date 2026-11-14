import React, { useState, useEffect } from 'react';
import { StatCard } from '../components/StatCard';
import { ShipmentList } from '../components/ShipmentList';
import { AnalyticsChart } from '../components/AnalyticsChart';
import { FleetStatus } from '../components/FleetStatus';
import { FleetMap } from '../components/FleetMap';
import { CreateShipmentModal } from '../components/CreateShipmentModal';
import { VehicleDetailSidebar } from '../components/VehicleDetailSidebar';
import { ShipmentDetailModal } from '../components/ShipmentDetailModal';
import { 
  Package, 
  Truck, 
  Clock, 
  DollarSign,
  Download,
  Search,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Vehicle, Shipment, InventoryItem, Order } from '../types';
import {
  subscribeToShipments,
  subscribeToVehicles,
  subscribeToInventory,
  subscribeToOrders,
  deleteShipment,
  updateShipment,
  updateVehicleStatus,
} from '../supabase';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export function DashboardView() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [highlightedVehicleId, setHighlightedVehicleId] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState({
    totalShipments: 0,
    activeFleet: 0,
    onTimeRate: '98.2%',
    monthlyRevenue: 0
  });
  const [inventoryStats, setInventoryStats] = useState({
    total: 0,
    lowStock: 0
  });
  const [orderStats, setOrderStats] = useState({
    pending: 0,
    total: 0
  });
  const [quickTrackingId, setQuickTrackingId] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const unsubscribeShipments = subscribeToShipments(
      (shipmentData) => {
        setShipments(shipmentData);
      },
      { limit: 10 }
    );

    const unsubscribeVehicles = subscribeToVehicles((vehicleData) => {
      setVehicles(vehicleData);
      setStats((prev) => ({
        ...prev,
        activeFleet: vehicleData.filter((v) => v.status === 'Active').length,
      }));
    });

    const unsubscribeStats = subscribeToShipments(
      (allShipments) => {
        const total = allShipments.length;
        const revenue = allShipments.reduce((acc, s) => acc + (s.value || 0), 0);
        const delivered = allShipments.filter((s) => s.status === 'Delivered').length;
        const onTimeRate = total > 0 ? ((delivered / total) * 100).toFixed(1) + '%' : '100%';

        setStats((prev) => ({
          ...prev,
          totalShipments: total,
          monthlyRevenue: revenue,
          onTimeRate,
        }));
      },
      {
        onError: (error) => {
          console.error('Error fetching stats:', error);
        },
      }
    );

    const unsubscribeInventory = subscribeToInventory((items) => {
      const total = items.length;
      const lowStock = items.filter(
        (item) => item.status === 'Low Stock' || item.status === 'Out of Stock'
      ).length;
      setInventoryStats({ total, lowStock });
    });

    const unsubscribeOrders = subscribeToOrders((orders) => {
      const total = orders.length;
      const pending = orders.filter((o) => o.status === 'Pending').length;
      setOrderStats({ total, pending });
    });

    return () => {
      unsubscribeShipments();
      unsubscribeVehicles();
      unsubscribeStats();
      unsubscribeInventory();
      unsubscribeOrders();
    };
  }, []);

  const delayedShipments = shipments.filter(s => s.status === 'Delayed');

  const handleDeleteShipment = async (id: string) => {
    try {
      await deleteShipment(id);
      setToast({ message: 'Shipment deleted successfully', type: 'info' });
    } catch (error) {
      console.error('Error deleting shipment:', error);
      setToast({ message: 'Failed to delete shipment. You may not have permission.', type: 'info' });
    }
  };

  const handleUpdateShipmentStatus = async (id: string, status: Shipment['status']) => {
    try {
      await updateShipment(id, { status });
      setToast({ message: `Shipment status updated to ${status}`, type: 'success' });
    } catch (error) {
      console.error('Error updating shipment status:', error);
    }
  };

  const handleUpdateShipmentHistory = async (id: string, history: Shipment['history']) => {
    try {
      await updateShipment(id, { history });
      setToast({ message: 'Tracking history updated successfully', type: 'success' });
    } catch (error) {
      console.error('Error updating shipment history:', error);
    }
  };

  const handleVehicleClick = (vehicle: Vehicle) => {
    setHighlightedVehicleId(vehicle.id);
  };

  const handleViewDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setHighlightedVehicleId(vehicle.id);
  };

  const handleUpdateVehicleStatus = async (id: string, status: Vehicle['status']) => {
    try {
      await updateVehicleStatus(id, status);
    } catch (error) {
      console.error('Error updating vehicle status:', error);
    }
  };

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTrackingId.trim()) {
      navigate(`/tracking?id=${quickTrackingId.trim()}`);
    }
  };

  const handleDownloadReport = () => {
    // Mock report download
    const reportData = "Date,Total Shipments,Active Fleet,Revenue\n2026-03-11,1284,42,142500";
    const blob = new Blob([reportData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'logitrack-daily-report.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log('Report download started!');
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Logistics Overview</h1>
          <p className="text-slate-500 mt-1">Welcome back, Alex. Here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
          <button 
            onClick={() => navigate('/orders')}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Manage Orders
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-brand-accent text-white font-semibold rounded-xl hover:bg-blue-600 transition-all shadow-md shadow-blue-200"
          >
            New Shipment
          </button>
        </div>
      </div>

      <CreateShipmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div className={cn(
              "px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border",
              toast.type === 'success' ? "bg-emerald-900 border-emerald-800 text-white" : "bg-slate-900 border-slate-800 text-white"
            )}>
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <Package className="w-5 h-5 text-blue-400" />
              )}
              <span className="text-sm font-bold">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Shipments" 
          value={stats.totalShipments.toLocaleString()} 
          icon={Package} 
          trend={{ value: 12.5, isPositive: true }}
          color="blue"
        />
        <StatCard 
          title="Active Fleet" 
          value={stats.activeFleet.toString()} 
          icon={Truck} 
          trend={{ value: 2.4, isPositive: true }}
          color="emerald"
        />
        <StatCard 
          title="On-Time Delivery" 
          value={stats.onTimeRate} 
          icon={Clock} 
          trend={{ value: 0.8, isPositive: true }}
          color="amber"
        />
        <StatCard 
          title="Total Value" 
          value={`$${stats.monthlyRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          trend={{ value: 8.2, isPositive: true }}
          color="rose"
        />
      </div>

      {/* Map Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <FleetMap 
          vehicles={vehicles} 
          onVehicleClick={handleVehicleClick} 
          onViewDetails={handleViewDetails}
          selectedVehicleId={highlightedVehicleId}
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <AnalyticsChart />
          <ShipmentList 
            shipments={shipments} 
            onDelete={handleDeleteShipment}
            onUpdateStatus={handleUpdateShipmentStatus}
            onViewDetails={setSelectedShipment}
          />
        </div>
        
        <div className="space-y-8">
          {/* Quick Tracking Widget */}
          <div className="glass-card p-6 bg-brand-primary text-white">
            <h3 className="text-lg font-bold mb-4">Quick Tracking</h3>
            <form onSubmit={handleQuickTrack} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input 
                  type="text" 
                  value={quickTrackingId}
                  onChange={(e) => setQuickTrackingId(e.target.value)}
                  placeholder="Enter Tracking ID..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm focus:ring-2 focus:ring-white/30 outline-none transition-all placeholder:text-white/30"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-2.5 bg-white text-brand-primary font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-black/20"
              >
                Track Shipment
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <FleetStatus 
            vehicles={vehicles} 
            onVehicleClick={handleVehicleClick} 
            onViewDetails={handleViewDetails}
            selectedVehicleId={highlightedVehicleId}
          />
          
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Urgent Alerts</h3>
            <div className="space-y-3">
              {orderStats.pending > 0 && (
                <div 
                  onClick={() => navigate('/orders')}
                  className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3 cursor-pointer hover:bg-blue-100 transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 text-blue-500 mt-1" />
                  <div>
                    <p className="text-sm font-bold text-blue-900">Pending Orders</p>
                    <p className="text-xs text-blue-700 mt-0.5">{orderStats.pending} new orders require processing.</p>
                  </div>
                </div>
              )}
              {inventoryStats.lowStock > 0 && (
                <div 
                  onClick={() => navigate('/inventory')}
                  className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3 cursor-pointer hover:bg-amber-100 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-1" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">Low Stock Alert</p>
                    <p className="text-xs text-amber-700 mt-0.5">{inventoryStats.lowStock} items are low or out of stock.</p>
                  </div>
                </div>
              )}
              {delayedShipments.length > 0 ? (
                delayedShipments.map(shipment => (
                  <div key={shipment.id} className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
                    <div className="w-2 h-2 bg-rose-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="text-sm font-bold text-rose-900">Delayed Shipment #{shipment.trackingNumber}</p>
                      <p className="text-xs text-rose-700 mt-0.5">En route from {shipment.origin} to {shipment.destination}.</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5"></div>
                  <div>
                    <p className="text-sm font-bold text-emerald-900">All Systems Normal</p>
                    <p className="text-xs text-emerald-700 mt-0.5">No urgent alerts at this time.</p>
                  </div>
                </div>
              )}
              {vehicles.filter(v => v.status === 'Maintenance').map(vehicle => (
                <div key={vehicle.id} className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5"></div>
                  <div>
                    <p className="text-sm font-bold text-amber-900">Maintenance: {vehicle.id}</p>
                    <p className="text-xs text-amber-700 mt-0.5">Vehicle is currently in maintenance status.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <VehicleDetailSidebar 
        vehicle={selectedVehicle} 
        onClose={() => setSelectedVehicle(null)} 
        onUpdateStatus={handleUpdateVehicleStatus}
      />
      <ShipmentDetailModal
        shipment={selectedShipment}
        onClose={() => setSelectedShipment(null)}
        onUpdateStatus={handleUpdateShipmentStatus}
        onUpdateHistory={handleUpdateShipmentHistory}
        onDelete={handleDeleteShipment}
      />
    </div>
  );
}
