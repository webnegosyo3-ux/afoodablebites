import { AdminOrder } from '../types';

/** Wraps a cell value in quotes and escapes internal quotes */
const cell = (val: string | number | undefined | null): string => {
  const str = val === null || val === undefined ? '' : String(val);
  return `"${str.replace(/"/g, '""')}"`;
};

/** Triggers a CSV file download in the browser */
const downloadCsv = (filename: string, rows: string[][]): void => {
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  } catch { return iso; }
};

/** Export full orders list as CSV */
export const exportOrdersCsv = (orders: AdminOrder[]): void => {
  const headers = [
    'Order ID', 'Date', 'Customer Name', 'Contact', 'Service Type',
    'Address', 'Landmark', 'Pickup Time', 'Payment Method',
    'GCash Sender', 'GCash Ref No.', 'Items', 'Total (₱)', 'Status', 'Notes'
  ];

  const rows: string[][] = [headers];

  orders.forEach(o => {
    const itemsSummary = o.items.map(i => {
      let s = `${i.quantity}x ${i.name}`;
      if (i.selectedVariation) s += ` [${i.selectedVariation.name}]`;
      if (i.selectedVariations?.length) s += ` [${i.selectedVariations.map(v => v.name).join('+')}]`;
      if (i.selectedAddOns?.length) s += ` +${i.selectedAddOns.map(a => a.name).join(',')}`;
      return s;
    }).join(' | ');

    rows.push([
      cell(o.id),
      cell(formatDate(o.createdAt)),
      cell(o.customerName),
      cell(o.contactNumber),
      cell(o.serviceType),
      cell(o.address),
      cell(o.landmark),
      cell(o.pickupTime),
      cell(o.paymentMethod),
      cell(o.paymentSenderName),
      cell(o.paymentReferenceNumber),
      cell(itemsSummary),
      cell(o.total),
      cell(o.status),
      cell(o.notes),
    ]);
  });

  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(`orders-${date}.csv`, rows);
};

/** Export sales summary (top items + revenue breakdown) as CSV */
export const exportSalesCsv = (
  orders: AdminOrder[],
  timeLabel: string
): void => {
  const validOrders = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = validOrders.reduce((s, o) => s + Number(o.total), 0);

  // ── Sheet 1: Order-level summary ────────────────────────────────────────────
  const orderHeaders = [
    'Order ID', 'Date', 'Customer', 'Contact', 'Service', 'Payment',
    'Items Count', 'Total (₱)', 'Status'
  ];
  const orderRows: string[][] = [
    [`SALES REPORT — ${timeLabel.toUpperCase()}`],
    [`Exported: ${formatDate(new Date().toISOString())}`],
    [],
    ['=== ORDER SUMMARY ==='],
    orderHeaders,
  ];

  validOrders.forEach(o => {
    const itemCount = o.items.reduce((s, i) => s + i.quantity, 0);
    orderRows.push([
      cell(o.id),
      cell(formatDate(o.createdAt)),
      cell(o.customerName),
      cell(o.contactNumber),
      cell(o.serviceType),
      cell(o.paymentMethod),
      cell(itemCount),
      cell(o.total),
      cell(o.status),
    ]);
  });

  // Totals row
  orderRows.push([]);
  orderRows.push([cell(''), cell(''), cell(''), cell(''), cell(''), cell('TOTAL REVENUE:'), cell(''), cell(totalRevenue), cell('')]);

  // ── Sheet 2 (appended): Top selling items ───────────────────────────────────
  const itemSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  validOrders.forEach(o => {
    o.items.forEach(i => {
      if (!itemSales[i.name]) itemSales[i.name] = { name: i.name, qty: 0, revenue: 0 };
      itemSales[i.name].qty += i.quantity;
      itemSales[i.name].revenue += i.totalPrice * i.quantity;
    });
  });
  const topItems = Object.values(itemSales).sort((a, b) => b.qty - a.qty);

  orderRows.push([]);
  orderRows.push(['=== TOP SELLING ITEMS ===']);
  orderRows.push(['Rank', 'Item Name', 'Qty Sold', 'Total Revenue (₱)']);
  topItems.forEach((item, idx) => {
    orderRows.push([cell(idx + 1), cell(item.name), cell(item.qty), cell(item.revenue)]);
  });

  // ── Sheet 3: Service type breakdown ─────────────────────────────────────────
  const serviceMap: Record<string, { count: number; revenue: number }> = {};
  validOrders.forEach(o => {
    const k = o.serviceType;
    if (!serviceMap[k]) serviceMap[k] = { count: 0, revenue: 0 };
    serviceMap[k].count++;
    serviceMap[k].revenue += Number(o.total);
  });

  orderRows.push([]);
  orderRows.push(['=== SERVICE TYPE BREAKDOWN ===']);
  orderRows.push(['Service Type', 'Orders', 'Revenue (₱)']);
  Object.entries(serviceMap).forEach(([k, v]) => {
    orderRows.push([cell(k), cell(v.count), cell(v.revenue)]);
  });

  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(`sales-report-${timeLabel}-${date}.csv`, orderRows);
};
