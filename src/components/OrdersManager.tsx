import React, { useState } from 'react';
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
  ExternalLink,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { AdminOrder, OrderStatus } from '../types';

interface OrdersManagerProps {
  onBack: () => void;
}

const FB_PAGE_MESSENGER_ID = '61595737646110';

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

const OrdersManager: React.FC<OrdersManagerProps> = ({ onBack }) => {
  const { orders, updateOrderStatus, deleteOrder, clearAllOrders } = useOrders();
  const [filterStatus, setFilterStatus] = useState<'all' | OrderStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  Customer Orders
                </h1>
                <span className="text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  {orders.length}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href={`https://m.me/${FB_PAGE_MESSENGER_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow flex items-center space-x-1.5"
                title="Open Facebook Page Messenger"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open FB Messenger</span>
              </a>

              {orders.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-3 py-2 border border-zinc-800 hover:border-red-500/40 text-zinc-400 hover:text-red-400 rounded-xl text-xs font-semibold transition"
                  title="Clear all orders"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Messenger Page Connect Info Card */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-blue-950/40 border border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 text-blue-400">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-sm">
                  Connected Facebook Page Messenger
                </h3>
                <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                  ID: {FB_PAGE_MESSENGER_ID}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                When customers place an order, the details are recorded here and automatically forwarded to your Facebook Page Messenger chat.
              </p>
            </div>
          </div>

          <a
            href={`https://m.me/${FB_PAGE_MESSENGER_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold border border-zinc-700 transition flex items-center space-x-1.5 self-end sm:self-center flex-shrink-0"
          >
            <span>View Inbox</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
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
            <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto" />
            <h3 className="text-white font-bold text-base">
              {searchQuery ? 'No matching orders found' : 'No customer orders yet'}
            </h3>
            <p className="text-zinc-500 text-xs sm:text-sm max-w-sm mx-auto">
              {searchQuery
                ? 'Try a different customer name, phone number, or clear your search query.'
                : 'When customers place orders from the website or tap to order, they will appear here in real time.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredOrders.map((order) => {
              const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusInfo.icon;
              const isCod = order.paymentMethod.toLowerCase().includes('cash');

              return (
                <div
                  key={order.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-zinc-700 transition"
                >
                  {/* Top Bar: Order ID, Timestamp & Status Pill */}
                  <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-base font-black text-amber-400">
                          #{order.id}
                        </span>
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusInfo.label}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-zinc-600" />
                        <span>{formatTimestamp(order.createdAt)}</span>
                      </p>
                    </div>

                    {/* Quick Delete */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete order record #${order.id}?`)) {
                          deleteOrder(order.id);
                        }
                      }}
                      className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition"
                      title="Delete order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Customer Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                    <div>
                      <span className="text-zinc-500 block">Customer</span>
                      <span className="font-bold text-white text-sm block truncate">
                        {order.customerName}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block">Contact</span>
                      <a
                        href={`tel:${order.contactNumber}`}
                        className="font-mono font-bold text-amber-400 hover:underline flex items-center space-x-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{order.contactNumber}</span>
                      </a>
                    </div>

                    <div>
                      <span className="text-zinc-500 block">Service Type</span>
                      <span className="font-bold text-zinc-200 capitalize">
                        {order.serviceType === 'dine-in' ? '🍽️ Dine In' : order.serviceType === 'pickup' ? '🥡 Pickup' : '🛵 Delivery'}
                      </span>
                      {order.pickupTime && (
                        <span className="text-zinc-400 block text-[11px]">
                          Time: {order.pickupTime}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-zinc-500 block">Payment Method</span>
                      <span className={`font-bold inline-block ${isCod ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {order.paymentMethod}
                      </span>
                    </div>

                    {order.address && (
                      <div className="sm:col-span-2 pt-1 border-t border-zinc-800/60">
                        <span className="text-zinc-500 flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>Delivery Address:</span>
                        </span>
                        <p className="text-zinc-300 font-medium mt-0.5">
                          {order.address}
                          {order.landmark && ` (Landmark: ${order.landmark})`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Order Items Breakdown */}
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                      Ordered Items ({order.items.length})
                    </span>
                    <div className="divide-y divide-zinc-800/60">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-bold text-white truncate">
                              {item.name}
                              <span className="text-amber-400 ml-1.5 font-bold">
                                x{item.quantity}
                              </span>
                            </p>
                            {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                              <p className="text-[11px] text-zinc-500 truncate">
                                + {item.selectedAddOns.map(a => a.name).join(', ')}
                              </p>
                            )}
                          </div>
                          <span className="font-bold text-zinc-300">
                            ₱{item.totalPrice * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Special Notes */}
                  {order.notes && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-xs text-amber-300">
                      <strong className="block text-[11px] text-amber-400 uppercase">Notes:</strong>
                      <span>{order.notes}</span>
                    </div>
                  )}

                  {/* Total & Status Actions */}
                  <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-zinc-400">Total:</span>
                      <span className="text-xl font-black text-amber-400">
                        ₱{order.total}
                      </span>
                    </div>

                    {/* Status Change Selector */}
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs text-zinc-500 hidden sm:inline">Status:</span>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-xs font-bold rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="pending">🟡 Pending</option>
                        <option value="preparing">🔵 Preparing</option>
                        <option value="completed">🟢 Completed</option>
                        <option value="cancelled">🔴 Cancelled</option>
                      </select>

                      <a
                        href={`https://m.me/${FB_PAGE_MESSENGER_ID}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl transition border border-blue-500/30"
                        title="Chat customer on FB Messenger"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
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
