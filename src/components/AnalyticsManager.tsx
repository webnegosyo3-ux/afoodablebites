import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Calendar, 
  Flame, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Award,
  CreditCard,
  Truck,
  Coffee,
  PieChart,
  BarChart3,
  RefreshCw,
  Menu,
  Download
} from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { useMenu } from '../hooks/useMenu';
import { AdminOrder } from '../types';
import { exportSalesCsv } from '../utils/exportCsv';

interface AnalyticsManagerProps {
  onBack?: () => void;
  embedded?: boolean;
  onOpenSlideMenu?: () => void;
}

type TimeRange = 'all' | 'today' | 'week' | 'month';

const AnalyticsManager: React.FC<AnalyticsManagerProps> = ({ onBack, embedded = false, onOpenSlideMenu }) => {
  const { orders, refetch, loading } = useOrders();
  const { menuItems } = useMenu();
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const timeLabelMap: Record<TimeRange, string> = {
    all: 'all-time', today: 'today', week: 'this-week', month: 'this-month'
  };

  const handleExportCsv = () => {
    exportSalesCsv(filteredOrders, timeLabelMap[timeRange]);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (refetch) {
        await refetch();
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Filter orders by time range
  const filteredOrders = useMemo(() => {
    if (timeRange === 'all') return orders;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return orders.filter(order => {
      const orderTime = new Date(order.createdAt).getTime();
      if (isNaN(orderTime)) return true;

      if (timeRange === 'today') return orderTime >= startOfToday;
      if (timeRange === 'week') return orderTime >= startOfWeek;
      if (timeRange === 'month') return orderTime >= startOfMonth;
      return true;
    });
  }, [orders, timeRange]);

  // Overall Financial & Order Stats
  const stats = useMemo(() => {
    // Only non-cancelled orders count towards valid revenue
    const validOrders = filteredOrders.filter(o => o.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalOrdersCount = filteredOrders.length;
    const aov = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

    // Today's stats specifically
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayOrders = orders.filter(o => {
      const t = new Date(o.createdAt).getTime();
      return !isNaN(t) && t >= startOfToday && o.status !== 'cancelled';
    });
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    // Status Counts
    const pendingCount = filteredOrders.filter(o => o.status === 'pending').length;
    const preparingCount = filteredOrders.filter(o => o.status === 'preparing').length;
    const completedCount = filteredOrders.filter(o => o.status === 'completed').length;
    const cancelledCount = filteredOrders.filter(o => o.status === 'cancelled').length;

    // Service Type Breakdown
    const serviceTypes: Record<string, { count: number; revenue: number }> = {
      'dine-in': { count: 0, revenue: 0 },
      'pickup': { count: 0, revenue: 0 },
      'delivery': { count: 0, revenue: 0 }
    };

    validOrders.forEach(o => {
      const s = o.serviceType || 'dine-in';
      if (!serviceTypes[s]) {
        serviceTypes[s] = { count: 0, revenue: 0 };
      }
      serviceTypes[s].count += 1;
      serviceTypes[s].revenue += Number(o.total) || 0;
    });

    // Payment Method Breakdown
    const paymentMethods: Record<string, { count: number; revenue: number }> = {
      'gcash': { count: 0, revenue: 0 },
      'cod': { count: 0, revenue: 0 }
    };

    validOrders.forEach(o => {
      const pay = (o.paymentMethod || '').toLowerCase();
      const isGcash = pay.includes('gcash') || pay.includes('maya') || pay.includes('online') || pay.includes('qr');
      const key = isGcash ? 'gcash' : 'cod';
      paymentMethods[key].count += 1;
      paymentMethods[key].revenue += Number(o.total) || 0;
    });

    // Best Selling Items Aggregation
    const itemSales: Record<string, { name: string; quantity: number; revenue: number; image?: string }> = {};

    validOrders.forEach(o => {
      (o.items || []).forEach(item => {
        const key = item.name;
        if (!itemSales[key]) {
          itemSales[key] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
            image: item.image
          };
        }
        itemSales[key].quantity += item.quantity || 1;
        itemSales[key].revenue += (item.totalPrice || item.basePrice || 0) * (item.quantity || 1);
      });
    });

    const topItems = Object.values(itemSales).sort((a, b) => b.quantity - a.quantity);

    return {
      totalRevenue,
      totalOrdersCount,
      aov,
      todayRevenue,
      todayOrdersCount: todayOrders.length,
      pendingCount,
      preparingCount,
      completedCount,
      cancelledCount,
      serviceTypes,
      paymentMethods,
      topItems
    };
  }, [filteredOrders, orders]);

  return (
    <div className={embedded ? 'text-white space-y-6' : 'min-h-screen bg-zinc-950 text-white pb-16'}>
      {/* Top Navbar or Embedded Header Bar */}
      {embedded ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-black text-white">
              Sales & Business Analytics
            </h2>
          </div>
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 hover:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-500/30 transition active:scale-95"
              title="Export Sales Report as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold border border-zinc-700 transition disabled:opacity-60 shadow-sm active:scale-95"
              title="Refresh Analytics Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {/* Time Range Filter Pills */}
            <div className="flex items-center space-x-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              {(
                [
                  { id: 'all', label: 'All Time' },
                  { id: 'month', label: 'Month' },
                  { id: 'week', label: 'Week' },
                  { id: 'today', label: 'Today' }
                ] as const
              ).map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeRange(t.id)}
                  className={`px-2 sm:px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    timeRange === t.id
                      ? 'bg-amber-500 text-black shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
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
                {onBack && (
                  <>
                    <button
                      type="button"
                      onClick={onBack}
                      className="flex items-center space-x-1 text-zinc-400 hover:text-amber-400 transition text-xs sm:text-sm font-medium flex-shrink-0"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </button>
                    <span className="text-zinc-700">|</span>
                  </>
                )}
                <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />
                  <h1 className="text-sm sm:text-xl font-bold text-white truncate">
                    Analytics
                  </h1>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
                {/* Export CSV */}
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/30 transition active:scale-95"
                  title="Export Sales Report as CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing || loading}
                  className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-bold border border-zinc-700 transition disabled:opacity-60 shadow-sm active:scale-95"
                  title="Refresh Analytics Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>

                {/* Time Range Filter Pills */}
                <div className="flex items-center space-x-0.5 sm:space-x-1 bg-zinc-800 p-1 rounded-xl border border-zinc-700 overflow-x-auto max-w-[180px] xs:max-w-none scrollbar-none">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'month', label: 'Month' },
                      { id: 'week', label: 'Week' },
                      { id: 'today', label: 'Today' }
                    ] as const
                  ).map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTimeRange(t.id)}
                      className={`px-2 sm:px-3 py-1 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                        timeRange === t.id
                          ? 'bg-amber-500 text-black shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={embedded ? 'space-y-4 sm:space-y-6' : 'max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8'}>
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {/* Total Revenue */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Revenue</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                ₱
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ₱{stats.totalRevenue.toLocaleString()}
            </p>
            <p className="text-[11px] text-zinc-500 mt-2">
              Mula sa {filteredOrders.length} kabuuang order record
            </p>
          </div>

          {/* Today's Sales */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Today's Sales</span>
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-orange-400 tracking-tight">
              ₱{stats.todayRevenue.toLocaleString()}
            </p>
            <p className="text-[11px] text-zinc-500 mt-2">
              {stats.todayOrdersCount} orders natanggap ngayong araw
            </p>
          </div>

          {/* Average Order Value (AOV) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Average Order</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ₱{stats.aov.toLocaleString()}
            </p>
            <p className="text-[11px] text-zinc-500 mt-2">
              Average gastos bawat customer order
            </p>
          </div>

          {/* Order Status Ratio */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Order Volume</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              {stats.completedCount} <span className="text-xs text-zinc-500 font-semibold">/ {stats.totalOrdersCount}</span>
            </p>
            <p className="text-[11px] text-zinc-500 mt-2">
              {stats.pendingCount} pending · {stats.preparingCount} preparing
            </p>
          </div>
        </div>

        {/* Breakdown Row: Service Types & Payment Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Service Type Distribution */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <Truck className="w-4 h-4 text-amber-500" />
              <span>Orders by Service Type</span>
            </h3>

            <div className="space-y-3">
              {[
                { key: 'delivery', label: 'Delivery', icon: '🛵', color: 'bg-orange-500' },
                { key: 'dine-in', label: 'Dine In', icon: '🍽️', color: 'bg-amber-500' },
                { key: 'pickup', label: 'Takeout / Pickup', icon: '🥡', color: 'bg-yellow-500' }
              ].map(({ key, label, icon, color }) => {
                const count = stats.serviceTypes[key]?.count || 0;
                const rev = stats.serviceTypes[key]?.revenue || 0;
                const totalValid = stats.totalOrdersCount || 1;
                const pct = Math.round((count / totalValid) * 100);

                return (
                  <div key={key} className="space-y-1.5 bg-zinc-800/40 rounded-2xl p-3 border border-zinc-800">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-semibold text-zinc-200 flex items-center space-x-2">
                        <span>{icon}</span>
                        <span>{label}</span>
                      </span>
                      <div className="text-right">
                        <span className="font-black text-white">{count} orders</span>
                        <span className="text-zinc-500 text-xs ml-2">(₱{rev.toLocaleString()})</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-amber-500" />
              <span>Orders by Payment Method</span>
            </h3>

            <div className="space-y-3">
              {[
                { 
                  key: 'gcash', 
                  label: 'GCash / Online E-Wallet', 
                  icon: '📱', 
                  color: 'bg-blue-500',
                  badge: 'Pre-paid'
                },
                { 
                  key: 'cod', 
                  label: 'Cash on Delivery (COD) / Counter', 
                  icon: '💵', 
                  color: 'bg-amber-500',
                  badge: 'Pay upon receipt'
                }
              ].map(({ key, label, icon, color, badge }) => {
                const count = stats.paymentMethods[key]?.count || 0;
                const rev = stats.paymentMethods[key]?.revenue || 0;
                const totalValid = stats.totalOrdersCount || 1;
                const pct = Math.round((count / totalValid) * 100);

                return (
                  <div key={key} className="space-y-1.5 bg-zinc-800/40 rounded-2xl p-3.5 border border-zinc-800">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-semibold text-zinc-200 flex items-center space-x-2">
                        <span>{icon}</span>
                        <span>{label}</span>
                      </span>
                      <span className="font-black text-white">{count} orders</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-zinc-500">
                      <span>{badge}</span>
                      <span className="font-bold text-amber-400">₱{rev.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Best Selling Menu Items Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-lg">
          <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Top-Selling Dishes & Items</h3>
            </div>
            <span className="text-xs text-zinc-400 font-medium">Ranked by units ordered</span>
          </div>

          <div className="divide-y divide-zinc-800">
            {stats.topItems.slice(0, 8).map((item, index) => {
              const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

              return (
                <div key={item.name} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-800/40 transition">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <span className="text-lg font-black text-amber-400 w-8 text-center flex-shrink-0">
                      {rankEmoji}
                    </span>
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 border border-zinc-700 flex items-center justify-center">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={e => { e.currentTarget.src = '/images/afodable-bites-logo.jpg'; }}
                        />
                      ) : (
                        <span className="text-lg">🍲</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm truncate">{item.name}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {item.quantity} orders sold
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-amber-400 font-black text-sm">₱{item.revenue.toLocaleString()}</p>
                    <p className="text-[11px] text-zinc-500 font-medium">Total sales</p>
                  </div>
                </div>
              );
            })}

            {stats.topItems.length === 0 && (
              <div className="py-12 text-center text-zinc-500 text-sm">
                Wala pang naitalang benta sa napiling time range.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsManager;
