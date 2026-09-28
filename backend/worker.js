// Cloudflare Worker Backend API for Luxury Fashion Store
// Fully modular — easy to add new endpoints by following the pattern below
// Uses KV for data, Cloudinary for images, SendGrid for email

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (path === '/api/health') {
        return new Response(JSON.stringify({ status: 'ok', service: 'luxury-fashion-api', endpoints: ['products','orders','reviews','wishlist','search','contact','newsletter','featured','categories','upload','settings','customers','promotions','analytics'] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ================= AUTH =================
      if (path === '/api/admin/login' && request.method === 'POST') return handleAdminLogin(request, env, corsHeaders);
      if (path === '/api/admin/check' && request.method === 'GET') return handleAdminCheck(request, env, corsHeaders);

      // ================= PRODUCTS =================
      if (path === '/api/products' && request.method === 'GET') return handleGetProducts(request, env, corsHeaders);
      if (path === '/api/products' && request.method === 'POST') return handleCreateProduct(request, env, corsHeaders);
      if (path.startsWith('/api/products/') && request.method === 'GET') {
        const id = path.replace('/api/products/', '').split('/')[0];
        return handleGetProduct(id, env, corsHeaders);
      }
      if (path.startsWith('/api/products/') && request.method === 'PUT') {
        const id = path.replace('/api/products/', '').split('/')[0];
        return handleUpdateProduct(id, request, env, corsHeaders);
      }
      if (path.startsWith('/api/products/') && request.method === 'DELETE') {
        const id = path.replace('/api/products/', '').split('/')[0];
        return handleDeleteProduct(id, request, env, corsHeaders);
      }

      // ================= ORDERS =================
      if (path === '/api/orders' && request.method === 'POST') return handleCreateOrder(request, env, corsHeaders);
      if (path === '/api/orders' && request.method === 'GET') return handleGetOrders(request, env, corsHeaders);
      if (path.startsWith('/api/orders/') && request.method === 'GET') {
        const id = path.replace('/api/orders/', '');
        return handleGetOrder(id, env, corsHeaders);
      }

      // ================= SEARCH =================
      if (path === '/api/search' && request.method === 'GET') return handleSearch(request, env, corsHeaders);

      // ================= CATEGORIES =================
      if (path === '/api/categories' && request.method === 'GET') return handleGetCategories(env, corsHeaders);

      // ================= FEATURED =================
      if (path === '/api/featured' && request.method === 'GET') return handleGetFeatured(env, corsHeaders);

      // ================= REVIEWS =================
      if (path === '/api/reviews' && request.method === 'GET') return handleGetReviews(env, corsHeaders);
      if (path === '/api/reviews' && request.method === 'POST') return handleCreateReview(request, env, corsHeaders);
      if (path === '/api/reviews/product/' && request.method === 'GET') {
        const query = url.searchParams.get('id');
        return handleGetReviewsByProduct(query, env, corsHeaders);
      }

      // ================= WISHLIST =================
      if (path === '/api/wishlist' && request.method === 'GET') return handleGetWishlist(request, env, corsHeaders);
      if (path === '/api/wishlist' && request.method === 'POST') return handleUpdateWishlist(request, env, corsHeaders);
      if (path === '/api/wishlist' && request.method === 'DELETE') return handleClearWishlist(request, env, corsHeaders);

      // ================= CONTACT =================
      if (path === '/api/contact' && request.method === 'POST') return handleContactForm(request, env, corsHeaders);

      // ================= NEWSLETTER =================
      if (path === '/api/newsletter' && request.method === 'POST') return handleNewsletterSignup(request, env, corsHeaders);

      // ================= UPLOAD =================
      if (path === '/api/upload' && request.method === 'POST') return handleImageUpload(request, env, corsHeaders);

      // ================= PRODUCT GALLERY =================
      if (path.startsWith('/api/products/') && path.endsWith('/images') && request.method === 'GET') {
        const id = path.replace('/api/products/', '').replace('/images', '');
        return handleGetProductImages(id, env, corsHeaders);
      }
      if (path === '/api/products/images' && request.method === 'POST') {
        const urlObj = new URL(request.url);
        const id = urlObj.searchParams.get('id');
        return handleAddProductImage(id, request, env, corsHeaders);
      }

      // ================= RELATED PRODUCTS =================
      if (path === '/api/products/related' && request.method === 'GET') return handleGetRelatedProducts(request, env, corsHeaders);

      // ================= BACK IN STOCK =================
      if (path === '/api/back-in-stock' && request.method === 'POST') return handleBackInStock(request, env, corsHeaders);
      if (path === '/api/back-in-stock' && request.method === 'GET') return handleGetBackInStock(env, corsHeaders);

      // ================= GIFT WRAPPING =================
      if (path === '/api/orders/gift' && request.method === 'PUT') return handleGiftWrapOrder(request, env, corsHeaders);

      // ================= SHIPPING =================
      if (path === '/api/shipping' && request.method === 'GET') return handleGetShipping(env, corsHeaders);
      if (path === '/api/shipping' && request.method === 'POST') return handleCreateShippingOption(request, env, corsHeaders);

      // ================= RETURNS =================
      if (path === '/api/returns' && request.method === 'GET') return handleGetReturns(env, corsHeaders);
      if (path === '/api/returns' && request.method === 'POST') return handleCreateReturn(request, env, corsHeaders);
      if (path === '/api/returns/update' && request.method === 'PUT') return handleUpdateReturn(request, env, corsHeaders);

      // ================= CUSTOMERS =================
      if (path === '/api/customers/register' && request.method === 'POST') return handleCustomerRegister(request, env, corsHeaders);
      if (path === '/api/customers/login' && request.method === 'POST') return handleCustomerLogin(request, env, corsHeaders);
      if (path === '/api/customers/orders' && request.method === 'GET') return handleGetCustomerOrders(request, env, corsHeaders);

      // ================= PROMOTIONS =================
      if (path === '/api/promotions' && request.method === 'GET') return handleGetPromotions(env, corsHeaders);
      if (path === '/api/promotions' && request.method === 'POST') return handleCreatePromotion(request, env, corsHeaders);
      if (path === '/api/promotions/apply' && request.method === 'POST') return handleApplyPromotion(request, env, corsHeaders);
      if (path === '/api/promotions' && request.method === 'DELETE') return handleDeletePromotion(request, env, corsHeaders);

      // ================= ANALYTICS =================
      if (path === '/api/analytics' && request.method === 'GET') return handleAnalytics(env, corsHeaders);

      // ================= SETTINGS =================
      if (path === '/api/settings' && request.method === 'GET') return handleGetSettings(env, corsHeaders);
      if (path === '/api/settings' && request.method === 'PUT') return handleUpdateSettings(request, env, corsHeaders);

      // Not found
      return new Response(JSON.stringify({ error: 'Not found', available: ['/api/health','/api/products','/api/orders','/api/search','/api/categories','/api/featured','/api/reviews','/api/wishlist','/api/contact','/api/newsletter','/api/upload','/api/settings'] }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message, stack: e.stack }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
};

// ============================================
// AUTH
// ============================================
async function handleAdminLogin(request, env, corsHeaders) {
  const body = await request.json();
  const { username, password } = body;
  const ADMIN_USER = env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASS = env.ADMIN_PASSWORD || 'luxury2024!';
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = btoa(JSON.stringify({ u: username, t: Date.now() }));
    return new Response(JSON.stringify({ token, message: 'Login successful' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleAdminCheck(request, env, corsHeaders) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return new Response(JSON.stringify({ authenticated: false }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  try {
    const tokenData = JSON.parse(atob(auth.replace('Bearer ', '')));
    if (tokenData.u === (env.ADMIN_USERNAME || 'admin')) return new Response(JSON.stringify({ authenticated: true, user: tokenData.u }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify({ authenticated: false }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch { return new Response(JSON.stringify({ authenticated: false }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
}

function requireAdmin(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth) return false;
  try { const data = JSON.parse(atob(auth.replace('Bearer ', ''))); return data.u === (env.ADMIN_USERNAME || 'admin'); } catch { return false; }
}

// ============================================
// PRODUCTS
// ============================================
async function handleGetProducts(request, env, corsHeaders) {
  const products = await env.FASHION_KV.get('products', 'json');
  return new Response(JSON.stringify({ products: products || [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleGetProduct(id, env, corsHeaders) {
  const products = await env.FASHION_KV.get('products', 'json') || [];
  const product = products.find(p => p.id === id);
  if (!product) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  return new Response(JSON.stringify({ product }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleCreateProduct(request, env, corsHeaders) {
  if (!requireAdmin(request, env)) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const body = await request.json();
  const products = await env.FASHION_KV.get('products', 'json') || [];
  const newProduct = { id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), ...body, createdAt: new Date().toISOString(), featured: body.featured || false };
  products.push(newProduct);
  await env.FASHION_KV.put('products', JSON.stringify(products));
      return new Response(JSON.stringify({ product: newProduct, message: 'Created' }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ============================================
// PRODUCT GALLERY / MULTIPLE IMAGES
// ============================================
async function handleGetProductImages(id, env, corsHeaders) {
  const products = await env.FASHION_KV.get('products', 'json') || [];
  const product = products.find(p => p.id === id);
  if (!product) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  return new Response(JSON.stringify({ productId: id, images: product.images || [product.imageUrl], mainImage: product.imageUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleAddProductImage(id, request, env, corsHeaders) {
  if (!requireAdmin(request, env)) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const body = await request.formData();
  const file = body.get('file');
  if (!file || !file.arrayBuffer) return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const buffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  const uploadUrl = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`;
  const timestamp = Math.round(Date.now() / 1000);
  const toSign = `timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
  const sigBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(toSign));
  const signature = Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  const uploadForm = new URLSearchParams();
  uploadForm.append('file', 'data:image/jpeg;base64,' + base64);
  uploadForm.append('api_key', env.CLOUDINARY_API_KEY);
  uploadForm.append('timestamp', String(timestamp));
  uploadForm.append('signature', signature);
  uploadForm.append('folder', 'fashion_items');
  const uploadRes = await fetch(uploadUrl, { method: 'POST', body: uploadForm });
  const uploadData = await uploadRes.json();
  if (!uploadData.secure_url) return new Response(JSON.stringify({ error: 'Upload failed', details: uploadData }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const products = await env.FASHION_KV.get('products', 'json') || [];
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const images = products[index].images || (products[index].imageUrl ? [products[index].imageUrl] : []);
  if (!images.includes(uploadData.secure_url)) images.push(uploadData.secure_url);
  products[index].images = images;
  await env.FASHION_KV.put('products', JSON.stringify(products));
  return new Response(JSON.stringify({ url: uploadData.secure_url, images }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleUpdateProduct(id, request, env, corsHeaders) {
  if (!requireAdmin(request, env)) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const body = await request.json();
  const products = await env.FASHION_KV.get('products', 'json') || [];
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  products[index] = { ...products[index], ...body, updatedAt: new Date().toISOString() };
  await env.FASHION_KV.put('products', JSON.stringify(products));
  return new Response(JSON.stringify({ product: products[index], message: 'Updated' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleDeleteProduct(id, request, env, corsHeaders) {
  if (!requireAdmin(request, env)) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const products = await env.FASHION_KV.get('products', 'json') || [];
  const product = products.find(p => p.id === id);
  const updated = products.filter(p => p.id !== id);
  await env.FASHION_KV.put('products', JSON.stringify(updated));
  if (product && product.imageUrl && env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    try { const publicId = extractPublicId(product.imageUrl); if (publicId) await deleteFromCloudinary(publicId, env); } catch (e) { console.log('Cloudinary delete failed:', e); }
  }
  return new Response(JSON.stringify({ message: 'Deleted', deletedImage: product?.imageUrl || null }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ============================================
// SEARCH
// ============================================
async function handleSearch(request, env, corsHeaders) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  const products = await env.FASHION_KV.get('products', 'json') || [];
  const results = products.filter(p => {
    const text = (p.name + ' ' + p.category + ' ' + (p.desc || '')).toLowerCase();
    return text.includes(q.toLowerCase());
  });
  return new Response(JSON.stringify({ query: q, results, count: results.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ============================================
// CATEGORIES
// ============================================
async function handleGetCategories(env, corsHeaders) {
  const products = await env.FASHION_KV.get('products', 'json') || [];
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  return new Response(JSON.stringify({ categories }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ============================================
// FEATURED
// ============================================
async function handleGetFeatured(env, corsHeaders) {
  const products = await env.FASHION_KV.get('products', 'json') || [];
  const featured = products.filter(p => p.featured === true);
  return new Response(JSON.stringify({ featured: featured.length ? featured : products.slice(0, 3) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ============================================
// REVIEWS
// ============================================
async function handleGetReviews(env, corsHeaders) {
  const reviews = await env.FASHION_KV.get('reviews', 'json') || [];
  return new Response(JSON.stringify({ reviews }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleGetReviewsByProduct(productId, env, corsHeaders) {
  if (!productId) return new Response(JSON.stringify({ error: 'Missing product id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const reviews = await env.FASHION_KV.get('reviews', 'json') || [];
  const productReviews = reviews.filter(r => r.productId === productId);
  return new Response(JSON.stringify({ productId, reviews: productReviews, count: productReviews.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleCreateReview(request, env, corsHeaders) {
  const body = await request.json();
  const reviews = await env.FASHION_KV.get('reviews', 'json') || [];
  const newReview = {
    id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    ...body,
    createdAt: new Date().toISOString(),
  };
  reviews.push(newReview);
  await env.FASHION_KV.put('reviews', JSON.stringify(reviews));
  return new Response(JSON.stringify({ review: newReview, message: 'Review added' }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ============================================
// WISHLIST
// ============================================
async function handleGetWishlist(request, env, corsHeaders) {
  const sessionId = request.headers.get('X-Session-ID') || 'default';
  const wishlistKey = 'wishlist_' + sessionId;
  const wishlist = await env.FASHION_KV.get(wishlistKey, 'json') || [];
  return new Response(JSON.stringify({ wishlist, sessionId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleUpdateWishlist(request, env, corsHeaders) {
  const sessionId = request.headers.get('X-Session-ID') || 'default';
  const wishlistKey = 'wishlist_' + sessionId;
  const body = await request.json();
  const products = await env.FASHION_KV.get('products', 'json') || [];
  const product = products.find(p => p.id === body.productId);
  if (!product) return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  let wishlist = await env.FASHION_KV.get(wishlistKey, 'json') || [];
  if (body.action === 'add') {
    if (!wishlist.find(w => w.id === product.id)) wishlist.push({ id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl, addedAt: new Date().toISOString() });
  } else if (body.action === 'remove') {
    wishlist = wishlist.filter(w => w.id !== body.productId);
  }
  await env.FASHION_KV.put(wishlistKey, JSON.stringify(wishlist));
  return new Response(JSON.stringify({ wishlist, message: 'Wishlist updated', sessionId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleClearWishlist(request, env, corsHeaders) {
  const sessionId = request.headers.get('X-Session-ID') || 'default';
  await env.FASHION_KV.put('wishlist_' + sessionId, JSON.stringify([]));
  return new Response(JSON.stringify({ message: 'Wishlist cleared', sessionId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ============================================
// CONTACT
// ============================================
async function handleContactForm(request, env, corsHeaders) {
  const body = await request.json();
  const contacts = await env.FASHION_KV.get('contacts', 'json') || [];
  const newContact = { id: 'contact_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  contacts.push(newContact);
  await env.FASHION_KV.put('contacts', JSON.stringify(contacts));
  // Optional: send admin notification
  return new Response(JSON.stringify({ message: 'Thank you. We will respond shortly.', contact: newContact }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ============================================
// NEWSLETTER
// ============================================
async function handleNewsletterSignup(request, env, corsHeaders) {
  const body = await request.json();
  const subscribers = await env.FASHION_KV.get('subscribers', 'json') || [];
  if (!subscribers.find(s => s.email === body.email)) {
    subscribers.push({ email: body.email, name: body.name || '', subscribedAt: new Date().toISOString() });
    await env.FASHION_KV.put('subscribers', JSON.stringify(subscribers));
  }
  return new Response(JSON.stringify({ message: 'Subscribed successfully', email: body.email }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ============================================
// ORDERS
// ============================================
async function handleCreateOrder(request, env, corsHeaders) {
  const body = await request.json();
  const orders = await env.FASHION_KV.get('orders', 'json') || [];
  const newOrder = { id: 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), ...body, status: 'pending', createdAt: new Date().toISOString() };
  orders.push(newOrder);
  await env.FASHION_KV.put('orders', JSON.stringify(orders));
  // Decrease inventory
  await updateInventoryForOrder(newOrder, env, -1);
  await sendOrderEmail(newOrder, env);
  return new Response(JSON.stringify({ order: newOrder, message: 'Order created' }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleGetOrders(request, env, corsHeaders) {
  if (!requireAdmin(request, env)) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const orders = await env.FASHION_KV.get('orders', 'json') || [];
  return new Response(JSON.stringify({ orders }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleGetOrder(id, env, corsHeaders) {
  const orders = await env.FASHION_KV.get('orders', 'json') || [];
  const order = orders.find(o => o.id === id);
  if (!order) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  return new Response(JSON.stringify({ order }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ============================================
// EMAIL (SendGrid)
// ============================================
async function sendOrderEmail(order, env) {
  const SENDGRID_KEY = env.SENDGRID_API_KEY;
  if (!SENDGRID_KEY) return;
  const itemsHtml = (order.items || []).map(item => `<tr style="border-bottom:1px solid #eee;"><td style="padding:12px;">${item.name}</td><td style="padding:12px;text-align:center;">${item.quantity}</td><td style="padding:12px;text-align:right;">$${item.price}</td></tr>`).join('');
  const total = (order.items || []).reduce((sum, i) => sum + i.price * i.quantity, 0);
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px;background:#0a0a0a;color:#f5f5f5;">
      <h1 style="color:#d4af37;font-family:serif;font-weight:normal;letter-spacing:4px;text-transform:uppercase;margin-bottom:30px;">LUXE ORDER CONFIRMED</h1>
      <p style="font-size:16px;color:#ccc;line-height:1.6;">Thank you for your order, <strong style="color:#fff;">${order.customer?.name || 'Valued Customer'}</strong>.</p>
      <p style="font-size:14px;color:#888;">Order #${order.id}</p>
      <table style="width:100%;margin:30px 0;border-collapse:collapse;">${itemsHtml}</table>
      <h2 style="text-align:right;color:#d4af37;font-family:serif;font-weight:normal;border-top:2px solid #333;padding-top:20px;">Total: $${total.toFixed(2)}</h2>
      <p style="font-size:14px;color:#888;margin-top:30px;padding-top:20px;border-top:1px solid #222;">Shipping to: ${order.customer?.address || 'Your delivery address'}<br/>A confirmation will follow shortly.</p>
      <p style="font-size:12px;color:#555;margin-top:40px;text-align:center;">Luxury Fashion Store — Where elegance meets craft.</p>
    </div>`;
  const payload = {
    personalizations: [{ to: [{ email: order.customer?.email || env.ADMIN_EMAIL || 'admin@example.com' }] }],
    from: { email: env.SENDGRID_FROM || 'orders@luxuryfashion.com', name: 'Luxury Fashion Store' },
    subject: `Order Confirmed — #${order.id}`,
    content: [{ type: 'text/html', value: html }, { type: 'text/plain', value: `Order confirmed ${order.id}. Total: $${total.toFixed(2)}` }],
  };
  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', { method: 'POST', headers: { 'Authorization': `Bearer ${SENDGRID_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    console.log('SendGrid response:', res.status);
  } catch (e) { console.error('SendGrid error:', e); }
}

// ============================================
// IMAGE UPLOAD
// ============================================
async function handleImageUpload(request, env, corsHeaders) {
  if (!requireAdmin(request, env)) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  try {
    const body = await request.formData();
    const file = body.get('file');
    if (!file || !file.arrayBuffer) return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const buffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const uploadUrl = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`;
    const timestamp = Math.round(Date.now() / 1000);
    const toSign = `timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
    const sigBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(toSign));
    const signature = Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    const uploadForm = new URLSearchParams();
    uploadForm.append('file', 'data:image/jpeg;base64,' + base64);
    uploadForm.append('api_key', env.CLOUDINARY_API_KEY);
    uploadForm.append('timestamp', String(timestamp));
    uploadForm.append('signature', signature);
    uploadForm.append('folder', 'fashion_items');
    const uploadRes = await fetch(uploadUrl, { method: 'POST', body: uploadForm });
    const uploadData = await uploadRes.json();
    if (uploadData.secure_url) return new Response(JSON.stringify({ url: uploadData.secure_url, public_id: uploadData.public_id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify({ error: 'Upload failed', details: uploadData }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
}

// ============================================
// SETTINGS
// ============================================
async function handleGetSettings(env, corsHeaders) {
  const settings = await env.FASHION_KV.get('settings', 'json') || { storeName: "Maison d'Or", currency: 'USD', emailEnabled: false };
  return new Response(JSON.stringify(settings), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleUpdateSettings(request, env, corsHeaders) {
  if (!requireAdmin(request, env)) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const body = await request.json();
  await env.FASHION_KV.put('settings', JSON.stringify(body));
  return new Response(JSON.stringify({ message: 'Updated', settings: body }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ============================================
// SHIPPING
// ============================================
async function handleGetShipping(env, corsHeaders) {
  const options = await env.FASHION_KV.get('shipping_options', 'json') || [
    { id: 'ship_std', name: 'Standard Shipping', price: 15, days: '3-5 business days', description: 'Reliable ground delivery' },
    { id: 'ship_exp', name: 'Express Shipping', price: 35, days: '1-2 business days', description: 'Priority delivery' },
    { id: 'ship_intl', name: 'International', price: 75, days: '7-12 business days', description: 'Worldwide luxury delivery' },
  ];
  return new Response(JSON.stringify({ options }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleCreateShippingOption(request, env, corsHeaders) {
  if (!requireAdmin(request, env)) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const body = await request.json();
  const options = await env.FASHION_KV.get('shipping_options', 'json') || [];
  const option = {
    id: 'ship_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    name: body.name || 'Custom',
    price: body.price || 0,
    days: body.days || 'TBD',
    description: body.description || '',
    active: body.active !== false,
  };
  options.push(option);
  await env.FASHION_KV.put('shipping_options', JSON.stringify(options));
  return new Response(JSON.stringify({ option, message: 'Shipping option created' }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ============================================
// INVENTORY (updated in order creation and returns)
// ============================================
async function updateInventoryForOrder(order, env, delta) {
  const products = await env.FASHION_KV.get('products', 'json') || [];
  for (const item of (order.items || [])) {
    const prod = products.find(p => p.id === item.id);
    if (prod) {
      const currentStock = prod.stock || 0;
      prod.stock = Math.max(0, currentStock + delta);
    }
  }
  await env.FASHION_KV.put('products', JSON.stringify(products));
}

// ============================================
// RETURNS
// ============================================
async function handleGetReturns(env, corsHeaders) {
  if (!requireAdmin(request, env)) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const returns = await env.FASHION_KV.get('returns', 'json') || [];
  return new Response(JSON.stringify({ returns }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleCreateReturn(request, env, corsHeaders) {
  const customerId = requireCustomer(request);
  const body = await request.json();
  const returns = await env.FASHION_KV.get('returns', 'json') || [];
  const newReturn = {
    id: 'ret_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    orderId: body.orderId,
    customerId: customerId || (body.customerId || 'guest'),
    reason: body.reason || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  returns.push(newReturn);
  await env.FASHION_KV.put('returns', JSON.stringify(returns));
  return new Response(JSON.stringify({ returnRequest: newReturn, message: 'Return submitted. We will review shortly.' }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleUpdateReturn(request, env, corsHeaders) {
  if (!requireAdmin(request, env)) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const body = await request.json();
  const returns = await env.FASHION_KV.get('returns', 'json') || [];
  const ret = returns.find(r => r.id === body.returnId);
  if (!ret) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  ret.status = body.status || ret.status; // approved / rejected / completed
  ret.processedAt = new Date().toISOString();
  await env.FASHION_KV.put('returns', JSON.stringify(returns));

  // If approved/completed, restore inventory
  if ((body.status === 'approved' || body.status === 'completed') && ret.orderId) {
    const orders = await env.FASHION_KV.get('orders', 'json') || [];
    const order = orders.find(o => o.id === ret.orderId);
    if (order) await updateInventoryForOrder(order, env, +1); // positive delta = restore
  }

  return new Response(JSON.stringify({ returnRequest: ret, message: 'Return updated' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ============================================
// RELATED PRODUCTS
// ============================================
async function handleGetRelatedProducts(request, env, corsHeaders) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || '';
  const excludeId = url.searchParams.get('exclude') || '';
  const products = await env.FASHION_KV.get('products', 'json') || [];
  const related = products.filter(p => p.category === category && p.id !== excludeId).slice(0, 4);
  return new Response(JSON.stringify({ related, count: related.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ============================================
// BACK IN STOCK
// ============================================
async function handleBackInStock(request, env, corsHeaders) {
  const body = await request.json();
  const notifications = await env.FASHION_KV.get('back_in_stock', 'json') || [];
  if (!notifications.find(n => n.productId === body.productId && n.email === body.email)) {
    notifications.push({ productId: body.productId, email: body.email, requestedAt: new Date().toISOString(), notified: false });
    await env.FASHION_KV.put('back_in_stock', JSON.stringify(notifications));
  }
  return new Response(JSON.stringify({ message: 'You will be notified when back in stock.', productId: body.productId }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleGetBackInStock(env, corsHeaders) {
  if (!requireAdmin(request, env)) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const notifications = await env.FASHION_KV.get('back_in_stock', 'json') || [];
  return new Response(JSON.stringify({ notifications }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ============================================
// GIFT WRAPPING
// ============================================
async function handleGiftWrapOrder(request, env, corsHeaders) {
  if (!requireAdmin(request, env)) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const body = await request.json();
  const orders = await env.FASHION_KV.get('orders', 'json') || [];
  const index = orders.findIndex(o => o.id === body.orderId);
  if (index === -1) return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  orders[index].giftWrapped = true;
  orders[index].giftMessage = body.message || '';
  await env.FASHION_KV.put('orders', JSON.stringify(orders));
  return new Response(JSON.stringify({ message: 'Gift wrapping applied', orderId: body.orderId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ============================================
// CUSTOMER ORDER TRACKING
// ============================================
async function handleGetCustomerOrders(request, env, corsHeaders) {
  const customerId = requireCustomer(request);
  if (!customerId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const orders = await env.FASHION_KV.get('orders', 'json') || [];
  const customers = await env.FASHION_KV.get('customers', 'json') || [];
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const customerOrders = orders.filter(o => o.customer?.email === customer.email);
  return new Response(JSON.stringify({ customerId, orders: customerOrders, count: customerOrders.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ============================================
// CUSTOMERS
// ============================================
async function handleCustomerRegister(request, env, corsHeaders) {
  const body = await request.json();
  const customers = await env.FASHION_KV.get('customers', 'json') || [];
  if (customers.find(c => c.email === body.email)) {
    return new Response(JSON.stringify({ error: 'Account exists' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const customer = {
    id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    name: body.name || '',
    email: body.email,
    password: btoa(body.password || 'default'), // basic hash for demo
    createdAt: new Date().toISOString(),
  };
  customers.push(customer);
  await env.FASHION_KV.put('customers', JSON.stringify(customers));
  return new Response(JSON.stringify({ customer: { id: customer.id, name: customer.name, email: customer.email }, message: 'Registered' }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleCustomerLogin(request, env, corsHeaders) {
  const body = await request.json();
  const customers = await env.FASHION_KV.get('customers', 'json') || [];
  const customer = customers.find(c => c.email === body.email && atob(c.password || '') === (body.password || ''));
  if (!customer) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const token = btoa(JSON.stringify({ u: customer.id, t: Date.now(), type: 'customer' }));
  return new Response(JSON.stringify({ token, customer: { id: customer.id, name: customer.name, email: customer.email }, message: 'Login successful' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function requireCustomer(request) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const data = JSON.parse(atob(auth.replace('Bearer ', '')));
    if (data.type === 'customer') return data.u;
    return null;
  } catch { return null; }
}

// ============================================
// PROMOTIONS
// ============================================
async function handleGetPromotions(env, corsHeaders) {
  const promotions = await env.FASHION_KV.get('promotions', 'json') || [];
  return new Response(JSON.stringify({ promotions }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleCreatePromotion(request, env, corsHeaders) {
  if (!requireAdmin(request, env)) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const body = await request.json();
  const promotions = await env.FASHION_KV.get('promotions', 'json') || [];
  const promotion = {
    id: 'promo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    code: body.code?.toUpperCase(),
    discountPercent: body.discountPercent || 10,
    active: body.active !== false,
    expiresAt: body.expiresAt || null,
    createdAt: new Date().toISOString(),
  };
  promotions.push(promotion);
  await env.FASHION_KV.put('promotions', JSON.stringify(promotions));
  return new Response(JSON.stringify({ promotion, message: 'Promotion created' }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleApplyPromotion(request, env, corsHeaders) {
  const body = await request.json();
  const promotions = await env.FASHION_KV.get('promotions', 'json') || [];
  const promo = promotions.find(p => p.code === (body.code || '').toUpperCase() && p.active === true);
  if (!promo) return new Response(JSON.stringify({ valid: false, message: 'Invalid or expired code' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return new Response(JSON.stringify({ valid: false, message: 'Code expired' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  return new Response(JSON.stringify({ valid: true, discountPercent: promo.discountPercent, code: promo.code, message: 'Discount applied' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleDeletePromotion(request, env, corsHeaders) {
  if (!requireAdmin(request, env)) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  let promotions = await env.FASHION_KV.get('promotions', 'json') || [];
  promotions = promotions.filter(p => p.code !== code);
  await env.FASHION_KV.put('promotions', JSON.stringify(promotions));
  return new Response(JSON.stringify({ message: 'Promotion deleted', code }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ============================================
// ANALYTICS
// ============================================
async function handleAnalytics(env, corsHeaders) {
  const products = await env.FASHION_KV.get('products', 'json') || [];
  const orders = await env.FASHION_KV.get('orders', 'json') || [];
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalCustomers = (await env.FASHION_KV.get('customers', 'json') || []).length;
  const totalSubscribers = (await env.FASHION_KV.get('subscribers', 'json') || []).length;
  // Top products by orders
  const productCounts = {};
  orders.forEach(o => (o.items || []).forEach(i => { productCounts[i.id] = (productCounts[i.id] || 0) + i.quantity; }));
  const topProducts = Object.entries(productCounts).map(([id, qty]) => {
    const p = products.find(x => x.id === id);
    return { id, name: p?.name || 'Unknown', quantitySold: qty };
  }).sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 5);

  return new Response(JSON.stringify({
    totalProducts: products.length,
    totalOrders,
    totalRevenue,
    avgOrderValue,
    totalCustomers,
    totalSubscribers,
    topProducts,
    metricsUpdatedAt: new Date().toISOString(),
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ============================================
// UTILS
// ============================================
function extractPublicId(url) {
  try { const match = url.match(/upload\/(?:v\d+\/)?(.+)\.\w+$/); return match ? match[1] : null; } catch { return null; }
}

async function deleteFromCloudinary(publicId, env) {
  const timestamp = Math.round(Date.now() / 1000);
  const toSign = `public_id=${publicId}&timestamp=${timestamp}` + env.CLOUDINARY_API_SECRET;
  const signature = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(toSign));
  const sigHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
  const form = new URLSearchParams();
  form.append('public_id', publicId);
  form.append('api_key', env.CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('signature', sigHex);
  return fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/destroy`, { method: 'POST', body: form });
}
