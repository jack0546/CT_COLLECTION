async function mountCheckout() {
  const settings = await getStoreSettings();
  const items = getCart();
  const summaryEl = document.getElementById('checkout-summary');

  if (!items.length) {
    summaryEl.innerHTML = `Your cart is empty. <a href="shop.html" style="text-decoration:underline;">Shop now</a>.`;
    document.querySelector('#checkout-form .btn').disabled = true;
    return;
  }

  const total = cartTotal();
  summaryEl.innerHTML = `<strong>${cartCount()} item(s) — Total: ${formatMoney(total, settings.currency_symbol)}</strong>`;

  document.getElementById('checkout-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.querySelector('#checkout-form .btn');
    
    const customer = {
      name: document.getElementById('c-name').value.trim(),
      phone: document.getElementById('c-phone').value.trim(),
      location: document.getElementById('c-location').value.trim(),
      address: document.getElementById('c-address').value.trim(),
      notes: document.getElementById('c-notes').value.trim(),
    };
    
    if (!customer.name || !customer.phone || !customer.location || !customer.address) {
      alert('Please fill in all required fields.');
      return;
    }
    
    if (!settings.whatsapp_number) {
      alert('Store WhatsApp number is not configured yet. Please contact the store directly.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Processing...';

    const orderReference = 'ORD-' + Date.now();
    
    // 1. Save order to Supabase
    try {
      await supabaseClient.from('orders').insert({
        order_reference: orderReference,
        customer_name: customer.name,
        customer_phone: customer.phone,
        delivery_location: customer.location,
        delivery_address: customer.address,
        notes: customer.notes,
        order_items: items,
        subtotal: total,
        total_amount: total,
        status: 'pending',
      });
    } catch (err) {
      console.warn('Order record not saved:', err);
    }

    // 2. Build the message
    const message = buildOrderMessage({ items, customer, symbol: settings.currency_symbol, orderReference });

    // 3. Alert the user with their Order Reference
    alert(`Your Order Reference is: ${orderReference}\n\nWhen WhatsApp opens, please press the green SEND button to confirm your order with us.\n\nYou can use this reference and your phone number to track your order on our website!`);

    // 4. Clear the cart since they are moving to WhatsApp
    clearCart();

    // 5. Open WhatsApp
    openWhatsApp(settings.whatsapp_number, message);

    // 6. Reset button (optional, in case they come back)
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Send Order on WhatsApp';
    }, 2000);
  });
}

mountCheckout();