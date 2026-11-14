import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Shipment, Vehicle, Maintenance, InventoryItem, Order } from './types';

function cleanEnvValue(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^["']|["']$/g, '').trim();
}

function isValidHttpUrl(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

const rawSupabaseUrl = cleanEnvValue(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = cleanEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);

// Allow bare Supabase domain like "xyz.supabase.co" by normalizing to https://
const supabaseUrl =
  rawSupabaseUrl && !/^https?:\/\//i.test(rawSupabaseUrl) && rawSupabaseUrl.includes('.')
    ? `https://${rawSupabaseUrl}`
    : rawSupabaseUrl;

const hasPlaceholder =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes('your-project-id') ||
  supabaseAnonKey.includes('your-supabase-anon-key') ||
  supabaseUrl.startsWith('MY_') ||
  supabaseAnonKey.startsWith('MY_');

let clientInstance: SupabaseClient | null = null;
let configError: string | null = null;

if (hasPlaceholder) {
  configError =
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your project environment Secrets, and run supabase/schema.sql in your Supabase SQL Editor.';
} else if (!isValidHttpUrl(supabaseUrl)) {
  configError =
    'Invalid VITE_SUPABASE_URL: Must be a valid HTTP or HTTPS URL (for example, https://your-project-id.supabase.co).';
} else {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err: any) {
    configError = err?.message || 'Failed to initialize Supabase client.';
    clientInstance = null;
  }
}

export const supabase: SupabaseClient | null = clientInstance;
export const isSupabaseConfigured = Boolean(clientInstance);
export const supabaseConfigError: string | null = configError;

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export function mapSupabaseUser(user: User | null): AppUser | null {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return {
    uid: user.id,
    email: user.email ?? null,
    displayName: meta.display_name || meta.full_name || meta.name || user.email?.split('@')[0] || 'User',
    photoURL: meta.avatar_url || meta.photo_url || meta.picture || null,
  };
}

function requireClient(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  return supabase;
}

// Lightweight in-app change bus so local mutations update subscribers immediately
// even if Supabase Realtime replication is not yet toggled on.
type TableName = 'shipments' | 'vehicles' | 'maintenance' | 'inventory' | 'orders';
const tableListeners: Record<TableName, Set<() => void>> = {
  shipments: new Set(),
  vehicles: new Set(),
  maintenance: new Set(),
  inventory: new Set(),
  orders: new Set(),
};

function notifyTableChange(table: TableName) {
  tableListeners[table].forEach((cb) => cb());
}

function subscribeWithRealtime<T>(
  table: TableName,
  fetcher: () => Promise<T>,
  onData: (data: T) => void,
  onError?: (error: Error) => void,
  channelSuffix = ''
): () => void {
  if (!supabase) {
    if (onError) {
      onError(new Error(supabaseConfigError || 'Supabase is not configured.'));
    }
    return () => {};
  }

  let active = true;

  const load = async () => {
    try {
      const data = await fetcher();
      if (active) onData(data);
    } catch (err: any) {
      console.error(`Supabase ${table} fetch error:`, err);
      if (active && onError) onError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  load();

  const localListener = () => {
    void load();
  };
  tableListeners[table].add(localListener);

  const channel = supabase
    .channel(`${table}-changes-${channelSuffix || Math.random().toString(36).slice(2, 9)}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      () => {
        void load();
      }
    )
    .subscribe();

  return () => {
    active = false;
    tableListeners[table].delete(localListener);
    void supabase.removeChannel(channel);
  };
}

// ============================================================================
// Authentication Helpers
// ============================================================================

export const loginWithGoogle = async () => {
  const client = requireClient();
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) throw error;
};

export const signUpWithEmail = async (email: string, password: string, displayName: string) => {
  const client = requireClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        full_name: displayName,
      },
    },
  });
  if (error) throw error;
  return { user: mapSupabaseUser(data.user), needsEmailConfirmation: !data.session };
};

export const loginWithEmail = async (email: string, password: string) => {
  const client = requireClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return mapSupabaseUser(data.user);
};

export const logout = async () => {
  const client = requireClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
};

export const updateUserProfile = async (displayName: string, photoURL: string) => {
  const client = requireClient();
  const { data: userData, error: userError } = await client.auth.updateUser({
    data: {
      display_name: displayName,
      full_name: displayName,
      avatar_url: photoURL,
      photo_url: photoURL,
    },
  });
  if (userError) throw userError;

  if (userData.user) {
    await client.from('profiles').upsert({
      id: userData.user.id,
      email: userData.user.email || '',
      display_name: displayName,
      photo_url: photoURL,
    });
  }
};

// ============================================================================
// Row Mappers (PostgreSQL snake_case <-> TypeScript camelCase)
// ============================================================================

function mapShipmentRow(row: any): Shipment {
  return {
    id: row.id,
    trackingNumber: row.tracking_number,
    customer: row.customer ?? undefined,
    origin: row.origin,
    destination: row.destination,
    status: row.status,
    direction: row.direction,
    estimatedArrival: row.estimated_arrival ?? undefined,
    value: Number(row.value ?? 0),
    weight: row.weight ?? '',
    cargoType: row.cargo_type ?? undefined,
    specialHandling: row.special_handling ?? undefined,
    type: row.type ?? undefined,
    priority: row.priority ?? undefined,
    createdBy: row.created_by ?? '',
    history: Array.isArray(row.history) ? row.history : [],
    originLat: row.origin_lat ?? undefined,
    originLng: row.origin_lng ?? undefined,
    destLat: row.dest_lat ?? undefined,
    destLng: row.dest_lng ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVehicleRow(row: any): Vehicle {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    location: row.location ?? '',
    fuelLevel: Number(row.fuel_level ?? 100),
    driver: row.driver,
    lat: Number(row.lat),
    lng: Number(row.lng),
    speed: row.speed !== null && row.speed !== undefined ? Number(row.speed) : undefined,
    altitude: row.altitude !== null && row.altitude !== undefined ? Number(row.altitude) : undefined,
    odometer: row.odometer !== null && row.odometer !== undefined ? Number(row.odometer) : undefined,
    temperature: row.temperature !== null && row.temperature !== undefined ? Number(row.temperature) : undefined,
    tirePressure: row.tire_pressure ?? undefined,
    engineOilLevel: row.engine_oil_level !== null && row.engine_oil_level !== undefined ? Number(row.engine_oil_level) : undefined,
    weightCapacity: row.weight_capacity ?? undefined,
    volumeCapacity: row.volume_capacity ?? undefined,
  };
}

function mapInventoryRow(row: any): InventoryItem {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    quantity: Number(row.quantity ?? 0),
    minStock: Number(row.min_stock ?? 0),
    location: row.location ?? '',
    status: row.status,
    value: Number(row.value ?? 0),
    createdBy: row.created_by ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrderRow(row: any): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email ?? '',
    shippingAddress: row.shipping_address ?? '',
    items: Array.isArray(row.items) ? row.items : [],
    totalAmount: Number(row.total_amount ?? 0),
    status: row.status,
    createdBy: row.created_by ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    shipmentId: row.shipment_id ?? undefined,
  };
}

// ============================================================================
// Shipments
// ============================================================================

export function subscribeToShipments(
  onData: (shipments: Shipment[]) => void,
  options?: { limit?: number; trackingNumber?: string; onError?: (err: Error) => void }
) {
  return subscribeWithRealtime(
    'shipments',
    async () => {
      const client = requireClient();
      let q = client.from('shipments').select('*').order('created_at', { ascending: false });
      if (options?.trackingNumber) {
        q = q.eq('tracking_number', options.trackingNumber.trim());
      }
      if (options?.limit) {
        q = q.limit(options.limit);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(mapShipmentRow);
    },
    onData,
    options?.onError,
    options?.trackingNumber ? `track-${options.trackingNumber}` : options?.limit ? `limit-${options.limit}` : 'all'
  );
}

export async function createShipment(payload: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) {
  const client = requireClient();
  const { data: userData } = await client.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('You must be signed in to create a shipment.');

  const { data, error } = await client
    .from('shipments')
    .insert({
      tracking_number: payload.trackingNumber,
      customer: payload.customer || null,
      origin: payload.origin,
      destination: payload.destination,
      status: payload.status,
      direction: payload.direction,
      estimated_arrival: payload.estimatedArrival || null,
      value: payload.value,
      weight: payload.weight,
      cargo_type: payload.cargoType || null,
      special_handling: payload.specialHandling || null,
      type: payload.type || 'Standard',
      priority: payload.priority || 'Normal',
      created_by: userId,
      history: payload.history || [],
      origin_lat: payload.originLat ?? null,
      origin_lng: payload.originLng ?? null,
      dest_lat: payload.destLat ?? null,
      dest_lng: payload.destLng ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  notifyTableChange('shipments');
  return mapShipmentRow(data);
}

export async function updateShipment(id: string, updates: Partial<Shipment>) {
  const client = requireClient();
  const patch: Record<string, any> = {};
  if (updates.customer !== undefined) patch.customer = updates.customer;
  if (updates.origin !== undefined) patch.origin = updates.origin;
  if (updates.destination !== undefined) patch.destination = updates.destination;
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.direction !== undefined) patch.direction = updates.direction;
  if (updates.estimatedArrival !== undefined) patch.estimated_arrival = updates.estimatedArrival;
  if (updates.value !== undefined) patch.value = updates.value;
  if (updates.weight !== undefined) patch.weight = updates.weight;
  if (updates.cargoType !== undefined) patch.cargo_type = updates.cargoType;
  if (updates.specialHandling !== undefined) patch.special_handling = updates.specialHandling;
  if (updates.type !== undefined) patch.type = updates.type;
  if (updates.priority !== undefined) patch.priority = updates.priority;
  if (updates.history !== undefined) patch.history = updates.history;

  const { error } = await client.from('shipments').update(patch).eq('id', id);
  if (error) throw error;
  notifyTableChange('shipments');
}

export async function deleteShipment(id: string) {
  const client = requireClient();
  const { error } = await client.from('shipments').delete().eq('id', id);
  if (error) throw error;
  notifyTableChange('shipments');
}

export async function bulkDeleteShipments(ids: string[]) {
  const client = requireClient();
  const { error } = await client.from('shipments').delete().in('id', ids);
  if (error) throw error;
  notifyTableChange('shipments');
}

export async function bulkUpdateShipmentStatus(ids: string[], status: Shipment['status']) {
  const client = requireClient();
  const { error } = await client.from('shipments').update({ status }).in('id', ids);
  if (error) throw error;
  notifyTableChange('shipments');
}

// ============================================================================
// Vehicles
// ============================================================================

export function subscribeToVehicles(
  onData: (vehicles: Vehicle[]) => void,
  options?: { status?: Vehicle['status']; onError?: (err: Error) => void }
) {
  return subscribeWithRealtime(
    'vehicles',
    async () => {
      const client = requireClient();
      let q = client.from('vehicles').select('*').order('created_at', { ascending: false });
      if (options?.status) {
        q = q.eq('status', options.status);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(mapVehicleRow);
    },
    onData,
    options?.onError,
    options?.status ? `status-${options.status}` : 'all'
  );
}

export async function createVehicle(payload: Vehicle) {
  const client = requireClient();
  const { data: userData } = await client.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('You must be signed in to register a vehicle.');

  const { data, error } = await client
    .from('vehicles')
    .insert({
      id: payload.id.trim(),
      type: payload.type,
      status: payload.status,
      location: payload.location,
      fuel_level: payload.fuelLevel,
      driver: payload.driver,
      lat: payload.lat,
      lng: payload.lng,
      speed: payload.speed ?? null,
      altitude: payload.altitude ?? null,
      odometer: payload.odometer ?? null,
      temperature: payload.temperature ?? null,
      tire_pressure: payload.tirePressure ?? null,
      engine_oil_level: payload.engineOilLevel ?? null,
      weight_capacity: payload.weightCapacity || null,
      volume_capacity: payload.volumeCapacity || null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  notifyTableChange('vehicles');
  return mapVehicleRow(data);
}

export async function updateVehicleStatus(id: string, status: Vehicle['status']) {
  const client = requireClient();
  const { error } = await client.from('vehicles').update({ status }).eq('id', id);
  if (error) throw error;
  notifyTableChange('vehicles');
}

// ============================================================================
// Maintenance
// ============================================================================

export async function createMaintenance(payload: Omit<Maintenance, 'id' | 'createdAt' | 'createdBy'>) {
  const client = requireClient();
  const { data: userData } = await client.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('You must be signed in to schedule maintenance.');

  const { error } = await client.from('maintenance').insert({
    vehicle_id: payload.vehicleId,
    date: payload.date,
    time: payload.time,
    service_type: payload.serviceType,
    notes: payload.notes || null,
    status: payload.status,
    created_by: userId,
  });

  if (error) throw error;
  notifyTableChange('maintenance');
}

// ============================================================================
// Inventory
// ============================================================================

export function subscribeToInventory(
  onData: (items: InventoryItem[]) => void,
  onError?: (err: Error) => void
) {
  return subscribeWithRealtime(
    'inventory',
    async () => {
      const client = requireClient();
      const { data, error } = await client
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapInventoryRow);
    },
    onData,
    onError
  );
}

export async function createInventoryItem(
  payload: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
) {
  const client = requireClient();
  const { data: userData } = await client.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('You must be signed in to add inventory.');

  const { error } = await client.from('inventory').insert({
    sku: payload.sku,
    name: payload.name,
    category: payload.category,
    quantity: payload.quantity,
    min_stock: payload.minStock,
    location: payload.location,
    status: payload.status,
    value: payload.value,
    created_by: userId,
  });

  if (error) throw error;
  notifyTableChange('inventory');
}

export async function updateInventoryItem(
  id: string,
  updates: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'createdBy'>>
) {
  const client = requireClient();
  const patch: Record<string, any> = {};
  if (updates.sku !== undefined) patch.sku = updates.sku;
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.category !== undefined) patch.category = updates.category;
  if (updates.quantity !== undefined) patch.quantity = updates.quantity;
  if (updates.minStock !== undefined) patch.min_stock = updates.minStock;
  if (updates.location !== undefined) patch.location = updates.location;
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.value !== undefined) patch.value = updates.value;

  const { error } = await client.from('inventory').update(patch).eq('id', id);
  if (error) throw error;
  notifyTableChange('inventory');
}

export async function deleteInventoryItem(id: string) {
  const client = requireClient();
  const { error } = await client.from('inventory').delete().eq('id', id);
  if (error) throw error;
  notifyTableChange('inventory');
}

// ============================================================================
// Orders & Fulfillment
// ============================================================================

export function subscribeToOrders(
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void
) {
  return subscribeWithRealtime(
    'orders',
    async () => {
      const client = requireClient();
      const { data, error } = await client
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapOrderRow);
    },
    onData,
    onError
  );
}

export async function createOrder(
  payload: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
) {
  const client = requireClient();
  const { data: userData } = await client.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('You must be signed in to create an order.');

  const { error } = await client.from('orders').insert({
    order_number: payload.orderNumber,
    customer_name: payload.customerName,
    customer_email: payload.customerEmail || null,
    shipping_address: payload.shippingAddress || null,
    items: payload.items,
    total_amount: payload.totalAmount,
    status: payload.status,
    created_by: userId,
  });

  if (error) throw error;
  notifyTableChange('orders');
}

export async function deleteOrder(id: string) {
  const client = requireClient();
  const { error } = await client.from('orders').delete().eq('id', id);
  if (error) throw error;
  notifyTableChange('orders');
}

export async function fulfillOrder(order: Order) {
  const client = requireClient();
  const { data: userData } = await client.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('You must be signed in to fulfill an order.');

  // 1. Verify inventory availability
  const itemUpdates: { id: string; newQty: number; status: InventoryItem['status'] }[] = [];
  for (const item of order.items) {
    const { data: invRow, error: invErr } = await client
      .from('inventory')
      .select('id, quantity, min_stock')
      .eq('id', item.itemId)
      .single();

    if (invErr || !invRow) {
      throw new Error(`Item ${item.name} not found in inventory.`);
    }

    if (invRow.quantity < item.quantity) {
      throw new Error(`Insufficient stock for ${item.name}. Available: ${invRow.quantity}`);
    }

    const newQty = invRow.quantity - item.quantity;
    const minStock = invRow.min_stock ?? 5;
    const status: InventoryItem['status'] =
      newQty === 0 ? 'Out of Stock' : newQty <= minStock ? 'Low Stock' : 'In Stock';
    itemUpdates.push({ id: invRow.id, newQty, status });
  }

  // 2. Deduct inventory
  for (const upd of itemUpdates) {
    const { error } = await client
      .from('inventory')
      .update({ quantity: upd.newQty, status: upd.status })
      .eq('id', upd.id);
    if (error) throw error;
  }

  // 3. Create Shipment
  const trackingNumber = `TRK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const shipment = await createShipment({
    trackingNumber,
    customer: order.customerName,
    origin: 'Main Warehouse',
    destination: order.shippingAddress,
    status: 'Pending',
    direction: 'Outbound',
    value: order.totalAmount,
    weight: 'TBD',
    cargoType: 'General Goods',
    history: [
      {
        status: 'Pending',
        location: 'Main Warehouse',
        timestamp: new Date().toISOString(),
      },
    ],
  });

  // 4. Update Order status & link shipmentId
  const { error: orderErr } = await client
    .from('orders')
    .update({ status: 'Fulfilled', shipment_id: shipment.id })
    .eq('id', order.id);

  if (orderErr) throw orderErr;

  notifyTableChange('inventory');
  notifyTableChange('orders');
}

// ============================================================================
// Danger Zone / Reset
// ============================================================================

export async function clearAllData() {
  const client = requireClient();
  const { error: shipErr } = await client.from('shipments').delete().not('id', 'is', null);
  if (shipErr) throw shipErr;

  const { error: vehErr } = await client.from('vehicles').delete().not('id', 'is', null);
  if (vehErr) throw vehErr;

  notifyTableChange('shipments');
  notifyTableChange('vehicles');
}
