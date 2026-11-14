import React, { useState } from 'react';
import { Shipment, TrackingUpdate } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Package, MapPin, Clock, User, Weight, DollarSign, Activity, CheckCircle2, AlertTriangle, Calendar, History, Edit2, Save, XCircle, Trash2, Map as MapIcon, ArrowDownLeft, ArrowUpRight, Shield, Info, UserPlus, RefreshCw, Eye } from 'lucide-react';
import { cn } from '../lib/utils';
import { ConfirmationModal } from './ConfirmationModal';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';

// Custom icons for map markers
const createMapIcon = (color: string) => {
  const iconHtml = renderToStaticMarkup(
    <div style={{ 
      backgroundColor: 'white', 
      padding: '6px', 
      borderRadius: '50%', 
      border: `2px solid ${color}`,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <MapPin size={16} color={color} fill={color} fillOpacity={0.2} />
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const originIcon = createMapIcon('#3B82F6'); // brand-accent
const destIcon = createMapIcon('#10B981');   // emerald-500

interface ShipmentDetailModalProps {
  shipment: Shipment | null;
  onClose: () => void;
  onUpdateHistory?: (id: string, history: TrackingUpdate[]) => void;
  onUpdateStatus?: (id: string, status: Shipment['status']) => void;
  onDelete?: (id: string) => void;
}

export function ShipmentDetailModal({ shipment, onClose, onUpdateHistory, onUpdateStatus, onDelete }: ShipmentDetailModalProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<TrackingUpdate | null>(null);
  const [isAddingHistory, setIsAddingHistory] = useState(false);
  const [newHistoryEvent, setNewHistoryEvent] = useState<TrackingUpdate>({
    status: 'Processed',
    location: '',
    timestamp: new Date().toLocaleString(),
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  if (!shipment) return null;

  const statusColors = {
    'In Transit': 'text-blue-600 bg-blue-50 border-blue-100',
    'Delivered': 'text-emerald-600 bg-emerald-50 border-emerald-100',
    'Pending': 'text-amber-600 bg-amber-50 border-amber-100',
    'Delayed': 'text-rose-600 bg-rose-50 border-rose-100',
    'Processed': 'text-slate-600 bg-slate-50 border-slate-100',
    'Picked Up': 'text-indigo-600 bg-indigo-50 border-indigo-100',
  };

  const statusIcons = {
    'In Transit': <Activity className="w-4 h-4" />,
    'Delivered': <CheckCircle2 className="w-4 h-4" />,
    'Pending': <Clock className="w-4 h-4" />,
    'Delayed': <AlertTriangle className="w-4 h-4" />,
    'Processed': <Package className="w-4 h-4" />,
    'Picked Up': <MapPin className="w-4 h-4" />,
  };

  const handleStartEdit = (index: number, update: TrackingUpdate) => {
    setEditingIndex(index);
    setEditValues({ ...update });
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editValues && onUpdateHistory && shipment.history) {
      const newHistory = [...shipment.history];
      newHistory[editingIndex] = editValues;
      onUpdateHistory(shipment.id, newHistory);
      setEditingIndex(null);
      setEditValues(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValues(null);
  };

  const handleAddHistory = () => {
    if (onUpdateHistory && shipment) {
      const newHistory = [newHistoryEvent, ...(shipment.history || [])];
      onUpdateHistory(shipment.id, newHistory);
      setIsAddingHistory(false);
      setNewHistoryEvent({
        status: 'Processed',
        location: '',
        timestamp: new Date().toLocaleString(),
      });
    }
  };

  const handleStatusChange = (status: Shipment['status']) => {
    if (onUpdateStatus && shipment) {
      onUpdateStatus(shipment.id, status);
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (onDelete && shipment) {
      try {
        await onDelete(shipment.id);
        onClose();
      } catch (error) {
        console.error('Deletion failed in modal:', error);
      }
    }
    setIsDeleteConfirmOpen(false);
  };

  const displayHistory = shipment.history || [];

  return (
    <AnimatePresence>
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
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                <Package className="w-6 h-6 text-brand-accent" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">Shipment Details</h2>
                  {shipment.priority && (
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                      shipment.priority === 'High' || shipment.priority === 'Urgent' ? "bg-rose-50 text-rose-600 border-rose-100" :
                      shipment.priority === 'Medium' ? "bg-amber-50 text-amber-600 border-amber-100" :
                      "bg-slate-50 text-slate-600 border-slate-100"
                    )}>
                      {shipment.priority} Priority
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 font-mono">#{shipment.trackingNumber}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* Status Section */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3 relative">
                {isUpdatingStatus ? (
                  <div className="flex items-center gap-2 bg-white p-1 rounded-full border border-slate-200 shadow-sm">
                    {(['Pending', 'In Transit', 'Delivered', 'Delayed'] as Shipment['status'][]).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold transition-all",
                          shipment.status === s ? "bg-brand-accent text-white" : "hover:bg-slate-100 text-slate-600"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                    <button 
                      onClick={() => setIsUpdatingStatus(false)}
                      className="p-1 hover:bg-slate-100 rounded-full"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsUpdatingStatus(true)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-sm font-bold border flex items-center gap-2 hover:opacity-80 transition-all",
                      statusColors[shipment.status]
                    )}
                  >
                    {statusIcons[shipment.status]}
                    {shipment.status}
                    <Edit2 className="w-3 h-3 ml-1 opacity-50" />
                  </button>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Est. Delivery</p>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-2 justify-end">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {shipment.estimatedArrival}
                </p>
              </div>
            </div>

            {/* Map Preview Section */}
            {shipment.originLat && shipment.originLng && shipment.destLat && shipment.destLng && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MapIcon className="w-4 h-4" />
                  Route Preview
                </h3>
                <div className="h-[200px] rounded-2xl overflow-hidden border border-slate-200 z-0 relative">
                  <MapContainer 
                    center={[(shipment.originLat + shipment.destLat) / 2, (shipment.originLng + shipment.destLng) / 2]} 
                    zoom={4} 
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                    zoomControl={false}
                    dragging={false}
                    doubleClickZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker 
                      position={[shipment.originLat, shipment.originLng]}
                      icon={originIcon}
                    />
                    <Marker 
                      position={[shipment.destLat, shipment.destLng]}
                      icon={destIcon}
                    />
                    <Polyline 
                      positions={[
                        [shipment.originLat, shipment.originLng],
                        [shipment.destLat, shipment.destLng]
                      ]}
                      color="#3B82F6"
                      weight={3}
                      dashArray="10, 10"
                      opacity={0.6}
                    />
                  </MapContainer>
                  <div className="absolute bottom-3 right-3 z-[400] flex flex-col gap-1">
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-brand-accent" />
                      <span className="text-[10px] font-bold text-slate-600 uppercase">Origin</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-600 uppercase">Destination</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Route */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Route Information
                </h3>
                <div className="relative pl-6 space-y-8">
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-100" />
                  
                  <div className="relative">
                    <div className="absolute -left-[23px] top-1 w-4 h-4 rounded-full border-2 border-brand-accent bg-white z-10" />
                    <p className="text-xs font-bold text-slate-400 uppercase">Origin</p>
                    <p className="text-base font-bold text-slate-900">{shipment.origin}</p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[23px] top-1 w-4 h-4 rounded-full border-2 border-emerald-500 bg-white z-10" />
                    <p className="text-xs font-bold text-slate-400 uppercase">Destination</p>
                    <p className="text-base font-bold text-slate-900">{shipment.destination}</p>
                  </div>
                </div>
              </div>

              {/* Shipment Details */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Cargo Specifications
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <User className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Customer</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{shipment.customer || 'N/A'}</p>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Package className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Cargo Type</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{shipment.cargoType || 'Standard Cargo'}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Weight className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Weight</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{shipment.weight}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Value</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">${shipment.value.toLocaleString()}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <ArrowDownLeft className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Direction</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{shipment.direction}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Package className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Type</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{shipment.type || 'Standard'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-4">
                <div className="p-2 bg-white rounded-xl border border-slate-100">
                  <UserPlus className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Created By</p>
                  <p className="text-xs font-bold text-slate-700">{shipment.createdBy || 'System'}</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-4">
                <div className="p-2 bg-white rounded-xl border border-slate-100">
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Created At</p>
                  <p className="text-xs font-bold text-slate-700">
                    {shipment.createdAt?.toDate ? shipment.createdAt.toDate().toLocaleString() : 
                     shipment.createdAt ? new Date(shipment.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-4">
                <div className="p-2 bg-white rounded-xl border border-slate-100">
                  <RefreshCw className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Updated</p>
                  <p className="text-xs font-bold text-slate-700">
                    {shipment.updatedAt?.toDate ? shipment.updatedAt.toDate().toLocaleString() : 
                     shipment.updatedAt ? new Date(shipment.updatedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-4">
              <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                <h4 className="text-sm font-bold text-blue-900 mb-2">Priority Handling</h4>
                <p className="text-xs text-blue-700 leading-relaxed">
                  This shipment is marked as <span className="font-bold">{shipment.priority || 'Standard'}</span> priority. 
                  Please ensure all documentation is verified at the {shipment.destination} checkpoint.
                </p>
              </div>

              {shipment.specialHandling && (
                <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100">
                  <h4 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Special Handling Instructions
                  </h4>
                  <p className="text-xs text-amber-700 leading-relaxed whitespace-pre-wrap">
                    {shipment.specialHandling}
                  </p>
                </div>
              )}
            </div>

            {/* Tracking History */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Tracking History
                </h3>
                <button 
                  onClick={() => setIsAddingHistory(true)}
                  className="text-[10px] font-bold text-brand-accent hover:underline uppercase tracking-widest"
                >
                  + Add Update
                </button>
              </div>
              
              <AnimatePresence>
                {isAddingHistory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
                        <select 
                          className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-white outline-none"
                          value={newHistoryEvent.status}
                          onChange={(e) => setNewHistoryEvent({...newHistoryEvent, status: e.target.value})}
                        >
                          {Object.keys(statusIcons).map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Location</label>
                        <input 
                          type="text"
                          placeholder="e.g. Distribution Center"
                          className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-white outline-none"
                          value={newHistoryEvent.location}
                          onChange={(e) => setNewHistoryEvent({...newHistoryEvent, location: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setIsAddingHistory(false)}
                        className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleAddHistory}
                        disabled={!newHistoryEvent.location}
                        className="px-4 py-1.5 text-xs font-bold bg-brand-accent text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50"
                      >
                        Add Event
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {displayHistory.length > 0 ? (
                <div className="relative pl-8 space-y-6">
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />
                  
                  {displayHistory.map((update, index) => (
                    <div key={index} className="relative group">
                      <div className={cn(
                        "absolute -left-[25px] top-1 w-5 h-5 rounded-full border-2 bg-white z-10 flex items-center justify-center",
                        index === 0 ? "border-brand-accent" : "border-slate-200"
                      )}>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          index === 0 ? "bg-brand-accent" : "bg-slate-300"
                        )} />
                      </div>
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          {editingIndex === index ? (
                            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase">Location</label>
                                  <input 
                                    type="text"
                                    className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white"
                                    value={editValues?.location}
                                    onChange={(e) => setEditValues(prev => prev ? { ...prev, location: e.target.value } : null)}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase">Timestamp</label>
                                  <input 
                                    type="text"
                                    className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white"
                                    value={editValues?.timestamp}
                                    onChange={(e) => setEditValues(prev => prev ? { ...prev, timestamp: e.target.value } : null)}
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={handleCancelEdit}
                                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                  title="Cancel"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={handleSaveEdit}
                                  className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors"
                                  title="Save"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={cn(
                                  "text-xs font-bold px-2 py-0.5 rounded-md border",
                                  statusColors[update.status as keyof typeof statusColors] || 'text-slate-600 bg-slate-50 border-slate-100'
                                )}>
                                  {update.status}
                                </span>
                                <span className="text-sm font-bold text-slate-900">{update.location}</span>
                              </div>
                              <p className="text-xs text-slate-500">{update.timestamp}</p>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {editingIndex !== index && (
                            <button 
                              onClick={() => handleStartEdit(index, update)}
                              className="p-1.5 text-slate-400 hover:text-brand-accent hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Edit Step"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {index === 0 && (
                            <span className="text-[10px] font-bold text-brand-accent bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                              Latest Update
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No tracking history available for this shipment yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
            <button 
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="px-4 py-3 text-rose-600 font-bold hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
              title="Delete Shipment"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
            >
              Close Details
            </button>
            <button className="flex-1 py-3 bg-brand-accent text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-md shadow-blue-100">
              Download Manifest
            </button>
          </div>
        </motion.div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Shipment"
        message={`Are you sure you want to delete shipment ${shipment.trackingNumber}? This action cannot be undone and will remove all associated tracking data.`}
        confirmLabel="Delete Shipment"
        variant="danger"
      />
    </AnimatePresence>
  );
}
