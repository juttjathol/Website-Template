// Cloudflare Worker Backend API for Luxury Fashion Store
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
        return new Response(JSON.stringify({ status: 'ok', service: 'luxury-fashion-api' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Admin login
      if (path === '/api/admin/login' && request.method === 'POST') {
        return handleAdminLogin(request, env, corsHeaders);
      }

      // Admin check
      if (path === '/api/admin/check' && request.method === 'GET') {
        return handleAdminCheck(request, env, corsHeaders);
      }

      // Products
      if (path === '/api/products' && request.method === 'GET') {
        return handleGetProducts(request, env, corsHeaders);
      }
      if (path === '/api/products' && request.method === 'POST') {
        return handleCreateProduct(request, env, corsHeaders);
      }
      if (path.startsWith('/api/products/') && request.method === 'GET') {
        const id = path.replace('/api/products/', '');
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

      // Orders
      if (path === '/api/orders' && request.method === 'POST') {
        return handleCreateOrder(request, env, corsHeaders);
      }
      if (path === '/api/orders' && request.method === 'GET') {
        return handleGetOrders(request, env, corsHeaders);
      }
      if (path.startsWith('/api/orders/') && request.method === 'GET') {
        const id = path.replace('/api/orders/', '');
        return handleGetOrder(id, env, corsHeaders);
      }

      // Image upload proxy (to Cloudinary)
      if (path === '/api/upload' && request.method === 'POST') {
        return handleImageUpload(request, env, corsHeaders);
      }

      // Settings
      if (path === '/api/settings' && request.method === 'GET') {
        return handleGetSettings(env, corsHeaders);
      }
      if (path === '/api/settings' && request.method === 'PUT') {
        return handleUpdateSettings(request, env, corsHeaders);
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
};

// ============ AUTH ============
async function handleAdminLogin(request, env, corsHeaders) {
  const body = await request.json();
  const { username, password } = body;
  const ADMIN_USER = env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASS = env.ADMIN_PASSWORD || 'luxury2024!';

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = btoa(JSON.stringify({ u: username, t: Date.now() }));
    return new Response(JSON.stringify({ token, message: 'Login successful' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleAdminCheck(request, env, corsHeaders) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  try {
    const tokenData = JSON.parse(atob(auth.replace('Bearer ', '')));
    if (tokenData.u === (env.ADMIN_USERNAME || 'admin')) {
      return new Response(JSON.stringify({ authenticated: true, user: tokenData.u }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

function requireAdmin(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth) return false;
  try {
    const data = JSON.parse(atob(auth.replace('Bearer ', '')));
    return data.u === (env.ADMIN_USERNAME || 'admin');
  } catch {
    return false;
  }
}

// ============ PRODUCTS ============
async function handleGetProducts(request, env, corsHeaders) {
  const products = await env.FASHION_KV.get('products', 'json');
  return new Response(JSON.stringify({ products: products || [] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleGetProduct(id, env, corsHeaders) {
  const products = await env.FASHION_KV.get('products', 'json') || [];
  const product = products.find(p => p.id === id);
  if (!product) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ product }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleCreateProduct(request, env, corsHeaders) {
  if (!requireAdmin(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const body = await request.json();
  const products = await env.FASHION_KV.get('products', 'json') || [];
  const newProduct = {
    id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    ...body,
    createdAt: new Date().toISOString(),
  };
  products.push(newProduct);
  await env.FASHION_KV.put('products', JSON.stringify(products));
  return new Response(JSON.stringify({ product: newProduct, message: 'Created' }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleUpdateProduct(id, request, env, corsHeaders) {
  if (!requireAdmin(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const body = await request.json();
  const products = await env.FASHION_KV.get('products', 'json') || [];
  const index = products.findIndex(p => p.id === id);
  if (index === -1) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  products[index] = { ...products[index], ...body, updatedAt: new Date().toISOString() };
  await env.FASHION_KV.put('products', JSON.stringify(products));
  return new Response(JSON.stringify({ product: products[index], message: 'Updated' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleDeleteProduct(id, request, env, corsHeaders) {
  if (!requireAdmin(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const products = await env.FASHION_KV.get('products', 'json') || [];
  const product = products.find(p => p.id === id);
  const updated = products.filter(p => p.id !== id);
  await env.FASHION_KV.put('products', JSON.stringify(updated));

  // Delete from Cloudinary if imageUrl exists
  if (product && product.imageUrl && env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    try {
      // Cloudinary delete via API - best effort
      const publicId = extractPublicId(product.imageUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId, env);
      }
    } catch (e) {
      // Log but don't fail
      console.log('Cloudinary delete failed:', e);
    }
  }

  return new Response(JSON.stringify({ message: 'Deleted', deletedImage: product?.imageUrl || null }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function extractPublicId(url) {
  try {
    const match = url.match(/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
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

  return fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/destroy`, {
    method: 'POST',
    body: form,
  });
}

// ============ ORDERS ============
async function handleCreateOrder(request, env, corsHeaders) {
  const body = await request.json();
  const orders = await env.FASHION_KV.get('orders', 'json') || [];
  const newOrder = {
    id: 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    ...body,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  orders.push(newOrder);
  await env.FASHION_KV.put('orders', JSON.stringify(orders));

  // Send email notification via SendGrid
  await sendOrderEmail(newOrder, env);

  return new Response(JSON.stringify({ order: newOrder, message: 'Order created' }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleGetOrders(request, env, corsHeaders) {
  if (!requireAdmin(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const orders = await env.FASHION_KV.get('orders', 'json') || [];
  return new Response(JSON.stringify({ orders }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleGetOrder(id, env, corsHeaders) {
  const orders = await env.FASHION_KV.get('orders', 'json') || [];
  const order = orders.find(o => o.id === id);
  if (!order) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ order }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============ EMAIL (SendGrid) ============
async function sendOrderEmail(order, env) {
  const SENDGRID_KEY = env.SENDGRID_API_KEY;
  if (!SENDGRID_KEY) return; // Skip if not configured

  const itemsHtml = (order.items || []).map(item => `
    <tr style="border-bottom:1px solid #eee;">
      <td style="padding:12px;">${item.name}</td>
      <td style="padding:12px;text-align:center;">${item.quantity}</td>
      <td style="padding:12px;text-align:right;">$${item.price}</td>
    </tr>
  `).join('');

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
    </div>
  `;

  const payload = {
    personalizations: [{ to: [{ email: order.customer?.email || env.ADMIN_EMAIL || 'admin@example.com' }] }],
    from: { email: env.SENDGRID_FROM || 'orders@luxuryfashion.com', name: 'Luxury Fashion Store' },
    subject: `Order Confirmed — #${order.id}`,
    content: [{ type: 'text/html', value: html }, { type: 'text/plain', value: `Order confirmed ${order.id}. Total: $${total.toFixed(2)}` }],
  };

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const result = await res.text();
    console.log('SendGrid response:', res.status, result);
  } catch (e) {
    console.error('SendGrid error:', e);
  }
}

// ============ IMAGE UPLOAD ============
async function handleImageUpload(request, env, corsHeaders) {
  if (!requireAdmin(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  try {
    const body = await request.formData();
    const file = body.get('file');
    if (!file || !file.arrayBuffer) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const buffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    // Upload to Cloudinary
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

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      body: uploadForm,
    });
    const uploadData = await uploadRes.json();

    if (uploadData.secure_url) {
      return new Response(JSON.stringify({ url: uploadData.secure_url, public_id: uploadData.public_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'Upload failed', details: uploadData }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// ============ SETTINGS ============
async function handleGetSettings(env, corsHeaders) {
  const settings = await env.FASHION_KV.get('settings', 'json') || {
    storeName: 'Maison d\'Or',
    currency: 'USD',
    emailEnabled: false,
  };
  return new Response(JSON.stringify(settings), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleUpdateSettings(request, env, corsHeaders) {
  if (!requireAdmin(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const body = await request.json();
  await env.FASHION_KV.put('settings', JSON.stringify(body));
  return new Response(JSON.stringify({ message: 'Updated', settings: body }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
