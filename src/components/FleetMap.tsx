import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MOCK_VEHICLES, Vehicle } from '../types';
import { Truck, Plane, MapPin, Loader2, Fuel } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { subscribeToVehicles } from '../supabase';
import { cn } from '../lib/utils';

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

// Custom icons for different vehicle types
const createCustomIcon = (type: string, status: string) => {
  const color = status === 'Active' ? '#10B981' : status === 'Maintenance' ? '#EF4444' : '#F59E0B';
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
      {type === 'Plane' ? <Plane size={16} color={color} /> : <Truck size={16} color={color} />}
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

interface FleetMapProps {
  vehicles?: Vehicle[];
  onVehicleClick?: (vehicle: Vehicle) => void;
  onViewDetails?: (vehicle: Vehicle) => void;
  onUpdateStatus?: (id: string, status: Vehicle['status']) => void;
  selectedVehicleId?: string | null;
}

// Component to handle map centering and smooth transitions
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

export function FleetMap({ vehicles: initialVehicles, onVehicleClick, onViewDetails, onUpdateStatus, selectedVehicleId }: FleetMapProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles || []);
  const [isLoading, setIsLoading] = useState(!initialVehicles);
  const defaultCenter: [number, number] = [39.8283, -98.5795]; // Center of USA

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const center: [number, number] = selectedVehicle ? [selectedVehicle.lat, selectedVehicle.lng] : defaultCenter;

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

  const filteredVehicles = vehicles.filter(v => v.status === 'Active');

  return (
    <div className="glass-card p-6 h-[500px] flex flex-col gap-4 relative">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Live Fleet Tracking</h3>
          <p className="text-sm text-slate-500">Real-time active vehicle positions across the network</p>
        </div>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 z-0 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
          </div>
        )}
        <MapContainer 
          center={center} 
          zoom={selectedVehicle ? 8 : 4} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <MapController center={center} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredVehicles.map((vehicle) => (
            <Marker 
              key={vehicle.id} 
              position={[vehicle.lat, vehicle.lng]}
              icon={createCustomIcon(vehicle.type, vehicle.status)}
              eventHandlers={{
                click: () => {
                  onVehicleClick?.(vehicle);
                },
              }}
            >
              <Popup>
                <div className="p-1 min-w-[160px]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-slate-900">{vehicle.id}</p>
                    <div className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter",
                      vehicle.status === 'Active' ? "bg-emerald-50 text-emerald-600" : 
                      vehicle.status === 'Maintenance' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {vehicle.status}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-[10px] text-slate-600">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {vehicle.location}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-600">
                      <div className="w-3 h-3 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                      </div>
                      Driver: <span className="font-bold text-slate-900">{vehicle.driver}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-600">
                      <Fuel className="w-3 h-3 text-slate-400" />
                      Fuel Level: <span className={cn(
                        "font-bold",
                        vehicle.fuelLevel < 20 ? "text-rose-500" : "text-emerald-600"
                      )}>{vehicle.fuelLevel}%</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Quick Status Change</p>
                    <div className="flex gap-1">
                      {(['Active', 'Idle', 'Maintenance'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus?.(vehicle.id, status);
                          }}
                          className={cn(
                            "flex-1 py-1 rounded text-[8px] font-bold transition-all border",
                            vehicle.status === status
                              ? status === 'Active' ? "bg-emerald-500 border-emerald-500 text-white" :
                                status === 'Maintenance' ? "bg-rose-500 border-rose-500 text-white" :
                                "bg-amber-500 border-amber-500 text-white"
                              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => onViewDetails?.(vehicle)}
                    className="w-full py-2 bg-brand-accent text-white text-[10px] font-bold rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                  >
                    View Full Details
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
