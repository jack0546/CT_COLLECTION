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
  let currentUser = null;
  let userProfile = null;

  const { data: { user } } = await supabaseClient.auth.getUser();
  
  if (user) {
    currentUser = user;
    const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single();
    
    if (profile) {
      userProfile = profile;
      document.getElementById('guest-form-fields').style.display = 'none';
      document.getElementById('logged-in-info').style.display = 'block';
      
      const displayAddress = [
        profile.region, profile.city, profile.suburb, profile.street_name, profile.landmark
      ].filter(Boolean).join(' - ');

      document.getElementById('display-name').textContent = `${profile.first_name} ${profile.last_name}`;
      document.getElementById('display-phone').textContent = profile.phone;
      document.getElementById('display-address').textContent = displayAddress;
    }
  } else {
    alert('Please log in or create an account to complete your order.');
    window.location.href = 'login.html?redirect=checkout.html';
    return;
  }

  function getCustomerData() {
    if (currentUser && userProfile) {
      const formattedAddress = [
        userProfile.region, userProfile.city, userProfile.suburb, userProfile.street_name, userProfile.landmark
      ].filter(Boolean).join(' - ');

      return {
        name: `${userProfile.first_name} ${userProfile.last_name}`,
        email: userProfile.email,
        phone: userProfile.phone,
        location: `${userProfile.city}, ${userProfile.region}`,
        address: formattedAddress,
        notes: document.getElementById('c-notes').value.trim() || '',
        user_id: currentUser.id
      };
    }
    return null;
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

    // 🔴 THE FIX: Map item.productId to product_id
    const formattedOrderItems = items.map(item => ({
      product_id: item.productId || item.product_id, // Handles both camelCase and snake_case
      productName: item.productName || item.name,
      colourName: item.colourName || item.colour,
      size: item.size,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }));

    // Check if any product_id is missing before sending to DB
    if (formattedOrderItems.some(i => !i.product_id)) {
      console.error("Cart items missing productId:", items);
      alert('There is an error with your cart items. Please clear your cart and add the product again.');
      paystackBtn.disabled = false;
      paystackBtn.textContent = '💳 Pay Now (Secure)';
      return;
    }

    const { error } = await supabaseClient.from('orders').insert({
      order_reference: orderReference,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      delivery_location: customer.location,
      delivery_address: customer.address,
      notes: customer.notes,
      order_items: formattedOrderItems,
      subtotal: total,
      total_amount: total,
      status: 'pending',
      payment_status: 'unpaid',
      user_id: customer.user_id 
    });

    if (error) {
      alert('Could not save order. Please try again.\n\nError: ' + error.message);
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