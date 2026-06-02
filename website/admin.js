// ===== Admin panel logic =====
// NOTE: this is a client-side password gate only. It keeps casual visitors out
// of the admin UI, but it is NOT real security — anyone who reads the source can
// see the password. For a public store, move stock management behind a real
// backend with server-side auth.

// ADMIN_PASSWORD is defined in store.js (shared with the backend API calls).
const AUTH_KEY = 'kitculture-admin-auth';

// ===== Elements =====
const adminGate = document.getElementById('adminGate');
const adminDashboard = document.getElementById('adminDashboard');
const adminLogin = document.getElementById('adminLogin');
const adminPassword = document.getElementById('adminPassword');
const adminError = document.getElementById('adminError');
const logoutBtn = document.getElementById('logoutBtn');

const addProductForm = document.getElementById('addProductForm');
const newName = document.getElementById('newName');
const newPrice = document.getElementById('newPrice');
const newCategory = document.getElementById('newCategory');
const newBadge = document.getElementById('newBadge');
const newDescription = document.getElementById('newDescription');
const newPhoto = document.getElementById('newPhoto');
const photoPreview = document.getElementById('photoPreview');
const photoPreviewImg = document.getElementById('photoPreviewImg');

const adminProducts = document.getElementById('adminProducts');
const adminCount = document.getElementById('adminCount');
const toast = document.getElementById('toast');

let pendingPhotoDataUrl = '';
let pendingPhotoFile = null;

// ===== Toast =====
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== Auth =====
function isAuthed() {
  return sessionStorage.getItem(AUTH_KEY) === 'yes';
}

function showDashboard() {
  adminGate.hidden = true;
  adminDashboard.hidden = false;
  renderAdminProducts();
}

function showGate() {
  adminDashboard.hidden = true;
  adminGate.hidden = false;
  adminPassword.value = '';
  adminPassword.focus();
}

adminLogin.addEventListener('submit', (e) => {
  e.preventDefault();
  if (adminPassword.value === ADMIN_PASSWORD) {
    sessionStorage.setItem(AUTH_KEY, 'yes');
    adminError.hidden = true;
    showDashboard();
  } else {
    adminError.hidden = false;
    adminPassword.value = '';
    adminPassword.focus();
  }
});

logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem(AUTH_KEY);
  showGate();
});

// ===== Render product list =====
let adminProductsCache = [];

async function renderAdminProducts() {
  let products;
  try {
    products = await fetchProductsFromApi();
  } catch (e) {
    products = loadProducts();
    showToast('Offline — showing cached catalog');
  }
  adminProductsCache = products;
  adminCount.textContent = `${products.length} item${products.length === 1 ? '' : 's'}`;

  if (!products.length) {
    adminProducts.innerHTML = '<p class="admin-empty">No products yet. Add your first one above.</p>';
    return;
  }

  adminProducts.innerHTML = products.map(p => {
    const priceText = formatPrice(p.price) || '—';
    const available = p.available !== false;
    return `
    <div class="admin-product ${available ? '' : 'is-unavailable'}" data-id="${p.id}">
      <div class="admin-product-img">
        <img src="${p.image}" alt="${escapeHtml(p.name)}">
      </div>
      <div class="admin-product-info">
        <h3>${escapeHtml(p.name)}</h3>
        <p class="admin-product-meta"><span class="admin-product-cat">${p.category}</span> · <span class="admin-product-price">${priceText}</span></p>
        <span class="admin-status ${available ? 'in' : 'out'}">${available ? 'In Stock' : 'Sold Out'}</span>
      </div>
      <div class="admin-product-actions">
        <label class="switch" title="Toggle availability">
          <input type="checkbox" class="avail-toggle" data-id="${p.id}" ${available ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
        <button class="icon-btn delete-btn" data-id="${p.id}" title="Delete product" aria-label="Delete product">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');

  adminProducts.querySelectorAll('.avail-toggle').forEach(toggle => {
    toggle.addEventListener('change', () => {
      toggleAvailability(parseInt(toggle.dataset.id, 10), toggle.checked);
    });
  });

  adminProducts.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteProduct(parseInt(btn.dataset.id, 10));
    });
  });
}

async function toggleAvailability(id, available) {
  const product = adminProductsCache.find(p => p.id === id);
  const label = product ? product.name : 'Product';
  try {
    await apiUpdateProduct(id, { available });
    showToast(`${label} marked ${available ? 'In Stock' : 'Sold Out'}`);
  } catch (e) {
    showToast('Could not update — check connection');
  }
  renderAdminProducts();
}

async function deleteProduct(id) {
  const product = adminProductsCache.find(p => p.id === id);
  const label = product ? product.name : 'this product';
  if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
  try {
    await apiDeleteProduct(id);
    showToast(`${label} deleted`);
  } catch (e) {
    showToast('Could not delete — check connection');
  }
  renderAdminProducts();
}

// ===== Add product =====
newPhoto.addEventListener('change', () => {
  const file = newPhoto.files && newPhoto.files[0];
  if (!file) {
    pendingPhotoDataUrl = '';
    pendingPhotoFile = null;
    photoPreview.hidden = true;
    return;
  }
  pendingPhotoFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    pendingPhotoDataUrl = reader.result;
    photoPreviewImg.src = pendingPhotoDataUrl;
    photoPreview.hidden = false;
  };
  reader.readAsDataURL(file);
});

addProductForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!pendingPhotoFile) {
    showToast('Please choose a product photo');
    return;
  }

  const submitBtn = addProductForm.querySelector('[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  const priceVal = newPrice.value.trim();
  const name = newName.value.trim() || 'Untitled';
  try {
    await apiAddProduct({
      name,
      price: priceVal === '' ? null : Number(priceVal),
      category: newCategory.value,
      badge: newBadge.value.trim() || null,
      description: newDescription.value.trim() || '',
      file: pendingPhotoFile
    });
    addProductForm.reset();
    pendingPhotoDataUrl = '';
    pendingPhotoFile = null;
    photoPreview.hidden = true;
    await renderAdminProducts();
    showToast(`${name} added to the store`);
  } catch (err) {
    showToast('Could not add product — check connection');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

// ===== Helpers =====
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== Scroll progress =====
const scrollBar = document.getElementById('scrollProgress');
if (scrollBar) {
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
    scrollBar.style.transform = `scaleX(${scrolled || 0})`;
  }, { passive: true });
}

// ===== Init =====
if (isAuthed()) {
  showDashboard();
} else {
  showGate();
}
