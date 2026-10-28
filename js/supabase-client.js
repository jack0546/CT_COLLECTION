/* ------------------------------------------------------------------
   Supabase browser client with JavaScript Caching
------------------------------------------------------------------ */

const SUPABASE_URL = 'https://sriduasaznesdcemdtmd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2iJDEoJdw8FwC-bQErJFuw_gudotRRq';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- CACHE CONFIGURATION ---
let productCache = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function formatMoney(amount, symbol = '₵') {
  return `${symbol} ${Number(amount).toFixed(2)}`;
}

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function getStoreSettings() {
  const { data, error } = await supabaseClient
    .from('store_settings').select('*').eq('id', 1).single();
  if (error) {
    console.warn('settings load failed', error);
    return {
      store_name: 'Luxe Threads',
      whatsapp_number: '',
      currency_symbol: '₵',
      contact_email: '',
      contact_phone: '',
      social_links: {},
    };
  }
  return data;
}

async function loadProducts(filters = {}) {
  // 1. If we have a valid cache and NO filters applied, return the cache instantly
  if (productCache && (Date.now() - cacheTime < CACHE_TTL) && Object.keys(filters).length === 0) {
    console.log('⚡ Using cached products');
    return productCache;
  }

  // 2. Otherwise, fetch from Supabase
  let q = supabaseClient
    .from('products')
    .select('*, variants(*), variant_images(*), categories(name,slug)')
    .eq('status', 'active');
    
  if (filters.featured) q = q.eq('featured', true);
  if (filters.onSale) q = q.not('sale_price', 'is', null);
  if (filters.categoryId) q = q.eq('category_id', filters.categoryId);
  if (filters.limit) q = q.limit(filters.limit);
  if (filters.order === 'newest') q = q.order('created_at', { ascending: false });
  
  const { data, error } = await q;
  if (error) { console.error(error); return []; }

  // 3. Save to cache ONLY if no filters are applied (cache the full list)
  if (Object.keys(filters).length === 0) {
    productCache = data || [];
    cacheTime = Date.now();
  }

  return data || [];
}

async function loadProductBySlug(slug) {
  const { data, error } = await supabaseClient
    .from('products')
    .select('*, variants(*), variant_images(*), categories(name,slug)')
    .eq('slug', slug).eq('status', 'active').single();
  if (error) { console.error(error); return null; }
  return data;
}

async function loadCategories() {
  const { data } = await supabaseClient.from('categories').select('*').order('sort_order');
  return data || [];
}