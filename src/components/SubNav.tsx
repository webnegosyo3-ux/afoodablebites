import React from 'react';
import { useCategories } from '../hooks/useCategories';

interface SubNavProps {
  selectedCategory: string;
  onCategoryClick: (categoryId: string) => void;
}

const SubNav: React.FC<SubNavProps> = ({ selectedCategory, onCategoryClick }) => {
  const { categories, loading } = useCategories();

  return (
    <div className="sticky top-20 z-40 bg-zinc-900/95 backdrop-blur-md border-b-2 border-amber-500/40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto py-3 scrollbar-hide">
          {loading ? (
            <div className="flex space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-24 bg-zinc-800 rounded-full animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* All Items Button */}
              <button
                type="button"
                onClick={() => onCategoryClick('all')}
                className={`px-4 sm:px-5 py-2 rounded-full text-sm sm:text-base font-bold transition-all duration-200 border-2 whitespace-nowrap shadow-md active:scale-95 ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400 scale-105 shadow-orange-500/30'
                    : 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:border-amber-400 hover:text-white'
                }`}
              >
                🔥 All Items
              </button>

              {/* Dynamic Categories */}
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onCategoryClick(c.id)}
                  className={`px-4 sm:px-5 py-2 rounded-full text-sm sm:text-base font-bold transition-all duration-200 border-2 flex items-center space-x-2 whitespace-nowrap shadow-md active:scale-95 ${
                    selectedCategory === c.id
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400 scale-105 shadow-orange-500/30'
                      : 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:border-amber-400 hover:text-white'
                  }`}
                >
                  <span className="text-base">{c.icon}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubNav;
