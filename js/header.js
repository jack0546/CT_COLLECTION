(async function mountHeader() {
  const settings = await getStoreSettings();
  const el = document.getElementById('site-header');
  if (!el) return;

  // Check login status to change the link text
  const { data: { session } } = await supabaseClient.auth.getSession();
  const authLinkText = session ? 'My Account' : 'Login';
  const authLinkUrl = session ? 'account.html' : 'login.html';

  el.innerHTML = `
    <header class="site-header">
      <div class="header-inner">
        <a href="index.html" class="logo">
          ${settings.store_logo
            ? `<img src="${settings.store_logo}" alt="${settings.store_name}">`
            : `<span>${settings.store_name}</span>`}
        </a>
        <nav class="nav-desktop">
          <a href="index.html">Home</a>
          <a href="shop.html">Shop</a>
          <a href="shop.html?view=categories">Categories</a>
          <a href="about.html">About Us</a>
          <a href="track-order.html">Track Order</a>
          <a href="contact.html">Contact</a>
          <a href="${authLinkUrl}" style="font-weight: bold;">${authLinkText}</a> <!-- NEW LINK -->
        </nav>
        
        <!-- Live Search Dropdown -->
        <div class="header-search" style="position:relative;">
          <input id="live-search-input" placeholder="Search products…" autocomplete="off">
          <button type="button" onclick="location.href='shop.html?q='+encodeURIComponent(document.getElementById('live-search-input').value)">Go</button>
          <div id="live-search-results" style="display:none; position:absolute; top:100%; left:0; right:0; background:#fff; border:1px solid #e5e5e5; border-radius:0 0 8px 8px; box-shadow:0 10px 15px rgba(0,0,0,0.1); z-index:100; max-height:350px; overflow-y:auto;"></div>
        </div>

        <a href="cart.html" class="cart-link" aria-label="Cart">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
            <path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <span data-cart-count class="cart-badge">0</span>
        </a>
        <button class="menu-toggle" aria-label="Menu">☰</button>
      </div>
      <div class="nav-mobile" hidden>
        <a href="index.html">Home</a>
        <a href="shop.html">Shop</a>
        <a href="shop.html?view=categories">Categories</a>
        <a href="about.html">About Us</a>
        <a href="track-order.html">Track Order</a>
        <a href="contact.html">Contact</a>
        <a href="${authLinkUrl}" style="font-weight: bold;">${authLinkText}</a> <!-- NEW LINK -->
      </div>
    </header>
  `;

  const toggle = el.querySelector('.menu-toggle');
  const mob = el.querySelector('.nav-mobile');
  toggle.addEventListener('click', () => { mob.hidden = !mob.hidden; });
  updateCartBadge();

  // --- LIVE SEARCH LOGIC ---
  const searchInput = document.getElementById('live-search-input');
  const resultsBox = document.getElementById('live-search-results');
  let searchTimeout;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();

    if (query.length < 2) {
      resultsBox.style.display = 'none';
      return;
    }

    searchTimeout = setTimeout(async () => {
      const { data, error } = await supabaseClient
        .from('products')
        .select('name, slug, base_price, sale_price, variant_images(image_url)')
        .ilike('name', `%${query}%`)
        .eq('status', 'active')
        .limit(5);

      if (error || !data || data.length === 0) {
        resultsBox.innerHTML = `<div style="padding:12px; color:#737373; font-size:13px;">No products found for "${escapeHtml(query)}"</div>`;
        resultsBox.style.display = 'block';
        return;
      }

      resultsBox.innerHTML = data.map(p => {
        const img = p.variant_images?.[0]?.image_url || 'https://placehold.co/40x50?text=No+Img';
        const price = p.sale_price ?? p.base_price;
        return `
          <a href="product.html?slug=${encodeURIComponent(p.slug)}" style="display:flex; align-items:center; gap:12px; padding:10px 12px; border-bottom:1px solid #f1f1f1; text-decoration:none; color:inherit;">
            <img src="${img}" style="width:40px; height:50px; object-fit:cover; border-radius:4px;">
            <div>
              <div style="font-size:13px; font-weight:500;">${escapeHtml(p.name)}</div>
              <div style="font-size:12px; color:#16a34a; font-weight:600;">${formatMoney(price, settings.currency_symbol)}</div>
            </div>
          </a>
        `;
      }).join('');
      resultsBox.style.display = 'block';
    }, 300);
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !resultsBox.contains(e.target)) {
      resultsBox.style.display = 'none';
    }
  });
})();