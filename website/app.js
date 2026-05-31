// ===== Configuration — customize these for your business =====
const CONFIG = {
  businessName: 'KitCulture',
  whatsappNumber: '919072114858',
  instagramHandle: 'kitculture.99',
  products: [
    {
      id: 1,
      name: 'Premium Football Jersey',
      category: 'football',
      image: 'images/jersey-1.jpg',
      badge: 'Bestseller',
      description: 'Premium quality jersey. DM on Instagram @kitculture.99 to order.'
    },
    {
      id: 2,
      name: 'Retro Club Kit',
      category: 'football',
      image: 'images/jersey-2.jpg',
      badge: 'New',
      description: 'Classic retro design. Available in multiple sizes. Ships across India.'
    },
    {
      id: 3,
      name: 'Vintage Home Jersey',
      category: 'football',
      image: 'images/jersey-3.jpg',
      badge: null,
      description: 'Thrifted/surplus quality. Limited stock.'
    },
    {
      id: 4,
      name: 'Street Style Jersey',
      category: 'football',
      image: 'images/jersey-4.jpg',
      badge: 'Popular',
      description: 'Bold colors, premium fabric. Perfect for match day and everyday wear.'
    },
    {
      id: 5,
      name: 'Classic Striped Kit',
      category: 'football',
      image: 'images/jersey-5.jpg',
      badge: null,
      description: 'Iconic striped design. Comfortable fit in S–XXL.'
    },
    {
      id: 6,
      name: 'Limited Edition Jersey',
      category: 'football',
      image: 'images/jersey-6.jpg',
      badge: 'Limited',
      description: 'Exclusive drop — grab it before it sells out.'
    },
    {
      id: 7,
      name: 'Premium Away Kit',
      category: 'football',
      image: 'images/jersey-7.jpg',
      badge: 'New',
      description: 'Fresh away colors with moisture-wicking fabric.'
    },
    {
      id: 8,
      name: 'Fan Favourite Jersey',
      category: 'football',
      image: 'images/jersey-8.jpg',
      badge: null,
      description: 'One of our most loved jerseys. Order via WhatsApp or Instagram DM.'
    }
  ],
  sizes: ['S', 'M', 'L', 'XL', 'XXL']
};

// ===== State =====
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
    ? CONFIG.products
    : CONFIG.products.filter(p => p.category === filter);

  productGrid.innerHTML = filtered.map((product, index) => `
    <article class="product-card" data-id="${product.id}" style="animation-delay: ${index * 0.07}s">
      <div class="product-image ${product.category}">
        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
        ${productImageHtml(product, 'product-photo')}
      </div>
      <div class="product-info">
        <p class="product-category">${product.category}</p>
        <h3>${product.name}</h3>
        <div class="product-footer">
          <button class="add-btn" data-id="${product.id}">Add to Cart</button>
        </div>
      </div>
    </article>
  `).join('');

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
      addToCart(parseInt(btn.dataset.id));
    });
  });
}

function openProductModal(id) {
  const product = CONFIG.products.find(p => p.id === id);
  if (!product) return;

  selectedSize = 'M';

  modalBody.innerHTML = `
    <div class="modal-product">
      <div class="modal-image">${productImageHtml(product, 'modal-photo')}</div>
      <h2>${product.name}</h2>
      <p>${product.description}</p>
      <div class="size-selector">
        <label>Select Size</label>
        <div class="size-options">
          ${CONFIG.sizes.map(size => `
            <button class="size-option ${size === selectedSize ? 'selected' : ''}" data-size="${size}">${size}</button>
          `).join('')}
        </div>
      </div>
      <button class="btn btn-primary btn-full" id="modalAddBtn">Add to Cart</button>
    </div>
  `;

  modalBody.querySelectorAll('.size-option').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedSize = btn.dataset.size;
      modalBody.querySelectorAll('.size-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  document.getElementById('modalAddBtn').addEventListener('click', () => {
    addToCart(id, selectedSize);
    closeModal();
  });

  modalOverlay.classList.add('active');
  productModal.classList.add('active');
}

function closeModal() {
  modalOverlay.classList.remove('active');
  productModal.classList.remove('active');
}

// ===== Cart =====
function addToCart(productId, size = 'M') {
  const product = CONFIG.products.find(p => p.id === productId);
  if (!product) return;

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
        <p>Size: ${item.size}</p>
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

  const lines = cart.map(item =>
    `• ${item.name} (${item.size}) x${item.qty}`
  );
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

// ===== Init =====
renderProducts();
updateCartUI();
initScrollReveal();
