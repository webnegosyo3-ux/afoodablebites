import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Sparkles, 
  Flame, 
  Check, 
  X, 
  Save, 
  RotateCcw,
  Package,
  Layers
} from 'lucide-react';
import { useUpsells } from '../hooks/useUpsells';
import { useMenu } from '../hooks/useMenu';
import { UpsellItem } from '../types';
import ImageUpload from './ImageUpload';

interface UpsellManagerProps {
  onBack: () => void;
}

const inputCls =
  'w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition';
const labelCls = 'block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5';

const UpsellManager: React.FC<UpsellManagerProps> = ({ onBack }) => {
  const { upsells, addUpsell, updateUpsell, deleteUpsell, toggleUpsell, resetToDefault } = useUpsells();
  const { menuItems } = useMenu();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showImportMenu, setShowImportMenu] = useState(false);

  const [formData, setFormData] = useState<Omit<UpsellItem, 'id'>>({
    name: '',
    description: '',
    price: 0,
    category: 'Extras',
    image: '',
    active: true,
    sortOrder: upsells.length + 1
  });

  const handleStartAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: 'Extras',
      image: '',
      active: true,
      sortOrder: upsells.length + 1
    });
    setIsEditing(true);
  };

  const handleStartEdit = (item: UpsellItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category || 'Extras',
      image: item.image || '',
      active: item.active,
      sortOrder: item.sortOrder
    });
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.price <= 0) {
      alert('Pakilagay ang pangalan at tamang presyo ng upsell item.');
      return;
    }

    if (editingId) {
      updateUpsell(editingId, formData);
    } else {
      addUpsell(formData);
    }
    setIsEditing(false);
    setEditingId(null);
  };

  const handleImportMenuItem = (menuItem: any) => {
    setFormData({
      name: menuItem.name,
      description: menuItem.description || 'Paboritong dagdag sa inyong order',
      price: menuItem.isOnDiscount && menuItem.discountPrice ? menuItem.discountPrice : menuItem.basePrice,
      category: 'Menu Add-on',
      image: menuItem.image || '',
      active: true,
      sortOrder: upsells.length + 1
    });
    setShowImportMenu(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-16">
      {/* Top Navbar */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center space-x-1.5 text-zinc-400 hover:text-amber-400 transition text-sm font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
              <span className="text-zinc-700">|</span>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  Upsell & Cross-sell Offers
                </h1>
                <span className="text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  {upsells.filter(u => u.active).length} Active
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleStartAdd}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow hover:scale-105 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Upsell Item</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Intro Banner */}
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-red-500/10 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-white font-bold text-base flex items-center space-x-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span>Ordering Upsell & Add-on Suggestions</span>
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Lalabas ang mga items na ito sa Cart bago mag-checkout ("Complete Your Meal!") para maengganyo ang customer na magdagdag ng Extra Rice, Drinks, Egg, at Dips.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (confirm('Ibalik sa default upsell recommendations?')) {
                resetToDefault();
              }
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold border border-zinc-700 transition flex-shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>
        </div>

        {/* Edit / Add Modal or Form */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-lg font-black text-white flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>{editingId ? 'Edit Upsell Offer' : 'Add New Upsell Offer'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Import from Menu button */}
              {!editingId && (
                <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-zinc-300">
                    <Package className="w-4 h-4 text-amber-400" />
                    <span>Import galing sa existing Menu?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowImportMenu(!showImportMenu)}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 underline"
                  >
                    {showImportMenu ? 'Hide Menu' : 'Browse Menu Items'}
                  </button>
                </div>
              )}

              {/* Menu picker drawer */}
              {showImportMenu && (
                <div className="max-h-48 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-xl p-2 space-y-1">
                  {menuItems.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleImportMenuItem(item)}
                      className="w-full text-left p-2 hover:bg-zinc-800 rounded-lg flex items-center justify-between text-xs transition"
                    >
                      <span className="font-semibold text-white">{item.name}</span>
                      <span className="text-amber-400 font-bold">₱{item.basePrice}</span>
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className={labelCls}>Item Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. Extra Java Rice"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Price (₱) *</label>
                    <input
                      type="number"
                      value={formData.price || ''}
                      onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                      className={inputCls}
                      placeholder="25"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Category Tag</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className={inputCls}
                      placeholder="e.g. Rice, Drinks, Sauce"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Short Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. Mainit at masarap na Java Rice partner sa sizzling meals"
                    rows={2}
                  />
                </div>

                <div>
                  <label className={labelCls}>Item Image</label>
                  <ImageUpload
                    currentImage={formData.image}
                    onImageChange={url => setFormData({ ...formData, image: url })}
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={e => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4 rounded accent-amber-500"
                    />
                    <span className="text-sm font-semibold text-zinc-300">
                      Active (Ipakita agad sa Cart suggestions)
                    </span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white rounded-xl text-sm font-bold shadow hover:scale-105 transition flex items-center space-x-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Upsell Offer</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Upsell Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {upsells.map((item) => (
            <div
              key={item.id}
              className={`bg-zinc-900 border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                item.active
                  ? 'border-zinc-700 hover:border-amber-500/50 shadow-md'
                  : 'border-zinc-800/80 opacity-60 bg-zinc-900/50'
              }`}
            >
              <div>
                <div className="flex items-start space-x-3 mb-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 border border-zinc-700 flex items-center justify-center">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={e => { e.currentTarget.src = '/images/afodable-bites-logo.jpg'; }}
                      />
                    ) : (
                      <span className="text-2xl">🍲</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        {item.category || 'Extras'}
                      </span>
                      <span className="text-xs font-black text-white">
                        ₱{item.price}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-sm mt-1 truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Footer Controls */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800 mt-2">
                <button
                  type="button"
                  onClick={() => toggleUpsell(item.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition flex items-center space-x-1 ${
                    item.active
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                  <span>{item.active ? 'Active' : 'Inactive'}</span>
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition"
                    title="Edit Upsell"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Tanggalin ang "${item.name}" sa upsells?`)) {
                        deleteUpsell(item.id);
                      }
                    }}
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition"
                    title="Delete Upsell"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {upsells.length === 0 && (
            <div className="col-span-full py-16 text-center bg-zinc-900 border border-zinc-800 rounded-2xl">
              <Sparkles className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-white font-bold">Walang Upsell Items</p>
              <p className="text-zinc-500 text-xs mt-1">Magdagdag ng mga sikat na add-on o drinks para sa inyong customer.</p>
              <button
                type="button"
                onClick={handleStartAdd}
                className="mt-4 px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl"
              >
                + Add First Upsell Item
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpsellManager;
