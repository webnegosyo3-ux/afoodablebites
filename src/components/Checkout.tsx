import React, { useState } from 'react';
import { ArrowLeft, Clock, CreditCard, Banknote, CheckCircle2, Flame, Copy, Check } from 'lucide-react';
import { CartItem, ServiceType, AdminOrder } from '../types';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useOrders } from '../hooks/useOrders';

interface CheckoutProps {
  cartItems: CartItem[];
  totalPrice: number;
  onBack: () => void;
  onOrderSuccess?: () => void;
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Selected payment method ID
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(() => {
    return activePaymentMethods.length > 0 ? activePaymentMethods[0].id : 'payment-cod';
  });

  // Keep selectedPaymentId valid if active methods update
  React.useEffect(() => {
    if (activePaymentMethods.length > 0 && !activePaymentMethods.some(m => m.id === selectedPaymentId)) {
      setSelectedPaymentId(activePaymentMethods[0].id);
    }
  }, [activePaymentMethods, selectedPaymentId]);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const currentMethod = activePaymentMethods.find(m => m.id === selectedPaymentId) || activePaymentMethods[0];
  const isCod = currentMethod ? (currentMethod.id === 'payment-cod' || currentMethod.id === 'cod' || currentMethod.name.toLowerCase().includes('cash')) : false;

  const handleProceedToPayment = () => {
    setStep('payment');
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;
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

  const handleFinishOrder = () => {
    setShowSuccessModal(false);
    if (onOrderSuccess) {
      onOrderSuccess();
    } else {
      onBack();
    }
  };

  const copyOrderCode = () => {
    if (!placedOrder) return;
    try {
      navigator.clipboard.writeText(placedOrder.id);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

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
              const isMethodCod = method.id === 'payment-cod' || method.id === 'cod' || method.name.toLowerCase().includes('cash');
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
                    {isMethodCod ? <Banknote className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-zinc-900 truncate">{method.name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {isMethodCod ? 'Pay upon receiving' : method.account_number}
                    </p>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Selected Method Display Details */}
          {isCod ? (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-300 space-y-4 shadow-inner">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center text-2xl shadow-md">
                  💵
                </div>
                <div>
                  <h3 className="font-black text-amber-950 text-base">Cash on Delivery / Pay at Counter</h3>
                  <p className="text-xs text-amber-800 font-semibold">No upfront payment required</p>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-amber-200 text-xs sm:text-sm text-zinc-700 space-y-2">
                <p className="font-bold text-zinc-900">✅ How COD Works:</p>
                <ul className="space-y-1 list-disc list-inside text-zinc-600">
                  <li>Your order goes directly to our kitchen & admin dashboard.</li>
                  <li>We immediately begin cooking your meal fresh and hot!</li>
                  <li>Please prepare exact cash amount of <strong className="text-amber-700 font-black">₱{totalPrice}</strong> upon pickup or delivery.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-200 space-y-4">
              <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
                <h3 className="font-bold text-zinc-900 text-center mb-3">
                  Scan to Pay with {currentMethod?.name || 'GCash'}
                </h3>

                {/* QR Code */}
                {currentMethod?.qr_code_url && (
                  <div className="flex justify-center mb-4">
                    <div className="w-60 h-60 sm:w-64 sm:h-64 rounded-xl border-4 border-blue-500 shadow-xl overflow-hidden bg-white p-3 flex items-center justify-center">
                      <img
                        src={currentMethod.qr_code_url}
                        alt={`${currentMethod.name} QR Code`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = '/images/payment-qr/gcash-qr-code.jpg';
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <p className="text-sm text-blue-900 font-bold mb-1">📱 Scan with your App</p>
                  <p className="text-xs text-zinc-500">or send manually to the number below</p>
                </div>
              </div>

              {/* Account Details */}
              <div className="bg-white rounded-xl p-4 space-y-2 text-sm border border-blue-100">
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-100">
                  <span className="text-zinc-500">Account Number:</span>
                  <span className="font-mono font-bold text-zinc-900">{currentMethod?.account_number || '0905 293 1408'}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-500">Account Name:</span>
                  <span className="font-bold text-zinc-900">{currentMethod?.account_name || 'Afoodable Bites'}</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900">
                <p className="font-semibold">💡 Paalala:</p>
                <p className="text-zinc-600 mt-0.5">I-screenshot o itabi ang resibo para sa mabilisang verification kapag dumating ang inyong pagkain.</p>
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
              <p className="text-zinc-700 pt-1 border-t border-amber-200/50 mt-1">
                <span className="text-zinc-500">Payment:</span> <strong className="text-zinc-900">{currentMethod?.name}</strong>
              </p>
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

      {/* POP-UP MESSAGE: ORDER CONFIRMED MODAL */}
      {showSuccessModal && placedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-amber-400 text-center relative overflow-hidden animate-scale-up">
            {/* Top decorative banner */}
            <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />

            {/* Glowing Success Badge */}
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 p-1 shadow-xl flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <span className="text-4xl animate-bounce">🎉</span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight mb-1">
              Order Confirmed!
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 font-medium mb-5">
              Salamat, <strong className="text-zinc-900">{placedOrder.customerName}</strong>! Natanggap na ang iyong order sa aming kusina.
            </p>

            {/* Order Reference Box */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 mb-5">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-widest block">
                Order Reference No.
              </span>
              <div className="flex items-center justify-center space-x-2 mt-0.5">
                <span className="text-2xl font-black text-amber-600 tracking-wider">
                  #{placedOrder.id}
                </span>
                <button
                  type="button"
                  onClick={copyOrderCode}
                  className="p-1 text-amber-700 hover:text-amber-900 transition"
                  title="Copy reference number"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {copiedCode && <span className="text-[10px] text-emerald-600 font-bold block">Copied to clipboard!</span>}
            </div>

            {/* Order Summary Snapshot */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-left text-xs space-y-1.5 mb-5">
              <div className="flex justify-between py-1 border-b border-zinc-200 font-bold text-zinc-800">
                <span>Service Type:</span>
                <span className="capitalize text-amber-600">{placedOrder.serviceType}</span>
              </div>
              {placedOrder.address && (
                <div className="flex justify-between py-1 border-b border-zinc-200 text-zinc-700">
                  <span>Address:</span>
                  <span className="font-medium text-right max-w-[200px] truncate">{placedOrder.address}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-zinc-200 text-zinc-700">
                <span>Payment:</span>
                <span className="font-semibold">{placedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-200 text-zinc-700">
                <span>Items:</span>
                <span className="font-semibold">{placedOrder.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
              </div>
              <div className="flex justify-between pt-1 text-sm font-black text-zinc-900">
                <span>Total Amount:</span>
                <span className="text-amber-600">₱{placedOrder.total}</span>
              </div>
            </div>

            {/* Cooking Notification */}
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-orange-200 rounded-xl p-3 mb-6">
              <div className="flex items-center justify-center space-x-1.5 text-xs font-bold text-orange-950 mb-1">
                <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                <span>Papasok na sa Kusina & Admin Dashboard!</span>
              </div>
              <p className="text-[11px] text-zinc-600">
                ⏱️ Estimated Preparation: <strong>15 - 25 minutes</strong>. Laging luto at mainit! 🔥
              </p>
            </div>

            {/* Back to Menu / Order More Button */}
            <button
              type="button"
              onClick={handleFinishOrder}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white rounded-xl font-black text-sm sm:text-base hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md flex items-center justify-center space-x-2"
            >
              <span>Back to Menu / Order More</span>
              <span>🍲</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
