import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AdminOrder, OrderStatus, CartItem } from '../types';

const LOCAL_STORAGE_KEY = 'afoodable_orders_v1';
const PING_KEY = 'afoodable_order_ping';

export interface CreateOrderInput {
  customerName: string;
  contactNumber: string;
  serviceType: 'dine-in' | 'pickup' | 'delivery';
  address?: string;
  landmark?: string;
  pickupTime?: string;
  paymentMethod: string;
  paymentSenderName?: string;
  paymentReferenceNumber?: string;
  total: number;
  items: CartItem[];
  notes?: string;
}

// Module-level cache to share across all hooks without duplicate network requests
let cachedOrders: AdminOrder[] = [];
let isCacheLoaded = false;
let isOrdersTableMissingInSupabase = false;
let globalPollInterval: ReturnType<typeof setInterval> | null = null;
const subscribers = new Set<(orders: AdminOrder[]) => void>();

const loadLocalOrders = (): AdminOrder[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}
  return [];
};

cachedOrders = loadLocalOrders();
isCacheLoaded = true;

const notifySubscribers = (newOrders: AdminOrder[]) => {
  cachedOrders = newOrders;
  subscribers.forEach((cb) => cb(newOrders));
};

export const useOrders = () => {
  const [orders, setOrders] = useState<AdminOrder[]>(cachedOrders);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousOrdersCountRef = useRef(cachedOrders.length);

  const saveToLocal = (newOrders: AdminOrder[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newOrders));
      localStorage.setItem(PING_KEY, Date.now().toString());
      notifySubscribers(newOrders);
    } catch {
      // ignore
    }
  };

  const fetchOrders = useCallback(async (isInitial = false) => {
    // If Supabase table is known to not exist, don't spam failed 404 network requests
    if (!isSupabaseConfigured || isOrdersTableMissingInSupabase) {
      const local = loadLocalOrders();
      notifySubscribers(local);
      return;
    }

    try {
      // Only set loading indicator on initial mount if we have no orders cached yet
      if (isInitial && cachedOrders.length === 0) {
        setLoading(true);
      }
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) {
        // If table doesn't exist in Supabase (HTTP 404 or PGRST205), switch to local-first mode
        if (
          fetchErr.code === 'PGRST205' || 
          fetchErr.message.includes('schema cache') || 
          fetchErr.message.includes('not found') ||
          (fetchErr as any).status === 404
        ) {
          isOrdersTableMissingInSupabase = true;
          console.info('Supabase orders table not found; running in high-speed local mode.');
        } else {
          console.warn('Supabase fetch orders notice:', fetchErr.message);
        }
        const local = loadLocalOrders();
        notifySubscribers(local);
        return;
      }

      if (data && Array.isArray(data)) {
        const mapped: AdminOrder[] = data.map((d: any) => ({
          id: d.id,
          customerName: d.customer_name || d.customerName,
          contactNumber: d.contact_number || d.contactNumber,
          serviceType: d.service_type || d.serviceType || 'dine-in',
          address: d.address,
          landmark: d.landmark,
          pickupTime: d.pickup_time || d.pickupTime,
          paymentMethod: d.payment_method || d.paymentMethod || 'Cash on Delivery',
          paymentSenderName: d.payment_sender_name || d.paymentSenderName,
          paymentReferenceNumber: d.payment_reference_number || d.paymentReferenceNumber,
          total: Number(d.total) || 0,
          items: Array.isArray(d.items) ? d.items : typeof d.items === 'string' ? JSON.parse(d.items) : [],
          notes: d.notes,
          status: (d.status as OrderStatus) || 'pending',
          createdAt: d.created_at || new Date().toISOString(),
          updatedAt: d.updated_at || new Date().toISOString()
        }));

        saveToLocal(mapped);
      }
    } catch (err) {
      console.warn('Orders fetch notice:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Subscribe this component instance to central cache updates
    subscribers.add(setOrders);

    // Initial instant load
    fetchOrders(true);

    // Listen to changes from other tabs via storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY || e.key === PING_KEY) {
        const fresh = loadLocalOrders();
        if (fresh.length > previousOrdersCountRef.current && fresh[0]) {
          window.dispatchEvent(
            new CustomEvent('afoodable_new_order_event', { detail: fresh[0] })
          );
        }
        previousOrdersCountRef.current = fresh.length;
        notifySubscribers(fresh);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Setup a single shared polling timer if not already active
    if (!globalPollInterval) {
      globalPollInterval = setInterval(() => {
        if (!isOrdersTableMissingInSupabase) {
          fetchOrders(false);
        }
      }, 8000);
    }

    return () => {
      subscribers.delete(setOrders);
      window.removeEventListener('storage', handleStorageChange);
      if (subscribers.size === 0 && globalPollInterval) {
        clearInterval(globalPollInterval);
        globalPollInterval = null;
      }
    };
  }, [fetchOrders]);

  const createOrder = async (input: CreateOrderInput): Promise<AdminOrder> => {
    const now = new Date().toISOString();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const orderId = `AB-${randomCode}`;

    const newOrder: AdminOrder = {
      id: orderId,
      ...input,
      paymentSenderName: input.paymentSenderName,
      paymentReferenceNumber: input.paymentReferenceNumber,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };

    const updated = [newOrder, ...cachedOrders];
    saveToLocal(updated);
    previousOrdersCountRef.current = updated.length;

    // Dispatch event for instant notification modal & audio chime
    window.dispatchEvent(
      new CustomEvent('afoodable_new_order_event', { detail: newOrder })
    );

    if (isSupabaseConfigured && !isOrdersTableMissingInSupabase) {
      try {
        const payload: any = {
          id: orderId,
          customer_name: input.customerName,
          contact_number: input.contactNumber,
          service_type: input.serviceType,
          address: input.address || null,
          landmark: input.landmark || null,
          pickup_time: input.pickupTime || null,
          payment_method: input.paymentMethod,
          total: input.total,
          items: input.items,
          notes: input.notes 
            ? (input.paymentReferenceNumber ? `${input.notes} | Ref: ${input.paymentReferenceNumber} (Sender: ${input.paymentSenderName || ''})` : input.notes)
            : (input.paymentReferenceNumber ? `Ref: ${input.paymentReferenceNumber} (Sender: ${input.paymentSenderName || ''})` : null),
          status: 'pending',
          created_at: now,
          updated_at: now
        };
        if (input.paymentSenderName) payload.payment_sender_name = input.paymentSenderName;
        if (input.paymentReferenceNumber) payload.payment_reference_number = input.paymentReferenceNumber;

        await supabase.from('orders').insert(payload);
      } catch (err) {
        console.warn('Supabase insert order notice:', err);
      }
    }

    return newOrder;
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    const now = new Date().toISOString();
    const updated = cachedOrders.map((o) =>
      o.id === id ? { ...o, status, updatedAt: now } : o
    );
    saveToLocal(updated);

    if (isSupabaseConfigured && !isOrdersTableMissingInSupabase) {
      try {
        await supabase
          .from('orders')
          .update({
            status,
            updated_at: now
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase update order status error:', err);
      }
    }
  };

  const deleteOrder = async (id: string) => {
    const updated = cachedOrders.filter((o) => o.id !== id);
    saveToLocal(updated);

    if (isSupabaseConfigured && !isOrdersTableMissingInSupabase) {
      try {
        await supabase
          .from('orders')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase delete order error:', err);
      }
    }
  };

  const clearAllOrders = async () => {
    saveToLocal([]);
    previousOrdersCountRef.current = 0;
    if (isSupabaseConfigured && !isOrdersTableMissingInSupabase) {
      try {
        await supabase.from('orders').delete().neq('id', '');
      } catch (err) {
        console.warn('Supabase clear orders error:', err);
      }
    }
  };

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrderStatus,
    deleteOrder,
    clearAllOrders,
    refetch: () => fetchOrders(false)
  };
};
