import React, { useState } from 'react';
import { Shipment } from '../types';
import { MoreVertical, MapPin, Clock, Trash2, CheckCircle2, X, Activity, Edit3, Link as LinkIcon, ExternalLink, Copy, AlertCircle, ChevronDown, Eye, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { ConfirmationModal } from './ConfirmationModal';
import { motion, AnimatePresence } from 'motion/react';

interface ShipmentListProps {
  shipments?: Shipment[];
  title?: string;
  subtitle?: string;
  onDelete?: (id: string) => void;
  onEdit?: (shipment: Shipment) => void;
  onDuplicate?: (shipment: Shipment) => void;
  onViewDetails?: (shipment: Shipment) => void;
  onUpdateStatus?: (id: string, status: Shipment['status']) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkUpdateStatus?: (ids: string[], status: Shipment['status']) => void;
}

export function ShipmentList({ 
  shipments = [], 
  title = "Recent Shipments", 
  subtitle = "Real-time tracking status",
  onDelete,
  onEdit,
  onDuplicate,
  onViewDetails,
  onUpdateStatus,
  onBulkDelete,
  onBulkUpdateStatus
}: ShipmentListProps) {
  const [shipmentToDelete, setShipmentToDelete] = useState<string | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [hoveredShipment, setHoveredShipment] = useState<{ shipment: Shipment; x: number; y: number } | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [updateResult, setUpdateResult] = useState<{ id: string; type: 'success' | 'error' } | null>(null);
  const [isBulkStatusDropdownOpen, setIsBulkStatusDropdownOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Shipment; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: keyof Shipment) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedShipments = React.useMemo(() => {
    if (!sortConfig) return shipments;

    return [...shipments].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [shipments, sortConfig]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Update selectedIds when shipments change to remove any deleted items
  React.useEffect(() => {
    const currentIds = new Set(shipments.map(s => s.id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      let changed = false;
      prev.forEach(id => {
        if (!currentIds.has(id)) {
          next.delete(id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [shipments]);

  const toggleSelectAll = () => {
    if (selectedIds.size === shipments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(shipments.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDeleteConfirm = async () => {
    if (onBulkDelete) {
      try {
        await onBulkDelete(Array.from(selectedIds));
        setSelectedIds(new Set());
      } catch (error) {
        console.error('Bulk delete failed:', error);
      }
    }
    setIsBulkDeleteConfirmOpen(false);
  };

  const handleBulkUpdate = async (status: Shipment['status']) => {
    if (onBulkUpdateStatus) {
      const count = selectedIds.size;
      try {
        await onBulkUpdateStatus(Array.from(selectedIds), status);
        setSelectedIds(new Set());
        showToast(`Updated ${count} shipment${count > 1 ? 's' : ''} to ${status}`);
      } catch (error) {
        console.error('Bulk update failed:', error);
        showToast('Bulk update failed', 'error');
      }
    }
  };

  const handleMarkAsDelivered = async (shipment: Shipment) => {
    if (onUpdateStatus) {
      try {
        await onUpdateStatus(shipment.id, 'Delivered');
        showToast(`Shipment ${shipment.trackingNumber} marked as delivered`);
      } catch (error) {
        console.error('Update status failed:', error);
        showToast('Failed to mark as delivered', 'error');
      }
    }
  };

  const handleCopyTrackingLink = (trackingNumber: string) => {
    const url = `${window.location.origin}/#/tracking?id=${trackingNumber}`;
    navigator.clipboard.writeText(url);
    showToast('Tracking link copied to clipboard');
  };

  const statusColors = {
    'In Transit': 'bg-blue-50 text-blue-600 border-blue-100',
    'Delivered': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Pending': 'bg-amber-50 text-amber-600 border-amber-100',
    'Delayed': 'bg-rose-50 text-rose-600 border-rose-100',
  };

  const handleDeleteConfirm = async () => {
    if (shipmentToDelete && onDelete) {
      try {
        await onDelete(shipmentToDelete);
        // Success toast is handled by parent view
      } catch (error) {
        // Error is handled by the parent view's toast
        console.error('Deletion failed in list:', error);
      }
    }
    setShipmentToDelete(null);
  };

  return (
    <div className="glass-card overflow-hidden relative">
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-20 bg-brand-accent text-white p-4 flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold">{selectedIds.size} Shipments Selected</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => setIsBulkStatusDropdownOpen(!isBulkStatusDropdownOpen)}
                  className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                >
                  Update Status
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isBulkStatusDropdownOpen && "rotate-180")} />
                </button>
                
                <AnimatePresence>
                  {isBulkStatusDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-30"
                    >
                      {(['Pending', 'In Transit', 'Delivered', 'Delayed'] as Shipment['status'][]).map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            handleBulkUpdate(s);
                            setIsBulkStatusDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-3 transition-colors text-slate-700 font-medium"
                        >
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            s === 'Pending' ? "bg-slate-400" :
                            s === 'In Transit' ? "bg-blue-500" :
                            s === 'Delivered' ? "bg-emerald-500" :
                            "bg-rose-500"
                          )} />
                          {s}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={() => setIsBulkDeleteConfirmOpen(true)}
                className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected
              </button>
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <button className="text-sm font-bold text-brand-accent hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-all">View All</button>
      </div>

      <div className="overflow-x-auto">
        {shipments.length > 0 ? (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-[10px] uppercase tracking-widest font-black border-b border-slate-100">
                <th className="px-6 py-4 w-10">
                  <div className="flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-brand-accent focus:ring-brand-accent/20 cursor-pointer transition-all hover:border-brand-accent"
                      checked={shipments.length > 0 && selectedIds.size === shipments.length}
                      onChange={toggleSelectAll}
                    />
                  </div>
                </th>
                <th className="px-6 py-4 hover:bg-slate-100/50 transition-colors cursor-default">Tracking ID</th>
                <th 
                  className="px-6 py-4 hover:bg-slate-100/50 transition-colors cursor-pointer group/sort"
                  onClick={() => handleSort('customer')}
                >
                  <div className="flex items-center gap-2">
                    Customer
                    {sortConfig?.key === 'customer' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-accent" /> : <ArrowDown className="w-3 h-3 text-brand-accent" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover/sort:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 hover:bg-slate-100/50 transition-colors cursor-default">Type</th>
                <th className="px-6 py-4 hover:bg-slate-100/50 transition-colors cursor-default">Route</th>
                <th 
                  className="px-6 py-4 hover:bg-slate-100/50 transition-colors cursor-pointer group/sort"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {sortConfig?.key === 'status' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-accent" /> : <ArrowDown className="w-3 h-3 text-brand-accent" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover/sort:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 hover:bg-slate-100/50 transition-colors cursor-pointer group/sort"
                  onClick={() => handleSort('estimatedArrival')}
                >
                  <div className="flex items-center gap-2">
                    Estimated Arrival
                    {sortConfig?.key === 'estimatedArrival' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-accent" /> : <ArrowDown className="w-3 h-3 text-brand-accent" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover/sort:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 hover:bg-slate-100/50 transition-colors cursor-default">Weight</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {sortedShipments.map((shipment) => (
                  <motion.tr 
                    key={shipment.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, backgroundColor: 'rgba(244, 63, 94, 0.1)' }}
                    transition={{ duration: 0.2 }}
                    onClick={() => onViewDetails?.(shipment)}
                    onMouseEnter={(e) => setHoveredShipment({ shipment, x: e.clientX, y: e.clientY })}
                    onMouseMove={(e) => setHoveredShipment({ shipment, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setHoveredShipment(null)}
                    className={cn(
                      "hover:bg-slate-100/40 transition-colors group cursor-pointer even:bg-slate-50/30",
                      selectedIds.has(shipment.id) && "bg-blue-50/80 hover:bg-blue-100/60"
                    )}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-slate-300 text-brand-accent focus:ring-brand-accent/20 cursor-pointer transition-all hover:border-brand-accent"
                          checked={selectedIds.has(shipment.id)}
                          onChange={() => toggleSelect(shipment.id)}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-sm font-medium text-slate-900">{shipment.trackingNumber}</span>
                        {shipment.priority && (
                          <div className="flex items-center gap-1.5">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              shipment.priority === 'High' ? "bg-rose-500 animate-pulse" :
                              shipment.priority === 'Urgent' ? "bg-rose-600 animate-pulse" :
                              shipment.priority === 'Medium' ? "bg-amber-500" : "bg-slate-300"
                            )} />
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wider",
                              shipment.priority === 'High' || shipment.priority === 'Urgent' ? "text-rose-600" :
                              shipment.priority === 'Medium' ? "text-amber-600" : "text-slate-400"
                            )}>
                              {shipment.priority}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">{shipment.customer || 'Private Client'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                        shipment.direction === 'Inbound' ? "bg-indigo-100 text-indigo-700" : "bg-orange-100 text-orange-700"
                      )}>
                        {shipment.direction}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {shipment.origin}
                        </div>
                        <div className="w-px h-2 bg-slate-200 ml-1.5"></div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {shipment.destination}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center relative">
                        {editingStatusId === shipment.id ? (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9, x: -10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            className="absolute left-0 z-30 bg-white p-1 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-1 min-w-max"
                          >
                            {(['Pending', 'In Transit', 'Delivered', 'Delayed'] as Shipment['status'][]).map((s) => (
                              <button
                                key={s}
                                disabled={updatingStatusId === shipment.id}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (onUpdateStatus) {
                                    setUpdatingStatusId(shipment.id);
                                    try {
                                      await onUpdateStatus(shipment.id, s);
                                      setUpdateResult({ id: shipment.id, type: 'success' });
                                      showToast(`Status updated to ${s}`);
                                      setTimeout(() => {
                                        setUpdateResult(null);
                                        setEditingStatusId(null);
                                        setUpdatingStatusId(null);
                                      }, 1000);
                                    } catch (error) {
                                      console.error('Status update failed:', error);
                                      setUpdateResult({ id: shipment.id, type: 'error' });
                                      showToast('Failed to update status', 'error');
                                      setTimeout(() => {
                                        setUpdateResult(null);
                                        setUpdatingStatusId(null);
                                      }, 2000);
                                    }
                                  } else {
                                    setEditingStatusId(null);
                                  }
                                }}
                                className={cn(
                                  "px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap flex items-center gap-2",
                                  shipment.status === s 
                                    ? "bg-brand-accent text-white shadow-sm shadow-blue-100" 
                                    : "hover:bg-slate-100 text-slate-600",
                                  updatingStatusId === shipment.id && "opacity-50 cursor-not-allowed"
                                )}
                              >
                                {updatingStatusId === shipment.id && shipment.status !== s && s === s && (
                                  // This is just to show which one was clicked if we wanted, 
                                  // but let's just show a general loader if updating
                                  null
                                )}
                                {s}
                                {updateResult?.id === shipment.id && updateResult.type === 'success' && shipment.status === s && (
                                  <CheckCircle2 className="w-3 h-3 text-white" />
                                )}
                              </button>
                            ))}
                            {updatingStatusId === shipment.id && (
                              <div className="px-2">
                                <Activity className="w-3.5 h-3.5 text-brand-accent animate-spin" />
                              </div>
                            )}
                            <button 
                              onClick={() => setEditingStatusId(null)}
                              disabled={updatingStatusId === shipment.id}
                              className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          </motion.div>
                        ) : (
                          <button 
                            onClick={() => setEditingStatusId(shipment.id)}
                            className="group/status focus:outline-none"
                            title="Click to change status"
                          >
                            <AnimatePresence mode="wait">
                              <motion.span 
                                key={shipment.status}
                                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                transition={{ 
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 30,
                                  opacity: { duration: 0.2 }
                                }}
                                className={cn(
                                  "px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 w-fit whitespace-nowrap transition-all group-hover/status:border-brand-accent/30 group-hover/status:shadow-sm",
                                  statusColors[shipment.status]
                                )}
                              >
                                {shipment.status === 'Delivered' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                {shipment.status}
                                <Edit3 className="w-3 h-3 ml-0.5 opacity-0 group-hover/status:opacity-100 transition-opacity text-slate-400" />
                              </motion.span>
                            </AnimatePresence>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {shipment.estimatedArrival}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {shipment.weight}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => onViewDetails?.(shipment)}
                          className="p-1 text-slate-400 hover:text-brand-accent hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyTrackingLink(shipment.trackingNumber);
                          }}
                          className="p-1 text-slate-400 hover:text-brand-accent hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Copy Tracking Link"
                        >
                          <LinkIcon className="w-5 h-5" />
                        </button>
                        <a 
                          href={`/#/tracking?id=${shipment.trackingNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-400 hover:text-brand-accent hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Open Tracking Page"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                        {shipment.status !== 'Delivered' && onUpdateStatus && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsDelivered(shipment);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-emerald-600 transition-all shadow-sm"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Confirm Delivery
                          </button>
                        )}
                        {onEdit && (
                          <button 
                            onClick={() => onEdit(shipment)}
                            className="p-1 text-slate-400 hover:text-brand-accent hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Edit Shipment"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                        )}
                        {onDuplicate && (
                          <button 
                            onClick={() => onDuplicate(shipment)}
                            className="p-1 text-slate-400 hover:text-brand-accent hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Duplicate Shipment"
                          >
                            <Copy className="w-5 h-5" />
                          </button>
                        )}
                        <button 
                          onClick={() => setShipmentToDelete(shipment.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Delete Shipment"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="relative group/menu">
                          <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-30">
                            <button
                              onClick={() => onViewDetails?.(shipment)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 transition-colors text-slate-600"
                            >
                              <Eye className="w-4 h-4 text-slate-400" />
                              View Details
                            </button>
                            <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-50 mt-1 pt-2">Update Status</div>
                            {(['Pending', 'In Transit', 'Delivered', 'Delayed'] as Shipment['status'][]).map((s) => (
                              <button
                                key={s}
                                onClick={() => {
                                  onUpdateStatus?.(shipment.id, s);
                                  showToast(`Status updated to ${s}`);
                                }}
                                className={cn(
                                  "w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 transition-colors",
                                  shipment.status === s ? "text-brand-accent font-semibold bg-blue-50/50" : "text-slate-600"
                                )}
                              >
                                <div className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  s === 'Pending' ? "bg-slate-400" :
                                  s === 'In Transit' ? "bg-blue-500" :
                                  s === 'Delivered' ? "bg-emerald-500" :
                                  "bg-rose-500"
                                )} />
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-sm font-medium">No shipments to display in this view.</p>
          </div>
        )}
      </div>

      {/* Click-away overlay for inline status editing and bulk dropdown */}
      {(editingStatusId || isBulkStatusDropdownOpen) && (
        <div 
          className="fixed inset-0 z-20 cursor-default" 
          onClick={() => {
            setEditingStatusId(null);
            setIsBulkStatusDropdownOpen(false);
          }} 
        />
      )}

      {/* Quick View Hover Popup */}
      <AnimatePresence>
        {hoveredShipment && shipments.some(s => s.id === hoveredShipment.shipment.id) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{ 
              position: 'fixed', 
              left: hoveredShipment.x + 20, 
              top: hoveredShipment.y + 20,
              pointerEvents: 'none',
              zIndex: 200
            }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 min-w-[220px] overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent" />
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                <p className="text-sm font-bold text-slate-900">{hoveredShipment.shipment.customer || 'Private Client'}</p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      hoveredShipment.shipment.status === 'Delivered' ? "bg-emerald-500" :
                      hoveredShipment.shipment.status === 'Delayed' ? "bg-rose-500" :
                      hoveredShipment.shipment.status === 'In Transit' ? "bg-blue-500" : "bg-amber-500"
                    )} />
                    <span className="text-xs font-bold text-slate-700">{hoveredShipment.shipment.status}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weight</p>
                  <p className="text-xs font-bold text-slate-900">{hoveredShipment.shipment.weight}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!shipmentToDelete}
        onClose={() => setShipmentToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Shipment"
        message={`Are you sure you want to delete shipment ${shipments.find(s => s.id === shipmentToDelete)?.trackingNumber || ''}? This action cannot be undone and will remove all associated tracking data.`}
        confirmLabel="Delete Shipment"
        variant="danger"
      />

      <ConfirmationModal
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Multiple Shipments"
        message={`Are you sure you want to delete ${selectedIds.size} shipments? This action is irreversible and will remove all selected tracking records.`}
        confirmLabel={`Delete ${selectedIds.size} Shipments`}
        variant="danger"
      />

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
              toast.type === 'success' ? "bg-emerald-600 text-white border-emerald-500" :
              toast.type === 'error' ? "bg-rose-600 text-white border-rose-500" :
              "bg-slate-800 text-white border-slate-700"
            )}>
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5" />
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
