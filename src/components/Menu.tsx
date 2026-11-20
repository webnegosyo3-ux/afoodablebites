import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { MenuItem, CartItem, Category } from '../types';
import { useCategories } from '../hooks/useCategories';
import MenuItemCard from './MenuItemCard';

interface MenuProps {
  menuItems: MenuItem[];
  addToCart: (item: MenuItem, quantity?: number, variation?: any, addOns?: any[]) => void;
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  selectedCategory?: string;
}

interface CategoryRowProps {
  category: Category;
  items: MenuItem[];
  cartItems: CartItem[];
  addToCart: (item: MenuItem, quantity?: number, variation?: any, addOns?: any[]) => void;
  updateQuantity: (id: string, quantity: number) => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({
  category,
  items,
  cartItems,
  addToCart,
  updateQuantity
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 340;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <section id={category.id} className="mb-10 sm:mb-12 scroll-mt-24">
      {/* Category Header with Title & Left/Right Swipe Controls */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-amber-400">
        <div className="flex items-center space-x-2.5">
          <span className="text-2xl sm:text-3xl">{category.icon}</span>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
            {category.name}
          </h2>
          <span className="text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-0.5 rounded-full shadow-sm">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Swipe Hint + Navigation Arrows */}
        <div className="flex items-center space-x-2">
          <span className="hidden sm:inline-flex items-center space-x-1 text-xs font-bold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200">
            <span>👈</span>
            <span>Swipe left / right</span>
            <span>👉</span>
          </span>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className={`p-2 rounded-full border transition-all duration-200 active:scale-90 ${
                canScrollLeft
                  ? 'bg-white text-zinc-800 border-zinc-300 hover:bg-amber-500 hover:text-white hover:border-amber-500 shadow-sm'
                  : 'bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed opacity-50'
              }`}
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className={`p-2 rounded-full border transition-all duration-200 active:scale-90 ${
                canScrollRight
                  ? 'bg-white text-zinc-800 border-zinc-300 hover:bg-amber-500 hover:text-white hover:border-amber-500 shadow-sm'
                  : 'bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed opacity-50'
              }`}
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Swipe Cue Bar */}
      <div className="sm:hidden flex items-center justify-between text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/70 rounded-lg px-3 py-1 mb-3">
        <span>👉 Swipe left and right to see all items</span>
        <span className="text-xs">‹ ›</span>
      </div>

      {/* Horizontal Swipe Container (Swipe Left & Right) */}
      <div
        ref={scrollRef}
        className="flex space-x-4 sm:space-x-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-2 px-1 scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {items.map((item) => {
          const cartItem = cartItems.find((c) => c.id === item.id);
          return (
            <div
              key={item.id}
              className="w-[280px] sm:w-[320px] md:w-[340px] flex-shrink-0 snap-start flex flex-col"
            >
              <MenuItemCard
                item={item}
                onAddToCart={addToCart}
                quantity={cartItem?.quantity || 0}
                onUpdateQuantity={updateQuantity}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};

const Menu: React.FC<MenuProps> = ({ 
  menuItems, 
  addToCart, 
  cartItems, 
  updateQuantity, 
  selectedCategory = 'all' 
}) => {
  const { categories, loading: categoriesLoading } = useCategories();

  const filteredCategories = React.useMemo(() => {
    return categories.filter(category => selectedCategory === 'all' || category.id === selectedCategory);
  }, [categories, selectedCategory]);

  return (
    <main id="menu-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Category Sections & Menu Cards */}
      {categoriesLoading ? (
        <div className="space-y-8">
          {[1, 2].map((catIndex) => (
            <div key={catIndex} className="animate-pulse">
              <div className="h-8 bg-zinc-200 rounded w-48 mb-4" />
              <div className="flex space-x-4 overflow-hidden py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-[280px] sm:w-[320px] bg-white rounded-2xl p-4 shadow-sm border border-zinc-200 shrink-0">
                    <div className="h-44 bg-zinc-200 rounded-xl mb-4" />
                    <div className="h-5 bg-zinc-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-zinc-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        filteredCategories.map((category) => {
          const categoryItems = menuItems.filter(item => item.category === category.id);
          
          if (categoryItems.length === 0) return null;
          
          return (
            <CategoryRow
              key={category.id}
              category={category}
              items={categoryItems}
              cartItems={cartItems}
              addToCart={addToCart}
              updateQuantity={updateQuantity}
            />
          );
        })
      )}
    </main>
  );
};

export default Menu;