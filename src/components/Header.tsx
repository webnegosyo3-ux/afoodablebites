import React, { useState, useRef } from 'react';
import { ShoppingCart, UtensilsCrossed, Search, X } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';

interface HeaderProps {
  currentView?: 'welcome' | 'menu' | 'cart' | 'checkout';
  cartItemsCount: number;
  onCartClick: () => void;
  onMenuClick: () => void;
  onHomeClick: () => void;
  selectedCategory?: string;
  onCategoryClick?: (categoryId: string) => void;
  onSearch?: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  currentView = 'welcome',
  cartItemsCount, 
  onCartClick, 
  onMenuClick,
  onHomeClick,
  onSearch,
}) => {
  const { siteSettings } = useSiteSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearch?.(val);
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch?.('');
    inputRef.current?.focus();
  };

  const handleToggleSearch = () => {
    if (searchOpen) {
      setSearchQuery('');
      onSearch?.('');
      setSearchOpen(false);
    } else {
      setSearchOpen(true);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  };

  const showSearch = currentView === 'menu';

  return (
    <>
      <header className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-md border-b-2 border-amber-500 shadow-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
            
            {/* Left: Logo */}
            <div className="flex items-center justify-start z-10 flex-shrink-0">
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
                  onError={(e) => { e.currentTarget.src = "/logo.jpg"; }}
                />
                <span className="font-black text-white text-base sm:text-lg tracking-tight hidden sm:inline">
                  Afoodable Bites
                </span>
              </button>
            </div>

            {/* Centre: Search bar (menu view, expanded) */}
            {showSearch && searchOpen && (
              <div className="flex-1 mx-2 sm:mx-4 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Hanapin ang pagkain..."
                    className="w-full pl-9 pr-8 py-2 bg-zinc-800 border border-zinc-600 focus:border-amber-400 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Right: Actions */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 z-10 flex-shrink-0">

              {/* Search toggle (menu view only) */}
              {showSearch && (
                <button
                  type="button"
                  onClick={handleToggleSearch}
                  className={`p-2 rounded-xl border transition-all active:scale-95 ${
                    searchOpen
                      ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                      : 'bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500'
                  }`}
                  title="Search menu"
                >
                  {searchOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Search className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              )}

              {/* View Menu Button (welcome view only) */}
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
                  <span className="bg-white text-orange-600 text-xs font-black rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center ring-2 ring-amber-300 shadow-md">
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
