import React from 'react';
import { MenuItem, CartItem } from '../types';
import { useCategories } from '../hooks/useCategories';
import MenuItemCard from './MenuItemCard';

interface MenuProps {
  menuItems: MenuItem[];
  addToCart: (item: MenuItem, quantity?: number, variation?: any, addOns?: any[]) => void;
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  selectedCategory?: string;
}

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse border border-zinc-200">
              <div className="h-44 bg-zinc-200 rounded-xl mb-4" />
              <div className="h-5 bg-zinc-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-zinc-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        filteredCategories.map((category) => {
          const categoryItems = menuItems.filter(item => item.category === category.id);
          
          if (categoryItems.length === 0) return null;
          
          return (
            <section key={category.id} id={category.id} className="mb-10 sm:mb-12 scroll-mt-24">
              {/* Category Header */}
              <div className="flex items-center space-x-2.5 mb-5 pb-2 border-b-2 border-amber-400">
                <span className="text-2xl sm:text-3xl">{category.icon}</span>
                <h2 className="text-xl sm:text-2xl font-black text-zinc-900">{category.name}</h2>
                <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                  {categoryItems.length}
                </span>
              </div>
              
              {/* Responsive Tablet & Desktop Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {categoryItems.map((item) => {
                  const cartItem = cartItems.find(c => c.id === item.id);
                  return (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onAddToCart={addToCart}
                      quantity={cartItem?.quantity || 0}
                      onUpdateQuantity={updateQuantity}
                    />
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </main>
  );
};

export default Menu;
