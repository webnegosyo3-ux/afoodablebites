import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Clock, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Trash2, 
  Search, 
  Flame, 
  MessageCircle, 
  ChevronDown,
  RotateCcw,
  Bell,
  BellOff,
  Menu
} from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { AdminOrder, OrderStatus } from '../types';
import { 
  isSoundAlertEnabled, 
  setSoundAlertEnabled, 
  testOrderChime, 
  stopOrderRingtone 
} from '../utils/audioAlert';

interface OrdersManagerProps {
  onBack: () => void;
  onOpenSlideMenu?: () => void;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; text: string; border: string; icon: any }> = {
  pending: {
    label: 'Pending',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/40',
    icon: Clock
  },
  preparing: {
    label: 'Preparing',
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    border: 'border-blue-500/40',
    icon: Flame
  },
  completed: {
    label: 'Completed',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
    icon: CheckCircle2
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    border: 'border-red-500/40',
    icon: XCircle
  }
};

const OrdersManager: React.FC<OrdersManagerProps> = ({ onBack, onOpenSlideMenu }) => {
  const { orders, updateOrderStatus, deleteOrder, clearAllOrders } = useOrders();
  const [filterStatus, setFilterStatus] = useState<'all' | OrderStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(isSoundAlertEnabled());

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    setSoundAlertEnabled(next);
    if (next) {
      testOrderChime();
    } else {
      stopOrderRingtone();
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      order.id.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      order.contactNumber.includes(q) ||
      (order.address && order.address.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  const countByStatus = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length
  };

  const handleClearAll = () => {
    if (orders.length === 0) return;
    if (confirm('Are you sure you want to delete all order records? This cannot be undone.')) {
      clearAllOrders();
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return iso;
    }
  };

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
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />
                <h1 className="text-sm sm:text-xl font-bold text-white truncate">
                  Customer Orders
                </h1>
                <span className="text-[10px] sm:text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0">
                  {orders.length}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleToggleSound}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center space-x-1 sm:space-x-1.5 ${
                  soundEnabled
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                }`}
                title={soundEnabled ? 'Mute Ringtone' : 'Enable Ringtone'}
              >
                {soundEnabled ? <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" /> : <BellOff className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{soundEnabled ? 'Ring: ON' : 'Ring: MUTED'}</span>
              </button>

              {orders.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 sm:px-3 py-1.5 border border-zinc-800 hover:border-red-500/40 text-zinc-400 hover:text-red-400 rounded-xl text-xs font-semibold transition"
                  title="Clear all orders"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-4 sm:space-y-6">
        
        {/* Live Audio Alerts & Direct Dashboard Order Info Banner */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-amber-950/40 border border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-400">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-sm">
                  Live Orders System (Auto-Ringing)
                </h3>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>ONLINE & LISTENING</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Direktang pumapasok ang lahat ng order ng customer sa Admin Dashboard na may kasamang sound notification / ringing bell.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
            <button
              type="button"
              onClick={handleToggleSound}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 ${
                soundEnabled
                  ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
              }`}
            >
              {soundEnabled ? <Bell className="w-4 h-4 animate-bounce" /> : <BellOff className="w-4 h-4" />}
              <span>{soundEnabled ? 'Sound: ON' : 'Sound: MUTED'}</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-hide">
            {(['all', 'pending', 'preparing', 'completed', 'cancelled'] as const).map((st) => {
              const isActive = filterStatus === st;
              const count = countByStatus[st];
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 flex-shrink-0 ${
                    isActive
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  <span className="capitalize">{st}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isActive ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, ID..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Orders List / Cards */}
        {filteredOrders.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto text-3xl">
              📦
            </div>
            <h3 className="text-lg font-bold text-white">No orders found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {searchQuery
                ? `No orders matching "${searchQuery}". Try a different keyword.`
                : 'Customer orders will appear here in real-time with an audible ringing notification.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;

              return (
                <div
                  key={order.id}
                  className={`bg-zinc-900 border rounded-2xl p-5 sm:p-6 transition shadow-sm space-y-4 ${
                    order.status === 'pending'
                      ? 'border-amber-500/60 ring-1 ring-amber-500/20'
                      : 'border-zinc-800'
                  }`}
                >
                  {/* Order Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-black text-sm">
                        #{order.id.replace('AB-', '')}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-white text-base">
                            {order.customerName}
                          </h3>
                          <span className="text-xs font-mono text-zinc-400">
                            ({order.id})
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400">
                          Placed: {formatTimestamp(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge + Status Select */}
                    <div className="flex items-center space-x-2">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{statusCfg.label}</span>
                      </div>

                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className="bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                      >
                        <option value="pending">Set: Pending</option>
                        <option value="preparing">Set: Preparing</option>
                        <option value="completed">Set: Completed</option>
                        <option value="cancelled">Set: Cancelled</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete order ${order.id}?`)) {
                            deleteOrder(order.id);
                          }
                        }}
                        className="p-1.5 text-zinc-500 hover:text-red-400 transition"
                        title="Delete order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Customer Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-950/60 rounded-xl p-3.5 border border-zinc-800/80 text-xs">
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Contact</span>
                      <a
                        href={`tel:${order.contactNumber}`}
                        className="font-bold text-amber-400 hover:underline flex items-center space-x-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{order.contactNumber}</span>
                      </a>
                    </div>

                    <div>
                      <span className="text-zinc-500 block mb-0.5">Service Type</span>
                      <span className="font-bold text-white capitalize">
                        {order.serviceType === 'dine-in' ? '🍽️ Dine In' : order.serviceType === 'pickup' ? '🥡 Pickup' : '🛵 Delivery'}
                      </span>
                      {order.pickupTime && (
                        <span className="text-[11px] text-zinc-400 block">
                          ETA: {order.pickupTime}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-zinc-500 block mb-0.5">Payment Method</span>
                      <span className="font-bold text-white">
                        {order.paymentMethod}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block mb-0.5">Total Amount</span>
                      <span className="text-base font-black text-amber-400">
                        ₱{order.total}
                      </span>
                    </div>

                    {order.address && (
                      <div className="sm:col-span-2 md:col-span-4 pt-1 border-t border-zinc-800/60">
                        <span className="text-zinc-500 block mb-0.5">Delivery Address</span>
                        <p className="text-zinc-300 font-medium flex items-start space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                          <span>
                            {order.address}
                            {order.landmark && <span className="text-zinc-400"> (Landmark: {order.landmark})</span>}
                          </span>
                        </p>
                      </div>
                    )}

                    {order.notes && (
                      <div className="sm:col-span-2 md:col-span-4 pt-1 border-t border-zinc-800/60">
                        <span className="text-zinc-500 block mb-0.5">Customer Notes</span>
                        <p className="text-amber-200/90 font-medium italic">
                          "{order.notes}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* GCash / QR Payment Verification Box */}
                  {(order.paymentSenderName || order.paymentReferenceNumber) && (
                    <div className="bg-gradient-to-r from-blue-950/40 via-blue-900/30 to-zinc-900 border border-blue-500/40 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5 text-blue-300 font-bold">
                          <span>📱</span>
                          <span>GCash / Online Payment Verification</span>
                          <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">
                            Verify in GCash
                          </span>
                        </div>
                        {order.paymentSenderName && (
                          <p className="text-zinc-300">
                            <span className="text-zinc-500 font-medium">Sender GCash Account:</span>{' '}
                            <strong className="text-white">{order.paymentSenderName}</strong>
                          </p>
                        )}
                        {order.paymentReferenceNumber && (
                          <p className="text-zinc-300">
                            <span className="text-zinc-500 font-medium">GCash Reference No:</span>{' '}
                            <strong className="font-mono text-amber-300 tracking-wider text-sm ml-1">
                              {order.paymentReferenceNumber}
                            </strong>
                          </p>
                        )}
                      </div>

                      {order.paymentReferenceNumber && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(order.paymentReferenceNumber || '');
                            alert('Copied GCash Ref No: ' + order.paymentReferenceNumber);
                          }}
                          className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-400/30 rounded-lg font-bold text-xs self-start sm:self-center transition flex items-center space-x-1"
                        >
                          <span>Copy Ref No. 📋</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Ordered Items Breakdown */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                      Ordered Items ({order.items.reduce((acc, i) => acc + i.quantity, 0)})
                    </span>
                    <div className="divide-y divide-zinc-800/60 bg-zinc-950/40 rounded-xl px-4 py-1 border border-zinc-800/60">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="py-2.5 flex items-start justify-between text-xs">
                          <div>
                            <div className="font-bold text-white flex items-center space-x-1.5">
                              <span>{item.quantity}x</span>
                              <span>{item.name}</span>
                            </div>
                            {item.selectedVariation && (
                              <p className="text-[11px] text-zinc-400">
                                Variation: {item.selectedVariation.name}
                              </p>
                            )}
                            {item.selectedVariations && item.selectedVariations.length > 0 && (
                              <p className="text-[11px] text-zinc-400">
                                Flavors: {item.selectedVariations.map(v => v.name).join(' + ')}
                              </p>
                            )}
                            {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                              <p className="text-[11px] text-zinc-400">
                                Add-ons: {item.selectedAddOns.map(a => `${a.name}${a.quantity && a.quantity > 1 ? ` x${a.quantity}` : ''}`).join(', ')}
                              </p>
                            )}
                          </div>
                          <span className="font-bold text-amber-400">
                            ₱{item.totalPrice * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersManager;
