import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface PaymentMethod {
  id: string;
  name: string;
  account_number: string;
  account_name: string;
  qr_code_url: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'payment-gcash',
    name: 'GCash / InstaPay',
    account_number: '0905 293 1408',
    account_name: 'Afoodable Bites',
    qr_code_url: '/images/payment-qr/gcash-qr-code.jpg',
    active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'payment-cod',
    name: 'Cash on Delivery (COD) / Counter',
    account_number: 'Cash Payment',
    account_name: 'Pay upon arrival / at counter',
    qr_code_url: '',
    active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'payment-maya',
    name: 'Maya / PayMaya',
    account_number: '0905 293 1408',
    account_name: 'Afoodable Bites',
    qr_code_url: '/images/payment-qr/gcash-qr-code.jpg',
    active: false,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const LOCAL_STORAGE_KEY = 'afoodable_payment_methods_v2';

export const usePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_PAYMENT_METHODS;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveToLocal = (methods: PaymentMethod[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(methods));
      setPaymentMethods(methods);
    } catch {
      // ignore
    }
  };

  const fetchAllPaymentMethods = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('payment_methods')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        saveToLocal(data);
      }
      setError(null);
    } catch (err) {
      console.warn('Error fetching all payment methods, using cache:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActivePaymentMethods = useCallback(async () => {
    if (!isSupabaseConfigured) {
      return paymentMethods.filter(m => m.active);
    }
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('Error fetching active payment methods:', err);
    } finally {
      setLoading(false);
    }
    return paymentMethods.filter(m => m.active);
  }, [paymentMethods]);

  const togglePaymentMethod = async (id: string) => {
    const updated = paymentMethods.map(m => 
      m.id === id ? { ...m, active: !m.active, updated_at: new Date().toISOString() } : m
    );
    saveToLocal(updated);

    if (isSupabaseConfigured) {
      const target = updated.find(m => m.id === id);
      if (target) {
        await supabase
          .from('payment_methods')
          .update({ active: target.active })
          .eq('id', id);
      }
    }
  };

  const addPaymentMethod = async (method: Omit<PaymentMethod, 'created_at' | 'updated_at'>) => {
    const newMethod: PaymentMethod = {
      ...method,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const updated = [...paymentMethods, newMethod];
    saveToLocal(updated);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('payment_methods')
          .insert({
            id: method.id,
            name: method.name,
            account_number: method.account_number,
            account_name: method.account_name,
            qr_code_url: method.qr_code_url,
            active: method.active,
            sort_order: method.sort_order
          });
      } catch (err) {
        console.warn('Supabase add payment method error:', err);
      }
    }
    return newMethod;
  };

  const updatePaymentMethod = async (id: string, updates: Partial<PaymentMethod>) => {
    const updated = paymentMethods.map(m => 
      m.id === id ? { ...m, ...updates, updated_at: new Date().toISOString() } : m
    );
    saveToLocal(updated);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('payment_methods')
          .update({
            name: updates.name,
            account_number: updates.account_number,
            account_name: updates.account_name,
            qr_code_url: updates.qr_code_url,
            active: updates.active,
            sort_order: updates.sort_order
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase update payment method error:', err);
      }
    }
  };

  const deletePaymentMethod = async (id: string) => {
    const updated = paymentMethods.filter(m => m.id !== id);
    saveToLocal(updated);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('payment_methods')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase delete payment method error:', err);
      }
    }
  };

  useEffect(() => {
    fetchAllPaymentMethods();
  }, [fetchAllPaymentMethods]);

  return {
    paymentMethods,
    activePaymentMethods: paymentMethods.filter(m => m.active),
    loading,
    error,
    togglePaymentMethod,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    refetch: fetchActivePaymentMethods,
    refetchAll: fetchAllPaymentMethods
  };
};
