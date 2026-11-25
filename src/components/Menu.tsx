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
  searchQuery?: string;
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
    <section id={category.id} className="mb-10 sm:mb-12 scroll-mt-36">
      {/* Category Header with Title & Left/Right Swipe Controls */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-amber-400 gap-2">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <span className="text-xl sm:text-3xl flex-shrink-0">{category.icon}</span>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 min-w-0">
            <h2 className="text-base sm:text-2xl font-black text-zinc-900 tracking-tight break-words">
              {category.name}
            </h2>
            <span className="text-[11px] sm:text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap flex-shrink-0">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className={`p-1.5 sm:p-2 rounded-full border transition-all duration-200 active:scale-90 ${
              canScrollLeft
                ? 'bg-white text-zinc-800 border-zinc-300 hover:bg-amber-500 hover:text-white hover:border-amber-500 shadow-sm'
                : 'bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed opacity-40'
            }`}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className={`p-1.5 sm:p-2 rounded-full border transition-all duration-200 active:scale-90 ${
              canScrollRight
                ? 'bg-white text-zinc-800 border-zinc-300 hover:bg-amber-500 hover:text-white hover:border-amber-500 shadow-sm'
                : 'bg-zinc-100 text-zinc-300 border-zinc-200 cursor-not-allowed opacity-40'
            }`}
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Horizontal Swipe Container */}
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
  selectedCategory = 'all',
  searchQuery = ''
}) => {
  const { categories, loading: categoriesLoading } = useCategories();

  const q = searchQuery.trim().toLowerCase();

  const filteredCategories = React.useMemo(() => {
    return categories.filter(category => selectedCategory === 'all' || category.id === selectedCategory);
  }, [categories, selectedCategory]);

  // When searching, show all categories that have matching items
  const categoriesToShow = React.useMemo(() => {
    if (!q) return filteredCategories;
    return categories.filter(cat => {
      if (selectedCategory !== 'all' && cat.id !== selectedCategory) return false;
      return menuItems.some(item =>
        item.category === cat.id &&
        (item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q))
      );
    });
  }, [categories, selectedCategory, menuItems, q]);

  const getItemsForCategory = (categoryId: string) => {
    const base = menuItems.filter(item => item.category === categoryId);
    if (!q) return base;
    return base.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  };

  const totalResults = q
    ? menuItems.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      ).length
    : null;

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
        <>
          {/* Search results count */}
          {q && (
            <div className="mb-4 text-sm text-zinc-500">
              {totalResults === 0
                ? `Walang nahanap para sa "${searchQuery}"`
                : `${totalResults} resulta para sa "${searchQuery}"`}
            </div>
          )}

          {categoriesToShow.map((category) => {
            const categoryItems = getItemsForCategory(category.id);
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
          })}

          {q && totalResults === 0 && (
            <div className="bg-white rounded-3xl p-12 text-center space-y-3 border border-zinc-200">
              <div className="text-5xl">🔍</div>
              <h3 className="text-lg font-bold text-zinc-700">Walang nahanap</h3>
              <p className="text-sm text-zinc-400">
                Walang menu item na tugma sa "<strong>{searchQuery}</strong>". Subukan ang ibang salita.
              </p>
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default Menu;