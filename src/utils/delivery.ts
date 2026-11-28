import type { AdminOrder, CartItem, DeliveryLocation, ServiceType, SiteSettings } from '../types';

export interface DeliveryQuote {
  subtotal: number;
  deliveryFee: number;
  total: number;
  freeDeliveryEnabled: boolean;
  freeDeliveryThreshold: number;
  qualifiesForFreeDelivery: boolean;
  amountUntilFreeDelivery: number;
  requiresLocation: boolean;
  selectedLocationId: string | null;
  selectedLocationName: string | null;
  availableLocationCount: number;
}

export const roundMoney = (value: number): number => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const rounded = Math.round((safeValue + Number.EPSILON) * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
};

const nonNegativeNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

export const getActiveDeliveryLocations = (
  settings: Pick<SiteSettings, 'delivery_locations'>
): DeliveryLocation[] => {
  if (!Array.isArray(settings.delivery_locations)) return [];
  return settings.delivery_locations.filter(location => location.active);
};

export const getDeliveryQuote = (
  subtotalValue: number,
  serviceType: ServiceType,
  settings: Pick<SiteSettings, 'delivery_fee' | 'free_delivery_enabled' | 'free_delivery_threshold' | 'delivery_locations'>,
  locationId?: string
): DeliveryQuote => {
  const subtotal = roundMoney(nonNegativeNumber(subtotalValue));
  const activeLocations = getActiveDeliveryLocations(settings);
  const freeDeliveryEnabled = settings.free_delivery_enabled === true;
  const freeDeliveryThreshold = roundMoney(nonNegativeNumber(settings.free_delivery_threshold));
  const qualifiesForFreeDelivery = freeDeliveryEnabled && freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold;
  const isDelivery = serviceType === 'delivery';
  const selectedLocation = isDelivery && locationId
    ? activeLocations.find(location => location.id === locationId)
    : undefined;
  const hasLocationPricing = activeLocations.length > 0;
  const requiresLocation = isDelivery && hasLocationPricing && !selectedLocation;
  const configuredFee = selectedLocation
    ? roundMoney(nonNegativeNumber(selectedLocation.fee))
    : hasLocationPricing
      ? 0
      : roundMoney(nonNegativeNumber(settings.delivery_fee));
  const deliveryFee = isDelivery && !requiresLocation && configuredFee > 0 && !qualifiesForFreeDelivery ? configuredFee : 0;
  const amountUntilFreeDelivery = isDelivery && freeDeliveryEnabled && freeDeliveryThreshold > 0 && !qualifiesForFreeDelivery
    ? roundMoney(freeDeliveryThreshold - subtotal)
    : 0;

  return {
    subtotal,
    deliveryFee,
    total: roundMoney(subtotal + deliveryFee),
    freeDeliveryEnabled,
    freeDeliveryThreshold,
    qualifiesForFreeDelivery,
    amountUntilFreeDelivery,
    requiresLocation,
    selectedLocationId: selectedLocation?.id ?? null,
    selectedLocationName: selectedLocation?.name ?? null,
    availableLocationCount: activeLocations.length,
  };
};

export const getCartSubtotal = (items: CartItem[]): number => roundMoney(
  items.reduce((total, item) => total + (nonNegativeNumber(item.totalPrice) * nonNegativeNumber(item.quantity)), 0)
);

export const getOrderSubtotal = (order: Pick<AdminOrder, 'items'>): number => getCartSubtotal(order.items);

export const getOrderDeliveryFee = (
  order: Pick<AdminOrder, 'items' | 'total' | 'serviceType'>
): number => {
  if (order.serviceType !== 'delivery') return 0;
  return roundMoney(Math.max(0, nonNegativeNumber(order.total) - getOrderSubtotal(order)));
};
