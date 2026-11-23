import { useState, useEffect, useCallback } from 'react';
import { UpsellItem } from '../types';

const STORAGE_KEY = 'afoodable_upsells_v1';

export const DEFAULT_UPSELLS: UpsellItem[] = [
  {
    id: 'upsell-java-rice',
    name: 'Extra Java Rice',
    description: 'Mainit at flavorful Java rice para sa sizzling meals',
    price: 25,
    category: 'Rice & Extras',
    image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400&auto=format&fit=crop&q=80',
    active: true,
    sortOrder: 1
  },
  {
    id: 'upsell-fried-egg',
    name: 'Crispy Fried Egg',
    description: 'Sunny-side up egg na bagong prito, best partner sa sisig',
    price: 20,
    category: 'Add-ons',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&auto=format&fit=crop&q=80',
    active: true,
    sortOrder: 2
  },
  {
    id: 'upsell-iced-tea',
    name: 'House Blend Iced Tea (16oz)',
    description: 'Malamig, matamis, at nakakarefresh na inumin',
    price: 39,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop&q=80',
    active: true,
    sortOrder: 3
  },
  {
    id: 'upsell-cheesy-dip',
    name: 'Cheesy Garlic Dip',
    description: 'Creamy garlic cheese sauce pampalasa',
    price: 25,
    category: 'Sauces',
    image: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400&auto=format&fit=crop&q=80',
    active: true,
    sortOrder: 4
  },
  {
    id: 'upsell-mineral-water',
    name: 'Bottled Mineral Water',
    description: '500ml purified cold water',
    price: 20,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&auto=format&fit=crop&q=80',
    active: true,
    sortOrder: 5
  }
];

export const useUpsells = () => {
  const [upsells, setUpsells] = useState<UpsellItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse upsells from localStorage', e);
    }
    return DEFAULT_UPSELLS;
  });

  const saveUpsells = (newUpsells: UpsellItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUpsells));
      setUpsells(newUpsells);
    } catch (e) {
      console.error('Failed to save upsells to localStorage', e);
    }
  };

  const addUpsell = useCallback((item: Omit<UpsellItem, 'id'>) => {
    const newItem: UpsellItem = {
      ...item,
      id: `upsell-${Date.now()}`
    };
    const updated = [...upsells, newItem];
    saveUpsells(updated);
    return newItem;
  }, [upsells]);

  const updateUpsell = useCallback((id: string, updates: Partial<UpsellItem>) => {
    const updated = upsells.map(u => (u.id === id ? { ...u, ...updates } : u));
    saveUpsells(updated);
  }, [upsells]);

  const deleteUpsell = useCallback((id: string) => {
    const updated = upsells.filter(u => u.id !== id);
    saveUpsells(updated);
  }, [upsells]);

  const toggleUpsell = useCallback((id: string) => {
    const updated = upsells.map(u => (u.id === id ? { ...u, active: !u.active } : u));
    saveUpsells(updated);
  }, [upsells]);

  const resetToDefault = useCallback(() => {
    saveUpsells(DEFAULT_UPSELLS);
  }, []);

  const activeUpsells = upsells
    .filter(u => u.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    upsells,
    activeUpsells,
    addUpsell,
    updateUpsell,
    deleteUpsell,
    toggleUpsell,
    resetToDefault
  };
};
