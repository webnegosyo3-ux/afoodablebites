import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Users, 
  Search, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  Flame, 
  Award, 
  Calendar, 
  ChevronRight, 
  X,
  ExternalLink,
  CreditCard,
  Truck
} from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { AdminOrder } from '../types';

interface CustomerManagerProps {
  onBack: () => void;
}

interface AggregatedCustomer {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  averageSpend: number;
  lastOrderDate: string;
  mostRecentAddress?: string;
  preferredService: string;
  preferredPayment: string;
  orders: AdminOrder[];
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ onBack }) => {
  const { orders } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'spent' | 'orders' | 'recent' | 'name'>('spent');
  const [selectedCustomer, setSelectedCustomer] = useState<AggregatedCustomer | null>(null);

  // Group orders by customer phone number or name
  const customers = useMemo(() => {
    const customerMap: Record<string, AggregatedCustomer> = {};

    orders.forEach(order => {
      // Normalize phone number for grouping
      const rawPhone = (order.contactNumber || '').replace(/\D/g, '');
      const key = rawPhone || order.customerName.toLowerCase().trim() || order.id;

      if (!customerMap[key]) {
        customerMap[key] = {
          id: key,
          name: order.customerName || 'Customer',
          phone: order.contactNumber || 'N/A',
          totalOrders: 0,
          totalSpent: 0,
          averageSpend: 0,
          lastOrderDate: order.createdAt,
          mostRecentAddress: order.address,
          preferredService: order.serviceType,
          preferredPayment: order.paymentMethod,
          orders: []
        };
      }

      const c = customerMap[key];
      c.orders.push(order);
      c.totalOrders += 1;
      if (order.status !== 'cancelled') {
        c.totalSpent += Number(order.total) || 0;
      }

      // Update name or address if more recent
      if (order.customerName && order.customerName.length > c.name.length) {
        c.name = order.customerName;
      }
      if (order.address) {
        c.mostRecentAddress = order.address;
      }

      // Track newest order date
      if (new Date(order.createdAt).getTime() > new Date(c.lastOrderDate).getTime()) {
        c.lastOrderDate = order.createdAt;
        c.preferredService = order.serviceType;
        c.preferredPayment = order.paymentMethod;
      }
    });

    // Compute averages
    return Object.values(customerMap).map(c => {
      c.averageSpend = c.totalOrders > 0 ? Math.round(c.totalSpent / c.totalOrders) : 0;
      // Sort orders descending by date
      c.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return c;
    });
  }, [orders]);

  // Filter & Sort
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = customers.filter(c => {
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.mostRecentAddress && c.mostRecentAddress.toLowerCase().includes(q))
      );
    });

    result.sort((a, b) => {
      if (sortBy === 'spent') return b.totalSpent - a.totalSpent;
      if (sortBy === 'orders') return b.totalOrders - a.totalOrders;
      if (sortBy === 'recent') return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [customers, searchQuery, sortBy]);

  // Summary KPIs
  const totalCustomers = customers.length;
  const repeatCustomers = customers.filter(c => c.totalOrders > 1).length;
  const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;
  const totalCustomerRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgLifetimeSpend = totalCustomers > 0 ? Math.round(totalCustomerRevenue / totalCustomers) : 0;

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
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
                <Users className="w-5 h-5 text-amber-500" />
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  Customer Directory & Records
                </h1>
                <span className="text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  {totalCustomers}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Unique Customers</span>
            <p className="text-2xl sm:text-3xl font-black text-white mt-1">{totalCustomers}</p>
            <p className="text-xs text-zinc-500 mt-1">Mga nakapag-order sa Afoodable Bites</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Returning Customers</span>
            <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">{repeatCustomers}</p>
            <p className="text-xs text-zinc-500 mt-1">{repeatRate}% repeat customer order rate</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Avg Customer Spend</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">₱{avgLifetimeSpend.toLocaleString()}</p>
            <p className="text-xs text-zinc-500 mt-1">Average lifetime order value</p>
          </div>
        </div>

        {/* Search & Sort Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, or address..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-zinc-500 font-semibold">Sort By:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="spent">Pinakamalaking Nagastos (₱)</option>
              <option value="orders">Pinakamaraming Order</option>
              <option value="recent">Pinakabagong Order</option>
              <option value="name">Pangalan (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Customers Table / Cards */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-lg">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/40 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Orders</th>
                  <th className="px-6 py-4">Total Spent</th>
                  <th className="px-6 py-4">Last Order</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-sm">
                {filteredCustomers.map(customer => {
                  const isVip = customer.totalSpent >= 1000 || customer.totalOrders >= 3;
                  const isRepeat = customer.totalOrders > 1;

                  return (
                    <tr
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      className="hover:bg-zinc-800/50 cursor-pointer transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-white text-sm shadow">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center space-x-1.5">
                              <span>{customer.name}</span>
                              {isVip && (
                                <span className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black px-1.5 py-0.2 rounded-full">
                                  VIP ⭐
                                </span>
                              )}
                              {!isVip && isRepeat && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-semibold">
                                  Repeat
                                </span>
                              )}
                            </div>
                            {customer.mostRecentAddress && (
                              <p className="text-xs text-zinc-500 truncate max-w-xs mt-0.5">
                                {customer.mostRecentAddress}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono text-zinc-300 font-semibold">{customer.phone}</span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-black text-white">{customer.totalOrders}</span>
                        <span className="text-zinc-500 text-xs ml-1">orders</span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-black text-amber-400">₱{customer.totalSpent.toLocaleString()}</span>
                      </td>

                      <td className="px-6 py-4 text-xs text-zinc-400">
                        {formatDate(customer.lastOrderDate)}
                      </td>

                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedCustomer(customer);
                          }}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-amber-500 hover:text-black rounded-xl text-xs font-bold transition flex items-center space-x-1"
                        >
                          <span>View History</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-zinc-800">
            {filteredCustomers.map(customer => (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className="p-4 hover:bg-zinc-800/40 cursor-pointer space-y-2 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-white text-xs">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{customer.name}</h4>
                      <p className="font-mono text-xs text-zinc-400">{customer.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-amber-400 text-sm">₱{customer.totalSpent.toLocaleString()}</span>
                    <p className="text-[11px] text-zinc-500">{customer.totalOrders} orders</p>
                  </div>
                </div>

                {customer.mostRecentAddress && (
                  <p className="text-xs text-zinc-500 truncate flex items-center space-x-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span>{customer.mostRecentAddress}</span>
                  </p>
                )}
              </div>
            ))}
          </div>

          {filteredCustomers.length === 0 && (
            <div className="py-16 text-center text-zinc-500 text-sm">
              Walang customer na tumutugma sa search query.
            </div>
          )}
        </div>

        {/* Customer Detail Drawer / Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-white text-lg shadow-lg">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{selectedCustomer.name}</h3>
                    <p className="font-mono text-xs text-zinc-400">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Actions: Call & SMS */}
              <div className="flex items-center gap-3">
                <a
                  href={`tel:${selectedCustomer.phone}`}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Customer</span>
                </a>
                <a
                  href={`sms:${selectedCustomer.phone}`}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition border border-zinc-700"
                >
                  <span>💬 SMS Text</span>
                </a>
              </div>

              {/* Customer Lifetime Summary */}
              <div className="grid grid-cols-3 gap-3 bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 text-center">
                <div>
                  <span className="text-[11px] font-bold text-zinc-500 uppercase">Total Spent</span>
                  <p className="text-lg font-black text-amber-400 mt-0.5">₱{selectedCustomer.totalSpent.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-zinc-500 uppercase">Orders</span>
                  <p className="text-lg font-black text-white mt-0.5">{selectedCustomer.totalOrders}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-zinc-500 uppercase">Avg / Order</span>
                  <p className="text-lg font-black text-emerald-400 mt-0.5">₱{selectedCustomer.averageSpend.toLocaleString()}</p>
                </div>
              </div>

              {selectedCustomer.mostRecentAddress && (
                <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Recent Address:</span>
                    <span>{selectedCustomer.mostRecentAddress}</span>
                  </div>
                </div>
              )}

              {/* Order History List */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center space-x-1.5">
                  <ShoppingBag className="w-4 h-4 text-amber-500" />
                  <span>Order History ({selectedCustomer.orders.length})</span>
                </h4>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {selectedCustomer.orders.map(order => (
                    <div key={order.id} className="bg-zinc-800/60 border border-zinc-800 rounded-xl p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-400">Order #{order.id}</span>
                        <span className="text-zinc-500">{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="capitalize">{order.serviceType} • {order.paymentMethod}</span>
                        <span className="font-black text-white text-sm">₱{order.total}</span>
                      </div>
                      <div className="border-t border-zinc-800/60 pt-2 text-[11px] text-zinc-400">
                        {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManager;
