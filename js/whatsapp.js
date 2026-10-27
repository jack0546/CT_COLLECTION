function buildOrderMessage({ items, customer, symbol = '₵', orderReference }) {
  const lines = [];
  lines.push('Hello! I would like to place an order.');
  lines.push('');
  if (orderReference) { lines.push(`Order Reference: ${orderReference}`); lines.push(''); }
  lines.push('Order Details:');
  lines.push('');
  let subtotal = 0;
  items.forEach((it, i) => {
    const lineTotal = it.unitPrice * it.quantity;
    subtotal += lineTotal;
    lines.push(`${i + 1}. ${it.productName}`);
    lines.push(`   Colour: ${it.colourName}`);
    lines.push(`   Size: ${it.size}`);
    lines.push(`   Quantity: ${it.quantity}`);
    lines.push(`   Unit Price: ${formatMoney(it.unitPrice, symbol)}`);
    lines.push(`   Subtotal: ${formatMoney(lineTotal, symbol)}`);
    if (it.sku) lines.push(`   SKU: ${it.sku}`);
    lines.push('');
  });
  lines.push(`Total Items: ${items.reduce((s, i) => s + i.quantity, 0)}`);
  lines.push(`Total Amount: ${formatMoney(subtotal, symbol)}`);
  lines.push('');
  lines.push('Customer Details:');
  lines.push(`Name: ${customer.name}`);
  lines.push(`Phone: ${customer.phone}`);
  lines.push(`Delivery Location: ${customer.location}`);
  lines.push(`Delivery Address: ${customer.address}`);
  if (customer.notes) lines.push(`Notes: ${customer.notes}`);
  lines.push('');
  lines.push('Please confirm availability and delivery details. Thank you!');
  return lines.join('\n');
}

function whatsappUrl(phone, message) {
  const cleaned = String(phone).replace(/\D/g, '');
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

function openWhatsApp(phone, message) {
  const url = whatsappUrl(phone, message);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) window.location.href = url;
  else window.open(url, '_blank', 'noopener,noreferrer');
}