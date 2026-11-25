import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MenuItem } from '../types';
import { DEFAULT_MENU_ITEMS } from '../data/defaultMenu';

const LOCAL_KEY = 'afoodable_menu_items_v1';
const MENU_UPDATE_EVENT = 'afoodable_menu_updated';

// ── localStorage helpers ──────────────────────────────────────────────────────
const loadLocal = (): MenuItem[] | null => {
  try {
    const s = localStorage.getItem(LOCAL_KEY);
    if (s) {
      const p = JSON.parse(s);
      if (Array.isArray(p) && p.length > 0) return p;
    }
  } catch (e) {
    console.warn('[Menu] Failed to parse local menu storage:', e);
  }
  return null;
};

const saveLocal = (items: MenuItem[]) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  } catch (err: any) {
    console.warn('[Menu] Storage save notice:', err);
    // If quota exceeded, try cleaning up or saving essential fields
    if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
      try {
        // Strip out any redundant historical data and retry
        localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
      } catch {}
    }
  }
};

// ── Row mapper ────────────────────────────────────────────────────────────────
const mapRow = (item: any): MenuItem => {
  const now = new Date();
  const discountStart = item.discount_start_date ? new Date(item.discount_start_date) : null;
  const discountEnd   = item.discount_end_date   ? new Date(item.discount_end_date)   : null;
  const isDiscountActive =
    Boolean(item.discount_active) &&
    (!discountStart || now >= discountStart) &&
    (!discountEnd   || now <= discountEnd);
  const effectivePrice =
    isDiscountActive && item.discount_price ? Number(item.discount_price) : Number(item.base_price ?? item.basePrice);

  return {
    id:               item.id,
    name:             item.name,
    description:      item.description,
    basePrice:        Number(item.base_price ?? item.basePrice),
    category:         item.category,
    popular:          item.popular ?? false,
    available:        item.available ?? true,
    image:            item.image_url ?? item.image ?? undefined,
    discountPrice:    item.discount_price ? Number(item.discount_price) : (item.discountPrice ? Number(item.discountPrice) : undefined),
    discountStartDate:item.discount_start_date ?? item.discountStartDate ?? undefined,
    discountEndDate:  item.discount_end_date   ?? item.discountEndDate   ?? undefined,
    discountActive:   item.discount_active     ?? item.discountActive    ?? false,
    effectivePrice,
    isOnDiscount:     isDiscountActive,
    updatedAt:        item.updated_at ?? item.updatedAt ?? undefined,
    variations: (item.variations ?? []).map((v: any) => ({
      id: v.id, name: v.name, price: Number(v.price), image: v.image ?? undefined
    })),
    addOns: (item.add_ons ?? item.addOns ?? []).map((a: any) => ({
      id: a.id, name: a.name, price: Number(a.price), category: a.category
    })),
  };
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useMenu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    return loadLocal() ?? DEFAULT_MENU_ITEMS;
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Push items to state + localStorage + notify other components in same & other tabs
  const persist = useCallback((items: MenuItem[]) => {
    saveLocal(items);
    setMenuItems(items);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(MENU_UPDATE_EVENT, { detail: items }));
    }
  }, []);

  const fetchMenuItems = useCallback(async () => {
    if (!isSupabaseConfigured) {
      const local = loadLocal();
      persist(local ?? DEFAULT_MENU_ITEMS);
      return;
    }

    try {
      setLoading(true);
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
      const local = loadLocal() ?? [];
      const localMap = new Map(local.map(i => [i.id, i]));

      // For each remote item, prefer the LOCAL image if:
      //  1. Local has a base64 image (data:...) — these can never be in Supabase
      //  2. Local has ANY image and remote has none
      //  3. Local image differs from remote (admin edited it locally)
      // For all other fields (name, price, etc.) use the remote value as source of truth.
      const merged = formatted.map(remoteItem => {
        const localItem = localMap.get(remoteItem.id);
        if (!localItem) return remoteItem;

        const localImg  = localItem.image;
        const remoteImg = remoteItem.image;

        const keepLocalImage =
          localImg && (
            localImg.startsWith('data:') ||   // base64 — never in Supabase
            !remoteImg ||                      // remote has no image yet
            localImg !== remoteImg             // admin changed it locally
          );

        return keepLocalImage
          ? { ...remoteItem, image: localImg }
          : remoteItem;
      });

      // Also preserve items that only exist locally (added offline / not yet synced)
      const remoteIds = new Set(formatted.map(i => i.id));
      const localOnly = local.filter(i => !remoteIds.has(i.id));

      persist([...merged, ...localOnly]);
      setError(null);
    } catch (err) {
      console.warn('[Menu] Fetch error, using local cache:', err);
      const local = loadLocal();
      if (local) persist(local);
      setError(err instanceof Error ? err.message : 'Using cached menu');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [persist]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchMenuItems();

    // Listen to changes across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_KEY) {
        const fresh = loadLocal();
        if (fresh) setMenuItems(fresh);
      }
    };

    // Listen to changes within same tab (e.g. AdminDashboard saving -> Menu viewing)
    const handleCustomUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setMenuItems(e.detail);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(MENU_UPDATE_EVENT, handleCustomUpdate);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(MENU_UPDATE_EVENT, handleCustomUpdate);
    };
  }, [fetchMenuItems]);

  // ── Add ─────────────────────────────────────────────────────────────────────
  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    const now = new Date().toISOString();
    const tempId = `item-${Date.now()}`;
    const newItem: MenuItem = { 
      ...item, 
      id: tempId,
      updatedAt: now,
      effectivePrice: (item.discountActive && item.discountPrice) ? item.discountPrice : item.basePrice,
      isOnDiscount: Boolean(item.discountActive)
    } as MenuItem;

    // Optimistic local save
    const currentList = loadLocal() ?? menuItems;
    const updated = [...currentList, newItem];
    persist(updated);

    if (isSupabaseConfigured) {
      try {
        const imageForSupabase =
          item.image && item.image.startsWith('data:')
            ? null
            : (item.image || null);

        const { data, error: insertError } = await supabase
          .from('menu_items')
          .upsert({
            id:                 newItem.id,
            name:               item.name,
            description:        item.description,
            base_price:         item.basePrice,
            category:           item.category,
            popular:            item.popular    || false,
            available:          item.available  ?? true,
            image_url:          imageForSupabase,
            discount_price:     item.discountPrice     || null,
            discount_start_date:item.discountStartDate || null,
            discount_end_date:  item.discountEndDate   || null,
            discount_active:    item.discountActive    || false,
            updated_at:         now,
          }, { onConflict: 'id' })
          .select()
          .single();

        if (insertError) {
          console.warn('[Menu] Supabase insert warning:', insertError.message);
        } else if (data) {
          const withRealId = updated.map(i => i.id === tempId ? { ...newItem, id: data.id } : i);
          persist(withRealId);
          return data;
        }
      } catch (err) {
        console.warn('[Menu] Supabase insert error — saved locally:', err);
      }
    }
    return newItem;
  };

  // ── Update ───────────────────────────────────────────────────────────────────
  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    const now = new Date().toISOString();
    const currentList = loadLocal() ?? menuItems;

    // Optimistic local update
    const updated = currentList.map(item => {
      if (item.id === id) {
        const isDiscountActive = updates.discountActive !== undefined ? updates.discountActive : item.discountActive;
        const discountPrice = updates.discountPrice !== undefined ? updates.discountPrice : item.discountPrice;
        const basePrice = updates.basePrice !== undefined ? updates.basePrice : item.basePrice;
        const effectivePrice = (isDiscountActive && discountPrice) ? discountPrice : basePrice;

        return {
          ...item,
          ...updates,
          effectivePrice,
          isOnDiscount: Boolean(isDiscountActive),
          updatedAt: now
        };
      }
      return item;
    });

    persist(updated);

    if (isSupabaseConfigured) {
      try {
        const targetItem = updated.find(i => i.id === id);
        if (!targetItem) return;

        // Use UPSERT so existing default items (e.g. sizzling-pork-sisig) are inserted/updated cleanly
        // Skip base64 images — too large for Supabase; kept in localStorage only
        const imageForSupabase =
          targetItem.image && targetItem.image.startsWith('data:')
            ? null
            : (targetItem.image || null);

        const { error: upsertError } = await supabase
          .from('menu_items')
          .upsert({
            id:                 targetItem.id,
            name:               targetItem.name,
            description:        targetItem.description,
            base_price:         targetItem.basePrice,
            category:           targetItem.category,
            popular:            targetItem.popular    || false,
            available:          targetItem.available  ?? true,
            image_url:          imageForSupabase,
            discount_price:     targetItem.discountPrice     || null,
            discount_start_date:targetItem.discountStartDate || null,
            discount_end_date:  targetItem.discountEndDate   || null,
            discount_active:    targetItem.discountActive    || false,
            updated_at:         now,
          }, { onConflict: 'id' });

        if (upsertError) {
          console.warn('[Menu] Supabase upsert error:', upsertError.message);
        }
      } catch (err) {
        console.warn('[Menu] Supabase update error — saved locally:', err);
      }
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const deleteMenuItem = async (id: string) => {
    const currentList = loadLocal() ?? menuItems;
    const updated = currentList.filter(i => i.id !== id);
    persist(updated);

    if (isSupabaseConfigured) {
      try {
        const { error: deleteError } = await supabase
          .from('menu_items')
          .delete()
          .eq('id', id);
        if (deleteError) {
          console.warn('[Menu] Supabase delete error:', deleteError.message);
        }
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
