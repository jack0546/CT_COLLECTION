async function mountCartPage() {
  const settings = await getStoreSettings();
  const items = getCart();
  const itemsEl = document.getElementById('cart-items');
  const summaryEl = document.getElementById('cart-summary');

  if (!items.length) {
    itemsEl.innerHTML = `
      <div class="empty-state">
        <h3>Your cart is empty</h3>
        <p>Browse products and add your favourites.</p>
        <a class="btn btn-dark" href="shop.html" style="margin-top:16px;">Go shopping</a>
      </div>`;
    summaryEl.innerHTML = '';
    return;
  }

  itemsEl.innerHTML = items.map(item => `
    <div class="cart-item" data-key="${escapeHtml(item.key)}">
      <img src="${item.imageUrl || 'https://placehold.co/80x100'}" alt="${escapeHtml(item.productName)}">
      <div class="info">
        <h4>${escapeHtml(item.productName)}</h4>
        <div class="meta">Colour: ${escapeHtml(item.colourName)}</div>
        <div class="meta">Size: ${escapeHtml(item.size)}</div>
        <div class="price">${formatMoney(item.unitPrice, settings.currency_symbol)} × ${item.quantity}
          = <strong>${formatMoney(item.unitPrice * item.quantity, settings.currency_symbol)}</strong>
        </div>
        <div class="controls">
          <div class="qty-box">
            <button data-act="dec">−</button>
            <input type="number" value="${item.quantity}" data-act="qty" min="1">
            <button data-act="inc">+</button>
          </div>
          <button class="remove" data-act="remove">Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  itemsEl.querySelectorAll('.cart-item').forEach(row => {
    const key = row.dataset.key;
    const item = getCart().find(i => i.key === key);
    if (!item) return;
    row.querySelector('[data-act="inc"]').addEventListener('click', () => {
      updateCartQty(key, item.quantity + 1);
      mountCartPage();
    });
    row.querySelector('[data-act="dec"]').addEventListener('click', () => {
      if (item.quantity > 1) { updateCartQty(key, item.quantity - 1); mountCartPage(); }
    });
    row.querySelector('[data-act="qty"]').addEventListener('change', e => {
      const q = Math.max(1, parseInt(e.target.value) || 1);
      updateCartQty(key, q);
      mountCartPage();
    });
    row.querySelector('[data-act="remove"]').addEventListener('click', () => {
      removeFromCart(key);
      mountCartPage();
    });
  });

  const total = cartTotal();
  summaryEl.innerHTML = `
    <h3>Order Summary</h3>
    <div class="row"><span>Items</span><span>${cartCount()}</span></div>
    <div class="row total"><span>Total</span><span>${formatMoney(total, settings.currency_symbol)}</span></div>
    <a class="btn btn-green" href="checkout.html">Checkout on WhatsApp</a>
    <a class="btn btn-outline" href="shop.html" style="margin-top:8px;">Continue shopping</a>
  `;
}

mountCartPage();