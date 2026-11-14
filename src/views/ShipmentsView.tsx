import React, { useState, useEffect } from 'react';
import { ShipmentList } from '../components/ShipmentList';
import { CreateShipmentModal } from '../components/CreateShipmentModal';
import { ShipmentDetailModal } from '../components/ShipmentDetailModal';
import { Search, Filter, Plus, Download, ArrowDownLeft, ArrowUpRight, Calendar, X, Activity, Package, CheckCircle2 } from 'lucide-react';
import { Shipment } from '../types';
import { cn } from '../lib/utils';
import {
  subscribeToShipments,
  deleteShipment,
  updateShipment,
  bulkDeleteShipments,
  bulkUpdateShipmentStatus,
} from '../supabase';
import { motion, AnimatePresence } from 'motion/react';

export function ShipmentsView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [activeTab, setActiveTab] = useState<'All' | 'Inbound' | 'Outbound'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All Statuses');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const unsubscribe = subscribeToShipments(
      (shipmentsData) => {
        setShipments(shipmentsData);
        setIsLoading(false);
      },
      {
        onError: (error) => {
          console.error('Error fetching shipments:', error);
          setIsLoading(false);
        },
      }
    );

    return () => unsubscribe();
  }, []);

  const handleExportCSV = () => {
    if (filteredShipments.length === 0) {
      setToast({ message: 'No data available to export', type: 'info' });
      return;
    }

    const headers = [
      'Tracking ID', 
      'Customer', 
      'Origin', 
      'Destination', 
      'Status', 
      'Direction', 
      'Est. Arrival', 
      'Weight', 
      'Value',
      'Cargo Type',
      'Priority'
    ];

    const rows = filteredShipments.map(s => [
      s.trackingNumber,
      s.customer || 'N/A',
      s.origin,
      s.destination,
      s.status,
      s.direction,
      s.estimatedArrival,
      s.weight,
      s.value,
      s.type || 'Standard',
      s.priority || 'Normal'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        const val = String(cell ?? '');
        return `"${val.replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `logitrack-shipments-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setToast({ message: `Successfully exported ${filteredShipments.length} shipments`, type: 'success' });
    } catch (error) {
      console.error('Export failed:', error);
      setToast({ message: 'Failed to export data', type: 'info' });
    }
  };

  const handleDeleteShipment = async (id: string) => {
    try {
      await deleteShipment(id);
      setToast({ message: 'Shipment deleted successfully', type: 'info' });
    } catch (error) {
      console.error('Error deleting shipment:', error);
      setToast({ message: 'Failed to delete shipment. You may not have permission.', type: 'info' });
    }
  };

  const handleUpdateStatus = async (id: string, status: Shipment['status']) => {
    try {
      await updateShipment(id, { status });
      setToast({ message: `Status updated to ${status}`, type: 'success' });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleUpdateHistory = async (id: string, history: Shipment['history']) => {
    try {
      await updateShipment(id, { history });
      setToast({ message: 'Tracking history updated successfully', type: 'success' });
    } catch (error) {
      console.error('Error updating history:', error);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await bulkDeleteShipments(ids);
      setToast({ message: `Successfully deleted ${ids.length} shipments`, type: 'info' });
    } catch (error) {
      console.error('Error in bulk delete:', error);
      setToast({ message: 'Failed to delete some shipments. You may not have permission.', type: 'info' });
    }
  };

  const handleBulkUpdateStatus = async (ids: string[], status: Shipment['status']) => {
    try {
      await bulkUpdateShipmentStatus(ids, status);
      setToast({ message: `Successfully updated ${ids.length} shipments to ${status}`, type: 'success' });
    } catch (error) {
      console.error('Error in bulk status update:', error);
    }
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesTab = activeTab === 'All' || shipment.direction === activeTab;
    const matchesSearch = 
      shipment.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.destination.toLowerCase().includes(searchQuery.toLowerCase());
    
    const shipmentDate = shipment.estimatedArrival || '';
    const matchesStartDate = !startDate || shipmentDate >= startDate;
    const matchesEndDate = !endDate || shipmentDate <= endDate;
    const matchesStatus = statusFilter === 'All Statuses' || shipment.status === statusFilter;

    return matchesTab && matchesSearch && matchesStartDate && matchesEndDate && matchesStatus;
  });

  const isAnyFilterActive = searchQuery !== '' || startDate !== '' || endDate !== '' || statusFilter !== 'All Statuses' || activeTab !== 'All';

  const clearAllFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setStatusFilter('All Statuses');
    setActiveTab('All');
  };

  const handleEditShipment = (shipment: Shipment) => {
    setEditingShipment(shipment);
    setIsModalOpen(true);
  };

  const handleDuplicateShipment = (shipment: Shipment) => {
    const { id, trackingNumber, createdAt, updatedAt, ...rest } = shipment;
    setEditingShipment({ ...rest, id: '', trackingNumber: '' } as any);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingShipment(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Shipments</h1>
          <p className="text-slate-500 mt-1">Manage and track all active and historical shipments.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-accent text-white font-semibold rounded-xl hover:bg-blue-600 transition-all shadow-md shadow-blue-200"
          >
            <Plus className="w-4 h-4" />
            Create Shipment
          </button>
        </div>
      </div>

      <CreateShipmentModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        shipment={editingShipment}
      />

      <div className="flex flex-col gap-6">
        {/* Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
          {[
            { id: 'All', label: 'All Shipments', icon: null },
            { id: 'Inbound', label: 'Inbound', icon: ArrowDownLeft },
            { id: 'Outbound', label: 'Outbound', icon: ArrowUpRight },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-white text-brand-accent shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by ID, destination, or customer..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-brand-accent/20 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-4 w-full md:w-auto items-center">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input 
                type="date" 
                className="bg-transparent text-xs font-medium text-slate-600 outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-slate-300 text-xs">to</span>
              <input 
                type="date" 
                className="bg-transparent text-xs font-medium text-slate-600 outline-none"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              {(startDate || endDate) && (
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="ml-1 p-1 hover:bg-slate-200 rounded-lg transition-all"
                  title="Clear date filter"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>
            <div className="flex gap-2 relative">
              <AnimatePresence>
                {isAnyFilterActive && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={clearAllFilters}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                    Clear All
                  </motion.button>
                )}
              </AnimatePresence>

              <div className="relative">
                <button 
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all outline-none min-w-[160px] justify-between",
                    statusFilter !== 'All Statuses' ? "text-brand-accent border-brand-accent/30 bg-blue-50/30" : "text-slate-600"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    {statusFilter}
                  </div>
                  <ArrowDownLeft className={cn("w-3 h-3 transition-transform duration-200", isStatusDropdownOpen ? "rotate-180" : "rotate-0")} />
                </button>

                <AnimatePresence>
                  {isStatusDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-30" 
                        onClick={() => setIsStatusDropdownOpen(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden py-2 z-40"
                      >
                        {['All Statuses', 'In Transit', 'Delivered', 'Pending', 'Delayed'].map((status) => (
                          <button
                            key={status}
                            onClick={() => {
                              setStatusFilter(status);
                              setIsStatusDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2",
                              statusFilter === status ? "bg-blue-50 text-brand-accent font-bold" : "text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              status === 'All Statuses' ? "bg-slate-300" :
                              status === 'In Transit' ? "bg-blue-500" :
                              status === 'Delivered' ? "bg-emerald-500" :
                              status === 'Delayed' ? "bg-rose-500" : "bg-amber-500"
                            )} />
                            {status}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ShipmentList 
        shipments={filteredShipments} 
        title={`${activeTab} Shipments`}
        subtitle={isLoading ? "Loading shipments..." : `Showing ${filteredShipments.length} ${activeTab.toLowerCase()} deliveries`}
        onDelete={handleDeleteShipment}
        onEdit={handleEditShipment}
        onDuplicate={handleDuplicateShipment}
        onViewDetails={setSelectedShipment}
        onUpdateStatus={handleUpdateStatus}
        onBulkDelete={handleBulkDelete}
        onBulkUpdateStatus={handleBulkUpdateStatus}
      />
      
      <ShipmentDetailModal
        shipment={selectedShipment}
        onClose={() => setSelectedShipment(null)}
        onUpdateHistory={handleUpdateHistory}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDeleteShipment}
      />

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Activity className="w-10 h-10 text-brand-accent animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Fetching real-time data...</p>
        </div>
      )}

      {!isLoading && filteredShipments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-3xl border border-dashed border-slate-200">
          <Package className="w-12 h-12 text-slate-300" />
          <div className="text-center">
            <p className="text-slate-900 font-bold">No shipments found</p>
            <p className="text-slate-500 text-sm">Try adjusting your filters or create a new shipment.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
          >
            Create First Shipment
          </button>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110]"
          >
            <div className={cn(
              "px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 min-w-[300px]",
              toast.type === 'success' 
                ? "bg-emerald-600 text-white border-emerald-500" 
                : "bg-slate-800 text-white border-slate-700"
            )}>
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Activity className="w-5 h-5" />
              )}
              <span className="text-sm font-bold">{toast.message}</span>
              <button 
                onClick={() => setToast(null)}
                className="ml-auto p-1 hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
