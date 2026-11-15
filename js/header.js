(async function mountHeader() {
  const settings = await getStoreSettings();
  const el = document.getElementById('site-header');
  if (!el) return;

  // Check login status to change the link text
  const { data: { session } } = await supabaseClient.auth.getSession();
  const authLinkText = session ? 'My Account' : 'Login';
  const authLinkUrl = session ? 'account.html' : 'login.html';

  // Get the current page filename (e.g., "index.html", "shop.html")
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  // Helper function to check if a link is active
  function isActive(page) {
    if (page === 'shop.html' && (currentPath === 'shop.html' || currentPath === 'product.html')) {
      return 'active-link';
    }
    if (page === 'account.html' && (currentPath === 'account.html' || currentPath === 'login.html' || currentPath === 'register.html')) {
      return 'active-link';
    }
    return currentPath === page ? 'active-link' : '';
  }

  // Inject Custom CSS for the Header
  const style = document.createElement('style');
  style.innerHTML = `
    .site-header {
      background: #fff;
      border-bottom: 1px solid #eaeaea;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }
    .header-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 15px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }
    
    /* UPDATED LOGO STYLES */
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }
    .logo img {
      max-height: 45px;
      width: auto;
      display: block;
    }
    .logo span {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 1px;
      color: #0a0a0a;
      text-transform: uppercase;
      white-space: nowrap;
    }
    
    .nav-desktop {
      display: flex;
      gap: 25px;
      align-items: center;
    }
    .nav-desktop a {
      text-decoration: none;
      color: #444;
      font-size: 14px;
      font-weight: 500;
      transition: color 0.2s ease, transform 0.2s ease;
      position: relative;
    }
    .nav-desktop a:hover {
      color: #16a34a;
      transform: translateY(-1px);
    }
    
    /* ACTIVE LINK STYLING */
    .nav-desktop a.active-link {
      color: #16a34a;
      font-weight: 700;
    }
    .nav-desktop a.active-link::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 2px;
      bottom: -4px;
      left: 0;
      background-color: #16a34a;
    }
    
    .nav-desktop a::after {
      content: '';
      position: absolute;
      width: 0;
      height: 2px;
      bottom: -4px;
      left: 0;
      background-color: #16a34a;
      transition: width 0.3s ease;
    }
    .nav-desktop a:hover::after {
      width: 100%;
    }
    
    .header-search {
      display: flex;
      align-items: center;
      background: #f5f5f5;
      border-radius: 30px;
      padding: 5px 15px;
      border: 1px solid #e5e5e5;
      transition: all 0.3s ease;
      width: 300px;
    }
    .header-search:focus-within {
      background: #fff;
      border-color: #16a34a;
      box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
    }
    .header-search input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      padding: 8px 0;
      font-size: 13px;
      color: #333;
    }
    .header-search button {
      background: #0a0a0a;
      color: #fff;
      border: none;
      border-radius: 20px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .header-search button:hover {
      background: #16a34a;
    }
    .cart-link {
      position: relative;
      color: #444;
      display: flex;
      align-items: center;
      transition: color 0.2s;
    }
    .cart-link:hover {
      color: #16a34a;
    }
    .cart-badge {
      position: absolute;
      top: -8px;
      right: -10px;
      background: #16a34a;
      color: #fff;
      font-size: 10px;
      font-weight: bold;
      height: 18px;
      width: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }
    .menu-toggle {
      display: none;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
    }
    .nav-mobile {
      display: none;
      flex-direction: column;
      background: #fff;
      border-top: 1px solid #eee;
      padding: 10px 20px;
    }
    .nav-mobile a {
      padding: 12px 0;
      text-decoration: none;
      color: #444;
      border-bottom: 1px solid #f5f5f5;
      font-weight: 500;
    }
    .nav-mobile a.active-link {
      color: #16a34a;
      font-weight: 700;
    }
    
    @media (max-width: 900px) {
      .nav-desktop, .header-search { display: none; }
      .menu-toggle { display: block; }
      .nav-mobile.open { display: flex; }
      .logo span { font-size: 16px; } /* Shrinks text on mobile */
      .logo img { max-height: 32px; }
    }
  `;
  document.head.appendChild(style);

  el.innerHTML = `
    <header class="site-header">
      <div class="header-inner">
        <a href="index.html" class="logo">
          ${settings.store_logo 
            ? `<img src="${settings.store_logo}" alt="${settings.store_name}">` 
            : ''}
          <span>${settings.store_name || 'Great Addesam'}</span>
        </a>
        
        <nav class="nav-desktop">
          <a href="index.html" class="${isActive('index.html')}">Home</a>
          <a href="shop.html" class="${isActive('shop.html')}">Shop</a>
          <a href="shop.html?view=categories" class="${isActive('categories')}">Categories</a>
          <a href="about.html" class="${isActive('about.html')}">About Us</a>
          <a href="track-order.html" class="${isActive('track-order.html')}">Track Order</a>
          <a href="contact.html" class="${isActive('contact.html')}">Contact</a>
          <a href="${authLinkUrl}" class="${isActive('account.html')}" style="font-weight: 700;">${authLinkText}</a>
        </nav>
        
        <!-- Live Search Dropdown -->
        <div class="header-search" style="position:relative;">
          <input id="live-search-input" placeholder="Search products..." autocomplete="off">
          <button type="button" onclick="location.href='shop.html?q='+encodeURIComponent(document.getElementById('live-search-input').value)">Search</button>
          <div id="live-search-results" style="display:none; position:absolute; top:110%; left:0; right:0; background:#fff; border:1px solid #e5e5e5; border-radius:8px; box-shadow:0 10px 25px rgba(0,0,0,0.08); z-index:100; max-height:350px; overflow-y:auto;"></div>
        </div>

        <a href="cart.html" class="cart-link" aria-label="Cart">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
            <path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <span data-cart-count class="cart-badge">0</span>
        </a>
        
        <button class="menu-toggle" aria-label="Menu">☰</button>
      </div>
      
      <div class="nav-mobile" id="mobile-nav">
        <a href="index.html" class="${isActive('index.html')}">Home</a>
        <a href="shop.html" class="${isActive('shop.html')}">Shop</a>
        <a href="shop.html?view=categories" class="${isActive('categories')}">Categories</a>
        <a href="about.html" class="${isActive('about.html')}">About Us</a>
        <a href="track-order.html" class="${isActive('track-order.html')}">Track Order</a>
        <a href="contact.html" class="${isActive('contact.html')}">Contact</a>
        <a href="${authLinkUrl}" class="${isActive('account.html')}" style="font-weight: 700;">${authLinkText}</a>
      </div>
    </header>
  `;

  const toggle = el.querySelector('.menu-toggle');
  const mob = el.querySelector('.nav-mobile');
  toggle.addEventListener('click', () => { mob.classList.toggle('open'); });
  
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
        resultsBox.innerHTML = `<div style="padding:12px; color:#737373; font-size:13px; text-align:center;">No products found for "${escapeHtml(query)}"</div>`;
        resultsBox.style.display = 'block';
        return;
      }

      resultsBox.innerHTML = data.map(p => {
        const img = p.variant_images?.[0]?.image_url || 'https://placehold.co/40x50?text=No+Img';
        const price = p.sale_price ?? p.base_price;
        return `
          <a href="product.html?slug=${encodeURIComponent(p.slug)}" style="display:flex; align-items:center; gap:12px; padding:10px 12px; border-bottom:1px solid #f1f1f1; text-decoration:none; color:inherit; transition: background 0.2s;" onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background='#fff'">
            <img src="${img}" style="width:40px; height:50px; object-fit:cover; border-radius:4px;">
            <div>
              <div style="font-size:13px; font-weight:600;">${escapeHtml(p.name)}</div>
              <div style="font-size:12px; color:#16a34a; font-weight:700;">${formatMoney(price, settings.currency_symbol)}</div>
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