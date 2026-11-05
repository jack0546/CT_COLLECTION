(async function mountFooter() {
  const settings = await getStoreSettings();
  const el = document.getElementById('site-footer');
  if (!el) return;

  const socials = settings.social_links || {};
  el.innerHTML = `
    <footer class="site-footer">
      <div class="footer-inner">
        <div>
          <h3>${settings.store_name}</h3>
          <p>${settings.store_description || 'Premium fashion crafted for everyday confidence.'}</p>
        </div>
        <div>
          <h4>Shop</h4>
          <ul>
            <li><a href="shop.html">All Products</a></li>
            <li><a href="shop.html?view=new">New Arrivals</a></li>
            <li><a href="shop.html?view=sale">Sale</a></li>
            <li><a href="cart.html">Cart</a></li>
          </ul>
        </div>
        <div>
          <h4>Help</h4>
          <ul>
            <li><a href="contact.html">Contact Us</a></li>
            <li><a href="about.html">About Us</a></li>
            <li><a href="map.html">Find Us on Map</a></li>
            <li><a href="chat.html">Live Chat</a></li>
            <li><a href="privacy.html">Privacy Policy</a></li>
            <li><a href="terms.html">Terms & Conditions</a></li>
            ${settings.delivery_info ? `<li class="muted">${settings.delivery_info}</li>` : ''}
          </ul>
        </div>
        <div>
          <h4>Get in touch</h4>
          <ul>
            ${settings.contact_phone ? `<li><a href="tel:${settings.contact_phone}">${settings.contact_phone}</a></li>` : ''}
            ${settings.contact_email ? `<li><a href="mailto:${settings.contact_email}">${settings.contact_email}</a></li>` : ''}
            ${settings.whatsapp_number ? `<li><a href="https://wa.me/${settings.whatsapp_number.replace(/\D/g,'')}" target="_blank" rel="noopener">WhatsApp Us</a></li>` : ''}
          </ul>
          ${Object.keys(socials).length ? `
            <div class="socials">
              ${Object.entries(socials).map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${n}</a>`).join('')}
            </div>` : ''}
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} ${settings.store_name}. All rights reserved.</span>
        <span>Made with care in Ghana 🇬🇭</span>
      </div>
    </footer>
    
    <!-- Floating Live Chat Button -->
    <a href="chat.html" style="position:fixed; bottom:20px; right:20px; z-index:9999; width:56px; height:56px; border-radius:50%; background:#0a0a0a; color:#fff; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 10px 20px rgba(0,0,0,0.2); text-decoration:none; font-size:24px;">
      💬
    </a>
  `;
})();