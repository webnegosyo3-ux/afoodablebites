import React from 'react';
import { ShoppingCart, Flame, UtensilsCrossed, Home, Sparkles } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';

interface HeaderProps {
  currentView?: 'welcome' | 'menu' | 'cart' | 'checkout';
  cartItemsCount: number;
  onCartClick: () => void;
  onMenuClick: () => void;
  onHomeClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  currentView = 'welcome',
  cartItemsCount, 
  onCartClick, 
  onMenuClick,
  onHomeClick 
}) => {
  const { siteSettings } = useSiteSettings();

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-md border-b-2 border-amber-500 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo and Store Name */}
          <button 
            type="button"
            onClick={onHomeClick}
            className="flex items-center space-x-3 group text-left transition-transform duration-200 active:scale-95"
          >
            <img 
              src="/images/afodable-bites-logo.jpg" 
              alt="Afoodable Bites Logo"
              className="h-14 w-14 sm:h-16 sm:w-16 object-contain rounded-full border-2 border-amber-400 shadow-lg group-hover:scale-105 transition-transform"
              onError={(e) => {
                e.currentTarget.src = "/logo.jpg";
              }}
            />
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors drop-shadow">
                  {siteSettings?.site_name || "Afoodable Bites"}
                </h1>
                <Flame className="w-5 h-5 text-orange-500 animate-pulse hidden sm:inline-block" />
              </div>
              <p className="text-xs sm:text-sm text-amber-300 font-bold tracking-wide italic">
                Always Serving Hot!
              </p>
            </div>
          </button>

          {/* Action and Navigation Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* If currently in Menu/Cart/Checkout, show Home/Promos button */}
            {currentView !== 'welcome' ? (
              <button 
                type="button"
                onClick={onHomeClick}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-xl transition-all duration-200 flex items-center space-x-1.5 font-bold text-xs sm:text-sm active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                <span>Promos</span>
              </button>
            ) : (
              /* If currently on Welcome, show direct Menu button */
              <button 
                type="button"
                onClick={onMenuClick}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50 rounded-xl transition-all duration-200 flex items-center space-x-1.5 font-bold text-xs sm:text-sm active:scale-95 shadow-sm"
              >
                <UtensilsCrossed className="h-4 w-4" />
                <span>View Menu</span>
              </button>
            )}

            {/* Cart Button */}
            <button 
              type="button"
              onClick={onCartClick}
              className="relative px-3.5 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-orange-500/30 flex items-center space-x-1.5 sm:space-x-2 font-bold text-xs sm:text-sm active:scale-95 ring-2 ring-amber-400/20"
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Cart</span>
              {cartItemsCount > 0 && (
                <span className="bg-white text-orange-600 text-xs font-black rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center animate-bounce-gentle ring-2 ring-amber-300 shadow-md ml-1">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
