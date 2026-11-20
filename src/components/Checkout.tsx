import React, { useState } from 'react';
import { ArrowLeft, Clock, CreditCard, Banknote, CheckCircle2 } from 'lucide-react';
import { CartItem, ServiceType } from '../types';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useOrders } from '../hooks/useOrders';

interface CheckoutProps {
  cartItems: CartItem[];
  totalPrice: number;
  onBack: () => void;
}

const FB_PAGE_MESSENGER_ID = '61595737646110';

const Checkout: React.FC<CheckoutProps> = ({ cartItems, totalPrice, onBack }) => {
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

  // Selected payment method ID
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(() => {
    return activePaymentMethods.length > 0 ? activePaymentMethods[0].id : 'payment-gcash';
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

  const handlePlaceOrder = () => {
    const timeInfo = serviceType === 'pickup'
      ? (pickupTime === 'custom' ? customTime : `${pickupTime} minutes`)
      : '';

    const serviceName = serviceType === 'dine-in'
      ? 'Dine In'
      : serviceType.charAt(0).toUpperCase() + serviceType.slice(1);

    const paymentText = isCod
      ? 'Cash on Delivery (COD) / Pay at Counter (No advance payment)'
      : `${currentMethod?.name || 'GCash'} (Payment Screenshot Attached)`;

    const orderDetails = `
AFOODABLE BITES ORDER 🍲

Customer: ${customerName}
Contact: ${contactNumber}
Service Type: ${serviceName}
${serviceType === 'delivery' ? `Address: ${address}${landmark ? `\nLandmark: ${landmark}` : ''}` : ''}
${serviceType === 'pickup' ? `Estimated Pickup Time: ${timeInfo}` : ''}

ORDER DETAILS:
${cartItems.map(item => {
      let itemDetails = `- ${item.name}`;
      if (item.selectedVariations && item.selectedVariations.length > 0) {
        itemDetails += ` (${item.selectedVariations.map(v => v.name).join(' + ')})`;
      } else if (item.selectedVariation) {
        itemDetails += ` (${item.selectedVariation.name})`;
      }
      if (item.selectedAddOns && item.selectedAddOns.length > 0) {
        itemDetails += ` + ${item.selectedAddOns.map(addOn =>
          addOn.quantity && addOn.quantity > 1
            ? `${addOn.name} x${addOn.quantity}`
            : addOn.name
        ).join(', ')}`;
      }
      itemDetails += ` x${item.quantity} - ₱${item.totalPrice * item.quantity}`;
      return itemDetails;
    }).join('\n')}

TOTAL: ₱${totalPrice}

Payment Method: ${paymentText}

${notes ? `Special Notes: ${notes}` : ''}

Please confirm this order to proceed. Thank you for dining with Afoodable Bites! Always Serving Hot! 🔥
    `.trim();

    const encodedMessage = encodeURIComponent(orderDetails);
    const messengerUrl = `https://m.me/${FB_PAGE_MESSENGER_ID}?text=${encodedMessage}`;

    // Record order in Admin Dashboard & Database
    try {
      createOrder({
        customerName,
        contactNumber,
        serviceType,
        address: serviceType === 'delivery' ? address : undefined,
        landmark: serviceType === 'delivery' ? landmark : undefined,
        pickupTime: timeInfo || undefined,
        paymentMethod: isCod ? 'Cash on Delivery (COD)' : (currentMethod?.name || 'GCash'),
        total: totalPrice,
        items: cartItems,
        notes: notes || undefined
      });
    } catch (err) {
      console.warn('Could not save order record:', err);
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = messengerUrl;
    } else {
      window.open(messengerUrl, '_blank');
    }
  };

  const isDetailsValid = Boolean(
    customerName &&
    contactNumber &&
    (serviceType !== 'delivery' || address) &&
    (serviceType !== 'pickup' || (pickupTime !== 'custom' || customTime))
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
                    Just complete your order and show your payment details at the counter when you arrive. Table seating is open and ready!
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
                      placeholder="Nearby school, church, mall, etc."
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
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 ml-6">Payment</h1>
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
            /* Cash on Delivery Details Box */
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-300 text-zinc-900">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center shadow">
                  <Banknote className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-950 text-lg">Cash on Delivery / Counter</h3>
                  <p className="text-xs text-amber-800">No advance payment required</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-amber-100 text-center">
                <p className="text-sm font-semibold text-zinc-600">Total Cash to Prepare:</p>
                <p className="text-3xl font-black text-amber-600 my-1">₱{totalPrice}</p>
                <p className="text-xs text-zinc-500">
                  Please prepare exact amount if possible upon {serviceType === 'delivery' ? 'rider arrival' : 'pickup / dining'}
                </p>
              </div>

              <div className="bg-amber-100/70 rounded-xl p-4 text-xs sm:text-sm text-amber-900 space-y-1.5">
                <p className="font-bold flex items-center space-x-1">
                  <span>✅</span>
                  <span>Instant Confirmation</span>
                </p>
                <p>Your order will be prepared as soon as confirmed via Messenger.</p>
              </div>
            </div>
          ) : (
            /* Digital Wallet (GCash/Maya) Details Box */
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow">
                  <span className="text-white font-black text-xl">
                    {currentMethod?.name.charAt(0) || 'G'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 text-lg">{currentMethod?.name || 'GCash Payment'}</h3>
                  <p className="text-xs text-blue-700">QR Code Scanning & Transfer</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 mb-4 shadow-inner">
                <p className="text-xl font-black text-zinc-900 mb-4 text-center">
                  Amount to Pay: <span className="text-blue-600">₱{totalPrice}</span>
                </p>

                {/* QR Code */}
                {currentMethod?.qr_code_url && (
                  <div className="flex justify-center mb-4">
                    <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-xl border-4 border-blue-500 shadow-xl overflow-hidden bg-white p-3 flex items-center justify-center">
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

              {/* Payment Proof Notice */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mt-4">
                <h4 className="font-bold text-amber-900 mb-1.5 flex items-center text-sm">
                  <span className="text-lg mr-2">📸</span>
                  Screenshot Payment Receipt
                </h4>
                <p className="text-xs text-zinc-700">
                  Attach your transaction screenshot in the Messenger chat so we can verify your payment immediately!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Final Order Review & Messenger Submission */}
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

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
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
            className="w-full py-4 rounded-xl font-black text-lg transition-all duration-200 transform bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white hover:shadow-xl hover:scale-[1.01] active:scale-95 flex items-center justify-center space-x-2 shadow-lg"
          >
            <span>Place Order via Messenger</span>
            <span>💬</span>
          </button>

          <p className="text-xs text-zinc-500 text-center mt-3">
            {isCod 
              ? 'You will be redirected to Facebook Messenger with your order details pre-filled. Pay in cash when your food arrives!'
              : 'You will be redirected to Facebook Messenger with your order summary pre-filled. Please attach your payment screenshot to confirm!'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
