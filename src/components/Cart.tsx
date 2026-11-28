import React from 'react';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, Flame, Sparkles, Check, Truck } from 'lucide-react';
import { CartItem, UpsellItem } from '../types';
import { useUpsells } from '../hooks/useUpsells';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { getActiveDeliveryLocations, getDeliveryQuote } from '../utils/delivery';

interface CartProps {
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  onContinueShopping: () => void;
  onCheckout: () => void;
  addToCart?: (item: any, quantity?: number) => void;
}

const Cart: React.FC<CartProps> = ({
  cartItems,
  updateQuantity,
  removeFromCart,
  clearCart,
  getTotalPrice,
  onContinueShopping,
  onCheckout,
  addToCart
}) => {
  const { activeUpsells } = useUpsells();
  const { siteSettings } = useSiteSettings();
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const activeDeliveryLocations = getActiveDeliveryLocations(siteSettings);
  const deliveryQuote = getDeliveryQuote(getTotalPrice(), 'delivery', siteSettings);
  const showDeliveryInfo = siteSettings.delivery_fee > 0 || deliveryQuote.freeDeliveryEnabled || activeDeliveryLocations.length > 0;

  const handleAddUpsell = (upsell: UpsellItem) => {
    if (!addToCart) return;
    const itemToAdd = {
      id: upsell.id,
      name: upsell.name,
      description: upsell.description,
      basePrice: upsell.price,
      category: upsell.category || 'extras',
      image: upsell.image,
      available: true
    };
    addToCart(itemToAdd as any, 1);
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <div className="text-center py-12 sm:py-16 px-6 bg-white rounded-3xl shadow-sm border border-zinc-200">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-4xl sm:text-5xl shadow-inner">
            🍲
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight mb-2">
            Your cart is empty
          </h2>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-8">
            Wala pang laman ang iyong cart. Piliin ang inyong paboritong sizzling meals, chicken, at drinks!
          </p>
          <button
            type="button"
            onClick={onContinueShopping}
            className="inline-flex items-center justify-center space-x-2 px-8 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white rounded-xl font-black text-base shadow-lg hover:shadow-orange-500/30 transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <Flame className="w-5 h-5 animate-pulse" />
            <span>Browse Menu</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
      {/* Top Header Section */}
      <div className="flex items-center justify-between mb-5 sm:mb-6 pb-3 border-b border-zinc-200/80">
        <button
          type="button"
          onClick={onContinueShopping}
          className="flex items-center space-x-1.5 text-zinc-600 hover:text-black transition-colors font-bold text-xs sm:text-sm active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Menu</span>
        </button>

        <div className="flex items-center space-x-2">
          <h1 className="text-lg sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center space-x-1.5">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            <span>Your Cart</span>
          </h1>
          <span className="text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (confirm('Clear all items from your cart?')) {
              clearCart();
            }
          }}
          className="text-red-500 hover:text-red-700 transition-colors font-bold text-xs sm:text-sm active:scale-95"
        >
          Clear All
        </button>
      </div>

      {/* Cart Items List */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-zinc-200 overflow-hidden mb-6 divide-y divide-zinc-100">
        {cartItems.map((item) => {
          const itemImage = item.selectedVariation?.image || item.image;

          return (
            <div
              key={item.id}
              className="p-3.5 sm:p-5 hover:bg-zinc-50/50 transition-colors"
            >
              <div className="flex items-start space-x-3 sm:space-x-4">
                {/* Food Thumbnail */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0 border border-zinc-200 flex items-center justify-center">
                  {itemImage ? (
                    <img
                      src={itemImage}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/afodable-bites-logo.jpg';
                      }}
                    />
                  ) : (
                    <span className="text-2xl">🍲</span>
                  )}
                </div>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm sm:text-base font-black text-zinc-900 leading-snug truncate">
                      {item.name}
                    </h3>

                    {/* Delete Item Button */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 sm:p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Variation / Flavors */}
                  {item.selectedVariations && item.selectedVariations.length > 0 ? (
                    <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5 line-clamp-1">
                      Flavors: <span className="text-zinc-700 font-semibold">{item.selectedVariations.map(v => v.name).join(' + ')}</span>
                    </p>
                  ) : item.selectedVariation ? (
                    <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5 line-clamp-1">
                      Flavor: <span className="text-zinc-700 font-semibold">{item.selectedVariation.name}</span>
                    </p>
                  ) : null}

                  {/* Add-ons */}
                  {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                    <p className="text-[11px] sm:text-xs text-amber-700 mt-0.5 line-clamp-1 font-medium">
                      + {item.selectedAddOns.map(addOn =>
                        addOn.quantity && addOn.quantity > 1
                          ? `${addOn.name} x${addOn.quantity}`
                          : addOn.name
                      ).join(', ')}
                    </p>
                  )}

                  {/* Price per item */}
                  <p className="text-xs text-zinc-400 mt-1">
                    ₱{item.totalPrice} each
                  </p>

                  {/* Quantity Stepper & Total Price Row (Mobile & Desktop Aligned) */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-100">
                    {/* Stepper */}
                    <div className="flex items-center space-x-1 bg-zinc-100 rounded-xl p-0.5 border border-zinc-200">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 sm:p-1.5 hover:bg-white rounded-lg transition-colors text-zinc-700 active:scale-90"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="font-black text-zinc-900 min-w-[28px] text-center text-xs sm:text-sm">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 sm:p-1.5 hover:bg-white rounded-lg transition-colors text-zinc-700 active:scale-90"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <span className="text-base sm:text-lg font-black text-amber-600">
                        ₱{item.totalPrice * item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* UPSELL & ADD-ON RECOMMENDATIONS SECTION */}
      {activeUpsells.length > 0 && addToCart && (
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-2 border-amber-300/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🔥</span>
              <h3 className="font-black text-sm sm:text-base text-zinc-900 tracking-tight">
                Complete Your Meal! (Add Drinks & Extras)
              </h3>
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              Madalas isabay
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeUpsells.map((upsell) => {
              const inCart = cartItems.find(c => c.name.toLowerCase() === upsell.name.toLowerCase() || c.id.startsWith(upsell.id));

              return (
                <div
                  key={upsell.id}
                  className="bg-white border border-amber-200/80 rounded-xl p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0 border border-zinc-200 flex items-center justify-center">
                      {upsell.image ? (
                        <img
                          src={upsell.image}
                          alt={upsell.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          onError={e => { e.currentTarget.src = '/images/afodable-bites-logo.jpg'; }}
                        />
                      ) : (
                        <span className="text-lg">🍚</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-zinc-900 truncate">
                        {upsell.name}
                      </h4>
                      <p className="text-xs font-black text-amber-600">
                        ₱{upsell.price}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddUpsell(upsell)}
                    className={`ml-2 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1 transition active:scale-90 flex-shrink-0 ${
                      inCart
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                        : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                    }`}
                  >
                    {inCart ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added ({inCart.quantity})</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delivery Pricing Notice */}
      {showDeliveryInfo && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 mb-6 space-y-2">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-amber-500" />
            <h3 className="font-black text-sm sm:text-base text-zinc-900">Delivery Pricing</h3>
          </div>
          {activeDeliveryLocations.length > 0 ? (
            <p className="text-xs sm:text-sm text-zinc-600">
              Delivery fees vary by location.{' '}
              <span className="font-bold text-zinc-900">
                {Math.min(...activeDeliveryLocations.map(location => location.fee)) === 0
                  ? 'Free-delivery locations are available.'
                  : `Fees start at ${siteSettings.currency}${Math.min(...activeDeliveryLocations.map(location => location.fee))}.`}
              </span>
            </p>
          ) : siteSettings.delivery_fee > 0 && (
            <p className="text-xs sm:text-sm text-zinc-600">
              Delivery fee: <span className="font-bold text-zinc-900">{siteSettings.currency}{siteSettings.delivery_fee}</span>
            </p>
          )}
          {deliveryQuote.freeDeliveryEnabled && deliveryQuote.freeDeliveryThreshold > 0 && (
            <p className={`text-xs sm:text-sm font-semibold ${
              deliveryQuote.qualifiesForFreeDelivery ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {deliveryQuote.qualifiesForFreeDelivery
                ? `Your food subtotal qualifies for free delivery.`
                : `Add ${siteSettings.currency}${deliveryQuote.amountUntilFreeDelivery} more in food and add-ons for free delivery.`}
            </p>
          )}
          <p className="text-[11px] text-zinc-400">Select Delivery and your location at checkout to see the exact fee. Pickup and dine-in have no delivery charge.</p>
        </div>
      )}

      {/* Checkout Summary Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-6 border border-zinc-200 space-y-4">
        <div className="flex items-center justify-between text-zinc-600 text-xs sm:text-sm">
          <span>Subtotal ({totalItems} items):</span>
          <span className="font-bold text-zinc-900">₱{getTotalPrice()}</span>
        </div>

        <div className="border-t border-zinc-200 pt-3 flex items-center justify-between">
          <span className="text-base sm:text-lg font-bold text-zinc-900">Total:</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-600">
            ₱{getTotalPrice()}
          </span>
        </div>

        <button
          type="button"
          onClick={onCheckout}
          className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white rounded-xl sm:rounded-2xl font-black text-base sm:text-lg shadow-lg hover:shadow-orange-500/30 transition-all duration-200 transform hover:scale-[1.01] active:scale-95 flex items-center justify-center space-x-2"
        >
          <span>Proceed to Checkout</span>
          <Flame className="w-5 h-5 animate-pulse" />
        </button>

        <p className="text-[11px] text-zinc-400 text-center">
          Available via Dine In, Pickup, at Cash on Delivery / GCash!
        </p>
      </div>
    </div>
  );
};

export default Cart;
