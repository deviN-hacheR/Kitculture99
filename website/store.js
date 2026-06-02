// ===== Shared store — products, stock, pricing =====
// Used by both the storefront (app.js) and the admin panel (admin.js).
// Products are persisted in localStorage so admin changes (availability,
// new stock, prices) are instantly reflected on the storefront.

const STORE_KEY = 'kitculture-products-v1';

// ===== Shared backend (Supabase) =====
// Holds the catalog for ALL devices. Products live in a Postgres table and
// admin-uploaded photos in a public Storage bucket, so changes made in the
// admin panel sync to every device. If these are blank or unreachable, the
// site falls back to this browser's localStorage (offline cache).
const SUPABASE_URL = 'https://yugjonedhgvrppwfjaxt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WP4QTOiAcnHn4dPL81ivBA_iTe58sv0';
const SUPABASE_BUCKET = 'product-photos';

const STORE_CONFIG = {
  businessName: 'KitCulture',
  whatsappNumber: '919072114858',
  instagramHandle: 'kitculture.99',
  currency: '\u20b9', // Indian Rupee
  categories: ['football', 'basketball', 'cricket'],
  sizes: ['S', 'M', 'L', 'XL', 'XXL']
};

function supaConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function supaHeaders(extra) {
  return Object.assign({
    apikey: SUPABASE_ANON_KEY,
    Authorization: 'Bearer ' + SUPABASE_ANON_KEY
  }, extra || {});
}

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: 'Premium Football Jersey',
    category: 'football',
    image: 'images/jersey-1.jpg',
    badge: 'Bestseller',
    price: null,
    available: true,
    description: 'Premium quality jersey. DM on Instagram @kitculture.99 to order.'
  },
  {
    id: 2,
    name: 'Retro Club Kit',
    category: 'football',
    image: 'images/jersey-2.jpg',
    badge: 'New',
    price: null,
    available: true,
    description: 'Classic retro design. Available in multiple sizes. Ships across India.'
  },
  {
    id: 3,
    name: 'Vintage Home Jersey',
    category: 'football',
    image: 'images/jersey-3.jpg',
    badge: null,
    price: null,
    available: true,
    description: 'Thrifted/surplus quality. Limited stock.'
  },
  {
    id: 4,
    name: 'Street Style Jersey',
    category: 'football',
    image: 'images/jersey-4.jpg',
    badge: 'Popular',
    price: null,
    available: true,
    description: 'Bold colors, premium fabric. Perfect for match day and everyday wear.'
  },
  {
    id: 5,
    name: 'Classic Striped Kit',
    category: 'football',
    image: 'images/jersey-5.jpg',
    badge: null,
    price: null,
    available: true,
    description: 'Iconic striped design. Comfortable fit in S\u2013XXL.'
  },
  {
    id: 6,
    name: 'Limited Edition Jersey',
    category: 'football',
    image: 'images/jersey-6.jpg',
    badge: 'Limited',
    price: null,
    available: true,
    description: 'Exclusive drop \u2014 grab it before it sells out.'
  },
  {
    id: 7,
    name: 'Premium Away Kit',
    category: 'football',
    image: 'images/jersey-7.jpg',
    badge: 'New',
    price: null,
    available: true,
    description: 'Fresh away colors with moisture-wicking fabric.'
  },
  {
    id: 8,
    name: 'Fan Favourite Jersey',
    category: 'football',
    image: 'images/jersey-8.jpg',
    badge: null,
    price: null,
    available: true,
    description: 'One of our most loved jerseys. Order via WhatsApp or Instagram DM.'
  }
];

// Normalize a stored/seed product so every field exists.
function normalizeProduct(p) {
  return {
    id: p.id,
    name: p.name || 'Untitled',
    category: STORE_CONFIG.categories.includes(p.category) ? p.category : 'football',
    image: p.image || '',
    badge: p.badge || null,
    price: (p.price === 0 || p.price) ? p.price : null,
    available: p.available !== false,
    description: p.description || ''
  };
}

function loadProducts() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map(normalizeProduct);
      }
    }
  } catch (e) {
    // fall through to seeding
  }
  const seeded = DEFAULT_PRODUCTS.map(normalizeProduct);
  saveProducts(seeded);
  return seeded;
}

function saveProducts(products) {
  localStorage.setItem(STORE_KEY, JSON.stringify(products));
}

function nextProductId(products) {
  return products.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;
}

// Resolve an image reference to an absolute, shareable URL when possible.
// Relative paths become absolute http(s) URLs; data: URLs are returned as-is.
function absoluteImageUrl(image) {
  if (!image) return '';
  if (/^(https?:|data:)/i.test(image)) return image;
  try {
    return new URL(image, window.location.href).href;
  } catch (e) {
    return image;
  }
}

function formatPrice(price) {
  if (price === null || price === undefined || price === '') return '';
  const num = Number(price);
  if (Number.isNaN(num)) return '';
  return STORE_CONFIG.currency + num.toLocaleString('en-IN');
}

// ===== Shared backend API (Supabase REST + Storage) =====
const ADMIN_PASSWORD = 'nsk';

// Fetch the shared catalog from Supabase and cache it for instant/offline loads.
async function fetchProductsFromApi() {
  if (!supaConfigured()) throw new Error('Supabase not configured');
  const res = await fetch(
    SUPABASE_URL + '/rest/v1/products?select=*&order=id.asc',
    { headers: supaHeaders(), cache: 'no-store' }
  );
  if (!res.ok) throw new Error('Failed to load products (' + res.status + ')');
  const rows = await res.json();
  const products = (Array.isArray(rows) ? rows : []).map(normalizeProduct);
  saveProducts(products); // cache for offline / instant render
  return products;
}

// Upload a photo to the public Storage bucket and return its public URL.
async function uploadProductPhoto(file) {
  const ext = (file.name && file.name.indexOf('.') >= 0)
    ? file.name.split('.').pop().toLowerCase()
    : 'jpg';
  const path = Date.now() + '-' + Math.random().toString(36).slice(2, 10) + '.' + ext;
  const res = await fetch(
    SUPABASE_URL + '/storage/v1/object/' + SUPABASE_BUCKET + '/' + path,
    {
      method: 'POST',
      headers: supaHeaders({
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'true'
      }),
      body: file
    }
  );
  if (!res.ok) throw new Error('Photo upload failed (' + res.status + ')');
  return SUPABASE_URL + '/storage/v1/object/public/' + SUPABASE_BUCKET + '/' + path;
}

async function apiAddProduct({ name, price, category, badge, description, file }) {
  if (!supaConfigured()) throw new Error('Supabase not configured');
  const imageUrl = await uploadProductPhoto(file);
  const row = {
    name: name || 'Untitled',
    category: STORE_CONFIG.categories.includes(category) ? category : 'football',
    image: imageUrl,
    badge: badge || null,
    price: (price === null || price === undefined || price === '') ? null : Number(price),
    available: true,
    description: description || 'New arrival. DM @kitculture.99 to order.'
  };
  const res = await fetch(SUPABASE_URL + '/rest/v1/products', {
    method: 'POST',
    headers: supaHeaders({ 'Content-Type': 'application/json', Prefer: 'return=representation' }),
    body: JSON.stringify(row)
  });
  if (!res.ok) throw new Error('Add failed (' + res.status + ')');
  return (await res.json())[0];
}

async function apiUpdateProduct(id, changes) {
  if (!supaConfigured()) throw new Error('Supabase not configured');
  const res = await fetch(SUPABASE_URL + '/rest/v1/products?id=eq.' + id, {
    method: 'PATCH',
    headers: supaHeaders({ 'Content-Type': 'application/json', Prefer: 'return=representation' }),
    body: JSON.stringify(changes)
  });
  if (!res.ok) throw new Error('Update failed (' + res.status + ')');
  return (await res.json())[0];
}

async function apiDeleteProduct(id) {
  if (!supaConfigured()) throw new Error('Supabase not configured');
  const res = await fetch(SUPABASE_URL + '/rest/v1/products?id=eq.' + id, {
    method: 'DELETE',
    headers: supaHeaders()
  });
  if (!res.ok) throw new Error('Delete failed (' + res.status + ')');
  return true;
}
