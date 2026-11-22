import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Edit, Trash2, Save, X, ArrowLeft, Coffee, TrendingUp,
  Package, Users, Lock, FolderOpen, CreditCard, Settings, Sparkles, Flame,
  ShoppingBag, Bell, BellOff
} from 'lucide-react';
import { MenuItem, Variation, AddOn, AdminOrder } from '../types';
import { addOnCategories } from '../data/menuData';
import { useMenu } from '../hooks/useMenu';
import { useCategories } from '../hooks/useCategories';
import { useOrders } from '../hooks/useOrders';
import {
  isSoundAlertEnabled,
  setSoundAlertEnabled,
  testOrderChime,
  playOrderRingtone,
  stopOrderRingtone
} from '../utils/audioAlert';
import ImageUpload from './ImageUpload';
import CategoryManager from './CategoryManager';
import PaymentMethodManager from './PaymentMethodManager';
import SiteSettingsManager from './SiteSettingsManager';
import WelcomePageManager from './WelcomePageManager';
import OrdersManager from './OrdersManager';

// ── Shared Topbar ──────────────────────────────────────────────────────────────
const AdminTopbar: React.FC<{
  title: string;
  onBack?: () => void;
  backLabel?: string;
  right?: React.ReactNode;
}> = ({ title, onBack, backLabel = 'Dashboard', right }) => (
  <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center space-x-3">
          {onBack && (
            <>
              <button
                onClick={onBack}
                className="flex items-center space-x-1.5 text-zinc-400 hover:text-amber-400 transition-colors duration-200 text-sm font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{backLabel}</span>
              </button>
              <span className="text-zinc-700">|</span>
            </>
          )}
          <h1 className="text-lg sm:text-xl font-bold text-white">{title}</h1>
        </div>
        {right && <div className="flex items-center space-x-3">{right}</div>}
      </div>
    </div>
  </div>
);

// ── Branded Input / Select / Textarea ─────────────────────────────────────────
const inputCls =
  'w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition';
const labelCls = 'block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5';
const sectionTitleCls = 'text-base font-bold text-amber-400 mb-4 flex items-center space-x-2';
const cardCls = 'bg-zinc-900 border border-zinc-800 rounded-2xl p-6';

// ── Primary Button ─────────────────────────────────────────────────────────────
const PrimaryBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }> = ({
  children, loading, className = '', ...rest
}) => (
  <button
    {...rest}
    className={`inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-bold rounded-xl shadow hover:from-amber-400 hover:to-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm ${className}`}
  >
    {loading ? (
      <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Saving…</span></>
    ) : children}
  </button>
);

// ── Ghost Button ───────────────────────────────────────────────────────────────
const GhostBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = '', ...rest }) => (
  <button
    {...rest}
    className={`inline-flex items-center justify-center space-x-2 px-4 py-2.5 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-xl transition text-sm font-medium ${className}`}
  >
    {children}
  </button>
);

// ═══════════════════════════════════════════════════════════════════════════════
const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    localStorage.getItem('beracah_admin_auth') === 'true'
  );
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const { menuItems, loading, addMenuItem, updateMenuItem, deleteMenuItem } = useMenu();
  const { categories } = useCategories();
  const { orders } = useOrders();
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'items' | 'add' | 'edit' | 'categories' | 'payments' | 'settings' | 'welcome' | 'orders'
  >('dashboard');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(isSoundAlertEnabled());
  const [activeNewOrderAlert, setActiveNewOrderAlert] = useState<AdminOrder | null>(null);
  const initialOrdersCountRef = useRef<number | null>(null);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    setSoundAlertEnabled(next);
    if (next) {
      testOrderChime();
    } else {
      stopOrderRingtone();
    }
  };

  // Track incoming new orders from hook
  useEffect(() => {
    if (initialOrdersCountRef.current === null) {
      initialOrdersCountRef.current = orders.length;
      orders.forEach(o => knownOrderIdsRef.current.add(o.id));
      return;
    }

    const newArrival = orders.find(
      o => !knownOrderIdsRef.current.has(o.id) && o.status === 'pending'
    );
    if (newArrival) {
      knownOrderIdsRef.current.add(newArrival.id);
      setActiveNewOrderAlert(newArrival);
      playOrderRingtone(4);
    }
  }, [orders]);

  // Also listen for real-time dispatch events
  useEffect(() => {
    const handler = (e: any) => {
      const newOrder = e.detail as AdminOrder;
      if (newOrder) {
        knownOrderIdsRef.current.add(newOrder.id);
        setActiveNewOrderAlert(newOrder);
        playOrderRingtone(4);
      }
    };
    window.addEventListener('afoodable_new_order_event', handler);
    return () => {
      window.removeEventListener('afoodable_new_order_event', handler);
    };
  }, []);

  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '', description: '', basePrice: 0,
    category: 'sizzling-meals', popular: false, available: true,
    variations: [], addOns: []
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddItem = () => {
    setCurrentView('add');
    const defaultCategory = categories.length > 0 ? categories[0].id : 'sizzling-meals';
    setFormData({ name: '', description: '', basePrice: 0, category: defaultCategory, popular: false, available: true, variations: [], addOns: [] });
  };
  const handleEditItem = (item: MenuItem) => { setEditingItem(item); setFormData(item); setCurrentView('edit'); };
  const handleDeleteItem = async (id: string) => {
    if (confirm('Delete this item? This cannot be undone.')) {
      try { setIsProcessing(true); await deleteMenuItem(id); }
      catch { alert('Failed to delete item.'); }
      finally { setIsProcessing(false); }
    }
  };
  const handleSaveItem = async () => {
    if (!formData.name || !formData.description || !formData.basePrice) {
      alert('❌ Fill in all required fields: Name, Description, Base Price'); return;
    }
    if (formData.basePrice <= 0) { alert('❌ Base price must be > 0'); return; }
    if (formData.discountActive) {
      if (!formData.discountPrice || formData.discountPrice <= 0) { alert('❌ Enter a valid discount price.'); return; }
      if (formData.discountPrice >= formData.basePrice) { alert('❌ Discount price must be less than base price.'); return; }
    }
    try {
      setIsProcessing(true);
      if (editingItem) { await updateMenuItem(editingItem.id, formData); alert(`✅ Updated "${formData.name}"!`); }
      else { await addMenuItem(formData as Omit<MenuItem, 'id'>); alert(`✅ Added "${formData.name}" to menu!`); }
      setCurrentView('items'); setEditingItem(null);
      setFormData({ name: '', description: '', basePrice: 0, category: 'sizzling-meals', popular: false, available: true, variations: [], addOns: [] });
    } catch (err) {
      alert(`❌ Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally { setIsProcessing(false); }
  };
  const handleCancel = () => { setCurrentView(currentView === 'add' || currentView === 'edit' ? 'items' : 'dashboard'); setEditingItem(null); setSelectedItems([]); };
  const handleBulkRemove = async () => {
    if (!selectedItems.length) { alert('Select items first'); return; }
    if (confirm(`Delete ${selectedItems.length} item(s)?`)) {
      try {
        setIsProcessing(true);
        for (const id of selectedItems) await deleteMenuItem(id);
        setSelectedItems([]); setShowBulkActions(false);
        alert(`Deleted ${selectedItems.length} item(s).`);
      } catch { alert('Failed to delete some items.'); }
      finally { setIsProcessing(false); }
    }
  };
  const handleBulkCategoryChange = async (newCategoryId: string) => {
    if (!selectedItems.length) { alert('Select items first'); return; }
    const catName = categories.find(c => c.id === newCategoryId)?.name;
    if (confirm(`Change category of ${selectedItems.length} item(s) to "${catName}"?`)) {
      try {
        setIsProcessing(true);
        for (const id of selectedItems) {
          const item = menuItems.find(i => i.id === id);
          if (item) await updateMenuItem(id, { ...item, category: newCategoryId });
        }
        setSelectedItems([]); setShowBulkActions(false);
        alert(`Category updated for ${selectedItems.length} item(s)`);
      } catch { alert('Failed to update some items'); }
      finally { setIsProcessing(false); }
    }
  };
  const handleSelectItem = (id: string) =>
    setSelectedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const handleSelectAll = () => {
    if (selectedItems.length === menuItems.length) { setSelectedItems([]); setShowBulkActions(false); }
    else { setSelectedItems(menuItems.map(i => i.id)); setShowBulkActions(true); }
  };
  React.useEffect(() => { setShowBulkActions(selectedItems.length > 0); }, [selectedItems]);

  const addVariation = () => setFormData({ ...formData, variations: [...(formData.variations || []), { id: `var-${Date.now()}`, name: '', price: 0 }] });
  const updateVariation = (idx: number, field: keyof Variation, value: string | number) => {
    const v = [...(formData.variations || [])]; v[idx] = { ...v[idx], [field]: value }; setFormData({ ...formData, variations: v });
  };
  const removeVariation = (idx: number) => setFormData({ ...formData, variations: formData.variations?.filter((_, i) => i !== idx) });
  const addAddOn = () => setFormData({ ...formData, addOns: [...(formData.addOns || []), { id: `addon-${Date.now()}`, name: '', price: 0, category: 'extras' }] });
  const updateAddOn = (idx: number, field: keyof AddOn, value: string | number) => {
    const a = [...(formData.addOns || [])]; a[idx] = { ...a[idx], [field]: value }; setFormData({ ...formData, addOns: a });
  };
  const removeAddOn = (idx: number) => setFormData({ ...formData, addOns: formData.addOns?.filter((_, i) => i !== idx) });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin@afoodablebites') {
      setIsAuthenticated(true); localStorage.setItem('beracah_admin_auth', 'true'); setLoginError('');
      // Activate audio context on login gesture
      testOrderChime();
    } else { setLoginError('Incorrect password. Try again.'); }
  };
  const handleLogout = () => {
    stopOrderRingtone();
    setIsAuthenticated(false);
    localStorage.removeItem('beracah_admin_auth');
    setPassword('');
    setCurrentView('dashboard');
  };

  // Stats
  const totalItems = menuItems.length;
  const popularItems = menuItems.filter(i => i.popular).length;
  const availableItems = menuItems.filter(i => i.available).length;
  const categoryCounts = categories.map(cat => ({ ...cat, count: menuItems.filter(i => i.category === cat.id).length }));

  // ── LOGIN SCREEN ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 relative flex items-center justify-center p-4 overflow-hidden">
        {/* Ambient glow blobs matching logo colors */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-sm relative z-10">
          {/* Big Logo + Branding */}
          <div className="flex flex-col items-center mb-8">
            {/* Logo ring glow */}
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 blur-xl opacity-40 scale-110" />
              <div className="relative w-32 h-32 rounded-full ring-4 ring-amber-500/50 shadow-2xl overflow-hidden">
                <img
                  src="/images/afodable-bites-logo.jpg"
                  alt="Afoodable Bites"
                  className="w-full h-full object-cover"
                  onError={e => { e.currentTarget.src = '/logo.jpg'; }}
                />
              </div>
              {/* Admin lock badge */}
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 rounded-full p-2 shadow-lg ring-2 ring-zinc-950">
                <Lock className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Brand name */}
            <div className="text-center space-y-1">
              <h1 className="text-3xl font-black tracking-tight flex items-center justify-center space-x-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300">
                  Afoodable
                </span>
                <span className="text-white">Bites</span>
                <Flame className="w-6 h-6 text-orange-500 animate-pulse flex-shrink-0" />
              </h1>
              <p className="text-amber-400/80 text-xs font-bold uppercase tracking-[0.2em]">Always Serving Hot!</p>
              <div className="flex items-center justify-center space-x-2 pt-1">
                <div className="h-px w-10 bg-gradient-to-r from-transparent to-amber-500/50" />
                <span className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">Admin Portal</span>
                <div className="h-px w-10 bg-gradient-to-l from-transparent to-amber-500/50" />
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-3xl p-7 shadow-2xl">
            {/* Top accent bar */}
            <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-full mb-6 -mx-7 mt-[-28px] rounded-t-3xl" />

            <h2 className="text-white font-bold text-base mb-5 text-center flex items-center justify-center space-x-2">
              <span>🔐</span><span>Secure Login</span>
            </h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={labelCls}>Password</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className={inputCls} placeholder="Enter admin password" required autoFocus
                />
                {loginError && (
                  <div className="mt-2 flex items-center space-x-1.5 text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <span>⚠️</span><span>{loginError}</span>
                  </div>
                )}
              </div>
              <PrimaryBtn type="submit" className="w-full py-3 text-base">
                <Flame className="w-4 h-4" /><span>Access Dashboard</span>
              </PrimaryBtn>
            </form>

            {/* Footer hint */}
            <p className="text-zinc-600 text-[11px] text-center mt-5">
              🔒 Restricted access · Afoodable Bites Staff Only
            </p>
          </div>

          {/* Bottom tagline */}
          <div className="flex items-center justify-center space-x-2 mt-5">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-zinc-600 text-[11px] font-medium px-3 flex items-center space-x-1">
              <Flame className="w-3 h-3 text-orange-600" />
              <span>Always Serving Hot!</span>
            </span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-400 text-sm font-medium">Loading menu data…</p>
        </div>
      </div>
    );
  }

  // ── FLOATING INCOMING ORDER ALERT BANNER ─────────────────────────────────────
  const floatingAlertBanner = activeNewOrderAlert && (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white p-4 rounded-2xl shadow-2xl border-2 border-yellow-300 animate-bounce flex flex-col space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl animate-spin">🔔</span>
          <span className="font-black text-sm uppercase tracking-wider">BAGONG ORDER DUMATING!</span>
        </div>
        <button
          type="button"
          onClick={() => {
            stopOrderRingtone();
            setActiveNewOrderAlert(null);
          }}
          className="text-white/80 hover:text-white text-xs font-bold bg-black/20 hover:bg-black/40 rounded-full w-6 h-6 flex items-center justify-center"
        >
          ✕
        </button>
      </div>
      <div className="text-xs bg-black/30 backdrop-blur-sm rounded-xl p-3 space-y-1">
        <div className="flex justify-between font-bold">
          <span>Order #{activeNewOrderAlert.id}</span>
          <span className="text-amber-200">₱{activeNewOrderAlert.total}</span>
        </div>
        <p className="text-amber-100 truncate font-semibold">
          {activeNewOrderAlert.customerName} ({activeNewOrderAlert.contactNumber})
        </p>
        <p className="text-amber-200 text-[11px]">
          {activeNewOrderAlert.serviceType.toUpperCase()} • {activeNewOrderAlert.paymentMethod}
        </p>
      </div>
      <div className="flex items-center space-x-2 pt-1">
        <button
          type="button"
          onClick={() => {
            stopOrderRingtone();
            setActiveNewOrderAlert(null);
            setCurrentView('orders');
          }}
          className="flex-1 py-2 bg-white text-zinc-950 rounded-xl font-black text-xs hover:bg-yellow-100 transition shadow flex items-center justify-center space-x-1"
        >
          <span>Tingnan ang Order</span>
          <span>📋</span>
        </button>
        <button
          type="button"
          onClick={() => {
            stopOrderRingtone();
            setActiveNewOrderAlert(null);
          }}
          className="px-3 py-2 bg-black/30 hover:bg-black/50 text-white rounded-xl font-bold text-xs transition"
        >
          Stop Ring 🔕
        </button>
      </div>
    </div>
  );

  // ── ADD / EDIT ITEM FORM ─────────────────────────────────────────────────────
  if (currentView === 'add' || currentView === 'edit') {
    return (
      <>
        {floatingAlertBanner}
        <div className="min-h-screen bg-zinc-950">
          <AdminTopbar
            title={currentView === 'add' ? '➕ Add Menu Item' : '✏️ Edit Menu Item'}
            onBack={handleCancel} backLabel="Menu Items"
            right={
              <>
                <GhostBtn onClick={handleCancel} disabled={isProcessing}><X className="h-4 w-4" /><span>Cancel</span></GhostBtn>
                <PrimaryBtn onClick={handleSaveItem} loading={isProcessing} disabled={isProcessing}>
                  <Save className="h-4 w-4" /><span>Save Item</span>
                </PrimaryBtn>
              </>
            }
          />

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {isProcessing && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center space-x-3">
              <div className="h-5 w-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <div>
                <p className="font-bold text-amber-300 text-sm">Saving changes…</p>
                <p className="text-xs text-zinc-400">Please wait while we update your menu item.</p>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className={cardCls}>
            <h3 className={sectionTitleCls}><Package className="w-4 h-4" /><span>Basic Information</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Item Name *</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputCls} placeholder="e.g. Sizzling Pork Sisig" />
              </div>
              <div>
                <label className={labelCls}>Base Price (₱) *</label>
                <input type="number" value={formData.basePrice || ''} onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })} className={inputCls} placeholder="0" min="0" />
              </div>
              <div>
                <label className={labelCls}>Category *</label>
                <select value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} className={inputCls}>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col justify-end space-y-3 pb-1">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={formData.popular || false} onChange={e => setFormData({ ...formData, popular: e.target.checked })} className="w-4 h-4 rounded accent-amber-500" />
                  <span className="text-sm font-medium text-zinc-300">⭐ Mark as Popular</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={formData.available ?? true} onChange={e => setFormData({ ...formData, available: e.target.checked })} className="w-4 h-4 rounded accent-amber-500" />
                  <span className="text-sm font-medium text-zinc-300">✅ Available for Order</span>
                </label>
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Description *</label>
                <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className={inputCls} placeholder="Describe the dish…" rows={3} />
              </div>
            </div>
          </div>

          {/* Item Image */}
          <div className={cardCls}>
            <h3 className={sectionTitleCls}><span>🖼️</span><span>Item Image</span></h3>
            <ImageUpload currentImage={formData.image} onImageChange={imageUrl => setFormData({ ...formData, image: imageUrl })} />
          </div>

          {/* Discount Pricing */}
          <div className={cardCls}>
            <h3 className={sectionTitleCls}><span>🏷️</span><span>Discount Pricing</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Discount Price (₱)</label>
                <input type="number" value={formData.discountPrice || ''} onChange={e => setFormData({ ...formData, discountPrice: Number(e.target.value) || undefined })} className={inputCls} placeholder="Enter discount price" min="0" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={formData.discountActive || false} onChange={e => setFormData({ ...formData, discountActive: e.target.checked })} className="w-4 h-4 rounded accent-orange-500" />
                  <span className="text-sm font-medium text-zinc-300">🔥 Enable Discount</span>
                </label>
              </div>
              <div>
                <label className={labelCls}>Discount Start Date</label>
                <input type="datetime-local" value={formData.discountStartDate || ''} onChange={e => setFormData({ ...formData, discountStartDate: e.target.value || undefined })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Discount End Date</label>
                <input type="datetime-local" value={formData.discountEndDate || ''} onChange={e => setFormData({ ...formData, discountEndDate: e.target.value || undefined })} className={inputCls} />
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-3">Leave dates empty for an indefinite discount. Discount only applies if "Enable Discount" is checked.</p>
          </div>

          {/* Flavor Variations */}
          <div className={cardCls}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={sectionTitleCls + ' mb-0'}><span>🌶️</span><span>Flavor Variations</span></h3>
              <GhostBtn onClick={addVariation} className="text-xs"><Plus className="h-3.5 w-3.5" /><span>Add Variation</span></GhostBtn>
            </div>
            {(formData.variations || []).length === 0 && (
              <p className="text-zinc-500 text-sm text-center py-4">No variations yet. Click "Add Variation" to add size/flavor options.</p>
            )}
            <div className="space-y-3">
              {formData.variations?.map((variation, idx) => (
                <div key={variation.id} className="flex items-center space-x-3 bg-zinc-800 rounded-xl p-3 border border-zinc-700">
                  <input type="text" value={variation.name} onChange={e => updateVariation(idx, 'name', e.target.value)} className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500" placeholder="Variation name (e.g. Spicy)" />
                  <input type="number" value={variation.price} onChange={e => updateVariation(idx, 'price', Number(e.target.value))} className="w-28 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500" placeholder="Price" />
                  <button onClick={() => removeVariation(idx)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Add-ons */}
          <div className={cardCls}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={sectionTitleCls + ' mb-0'}><span>🍚</span><span>Add-ons</span></h3>
              <GhostBtn onClick={addAddOn} className="text-xs"><Plus className="h-3.5 w-3.5" /><span>Add Add-on</span></GhostBtn>
            </div>
            {(formData.addOns || []).length === 0 && (
              <p className="text-zinc-500 text-sm text-center py-4">No add-ons yet. Click "Add Add-on" to allow extras like rice, egg, or soup.</p>
            )}
            <div className="space-y-3">
              {formData.addOns?.map((addOn, idx) => (
                <div key={addOn.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-zinc-800 rounded-xl p-3 border border-zinc-700">
                  <input type="text" value={addOn.name} onChange={e => updateAddOn(idx, 'name', e.target.value)} className="flex-1 min-w-[120px] px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500" placeholder="Add-on name" />
                  <select value={addOn.category} onChange={e => updateAddOn(idx, 'category', e.target.value)} className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500">
                    {addOnCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                  <input type="number" value={addOn.price} onChange={e => updateAddOn(idx, 'price', Number(e.target.value))} className="w-24 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500" placeholder="₱ Price" />
                  <button onClick={() => removeAddOn(idx)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition flex-shrink-0"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end space-x-3 pb-8">
            <GhostBtn onClick={handleCancel} disabled={isProcessing}><X className="h-4 w-4" /><span>Cancel</span></GhostBtn>
            <PrimaryBtn onClick={handleSaveItem} loading={isProcessing} disabled={isProcessing}>
              <Save className="h-4 w-4" /><span>Save Item</span>
            </PrimaryBtn>
          </div>
        </div>
      </div>
    </>
  );
}

  // ── MENU ITEMS LIST ──────────────────────────────────────────────────────────
  if (currentView === 'items') {
    return (
      <>
        {floatingAlertBanner}
        <div className="min-h-screen bg-zinc-950">
          <AdminTopbar
            title="🍽️ Menu Items"
            onBack={() => setCurrentView('dashboard')}
          right={
            <>
              {showBulkActions && selectedItems.length > 0 && (
                <span className="text-xs text-zinc-400 font-medium hidden sm:inline">{selectedItems.length} selected</span>
              )}
              <PrimaryBtn onClick={handleAddItem}><Plus className="h-4 w-4" /><span>Add Item</span></PrimaryBtn>
            </>
          }
        />

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
          {/* Bulk action bar */}
          {showBulkActions && selectedItems.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-amber-300 font-bold text-sm">{selectedItems.length} item(s) selected</span>
              <div className="flex flex-wrap gap-2">
                <select
                  onChange={e => { if (e.target.value) { handleBulkCategoryChange(e.target.value); e.target.value = ''; } }}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 text-xs focus:outline-none"
                >
                  <option value="">Change Category…</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <button onClick={handleBulkRemove} disabled={isProcessing} className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-50">
                  <Trash2 className="h-3.5 w-3.5" /><span>{isProcessing ? 'Removing…' : 'Delete Selected'}</span>
                </button>
                <button onClick={() => { setSelectedItems([]); setShowBulkActions(false); }} className="flex items-center space-x-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold rounded-lg transition">
                  <X className="h-3.5 w-3.5" /><span>Clear</span>
                </button>
              </div>
            </div>
          )}

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            {/* Select all bar */}
            {menuItems.length > 0 && (
              <div className="bg-zinc-800/50 border-b border-zinc-800 px-5 py-3 flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={selectedItems.length === menuItems.length && menuItems.length > 0} onChange={handleSelectAll} className="w-4 h-4 rounded accent-amber-500" />
                  <span className="text-xs font-medium text-zinc-400">Select All ({menuItems.length} items)</span>
                </label>
                {selectedItems.length > 0 && (
                  <button onClick={() => setSelectedItems([])} className="text-xs text-zinc-500 hover:text-zinc-300 transition">{selectedItems.length} selected · Clear</button>
                )}
              </div>
            )}

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-5 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider w-10"></th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Name</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Price</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Extras</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {menuItems.map(item => (
                    <tr key={item.id} className={`hover:bg-zinc-800/50 transition ${selectedItems.includes(item.id) ? 'bg-amber-500/5' : ''}`}>
                      <td className="px-5 py-4">
                        <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => handleSelectItem(item.id)} className="w-4 h-4 rounded accent-amber-500" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white text-sm">{item.name}</div>
                        <div className="text-xs text-zinc-500 truncate max-w-xs mt-0.5">{item.description}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded-full">
                          {categories.find(c => c.id === item.category)?.name || item.category}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {item.isOnDiscount && item.discountPrice ? (
                          <div>
                            <div className="text-orange-400 font-bold text-sm">₱{item.discountPrice}</div>
                            <div className="text-zinc-600 line-through text-xs">₱{item.basePrice}</div>
                          </div>
                        ) : (
                          <span className="text-white font-semibold text-sm">₱{item.basePrice}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-400">
                        {item.variations?.length || 0} var · {item.addOns?.length || 0} add-on
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col space-y-1">
                          {item.popular && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white">⭐ Popular</span>}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.available ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' : 'bg-red-900/50 text-red-400 border border-red-800'}`}>
                            {item.available ? '● Available' : '● Unavailable'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-1">
                          <button onClick={() => handleEditItem(item)} disabled={isProcessing} title="Edit" className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteItem(item.id)} disabled={isProcessing} title="Delete" className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-zinc-800">
              {menuItems.map(item => (
                <div key={item.id} className={`p-4 ${selectedItems.includes(item.id) ? 'bg-amber-500/5' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => handleSelectItem(item.id)} className="w-4 h-4 rounded accent-amber-500" />
                      <span className="font-semibold text-white text-sm">{item.name}</span>
                    </label>
                    <div className="flex space-x-1">
                      <button onClick={() => handleEditItem(item)} disabled={isProcessing} className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg transition"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteItem(item.id)} disabled={isProcessing} className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg transition"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mb-2 line-clamp-2">{item.description}</p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-amber-400 font-bold text-sm">₱{item.basePrice}</span>
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{categories.find(c => c.id === item.category)?.name}</span>
                    {item.popular && <span className="text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full">⭐ Popular</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.available ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {menuItems.length === 0 && (
              <div className="py-16 text-center">
                <Package className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-1">No menu items yet</h3>
                <p className="text-zinc-500 text-sm mb-4">Add your first dish to get started.</p>
                <PrimaryBtn onClick={handleAddItem}><Plus className="h-4 w-4" /><span>Add First Item</span></PrimaryBtn>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

  // ── SUBVIEWS (delegate) ──────────────────────────────────────────────────────
  if (currentView === 'orders') return <>{floatingAlertBanner}<OrdersManager onBack={() => setCurrentView('dashboard')} /></>;
  if (currentView === 'categories') return <>{floatingAlertBanner}<CategoryManager onBack={() => setCurrentView('dashboard')} /></>;
  if (currentView === 'payments') return <>{floatingAlertBanner}<PaymentMethodManager onBack={() => setCurrentView('dashboard')} /></>;
  if (currentView === 'welcome') return <>{floatingAlertBanner}<WelcomePageManager onBack={() => setCurrentView('dashboard')} /></>;

  if (currentView === 'settings') {
    return (
      <>
        {floatingAlertBanner}
        <div className="min-h-screen bg-zinc-950">
          <AdminTopbar title="⚙️ Site Settings" onBack={() => setCurrentView('dashboard')} />
          <div className="max-w-4xl mx-auto px-4 py-8">
            <SiteSettingsManager />
          </div>
        </div>
      </>
    );
  }

  // ── MAIN DASHBOARD ───────────────────────────────────────────────────────────
  return (
    <>
      {floatingAlertBanner}
      <div className="min-h-screen bg-zinc-950">
        {/* Topbar */}
        <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <img src="/images/afodable-bites-logo.jpg" alt="Afoodable Bites" className="w-9 h-9 rounded-full object-cover ring-2 ring-amber-500/40"
                  onError={e => { e.currentTarget.src = '/logo.jpg'; }} />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-white font-black text-lg leading-none">Afoodable Bites</span>
                    <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                  </div>
                  <span className="text-amber-400 text-xs font-semibold">Admin Dashboard</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition border ${
                    soundEnabled
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                  }`}
                  title={soundEnabled ? 'Click to Mute Ringtone' : 'Click to Enable Ringtone'}
                >
                  {soundEnabled ? <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" /> : <BellOff className="w-3.5 h-3.5" />}
                  <span>{soundEnabled ? 'Ring: ON' : 'Ring: MUTED'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => testOrderChime()}
                  className="text-[11px] text-zinc-400 hover:text-amber-400 underline font-medium hidden sm:inline"
                  title="Test notification ring chime"
                >
                  Test Sound 🔔
                </button>
                <a href="/" className="text-xs text-zinc-400 hover:text-amber-400 transition font-medium">View Site ↗</a>
                <button onClick={handleLogout} className="text-xs text-zinc-500 hover:text-red-400 transition font-medium">Logout</button>
              </div>
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { 
              label: 'Customer Orders', 
              value: orders.length, 
              icon: ShoppingBag, 
              color: 'from-amber-500 to-orange-600',
              badge: orders.filter(o => o.status === 'pending').length > 0 
                ? `${orders.filter(o => o.status === 'pending').length} New` 
                : undefined
            },
            { label: 'Total Items', value: totalItems, icon: Package, color: 'from-orange-500 to-red-500' },
            { label: 'Available Items', value: availableItems, icon: TrendingUp, color: 'from-emerald-500 to-green-600' },
            { label: 'Popular Dishes', value: popularItems, icon: Coffee, color: 'from-blue-500 to-indigo-600' },
          ].map(({ label, value, icon: Icon, color, badge }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center space-x-4">
              <div className={`bg-gradient-to-br ${color} p-3 rounded-xl shadow-lg flex-shrink-0`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider truncate">{label}</p>
                  {badge && (
                    <span className="text-[10px] font-black bg-amber-500 text-black px-1.5 py-0.2 rounded-full animate-pulse">
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-black text-white mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions + Categories Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" /><span>Quick Actions</span>
            </h3>
            <div className="space-y-1">
              {[
                { 
                  label: 'Customer Orders', 
                  icon: ShoppingBag, 
                  action: () => setCurrentView('orders'), 
                  highlight: true,
                  badge: orders.filter(o => o.status === 'pending').length > 0 
                    ? `${orders.filter(o => o.status === 'pending').length} Pending` 
                    : `${orders.length} Total`
                },
                { label: 'Add New Menu Item', icon: Plus, action: handleAddItem, highlight: false },
                { label: 'Manage Menu Items', icon: Package, action: () => setCurrentView('items'), highlight: false },
                { label: 'Welcome Page & Promo Slides', icon: Sparkles, action: () => setCurrentView('welcome'), highlight: false },
                { label: 'Manage Categories', icon: FolderOpen, action: () => setCurrentView('categories'), highlight: false },
                { label: 'Payment Methods & COD', icon: CreditCard, action: () => setCurrentView('payments'), highlight: false },
                { label: 'Site Settings', icon: Settings, action: () => setCurrentView('settings'), highlight: false },
              ].map(({ label, icon: Icon, action, highlight, badge }) => (
                <button key={label} onClick={action}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${
                    highlight
                      ? 'bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 shadow-sm'
                      : 'hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Icon className={`h-4 w-4 flex-shrink-0 ${highlight ? 'text-amber-400' : 'text-zinc-500'}`} />
                    <span className={`text-sm font-medium ${highlight ? 'text-amber-300 font-bold' : 'text-zinc-300'}`}>{label}</span>
                  </div>
                  {badge && (
                    <span className="text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full flex-shrink-0">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Category Overview */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
              <FolderOpen className="w-4 h-4 text-amber-400" /><span>Categories Overview</span>
            </h3>
            <div className="space-y-3">
              {categoryCounts.map(cat => (
                <div key={cat.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-sm font-medium text-zinc-300">{cat.name}</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">{cat.count} items</span>
                </div>
              ))}
              {categoryCounts.length === 0 && (
                <p className="text-zinc-500 text-sm text-center py-4">No categories yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* All Menu Items Preview */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">All Menu Items ({totalItems})</h3>
            <button onClick={() => setCurrentView('items')} className="text-xs font-bold text-amber-400 hover:text-amber-300 transition">
              Manage All →
            </button>
          </div>
          <div className="divide-y divide-zinc-800">
            {menuItems.map(item => {
              const cat = categories.find(c => c.id === item.category);
              return (
                <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-800/40 transition">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="text-xl flex-shrink-0">{cat?.icon || '🍽️'}</span>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span className="font-semibold text-white text-sm">{item.name}</span>
                        {item.popular && <span className="text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full">⭐ Popular</span>}
                        {!item.available && <span className="text-xs bg-red-900/50 text-red-400 border border-red-800 px-2 py-0.5 rounded-full">Unavailable</span>}
                      </div>
                      <p className="text-xs text-zinc-500 truncate">{cat?.name} · {item.variations?.length || 0} var · {item.addOns?.length || 0} add-ons</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 ml-4 flex-shrink-0">
                    <div className="text-right">
                      {item.isOnDiscount && item.discountPrice ? (
                        <div>
                          <div className="text-orange-400 font-bold text-sm">₱{item.discountPrice}</div>
                          <div className="text-zinc-600 line-through text-xs">₱{item.basePrice}</div>
                        </div>
                      ) : (
                        <span className="text-white font-bold text-sm">₱{item.basePrice}</span>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <button onClick={() => handleEditItem(item)} title="Edit" className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteItem(item.id)} title="Delete" className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {menuItems.length === 0 && (
            <div className="py-12 text-center">
              <Package className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No menu items yet.</p>
              <PrimaryBtn onClick={handleAddItem} className="mt-4"><Plus className="h-4 w-4" /><span>Add First Item</span></PrimaryBtn>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default AdminDashboard;
