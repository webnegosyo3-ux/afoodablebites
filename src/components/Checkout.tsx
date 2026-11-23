import React, { useState } from 'react';
import { ArrowLeft, Clock, CreditCard, Banknote, CheckCircle2, Flame, Copy, Check, QrCode, Eye, X } from 'lucide-react';
import { CartItem, ServiceType, AdminOrder } from '../types';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useOrders } from '../hooks/useOrders';

interface CheckoutProps {
  cartItems: CartItem[];
  totalPrice: number;
  onBack: () => void;
  onOrderSuccess?: () => void;
}

// Helper to determine if a payment method is Cash On Delivery (never treat GCash/Maya/e-wallets as COD)
const isCodMethod = (m?: { id: string; name?: string } | null): boolean => {
  if (!m) return false;
  const name = (m.name || '').toLowerCase();
  if (
    name.includes('gcash') ||
    name.includes('maya') ||
    name.includes('wallet') ||
    name.includes('online') ||
    name.includes('instapay') ||
    name.includes('qr')
  ) {
    return false;
  }
  return (
    m.id === 'payment-cod' ||
    m.id === 'cod' ||
    name.includes('cash on delivery') ||
    name.includes('cod') ||
    name.includes('counter') ||
    name.startsWith('cash')
  );
};

const Checkout: React.FC<CheckoutProps> = ({ cartItems, totalPrice, onBack, onOrderSuccess }) => {
  const { activePaymentMethods } = usePaymentMethods();
  const { createOrder } = useOrders();
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('dine-in');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pickupTime, setPickupTime] = useState('10-15');
  const [customTime, setCustomTime] = useState('');
  const [notes, setNotes] = useState('');

  // Placed Order state & Modal Pop-up
  const [placedOrder, setPlacedOrder] = useState<AdminOrder | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // GCash / E-Wallet verification fields
  const [gcashAccountName, setGcashAccountName] = useState('');
  const [gcashRefNumber, setGcashRefNumber] = useState('');
  const [paymentFormError, setPaymentFormError] = useState('');

  // Selected payment method ID - Default to GCash so QR code is immediately shown
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(() => {
    const gcash = activePaymentMethods.find(m => m.id === 'payment-gcash' || m.name.toLowerCase().includes('gcash'));
    if (gcash) return gcash.id;
    return activePaymentMethods.length > 0 ? activePaymentMethods[0].id : 'payment-gcash';
  });

  // Keep selectedPaymentId valid if active methods update
  React.useEffect(() => {
    if (activePaymentMethods.length > 0 && !activePaymentMethods.some(m => m.id === selectedPaymentId)) {
      const gcash = activePaymentMethods.find(m => m.id === 'payment-gcash' || m.name.toLowerCase().includes('gcash'));
      setSelectedPaymentId(gcash ? gcash.id : activePaymentMethods[0].id);
    }
  }, [activePaymentMethods, selectedPaymentId]);

  const copyAccountNumber = (acc: string) => {
    try {
      navigator.clipboard.writeText(acc.replace(/\s+/g, ''));
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } catch {}
  };

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const currentMethod = activePaymentMethods.find(m => m.id === selectedPaymentId) || activePaymentMethods[0];
  const isCod = isCodMethod(currentMethod);

  const handleProceedToPayment = () => {
    setStep('payment');
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;

    if (!isCod) {
      if (!gcashAccountName.trim() || !gcashRefNumber.trim()) {
        setPaymentFormError('Required po: Pakilagay ang inyong GCash Account Name/Number at Reference Number bago mag-place ng order.');
        const el = document.getElementById('gcash-verification-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    setPaymentFormError('');
    setIsSubmitting(true);

    const timeInfo = serviceType === 'pickup'
      ? (pickupTime === 'custom' ? customTime : `${pickupTime} minutes`)
      : '';

    const paymentText = isCod
      ? 'Cash on Delivery (COD)'
      : (currentMethod?.name || 'GCash');

    try {
      const order = await createOrder({
        customerName: customerName.trim(),
        contactNumber: contactNumber.trim(),
        serviceType,
        address: serviceType === 'delivery' ? address.trim() : undefined,
        landmark: serviceType === 'delivery' && landmark ? landmark.trim() : undefined,
        pickupTime: timeInfo || undefined,
        paymentMethod: paymentText,
        paymentSenderName: !isCod ? gcashAccountName.trim() : undefined,
        paymentReferenceNumber: !isCod ? gcashRefNumber.trim() : undefined,
        total: totalPrice,
        items: cartItems,
        notes: notes ? notes.trim() : undefined
      });

      setPlacedOrder(order);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Failed to submit order:', err);
      alert('May problemang naganap habang sine-save ang order. Subukan muli.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishOrder = React.useCallback(() => {
    setShowSuccessModal(false);
    if (onOrderSuccess) {
      onOrderSuccess();
    } else {
      onBack();
    }
  }, [onOrderSuccess, onBack]);

  // Automatic redirect countdown to main page when order succeeds
  React.useEffect(() => {
    if (!showSuccessModal) return;
    setCountdown(4);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishOrder();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showSuccessModal, handleFinishOrder]);

  const isDetailsValid = Boolean(
    customerName.trim() &&
    contactNumber.trim() &&
    (serviceType !== 'delivery' || address.trim()) &&
    (serviceType !== 'pickup' || (pickupTime !== 'custom' || customTime.trim()))
  );

  if (step === 'details') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center space-x-2 text-zinc-600 hover:text-black transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-semibold">Back to Cart</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 ml-6">Order Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-zinc-200">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6 max-h-[420px] overflow-y-auto pr-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5 border-b border-zinc-100">
                  <div>
                    <h4 className="font-bold text-zinc-900">{item.name}</h4>
                    {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                      <p className="text-xs text-zinc-500">
                        Add-ons: {item.selectedAddOns.map(addOn => addOn.name).join(', ')}
                      </p>
                    )}
                    <p className="text-xs text-zinc-500">₱{item.totalPrice} x {item.quantity}</p>
                  </div>
                  <span className="font-bold text-zinc-900">₱{item.totalPrice * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-amber-400 pt-4">
              <div className="flex items-center justify-between text-2xl font-black text-zinc-900">
                <span>Total:</span>
                <span className="text-amber-600">₱{totalPrice}</span>
              </div>
            </div>
          </div>

          {/* Customer Details Form */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-zinc-200">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-6">Customer Information</h2>

            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); if (isDetailsValid) handleProceedToPayment(); }}>
              {/* Full Name */}
              <div>
                <label className="block text-sm font-bold text-zinc-800 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-sm font-bold text-zinc-800 mb-1.5">Contact Number *</label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  placeholder="09XX XXX XXXX"
                  required
                />
              </div>

              {/* Service Type Selection */}
              <div>
                <label className="block text-sm font-bold text-zinc-800 mb-2">Service Type *</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { value: 'dine-in', label: 'Dine In', icon: '🍽️' },
                    { value: 'pickup', label: 'Pickup', icon: '🥡' },
                    { value: 'delivery', label: 'Delivery', icon: '🛵' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setServiceType(option.value as ServiceType)}
                      className={`p-3.5 rounded-xl border-2 transition-all duration-200 text-center active:scale-95 ${serviceType === option.value
                        ? 'border-amber-500 bg-amber-500 text-white shadow-md'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-amber-400'
                        }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-xs sm:text-sm font-bold">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dine-in Notice */}
              {serviceType === 'dine-in' && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-sm text-amber-900">
                  <p className="font-bold">🍽️ Dine-In Order</p>
                  <p className="text-xs text-amber-800 mt-1">
                    Direct pasok ang order sa kusina. Pagkarating mo sa restaurant, nakapila na ito at agad ihahain!
                  </p>
                </div>
              )}

              {/* Pickup Time Selection */}
              {serviceType === 'pickup' && (
                <div>
                  <label className="block text-sm font-bold text-zinc-800 mb-2">Pickup Time *</label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { value: '10-15', label: '10-15 mins' },
                        { value: '20-25', label: '20-25 mins' },
                        { value: '30-40', label: '30-40 mins' },
                        { value: 'custom', label: 'Custom Time' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setPickupTime(option.value)}
                          className={`p-2.5 rounded-xl border-2 transition-all duration-200 text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 ${pickupTime === option.value
                            ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-amber-400'
                            }`}
                        >
                          <Clock className="h-4 w-4" />
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>

                    {pickupTime === 'custom' && (
                      <input
                        type="text"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                        placeholder="e.g. 45 mins, 1:30 PM"
                        required
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              {serviceType === 'delivery' && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-zinc-800 mb-1.5">Delivery Address *</label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                      placeholder="House/Unit #, Street, Barangay, City"
                      rows={2}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-800 mb-1.5">Landmark (Optional)</label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                      placeholder="Nearby school, church, store, etc."
                    />
                  </div>
                </>
              )}

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-bold text-zinc-800 mb-1.5">Special Requests (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g. Extra spicy, separate sauce, please call on arrival..."
                  rows={2}
                />
              </div>

              <button
                type="button"
                onClick={handleProceedToPayment}
                disabled={!isDetailsValid}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 transform ${isDetailsValid
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white hover:shadow-xl hover:scale-[1.01] active:scale-95'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  }`}
              >
                Proceed to Payment
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Payment Step
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-8">
        <button
          type="button"
          onClick={() => setStep('details')}
          className="flex items-center space-x-2 text-zinc-600 hover:text-black transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-semibold">Back to Details</span>
        </button>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 ml-6">Payment & Confirmation</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Methods Selection & Info Column */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-zinc-200 space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Choose Payment Method</h2>

          {/* Payment Method Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activePaymentMethods.map((method) => {
              const isMethodCod = isCodMethod(method);
              const isSelected = method.id === selectedPaymentId;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedPaymentId(method.id)}
                  className={`p-3.5 rounded-xl border-2 transition-all flex items-center space-x-3 text-left ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50 shadow-md ring-2 ring-amber-400/30'
                      : 'border-zinc-200 hover:border-zinc-300 bg-white'
                  }`}
                >
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    isMethodCod ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {isMethodCod ? <Banknote className="w-5 h-5" /> : <QrCode className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-zinc-900 truncate">{method.name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {isMethodCod ? 'Pay upon receiving' : (method.account_number || 'Scan QR Code')}
                    </p>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Selected Method Display Details */}
          {isCod ? (
            <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-sm">
                  💵
                </div>
                <div>
                  <h3 className="font-black text-amber-950 text-sm">Cash on Delivery (COD)</h3>
                  <p className="text-xs text-amber-800">Magbayad pagkatanggap ng inyong order</p>
                </div>
              </div>
              <span className="font-black text-amber-700 text-base">₱{totalPrice}</span>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-blue-400 shadow-md space-y-4">
              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <div 
                  onClick={() => setShowQrModal(true)}
                  className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl border-4 border-blue-500 shadow-xl overflow-hidden bg-white p-2.5 flex items-center justify-center cursor-pointer group"
                  title="Click to view full QR Code"
                >
                  <img
                    src={(currentMethod?.qr_code_url && currentMethod.qr_code_url.trim()) || '/images/payment-qr/gcash-qr-code.jpg'}
                    alt={`${currentMethod?.name || 'Payment'} QR Code`}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      if (e.currentTarget.src.includes('/images/payment-qr/gcash-qr-code.jpg')) {
                        e.currentTarget.src = '/gcash-qr-code.jpg';
                      } else {
                        e.currentTarget.src = '/images/payment-qr/gcash-qr-code.jpg';
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-black/80 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center space-x-1 shadow">
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span>Click to Enlarge</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 py-1 px-3 rounded-lg hover:bg-blue-50 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Full QR Code 🔍</span>
                </button>
              </div>

              {/* Account Details with Copy Button */}
              <div className="bg-zinc-50 rounded-xl p-3.5 space-y-2 text-xs sm:text-sm border border-zinc-200">
                <div className="flex justify-between items-center py-1 border-b border-zinc-200">
                  <span className="text-zinc-500 font-medium">Account Number:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-zinc-900 text-sm sm:text-base">
                      {currentMethod?.account_number || '0905 293 1408'}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyAccountNumber(currentMethod?.account_number || '0905 293 1408')}
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                      title="Copy Account Number"
                    >
                      {copiedAccount ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {copiedAccount && (
                  <p className="text-[11px] text-emerald-600 font-bold text-right -mt-1">
                    Copied to clipboard!
                  </p>
                )}
                <div className="flex justify-between items-center py-1 border-b border-zinc-200">
                  <span className="text-zinc-500 font-medium">Account Name:</span>
                  <span className="font-bold text-zinc-900">
                    {currentMethod?.account_name || 'Afoodable Bites'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-zinc-500 font-medium">Amount to Pay:</span>
                  <span className="font-black text-amber-600 text-sm sm:text-base">
                    ₱{totalPrice}
                  </span>
                </div>
              </div>

              {/* REQUIRED GCASH / E-WALLET VERIFICATION SECTION */}
              <div id="gcash-verification-section" className="bg-amber-50/90 border-2 border-amber-300 rounded-xl p-3.5 sm:p-4 space-y-3 shadow-sm">
                <div className="flex items-center space-x-1.5 text-amber-950 font-bold text-xs sm:text-sm">
                  <span className="text-base">📝</span>
                  <span>Required: GCash / Sender Payment Details</span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  I-scan o i-send ang payment sa QR code sa itaas, at ilagay dito ang inyong GCash Account at Reference Number mula sa inyong GCash receipt:
                </p>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                    Your GCash Account Name / Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={gcashAccountName}
                    onChange={(e) => {
                      setGcashAccountName(e.target.value);
                      if (paymentFormError) setPaymentFormError('');
                    }}
                    placeholder="e.g. Juan Dela Cruz / 0917 123 4567"
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-zinc-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                    GCash Reference Number (Ref No.) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={gcashRefNumber}
                    onChange={(e) => {
                      setGcashRefNumber(e.target.value);
                      if (paymentFormError) setPaymentFormError('');
                    }}
                    placeholder="e.g. 1002 9384 1928"
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-zinc-900 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                {paymentFormError && (
                  <p className="text-xs font-bold text-red-600 bg-red-100 border border-red-200 rounded-lg p-2.5 flex items-center space-x-1.5">
                    <span>⚠️</span>
                    <span>{paymentFormError}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Final Order Review & Direct Order Placement */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-zinc-200">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-6">Final Order Summary</h2>

          <div className="space-y-4 mb-6">
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-sm">
              <h4 className="font-bold text-zinc-900 mb-2">Customer & Service</h4>
              <p className="text-zinc-700"><span className="text-zinc-500">Name:</span> {customerName}</p>
              <p className="text-zinc-700"><span className="text-zinc-500">Contact:</span> {contactNumber}</p>
              <p className="text-zinc-700">
                <span className="text-zinc-500">Service:</span> {serviceType === 'dine-in' ? 'Dine In' : serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}
              </p>
              {serviceType === 'delivery' && (
                <>
                  <p className="text-zinc-700"><span className="text-zinc-500">Address:</span> {address}</p>
                  {landmark && <p className="text-zinc-700"><span className="text-zinc-500">Landmark:</span> {landmark}</p>}
                </>
              )}
              {serviceType === 'pickup' && (
                <p className="text-zinc-700">
                  <span className="text-zinc-500">Pickup Time:</span> {pickupTime === 'custom' ? customTime : `${pickupTime} minutes`}
                </p>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-amber-200/50 mt-1">
                <p className="text-zinc-700">
                  <span className="text-zinc-500">Payment:</span> <strong className="text-zinc-900">{currentMethod?.name}</strong>
                </p>
                {!isCod && (
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg flex items-center space-x-1 transition shadow-sm"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View QR Code</span>
                  </button>
                )}
              </div>
              {!isCod && (
                <div className="pt-2 border-t border-amber-200/50 mt-1 space-y-1 text-xs">
                  <p className="text-zinc-700">
                    <span className="text-zinc-500">Sender Account:</span>{' '}
                    <strong className={gcashAccountName ? 'text-zinc-900' : 'text-red-500 italic'}>
                      {gcashAccountName || 'Hindi pa nailagay (Required)'}
                    </strong>
                  </p>
                  <p className="text-zinc-700">
                    <span className="text-zinc-500">GCash Ref No:</span>{' '}
                    <strong className={gcashRefNumber ? 'font-mono text-zinc-900 font-bold' : 'text-red-500 italic'}>
                      {gcashRefNumber || 'Hindi pa nailagay (Required)'}
                    </strong>
                  </p>
                </div>
              )}
            </div>

            <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 py-2 border-b border-zinc-100">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-zinc-900 text-sm truncate">{item.name}</h4>
                    {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                      <p className="text-xs text-zinc-500">
                        + {item.selectedAddOns.map(addOn => addOn.name).join(', ')}
                      </p>
                    )}
                    <p className="text-xs text-zinc-500">₱{item.totalPrice} x {item.quantity}</p>
                  </div>
                  <span className="font-bold text-zinc-900 text-sm">₱{item.totalPrice * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t-2 border-amber-400 pt-4 mb-6">
            <div className="flex items-center justify-between text-2xl font-black text-zinc-900">
              <span>Total:</span>
              <span className="text-amber-600">₱{totalPrice}</span>
            </div>
          </div>

          {!isCod && (!gcashAccountName.trim() || !gcashRefNumber.trim()) && (
            <div className="bg-amber-100 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 font-semibold mb-3 flex items-center space-x-2">
              <span className="text-base">⚠️</span>
              <span>Kailangan ilagay ang inyong GCash Account Name & Ref Number bago mag-submit.</span>
            </div>
          )}

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl font-black text-lg transition-all duration-200 transform bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white hover:shadow-xl hover:scale-[1.01] active:scale-95 flex items-center justify-center space-x-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting Order...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <Flame className="w-5 h-5 animate-pulse" />
                <span>Confirm & Place Order 🔥</span>
              </span>
            )}
          </button>

          <p className="text-xs text-zinc-500 text-center mt-3">
            Papasok agad ang order sa aming kitchen at admin dashboard. Makakatanggap kayo ng confirmation pop-up!
          </p>
        </div>
      </div>

      {/* POP-UP MESSAGE: ORDER SENT MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border-2 border-amber-400 text-center relative overflow-hidden animate-scale-up">
            {/* Top decorative banner */}
            <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />

            {/* Glowing Success Badge */}
            <div className="w-20 h-20 mx-auto my-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 p-1 shadow-xl flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <span className="text-4xl animate-bounce">🎉</span>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight my-4">
              Congrats, your order is sent!
            </h2>

            {/* Back to Main Button */}
            <button
              type="button"
              onClick={handleFinishOrder}
              className="w-full mt-2 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white rounded-xl font-black text-sm sm:text-base hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md flex items-center justify-center space-x-2"
            >
              <span>Bumalik sa Main Page</span>
              <span>🏠</span>
            </button>
          </div>
        </div>
      )}

      {/* POP-UP MODAL: ENLARGED VIEW QR CODE (QR CODE ONLY) */}
      {showQrModal && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowQrModal(false)}
        >
          <div 
            className="bg-white rounded-3xl p-4 sm:p-6 shadow-2xl border-2 border-blue-400 text-center relative max-w-sm w-full animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Code Image Only */}
            <div className="w-full aspect-square max-w-[280px] sm:max-w-[320px] mx-auto rounded-2xl border-4 border-blue-500 shadow-xl overflow-hidden bg-white p-2 flex items-center justify-center">
              <img
                src={(currentMethod?.qr_code_url && currentMethod.qr_code_url.trim()) || '/images/payment-qr/gcash-qr-code.jpg'}
                alt={`${currentMethod?.name || 'Payment'} QR Code`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  if (e.currentTarget.src.includes('/images/payment-qr/gcash-qr-code.jpg')) {
                    e.currentTarget.src = '/gcash-qr-code.jpg';
                  } else {
                    e.currentTarget.src = '/images/payment-qr/gcash-qr-code.jpg';
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
