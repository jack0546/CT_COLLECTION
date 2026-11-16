/* ------------------------------------------------------------------
   Supabase browser client with JavaScript Caching
------------------------------------------------------------------ */

const SUPABASE_URL = 'https://jhsmtrmgyhszynyjyhhq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_5EW3tfMqvVCmXHWDJZ4epA_0TjRT_YW';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ------------------------------------------------------------------
   CACHE CONFIGURATION
------------------------------------------------------------------ */
let productCache = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
/* ------------------------------------------------------------------
   HELPER FUNCTIONS
------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------
   DATA FETCHING (with Cache)
------------------------------------------------------------------ */

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
  // 1. Check if we have a valid cache (only for the unfiltered full list)
  const isFiltered = Object.keys(filters).length > 0;
  
  if (!isFiltered && productCache && (Date.now() - cacheTime < CACHE_TTL)) {
    console.log('⚡ Using cached products');
    return productCache;
  }

  // 2. Fetch from Supabase
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
  if (error) { 
    console.error(error); 
    return []; 
  }

  // 3. Save to cache ONLY if it's the full, unfiltered list
  if (!isFiltered) {
    productCache = data || [];
    cacheTime = Date.now();
    console.log('💾 Saved products to cache');
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

/* ------------------------------------------------------------------
   GLOBAL CHAT NOTIFICATION LISTENER
------------------------------------------------------------------ */
async function listenForUnreadChats() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  // Don't run this listener if we are already on the chat page
  if (window.location.pathname.includes('chat.html')) return;

  // 1. Check how many unread messages the user has right now
  const checkUnread = async () => {
    const { count } = await supabaseClient
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('sender', 'admin')
      .eq('is_read', false);

    // Update the App Icon Badge
    if ('setAppBadge' in navigator) {
      if (count > 0) navigator.setAppBadge(count).catch(() => {});
      else navigator.clearAppBadge();
    }
  };

  await checkUnread();

  // 2. Listen for any NEW admin messages coming in
  supabaseClient
    .channel('global-user-chat')
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'chat_messages', 
      filter: `user_id=eq.${user.id}` 
    }, payload => {
      if (payload.new.sender === 'admin') {
        checkUnread();
      }
    })
    .subscribe();
} 

// Start the listener after a short delay to ensure Supabase is loaded
setTimeout(listenForUnreadChats, 1000);