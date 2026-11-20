import React, { useState } from 'react';
import { Plus, Minus, X, ShoppingCart, Sparkles } from 'lucide-react';
import { MenuItem, Variation, AddOn } from '../types';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, quantity?: number, variation?: Variation, addOns?: AddOn[], variations?: Variation[]) => void;
  quantity: number;
  onUpdateQuantity: (id: string, quantity: number) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = React.memo(({
  item,
  onAddToCart,
  quantity,
  onUpdateQuantity
}) => {
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<Variation | undefined>(
    item.variations?.[0]
  );
  const [selectedVariations, setSelectedVariations] = useState<Variation[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<(AddOn & { quantity: number })[]>([]);

  const detectMaxFlavors = (description: string): number => {
    const lowerDesc = description.toLowerCase();
    const match = lowerDesc.match(/(?:pick|choose|select)?\s*(\d+)\s*flavors?/);
    if (match) {
      return parseInt(match[1]);
    }
    return 1;
  };

  const maxFlavors = item.maxFlavors || detectMaxFlavors(item.description);

  const calculatePrice = () => {
    let price = item.effectivePrice || item.basePrice;

    if (maxFlavors > 1 && selectedVariations.length > 0) {
      const maxVariationPrice = Math.max(...selectedVariations.map(v => v.price));
      price = (item.effectivePrice || item.basePrice) + maxVariationPrice;
    } else if (selectedVariation) {
      price = (item.effectivePrice || item.basePrice) + selectedVariation.price;
    }

    selectedAddOns.forEach(addOn => {
      price += addOn.price * addOn.quantity;
    });
    return price;
  };

  const toggleVariationSelection = (variation: Variation) => {
    setSelectedVariations(prev => {
      const isSelected = prev.find(v => v.id === variation.id);
      if (isSelected) {
        return prev.filter(v => v.id !== variation.id);
      } else if (prev.length < maxFlavors) {
        return [...prev, variation];
      }
      return prev;
    });
  };

  const handleAddToCart = () => {
    if (item.variations?.length || item.addOns?.length) {
      setShowCustomization(true);
    } else {
      onAddToCart(item, 1);
    }
  };

  const handleCustomizedAddToCart = () => {
    const addOnsForCart: AddOn[] = selectedAddOns.flatMap(addOn =>
      Array(addOn.quantity).fill({ ...addOn, quantity: undefined })
    );

    if (maxFlavors > 1 && selectedVariations.length > 0) {
      onAddToCart(item, 1, selectedVariations[0], addOnsForCart, selectedVariations);
    } else {
      onAddToCart(item, 1, selectedVariation, addOnsForCart);
    }

    setShowCustomization(false);
    setSelectedAddOns([]);
    setSelectedVariations([]);
  };

  const handleIncrement = () => {
    onUpdateQuantity(item.id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      onUpdateQuantity(item.id, quantity - 1);
    }
  };

  const updateAddOnQuantity = (addOn: AddOn, qty: number) => {
    setSelectedAddOns(prev => {
      const existingIndex = prev.findIndex(a => a.id === addOn.id);

      if (qty === 0) {
        return prev.filter(a => a.id !== addOn.id);
      }

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity: qty };
        return updated;
      } else {
        return [...prev, { ...addOn, quantity: qty }];
      }
    });
  };

  const groupedAddOns = item.addOns?.reduce((groups, addOn) => {
    const category = addOn.category || 'Add-ons';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(addOn);
    return groups;
  }, {} as Record<string, AddOn[]>);

  return (
    <>
      <div className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-zinc-200 flex flex-col justify-between ${!item.available ? 'opacity-60' : ''}`}>
        <div>
          {/* Image Container with Badges */}
          <div className="relative h-48 sm:h-52 bg-zinc-100 overflow-hidden">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.src = '/images/afodable-bites-logo.jpg';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-amber-50">
                <span className="text-5xl">🍲</span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {item.isOnDiscount && item.discountPrice && (
                <div className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md animate-pulse">
                  🔥 SALE
                </div>
              )}
              {item.popular && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-md flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>BEST SELLER</span>
                </div>
              )}
            </div>

            {!item.available && (
              <div className="absolute top-3 right-3 bg-zinc-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                UNAVAILABLE
              </div>
            )}
          </div>

          {/* Details Content */}
          <div className="p-4 sm:p-5">
            <h3 className="font-black text-lg sm:text-xl text-zinc-900 mb-1.5 leading-snug group-hover:text-amber-600 transition-colors">
              {item.name}
            </h3>

            <p className="text-xs sm:text-sm text-zinc-600 line-clamp-2 mb-3">
              {item.description}
            </p>

            {/* Add-ons indicator */}
            {item.addOns && item.addOns.length > 0 && (
              <div className="inline-flex items-center space-x-1 text-xs text-amber-800 bg-amber-50 font-semibold px-2.5 py-1 rounded-lg border border-amber-200 mb-2">
                <span>✨</span>
                <span>Includes Rice, Egg & Soup Add-ons</span>
              </div>
            )}
          </div>
        </div>

        {/* Pricing and Action Footer */}
        <div className="p-4 sm:p-5 pt-0 border-t border-zinc-100 flex items-center justify-between mt-auto">
          <div>
            <span className="text-xs text-zinc-500 block">Price</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-600">
                ₱{item.effectivePrice || item.basePrice}
              </span>
              {item.isOnDiscount && item.discountPrice && (
                <span className="text-xs text-zinc-400 line-through">
                  ₱{item.basePrice}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div>
            {!item.available ? (
              <button
                disabled
                className="bg-zinc-200 text-zinc-500 px-4 py-2 rounded-xl cursor-not-allowed font-bold text-xs"
              >
                Sold Out
              </button>
            ) : quantity === 0 ? (
              <button
                type="button"
                onClick={handleAddToCart}
                className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 font-black text-xs sm:text-sm shadow flex items-center space-x-1.5"
              >
                <span>{item.variations?.length || item.addOns?.length ? '✨ Customize' : '🛒 Add to Cart'}</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1.5 bg-amber-50 rounded-xl p-1 border-2 border-amber-400">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="p-1.5 hover:bg-amber-200 rounded-lg transition-colors active:scale-90"
                >
                  <Minus className="h-4 w-4 text-amber-900" />
                </button>
                <span className="font-black text-amber-950 min-w-[24px] text-center text-sm">{quantity}</span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="p-1.5 hover:bg-amber-200 rounded-lg transition-colors active:scale-90"
                >
                  <Plus className="h-4 w-4 text-amber-900" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customization Modal */}
      {showCustomization && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-200">
            <div className="sticky top-0 bg-white border-b border-zinc-200 p-5 sm:p-6 flex items-center justify-between rounded-t-3xl z-10">
              <div>
                <h3 className="text-xl font-black text-zinc-900">Customize {item.name}</h3>
                <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">Select your extra add-ons and toppings</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomization(false)}
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              {/* Optional Variations if any */}
              {item.variations && item.variations.length > 0 && (
                <div>
                  <h4 className="font-bold text-zinc-900 mb-3 text-sm">Select Variation</h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    {item.variations.map((variation) => {
                      const isSelected = selectedVariation?.id === variation.id;
                      return (
                        <label
                          key={variation.id}
                          className={`flex items-center space-x-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${isSelected
                            ? 'border-amber-500 bg-amber-50 shadow-sm'
                            : 'border-zinc-200 hover:border-amber-300'
                            }`}
                        >
                          <input
                            type="radio"
                            name="variation"
                            checked={isSelected}
                            onChange={() => setSelectedVariation(variation)}
                            className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-xs sm:text-sm font-semibold text-zinc-800">{variation.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add-ons List (Plain Rice, Fried Rice, Egg, Mushroom Soup) */}
              {groupedAddOns && Object.keys(groupedAddOns).length > 0 && (
                <div>
                  <h4 className="font-bold text-zinc-900 mb-3 text-sm">
                    🍚 Complete Your Meal with Add-ons:
                  </h4>
                  {Object.entries(groupedAddOns).map(([category, addOns]) => (
                    <div key={category} className="space-y-2.5">
                      {addOns.map((addOn) => {
                        const current = selectedAddOns.find(a => a.id === addOn.id);
                        return (
                          <div
                            key={addOn.id}
                            className="flex items-center justify-between p-3.5 border border-zinc-200 rounded-xl hover:border-amber-300 hover:bg-amber-50/40 transition-all"
                          >
                            <div>
                              <span className="font-bold text-zinc-800 text-sm block">{addOn.name}</span>
                              <span className="text-xs font-semibold text-amber-600">
                                +₱{addOn.price.toFixed(2)}
                              </span>
                            </div>

                            <div>
                              {current ? (
                                <div className="flex items-center space-x-2 bg-amber-50 rounded-xl p-1 border-2 border-amber-400">
                                  <button
                                    type="button"
                                    onClick={() => updateAddOnQuantity(addOn, current.quantity - 1)}
                                    className="p-1 hover:bg-amber-200 rounded-lg text-amber-900"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <span className="font-black text-amber-950 min-w-[20px] text-center text-xs">
                                    {current.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateAddOnQuantity(addOn, current.quantity + 1)}
                                    className="p-1 hover:bg-amber-200 rounded-lg text-amber-900"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => updateAddOnQuantity(addOn, 1)}
                                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                                >
                                  + Add
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* Price Calculation Summary */}
              <div className="border-t-2 border-amber-400 pt-4 bg-amber-50/70 -mx-5 sm:-mx-6 px-5 sm:px-6 py-3.5 rounded-b-2xl">
                <div className="flex items-center justify-between text-xl sm:text-2xl font-black mb-4">
                  <span className="text-zinc-800">Total Price:</span>
                  <span className="text-amber-600">₱{calculatePrice().toFixed(2)}</span>
                </div>

                <button
                  type="button"
                  onClick={handleCustomizedAddToCart}
                  className="w-full py-4 rounded-xl font-black text-base transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white hover:from-amber-400 hover:to-orange-400 active:scale-95"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Add to Cart - ₱{calculatePrice().toFixed(2)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

MenuItemCard.displayName = 'MenuItemCard';

export default MenuItemCard;
