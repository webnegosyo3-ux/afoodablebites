import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  ArrowLeft, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  QrCode, 
  Power,
  Flame,
  AlertCircle,
  Menu
} from 'lucide-react';
import { usePaymentMethods, PaymentMethod } from '../hooks/usePaymentMethods';
import ImageUpload from './ImageUpload';

interface PaymentMethodManagerProps {
  onBack: () => void;
  onOpenSlideMenu?: () => void;
}

const inputCls =
  'w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition';
const labelCls = 'block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5';

const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({ onBack, onOpenSlideMenu }) => {
  const { 
    paymentMethods, 
    addPaymentMethod, 
    updatePaymentMethod, 
    deletePaymentMethod, 
    togglePaymentMethod,
    refetchAll 
  } = usePaymentMethods();

  const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    account_number: '',
    account_name: '',
    qr_code_url: '',
    active: true,
    sort_order: 0
  });

  React.useEffect(() => {
    refetchAll();
  }, [refetchAll]);

  const codMethod = paymentMethods.find(m => m.id === 'payment-cod' || m.id === 'cod');
  const isCodActive = codMethod ? codMethod.active : false;

  const handleToggleCod = async () => {
    if (codMethod) {
      await togglePaymentMethod(codMethod.id);
    } else {
      // Create default COD if not yet present
      await addPaymentMethod({
        id: 'payment-cod',
        name: 'Cash on Delivery (COD) / Counter',
        account_number: 'Cash Payment',
        account_name: 'Pay upon delivery / at counter',
        qr_code_url: '',
        active: true,
        sort_order: 2
      });
    }
  };

  const handleAddMethod = () => {
    const nextSortOrder = Math.max(...paymentMethods.map(m => m.sort_order), 0) + 1;
    setFormData({
      id: '',
      name: '',
      account_number: '',
      account_name: 'Afoodable Bites',
      qr_code_url: '',
      active: true,
      sort_order: nextSortOrder
    });
    setCurrentView('add');
  };

  const handleEditMethod = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      id: method.id,
      name: method.name,
      account_number: method.account_number,
      account_name: method.account_name,
      qr_code_url: method.qr_code_url,
      active: method.active,
      sort_order: method.sort_order
    });
    setCurrentView('edit');
  };

  const handleDeleteMethod = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete payment method "${name}"?`)) {
      try {
        await deletePaymentMethod(id);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to delete payment method');
      }
    }
  };

  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please fill in the payment method name');
      return;
    }

    try {
      setIsSaving(true);
      if (editingMethod) {
        await updatePaymentMethod(editingMethod.id, formData);
      } else {
        const idToUse = formData.id.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        await addPaymentMethod({
          ...formData,
          id: idToUse
        });
      }
      setCurrentView('list');
      setEditingMethod(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save payment method');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCurrentView('list');
    setEditingMethod(null);
  };

  // Add / Edit Modal Form View
  if (currentView === 'add' || currentView === 'edit') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white pb-16">
        <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center space-x-1.5 text-zinc-400 hover:text-amber-400 transition text-sm font-medium"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
                <span className="text-zinc-700">|</span>
                <h1 className="text-lg font-bold text-white flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  <span>{currentView === 'add' ? 'Add Payment Method' : 'Edit Payment Method'}</span>
                </h1>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-3.5 py-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          <form onSubmit={handleSaveMethod} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div>
              <label className={labelCls}>Payment Method Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputCls}
                placeholder="e.g. GCash, Maya, Bank Transfer, Cash on Delivery"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Account Number / Details</label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. 0905 293 1408 or Cash"
                />
              </div>

              <div>
                <label className={labelCls}>Account Name / Label</label>
                <input
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Afoodable Bites"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>QR Code Image (Optional for Cash)</label>
              <ImageUpload
                currentImage={formData.qr_code_url}
                onImageChange={(imageUrl) => setFormData({ ...formData, qr_code_url: imageUrl || '' })}
              />
              <p className="text-xs text-zinc-500 mt-2">
                Upload your GCash or Maya QR code image so customers can scan it directly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className={labelCls}>Display Order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                  className={inputCls}
                  placeholder="1"
                  min="0"
                />
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded accent-amber-500"
                  />
                  <span className="text-sm font-semibold text-zinc-200">Active / Enable Method</span>
                </label>
              </div>
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
                <span>{isSaving ? 'Saving...' : 'Save Payment Method'}</span>
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
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />
                <h1 className="text-sm sm:text-xl font-bold text-white truncate">
                  Payment Methods
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddMethod}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs sm:text-sm font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 shadow transition flex items-center space-x-1 sm:space-x-1.5 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-4 sm:space-y-6">
        
        {/* Special Featured Banner: Cash on Delivery (COD) Toggle */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-amber-950/40 border-2 border-amber-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 flex-shrink-0">
                <Banknote className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-extrabold text-white">
                    Cash on Delivery (COD) / Counter
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    isCodActive 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}>
                    {isCodActive ? '● COD ENABLED' : '○ COD DISABLED'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
                  Allow customers to place orders and pay with physical cash upon receiving their delivery or at the dining counter.
                </p>
              </div>
            </div>

            {/* One-Click COD Toggle Switch */}
            <div className="flex items-center space-x-3 self-end sm:self-center">
              <button
                type="button"
                onClick={handleToggleCod}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center space-x-2 ${
                  isCodActive
                    ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                }`}
              >
                <Power className="w-4 h-4" />
                <span>{isCodActive ? 'Turn COD OFF' : 'Turn COD ON'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* All Payment Methods Cards */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-amber-500" />
                <span>All Payment Options ({paymentMethods.length})</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Enable, disable, or edit account numbers and QR codes for GCash, Maya, Bank Transfer, and Cash.
              </p>
            </div>
          </div>

          <div className="divide-y divide-zinc-800">
            {paymentMethods.map((method) => {
              const isCod = method.id === 'payment-cod' || method.id === 'cod';
              return (
                <div
                  key={method.id}
                  className={`p-5 sm:p-6 hover:bg-zinc-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    !method.active ? 'opacity-60 bg-zinc-950/40' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    {/* Method Icon / QR Thumbnail */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 shadow">
                      {isCod ? (
                        <Banknote className="w-8 h-8 text-amber-400" />
                      ) : method.qr_code_url ? (
                        <img
                          src={method.qr_code_url}
                          alt={method.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <QrCode className="w-7 h-7 text-zinc-500" />
                      )}
                    </div>

                    {/* Method Info */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h4 className="font-bold text-white text-base truncate">
                          {method.name}
                        </h4>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            method.active
                              ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {method.active ? '● Active' : '○ Inactive'}
                        </span>
                      </div>

                      {method.account_number && (
                        <p className="text-xs font-mono font-bold text-amber-400">
                          {method.account_number}
                        </p>
                      )}

                      {method.account_name && (
                        <p className="text-xs text-zinc-400">
                          Account: {method.account_name}
                        </p>
                      )}

                      <p className="text-[10px] text-zinc-500">
                        Sort Order #{method.sort_order}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Toggle */}
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    {/* Active/Inactive Toggle */}
                    <button
                      type="button"
                      onClick={() => togglePaymentMethod(method.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                        method.active
                          ? 'bg-zinc-800 text-emerald-400 hover:bg-zinc-700 border border-emerald-800'
                          : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 border border-zinc-700'
                      }`}
                      title={method.active ? 'Click to deactivate' : 'Click to activate'}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{method.active ? 'Active' : 'Enable'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEditMethod(method)}
                      className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    {!isCod && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMethod(method.id, method.name)}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodManager;
