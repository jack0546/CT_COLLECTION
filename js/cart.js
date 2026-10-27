const CART_KEY = 'luxe_cart_v1';
const GUEST_KEY = 'luxe_guest_id';

// Get or create a unique guest ID for this browser
function getGuestId() {
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = 'guest_' + Math.random().toString(36).substr(2, 9) + Date.now();
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
}

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch { return []; }
}

// Save cart locally AND sync to Supabase
async function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartBadge();

  if (typeof supabaseClient !== 'undefined') {
    try {
      await supabaseClient.from('abandoned_carts').upsert({
        guest_id: getGuestId(),
        cart_items: items,
        updated_at: new Date().toISOString()
      }, { onConflict: 'guest_id' });
    } catch (e) {
      console.warn('Cart sync failed (ignored):', e);
    }
  }
}

function addToCart(item) {
  const items = getCart();
  const existing = items.find(i => i.key === item.key);
  if (existing) existing.quantity += item.quantity;
  else items.push(item);
  saveCart(items);
  return items;
}

function updateCartQty(key, qty) {
  if (qty < 1) return;
  const items = getCart().map(i => i.key === key ? { ...i, quantity: qty } : i);
  saveCart(items);
}

function removeFromCart(key) {
  saveCart(getCart().filter(i => i.key !== key));
}

function clearCart() {
  saveCart([]);
}

function cartTotal() {
  return getCart().reduce((s, i) => s + i.unitPrice * i.quantity, 0);
}

function cartCount() {
  return getCart().reduce((s, i) => s + i.quantity, 0);
}

function updateCartBadge() {
  document.querySelectorAll('[data-cart-count]').forEach(el => {
    const c = cartCount();
    el.textContent = c;
    el.style.display = c > 0 ? 'flex' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', updateCartBadge);