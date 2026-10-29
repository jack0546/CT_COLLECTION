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
  
  // Fake sold count for visual effect (random 20 to 5000)
  const soldCount = Math.floor(Math.random() * 5000) + 20; 
  const soldDisplay = soldCount > 1000 ? (soldCount/1000).toFixed(1) + 'K+' : soldCount + '+';
  
  // Visual rating
  const rating = 4.5; 
  const reviewCount = Math.floor(Math.random() * 200) + 50; 

  return `
    <div class="product-card">
      <a href="product.html?slug=${encodeURIComponent(product.slug)}" class="thumb">
        <img src="${img}" alt="${escapeHtml(product.name)}" loading="lazy">
        
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
          ${formatMoney(price)}
          ${hasSale ? `<del>${formatMoney(product.base_price)}</del>` : ''}
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
  for (const c of state.categories) {
    catSelect.insertAdjacentHTML('beforeend', `<option value="${c.slug}">${escapeHtml(c.name)}</option>`);
  }
  catSelect.value = state.category;

  const colours = new Set();
  const sizes = new Set();
  for (const p of state.products) {
    for (const v of p.variants || []) {
      colours.add(v.colour_name);
      sizes.add(v.size);
    }
  }
  const colourSel = document.getElementById('f-colour');
  Array.from(colours).sort().forEach(c =>
    colourSel.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`));
  const sizeSel = document.getElementById('f-size');
  Array.from(sizes).sort().forEach(s =>
    sizeSel.insertAdjacentHTML('beforeend', `<option value="${s}">${s}</option>`));

  document.getElementById('f-search').value = state.q;
}

function renderCategories() {
  const catGrid = document.getElementById('shop-categories');
  const prodGrid = document.getElementById('shop-grid');
  const toolbar = document.querySelector('.shop-toolbar');
  const filters = document.getElementById('filters');

  if (!catGrid) return; 

  if (state.view === 'categories' && !state.q && !state.category) {
    catGrid.style.display = 'grid';
    prodGrid.style.display = 'none';
    if (filters) filters.style.display = 'none';
    if (toolbar) toolbar.style.display = 'none';

    catGrid.innerHTML = state.categories.map(c => `
      <a class="category-card" href="shop.html?category=${encodeURIComponent(c.slug)}">
        <div class="thumb" style="aspect-ratio: 1/1; background: #f5f5f5; border-radius: 12px; overflow: hidden;">
          ${c.image_url ? `<img src="${c.image_url}" alt="${escapeHtml(c.name)}" style="width:100%; height:100%; object-fit:cover;">` : ''}
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
  }
}

function applyFilters() {
  renderCategories();

  if (state.view === 'categories' && !state.q && !state.category) return;

  let list = state.products.slice();
  if (state.q) {
    const q = state.q.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q));
  }
  if (state.category) list = list.filter(p => p.categories?.slug === state.category);
  if (state.colour) list = list.filter(p => (p.variants || []).some(v => v.colour_name === state.colour && v.stock_quantity > 0));
  if (state.size) list = list.filter(p => (p.variants || []).some(v => v.size === state.size && v.stock_quantity > 0));
  list = list.filter(p => (p.sale_price ?? p.base_price) <= state.priceMax);

  if (state.view === 'new') list.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  if (state.view === 'sale') list = list.filter(p => p.sale_price != null);

  if (state.sort === 'price-asc') list.sort((a, b) => (a.sale_price ?? a.base_price) - (b.sale_price ?? b.base_price));
  else if (state.sort === 'price-desc') list.sort((a, b) => (b.sale_price ?? b.base_price) - (a.sale_price ?? a.base_price));
  else if (state.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  else list.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  document.getElementById('result-count').textContent = `${list.length} products`;
  
  const grid = document.getElementById('shop-grid');
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><h3>No products found</h3><p>Try changing your filters.</p></div>`;
  } else {
    grid.innerHTML = list.map(p => {
      try {
        return renderProductCard(p);
      } catch (err) {
        console.error("Error rendering product:", p.name, err);
        return `<div class="product-card"><h3>${escapeHtml(p.name)}</h3><p class="muted">Image unavailable</p></div>`;
      }
    }).join('');
  }
}

async function mountShop() {
  // Pass an empty object to ensure the cache is used
  [state.products, state.categories] = await Promise.all([loadProducts({}), loadCategories()]);
  populateFilters();
  applyFilters();

  document.getElementById('f-search').addEventListener('input', e => { state.q = e.target.value; applyFilters(); });
  document.getElementById('f-category').addEventListener('change', e => { state.category = e.target.value; applyFilters(); });
  document.getElementById('f-price').addEventListener('input', e => {
    state.priceMax = Number(e.target.value);
    document.getElementById('price-label').textContent = `₵ ${state.priceMax}`;
    applyFilters();
  });
  document.getElementById('f-colour').addEventListener('change', e => { state.colour = e.target.value; applyFilters(); });
  document.getElementById('f-size').addEventListener('change', e => { state.size = e.target.value; applyFilters(); });
  document.getElementById('f-sort').addEventListener('change', e => { state.sort = e.target.value; applyFilters(); });

  const toggleBtn = document.getElementById('toggle-filters');
  const filters = document.getElementById('filters');
  if (window.innerWidth < 1024 && toggleBtn) toggleBtn.style.display = 'block';
  if (toggleBtn && filters) {
    toggleBtn.addEventListener('click', () => filters.classList.toggle('open'));
  }
}

mountShop();