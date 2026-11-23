import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MenuItem } from '../types';
import { DEFAULT_MENU_ITEMS } from '../data/defaultMenu';

export const useMenu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS);
  // Start as false — DEFAULT_MENU_ITEMS are always available immediately,
  // so the UI renders without a loading gate even before Supabase responds.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuItems = async () => {
    if (!isSupabaseConfigured) {
      setMenuItems(DEFAULT_MENU_ITEMS);
      return;
    }

    try {
      // Don't set loading=true here — we already have DEFAULT_MENU_ITEMS displayed,
      // so there's no need to show a spinner while Supabase responds.
      // The UI stays responsive on slow mobile connections.

      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select(`
          *,
          variations (*),
          add_ons (*)
        `)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      if (!items || items.length === 0) {
        // Fall back to requested default Afoodable Bites menu
        setMenuItems(DEFAULT_MENU_ITEMS);
        return;
      }

      const formattedItems: MenuItem[] = items.map(item => {
        const now = new Date();
        const discountStart = item.discount_start_date ? new Date(item.discount_start_date) : null;
        const discountEnd = item.discount_end_date ? new Date(item.discount_end_date) : null;

        const isDiscountActive = item.discount_active &&
          (!discountStart || now >= discountStart) &&
          (!discountEnd || now <= discountEnd);

        const effectivePrice = isDiscountActive && item.discount_price ? item.discount_price : item.base_price;

        return {
          id: item.id,
          name: item.name,
          description: item.description,
          basePrice: item.base_price,
          category: item.category,
          popular: item.popular,
          available: item.available ?? true,
          image: item.image_url || undefined,
          discountPrice: item.discount_price || undefined,
          discountStartDate: item.discount_start_date || undefined,
          discountEndDate: item.discount_end_date || undefined,
          discountActive: item.discount_active || false,
          effectivePrice,
          isOnDiscount: isDiscountActive,
          variations: item.variations?.map(v => ({
            id: v.id,
            name: v.name,
            price: v.price,
            image: v.image || undefined
          })) || [],
          addOns: item.add_ons?.map(a => ({
            id: a.id,
            name: a.name,
            price: a.price,
            category: a.category
          })) || []
        };
      });

      setMenuItems(formattedItems);
      setError(null);
    } catch (err) {
      console.warn('Error fetching menu items from Supabase, using defaults:', err);
      setMenuItems(DEFAULT_MENU_ITEMS);
      setError(err instanceof Error ? err.message : 'Using default menu items');
    }
  };

  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('menu_items')
        .insert({
          name: item.name,
          description: item.description,
          base_price: item.basePrice,
          category: item.category,
          popular: item.popular || false,
          available: item.available ?? true,
          image_url: item.image || null,
          discount_price: item.discountPrice || null,
          discount_start_date: item.discountStartDate || null,
          discount_end_date: item.discountEndDate || null,
          discount_active: item.discountActive || false
        })
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchMenuItems();
      return data;
    } catch (err) {
      console.error('Error adding menu item:', err);
      throw err;
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({
          name: updates.name,
          description: updates.description,
          base_price: updates.basePrice,
          category: updates.category,
          popular: updates.popular,
          available: updates.available,
          image_url: updates.image,
          discount_price: updates.discountPrice,
          discount_start_date: updates.discountStartDate,
          discount_end_date: updates.discountEndDate,
          discount_active: updates.discountActive
        })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchMenuItems();
    } catch (err) {
      console.error('Error updating menu item:', err);
      throw err;
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchMenuItems();
    } catch (err) {
      console.error('Error deleting menu item:', err);
      throw err;
    }
  };

  const toggleAvailability = async (id: string, available: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({ available })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchMenuItems();
    } catch (err) {
      console.error('Error updating availability:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  return {
    menuItems,
    loading,
    error,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleAvailability,
    refetch: fetchMenuItems
  };
};
