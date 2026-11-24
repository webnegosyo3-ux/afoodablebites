import React, { useRef, useState } from 'react';
import { Copy, Check, Printer } from 'lucide-react';
import { AdminOrder } from '../types';

interface OrderReceiptProps {
  order: AdminOrder;
  storeName?: string;
  storeLogo?: string;
  /** If true, shows the "📸 Take a photo" reminder below the receipt */
  showPhotoReminder?: boolean;
  /** If true, shows the copy-as-text button */
  showCopyButton?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

/** Generates a plain-text receipt string for copying / sharing */
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
    const itemTotal = item.totalPrice * item.quantity;
    lines.push(`  ${item.quantity}x ${item.name}  —  ₱${itemTotal}`);
    if (item.selectedVariation) {
      lines.push(`     Variation: ${item.selectedVariation.name}`);
    }
    if (item.selectedVariations && item.selectedVariations.length > 0) {
      lines.push(`     Flavors: ${item.selectedVariations.map(v => v.name).join(' + ')}`);
    }
    if (item.selectedAddOns && item.selectedAddOns.length > 0) {
      lines.push(`     Add-ons: ${item.selectedAddOns.map(a => `${a.name}${a.quantity && a.quantity > 1 ? ` x${a.quantity}` : ''}`).join(', ')}`);
    }
  });

  lines.push(divider);
  lines.push(`TOTAL    : ₱${order.total}`);
  lines.push(divider);
  lines.push(`Payment  : ${order.paymentMethod}`);

  if (order.paymentSenderName) {
    lines.push(`Sender   : ${order.paymentSenderName}`);
  }
  if (order.paymentReferenceNumber) {
    lines.push(`Ref No.  : ${order.paymentReferenceNumber}`);
  }

  if (order.notes) {
    lines.push(divider);
    lines.push(`Note     : ${order.notes}`);
  }

  lines.push(divider);
  lines.push(`Thank you for ordering from ${storeName}! 🙏`);
  lines.push(`We'll prepare your order right away. 🔥`);

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
      // Fallback for older browsers
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
    <div className="w-full">
      {/* ── Receipt Card ─────────────────────────────────────────────────── */}
      <div
        id={`receipt-${order.id}`}
        className="bg-white rounded-2xl border-2 border-dashed border-amber-300 overflow-hidden shadow-lg font-mono select-text"
      >
        {/* Header gradient bar */}
        <div className="h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />

        {/* Store branding */}
        <div className="bg-zinc-900 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={storeLogo}
              alt={storeName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400/60 flex-shrink-0"
              onError={(e) => { e.currentTarget.src = '/logo.jpg'; }}
            />
            <div>
              <p className="text-amber-400 font-black text-sm tracking-tight leading-none">{storeName.toUpperCase()}</p>
              <p className="text-zinc-400 text-[10px] font-medium mt-0.5">Always Serving Hot! 🔥</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Order Receipt</p>
            <p className="text-amber-400 font-black text-base tracking-widest">{order.id}</p>
          </div>
        </div>

        {/* Order meta */}
        <div className="bg-amber-50 border-b border-dashed border-amber-200 px-5 py-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div>
            <span className="text-zinc-500">Date</span>
            <p className="font-bold text-zinc-800">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <span className="text-zinc-500">Status</span>
            <p className={`font-black uppercase text-sm ${
              order.status === 'pending' ? 'text-amber-600' :
              order.status === 'preparing' ? 'text-blue-600' :
              order.status === 'completed' ? 'text-emerald-600' :
              'text-red-500'
            }`}>{order.status}</p>
          </div>
          <div>
            <span className="text-zinc-500">Customer</span>
            <p className="font-bold text-zinc-800">{order.customerName}</p>
          </div>
          <div>
            <span className="text-zinc-500">Contact</span>
            <p className="font-bold text-zinc-800">{order.contactNumber}</p>
          </div>
          <div className="col-span-2">
            <span className="text-zinc-500">Service</span>
            <p className="font-bold text-zinc-800">{serviceLabel(order.serviceType)}</p>
          </div>
          {order.serviceType === 'delivery' && order.address && (
            <div className="col-span-2">
              <span className="text-zinc-500">Address</span>
              <p className="font-bold text-zinc-800">{order.address}{order.landmark ? ` (${order.landmark})` : ''}</p>
            </div>
          )}
          {order.serviceType === 'pickup' && order.pickupTime && (
            <div className="col-span-2">
              <span className="text-zinc-500">Pickup Time</span>
              <p className="font-bold text-zinc-800">{order.pickupTime}</p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="px-5 py-2 flex items-center space-x-2">
          <div className="flex-1 border-t border-dashed border-zinc-300" />
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Items Ordered</span>
          <div className="flex-1 border-t border-dashed border-zinc-300" />
        </div>

        {/* Items */}
        <div className="px-5 pb-2 space-y-2.5">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between text-xs">
              <div className="flex-1 min-w-0 pr-3">
                <p className="font-black text-zinc-900">
                  <span className="text-amber-600 font-black">{item.quantity}×</span> {item.name}
                </p>
                {item.selectedVariation && (
                  <p className="text-zinc-500 pl-4">↳ {item.selectedVariation.name}</p>
                )}
                {item.selectedVariations && item.selectedVariations.length > 0 && (
                  <p className="text-zinc-500 pl-4">↳ {item.selectedVariations.map(v => v.name).join(' + ')}</p>
                )}
                {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                  <p className="text-zinc-500 pl-4">
                    + {item.selectedAddOns.map(a => `${a.name}${a.quantity && a.quantity > 1 ? ` ×${a.quantity}` : ''}`).join(', ')}
                  </p>
                )}
                <p className="text-zinc-400 pl-4 text-[11px]">₱{item.totalPrice} × {item.quantity}</p>
              </div>
              <span className="font-black text-zinc-900 flex-shrink-0">₱{item.totalPrice * item.quantity}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mx-5 my-3 border-t-2 border-dashed border-zinc-300 pt-3 flex items-center justify-between">
          <span className="text-sm font-black text-zinc-700 uppercase tracking-wider">Total Amount</span>
          <span className="text-xl font-black text-amber-600">₱{order.total}</span>
        </div>

        {/* Payment info */}
        <div className="bg-zinc-50 border-t border-dashed border-zinc-200 px-5 py-3 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500">Payment</span>
            <span className="font-bold text-zinc-800">{order.paymentMethod}</span>
          </div>
          {order.paymentSenderName && (
            <div className="flex justify-between">
              <span className="text-zinc-500">GCash Sender</span>
              <span className="font-bold text-zinc-800">{order.paymentSenderName}</span>
            </div>
          )}
          {order.paymentReferenceNumber && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Ref No.</span>
              <span className="font-black text-amber-700 font-mono tracking-wider">{order.paymentReferenceNumber}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-amber-50 border-t border-dashed border-amber-200 px-5 py-2.5 text-xs">
            <span className="text-zinc-500">Special Request: </span>
            <span className="italic text-zinc-700">"{order.notes}"</span>
          </div>
        )}

        {/* Footer */}
        <div className="bg-zinc-900 px-5 py-3 text-center space-y-0.5">
          <p className="text-amber-400 font-black text-xs tracking-wide">🙏 Salamat sa inyong order!</p>
          <p className="text-zinc-500 text-[10px]">We'll prepare your order right away 🔥</p>
          <p className="text-zinc-600 text-[9px] font-mono pt-1">{order.id} · {formatDate(order.createdAt)}</p>
        </div>

        {/* Bottom gradient bar */}
        <div className="h-2 bg-gradient-to-r from-red-500 via-orange-500 to-amber-400" />
      </div>

      {/* ── Copy as text button ───────────────────────────────────────────── */}
      {showCopyButton && (
        <button
          type="button"
          onClick={handleCopy}
          className={`mt-3 w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all border ${
            copied
              ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
              : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'
          }`}
        >
          {copied
            ? <><Check className="w-4 h-4 text-emerald-600" /><span>Copied to clipboard!</span></>
            : <><Copy className="w-4 h-4" /><span>Copy Receipt as Text</span></>
          }
        </button>
      )}

      {/* ── Photo reminder ────────────────────────────────────────────────── */}
      {showPhotoReminder && (
        <div className="mt-3 bg-amber-50 border-2 border-amber-300 rounded-2xl px-4 py-3.5 flex items-start space-x-3 shadow-sm">
          <span className="text-2xl flex-shrink-0">📸</span>
          <div>
            <p className="font-black text-amber-900 text-sm leading-tight">
              I-screenshot ang inyong receipt!
            </p>
            <p className="text-amber-800 text-xs mt-0.5 leading-relaxed">
              Kumuha ng screenshot o litrato ng receipt na ito para sa inyong rekord.
              Ipakita ito sa aming staff kapag pumunta na kayo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderReceipt;
