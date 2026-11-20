import { useState, useEffect, useCallback } from 'react';
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
  total: number;
  items: CartItem[];
  notes?: string;
}

export const useOrders = () => {
  const [orders, setOrders] = useState<AdminOrder[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveToLocal = (newOrders: AdminOrder[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newOrders));
      setOrders(newOrders);
    } catch {
      // ignore
    }
  };

  const fetchOrders = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) {
        // Table might not exist yet, fallback cleanly to local
        console.warn('Supabase fetch orders notice:', fetchErr.message);
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
          paymentMethod: d.payment_method || d.paymentMethod || 'GCash',
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
      console.warn('Orders fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const createOrder = async (input: CreateOrderInput): Promise<AdminOrder> => {
    const now = new Date().toISOString();
    // Unique human-friendly order code e.g. AB-8492
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const orderId = `AB-${randomCode}`;

    const newOrder: AdminOrder = {
      id: orderId,
      ...input,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };

    const updated = [newOrder, ...orders];
    saveToLocal(updated);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('orders')
          .insert({
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
            notes: input.notes || null,
            status: 'pending',
            created_at: now,
            updated_at: now
          });
      } catch (err) {
        console.warn('Supabase insert order error:', err);
      }
    }

    return newOrder;
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    const now = new Date().toISOString();
    const updated = orders.map((o) =>
      o.id === id ? { ...o, status, updatedAt: now } : o
    );
    saveToLocal(updated);

    if (isSupabaseConfigured) {
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
    const updated = orders.filter((o) => o.id !== id);
    saveToLocal(updated);

    if (isSupabaseConfigured) {
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
    if (isSupabaseConfigured) {
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
    refetch: fetchOrders
  };
};
