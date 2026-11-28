import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DeliveryLocation, SiteSetting, SiteSettings } from '../types';

const LOCAL_KEY = 'afoodable_site_settings_v1';
const SETTING_TYPES: Record<string, SiteSetting['type']> = {
  delivery_fee: 'number',
  free_delivery_enabled: 'boolean',
  free_delivery_threshold: 'number',
  delivery_locations: 'text',
};

const parseBoolean = (value: unknown): boolean => value === true || value === 'true';

const parseNonNegativeNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const parseDeliveryLocations = (value: unknown): DeliveryLocation[] => {
  let parsed = value;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch { return []; }
  }
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter(item => item && typeof item === 'object')
    .map((item, index) => ({
      id: typeof item.id === 'string' && item.id ? item.id : `location-${index}`,
      name: typeof item.name === 'string' ? item.name.trim() : '',
      fee: parseNonNegativeNumber(item.fee),
      active: item.active !== false,
    }))
    .filter(item => item.name.length > 0);
};

const serializeSettingValue = (id: string, value: unknown): string =>
  id === 'delivery_locations' ? JSON.stringify(value) : String(value);

export const DEFAULT_SETTINGS: SiteSettings = {
  site_name: 'Afoodable Bites',
  site_logo: '/images/afodable-bites-logo.jpg',
  site_description: 'Always Serving Hot! Sizzling Specialties, Hearty Rice Meals, and Comfort Soups.',
  currency: '₱',
  currency_code: 'PHP',
  delivery_fee: 0,
  free_delivery_enabled: false,
  free_delivery_threshold: 0,
  delivery_locations: [],
};

const normalizeSettings = (settings?: Partial<SiteSettings> | null): SiteSettings => ({
  site_name: settings?.site_name || DEFAULT_SETTINGS.site_name,
  site_logo: settings?.site_logo || DEFAULT_SETTINGS.site_logo,
  site_description: settings?.site_description || DEFAULT_SETTINGS.site_description,
  currency: settings?.currency || DEFAULT_SETTINGS.currency,
  currency_code: settings?.currency_code || DEFAULT_SETTINGS.currency_code,
  delivery_fee: parseNonNegativeNumber(settings?.delivery_fee),
  free_delivery_enabled: parseBoolean(settings?.free_delivery_enabled),
  free_delivery_threshold: parseNonNegativeNumber(settings?.free_delivery_threshold),
  delivery_locations: parseDeliveryLocations(settings?.delivery_locations),
});

const loadLocal = (): SiteSettings | null => {
  try {
    const s = localStorage.getItem(LOCAL_KEY);
    if (s) {
      const p = JSON.parse(s);
      if (p && p.site_name) return normalizeSettings(p);
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
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error,   setError]   = useState<string | null>(null);

  const persist = useCallback((s: SiteSettings) => {
    const normalized = normalizeSettings(s);
    saveLocal(normalized);
    setSiteSettings(normalized);
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

      const settingValue = (id: string) => data.find(s => s.id === id)?.value;
      const remote = normalizeSettings({
        site_name:               settingValue('site_name'),
        site_logo:               settingValue('site_logo'),
        site_description:        settingValue('site_description'),
        currency:                settingValue('currency'),
        currency_code:           settingValue('currency_code'),
        delivery_fee:            parseNonNegativeNumber(settingValue('delivery_fee')),
        free_delivery_enabled:   parseBoolean(settingValue('free_delivery_enabled')),
        free_delivery_threshold: parseNonNegativeNumber(settingValue('free_delivery_threshold')),
        delivery_locations:      parseDeliveryLocations(settingValue('delivery_locations')),
      });
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

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== LOCAL_KEY) return;
      const local = loadLocal();
      if (local) setSiteSettings(local);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateSiteSetting = async (id: keyof SiteSettings, value: SiteSettings[keyof SiteSettings]) => {
    // Optimistic local update
    const updated = normalizeSettings({ ...siteSettings, [id]: value });
    persist(updated);

    if (isSupabaseConfigured) {
      try {
        setError(null);
        const { error } = await supabase
          .from('site_settings')
          .upsert({ id, value: serializeSettingValue(id, value), type: SETTING_TYPES[id] || 'text', updated_at: new Date().toISOString() }, { onConflict: 'id' });
        if (error) throw error;
      } catch (err) {
        console.warn('[SiteSettings] Supabase update error — saved locally:', err);
        setError(err instanceof Error ? err.message : 'Saved locally only');
      }
    }
  };

  const updateSiteSettings = async (updates: Partial<SiteSettings>) => {
    const updated = normalizeSettings({ ...siteSettings, ...updates });
    persist(updated);

    if (isSupabaseConfigured) {
      try {
        setError(null);
        for (const [id, value] of Object.entries(updates)) {
          if (value !== undefined) {
            const { error } = await supabase
              .from('site_settings')
              .upsert({ id, value: serializeSettingValue(id, value), type: SETTING_TYPES[id] || 'text', updated_at: new Date().toISOString() }, { onConflict: 'id' });
            if (error) throw error;
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
