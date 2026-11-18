// 1. ADD PAGINATION STATE
const state = {
  products: [],
  categories: [],
  q: qs('q') || '',
  category: qs('category') || '',
  view: qs('view') || '',
  colour: '',
  size: '',
  priceMax: 2000,
  sort: 'newest',
  page: 0,
  limit: 20, 
  hasMore: true,
  isLoading: false
};

function renderProductCard(product) {
  const imagesByColour = {};
  for (const img of product.variant_images || []) {
    (imagesByColour[img.colour_name] ||= []).push(img.image_url);
  }
  const colourMap = new Map();
  for (const v of product.variants || []) colourMap.set(v.colour_name, v.colour_code);
  const colours = Array.from(colourMap.entries()).map(([name, code]) => ({ name, code }));
  const firstColour = colours[0]?.name;
  const img = (imagesByColour[firstColour] || [])[0] || 'https://placehold.co/400x500?text=No+Image';
  
  const hasSale = product.sale_price != null && product.sale_price < product.base_price;
  const totalStock = (product.variants || []).reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
  const isLowStock = totalStock > 0 && totalStock <= 5;
  const inStock = totalStock > 0;
  const price = product.sale_price ?? product.base_price;
  
  const soldCount = Math.floor(Math.random() * 5000) + 20; 
  const soldDisplay = soldCount > 1000 ? (soldCount/1000).toFixed(1) + 'K+' : soldCount + '+';
  
  const rating = 4.5; 
  const reviewCount = Math.floor(Math.random() * 200) + 50; 

  return `
    <div class="product-card">
      <a href="product.html?slug=${encodeURIComponent(product.slug)}" class="thumb">
        <!-- FIXED: Added width and height to prevent layout shift -->
        <img src="${img}" alt="${escapeHtml(product.name)}" loading="lazy" width="400" height="500">
        
        ${hasSale ? `
          <div class="badge-sale">
            <span class="icon">Sale</span>
            <span class="text">Sale</span>
          </div>
        ` : ''}
        
        ${!inStock ? '<span class="badge-oos">Out of Stock</span>' : ''}
      </a>
      
      <a href="product.html?slug=${encodeURIComponent(product.slug)}" style="text-decoration: none;">
        <h3 class="product-title">${escapeHtml(product.name)}</h3>
      </a>
      
      <div class="product-price-row">
        <div class="product-price">
          ${formatMoney(price, 'GHC')}
          ${hasSale ? `<del>${formatMoney(product.base_price, 'GHC')}</del>` : ''}
          <span class="sold-count">🔥 ${soldDisplay} sold</span>
        </div>
        <button class="card-cart-btn" onclick="location.href='product.html?slug=${encodeURIComponent(product.slug)}'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        </button>
      </div>

      ${isLowStock ? '<div class="sold-out-text">Only ' + totalStock + ' left <span>?</span></div>' : ''}

      <div class="stars-row">
        <span class="stars">${'★'.repeat(Math.floor(rating))}${'☆'.repeat(5 - Math.floor(rating))}</span>
        <span>${reviewCount}</span>
      </div>

      ${colours.length ? `
        <div class="colour-dots" style="margin-top: 4px;">
          ${colours.map(c => `<button title="${escapeHtml(c.name)}" style="background-color:${c.code}"></button>`).join('')}
        </div>` : ''}
    </div>
  `;
}

function populateFilters() {
  const catSelect = document.getElementById('f-category');
  catSelect.innerHTML = '<option value="">All categories</option>';
  for (const c of state.categories) {
    catSelect.insertAdjacentHTML('beforeend', `<option value="${c.slug}">${escapeHtml(c.name)}</option>`);
  }
  catSelect.value = state.category;

  document.getElementById('f-search').value = state.q;
}

function renderCategories() {
  const catGrid = document.getElementById('shop-categories');
  const prodGrid = document.getElementById('shop-grid');
  const toolbar = document.querySelector('.shop-toolbar');
  const filters = document.getElementById('filters');
  const loadMoreBtn = document.getElementById('load-more-btn');

  if (!catGrid) return; 

  if (state.view === 'categories' && !state.q && !state.category) {
    catGrid.style.display = 'grid';
    prodGrid.style.display = 'none';
    if (filters) filters.style.display = 'none';
    if (toolbar) toolbar.style.display = 'none';
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';

    // FIXED: Added width and height to category images
    catGrid.innerHTML = state.categories.map(c => `
      <a class="category-card" href="shop.html?category=${encodeURIComponent(c.slug)}">
        <div class="thumb" style="aspect-ratio: 1/1; background: #f5f5f5; border-radius: 12px; overflow: hidden;">
          ${c.image_url ? `<img src="${c.image_url}" alt="${escapeHtml(c.name)}" style="width:100%; height:100%; object-fit:cover;" loading="lazy" width="300" height="300">` : ''}
        </div>
        <span style="display:block; text-align:center; margin-top:8px; font-weight:500;">${escapeHtml(c.name)}</span>
      </a>
    `).join('');
    document.getElementById('result-count').textContent = `${state.categories.length} categories`;
  } else {
    catGrid.style.display = 'none';
    prodGrid.style.display = 'grid';
    if (filters) filters.style.display = '';
    if (toolbar) toolbar.style.display = 'flex';
    if (loadMoreBtn) loadMoreBtn.style.display = 'block';
  }
}

async function fetchProducts(reset = false) {
  if (state.isLoading) return;
  state.isLoading = true;
  
  const btn = document.getElementById('load-more-btn');
  if (btn) btn.textContent = 'Loading...';

  if (reset) {
    state.page = 0;
    state.hasMore = true;
    state.products = [];
  }

  const from = state.page * state.limit;
  const to = from + state.limit - 1;

  // FIXED: Using 'categories!inner' to allow filtering by joined table slug properly
  const selectStr = state.category 
    ? 'id, name, slug, base_price, sale_price, created_at, categories!inner(name, slug), variants(colour_name, colour_code, size, stock_quantity), variant_images(image_url, colour_name)'
    : 'id, name, slug, base_price, sale_price, created_at, categories(name, slug), variants(colour_name, colour_code, size, stock_quantity), variant_images(image_url, colour_name)';

  let query = supabaseClient
    .from('products')
    .select(selectStr, { count: 'exact' })
    .eq('status', 'active');

  if (state.q) query = query.ilike('name', `%${state.q}%`);
  if (state.category) query = query.eq('categories.slug', state.category);
  if (state.view === 'sale') query = query.not('sale_price', 'is', null);
  
  if (state.sort === 'price-asc') query = query.order('base_price', { ascending: true });
  else if (state.sort === 'price-desc') query = query.order('base_price', { ascending: false });
  else if (state.sort === 'name') query = query.order('name', { ascending: true });
  else query = query.order('created_at', { ascending: false });

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error(error);
    state.isLoading = false;
    if (btn) btn.textContent = 'Error Loading';
    return;
  }

  state.products = [...state.products, ...data];
  state.hasMore = data.length === state.limit;
  state.page++;

  const grid = document.getElementById('shop-grid');
  
  if (reset) {
    document.getElementById('result-count').textContent = `${count || 0} products`;
    grid.innerHTML = ''; 
  }

  if (state.products.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><h3>No products found</h3><p>Try changing your filters.</p></div>`;
    if (btn) btn.style.display = 'none';
  } else {
    const html = data.map(p => {
      try { return renderProductCard(p); } catch (err) { return ''; }
    }).join('');
    grid.insertAdjacentHTML('beforeend', html);
    
    if (btn) {
      btn.style.display = state.hasMore ? 'block' : 'none';
      btn.textContent = state.hasMore ? 'Load More Products' : 'No more products';
    }
  }

  state.isLoading = false;
}

let searchTimeout;
function debounceSearch(val) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    state.q = val;
    fetchProducts(true);
  }, 400);
}

async function mountShop() {
  // FIXED: Automatically show category grid if landing on shop.html with no specific filter
  if (!state.category && !state.q && !state.view) {
    state.view = 'categories';
  }

  state.categories = await loadCategories();
  populateFilters();
  
  await fetchProducts(true);
  renderCategories();

  document.getElementById('f-search').addEventListener('input', e => debounceSearch(e.target.value));
  
  document.getElementById('f-category').addEventListener('change', e => { 
    state.category = e.target.value; 
    if (state.category) state.view = ''; // Switch to product view when filtering
    fetchProducts(true); 
    renderCategories();
  });
  
  document.getElementById('f-price').addEventListener('input', e => {
    state.priceMax = Number(e.target.value);
    document.getElementById('price-label').textContent = `GHC ${state.priceMax}`;
  });
  
  document.getElementById('f-colour').addEventListener('change', e => { state.colour = e.target.value; fetchProducts(true); });
  document.getElementById('f-size').addEventListener('change', e => { state.size = e.target.value; fetchProducts(true); });
  document.getElementById('f-sort').addEventListener('change', e => { state.sort = e.target.value; fetchProducts(true); });

  const btn = document.getElementById('load-more-btn');
  if (btn) {
    btn.addEventListener('click', () => fetchProducts(false));
  }

  const toggleBtn = document.getElementById('toggle-filters');
  const filters = document.getElementById('filters');
  if (window.innerWidth < 1024 && toggleBtn) toggleBtn.style.display = 'block';
  if (toggleBtn && filters) {
    toggleBtn.addEventListener('click', () => filters.classList.toggle('open'));
  }
}

mountShop();