// ===== Configuration =====
// Business info + product catalog live in store.js (shared with the admin panel).
const CONFIG = STORE_CONFIG;

// ===== State =====
let products = loadProducts();
let cart = JSON.parse(localStorage.getItem('kitculture-cart') || '[]');
let selectedSize = 'M';
let currentFilter = 'all';

// ===== DOM Elements =====
const productGrid = document.getElementById('productGrid');
const cartBtn = document.getElementById('cartBtn');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartClose = document.getElementById('cartClose');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const checkoutBtn = document.getElementById('checkoutBtn');
const modalOverlay = document.getElementById('modalOverlay');
const productModal = document.getElementById('productModal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const contactForm = document.getElementById('contactForm');
const toast = document.getElementById('toast');
const filterBtns = document.querySelectorAll('.filter-btn');

function productImageHtml(product, className = '') {
  return `<img src="${product.image}" alt="${product.name}" class="${className}" loading="lazy">`;
}

// ===== Products =====
function renderProducts(filter = 'all') {
  const filtered = filter === 'all'
    ? products
    : products.filter(p => p.category === filter);

  if (!filtered.length) {
    productGrid.innerHTML = '<p class="grid-empty">No jerseys in this category yet — check back soon.</p>';
    return;
  }

  productGrid.innerHTML = filtered.map((product, index) => {
    const soldOut = product.available === false;
    const priceText = formatPrice(product.price);
    return `
    <article class="product-card${soldOut ? ' sold-out' : ''}" data-id="${product.id}" style="animation-delay: ${index * 0.07}s">
      <div class="product-image ${product.category}">
        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
        ${soldOut ? '<span class="soldout-overlay"><span>Sold Out</span></span>' : ''}
        ${productImageHtml(product, 'product-photo')}
      </div>
      <div class="product-info">
        <p class="product-category">${product.category}</p>
        <h3>${product.name}</h3>
        <div class="product-footer">
          ${priceText ? `<span class="product-price">${priceText}</span>` : '<span></span>'}
          <button class="add-btn" data-id="${product.id}"${soldOut ? ' disabled' : ''}>${soldOut ? 'Sold Out' : 'Add to Cart'}</button>
        </div>
      </div>
    </article>
  `;
  }).join('');

  productGrid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('add-btn')) {
        openProductModal(parseInt(card.dataset.id));
      }
    });
  });

  productGrid.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (btn.disabled) return;
      addToCart(parseInt(btn.dataset.id));
    });
  });

  applyTilt(productGrid.querySelectorAll('.product-card'));
}

function openProductModal(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  selectedSize = 'M';
  const soldOut = product.available === false;
  const priceText = formatPrice(product.price);

  modalBody.innerHTML = `
    <div class="modal-product">
      <div class="modal-image">${productImageHtml(product, 'modal-photo')}</div>
      <h2>${product.name}</h2>
      ${priceText ? `<p class="modal-price">${priceText}</p>` : ''}
      <p>${product.description}</p>
      <div class="size-selector">
        <label>Select Size</label>
        <div class="size-options">
          ${CONFIG.sizes.map(size => `
            <button class="size-option ${size === selectedSize ? 'selected' : ''}" data-size="${size}">${size}</button>
          `).join('')}
        </div>
      </div>
      <button class="btn btn-primary btn-full" id="modalAddBtn"${soldOut ? ' disabled' : ''}>${soldOut ? 'Sold Out' : 'Add to Cart'}</button>
    </div>
  `;

  modalBody.querySelectorAll('.size-option').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedSize = btn.dataset.size;
      modalBody.querySelectorAll('.size-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  const modalAddBtn = document.getElementById('modalAddBtn');
  if (!soldOut) {
    modalAddBtn.addEventListener('click', () => {
      addToCart(id, selectedSize);
      closeModal();
    });
  }

  modalOverlay.classList.add('active');
  productModal.classList.add('active');
}

function closeModal() {
  modalOverlay.classList.remove('active');
  productModal.classList.remove('active');
}

// ===== Cart =====
function addToCart(productId, size = 'M') {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  if (product.available === false) {
    showToast(`${product.name} is sold out`);
    return;
  }

  const existing = cart.find(item => item.id === productId && item.size === size);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, size, qty: 1 });
  }

  saveCart();
  updateCartUI();
  showToast(`${product.name} (${size}) added to cart`);
}

function removeFromCart(productId, size) {
  cart = cart.filter(item => !(item.id === productId && item.size === size));
  saveCart();
  updateCartUI();
}

function updateQty(productId, size, delta) {
  const item = cart.find(i => i.id === productId && i.size === size);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(productId, size);
  } else {
    saveCart();
    updateCartUI();
  }
}

function saveCart() {
  localStorage.setItem('kitculture-cart', JSON.stringify(cart));
}

function updateCartUI() {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  if (totalItems !== Number(cartCount.textContent)) {
    cartCount.classList.remove('pop');
    void cartCount.offsetWidth; // restart animation
    cartCount.classList.add('pop');
  }
  cartCount.textContent = totalItems;

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="cart-empty">Your cart is empty</p>';
    return;
  }

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-image">${productImageHtml(item, 'cart-photo')}</div>
      <div class="cart-item-details">
        <h4>${item.name}</h4>
        <p>Size: ${item.size}${formatPrice(item.price) ? ` · ${formatPrice(item.price)}` : ''}</p>
        <div class="cart-item-actions">
          <button class="qty-btn" data-id="${item.id}" data-size="${item.size}" data-delta="-1">−</button>
          <span>${item.qty}</span>
          <button class="qty-btn" data-id="${item.id}" data-size="${item.size}" data-delta="1">+</button>
        </div>
      </div>
    </div>
  `).join('');

  cartItems.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      updateQty(parseInt(btn.dataset.id), btn.dataset.size, parseInt(btn.dataset.delta));
    });
  });
}

function openCart() {
  cartSidebar.classList.add('active');
  cartOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartSidebar.classList.remove('active');
  cartOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

function checkout() {
  if (cart.length === 0) {
    showToast('Your cart is empty');
    return;
  }

  const lines = cart.map(item => {
    const priceText = formatPrice(item.price);
    const url = absoluteImageUrl(item.image);
    let line = `• ${item.name} (${item.size}) x${item.qty}`;
    if (priceText) line += ` — ${priceText}`;
    if (url && !url.startsWith('data:')) {
      line += `\n   Photo: ${url}`;
    } else if (url) {
      line += `\n   (custom photo — sending it now)`;
    }
    return line;
  });
  const message = encodeURIComponent(
    `Hi! I'd like to place an order from ${CONFIG.businessName} (@${CONFIG.instagramHandle}):\n\n${lines.join('\n')}\n\nPlease confirm availability and payment details.`
  );

  window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${message}`, '_blank');
}

// ===== Toast =====
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== Contact Form =====
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const subject = document.getElementById('subject').value;
  const message = document.getElementById('message').value;

  const subjectLabels = {
    order: 'Place an Order',
    custom: 'Custom Team Jerseys',
    bulk: 'Bulk / Wholesale',
    other: 'Other'
  };

  const whatsappMessage = encodeURIComponent(
    `Hi ${CONFIG.businessName}!\n\nName: ${name}\nPhone: ${phone}\nSubject: ${subjectLabels[subject]}\n\n${message}`
  );

  window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${whatsappMessage}`, '_blank');
  contactForm.reset();
  showToast('Opening WhatsApp...');
});

// ===== Filters =====
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderProducts(currentFilter);
  });
});

document.querySelectorAll('.category-card').forEach(card => {
  card.addEventListener('click', (e) => {
    const filter = card.dataset.filter;
    if (filter && filter !== 'custom') {
      e.preventDefault();
      filterBtns.forEach(b => {
        b.classList.toggle('active', b.dataset.filter === filter);
      });
      currentFilter = filter;
      renderProducts(filter);
      document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ===== Event Listeners =====
cartBtn.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
modalOverlay.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);
checkoutBtn.addEventListener('click', checkout);

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('active');
  navToggle.classList.toggle('active');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('active');
    navToggle.classList.remove('active');
  });
});

function initScrollReveal() {
  const header = document.getElementById('header');
  const revealEls = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => observer.observe(el));

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCart();
    closeModal();
  }
});

// ===== Cinematic enhancements =====
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Subtle 3D tilt on cards that follows the cursor.
function applyTilt(elements) {
  if (prefersReducedMotion || window.matchMedia('(hover: none)').matches) return;
  elements.forEach(el => {
    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateY(-6px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = '';
    });
  });
}

// Count-up animation for the hero stats (e.g. 500+, 48hr, 100%).
function initCountUp() {
  const stats = document.querySelectorAll('.hero-stats .stat strong');
  if (!stats.length) return;
  if (prefersReducedMotion) return;

  stats.forEach(el => {
    const raw = el.textContent.trim();
    const match = raw.match(/^(\d+)(.*)$/);
    if (!match) return;
    const target = parseInt(match[1], 10);
    const suffix = match[2] || '';
    let start = null;
    const duration = 1400;
    function step(ts) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

// Scroll progress bar across the top of the page.
function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
    bar.style.transform = `scaleX(${scrolled || 0})`;
  }, { passive: true });
}

// Gentle parallax drift on the hero glow following the cursor.
function initHeroParallax() {
  if (prefersReducedMotion) return;
  const heroBg = document.querySelector('.hero-bg');
  const hero = document.querySelector('.hero');
  if (!heroBg || !hero) return;
  hero.addEventListener('pointermove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    heroBg.style.transform = `translate(${x * 24}px, ${y * 24}px) scale(1.06)`;
  });
  hero.addEventListener('pointerleave', () => {
    heroBg.style.transform = '';
  });
}

// Back-to-top button.
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Remove the cinematic intro overlay once the page is ready.
function initIntro() {
  requestAnimationFrame(() => {
    document.body.classList.add('loaded');
  });
}

// Keep the storefront in sync with the shared backend (so products added on
// any device show up here). Falls back to the local cache when offline.
async function syncFromApi() {
  try {
    const fresh = await fetchProductsFromApi();
    products = fresh;
    renderProducts(currentFilter);
  } catch (e) {
    // Offline or backend unreachable — keep showing the cached catalog.
  }
}
// Same-tab/local cache changes (e.g. admin in another tab writing the cache).
window.addEventListener('storage', (e) => {
  if (e.key === STORE_KEY) {
    products = loadProducts();
    renderProducts(currentFilter);
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') syncFromApi();
});

// ===== Init =====
renderProducts(); // instant render from cache
updateCartUI();
syncFromApi();                 // refresh from shared backend
setInterval(syncFromApi, 15000); // pick up changes from other devices
initScrollReveal();
initCountUp();
initScrollProgress();
initHeroParallax();
initBackToTop();
initIntro();
