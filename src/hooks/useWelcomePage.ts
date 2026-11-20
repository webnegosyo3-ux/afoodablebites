import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { WelcomePageConfig, WelcomeSlide } from '../types';

export const DEFAULT_WELCOME_CONFIG: WelcomePageConfig = {
  tagline: 'Always Serving Hot!',
  buttonText: 'ORDER NOW',
  slideDuration: 3500,
  autoSlide: true,
  slides: [
    {
      id: 'slide-1',
      badge: '🎉 WEEKEND BARKADA PROMO',
      badgeColor: 'bg-red-600 text-white',
      title: 'Barkada Feast Special',
      subtitle: 'Order 3 Sizzling Meals & Get 1 Free Drink + Mushroom Soup!',
      tagline: 'Available every Saturday & Sunday',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80'
    },
    {
      id: 'slide-2',
      badge: '⏰ LUNCH RUSH HOUR',
      badgeColor: 'bg-amber-500 text-black',
      title: 'Lunch Sizzler Combo',
      subtitle: 'Sizzling Pork Sisig + Extra Garlic Rice & Cold Drink for only ₱149!',
      tagline: '11:00 AM to 2:00 PM Daily',
      image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=1200&auto=format&fit=crop&q=80'
    },
    {
      id: 'slide-3',
      badge: '🎓 STUDENT BUDGET PROMO',
      badgeColor: 'bg-emerald-600 text-white',
      title: 'Budget Bites Meal',
      subtitle: 'Steamed Siomai Rice + Cold House Blend Iced Tea for ₱89 Only!',
      tagline: 'Pang-masa sarap everyday',
      image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=1200&auto=format&fit=crop&q=80'
    },
    {
      id: 'slide-4',
      badge: '🎸 RESTO EVENT NIGHT',
      badgeColor: 'bg-purple-600 text-white',
      title: 'Live Acoustic Dinner Nights',
      subtitle: 'Chill and enjoy your hot sizzling favorites with live acoustic music!',
      tagline: 'Every Friday & Saturday • 6:00 PM onwards',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80'
    },
    {
      id: 'slide-5',
      badge: '🍱 PARTY TRAYS & CATERING',
      badgeColor: 'bg-orange-600 text-white',
      title: 'Events & Party Trays',
      subtitle: 'Large pans of Sizzling Sisig, Stir-Fry & Chicken Fillet for your celebrations!',
      tagline: 'Book your orders in advance',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80'
    }
  ]
};

const LOCAL_STORAGE_KEY = 'afoodable_welcome_config_v1';

export const useWelcomePage = () => {
  const [config, setConfig] = useState<WelcomePageConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
          return {
            ...DEFAULT_WELCOME_CONFIG,
            ...parsed
          };
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_WELCOME_CONFIG;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync to database if Supabase is active
  const persistConfig = useCallback(async (newConfig: WelcomePageConfig) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newConfig));
      setConfig(newConfig);

      if (isSupabaseConfigured) {
        const payload = {
          id: 'welcome_page_config',
          value: JSON.stringify(newConfig),
          type: 'text',
          description: 'Welcome page promotional slides and display configurations',
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('site_settings')
          .upsert(payload, { onConflict: 'id' });

        if (error) {
          console.warn('Supabase upsert warning for welcome_page_config:', error);
        }
      }
    } catch (err) {
      console.error('Error saving welcome config:', err);
      setError(err instanceof Error ? err.message : 'Failed to save welcome page config');
      throw err;
    }
  }, []);

  const fetchFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'welcome_page_config')
        .maybeSingle();

      if (error) {
        console.warn('Could not fetch welcome_page_config from Supabase:', error);
        return;
      }

      if (data && data.value) {
        const parsed = JSON.parse(data.value);
        if (parsed && Array.isArray(parsed.slides)) {
          const merged: WelcomePageConfig = {
            ...DEFAULT_WELCOME_CONFIG,
            ...parsed
          };
          setConfig(merged);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        }
      }
    } catch (err) {
      console.warn('Error reading welcome config from Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFromSupabase();
  }, [fetchFromSupabase]);

  const updateConfig = async (newConfig: Partial<WelcomePageConfig>) => {
    const updated: WelcomePageConfig = {
      ...config,
      ...newConfig
    };
    await persistConfig(updated);
  };

  const addSlide = async (newSlide: Omit<WelcomeSlide, 'id'>) => {
    const slideWithId: WelcomeSlide = {
      ...newSlide,
      id: `slide-${Date.now()}`
    };
    const updated: WelcomePageConfig = {
      ...config,
      slides: [...config.slides, slideWithId]
    };
    await persistConfig(updated);
    return slideWithId;
  };

  const updateSlide = async (id: string, updates: Partial<WelcomeSlide>) => {
    const updatedSlides = config.slides.map((s) => 
      s.id === id ? { ...s, ...updates } : s
    );
    const updated: WelcomePageConfig = {
      ...config,
      slides: updatedSlides
    };
    await persistConfig(updated);
  };

  const deleteSlide = async (id: string) => {
    if (config.slides.length <= 1) {
      throw new Error('You must have at least one slide on the welcome page.');
    }
    const updatedSlides = config.slides.filter((s) => s.id !== id);
    const updated: WelcomePageConfig = {
      ...config,
      slides: updatedSlides
    };
    await persistConfig(updated);
  };

  const reorderSlides = async (newSlides: WelcomeSlide[]) => {
    const updated: WelcomePageConfig = {
      ...config,
      slides: newSlides
    };
    await persistConfig(updated);
  };

  const resetToDefaults = async () => {
    await persistConfig(DEFAULT_WELCOME_CONFIG);
  };

  return {
    config,
    loading,
    error,
    updateConfig,
    addSlide,
    updateSlide,
    deleteSlide,
    reorderSlides,
    resetToDefaults,
    refetch: fetchFromSupabase
  };
};
