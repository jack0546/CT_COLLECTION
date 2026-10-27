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
  const inStock = (product.variants || []).some(v => v.stock_quantity > 0);
  const price = product.sale_price ?? product.base_price;

  return `
    <a class="product-card" href="product.html?slug=${encodeURIComponent(product.slug)}">
      <div class="thumb">
        <img src="${img}" alt="${escapeHtml(product.name)}" loading="lazy">
        ${hasSale ? '<span class="badge-sale">SALE</span>' : ''}
        ${!inStock ? '<span class="badge-oos">Out of Stock</span>' : ''}
      </div>
      <h3>${escapeHtml(product.name)}</h3>
      <div class="price">
        ${formatMoney(price)}
        ${hasSale ? `<del>${formatMoney(product.base_price)}</del>` : ''}
      </div>
      ${colours.length ? `
        <div class="colour-dots">
          ${colours.map(c => `<button title="${escapeHtml(c.name)}" style="background-color:${c.code}"></button>`).join('')}
        </div>` : ''}
    </a>
  `;
}

async function mountHome() {
  const cats = await loadCategories();
  document.getElementById('category-grid').innerHTML = cats.slice(0, 12).map(c => `
    <a class="category-card" href="shop.html?category=${encodeURIComponent(c.slug)}">
      <div class="thumb">
        ${c.image_url ? `<img src="${c.image_url}" alt="${escapeHtml(c.name)}" loading="lazy">` : ''}
      </div>
      <span>${escapeHtml(c.name)}</span>
    </a>
  `).join('');

  const featured = await loadProducts({ featured: true, limit: 8 });
  document.getElementById('featured-grid').innerHTML =
    featured.length ? featured.map(renderProductCard).join('') :
    '<p class="muted">No featured products yet.</p>';

  const newest = await loadProducts({ order: 'newest', limit: 8 });
  document.getElementById('new-grid').innerHTML =
    newest.length ? newest.map(renderProductCard).join('') :
    '<p class="muted">No products yet.</p>';
}

mountHome();