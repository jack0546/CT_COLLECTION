async function mountCheckout() {
  const settings = await getStoreSettings();
  const items = getCart();
  const summaryEl = document.getElementById('checkout-summary');

  if (!items.length) {
    summaryEl.innerHTML = `Your cart is empty. <a href="shop.html" style="text-decoration:underline;">Shop now</a>.`;
    return;
  }

  const total = cartTotal();
  summaryEl.innerHTML = `<strong>${cartCount()} item(s) — Total: ${formatMoney(total, settings.currency_symbol)}</strong>`;

  const paystackBtn = document.getElementById('paystack-btn');

  function getCustomerData() {
    const customer = {
      name: document.getElementById('c-name').value.trim(),
      email: document.getElementById('c-email').value.trim(),
      phone: document.getElementById('c-phone').value.trim(),
      location: document.getElementById('c-location').value.trim(),
      address: document.getElementById('c-address').value.trim(),
      notes: document.getElementById('c-notes').value.trim(),
    };

    if (!customer.name || !customer.email || !customer.phone || !customer.location || !customer.address) {
      alert('Please fill in all required fields (Name, Email, Phone, Location, Address).');
      return null;
    }
    return customer;
  }

  paystackBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const termsCheckbox = document.getElementById('c-terms');
    if (!termsCheckbox || !termsCheckbox.checked) {
      alert('Please agree to the Terms & Conditions and Privacy Policy to continue.');
      return;
    }

    const customer = getCustomerData();
    if (!customer) return;

    paystackBtn.disabled = true;
    paystackBtn.textContent = 'Processing...';

    const orderReference = 'ORD-' + Date.now();

    try {
      await supabaseClient.from('orders').insert({
        order_reference: orderReference,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        delivery_location: customer.location,
        delivery_address: customer.address,
        notes: customer.notes,
        order_items: items,
        subtotal: total,
        total_amount: total,
        status: 'pending',
        payment_status: 'unpaid',
      });
    } catch (err) {
      alert('Could not save order. Please try again.');
      paystackBtn.disabled = false;
      paystackBtn.textContent = '💳 Pay Now (Secure)';
      return;
    }

    const paystack = new PaystackPop();
    paystack.newTransaction({
      key: 'pk_live_6b9968065dc0bd4842c97ffa138e49127c862888',
      email: customer.email,
      amount: Math.round(total * 100),
      reference: orderReference,
      onSuccess: (transaction) => {
        clearCart();
        // Save the reference so the confirmation page knows what to load
        sessionStorage.setItem('last_order_ref', orderReference);
        window.location.href = 'order-confirmed.html?ref=' + orderReference;
      },
      onCancel: () => {
        alert('Payment cancelled. Your order is saved but unpaid.');
        paystackBtn.disabled = false;
        paystackBtn.textContent = '💳 Pay Now (Secure)';
      },
    });
  });
}

mountCheckout();