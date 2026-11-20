import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SiteSettings } from '../types';

const DEFAULT_SETTINGS: SiteSettings = {
  site_name: 'Afoodable Bites',
  site_logo: '/images/afodable-bites-logo.jpg',
  site_description: 'Always Serving Hot! Sizzling Specialties, Hearty Rice Meals, and Comfort Soups.',
  currency: '₱',
  currency_code: 'PHP'
};

export const useSiteSettings = () => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSiteSettings = async () => {
    if (!isSupabaseConfigured) {
      setSiteSettings(DEFAULT_SETTINGS);
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
        setSiteSettings(DEFAULT_SETTINGS);
        return;
      }

      const settings: SiteSettings = {
        site_name: data.find(s => s.id === 'site_name')?.value || 'Afoodable Bites',
        site_logo: data.find(s => s.id === 'site_logo')?.value || '/images/afodable-bites-logo.jpg',
        site_description: data.find(s => s.id === 'site_description')?.value || DEFAULT_SETTINGS.site_description,
        currency: data.find(s => s.id === 'currency')?.value || '₱',
        currency_code: data.find(s => s.id === 'currency_code')?.value || 'PHP'
      };

      setSiteSettings(settings);
    } catch (err) {
      console.warn('Error fetching site settings from Supabase, using defaults:', err);
      setSiteSettings(DEFAULT_SETTINGS);
      setError(err instanceof Error ? err.message : 'Using default settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSiteSetting = async (id: string, value: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('site_settings')
        .update({ value })
        .eq('id', id);

      if (error) throw error;
      await fetchSiteSettings();
    } catch (err) {
      console.error('Error updating site setting:', err);
      setError(err instanceof Error ? err.message : 'Failed to update site setting');
      throw err;
    }
  };

  const updateSiteSettings = async (updates: Partial<SiteSettings>) => {
    try {
      setError(null);

      const updatePromises = Object.entries(updates).map(([id, value]) => {
        if (value !== undefined) {
          return supabase
            .from('site_settings')
            .update({ value })
            .eq('id', id);
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      await fetchSiteSettings();
    } catch (err) {
      console.error('Error updating site settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update site settings');
      throw err;
    }
  };

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  return {
    siteSettings,
    loading,
    error,
    updateSiteSetting,
    updateSiteSettings,
    refetch: fetchSiteSettings
  };
};
