import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, ArrowLeft, GripVertical, FolderOpen, Flame, Menu } from 'lucide-react';
import { useCategories, Category } from '../hooks/useCategories';

interface CategoryManagerProps {
  onBack: () => void;
  onOpenSlideMenu?: () => void;
}

const inputCls =
  'w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition';
const labelCls = 'block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5';

const CategoryManager: React.FC<CategoryManagerProps> = ({ onBack, onOpenSlideMenu }) => {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    icon: '🍳',
    sort_order: 0,
    active: true
  });

  const handleAddCategory = () => {
    const nextSortOrder = Math.max(...categories.map(c => c.sort_order), 0) + 1;
    setFormData({
      id: '',
      name: '',
      icon: '🍳',
      sort_order: nextSortOrder,
      active: true
    });
    setCurrentView('add');
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      id: category.id,
      name: category.name,
      icon: category.icon,
      sort_order: category.sort_order,
      active: category.active
    });
    setCurrentView('edit');
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete category "${name}"? Items in this category might be affected.`)) {
      try {
        await deleteCategory(id);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to delete category');
      }
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name || !formData.icon) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await addCategory(formData);
      }
      setCurrentView('list');
      setEditingCategory(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCurrentView('list');
    setEditingCategory(null);
  };

  const generateIdFromName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      id: currentView === 'add' ? generateIdFromName(name) : formData.id
    });
  };

  // Form View (Add/Edit)
  if (currentView === 'add' || currentView === 'edit') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white pb-16">
        <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center space-x-1 text-zinc-400 hover:text-amber-400 transition text-xs sm:text-sm font-medium flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </button>
                <span className="text-zinc-700">|</span>
                <h1 className="text-sm sm:text-lg font-bold text-white flex items-center space-x-1.5 truncate">
                  <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />
                  <span className="truncate">{currentView === 'add' ? 'Add Category' : 'Edit Category'}</span>
                </h1>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 border border-zinc-700 hover:border-zinc-500 text-zinc-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
          <form onSubmit={handleSaveCategory} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div>
              <label className={labelCls}>Category Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={inputCls}
                placeholder="e.g. Sizzling Meals, Cold Drinks, Soups"
              />
            </div>

            <div>
              <label className={labelCls}>Category ID (Slug) *</label>
              <input
                type="text"
                required
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className={inputCls}
                placeholder="kebab-case-id"
                disabled={currentView === 'edit'}
              />
              <p className="text-xs text-zinc-500 mt-1">
                {currentView === 'edit'
                  ? 'Category ID cannot be changed once created.'
                  : 'Used for system routing and database identifiers (e.g. sizzling-meals, filipino-soups).'
                }
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Icon / Emoji *</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    required
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className={inputCls}
                    placeholder="🍳"
                  />
                  <div className="w-12 h-11 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {formData.icon || '🍽️'}
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>Display Sort Order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                  className={inputCls}
                  placeholder="1"
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center pt-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <span className="text-sm font-semibold text-zinc-200">Active Category (Visible to Customers)</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="px-5 py-2.5 border border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-bold text-sm rounded-xl hover:from-amber-400 hover:to-red-400 shadow-md transition flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Category'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-16">
      {/* Top Navbar */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              {onOpenSlideMenu && (
                <button
                  type="button"
                  onClick={onOpenSlideMenu}
                  className="p-1.5 sm:p-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 rounded-xl transition active:scale-95 flex-shrink-0"
                  title="Open Navigation Menu"
                  aria-label="Open slide menu"
                >
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </button>
              )}
              <button
                type="button"
                onClick={onBack}
                className="flex items-center space-x-1 text-zinc-400 hover:text-amber-400 transition text-xs sm:text-sm font-medium flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <span className="text-zinc-700">|</span>
              <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />
                <h1 className="text-sm sm:text-xl font-bold text-white truncate">
                  Categories
                </h1>
                <span className="text-[10px] sm:text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0">
                  {categories.length}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddCategory}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs sm:text-sm font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 shadow transition flex items-center space-x-1 sm:space-x-1.5 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                <FolderOpen className="w-4 h-4 text-amber-500" />
                <span>Menu Categories ({categories.length})</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Organize how food items are grouped and displayed on the menu.
              </p>
            </div>
          </div>

          <div className="divide-y divide-zinc-800">
            {categories.map((category) => (
              <div
                key={category.id}
                className="p-3 sm:p-5 hover:bg-zinc-800/40 transition flex items-center justify-between gap-2.5 sm:gap-4"
              >
                <div className="flex items-center space-x-2.5 sm:space-x-3.5 flex-1 min-w-0">
                  <div className="flex items-center space-x-1 sm:space-x-1.5 text-zinc-600 flex-shrink-0">
                    <GripVertical className="h-4 w-4 hidden sm:block text-zinc-600" />
                    <span className="text-[10px] sm:text-xs font-bold text-zinc-400 bg-zinc-800 px-1.5 sm:px-2 py-0.5 rounded">
                      #{category.sort_order}
                    </span>
                  </div>

                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow">
                    {category.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-y-0.5">
                      <h4 className="font-bold text-white text-sm sm:text-base break-words line-clamp-1 sm:line-clamp-none">
                        {category.name}
                      </h4>
                      <span
                        className={`inline-block px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex-shrink-0 ${
                          category.active
                            ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {category.active ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-zinc-500 font-mono truncate mt-0.5">ID: {category.id}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEditCategory(category)}
                    className="p-1.5 sm:p-2 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition"
                    title="Edit category"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(category.id, category.name)}
                    className="p-1.5 sm:p-2 text-zinc-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition"
                    title="Delete category"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {categories.length === 0 && (
              <div className="py-12 text-center">
                <FolderOpen className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">No categories found.</p>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs rounded-xl"
                >
                  Add First Category
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
