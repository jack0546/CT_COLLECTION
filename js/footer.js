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
    
    ${settings.whatsapp_number ? `
      <a class="fab-whatsapp" href="${whatsappUrl(settings.whatsapp_number, 'Hello ' + settings.store_name + '! I would like to ask about your products.')}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/>
        </svg>
      </a>` : ''}

    <!-- Customer Live Chat Widget -->
    <button id="chat-toggle" style="position:fixed; bottom:90px; right:20px; z-index:9999; width:56px; height:56px; border-radius:50%; background:#0a0a0a; color:#fff; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 10px 20px rgba(0,0,0,0.2);">
      💬
    </button>

    <div id="chat-box" style="display:none; position:fixed; bottom:160px; right:20px; width:320px; height:400px; background:#fff; border:1px solid #e5e5e5; border-radius:12px; z-index:9999; flex-direction:column; box-shadow:0 10px 30px rgba(0,0,0,0.1);">
      <div style="padding:15px; background:#0a0a0a; color:#fff; border-radius:12px 12px 0 0; display:flex; justify-content:space-between; align-items:center;">
        <strong>Chat with Us</strong>
        <button id="chat-close" style="background:none; border:none; color:#fff; font-size:20px; cursor:pointer;">×</button>
      </div>
      <div id="chat-messages" style="flex:1; padding:15px; overflow-y:auto; display:flex; flex-direction:column; gap:10px; font-size:13px;"></div>
      <div style="padding:10px; border-top:1px solid #eee; display:flex; gap:5px;">
        <input id="chat-input" type="text" placeholder="Type a message..." style="flex:1; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:13px;">
        <button id="chat-send" style="background:#16a34a; color:#fff; border:none; padding:8px 12px; border-radius:6px; cursor:pointer;">Send</button>
      </div>
    </div>
  `;

  // --- CUSTOMER LIVE CHAT LOGIC ---
  const chatToggle = document.getElementById('chat-toggle');
  const chatBox = document.getElementById('chat-box');
  const chatClose = document.getElementById('chat-close');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  const chatMessages = document.getElementById('chat-messages');
  let chatChannel = null;
  let chatUser = null;

  chatToggle.addEventListener('click', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      alert("Please log in to chat with us.");
      return;
    }
    chatUser = user;
    chatBox.style.display = 'flex';
    loadCustomerChat();
  });

  chatClose.addEventListener('click', () => {
    chatBox.style.display = 'none';
    if (chatChannel) {
      supabaseClient.removeChannel(chatChannel);
      chatChannel = null;
    }
  });

  async function loadCustomerChat() {
    const { data: msgs } = await supabaseClient
      .from('chat_messages')
      .select('*')
      .eq('user_id', chatUser.id)
      .order('created_at', { ascending: true });

    chatMessages.innerHTML = '';
    msgs?.forEach(appendMessage);

    if (chatChannel) supabaseClient.removeChannel(chatChannel);
    
    chatChannel = supabaseClient
      .channel('customer-chat')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `user_id=eq.${chatUser.id}`
      }, payload => {
        if (payload.new.sender === 'admin') {
          appendMessage(payload.new);
        }
      })
      .subscribe();
  }

  function appendMessage(msg) {
    const div = document.createElement('div');
    div.style.padding = '8px 12px';
    div.style.borderRadius = '8px';
    div.style.maxWidth = '80%';
    div.style.wordBreak = 'break-word';
    if (msg.sender === 'customer') {
      div.style.background = '#dcfce7';
      div.style.alignSelf = 'flex-end';
    } else {
      div.style.background = '#f3f4f6';
      div.style.alignSelf = 'flex-start';
    }
    div.textContent = msg.message;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  chatSend.addEventListener('click', async () => {
    const text = chatInput.value.trim();
    if (!text || !chatUser) return;
    chatInput.value = '';
    
    await supabaseClient.from('chat_messages').insert({
      user_id: chatUser.id,
      sender: 'customer',
      message: text
    });
    
    appendMessage({ sender: 'customer', message: text });
  });
  
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') chatSend.click();
  });
})();