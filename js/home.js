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
  
  const rating = 4.5; 
  const reviewCount = Math.floor(Math.random() * 200) + 50; 

  return `
    <div class="product-card">
      <a href="product.html?slug=${encodeURIComponent(product.slug)}" class="thumb">
        <!-- FIXED: Added width and height to prevent layout shift -->
        <img src="${img}" alt="${escapeHtml(product.name)}" loading="lazy" width="400" height="500">
        ${hasSale ? '<span class="badge-sale">Sale</span>' : ''}
        ${!inStock ? '<span class="badge-oos">Out of Stock</span>' : ''}
      </a>
      <a href="product.html?slug=${encodeURIComponent(product.slug)}">
        <h3 class="product-title">${escapeHtml(product.name)}</h3>
      </a>
      
      <div class="product-price-row">
        <div class="product-price">
          ${formatMoney(price, 'GHC')}
          ${hasSale ? `<del>${formatMoney(product.base_price, 'GHC')}</del>` : ''}
        </div>
        <button class="card-cart-btn" onclick="location.href='product.html?slug=${encodeURIComponent(product.slug)}'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        </button>
      </div>

      ${isLowStock ? '<div class="sold-out-text">Almost sold out <span>?</span></div>' : ''}

      <div class="stars-row">
        <span class="stars">${'★'.repeat(Math.floor(rating))}${'☆'.repeat(5 - Math.floor(rating))}</span>
        <span>(${reviewCount})</span>
      </div>

      ${colours.length ? `
        <div class="colour-dots" style="margin-top: 6px;">
          ${colours.map(c => `<button title="${escapeHtml(c.name)}" style="background-color:${c.code}"></button>`).join('')}
        </div>` : ''}
    </div>
  `;
}

async function mountHome() {
  const cats = await loadCategories();
  
  const catGrid = document.getElementById('category-grid');
  if (catGrid) {
    // FIXED: Added width and height to category images
    catGrid.innerHTML = cats.slice(0, 12).map(c => `
      <a class="category-card" href="shop.html?category=${encodeURIComponent(c.slug)}">
        <div class="thumb">
          ${c.image_url ? `<img src="${c.image_url}" alt="${escapeHtml(c.name)}" loading="lazy" width="300" height="300">` : ''}
        </div>
        <span>${escapeHtml(c.name)}</span>
      </a>
    `).join('');
  }

  const featured = await loadProducts({ featured: true, limit: 8 });
  const featuredGrid = document.getElementById('featured-grid');
  if (featuredGrid) {
    featuredGrid.innerHTML = featured.length ? featured.map(renderProductCard).join('') : '<p class="muted">No featured products yet.</p>';
  }

  const newest = await loadProducts({ order: 'newest', limit: 8 });
  const newGrid = document.getElementById('new-grid');
  if (newGrid) {
    newGrid.innerHTML = newest.length ? newest.map(renderProductCard).join('') : '<p class="muted">No products yet.</p>';
  }
}

mountHome();