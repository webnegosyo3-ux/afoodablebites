import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SiteSettings } from '../types';

const LOCAL_KEY = 'afoodable_site_settings_v1';

export const DEFAULT_SETTINGS: SiteSettings = {
  site_name: 'Afoodable Bites',
  site_logo: '/images/afodable-bites-logo.jpg',
  site_description: 'Always Serving Hot! Sizzling Specialties, Hearty Rice Meals, and Comfort Soups.',
  currency: '₱',
  currency_code: 'PHP',
};

const loadLocal = (): SiteSettings | null => {
  try {
    const s = localStorage.getItem(LOCAL_KEY);
    if (s) {
      const p = JSON.parse(s);
      if (p && p.site_name) return p;
    }
  } catch {}
  return null;
};

const saveLocal = (settings: SiteSettings) => {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(settings)); } catch {}
};

export const useSiteSettings = () => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(
    loadLocal() ?? DEFAULT_SETTINGS
  );
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const persist = useCallback((s: SiteSettings) => {
    saveLocal(s);
    setSiteSettings(s);
  }, []);

  const fetchSiteSettings = useCallback(async () => {
    if (!isSupabaseConfigured) {
      persist(loadLocal() ?? DEFAULT_SETTINGS);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('id');

      if (error) throw error;

      if (!data || data.length === 0) {
        persist(loadLocal() ?? DEFAULT_SETTINGS);
        return;
      }

      const remote: SiteSettings = {
        site_name:        data.find(s => s.id === 'site_name')?.value        || DEFAULT_SETTINGS.site_name,
        site_logo:        data.find(s => s.id === 'site_logo')?.value        || DEFAULT_SETTINGS.site_logo,
        site_description: data.find(s => s.id === 'site_description')?.value || DEFAULT_SETTINGS.site_description,
        currency:         data.find(s => s.id === 'currency')?.value         || DEFAULT_SETTINGS.currency,
        currency_code:    data.find(s => s.id === 'currency_code')?.value    || DEFAULT_SETTINGS.currency_code,
      };
      persist(remote);
    } catch (err) {
      console.warn('[SiteSettings] Fetch error, using local cache:', err);
      const local = loadLocal();
      if (local) persist(local);
      setError(err instanceof Error ? err.message : 'Using cached settings');
    } finally {
      setLoading(false);
    }
  }, [persist]);

  useEffect(() => { fetchSiteSettings(); }, [fetchSiteSettings]);

  const updateSiteSetting = async (id: string, value: string) => {
    // Optimistic local update
    const updated = { ...siteSettings, [id]: value };
    persist(updated);

    if (isSupabaseConfigured) {
      try {
        setError(null);
        const { error } = await supabase
          .from('site_settings')
          .upsert({ id, value, type: 'text', updated_at: new Date().toISOString() }, { onConflict: 'id' });
        if (error) throw error;
      } catch (err) {
        console.warn('[SiteSettings] Supabase update error — saved locally:', err);
        setError(err instanceof Error ? err.message : 'Saved locally only');
      }
    }
  };

  const updateSiteSettings = async (updates: Partial<SiteSettings>) => {
    const updated = { ...siteSettings, ...updates };
    persist(updated);

    if (isSupabaseConfigured) {
      try {
        setError(null);
        for (const [id, value] of Object.entries(updates)) {
          if (value !== undefined) {
            await supabase
              .from('site_settings')
              .upsert({ id, value: String(value), type: 'text', updated_at: new Date().toISOString() }, { onConflict: 'id' });
          }
        }
      } catch (err) {
        console.warn('[SiteSettings] Supabase bulk update error — saved locally:', err);
        setError(err instanceof Error ? err.message : 'Saved locally only');
      }
    }
  };

  return {
    siteSettings,
    loading,
    error,
    updateSiteSetting,
    updateSiteSettings,
    refetch: fetchSiteSettings,
  };
};
