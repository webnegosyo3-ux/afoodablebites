import React from 'react';
import { ShoppingCart, UtensilsCrossed } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';

interface HeaderProps {
  currentView?: 'welcome' | 'menu' | 'cart' | 'checkout';
  cartItemsCount: number;
  onCartClick: () => void;
  onMenuClick: () => void;
  onHomeClick: () => void;
  selectedCategory?: string;
  onCategoryClick?: (categoryId: string) => void;
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
    <>
      <header className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-md border-b-2 border-amber-500 shadow-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Left: Logo */}
            <div className="flex items-center justify-start z-10">
              <button 
                type="button"
                onClick={onHomeClick}
                className="group transition-transform duration-200 active:scale-95 flex items-center space-x-2.5"
                title="Home"
              >
                <img 
                  src="/images/afodable-bites-logo.jpg" 
                  alt="Afoodable Bites Logo"
                  className="h-10 w-10 sm:h-14 sm:w-14 object-contain rounded-full border-2 border-amber-400 shadow-lg group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    e.currentTarget.src = "/logo.jpg";
                  }}
                />
                <span className="font-black text-white text-base sm:text-lg tracking-tight hidden xs:inline">
                  Afoodable Bites
                </span>
              </button>
            </div>

            {/* Right Side: Action and Navigation Buttons */}
            <div className="flex items-center justify-end space-x-2 sm:space-x-3 z-10">
              {/* View Menu Button */}
              {currentView === 'welcome' && (
                <button 
                  type="button"
                  onClick={onMenuClick}
                  className="px-2.5 sm:px-4 py-2 sm:py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50 rounded-xl transition-all duration-200 flex items-center space-x-1 sm:space-x-1.5 font-bold text-xs sm:text-sm active:scale-95 shadow-sm"
                >
                  <UtensilsCrossed className="h-4 w-4" />
                  <span className="hidden xs:inline">View Menu</span>
                </button>
              )}

              {/* Cart Button */}
              <button 
                type="button"
                onClick={onCartClick}
                className="relative px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-orange-500/30 flex items-center space-x-1.5 sm:space-x-2 font-bold text-xs sm:text-sm active:scale-95 ring-2 ring-amber-400/20"
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden xs:inline">Cart</span>
                {cartItemsCount > 0 && (
                  <span className="bg-white text-orange-600 text-xs font-black rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center animate-bounce-gentle ring-2 ring-amber-300 shadow-md">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
