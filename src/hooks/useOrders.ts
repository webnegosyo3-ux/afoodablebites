import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AdminOrder, OrderStatus, CartItem } from '../types';

const LOCAL_STORAGE_KEY = 'afoodable_orders_v1';

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

// ─── Module-level cache shared across all hook instances ─────────────────────
let cachedOrders: AdminOrder[] = [];
let isCacheLoaded = false;
// Separate flags for read errors vs write - read errors don't block writes
let ordersTableReadFailed = false;
let globalPollInterval: ReturnType<typeof setInterval> | null = null;
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
const subscribers = new Set<(orders: AdminOrder[]) => void>();

// ─── Local storage helpers ────────────────────────────────────────────────────
const loadLocalOrders = (): AdminOrder[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
};

const saveLocalOrders = (orders: AdminOrder[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(orders));
  } catch {}
};

cachedOrders = loadLocalOrders();
isCacheLoaded = true;

// ─── Notify all subscribed component instances ────────────────────────────────
const notifySubscribers = (newOrders: AdminOrder[]) => {
  cachedOrders = newOrders;
  subscribers.forEach((cb) => cb(newOrders));
};

// ─── Map a raw Supabase row to AdminOrder ─────────────────────────────────────
const mapRow = (d: any): AdminOrder => ({
  id: d.id,
  customerName: d.customer_name ?? d.customerName ?? '',
  contactNumber: d.contact_number ?? d.contactNumber ?? '',
  serviceType: d.service_type ?? d.serviceType ?? 'dine-in',
  address: d.address ?? undefined,
  landmark: d.landmark ?? undefined,
  pickupTime: d.pickup_time ?? d.pickupTime ?? undefined,
  paymentMethod: d.payment_method ?? d.paymentMethod ?? 'Cash on Delivery',
  paymentSenderName: d.payment_sender_name ?? d.paymentSenderName ?? undefined,
  paymentReferenceNumber: d.payment_reference_number ?? d.paymentReferenceNumber ?? undefined,
  total: Number(d.total) || 0,
  items: Array.isArray(d.items)
    ? d.items
    : typeof d.items === 'string'
    ? (() => { try { return JSON.parse(d.items); } catch { return []; } })()
    : [],
  notes: d.notes ?? undefined,
  status: (d.status as OrderStatus) ?? 'pending',
  createdAt: d.created_at ?? new Date().toISOString(),
  updatedAt: d.updated_at ?? new Date().toISOString(),
});

// ─── Dispatch a cross-component new-order event ───────────────────────────────
const dispatchNewOrderEvent = (order: AdminOrder) => {
  window.dispatchEvent(
    new CustomEvent('afoodable_new_order_event', { detail: order })
  );
};

// ─── Set up Supabase Realtime subscription (once, module-level) ───────────────
const setupRealtimeSubscription = (knownIds: Set<string>) => {
  if (!isSupabaseConfigured || realtimeChannel) return;

  realtimeChannel = supabase
    .channel('orders-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      (payload) => {
        const newOrder = mapRow(payload.new);

        // Avoid duplicate alerts for orders this device just created
        if (knownIds.has(newOrder.id)) return;
        knownIds.add(newOrder.id);

        // Prepend to cache
        const updated = [newOrder, ...cachedOrders.filter((o) => o.id !== newOrder.id)];
        saveLocalOrders(updated);
        notifySubscribers(updated);

        // Fire the notification popup + ringtone
        dispatchNewOrderEvent(newOrder);
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders' },
      (payload) => {
        const updated = cachedOrders.map((o) =>
          o.id === payload.new.id ? mapRow(payload.new) : o
        );
        saveLocalOrders(updated);
        notifySubscribers(updated);
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'orders' },
      (payload) => {
        const updated = cachedOrders.filter((o) => o.id !== payload.old.id);
        saveLocalOrders(updated);
        notifySubscribers(updated);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.info('[Orders] Supabase Realtime connected ✓');
      } else if (status === 'CHANNEL_ERROR') {
        console.warn('[Orders] Realtime channel error — polling will cover gaps');
      }
    });
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useOrders = () => {
  const [orders, setOrders] = useState<AdminOrder[]>(cachedOrders);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Per-instance set of IDs this device already knows about (prevents self-notification)
  const selfKnownIdsRef = useRef<Set<string>>(new Set(cachedOrders.map((o) => o.id)));

  // ─── Fetch from Supabase ────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (isInitial = false) => {
    if (!isSupabaseConfigured) {
      notifySubscribers(loadLocalOrders());
      return;
    }

    try {
      if (isInitial && cachedOrders.length === 0) setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) {
        // Mark read as failed so we fall back to local, but DO NOT block writes
        ordersTableReadFailed = true;
        console.warn('[Orders] Supabase read error:', fetchErr.message);
        notifySubscribers(loadLocalOrders());
        return;
      }

      ordersTableReadFailed = false;

      if (data && Array.isArray(data)) {
        const mapped = data.map(mapRow);

        // Merge with local orders so anything saved locally but not yet in
        // Supabase (e.g. insert failed silently) is never wiped by a poll.
        const localOrders = loadLocalOrders();
        const remoteIds = new Set(mapped.map((o) => o.id));
        const localOnly = localOrders.filter((o) => !remoteIds.has(o.id));
        const merged = [...mapped, ...localOnly].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        saveLocalOrders(merged);
        notifySubscribers(merged);
        // Keep selfKnownIds up to date so we don't self-alert on existing rows
        merged.forEach((o) => selfKnownIdsRef.current.add(o.id));
      }
    } catch (err) {
      console.warn('[Orders] Fetch error:', err);
      notifySubscribers(loadLocalOrders());
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Mount / unmount ────────────────────────────────────────────────────────
  useEffect(() => {
    subscribers.add(setOrders);

    // Seed local state immediately from cache
    setOrders(cachedOrders);

    // Initial fetch from Supabase
    fetchOrders(true);

    // Set up Realtime subscription (creates it once at module level)
    setupRealtimeSubscription(selfKnownIdsRef.current);

    // Cross-tab sync via storage events (same browser, different tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY) {
        const fresh = loadLocalOrders();
        // Find orders we haven't seen yet
        fresh
          .filter((o) => !selfKnownIdsRef.current.has(o.id) && o.status === 'pending')
          .forEach((o) => {
            selfKnownIdsRef.current.add(o.id);
            dispatchNewOrderEvent(o);
          });
        notifySubscribers(fresh);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Polling as a safety net (every 10 s when Realtime is connected, every 5 s if not)
    if (!globalPollInterval) {
      globalPollInterval = setInterval(() => {
        fetchOrders(false);
      }, 10_000);
    }

    return () => {
      subscribers.delete(setOrders);
      window.removeEventListener('storage', handleStorageChange);
      if (subscribers.size === 0) {
        if (globalPollInterval) {
          clearInterval(globalPollInterval);
          globalPollInterval = null;
        }
        // Unsubscribe Realtime when no components are mounted
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel);
          realtimeChannel = null;
        }
      }
    };
  }, [fetchOrders]);

  // ─── Create order ───────────────────────────────────────────────────────────
  const createOrder = async (input: CreateOrderInput): Promise<AdminOrder> => {
    const now = new Date().toISOString();
    const orderId = `AB-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: AdminOrder = {
      id: orderId,
      ...input,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    // Add to local cache immediately so the customer sees confirmation
    const updated = [newOrder, ...cachedOrders];
    saveLocalOrders(updated);
    notifySubscribers(updated);

    // Mark as self-known so the Realtime INSERT event doesn't double-notify
    selfKnownIdsRef.current.add(orderId);

    // Fire same-tab popup immediately (admin might have this tab open too)
    dispatchNewOrderEvent(newOrder);

    // Persist to Supabase — always attempt this regardless of read errors
    if (isSupabaseConfigured) {
      try {
        const payload: Record<string, unknown> = {
          id: orderId,
          customer_name: input.customerName,
          contact_number: input.contactNumber,
          service_type: input.serviceType,
          address: input.address ?? null,
          landmark: input.landmark ?? null,
          pickup_time: input.pickupTime ?? null,
          payment_method: input.paymentMethod,
          payment_sender_name: input.paymentSenderName ?? null,
          payment_reference_number: input.paymentReferenceNumber ?? null,
          total: input.total,
          items: input.items,
          notes: input.notes ?? null,
          status: 'pending',
          created_at: now,
          updated_at: now,
        };

        const { error: insertErr } = await supabase.from('orders').insert(payload);
        if (insertErr) {
          console.warn('[Orders] Supabase insert error:', insertErr.message);
          // Order is already saved to localStorage — customer is not affected.
          // Admin on same device will see it; cross-device admin will miss it
          // only until the next poll cycle (10 s).
        }
      } catch (err) {
        console.warn('[Orders] Supabase insert exception:', err);
      }
    }

    return newOrder;
  };

  // ─── Update status ──────────────────────────────────────────────────────────
  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    const now = new Date().toISOString();
    const updated = cachedOrders.map((o) =>
      o.id === id ? { ...o, status, updatedAt: now } : o
    );
    saveLocalOrders(updated);
    notifySubscribers(updated);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('orders')
          .update({ status, updated_at: now })
          .eq('id', id);
      } catch (err) {
        console.warn('[Orders] Update status error:', err);
      }
    }
  };

  // ─── Delete single order ────────────────────────────────────────────────────
  const deleteOrder = async (id: string) => {
    const updated = cachedOrders.filter((o) => o.id !== id);
    saveLocalOrders(updated);
    notifySubscribers(updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('orders').delete().eq('id', id);
      } catch (err) {
        console.warn('[Orders] Delete error:', err);
      }
    }
  };

  // ─── Clear all orders ───────────────────────────────────────────────────────
  const clearAllOrders = async () => {
    saveLocalOrders([]);
    notifySubscribers([]);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('orders').delete().neq('id', '');
      } catch (err) {
        console.warn('[Orders] Clear all error:', err);
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
    refetch: () => fetchOrders(false),
  };
};
