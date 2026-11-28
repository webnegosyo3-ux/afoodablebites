import React, { useEffect, useState } from 'react';
import { Edit, Loader, MapPin, Plus, Save, Trash2, Truck, X } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { DeliveryLocation } from '../types';
import { getActiveDeliveryLocations, roundMoney } from '../utils/delivery';

const inputCls =
  'w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition disabled:opacity-50';
const labelCls = 'block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5';

const formatMoney = (value: number, currency: string): string =>
  `${currency}${value.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

const createLocationId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `location-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const DeliverySettingsManager: React.FC = () => {
  const { siteSettings, loading, error, updateSiteSettings } = useSiteSettings();
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState(false);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState('0');
  const [rulesError, setRulesError] = useState('');
  const [isSavingRules, setIsSavingRules] = useState(false);

  const [isLocationFormOpen, setIsLocationFormOpen] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [locationName, setLocationName] = useState('');
  const [locationFee, setLocationFee] = useState('0');
  const [locationActive, setLocationActive] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setDeliveryFee(String(siteSettings.delivery_fee));
    setFreeDeliveryEnabled(siteSettings.free_delivery_enabled);
    setFreeDeliveryThreshold(String(siteSettings.free_delivery_threshold));
  }, [
    siteSettings.delivery_fee,
    siteSettings.free_delivery_enabled,
    siteSettings.free_delivery_threshold
  ]);

  const locations = siteSettings.delivery_locations;
  const activeLocations = getActiveDeliveryLocations(siteSettings);
  const isBusy = isSavingRules || isSavingLocation;
  const currency = siteSettings.currency || '₱';

  const resetLocationForm = () => {
    setIsLocationFormOpen(false);
    setEditingLocationId(null);
    setLocationName('');
    setLocationFee('0');
    setLocationActive(true);
    setLocationError('');
  };

  const handleAddLocation = () => {
    setEditingLocationId(null);
    setLocationName('');
    setLocationFee('0');
    setLocationActive(true);
    setLocationError('');
    setIsLocationFormOpen(true);
  };

  const handleEditLocation = (location: DeliveryLocation) => {
    setEditingLocationId(location.id);
    setLocationName(location.name);
    setLocationFee(String(location.fee));
    setLocationActive(location.active);
    setLocationError('');
    setIsLocationFormOpen(true);
  };

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setRulesError('');
    setNotice('');

    const parsedFee = Number(deliveryFee);
    const parsedThreshold = Number(freeDeliveryThreshold || 0);
    if (deliveryFee.trim() === '' || !Number.isFinite(parsedFee) || parsedFee < 0) {
      setRulesError('Enter a valid fallback delivery fee of 0 or more.');
      return;
    }
    if (!Number.isFinite(parsedThreshold) || parsedThreshold < 0) {
      setRulesError('Enter a valid free-delivery minimum subtotal.');
      return;
    }
    if (freeDeliveryEnabled && parsedThreshold <= 0) {
      setRulesError('Enter a free-delivery minimum subtotal greater than 0, or disable free delivery.');
      return;
    }

    setIsSavingRules(true);
    try {
      await updateSiteSettings({
        delivery_fee: roundMoney(parsedFee),
        free_delivery_enabled: freeDeliveryEnabled,
        free_delivery_threshold: roundMoney(parsedThreshold)
      });
      setNotice('Delivery rules saved.');
    } catch {
      setRulesError('Failed to save delivery rules. Please try again.');
    } finally {
      setIsSavingRules(false);
    }
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocationError('');
    setNotice('');

    const name = locationName.trim();
    const fee = Number(locationFee);
    if (!name) {
      setLocationError('Enter a location name.');
      return;
    }
    if (locationFee.trim() === '' || !Number.isFinite(fee) || fee < 0) {
      setLocationError('Enter a valid delivery fee of 0 or more.');
      return;
    }
    const duplicate = locations.some(
      location => location.id !== editingLocationId && location.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      setLocationError('That location already exists. Edit the existing location instead.');
      return;
    }

    const nextLocations: DeliveryLocation[] = editingLocationId
      ? locations.map(location => location.id === editingLocationId
        ? { ...location, name, fee: roundMoney(fee), active: locationActive }
        : location)
      : [...locations, {
          id: createLocationId(),
          name,
          fee: roundMoney(fee),
          active: locationActive
        }];

    setIsSavingLocation(true);
    try {
      await updateSiteSettings({ delivery_locations: nextLocations });
      setNotice(editingLocationId ? 'Delivery location updated.' : 'Delivery location added.');
      resetLocationForm();
    } catch {
      setLocationError('Failed to save the delivery location. Please try again.');
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleToggleLocation = async (location: DeliveryLocation) => {
    setNotice('');
    setIsSavingLocation(true);
    try {
      await updateSiteSettings({
        delivery_locations: locations.map(item => item.id === location.id
          ? { ...item, active: !item.active }
          : item)
      });
      setNotice(`${location.name} ${location.active ? 'deactivated' : 'activated'}.`);
    } catch {
      setNotice('Failed to update the location. Please try again.');
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleDeleteLocation = async (location: DeliveryLocation) => {
    if (!confirm(`Delete "${location.name}"? Customers will no longer see this delivery option.`)) return;
    setNotice('');
    setIsSavingLocation(true);
    try {
      await updateSiteSettings({
        delivery_locations: locations.filter(item => item.id !== location.id)
      });
      if (editingLocationId === location.id) resetLocationForm();
      setNotice(`${location.name} deleted.`);
    } catch {
      setNotice('Failed to delete the location. Please try again.');
    } finally {
      setIsSavingLocation(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-zinc-800 rounded w-1/3" />
          <div className="h-4 bg-zinc-800 rounded w-3/4" />
          <div className="h-4 bg-zinc-800 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm">
          Settings sync issue: {error}. Changes may be saved only on this device.
        </div>
      )}

      {notice && (
        <div role="status" className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl px-4 py-3 text-sm font-semibold flex items-center justify-between gap-3">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss notification" className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-xl flex-shrink-0">
              <Truck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Delivery Settings</h2>
              <p className="text-sm text-zinc-400 mt-1">Set delivery locations and the fee customers pay for each area.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
              {activeLocations.length} active {activeLocations.length === 1 ? 'location' : 'locations'}
            </span>
            <span className={`px-3 py-1.5 rounded-full border ${activeLocations.length > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
              {activeLocations.length > 0 ? 'Location pricing' : 'Flat fee fallback'}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveRules} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div>
          <h3 className="text-base font-bold text-white">Delivery Rules</h3>
          <p className="text-xs text-zinc-400 mt-1">Delivery fees apply only to delivery orders. Pickup and dine-in remain free.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label htmlFor="fallback-delivery-fee" className={labelCls}>Fallback Delivery Fee</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">{currency}</span>
              <input
                id="fallback-delivery-fee"
                type="number"
                min="0"
                step="0.01"
                value={deliveryFee}
                onChange={e => setDeliveryFee(e.target.value)}
                className={`${inputCls} pl-8`}
                disabled={isBusy}
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">Used only when no delivery locations are active.</p>
          </div>

          <div>
            <span className={labelCls}>Free Delivery</span>
            <button
              type="button"
              role="switch"
              aria-checked={freeDeliveryEnabled}
              onClick={() => setFreeDeliveryEnabled(value => !value)}
              disabled={isBusy}
              className={`w-full px-4 py-3 rounded-xl border font-bold text-sm transition disabled:opacity-50 ${freeDeliveryEnabled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
            >
              {freeDeliveryEnabled ? 'Enabled' : 'Disabled'}
            </button>
            <p className="text-[11px] text-zinc-500 mt-1.5">Waive the selected location fee at the minimum subtotal.</p>
          </div>

          <div>
            <label htmlFor="free-delivery-threshold" className={labelCls}>Free Delivery Minimum</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">{currency}</span>
              <input
                id="free-delivery-threshold"
                type="number"
                min="0.01"
                step="0.01"
                value={freeDeliveryThreshold}
                onChange={e => setFreeDeliveryThreshold(e.target.value)}
                className={`${inputCls} pl-8`}
                disabled={isBusy || !freeDeliveryEnabled}
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">Food and add-ons subtotal, before the delivery fee.</p>
          </div>
        </div>

        {rulesError && <p role="alert" className="text-sm text-red-400">{rulesError}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isBusy}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-bold rounded-xl shadow hover:from-amber-400 hover:to-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isSavingRules ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSavingRules ? 'Saving…' : 'Save Delivery Rules'}</span>
          </button>
        </div>
      </form>

      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 sm:px-6 py-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-amber-500" />
              <span>Delivery Locations</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Customers choose from active locations during checkout.</p>
          </div>
          {!isLocationFormOpen && (
            <button
              type="button"
              onClick={handleAddLocation}
              disabled={isBusy}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-sm transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Add Location</span>
            </button>
          )}
        </div>

        {isLocationFormOpen && (
          <form onSubmit={handleSaveLocation} className="px-5 sm:px-6 py-5 bg-zinc-800/40 border-b border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white">{editingLocationId ? 'Edit Location' : 'New Location'}</h4>
              <button type="button" onClick={resetLocationForm} disabled={isSavingLocation} aria-label="Cancel location form" className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="delivery-location-name" className={labelCls}>Location Name</label>
                <input
                  id="delivery-location-name"
                  type="text"
                  value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Barangay San Isidro"
                  maxLength={100}
                  disabled={isSavingLocation}
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="delivery-location-fee" className={labelCls}>Delivery Fee</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">{currency}</span>
                  <input
                    id="delivery-location-fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={locationFee}
                    onChange={e => setLocationFee(e.target.value)}
                    className={`${inputCls} pl-8`}
                    disabled={isSavingLocation}
                  />
                </div>
              </div>
            </div>

            <label className="flex items-center space-x-2 text-sm text-zinc-300 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={locationActive}
                onChange={e => setLocationActive(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500"
                disabled={isSavingLocation}
              />
              <span>Active and visible to customers</span>
            </label>

            {locationError && <p role="alert" className="text-sm text-red-400">{locationError}</p>}

            <div className="flex justify-end space-x-2">
              <button type="button" onClick={resetLocationForm} disabled={isSavingLocation} className="px-4 py-2.5 border border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-sm font-medium transition disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={isSavingLocation} className="inline-flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-sm transition disabled:opacity-50">
                {isSavingLocation ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSavingLocation ? 'Saving…' : 'Save Location'}</span>
              </button>
            </div>
          </form>
        )}

        {locations.length > 0 ? (
          <div className="divide-y divide-zinc-800">
            {locations.map(location => (
              <div key={location.id} className={`px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${location.active ? '' : 'opacity-60'}`}>
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2 bg-zinc-800 rounded-xl flex-shrink-0">
                    <MapPin className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{location.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${location.active
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-zinc-700 text-zinc-300'}`}>
                        {location.active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-zinc-400">Customer delivery fee</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className={`text-lg font-black ${location.fee === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {location.fee === 0 ? 'FREE' : formatMoney(location.fee, currency)}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleToggleLocation(location)}
                      disabled={isBusy}
                      className="px-3 py-1.5 rounded-lg border border-zinc-700 text-xs font-bold text-zinc-300 hover:text-white hover:border-zinc-500 transition disabled:opacity-50"
                    >
                      {location.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditLocation(location)}
                      disabled={isBusy}
                      aria-label={`Edit ${location.name}`}
                      title="Edit location"
                      className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition disabled:opacity-50"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLocation(location)}
                      disabled={isBusy}
                      aria-label={`Delete ${location.name}`}
                      title="Delete location"
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 sm:px-6 py-12 text-center">
            <MapPin className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <h4 className="font-bold text-white mb-1">No delivery locations yet</h4>
            <p className="text-sm text-zinc-500">Add your first location to show location-specific fees at checkout.</p>
          </div>
        )}

        <div className="px-5 sm:px-6 py-4 bg-zinc-800/40 border-t border-zinc-800">
          <p className="text-xs text-zinc-400 leading-relaxed">
            {activeLocations.length > 0
              ? `Customers must choose one of the ${activeLocations.length} active locations. The flat fallback fee is not charged while location pricing is active.`
              : `No active locations. Delivery orders will use the fallback fee of ${formatMoney(siteSettings.delivery_fee, currency)}.`}
          </p>
        </div>
      </section>
    </div>
  );
};

export default DeliverySettingsManager;
