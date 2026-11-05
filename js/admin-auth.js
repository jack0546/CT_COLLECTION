/* Shared helpers for admin pages. */

/** Call on every admin page except login. Redirects if not logged in or not an admin. */
async function requireAdmin() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.replace('login.html');
    throw new Error('Not authenticated');
  }

  // 1. Check if the logged-in user has the 'admin' role in the database
  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  // 2. If they are not an admin, block access
  if (error || !profile || profile.role !== 'admin') {
    alert('Access Denied: You are not an administrator.');
    window.location.replace('../index.html'); // Send them back to the storefront
    throw new Error('Not authorized');
  }

  return session;
}

/** Returns current session user or null. */
async function getAdminUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

/** Sign out and redirect to login. */
async function signOutAdmin() {
  await supabaseClient.auth.signOut();
  window.location.replace('login.html');
}

/**
 * Build the shared admin sidebar + topbar shell.
 */
async function mountAdminShell(active) {
  const user = await getAdminUser();
  const shell = document.querySelector('.admin-shell');
  if (!shell) return;

  // PREVENT DUPLICATES: If the sidebar is already there, stop.
  if (document.getElementById('admin-sidebar')) return;

  const mobileBar = document.createElement('div');
  mobileBar.className = 'admin-mobile-bar';
  mobileBar.innerHTML = `
    <span>Admin</span>
    <button aria-label="Menu" id="mobile-menu-btn">☰</button>
  `;

  const sidebar = document.createElement('aside');
  sidebar.className = 'admin-sidebar';
  sidebar.id = 'admin-sidebar';
  sidebar.innerHTML = `
    <div class="brand">Store Admin</div>
    <nav>
      <a href="index.html"      class="${active==='dashboard'?'active':''}">Dashboard</a>
      <a href="pos.html"        class="${active==='pos'?'active':''}">Point of Sale</a>
      <a href="products.html"   class="${active==='products'?'active':''}">Products</a>
      <a href="categories.html" class="${active==='categories'?'active':''}">Categories</a>
      <a href="orders.html"     class="${active==='orders'?'active':''}">Orders</a>
      <a href="customers.html"  class="${active==='customers'?'active':''}">Customers</a>
      <a href="reviews.html"    class="${active==='reviews'?'active':''}">Reviews</a>
      <a href="chat.html"       class="${active==='chat'?'active':''}">Live Chat</a> <!-- ADDED THIS -->
      <a href="settings.html"   class="${active==='settings'?'active':''}">Store Settings</a>
      <a href="../index.html" target="_blank" rel="noopener">View Storefront ↗</a>
    </nav>
    <div class="user-block">
      Signed in as<br>
      <strong style="color:#fff;">${user?.email ?? ''}</strong>
      <br>
      <button id="signout-btn">Sign out</button>
    </div>
  `;

  shell.insertBefore(sidebar, shell.firstChild);
  shell.insertBefore(mobileBar, shell.firstChild);

  document.getElementById('signout-btn')?.addEventListener('click', signOutAdmin);
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('admin-sidebar')?.classList.toggle('open');
  });
}