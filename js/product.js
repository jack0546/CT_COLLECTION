let currentProduct = null;
let currentColour = null;
let currentSizeId = null;
let currentQty = 1;
let activeImageIdx = 0;
let currentSettings = null;

function imagesForColour(colour) {
  return (currentProduct.variant_images || [])
    .filter(i => i.colour_name === colour)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(i => i.image_url);
}
function sizesForColour(colour) {
  return (currentProduct.variants || []).filter(v => v.colour_name === colour);
}
function getColourList() {
  const map = new Map();
  for (const v of currentProduct.variants || []) map.set(v.colour_name, v.colour_code);
  return Array.from(map.entries()).map(([name, code]) => ({ name, code }));
}
function getSelectedVariant() {
  if (!currentSizeId) return null;
  return (currentProduct.variants || []).find(v => v.colour_name === currentColour && v.id === currentSizeId) || null;
}

function renderGallery() {
  const imgs = imagesForColour(currentColour);
  if (!imgs.length) imgs.push('https://placehold.co/600x600?text=No+Image');
  if (activeImageIdx >= imgs.length) activeImageIdx = 0;
  
  document.getElementById('pd-main-image').innerHTML =
    `<img src="${imgs[activeImageIdx]}" alt="${escapeHtml(currentProduct.name)} — ${escapeHtml(currentColour)}">`;
    
  document.getElementById('pd-thumbs').innerHTML = imgs.map((src, i) =>
    `<button class="${i === activeImageIdx ? 'active' : ''}" data-idx="${i}"><img src="${src}" alt=""></button>`
  ).join('');
  
  document.querySelectorAll('#pd-thumbs button').forEach(btn => {
    btn.addEventListener('click', () => { activeImageIdx = Number(btn.dataset.idx); renderGallery(); });
  });
}

function renderColours() {
  const colours = getColourList();
  document.getElementById('pd-colours').innerHTML = colours.map(c =>
    `<button class="${c.name === currentColour ? 'active' : ''}" data-colour="${escapeHtml(c.name)}" title="${escapeHtml(c.name)}" style="background-color:${c.code}"></button>`
  ).join('');
  
  document.querySelectorAll('#pd-colours button').forEach(btn => {
    btn.addEventListener('click', () => {
      currentColour = btn.dataset.colour;
      currentSizeId = null;
      activeImageIdx = 0;
      renderAll();
    });
  });
  document.getElementById('pd-colour-label').textContent = currentColour;
}

function renderSizes() {
  const allSizes = sizesForColour(currentColour);
  
  // THE FIX: Filter out duplicate sizes before rendering
  const seenSizes = new Set();
  const uniqueSizes = allSizes.filter(v => {
    if (seenSizes.has(v.size)) return false;
    seenSizes.add(v.size);
    return true;
  });

  document.getElementById('pd-sizes').innerHTML = uniqueSizes.map(v => {
    const out = v.stock_quantity <= 0;
    return `<button data-id="${v.id}" class="${v.id === currentSizeId ? 'active' : ''}">${escapeHtml(v.size)}${out ? ' (Out of Stock)' : ''}</button>`;
  }).join('');
  
  document.querySelectorAll('#pd-sizes button').forEach(btn => {
    btn.addEventListener('click', () => { 
      currentSizeId = btn.dataset.id; 
      renderAll(); 
      const variant = getSelectedVariant();
      const form = document.getElementById('oos-form');
      if (variant && variant.stock_quantity <= 0) form.style.display = 'block';
      else form.style.display = 'none';
    });
  });

  const variant = getSelectedVariant();
  const note = document.getElementById('pd-stock');
  if (!currentSizeId) { note.textContent = 'Select a size to see availability.'; note.className = 'stock-note muted'; }
  else if (variant) {
    if (variant.stock_quantity > 0) { note.textContent = `${variant.stock_quantity} in stock`; note.className = 'stock-note stock-in'; }
    else { note.textContent = 'Out of stock'; note.className = 'stock-note stock-out'; }
  }
}

function renderPrice() {
  const variant = getSelectedVariant();
  const price = variant?.price ?? currentProduct.sale_price ?? currentProduct.base_price;
  const hasSale = currentProduct.sale_price != null && currentProduct.sale_price < currentProduct.base_price;
  document.getElementById('pd-price').innerHTML = `
    ${formatMoney(price, currentSettings.currency_symbol)}
    ${hasSale ? `<del>${formatMoney(currentProduct.base_price, currentSettings.currency_symbol)}</del>` : ''}
  `;
}

function updateAskButton() {
  const btn = document.getElementById('btn-ask');
  if (!btn || !currentProduct || !currentSettings) return;
  const msg = `Hello ${currentSettings.store_name}! I have a question about the "${currentProduct.name}" (Colour: ${currentColour}). Can you help me?`;
  btn.href = whatsappUrl(currentSettings.whatsapp_number, msg);
}

function renderAll() {
  renderGallery(); renderColours(); renderSizes(); renderPrice();
  document.getElementById('pd-qty').value = currentQty;
  updateAskButton();
}

function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._timer); t._timer = setTimeout(() => t.classList.remove('show'), 1800);
}

function buildCartItem() {
  const variant = getSelectedVariant();
  if (!variant) return null;
  const price = variant.price ?? currentProduct.sale_price ?? currentProduct.base_price;
  const imgs = imagesForColour(currentColour);
  return {
    key: variant.id,
    productId: currentProduct.id,
    productName: currentProduct.name,
    variantId: variant.id,
    colourName: variant.colour_name,
    colourCode: variant.colour_code,
    size: variant.size,
    quantity: currentQty,
    unitPrice: Number(price),
    imageUrl: imgs[activeImageIdx] || imgs[0] || '',
    sku: variant.sku,
  };
}

async function submitStockAlert() {
  const contact = document.getElementById('oos-contact').value.trim();
  const variant = getSelectedVariant();
  if (!contact || !variant) return alert('Please enter your contact info.');
  const btn = document.getElementById('oos-btn');
  btn.disabled = true; btn.textContent = 'Saving...';
  await supabaseClient.from('stock_alerts').insert({ product_id: currentProduct.id, variant_id: variant.id, contact_info: contact });
  document.getElementById('oos-form').innerHTML = '<p style="margin:0; color:#166534; font-size:13px;">✓ We will notify you when this is back in stock!</p>';
}

async function loadRelatedProducts() {
  if (!currentProduct.category_id) return;
  const { data: related } = await supabaseClient.from('products').select('*, variants(*), variant_images(*)')
    .eq('category_id', currentProduct.category_id).neq('id', currentProduct.id).eq('status', 'active').limit(4);
  if (related && related.length > 0) {
    document.getElementById('related-section').style.display = 'block';
    document.getElementById('related-grid').innerHTML = related.map(p => {
      const img = p.variant_images?.[0]?.image_url || 'https://placehold.co/400x500?text=No+Image';
      const price = p.sale_price ?? p.base_price;
      return `<a class="product-card" href="product.html?slug=${encodeURIComponent(p.slug)}"><div class="thumb"><img src="${img}" alt="${escapeHtml(p.name)}"></div><h3>${escapeHtml(p.name)}</h3><div class="price">${formatMoney(price, currentSettings.currency_symbol)}</div></a>`;
    }).join('');
  }
}

async function loadReviews() {
  const { data } = await supabaseClient.from('reviews').select('*').eq('product_id', currentProduct.id).order('created_at', { ascending: false });
  const list = document.getElementById('reviews-list');
  if (!data || data.length === 0) {
    list.innerHTML = '<p class="muted">No reviews yet. Be the first to review this product!</p>';
    return;
  }
  list.innerHTML = data.map(r => `
    <div style="border-bottom: 1px solid #eee; padding: 12px 0;">
      <div style="display:flex; justify-content:space-between; align-items: flex-start;">
        <div>
          <strong>${escapeHtml(r.customer_name)}</strong>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
            ${new Date(r.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <span style="color:#f59e0b; font-size: 18px;">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
      </div>
      <p style="margin: 8px 0 0; font-size:14px;">${escapeHtml(r.comment)}</p>
    </div>
  `).join('');
}

async function mountProduct() {
  const slug = qs('slug');
  if (!slug) {
    document.getElementById('product-root').innerHTML = `<div class="empty-state"><h3>Product not found</h3><a href="shop.html">Back to shop</a></div>`;
    return;
  }
  currentSettings = await getStoreSettings();
  currentProduct = await loadProductBySlug(slug);
  if (!currentProduct) {
    document.getElementById('product-root').innerHTML = `<div class="empty-state"><h3>Product not found</h3><a href="shop.html">Back to shop</a></div>`;
    return;
  }
  const colours = getColourList();
  currentColour = colours[0]?.name || null;
  document.title = `${currentProduct.name} — ${currentSettings.store_name}`;

  document.getElementById('product-root').innerHTML = `
    <div style="padding:24px 0 4px; font-size:13px; color:#737373;">
      <a href="index.html">Home</a> / <a href="shop.html">Shop</a> / <span style="color:#0a0a0a;">${escapeHtml(currentProduct.name)}</span>
    </div>
    <div class="pd-layout">
      <!-- THUMBS FIRST (LEFT SIDE) -->
      <div class="pd-gallery">
        <div class="pd-thumbs" id="pd-thumbs"></div>
        <div class="main-image" id="pd-main-image"></div>
      </div>
      <div>
        <h1 class="pd-title">${escapeHtml(currentProduct.name)}</h1>
        <div class="pd-price" id="pd-price"></div>
        <p class="pd-desc">${escapeHtml(currentProduct.description || '')}</p>
        <div class="pd-block"><h4>Colour: <span id="pd-colour-label"></span></h4><div class="colour-swatches" id="pd-colours"></div></div>
        
        <div class="pd-block">
          <h4>Size</h4>
          <div class="size-grid" id="pd-sizes"></div>
          <p class="stock-note" id="pd-stock"></p>
          <div id="oos-form" style="display:none; margin-top:12px; padding:12px; background:#fef2f2; border-radius:8px;">
            <p style="margin:0 0 8px; font-size:13px; color:#991b1b;">This size is out of stock. Want to be notified?</p>
            <div style="display:flex; gap:6px;">
              <input id="oos-contact" placeholder="Email or Phone" style="flex:1; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px;">
              <button id="oos-btn" class="btn btn-dark" style="padding:6px 12px; font-size:13px; border-radius:4px;">Notify Me</button>
            </div>
          </div>
        </div>

        <div class="pd-block"><h4>Quantity</h4>
          <div class="qty-box">
            <button type="button" id="qty-minus">−</button>
            <input type="number" id="pd-qty" min="1" value="1">
            <button type="button" id="qty-plus">+</button>
          </div>
        </div>
        
        <div class="pd-actions" style="flex-direction: column; gap: 12px;">
          <div style="display:flex; gap:10px;">
            <button class="btn btn-outline" id="btn-add" style="flex:1;">Add to Cart</button>
            <button class="btn btn-dark" id="btn-buy" style="flex:1;">Buy Now</button>
          </div>
          <button class="btn btn-green" id="btn-wa" style="width:100%;">Order on WhatsApp</button>
          <div style="display:flex; gap:10px; margin-top: 4px;">
            <a class="btn btn-light" id="btn-ask" href="#" target="_blank" rel="noopener" style="flex:1; border:1px solid #e5e5e5; font-size:13px;">💬 Ask a Question</a>
            <button class="btn btn-light" id="btn-share" style="flex:1; border:1px solid #e5e5e5; font-size:13px;">🔗 Share</button>
          </div>
        </div>
      </div>
    </div>
  `;

  renderAll();
  loadRelatedProducts();
  loadReviews();

  document.getElementById('qty-minus').addEventListener('click', () => {
    currentQty = Math.max(1, currentQty - 1);
    document.getElementById('pd-qty').value = currentQty;
  });
  document.getElementById('qty-plus').addEventListener('click', () => {
    currentQty += 1;
    document.getElementById('pd-qty').value = currentQty;
  });
  document.getElementById('pd-qty').addEventListener('input', e => {
    currentQty = Math.max(1, parseInt(e.target.value) || 1);
    e.target.value = currentQty;
  });

  document.getElementById('oos-btn').addEventListener('click', submitStockAlert);

  document.getElementById('btn-add').addEventListener('click', () => {
    const item = buildCartItem();
    if (!item) return showToast('Please select a size.');
    const variant = getSelectedVariant();
    if (currentQty > variant.stock_quantity) return showToast('Not enough stock.');
    addToCart(item);
    showToast('Added to cart ✓');
  });

  document.getElementById('btn-buy').addEventListener('click', () => {
    const item = buildCartItem();
    if (!item) return showToast('Please select a size.');
    const variant = getSelectedVariant();
    if (currentQty > variant.stock_quantity) return showToast('Not enough stock.');
    clearCart(); // Clear cart to buy only this item
    addToCart(item);
    window.location.href = 'checkout.html';
  });

  document.getElementById('btn-wa').addEventListener('click', () => {
    const item = buildCartItem();
    if (!item) return showToast('Please select a size.');
    const variant = getSelectedVariant();
    if (currentQty > variant.stock_quantity) return showToast('Not enough stock.');
    addToCart(item);
    window.location.href = 'checkout.html';
  });

  document.getElementById('btn-share').addEventListener('click', () => {
    const url = window.location.href;
    const text = `Check out this ${currentProduct.name} on ${currentSettings.store_name}! ${url}`;
    if (navigator.share) {
      navigator.share({ title: currentProduct.name, text: text, url: url });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  });

  document.getElementById('review-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('r-name').value.trim();
    const rating = Number(document.getElementById('r-rating').value);
    const comment = document.getElementById('r-comment').value.trim();
    
    await supabaseClient.from('reviews').insert({ product_id: currentProduct.id, customer_name: name, rating, comment });
    
    const msg = document.getElementById('r-msg');
    msg.style.display = 'block'; msg.style.color = '#16a34a';
    msg.textContent = 'Thank you! Your review has been submitted for approval.';
    document.getElementById('review-form').reset();
  });
}

mountProduct();