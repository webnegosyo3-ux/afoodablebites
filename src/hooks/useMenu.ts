import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MenuItem } from '../types';
import { DEFAULT_MENU_ITEMS } from '../data/defaultMenu';

const LOCAL_KEY = 'afoodable_menu_items_v1';

// ── localStorage helpers ──────────────────────────────────────────────────────
const loadLocal = (): MenuItem[] | null => {
  try {
    const s = localStorage.getItem(LOCAL_KEY);
    if (s) {
      const p = JSON.parse(s);
      if (Array.isArray(p) && p.length > 0) return p;
    }
  } catch {}
  return null;
};

const saveLocal = (items: MenuItem[]) => {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(items)); } catch {}
};

// ── Row mapper ────────────────────────────────────────────────────────────────
const mapRow = (item: any): MenuItem => {
  const now = new Date();
  const discountStart = item.discount_start_date ? new Date(item.discount_start_date) : null;
  const discountEnd   = item.discount_end_date   ? new Date(item.discount_end_date)   : null;
  const isDiscountActive =
    item.discount_active &&
    (!discountStart || now >= discountStart) &&
    (!discountEnd   || now <= discountEnd);
  const effectivePrice =
    isDiscountActive && item.discount_price ? item.discount_price : item.base_price;

  return {
    id:               item.id,
    name:             item.name,
    description:      item.description,
    basePrice:        item.base_price ?? item.basePrice,
    category:         item.category,
    popular:          item.popular ?? false,
    available:        item.available ?? true,
    image:            item.image_url ?? item.image ?? undefined,
    discountPrice:    item.discount_price ?? item.discountPrice ?? undefined,
    discountStartDate:item.discount_start_date ?? item.discountStartDate ?? undefined,
    discountEndDate:  item.discount_end_date   ?? item.discountEndDate   ?? undefined,
    discountActive:   item.discount_active     ?? item.discountActive    ?? false,
    effectivePrice,
    isOnDiscount:     isDiscountActive,
    variations: (item.variations ?? []).map((v: any) => ({
      id: v.id, name: v.name, price: v.price, image: v.image ?? undefined
    })),
    addOns: (item.add_ons ?? item.addOns ?? []).map((a: any) => ({
      id: a.id, name: a.name, price: a.price, category: a.category
    })),
  };
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useMenu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(
    loadLocal() ?? DEFAULT_MENU_ITEMS
  );
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Push items to state + localStorage
  const persist = useCallback((items: MenuItem[]) => {
    saveLocal(items);
    setMenuItems(items);
  }, []);

  const fetchMenuItems = useCallback(async () => {
    if (!isSupabaseConfigured) {
      persist(loadLocal() ?? DEFAULT_MENU_ITEMS);
      return;
    }
    try {
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('*, variations (*), add_ons (*)')
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      if (!items || items.length === 0) {
        // Keep local edits rather than wiping with empty
        const local = loadLocal();
        persist(local ?? DEFAULT_MENU_ITEMS);
        return;
      }

      const formatted = items.map(mapRow);
      // Merge: keep local-only items (not yet in Supabase) alongside remote
      const local = loadLocal() ?? [];
      const remoteIds = new Set(formatted.map(i => i.id));
      const localOnly = local.filter(i => !remoteIds.has(i.id));
      persist([...formatted, ...localOnly]);
      setError(null);
    } catch (err) {
      console.warn('[Menu] Fetch error, using local cache:', err);
      const local = loadLocal();
      if (local) persist(local);
      setError(err instanceof Error ? err.message : 'Using cached menu');
    }
  }, [persist]);

  useEffect(() => { fetchMenuItems(); }, [fetchMenuItems]);

  // ── Add ─────────────────────────────────────────────────────────────────────
  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    const tempId = `local-${Date.now()}`;
    const newItem: MenuItem = { ...item, id: tempId } as MenuItem;

    // Optimistic local save
    const updated = [...menuItems, newItem];
    persist(updated);

    if (isSupabaseConfigured) {
      try {
        const { data, error: insertError } = await supabase
          .from('menu_items')
          .insert({
            name:               item.name,
            description:        item.description,
            base_price:         item.basePrice,
            category:           item.category,
            popular:            item.popular    || false,
            available:          item.available  ?? true,
            image_url:          item.image      || null,
            discount_price:     item.discountPrice     || null,
            discount_start_date:item.discountStartDate || null,
            discount_end_date:  item.discountEndDate   || null,
            discount_active:    item.discountActive    || false,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Replace tempId with real Supabase id
        const withRealId = updated.map(i => i.id === tempId ? { ...newItem, id: data.id } : i);
        persist(withRealId);
        return data;
      } catch (err) {
        console.warn('[Menu] Supabase insert error — saved locally only:', err);
        // Keep the local version; it will re-sync next fetch
      }
    }
    return newItem;
  };

  // ── Update ───────────────────────────────────────────────────────────────────
  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    // Optimistic local update
    const updated = menuItems.map(i => i.id === id ? { ...i, ...updates } : i);
    persist(updated);

    if (isSupabaseConfigured) {
      try {
        const { error: updateError } = await supabase
          .from('menu_items')
          .update({
            name:               updates.name,
            description:        updates.description,
            base_price:         updates.basePrice,
            category:           updates.category,
            popular:            updates.popular,
            available:          updates.available,
            image_url:          updates.image,
            discount_price:     updates.discountPrice,
            discount_start_date:updates.discountStartDate,
            discount_end_date:  updates.discountEndDate,
            discount_active:    updates.discountActive,
          })
          .eq('id', id);

        if (updateError) throw updateError;
      } catch (err) {
        console.warn('[Menu] Supabase update error — saved locally only:', err);
      }
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const deleteMenuItem = async (id: string) => {
    const updated = menuItems.filter(i => i.id !== id);
    persist(updated);

    if (isSupabaseConfigured) {
      try {
        const { error: deleteError } = await supabase
          .from('menu_items')
          .delete()
          .eq('id', id);
        if (deleteError) throw deleteError;
      } catch (err) {
        console.warn('[Menu] Supabase delete error:', err);
      }
    }
  };

  // ── Toggle availability ───────────────────────────────────────────────────────
  const toggleAvailability = async (id: string, available: boolean) => {
    await updateMenuItem(id, { available });
  };

  return {
    menuItems,
    loading,
    error,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleAvailability,
    refetch: fetchMenuItems,
  };
};
