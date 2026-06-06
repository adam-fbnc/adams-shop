import { PRODUCTS } from './products';
import { Cart } from './cart';
import type { Product } from './types';

const cart = new Cart();

// ── DOM refs ──────────────────────────────────────────────────────────────────
const productGrid = document.getElementById('product-grid')!;
const cartBadge = document.getElementById('cart-badge')!;
const cartToggle = document.getElementById('cart-toggle')!;
const cartClose = document.getElementById('cart-close')!;
const cartOverlay = document.getElementById('cart-overlay')!;
const cartSidebar = document.getElementById('cart-sidebar')!;
const cartItemsEl = document.getElementById('cart-items')!;
const cartTotalEl = document.getElementById('cart-total')!;
const cartFooter = document.getElementById('cart-footer')!;
const checkoutBtn = document.getElementById('checkout-btn')!;
const continueBtn = document.getElementById('continue-btn')!;
const modalOverlay = document.getElementById('modal-overlay')!;
const modalBody = document.getElementById('modal-body')!;
const modalClose = document.getElementById('modal-close')!;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;
const navLinks = document.querySelectorAll<HTMLAnchorElement>('.nav-link');
const heroCta = document.getElementById('hero-cta')!;
const logoLink = document.getElementById('logo-link')!;
const productsHeading = document.getElementById('products-heading')!;
const toastEl = document.getElementById('toast')!;

// ── State ─────────────────────────────────────────────────────────────────────
let activeFilter = 'all';
let activeSort = 'default';
let activeSearch = '';
let toastTimer: ReturnType<typeof setTimeout> | null = null;

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg: string): void {
  toastEl.textContent = msg;
  toastEl.classList.add('toast--visible');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('toast--visible'), 2200);
}

// ── Cart UI ───────────────────────────────────────────────────────────────────
function renderCart(): void {
  const items = cart.getItems();
  cartBadge.textContent = String(cart.getCount());
  cartBadge.style.display = cart.getCount() > 0 ? 'flex' : 'none';
  cartTotalEl.textContent = `$${cart.getTotal().toFixed(2)}`;
  cartFooter.style.display = items.length > 0 ? 'block' : 'none';

  if (items.length === 0) {
    cartItemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    return;
  }

  cartItemsEl.innerHTML = items
    .map(
      (item) => `
    <div class="cart-item" data-id="${item.product.id}">
      <img src="${item.product.image}" alt="${item.product.name}" class="cart-item__img" />
      <div class="cart-item__info">
        <p class="cart-item__name">${item.product.name}</p>
        <p class="cart-item__price">$${(item.product.price * item.quantity).toFixed(2)}</p>
        <div class="cart-item__qty">
          <button class="qty-btn" data-action="dec" data-id="${item.product.id}">−</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" data-action="inc" data-id="${item.product.id}">+</button>
        </div>
      </div>
      <button class="cart-item__remove" data-id="${item.product.id}" aria-label="Remove">✕</button>
    </div>`,
    )
    .join('');
}

cart.onChange(renderCart);

cartItemsEl.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const id = Number(target.dataset['id']);
  if (!id) return;

  if (target.classList.contains('cart-item__remove')) {
    cart.remove(id);
  } else if (target.classList.contains('qty-btn')) {
    const item = cart.getItems().find((i) => i.product.id === id);
    if (!item) return;
    const delta = target.dataset['action'] === 'inc' ? 1 : -1;
    cart.setQuantity(id, item.quantity + delta);
  }
});

function openCart(): void {
  cartSidebar.classList.add('cart-sidebar--open');
  cartOverlay.classList.add('cart-overlay--visible');
  document.body.style.overflow = 'hidden';
}

function closeCart(): void {
  cartSidebar.classList.remove('cart-sidebar--open');
  cartOverlay.classList.remove('cart-overlay--visible');
  document.body.style.overflow = '';
}

cartToggle.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
continueBtn.addEventListener('click', closeCart);

checkoutBtn.addEventListener('click', () => {
  cart.clear();
  closeCart();
  showToast('Order placed! Thanks for shopping. 🎉');
});

// ── Product grid ──────────────────────────────────────────────────────────────
function getFilteredProducts(): Product[] {
  let list = [...PRODUCTS];

  if (activeFilter !== 'all') {
    list = list.filter((p) => p.category === activeFilter);
  }

  if (activeSearch.trim()) {
    const q = activeSearch.toLowerCase();
    list = list.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
    );
  }

  switch (activeSort) {
    case 'price-asc':
      list.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      list.sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  return list;
}

function renderProducts(): void {
  const list = getFilteredProducts();
  const label =
    activeFilter === 'all'
      ? 'All Products'
      : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1);
  productsHeading.textContent = activeSearch ? `Results for "${activeSearch}"` : label;

  if (list.length === 0) {
    productGrid.innerHTML = '<p class="no-results">No products found.</p>';
    return;
  }

  productGrid.innerHTML = list
    .map(
      (p) => `
    <article class="product-card" data-id="${p.id}">
      ${p.badge ? `<span class="product-badge product-badge--${p.badge.toLowerCase().replace(' ', '-')}">${p.badge}</span>` : ''}
      <div class="product-card__img-wrap">
        <img src="${p.image}" alt="${p.name}" class="product-card__img" loading="lazy" />
      </div>
      <div class="product-card__body">
        <p class="product-card__category">${p.category}</p>
        <h3 class="product-card__name">${p.name}</h3>
        <div class="product-card__footer">
          <span class="product-card__price">$${p.price.toFixed(2)}</span>
          <button class="btn btn--primary btn--sm add-to-cart" data-id="${p.id}">Add to cart</button>
        </div>
      </div>
    </article>`,
    )
    .join('');
}

productGrid.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;

  if (target.classList.contains('add-to-cart')) {
    e.stopPropagation();
    const id = Number(target.dataset['id']);
    const product = PRODUCTS.find((p) => p.id === id);
    if (product) {
      cart.add(product);
      showToast(`"${product.name}" added to cart`);
      target.textContent = '✓ Added';
      setTimeout(() => (target.textContent = 'Add to cart'), 1200);
    }
    return;
  }

  const card = target.closest<HTMLElement>('.product-card');
  if (card) {
    const id = Number(card.dataset['id']);
    const product = PRODUCTS.find((p) => p.id === id);
    if (product) openModal(product);
  }
});

// ── Product Modal ─────────────────────────────────────────────────────────────
function openModal(product: Product): void {
  modalBody.innerHTML = `
    <div class="modal__img-wrap">
      <img src="${product.image}" alt="${product.name}" />
    </div>
    <div class="modal__info">
      <p class="modal__category">${product.category}</p>
      <h2 class="modal__name">${product.name}</h2>
      <p class="modal__price">$${product.price.toFixed(2)}</p>
      <p class="modal__desc">${product.description}</p>
      <button class="btn btn--primary modal__add" data-id="${product.id}">Add to Cart</button>
    </div>`;
  modalOverlay.classList.add('modal-overlay--visible');
  document.body.style.overflow = 'hidden';

  modalBody.querySelector<HTMLButtonElement>('.modal__add')!.addEventListener('click', () => {
    cart.add(product);
    showToast(`"${product.name}" added to cart`);
    closeModal();
  });
}

function closeModal(): void {
  modalOverlay.classList.remove('modal-overlay--visible');
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// ── Filters / search / sort ───────────────────────────────────────────────────
navLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    activeFilter = link.dataset['filter'] ?? 'all';
    activeSearch = '';
    searchInput.value = '';
    navLinks.forEach((l) => l.classList.remove('active'));
    link.classList.add('active');
    renderProducts();
    document.getElementById('main-section')!.scrollIntoView({ behavior: 'smooth' });
  });
});

searchInput.addEventListener('input', () => {
  activeSearch = searchInput.value;
  renderProducts();
});

sortSelect.addEventListener('change', () => {
  activeSort = sortSelect.value;
  renderProducts();
});

heroCta.addEventListener('click', () => {
  document.getElementById('main-section')!.scrollIntoView({ behavior: 'smooth' });
});

logoLink.addEventListener('click', (e) => {
  e.preventDefault();
  activeFilter = 'all';
  activeSearch = '';
  activeSort = 'default';
  searchInput.value = '';
  sortSelect.value = 'default';
  navLinks.forEach((l) => l.classList.toggle('active', l.dataset['filter'] === 'all'));
  renderProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Init ──────────────────────────────────────────────────────────────────────
renderProducts();
renderCart();
