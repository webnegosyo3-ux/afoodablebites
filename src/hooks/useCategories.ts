import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEFAULT_CATEGORIES } from '../data/defaultMenu';

export interface Category {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_KEY = 'afoodable_categories_v1';

const loadLocal = (): Category[] | null => {
  try {
    const s = localStorage.getItem(LOCAL_KEY);
    if (s) {
      const p = JSON.parse(s);
      if (Array.isArray(p) && p.length > 0) return p;
    }
  } catch {}
  return null;
};

const saveLocal = (cats: Category[]) => {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(cats)); } catch {}
};

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>(
    loadLocal() ?? DEFAULT_CATEGORIES
  );
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const persist = useCallback((cats: Category[]) => {
    saveLocal(cats);
    setCategories(cats);
  }, []);

  const fetchCategories = useCallback(async () => {
    if (!isSupabaseConfigured) {
      persist(loadLocal() ?? DEFAULT_CATEGORIES);
      return;
    }
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        persist(loadLocal() ?? DEFAULT_CATEGORIES);
        return;
      }

      // Deduplicate
      const unique = data.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
      // Merge local-only categories
      const local = loadLocal() ?? [];
      const remoteIds = new Set(unique.map(c => c.id));
      const localOnly = local.filter(c => !remoteIds.has(c.id));
      persist([...unique, ...localOnly]);
      setError(null);
    } catch (err) {
      console.warn('[Categories] Fetch error, using local cache:', err);
      const local = loadLocal();
      if (local) persist(local);
      setError(err instanceof Error ? err.message : 'Using cached categories');
    } finally {
      setLoading(false);
    }
  }, [persist]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const addCategory = async (category: Omit<Category, 'created_at' | 'updated_at'>) => {
    const newCat: Category = { ...category, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    persist([...categories, newCat]);

    if (isSupabaseConfigured) {
      try {
        const { data, error: insertError } = await supabase
          .from('categories')
          .insert({ id: category.id, name: category.name, icon: category.icon, sort_order: category.sort_order, active: category.active })
          .select().single();
        if (insertError) throw insertError;
        return data;
      } catch (err) {
        console.warn('[Categories] Supabase insert error — saved locally:', err);
      }
    }
    return newCat;
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const updated = categories.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c);
    persist(updated);

    if (isSupabaseConfigured) {
      try {
        const { error: updateError } = await supabase
          .from('categories')
          .update({ name: updates.name, icon: updates.icon, sort_order: updates.sort_order, active: updates.active })
          .eq('id', id);
        if (updateError) throw updateError;
      } catch (err) {
        console.warn('[Categories] Supabase update error — saved locally:', err);
      }
    }
  };

  const deleteCategory = async (id: string) => {
    // Check local items first
    const LOCAL_MENU_KEY = 'afoodable_menu_items_v1';
    try {
      const saved = localStorage.getItem(LOCAL_MENU_KEY);
      if (saved) {
        const items = JSON.parse(saved);
        if (Array.isArray(items) && items.some((i: any) => i.category === id)) {
          throw new Error('Cannot delete category that contains menu items. Please move or delete the items first.');
        }
      }
    } catch (e: any) {
      if (e.message.includes('Cannot delete')) throw e;
    }

    persist(categories.filter(c => c.id !== id));

    if (isSupabaseConfigured) {
      try {
        const { data: menuItems, error: checkError } = await supabase
          .from('menu_items').select('id').eq('category', id).limit(1);
        if (checkError) throw checkError;
        if (menuItems && menuItems.length > 0) {
          throw new Error('Cannot delete category that contains menu items. Please move or delete the items first.');
        }
        const { error: deleteError } = await supabase.from('categories').delete().eq('id', id);
        if (deleteError) throw deleteError;
      } catch (err) {
        console.warn('[Categories] Supabase delete error:', err);
        throw err;
      }
    }
  };

  const reorderCategories = async (reordered: Category[]) => {
    const withOrder = reordered.map((c, i) => ({ ...c, sort_order: i + 1 }));
    persist(withOrder);

    if (isSupabaseConfigured) {
      try {
        for (const c of withOrder) {
          await supabase.from('categories').update({ sort_order: c.sort_order }).eq('id', c.id);
        }
      } catch (err) {
        console.warn('[Categories] Supabase reorder error:', err);
      }
    }
  };

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    refetch: fetchCategories,
  };
};
