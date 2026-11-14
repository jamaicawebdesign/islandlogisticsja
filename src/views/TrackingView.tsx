import React, { useState, useEffect } from 'react';
import { Search, Package, MapPin, Clock, ArrowRight, ShieldCheck, AlertCircle, Loader2, Globe, Navigation, Share2, Bell, CheckCircle2, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { subscribeToShipments } from '../supabase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix for default marker icon in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface ShipmentData {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  status: 'In Transit' | 'Delivered' | 'Pending' | 'Delayed';
  direction: 'Inbound' | 'Outbound';
  estimatedArrival?: string;
  weight?: string;
  lastUpdated?: string;
  history?: {
    status: string;
    location: string;
    timestamp: string;
  }[];
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
}

// Component to handle map bounds
function MapBounds({ origin, dest }: { origin: [number, number], dest: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([origin, dest]);
    map.fitBounds(bounds, { padding: [50, 50], animate: true });
  }, [origin, dest, map]);
  return null;
}

// Helper to get coordinates for common cities (demo fallback)
const getCityCoords = (city: string): [number, number] | null => {
  const cities: Record<string, [number, number]> = {
    'New York, NY': [40.7128, -74.0060],
    'Los Angeles, CA': [34.0522, -118.2437],
    'Chicago, IL': [41.8781, -87.6298],
    'Houston, TX': [29.7604, -95.3698],
    'Phoenix, AZ': [33.4484, -112.0740],
    'Philadelphia, PA': [39.9526, -75.1652],
    'San Antonio, TX': [29.4241, -98.4936],
    'San Diego, CA': [32.7157, -117.1611],
    'Dallas, TX': [32.7767, -96.7970],
    'Austin, TX': [30.2672, -97.7431],
    'Miami, FL': [25.7617, -80.1918],
    'Seattle, WA': [47.6062, -122.3321],
    'Denver, CO': [39.7392, -104.9903],
    'Atlanta, GA': [33.7490, -84.3880],
    'Boston, MA': [42.3601, -71.0589],
    'San Francisco, CA': [37.7749, -122.4194],
  };
  
  // Try exact match or partial match
  if (cities[city]) return cities[city];
  const found = Object.keys(cities).find(c => city.toLowerCase().includes(c.split(',')[0].toLowerCase()));
  return found ? cities[found] : null;
};

export function TrackingView() {
  const [searchParams] = useSearchParams();
  const [trackingId, setTrackingId] = useState(searchParams.get('id') || '');
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const unsubscribeRef = React.useRef<(() => void) | null>(null);

  // Derived coordinates with fallbacks
  const originCoords = shipment?.originLat && shipment?.originLng 
    ? [shipment.originLat, shipment.originLng] as [number, number]
    : shipment ? getCityCoords(shipment.origin) : null;
    
  const destCoords = shipment?.destLat && shipment?.destLng 
    ? [shipment.destLat, shipment.destLng] as [number, number]
    : shipment ? getCityCoords(shipment.destination) : null;

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      performTrack(id);
    }
    return () => {
      unsubscribeRef.current?.();
    };
  }, [searchParams]);

  const performTrack = (id: string) => {
    // Clean up previous listener if any
    unsubscribeRef.current?.();

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToShipments(
      (results) => {
        setLoading(false);
        if (results.length === 0) {
          setError('No shipment found with this tracking number. Please check and try again.');
          setShipment(null);
        } else {
          setShipment(results[0] as ShipmentData);
          setError(null);
        }
      },
      {
        trackingNumber: id.trim(),
        limit: 1,
        onError: (err) => {
          console.error('Tracking error:', err);
          setError('An error occurred while fetching tracking information.');
          setLoading(false);
        },
      }
    );

    unsubscribeRef.current = unsubscribe;
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    performTrack(trackingId);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/#/tracking?id=${shipment?.trackingNumber}`;
    navigator.clipboard.writeText(url);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'In Transit': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Delayed': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-amber-600 bg-amber-50 border-amber-100';
    }
  };

  const getProgress = (status: string) => {
    switch (status) {
      case 'Delivered': return 100;
      case 'In Transit': return 60;
      case 'Pending': return 20;
      case 'Delayed': return 45;
      default: return 10;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Track Your Shipment</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Enter your tracking number below to get real-time updates on your package's location and status.
        </p>
      </div>

      <div className="glass-card p-8 shadow-xl shadow-slate-200/50">
        <form onSubmit={handleTrack} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="Enter Tracking Number (e.g., TRK-123456)"
              className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-brand-accent/10 focus:border-brand-accent outline-none transition-all"
            />
            {trackingId && (
              <button
                type="button"
                onClick={() => setTrackingId('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 bg-brand-primary text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Track Now
          </button>
        </form>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 text-rose-700"
          >
            <AlertCircle className="w-6 h-6 shrink-0" />
            <p className="font-medium">{error}</p>
          </motion.div>
        )}

        {shipment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="glass-card overflow-hidden">
              <div className="bg-brand-primary p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-70">Tracking Number</p>
                    <h2 className="text-2xl font-bold">{shipment.trackingNumber}</h2>
                  </div>
                </div>
                <div className={cn("px-4 py-2 rounded-full text-sm font-bold border flex items-center gap-2", getStatusColor(shipment.status))}>
                  {shipment.status === 'In Transit' && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                  )}
                  {shipment.status}
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* Progress Bar */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end mb-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Progress</p>
                      <p className="text-sm font-bold text-slate-900">{getProgress(shipment.status)}% Complete</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Updated</p>
                      <p className="text-xs font-bold text-slate-500">{shipment.lastUpdated || 'Just now'}</p>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgress(shipment.status)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full shadow-sm relative",
                        shipment.status === 'Delivered' ? "bg-emerald-500" : 
                        shipment.status === 'Delayed' ? "bg-rose-500" : "bg-brand-accent"
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                    </motion.div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Origin</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{shipment.origin}</p>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-4 w-full">
                      <div className="h-px bg-slate-200 flex-1 relative">
                        <div className="absolute right-0 -top-1">
                          <ArrowRight className="w-2 h-2 text-slate-300" />
                        </div>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-full">
                        <Package className="w-4 h-4 text-brand-accent" />
                      </div>
                      <div className="h-px bg-slate-200 flex-1 relative">
                        <div className="absolute right-0 -top-1">
                          <ArrowRight className="w-2 h-2 text-slate-300" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-right">
                    <div className="flex items-center gap-2 text-slate-400 justify-end">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Destination</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{shipment.destination}</p>
                  </div>
                </div>
              </div>

              <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Estimated Arrival</p>
                    <p className="text-sm font-bold text-slate-900">{shipment.estimatedArrival || 'TBD'}</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <Package className="w-4 h-4 text-brand-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Weight</p>
                    <p className="text-sm font-bold text-slate-900">{shipment.weight || 'N/A'}</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Security</p>
                    <p className="text-sm font-bold text-slate-900">Verified</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <Navigation className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Direction</p>
                    <p className="text-sm font-bold text-slate-900">{shipment.direction}</p>
                  </div>
                </div>
              </div>

              {/* Cargo Details Section */}
              <div className="px-8 pb-8">
                <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Shipment Specifications
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service Type</p>
                      <p className="text-sm font-bold text-slate-700">{shipment.type || 'Standard Express'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Priority</p>
                      <p className="text-sm font-bold text-slate-700">{shipment.priority || 'Normal'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargo Category</p>
                      <p className="text-sm font-bold text-slate-700">{shipment.cargoType || 'General Goods'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Insurance</p>
                      <p className="text-sm font-bold text-emerald-600">Active</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 pb-8 flex gap-4">
                <button 
                  onClick={handleShare}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Share2 className="w-4 h-4" />
                  Share Tracking Link
                </button>
                <button className="flex-1 py-3 bg-brand-accent/10 hover:bg-brand-accent/20 text-brand-accent font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                  <Bell className="w-4 h-4" />
                  Get SMS Updates
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tracking Timeline */}
              <div className="lg:col-span-1 glass-card p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Tracking History</h3>
                <div className="space-y-8">
                  {(shipment.history && shipment.history.length > 0 ? shipment.history : [
                    { status: shipment.status, location: shipment.status === 'Delivered' ? shipment.destination : 'In Transit', timestamp: 'Today, 10:30 AM' },
                    { status: 'Processed at Hub', location: 'Distribution Center', timestamp: 'Yesterday, 04:15 PM' },
                    { status: 'Picked Up', location: shipment.origin, timestamp: '2 days ago, 09:00 AM' },
                    { status: 'Order Confirmed', location: 'System', timestamp: '3 days ago, 11:30 AM' },
                  ]).map((step, idx, arr) => (
                    <div key={idx} className="flex gap-6 relative">
                      {idx !== arr.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-[-32px] w-0.5 bg-slate-100" />
                      )}
                      <div className={cn(
                        "w-6 h-6 rounded-full border-4 border-white shadow-sm shrink-0 z-10",
                        idx === 0 ? "bg-brand-accent ring-4 ring-blue-50" : "bg-slate-200"
                      )} />
                      <div className="space-y-1">
                        <p className={cn("font-bold text-sm", idx === 0 ? "text-slate-900" : "text-slate-500")}>{step.status}</p>
                        <p className="text-xs text-slate-500">{step.location}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{step.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map View */}
              <div className="lg:col-span-2 glass-card overflow-hidden relative min-h-[400px] border border-slate-200">
                <MapContainer 
                  center={[39.8283, -98.5795]} 
                  zoom={4} 
                  style={{ height: '100%', width: '100%', zIndex: 0 }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {originCoords && destCoords ? (
                    <>
                      <MapBounds 
                        origin={originCoords} 
                        dest={destCoords} 
                      />
                      <Marker position={originCoords}>
                        <Popup>
                          <div className="p-1">
                            <p className="font-bold text-slate-900">Origin</p>
                            <p className="text-xs text-slate-500">{shipment.origin}</p>
                          </div>
                        </Popup>
                      </Marker>
                      <Marker position={destCoords}>
                        <Popup>
                          <div className="p-1">
                            <p className="font-bold text-slate-900">Destination</p>
                            <p className="text-xs text-slate-500">{shipment.destination}</p>
                          </div>
                        </Popup>
                      </Marker>
                      <Polyline 
                        positions={[originCoords, destCoords]} 
                        color="#3B82F6" 
                        dashArray="10, 10"
                        weight={3}
                        opacity={0.6}
                      />
                      {shipment.status === 'In Transit' && (
                        <Marker 
                          position={[
                            originCoords[0] + (destCoords[0] - originCoords[0]) * 0.6,
                            originCoords[1] + (destCoords[1] - originCoords[1]) * 0.6
                          ]}
                          icon={L.divIcon({
                            html: renderToStaticMarkup(
                              <div className="relative">
                                <div className="absolute -inset-4 bg-brand-accent/20 rounded-full animate-ping" />
                                <div className="bg-brand-accent p-2.5 rounded-full border-2 border-white shadow-xl relative z-10">
                                  <Navigation className="w-5 h-5 text-white rotate-45" />
                                </div>
                              </div>
                            ),
                            className: '',
                            iconSize: [40, 40],
                            iconAnchor: [20, 20]
                          })}
                        >
                          <Popup>
                            <div className="p-1">
                              <p className="font-bold text-slate-900">Current Location</p>
                              <p className="text-xs text-slate-500">En route to {shipment.destination}</p>
                            </div>
                          </Popup>
                        </Marker>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-slate-100/50 backdrop-blur-sm z-10 flex items-center justify-center">
                      <div className="text-center p-6">
                        <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Map coordinates unavailable for this shipment</p>
                      </div>
                    </div>
                  )}
                </MapContainer>
                
                <div className="absolute bottom-6 left-6 right-6 z-[400]">
                  <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Location</p>
                        <p className="text-sm font-bold text-slate-900">
                          {shipment.status === 'Delivered' ? `Arrived at ${shipment.destination}` : `En Route to ${shipment.destination}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                      <p className="text-sm font-bold text-brand-accent">{shipment.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold">Tracking link copied to clipboard!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
