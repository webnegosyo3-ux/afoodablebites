import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { AdminOrder } from '../types';

interface OrderReceiptProps {
  order: AdminOrder;
  storeName?: string;
  storeLogo?: string;
  showPhotoReminder?: boolean;
  showCopyButton?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
};

const serviceLabel = (s: string) => {
  if (s === 'dine-in') return '🍽️ Dine-In';
  if (s === 'pickup') return '🥡 Pickup';
  return '🛵 Delivery';
};

export const buildTextReceipt = (order: AdminOrder, storeName = 'Afoodable Bites'): string => {
  const divider = '━━━━━━━━━━━━━━━━━━━━━━━━━';
  const lines: string[] = [
    `🧾 ${storeName.toUpperCase()}`,
    `   Always Serving Hot! 🔥`,
    divider,
    `Order ID : ${order.id}`,
    `Date     : ${formatDate(order.createdAt)}`,
    `Status   : ${order.status.toUpperCase()}`,
    divider,
    `Customer : ${order.customerName}`,
    `Contact  : ${order.contactNumber}`,
    `Service  : ${serviceLabel(order.serviceType).replace(/[^\x00-\x7F]/g, '').trim()}`,
  ];

  if (order.serviceType === 'delivery' && order.address) {
    lines.push(`Address  : ${order.address}`);
    if (order.landmark) lines.push(`Landmark : ${order.landmark}`);
  }
  if (order.serviceType === 'pickup' && order.pickupTime) {
    lines.push(`Pickup   : ${order.pickupTime}`);
  }

  lines.push(divider);
  lines.push('ITEMS ORDERED:');

  order.items.forEach((item) => {
    lines.push(`  ${item.quantity}x ${item.name}  —  ₱${item.totalPrice * item.quantity}`);
    if (item.selectedVariation) lines.push(`     Variation: ${item.selectedVariation.name}`);
    if (item.selectedVariations?.length) lines.push(`     Flavors: ${item.selectedVariations.map(v => v.name).join(' + ')}`);
    if (item.selectedAddOns?.length) lines.push(`     Add-ons: ${item.selectedAddOns.map(a => `${a.name}${a.quantity && a.quantity > 1 ? ` x${a.quantity}` : ''}`).join(', ')}`);
  });

  lines.push(divider);
  lines.push(`TOTAL    : ₱${order.total}`);
  lines.push(divider);
  lines.push(`Payment  : ${order.paymentMethod}`);
  if (order.paymentSenderName) lines.push(`Sender   : ${order.paymentSenderName}`);
  if (order.paymentReferenceNumber) lines.push(`Ref No.  : ${order.paymentReferenceNumber}`);
  if (order.notes) { lines.push(divider); lines.push(`Note     : ${order.notes}`); }
  lines.push(divider);
  lines.push(`Thank you for ordering from ${storeName}! 🙏`);

  return lines.join('\n');
};

// ── Component ─────────────────────────────────────────────────────────────────

const OrderReceipt: React.FC<OrderReceiptProps> = ({
  order,
  storeName = 'Afoodable Bites',
  storeLogo = '/images/afodable-bites-logo.jpg',
  showPhotoReminder = false,
  showCopyButton = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = buildTextReceipt(order, storeName);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="w-full space-y-3">

      {/* ── Receipt card ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">

        {/* Store header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-100">
          <div className="flex items-center space-x-2.5">
            <img
              src={storeLogo}
              alt={storeName}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              onError={(e) => { e.currentTarget.src = '/logo.jpg'; }}
            />
            <div>
              <p className="font-black text-zinc-900 text-sm leading-none">{storeName}</p>
              <p className="text-zinc-400 text-[11px] mt-0.5">Always Serving Hot! 🔥</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Order Receipt</p>
            <p className="font-black text-amber-500 text-base tracking-wider">{order.id}</p>
          </div>
        </div>

        {/* Order meta */}
        <div className="px-5 py-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs border-b border-zinc-100">
          <div>
            <p className="text-zinc-400">Date</p>
            <p className="font-semibold text-zinc-800">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-zinc-400">Status</p>
            <p className={`font-black uppercase ${
              order.status === 'pending'   ? 'text-amber-500' :
              order.status === 'preparing' ? 'text-blue-500'  :
              order.status === 'completed' ? 'text-emerald-500' : 'text-red-500'
            }`}>{order.status}</p>
          </div>
          <div>
            <p className="text-zinc-400">Customer</p>
            <p className="font-semibold text-zinc-800">{order.customerName}</p>
          </div>
          <div>
            <p className="text-zinc-400">Contact</p>
            <p className="font-semibold text-zinc-800">{order.contactNumber}</p>
          </div>
          <div className="col-span-2">
            <p className="text-zinc-400">Service</p>
            <p className="font-semibold text-zinc-800">{serviceLabel(order.serviceType)}</p>
          </div>
          {order.serviceType === 'delivery' && order.address && (
            <div className="col-span-2">
              <p className="text-zinc-400">Address</p>
              <p className="font-semibold text-zinc-800">{order.address}{order.landmark ? ` (${order.landmark})` : ''}</p>
            </div>
          )}
          {order.serviceType === 'pickup' && order.pickupTime && (
            <div className="col-span-2">
              <p className="text-zinc-400">Pickup Time</p>
              <p className="font-semibold text-zinc-800">{order.pickupTime}</p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="px-5 py-3 space-y-2 border-b border-zinc-100">
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold text-center">Items Ordered</p>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between text-xs">
              <div className="flex-1 min-w-0 pr-3">
                <p className="font-semibold text-zinc-900">
                  <span className="text-amber-500">{item.quantity}×</span> {item.name}
                </p>
                {item.selectedVariation && <p className="text-zinc-400 pl-3">↳ {item.selectedVariation.name}</p>}
                {item.selectedVariations && item.selectedVariations.length > 0 && (
                  <p className="text-zinc-400 pl-3">↳ {item.selectedVariations.map(v => v.name).join(' + ')}</p>
                )}
                {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                  <p className="text-zinc-400 pl-3">+ {item.selectedAddOns.map(a => a.name).join(', ')}</p>
                )}
                <p className="text-zinc-300 pl-3 text-[11px]">₱{item.totalPrice} × {item.quantity}</p>
              </div>
              <span className="font-bold text-zinc-800 flex-shrink-0">₱{item.totalPrice * item.quantity}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-zinc-100">
          <span className="text-sm font-black text-zinc-700 uppercase tracking-wide">Total Amount</span>
          <span className="text-lg font-black text-amber-500">₱{order.total}</span>
        </div>

        {/* Payment */}
        <div className="px-5 py-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-400">Payment</span>
            <span className="font-semibold text-zinc-800">{order.paymentMethod}</span>
          </div>
          {order.paymentSenderName && (
            <div className="flex justify-between">
              <span className="text-zinc-400">GCash Sender</span>
              <span className="font-semibold text-zinc-800">{order.paymentSenderName}</span>
            </div>
          )}
          {order.paymentReferenceNumber && (
            <div className="flex justify-between">
              <span className="text-zinc-400">Ref No.</span>
              <span className="font-bold text-amber-600 font-mono">{order.paymentReferenceNumber}</span>
            </div>
          )}
          {order.notes && (
            <div className="pt-1 border-t border-zinc-100">
              <span className="text-zinc-400">Note: </span>
              <span className="italic text-zinc-600">"{order.notes}"</span>
            </div>
          )}
        </div>

      </div>

      {/* ── Photo reminder ────────────────────────────────────────────────── */}
      {showPhotoReminder && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start space-x-2.5">
          <span className="text-xl flex-shrink-0">📸</span>
          <div>
            <p className="font-bold text-amber-900 text-sm">I-screenshot ang inyong receipt!</p>
            <p className="text-amber-700 text-xs mt-0.5">
              Kumuha ng screenshot bago umalis sa page na ito para sa inyong rekord.
            </p>
          </div>
        </div>
      )}

      {/* ── Copy as text ──────────────────────────────────────────────────── */}
      {showCopyButton && (
        <button
          type="button"
          onClick={handleCopy}
          className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all border ${
            copied
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          {copied
            ? <><Check className="w-4 h-4" /><span>Copied!</span></>
            : <><Copy className="w-4 h-4" /><span>Copy Receipt as Text</span></>
          }
        </button>
      )}

    </div>
  );
};

export default OrderReceipt;
