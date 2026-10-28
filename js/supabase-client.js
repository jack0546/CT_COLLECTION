/* ------------------------------------------------------------------
   Supabase browser client
------------------------------------------------------------------ */

const SUPABASE_URL = 'https://sriduasaznesdcemdtmd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2iJDEoJdw8FwC-bQErJFuw_gudotRRq';

// Direct connection to Supabase (No caching worker)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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