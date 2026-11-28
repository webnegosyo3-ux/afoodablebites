import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Edit, Trash2, Save, X, ArrowLeft, Coffee, TrendingUp,
  Package, Users, Lock, FolderOpen, CreditCard, Settings, Sparkles, Flame,
  ShoppingBag, Bell, BellOff, BarChart3, Menu, Truck, Volume2
} from 'lucide-react';
import { MenuItem, Variation, AddOn, AdminOrder } from '../types';
import { addOnCategories } from '../data/menuData';
import { useMenu } from '../hooks/useMenu';
import { useCategories } from '../hooks/useCategories';
import { useOrders } from '../hooks/useOrders';
import {
  isSoundAlertEnabled,
  setSoundAlertEnabled,
  playOrderRingtone,
  stopOrderRingtone,
  unlockAudio,
  isAudioUnlocked,
  vibrateDevice,
  testOrderChime
} from '../utils/audioAlert';
import { getOrderDeliveryFee } from '../utils/delivery';
import ImageUpload from './ImageUpload';
import CategoryManager from './CategoryManager';
import PaymentMethodManager from './PaymentMethodManager';
import DeliverySettingsManager from './DeliverySettingsManager';
import SiteSettingsManager from './SiteSettingsManager';
import WelcomePageManager from './WelcomePageManager';
import OrdersManager from './OrdersManager';
import AnalyticsManager from './AnalyticsManager';
import CustomerManager from './CustomerManager';
import UpsellManager from './UpsellManager';

// ── Shared Topbar ──────────────────────────────────────────────────────────────
const AdminTopbar: React.FC<{
  title: string;
  onBack?: () => void;
  backLabel?: string;
  right?: React.ReactNode;
  onOpenSlideMenu?: () => void;
}> = ({ title, onBack, backLabel = 'Dashboard', right, onOpenSlideMenu }) => (
  <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30">
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-14 sm:h-16">
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
          {onBack && (
            <>
              <button
                onClick={onBack}
                className="flex items-center space-x-1 text-zinc-400 hover:text-amber-400 transition-colors text-xs sm:text-sm font-medium flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{backLabel}</span>
              </button>
              <span className="text-zinc-700">|</span>
            </>
          )}
          <h1 className="text-sm sm:text-xl font-bold text-white truncate">{title}</h1>
        </div>
        {right && <div className="flex items-center space-x-1.5 sm:space-x-3 flex-shrink-0">{right}</div>}
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
    'dashboard' | 'items' | 'add' | 'edit' | 'categories' | 'payments' | 'delivery' | 'settings' | 'welcome' | 'orders' | 'analytics' | 'customers' | 'upsells'
  >('dashboard');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(isSoundAlertEnabled());
  const [activeNewOrderAlert, setActiveNewOrderAlert] = useState<AdminOrder | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isSlideDrawerOpen, setIsSlideDrawerOpen] = useState(false);
  const initialOrdersCountRef = useRef<number | null>(null);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  // Tracks whether the Web Audio API has been unlocked via a user gesture on this device.
  // On mobile (iOS/Android) audio stays silent until the user taps something.
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(isAudioUnlocked());

  // Arm the ringtone automatically when the dashboard opens or returns to the foreground.
  // Mobile browsers may still require the first tap/click; the global gesture listener handles that.
  useEffect(() => {
    let active = true;

    const armAudio = async () => {
      const unlocked = await unlockAudio();
      if (active) setAudioUnlocked(unlocked && isAudioUnlocked());
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) void armAudio();
    };

    const handleAudioUnlocked = () => setAudioUnlocked(isAudioUnlocked());

    void armAudio();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('afoodable_audio_unlocked', handleAudioUnlocked);

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('afoodable_audio_unlocked', handleAudioUnlocked);
    };
  }, []);

  const toggleSound = async () => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    setSoundAlertEnabled(next);
    if (next) {
      await unlockAudio();
      setAudioUnlocked(isAudioUnlocked());
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
      // Always show the popup regardless of audio state
      setActiveNewOrderAlert(newArrival);
      // Vibrate immediately (works without audio unlock on Android)
      vibrateDevice([400, 150, 400, 150, 600]);
      // Play ringtone — will silently skip if audio context isn't unlocked yet on mobile
      playOrderRingtone(30);
    }
  }, [orders]);

  // Also listen for real-time dispatch events (same-tab instant notification)
  useEffect(() => {
    const handler = (e: any) => {
      const newOrder = e.detail as AdminOrder;
      if (newOrder) {
        knownOrderIdsRef.current.add(newOrder.id);
        // Always show the popup
        setActiveNewOrderAlert(newOrder);
        vibrateDevice([400, 150, 400, 150, 600]);
        playOrderRingtone(30);
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
  const handleEditItem = (item: MenuItem) => { 
    setEditingItem(item); 
    setFormData({
      ...item,
      variations: item.variations ? JSON.parse(JSON.stringify(item.variations)) : [],
      addOns: item.addOns ? JSON.parse(JSON.stringify(item.addOns)) : []
    }); 
    setCurrentView('edit'); 
  };
  const handleDeleteItem = async (id: string) => {
    if (confirm('Delete this item? This cannot be undone.')) {
      try { setIsProcessing(true); await deleteMenuItem(id); }
      catch { alert('Failed to delete item.'); }
      finally { setIsProcessing(false); }
    }
  };
  const handleSaveItem = async () => {
    if (!formData.name?.trim() || !formData.description?.trim() || !formData.basePrice) {
      alert('❌ Fill in all required fields: Name, Description, Base Price'); return;
    }
    if (formData.basePrice <= 0) { alert('❌ Base price must be > 0'); return; }
    if (formData.discountActive) {
      if (!formData.discountPrice || formData.discountPrice <= 0) { alert('❌ Enter a valid discount price.'); return; }
      if (formData.discountPrice >= formData.basePrice) { alert('❌ Discount price must be less than base price.'); return; }
    }
    try {
      setIsProcessing(true);
      const dataToSave = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
      };
      if (editingItem) { 
        await updateMenuItem(editingItem.id, dataToSave); 
        alert(`✅ Matagumpay na na-update ang "${dataToSave.name}"!`); 
      } else { 
        await addMenuItem(dataToSave as Omit<MenuItem, 'id'>); 
        alert(`✅ Matagumpay na naidagdag ang "${dataToSave.name}" sa menu!`); 
      }
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin@afoodablebites') {
      setIsAuthenticated(true); localStorage.setItem('beracah_admin_auth', 'true'); setLoginError('');
      // Unlock audio on the login button press (user gesture) — critical for iOS/Android
      await unlockAudio();
      setAudioUnlocked(isAudioUnlocked());
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
  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalCustomersCount = new Set(orders.map(o => (o.contactNumber || '').replace(/\D/g, '') || o.customerName)).size;
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

  // ── LOADING (Only block screen if no cached/default items exist) ──────────────
  // NOTE: useMenu initialises with DEFAULT_MENU_ITEMS so this gate almost never fires.
  // We keep a minimal check only to avoid a flash of empty stats on very first load.
  // The dashboard itself renders immediately — only the stats cards show a skeleton.

  // ── FULL-SCREEN INCOMING ORDER POP-UP MODAL (MOBILE & DESKTOP OPTIMIZED) ───────
  const incomingOrderModal = activeNewOrderAlert && (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-zinc-900 border-2 border-amber-400 rounded-3xl p-5 sm:p-6 w-full max-w-sm sm:max-w-md shadow-2xl relative overflow-hidden animate-scale-up text-white">
        {/* Top decorative gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />

        {/* Modal Header with Animated Bell */}
        <div className="flex items-center justify-between mb-4 mt-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 p-0.5 shadow-lg flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full bg-zinc-950 rounded-2xl flex items-center justify-center">
                <span className="text-2xl animate-bounce">🔔</span>
              </div>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-amber-400 tracking-tight leading-tight uppercase flex items-center space-x-1.5">
                <span>BAGONG ORDER!</span>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
              </h3>
              <p className="text-xs text-zinc-400 font-medium">Pumasok ngayon lang sa Kusina 🔥</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopOrderRingtone();
              setActiveNewOrderAlert(null);
            }}
            className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-full transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Details Snapshot */}
        <div className="bg-zinc-950 border border-amber-500/30 rounded-2xl p-4 space-y-2 mb-4 text-xs sm:text-sm">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-800 font-bold">
            <span className="text-zinc-400">Order ID:</span>
            <span className="text-amber-400 font-mono text-sm sm:text-base font-black">#{activeNewOrderAlert.id}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-300">
            <span className="text-zinc-400">Customer:</span>
            <span className="font-bold text-white text-right truncate max-w-[190px]">{activeNewOrderAlert.customerName}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-300">
            <span className="text-zinc-400">Contact:</span>
            <span className="font-mono text-zinc-200">{activeNewOrderAlert.contactNumber}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-300">
            <span className="text-zinc-400">Service:</span>
            <span className="font-bold text-amber-300 uppercase px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30">
              {activeNewOrderAlert.serviceType}
            </span>
          </div>
          <div className="flex justify-between items-center text-zinc-300">
            <span className="text-zinc-400">Payment:</span>
            <span className="font-semibold text-zinc-100">{activeNewOrderAlert.paymentMethod}</span>
          </div>
          {activeNewOrderAlert.serviceType === 'delivery' && (
            <div className="flex justify-between items-center text-zinc-300">
              <span className="text-zinc-400">Delivery Fee:</span>
              <span className="font-semibold text-zinc-100">₱{getOrderDeliveryFee(activeNewOrderAlert)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-zinc-800 font-black text-sm sm:text-base">
            <span className="text-white">Total Amount:</span>
            <span className="text-amber-400 text-base sm:text-lg">₱{activeNewOrderAlert.total}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              stopOrderRingtone();
              setActiveNewOrderAlert(null);
              setCurrentView('orders');
            }}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-black text-sm sm:text-base shadow-lg hover:shadow-orange-500/30 transition-all duration-200 flex items-center justify-center space-x-2 active:scale-95"
          >
            <span>TINGNAN ANG ORDER</span>
            <span>📋</span>
          </button>

          {/* Mobile audio unlock — shown only if audio hasn't been unlocked yet */}
          {!audioUnlocked && (
            <button
              type="button"
              onClick={async () => {
                await unlockAudio();
                setAudioUnlocked(isAudioUnlocked());
                playOrderRingtone(30);
              }}
              className="w-full py-2.5 bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-1.5"
            >
              <Volume2 className="w-4 h-4" />
              <span>I-tap para marinig ang ringtone 🔔</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              stopOrderRingtone();
              setActiveNewOrderAlert(null);
            }}
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-1.5"
          >
            <span>I-mute ang Ringtone & I-sara</span>
            <span>🔕</span>
          </button>
        </div>
      </div>
    </div>
  );

  const floatingAlertBanner = incomingOrderModal;

  // ── LEFT-SIDE SLIDE FEATURES DRAWER (ALL SECTIONS) ──────────────────────────
  const slideFeaturesDrawer = isSlideDrawerOpen && (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsSlideDrawerOpen(false)}
      />

      {/* Drawer Panel Sliding from the Left */}
      <div className="relative w-80 max-w-[85vw] bg-zinc-950 border-r border-amber-500/40 h-full p-4 sm:p-5 flex flex-col z-10 shadow-2xl">
        {/* Header: Logo + Title + Close Button */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800 mb-3">
          <div className="flex items-center space-x-2.5 min-w-0">
            <img
              src="/images/afodable-bites-logo.jpg"
              alt="Logo"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-amber-500/40 flex-shrink-0"
              onError={e => { e.currentTarget.src = '/logo.jpg'; }}
            />
            <div className="min-w-0">
              <h3 className="font-black text-white text-sm truncate flex items-center space-x-1">
                <span>Afoodable Admin</span>
                <Flame className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
              </h3>
              <p className="text-[10px] text-zinc-400 font-medium">All Sections & Slide Features</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSlideDrawerOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            aria-label="Close slide menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation: ALL SECTIONS */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
          <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
            <span>Admin Sections</span>
            <span className="text-[10px] text-zinc-500 font-mono">11 Modules</span>
          </div>

          {[
            {
              id: 'dashboard',
              label: 'Sales & Analytics',
              icon: BarChart3,
              desc: 'Revenue, orders & top dishes',
              action: () => { setCurrentView('dashboard'); setIsSlideDrawerOpen(false); },
              highlight: currentView === 'dashboard',
              badge: 'Screen'
            },
            {
              id: 'orders',
              label: 'Customer Orders',
              icon: ShoppingBag,
              desc: 'Live incoming orders & ringtone',
              action: () => { setCurrentView('orders'); setIsSlideDrawerOpen(false); },
              highlight: currentView === 'orders',
              badge: orders.filter(o => o.status === 'pending').length > 0
                ? `${orders.filter(o => o.status === 'pending').length} Pending`
                : `${orders.length} Total`
            },
            {
              id: 'items',
              label: 'Manage Menu Items',
              icon: Package,
              desc: 'All dishes, prices, availability',
              action: () => { setSelectedCategoryFilter('all'); setCurrentView('items'); setIsSlideDrawerOpen(false); },
              highlight: currentView === 'items',
              badge: `${totalItems}`
            },
            {
              id: 'categories',
              label: 'Menu Categories',
              icon: FolderOpen,
              desc: 'Add, reorder & edit categories',
              action: () => { setCurrentView('categories'); setIsSlideDrawerOpen(false); },
              highlight: currentView === 'categories',
              badge: `${categories.length}`
            },
            {
              id: 'customers',
              label: 'Customer Directory',
              icon: Users,
              desc: 'CRM, repeat buyers, contacts',
              action: () => { setCurrentView('customers'); setIsSlideDrawerOpen(false); },
              highlight: currentView === 'customers',
              badge: `${totalCustomersCount}`
            },
            {
              id: 'upsells',
              label: 'Upsell & Cross-sells',
              icon: Flame,
              desc: 'Boost checkouts with add-ons',
              action: () => { setCurrentView('upsells'); setIsSlideDrawerOpen(false); },
              highlight: currentView === 'upsells'
            },
            {
              id: 'payments',
              label: 'Payment Methods & QR',
              icon: CreditCard,
              desc: 'GCash QR, COD, banking',
              action: () => { setCurrentView('payments'); setIsSlideDrawerOpen(false); },
              highlight: currentView === 'payments'
            },
            {
              id: 'delivery',
              label: 'Delivery Settings',
              icon: Truck,
              desc: 'Locations, delivery fees & free delivery',
              action: () => { setCurrentView('delivery'); setIsSlideDrawerOpen(false); },
              highlight: currentView === 'delivery'
            },
            {
              id: 'welcome',
              label: 'Welcome & Promo Slides',
              icon: Sparkles,
              desc: 'Promo popups & announcement slides',
              action: () => { setCurrentView('welcome'); setIsSlideDrawerOpen(false); },
              highlight: currentView === 'welcome'
            },
            {
              id: 'settings',
              label: 'Site Settings',
              icon: Settings,
              desc: 'Store info, hours, logo',
              action: () => { setCurrentView('settings'); setIsSlideDrawerOpen(false); },
              highlight: currentView === 'settings'
            },
            {
              id: 'add',
              label: 'Add New Food Item',
              icon: Plus,
              desc: 'Create new dish or drink',
              action: () => { handleAddItem(); setIsSlideDrawerOpen(false); },
              highlight: currentView === 'add'
            }
          ].map(({ id, label, icon: Icon, desc, action, highlight, badge }) => (
            <button
              key={id}
              type="button"
              onClick={action}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition ${
                highlight
                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold shadow-sm'
                  : 'hover:bg-zinc-900 text-zinc-300 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                  highlight ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold block truncate leading-tight">{label}</span>
                  <span className="text-[10px] text-zinc-500 block truncate leading-tight mt-0.5">{desc}</span>
                </div>
              </div>
              {badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  highlight
                    ? 'bg-amber-500/30 text-amber-300'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          ))}

          {/* Category Shortcuts */}
          <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider px-2 pt-3 pb-1 border-t border-zinc-800/80 mt-2 flex items-center justify-between">
            <span>Filter by Category</span>
            <span className="text-[10px] text-zinc-500">{totalItems} items</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedCategoryFilter('all');
              setIsSlideDrawerOpen(false);
              setCurrentView('items');
            }}
            className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition text-xs ${
              selectedCategoryFilter === 'all' && currentView === 'items'
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold'
                : 'hover:bg-zinc-900 text-zinc-300 border border-transparent'
            }`}
          >
            <span className="flex items-center space-x-2">
              <span className="text-base">🍽️</span>
              <span>All Dishes</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400">
              {totalItems}
            </span>
          </button>

          {categoryCounts.map(cat => {
            const isSelected = selectedCategoryFilter === cat.id && currentView === 'items';
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategoryFilter(cat.id);
                  setIsSlideDrawerOpen(false);
                  setCurrentView('items');
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition text-xs ${
                  isSelected
                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold'
                    : 'hover:bg-zinc-900 text-zinc-300 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-base flex-shrink-0">{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400 flex-shrink-0">
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Drawer Footer: Sound Alert & Logout */}
        <div className="pt-3 border-t border-zinc-800 mt-2 space-y-2">
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={toggleSound}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                soundEnabled
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
            >
              {soundEnabled ? <Bell className="w-3.5 h-3.5 text-amber-400" /> : <BellOff className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? 'Ring: ON' : 'Ring: MUTED'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSlideDrawerOpen(false);
                handleLogout();
              }}
              className="text-xs font-semibold text-zinc-400 hover:text-red-400 transition px-2 py-1"
            >
              Logout 🚪
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── ADD / EDIT ITEM FORM ─────────────────────────────────────────────────────
  if (currentView === 'add' || currentView === 'edit') {
    return (
      <>
        {floatingAlertBanner}
        {slideFeaturesDrawer}
        <div className="min-h-screen bg-zinc-950">
          <AdminTopbar
            title={currentView === 'add' ? '➕ Add Menu Item' : '✏️ Edit Menu Item'}
            onBack={handleCancel} backLabel="Menu Items"
            onOpenSlideMenu={() => setIsSlideDrawerOpen(true)}
            right={
              <>
                <GhostBtn onClick={handleCancel} disabled={isProcessing}><X className="h-4 w-4" /><span>Cancel</span></GhostBtn>
                <PrimaryBtn onClick={handleSaveItem} loading={isProcessing} disabled={isProcessing}>
                  <Save className="h-4 w-4" /><span>Save Item</span>
                </PrimaryBtn>
              </>
            }
          />

        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6">
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
            <ImageUpload
              currentImage={formData.image}
              onImageChange={imageUrl => setFormData({ ...formData, image: imageUrl })}
              maxWidth={800}
              maxHeight={600}
              quality={0.78}
              sizeHint="800 × 600 px"
              sizeNote="Square o landscape na litrato ng pagkain • JPG, PNG, WebP"
            />
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
    const displayedItems = selectedCategoryFilter === 'all'
      ? menuItems
      : menuItems.filter(i => i.category === selectedCategoryFilter);

    return (
      <>
        {floatingAlertBanner}
        {slideFeaturesDrawer}
        <div className="min-h-screen bg-zinc-950">
          <AdminTopbar
            title="🍽️ Menu Items"
            onBack={() => setCurrentView('dashboard')}
            onOpenSlideMenu={() => setIsSlideDrawerOpen(true)}
            right={
              <>
                {showBulkActions && selectedItems.length > 0 && (
                  <span className="text-xs text-zinc-400 font-medium hidden sm:inline">{selectedItems.length} selected</span>
                )}
                <PrimaryBtn onClick={handleAddItem}><Plus className="h-4 w-4" /><span>Add Item</span></PrimaryBtn>
              </>
            }
          />

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex gap-4 lg:gap-6 items-start">
            {/* Left Side: Categories Sidebar (Desktop only on large screens, mobile uses horizontal bar + slide features) */}
            <div className="hidden lg:block lg:w-64 flex-shrink-0 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-none shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Categories</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setCurrentView('categories')}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition"
                  title="Manage categories"
                >
                  Manage ⚙️
                </button>
              </div>

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition ${
                    selectedCategoryFilter === 'all'
                      ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 font-bold shadow-md'
                      : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span className="text-lg">🍽️</span>
                    <span className="text-xs font-semibold">All Dishes</span>
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedCategoryFilter === 'all' ? 'bg-amber-500/40 text-amber-200' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {menuItems.length}
                  </span>
                </button>

                {categoryCounts.map(cat => {
                  const isSelected = selectedCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition ${
                        isSelected
                          ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 font-bold shadow-md'
                          : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="text-lg flex-shrink-0">{cat.icon}</span>
                        <span className="text-xs font-medium truncate">
                          {cat.name}
                        </span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full flex-shrink-0 font-bold ${
                        isSelected ? 'bg-amber-500/40 text-amber-200' : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Side: Menu Items Table & Content */}
            <div className="flex-1 min-w-0 w-full space-y-3 sm:space-y-4">
              {/* Mobile Horizontal Category Filter Scrollbar */}
              <div className="lg:hidden flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-1 flex-shrink-0 ${
                    selectedCategoryFilter === 'all'
                      ? 'bg-amber-500 text-black shadow'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  <span>🍽️ All</span>
                  <span className="text-[10px] opacity-75">({menuItems.length})</span>
                </button>
                {categoryCounts.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-1 flex-shrink-0 ${
                      selectedCategoryFilter === cat.id
                        ? 'bg-amber-500 text-black shadow'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    <span>{cat.icon} {cat.name}</span>
                    <span className="text-[10px] opacity-75">({cat.count})</span>
                  </button>
                ))}
              </div>
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
                {displayedItems.length > 0 && (
                  <div className="bg-zinc-800/50 border-b border-zinc-800 px-4 sm:px-5 py-3 flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === displayedItems.length && displayedItems.length > 0}
                        onChange={() => {
                          if (selectedItems.length === displayedItems.length) {
                            setSelectedItems([]);
                            setShowBulkActions(false);
                          } else {
                            setSelectedItems(displayedItems.map(i => i.id));
                            setShowBulkActions(true);
                          }
                        }}
                        className="w-4 h-4 rounded accent-amber-500"
                      />
                      <span className="text-xs font-medium text-zinc-400">
                        {selectedCategoryFilter !== 'all' ? `Select In Category (${displayedItems.length} items)` : `Select All (${menuItems.length} items)`}
                      </span>
                    </label>
                    <div className="flex items-center space-x-2">
                      {selectedCategoryFilter !== 'all' && (
                        <button
                          onClick={() => setSelectedCategoryFilter('all')}
                          className="text-xs text-amber-400 hover:underline"
                        >
                          Show All Categories
                        </button>
                      )}
                      {selectedItems.length > 0 && (
                        <button onClick={() => setSelectedItems([])} className="text-xs text-zinc-500 hover:text-zinc-300 transition">
                          {selectedItems.length} selected · Clear
                        </button>
                      )}
                    </div>
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
                      {displayedItems.map(item => (
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
                  {displayedItems.map(item => (
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

                {displayedItems.length === 0 && (
                  <div className="py-16 text-center">
                    <Package className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                    <h3 className="text-white font-semibold mb-1">
                      {selectedCategoryFilter !== 'all' ? 'No items in this category' : 'No menu items yet'}
                    </h3>
                    <p className="text-zinc-500 text-sm mb-4">
                      {selectedCategoryFilter !== 'all'
                        ? 'Try selecting another category or add an item to this category.'
                        : 'Add your first dish to get started.'}
                    </p>
                    <div className="flex items-center justify-center space-x-3">
                      {selectedCategoryFilter !== 'all' && (
                        <button
                          onClick={() => setSelectedCategoryFilter('all')}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition"
                        >
                          Show All Items
                        </button>
                      )}
                      <PrimaryBtn onClick={handleAddItem}><Plus className="h-4 w-4" /><span>Add Item</span></PrimaryBtn>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

  // ── SUBVIEWS (delegate) ──────────────────────────────────────────────────────
  if (currentView === 'orders') return <>{floatingAlertBanner}{slideFeaturesDrawer}<OrdersManager onBack={() => setCurrentView('dashboard')} onOpenSlideMenu={() => setIsSlideDrawerOpen(true)} /></>;
  if (currentView === 'analytics') return <>{floatingAlertBanner}{slideFeaturesDrawer}<AnalyticsManager onBack={() => setCurrentView('dashboard')} onOpenSlideMenu={() => setIsSlideDrawerOpen(true)} /></>;
  if (currentView === 'customers') return <>{floatingAlertBanner}{slideFeaturesDrawer}<CustomerManager onBack={() => setCurrentView('dashboard')} onOpenSlideMenu={() => setIsSlideDrawerOpen(true)} /></>;
  if (currentView === 'upsells') return <>{floatingAlertBanner}{slideFeaturesDrawer}<UpsellManager onBack={() => setCurrentView('dashboard')} onOpenSlideMenu={() => setIsSlideDrawerOpen(true)} /></>;
  if (currentView === 'categories') return <>{floatingAlertBanner}{slideFeaturesDrawer}<CategoryManager onBack={() => setCurrentView('dashboard')} onOpenSlideMenu={() => setIsSlideDrawerOpen(true)} /></>;
  if (currentView === 'payments') return <>{floatingAlertBanner}{slideFeaturesDrawer}<PaymentMethodManager onBack={() => setCurrentView('dashboard')} onOpenSlideMenu={() => setIsSlideDrawerOpen(true)} /></>;
  if (currentView === 'delivery') {
    return (
      <>
        {floatingAlertBanner}
        {slideFeaturesDrawer}
        <div className="min-h-screen bg-zinc-950">
          <AdminTopbar
            title="Delivery Settings"
            onBack={() => setCurrentView('dashboard')}
            onOpenSlideMenu={() => setIsSlideDrawerOpen(true)}
          />
          <div className="max-w-5xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
            <DeliverySettingsManager />
          </div>
        </div>
      </>
    );
  }
  if (currentView === 'welcome') return <>{floatingAlertBanner}{slideFeaturesDrawer}<WelcomePageManager onBack={() => setCurrentView('dashboard')} onOpenSlideMenu={() => setIsSlideDrawerOpen(true)} /></>;

  if (currentView === 'settings') {
    return (
      <>
        {floatingAlertBanner}
        {slideFeaturesDrawer}
        <div className="min-h-screen bg-zinc-950">
          <AdminTopbar
            title="⚙️ Site Settings"
            onBack={() => setCurrentView('dashboard')}
            onOpenSlideMenu={() => setIsSlideDrawerOpen(true)}
          />
          <div className="max-w-4xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
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
      {slideFeaturesDrawer}
      <div className="min-h-screen bg-zinc-950">
        {/* Topbar */}
        <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* Left: Slide Features Hamburger Toggle + Logo (No "Menu & Categories" text) */}
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsSlideDrawerOpen(true)}
                  className="p-1.5 sm:p-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 rounded-xl transition active:scale-95 flex-shrink-0 shadow-sm"
                  title="Open Slide Features & All Sections"
                  aria-label="Open slide menu"
                >
                  <Menu className="w-5 h-5 text-amber-400" />
                </button>

                <img
                  src="/images/afodable-bites-logo.jpg"
                  alt="Admin Logo"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-amber-500/40 flex-shrink-0"
                  onError={e => { e.currentTarget.src = '/logo.jpg'; }}
                />
              </div>

              {/* Right: Sound Alert + Logout */}
              <div className="flex items-center space-x-1.5 sm:space-x-3 flex-shrink-0">
                {/* One-time mobile audio unlock button — disappears after first tap */}
                {!audioUnlocked && (
                  <button
                    type="button"
                    onClick={async () => {
                      await unlockAudio();
                      setAudioUnlocked(isAudioUnlocked());
                      testOrderChime();
                    }}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[11px] rounded-lg shadow transition active:scale-95 sm:hidden"
                    title="Tap to enable order sound alerts"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Enable Sound</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition border ${
                    soundEnabled
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                  }`}
                  title={soundEnabled ? 'Click to Mute Ringtone' : 'Click to Enable Ringtone'}
                >
                  {soundEnabled ? <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" /> : <BellOff className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{soundEnabled ? 'Ring: ON' : 'Ring: MUTED'}</span>
                </button>
                <button onClick={handleLogout} className="px-2.5 py-1 text-xs text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition font-medium">Logout</button>
              </div>
            </div>
          </div>
        </div>

        {/* Screen Content: Analytics only! */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <AnalyticsManager embedded={true} />
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
