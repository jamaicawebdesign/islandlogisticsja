export interface TrackingUpdate {
  status: 'In Transit' | 'Delivered' | 'Pending' | 'Delayed' | 'Processed' | 'Picked Up';
  location: string;
  timestamp: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  customer?: string;
  origin: string;
  destination: string;
  status: 'In Transit' | 'Delivered' | 'Pending' | 'Delayed';
  direction: 'Inbound' | 'Outbound';
  estimatedArrival?: string;
  value: number;
  weight: string;
  cargoType?: string;
  specialHandling?: string;
  type?: string;
  priority?: string;
  createdBy: string;
  history?: TrackingUpdate[];
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface Vehicle {
  id: string;
  type: 'Truck' | 'Van' | 'Ship' | 'Plane';
  status: 'Active' | 'Maintenance' | 'Idle';
  location: string;
  fuelLevel: number;
  driver: string;
  lat: number;
  lng: number;
  speed?: number;
  altitude?: number;
  odometer?: number;
  temperature?: number;
  tirePressure?: {
    fl: number;
    fr: number;
    rl: number;
    rr: number;
  };
  engineOilLevel?: number;
  weightCapacity?: string;
  volumeCapacity?: string;
}

export interface Maintenance {
  id: string;
  vehicleId: string;
  date: string;
  time: string;
  serviceType: 'Routine' | 'Repair' | 'Inspection' | 'Oil Change' | 'Tire Rotation';
  notes?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  createdBy: string;
  createdAt: any;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  location: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  value: number;
  createdBy: string;
  createdAt: any;
  updatedAt?: any;
}

export interface OrderItem {
  itemId: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Fulfilled' | 'Cancelled';
  createdBy: string;
  createdAt: any;
  updatedAt?: any;
  shipmentId?: string;
}

export const MOCK_SHIPMENTS: Shipment[] = [];

export const MOCK_VEHICLES: Vehicle[] = [];

export const ANALYTICS_DATA = [
  { name: 'Mon', shipments: 45, revenue: 12000 },
  { name: 'Tue', shipments: 52, revenue: 15000 },
  { name: 'Wed', shipments: 38, revenue: 11000 },
  { name: 'Thu', shipments: 65, revenue: 18500 },
  { name: 'Fri', shipments: 48, revenue: 14200 },
  { name: 'Sat', shipments: 24, revenue: 7500 },
  { name: 'Sun', shipments: 18, revenue: 5200 },
];
