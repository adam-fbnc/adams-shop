import type { Cart } from './cart';
import type { CartItem } from './types';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Session {
  name: string;       // first name — used for greetings
  email: string;
  address: string;    // formatted shipping address, or '' for sign-in users
}

type Step = 'auth' | 'review' | 'confirm';

// ── Module state ──────────────────────────────────────────────────────────────
let _cart: Cart;
let _session: Session | null = null;
let _snapshot: CartItem[] = [];

// ── Helpers ───────────────────────────────────────────────────────────────────
const $ = (id: string): HTMLElement => document.getElementById(id)!;

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}

function genOrderId(): string {
  return 'ORD-' + String(Math.floor(100000 + Math.random() * 900000));
}

function calcCharges(subtotal: number): { shipping: number; tax: number; total: number } {
  const shipping = subtotal >= 50 ? 0 : 5.99;
  const tax = subtotal * 0.085;
  return { shipping, tax, total: subtotal + shipping + tax };
}

function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName.trim();
}

// ── Step navigation ───────────────────────────────────────────────────────────
function gotoStep(step: Step): void {
  $('co-step-auth').classList.toggle('hidden', step !== 'auth');
  $('co-step-review').classList.toggle('hidden', step !== 'review');
  $('co-step-confirm').classList.toggle('hidden', step !== 'confirm');

  const backBtn = $('co-back') as HTMLButtonElement;
  const backLabel = $('co-back-label');

  if (step === 'auth') {
    backBtn.style.visibility = 'visible';
    backLabel.textContent = 'Back to shop';
  } else if (step === 'review') {
    backBtn.style.visibility = 'visible';
    backLabel.textContent = 'Back';
    buildReview();
  } else {
    // confirm — hide back button
    backBtn.style.visibility = 'hidden';
  }

  $('checkout-view').scrollTop = 0;
}

// ── Open / close ──────────────────────────────────────────────────────────────
export function openCheckout(): void {
  _session = null;

  // Reset to sign-in tab
  switchTab('signin');
  ($('form-signin') as HTMLFormElement).reset();
  ($('form-signup') as HTMLFormElement).reset();
  document.querySelectorAll<HTMLInputElement>('#checkout-view .input--error')
    .forEach((el) => el.classList.remove('input--error'));

  gotoStep('auth');
  $('checkout-view').setAttribute('aria-hidden', 'false');
  $('checkout-view').classList.add('page-view--visible');
  document.body.style.overflow = 'hidden';
}

export function closeCheckout(): void {
  $('checkout-view').classList.remove('page-view--visible');
  $('checkout-view').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// ── Tab switching ─────────────────────────────────────────────────────────────
function switchTab(tab: 'signin' | 'signup'): void {
  $('tab-signin').classList.toggle('active', tab === 'signin');
  $('tab-signup').classList.toggle('active', tab === 'signup');
  ($('tab-signin') as HTMLButtonElement).setAttribute('aria-selected', String(tab === 'signin'));
  ($('tab-signup') as HTMLButtonElement).setAttribute('aria-selected', String(tab === 'signup'));
  $('form-signin').classList.toggle('hidden', tab !== 'signin');
  $('form-signup').classList.toggle('hidden', tab !== 'signup');
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateIds(ids: string[]): boolean {
  let ok = true;
  for (const id of ids) {
    const el = $(id) as HTMLInputElement;
    const empty = !el.value.trim();
    el.classList.toggle('input--error', empty);
    if (empty) ok = false;
  }
  return ok;
}

// ── Build Order Review ────────────────────────────────────────────────────────
function buildReview(): void {
  if (!_session) return;

  const items = _cart.getItems();
  const subtotal = _cart.getTotal();
  const { shipping, tax, total } = calcCharges(subtotal);

  $('review-greeting').textContent = `Hi, ${_session.name}! 👋`;

  $('review-items').innerHTML = items
    .map(
      (item) => `
    <div class="ri-row">
      <img src="${item.product.image}" alt="${item.product.name}" class="ri-img" />
      <div class="ri-info">
        <p class="ri-name">${item.product.name}</p>
        <p class="ri-qty">Qty: ${item.quantity}</p>
      </div>
      <p class="ri-price">${fmt(item.product.price * item.quantity)}</p>
    </div>`,
    )
    .join('');

  const shipDisplay =
    shipping === 0
      ? '<span class="chip-free">Free</span>'
      : fmt(shipping);

  const addressBlock =
    _session.address
      ? `<div class="summary-section">
           <p class="summary-label">Ship to</p>
           <p class="summary-val">${_session.address}</p>
         </div>`
      : '';

  $('review-summary').innerHTML = `
    <div class="summary-card">
      <h3 class="summary-title">Order Summary</h3>
      ${addressBlock}
      <div class="summary-lines">
        <div class="summary-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${shipDisplay}</span></div>
        <div class="summary-row"><span>Tax (8.5%)</span><span>${fmt(tax)}</span></div>
        <div class="summary-row summary-row--total"><span>Total</span><span>${fmt(total)}</span></div>
      </div>
    </div>`;
}

// ── Place Order ───────────────────────────────────────────────────────────────
function placeOrder(): void {
  if (!_session) return;

  _snapshot = _cart.getItems();
  const subtotal = _cart.getTotal();
  const { shipping, tax, total } = calcCharges(subtotal);
  const orderId = genOrderId();
  const orderDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  _cart.clear();

  const shipDisplay = shipping === 0 ? 'Free' : fmt(shipping);
  const addressBlock =
    _session.address
      ? `<div class="cc-row"><span>Ship to</span><span class="cc-address">${_session.address}</span></div>`
      : '';

  $('confirm-content').innerHTML = `
    <div class="confirm-card">
      <div class="confirm-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>
      <h2 class="confirm-title">Order Confirmed!</h2>
      <p class="confirm-sub">Thank you, ${_session.name}! Your order is on its way.</p>

      <div class="confirm-meta">
        <div class="cm-item"><span class="cm-label">Order</span><span class="cm-val">${orderId}</span></div>
        <div class="cm-item"><span class="cm-label">Date</span><span class="cm-val">${orderDate}</span></div>
        <div class="cm-item"><span class="cm-label">Est. Delivery</span><span class="cm-val">3–5 business days</span></div>
      </div>

      <div class="confirm-section">
        <h3 class="confirm-section-title">Items Ordered</h3>
        <div class="confirm-items">
          ${_snapshot
            .map(
              (item) => `
          <div class="ci-row">
            <img src="${item.product.image}" alt="${item.product.name}" class="ci-img" />
            <div class="ci-info">
              <p class="ci-name">${item.product.name}</p>
              <p class="ci-qty">Qty: ${item.quantity}</p>
            </div>
            <p class="ci-price">${fmt(item.product.price * item.quantity)}</p>
          </div>`,
            )
            .join('')}
        </div>
      </div>

      <div class="confirm-section">
        <h3 class="confirm-section-title">Charges</h3>
        <div class="confirm-charges">
          ${addressBlock}
          <div class="cc-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
          <div class="cc-row"><span>Shipping</span><span>${shipDisplay}</span></div>
          <div class="cc-row"><span>Tax (8.5%)</span><span>${fmt(tax)}</span></div>
          <div class="cc-row cc-row--total"><span>Total</span><span>${fmt(total)}</span></div>
        </div>
      </div>

      <button class="btn btn--primary" id="continue-shopping-btn">Continue Shopping</button>
    </div>`;

  $('continue-shopping-btn').addEventListener('click', closeCheckout);

  gotoStep('confirm');
}

// ── Init — wire all event listeners once ──────────────────────────────────────
export function initCheckout(cart: Cart): void {
  _cart = cart;

  // Back button
  $('co-back').addEventListener('click', () => {
    if (!$('co-step-auth').classList.contains('hidden')) {
      closeCheckout();
    } else {
      gotoStep('auth');
    }
  });

  // Tab buttons
  $('tab-signin').addEventListener('click', () => switchTab('signin'));
  $('tab-signup').addEventListener('click', () => switchTab('signup'));

  // Switcher links inside forms
  $('switch-to-signup').addEventListener('click', (e) => { e.preventDefault(); switchTab('signup'); });
  $('switch-to-signin').addEventListener('click', (e) => { e.preventDefault(); switchTab('signin'); });

  // Clear error styling as user types
  document.querySelectorAll<HTMLInputElement>('#checkout-view input').forEach((input) => {
    input.addEventListener('input', () => input.classList.remove('input--error'));
  });

  // Sign In submit
  $('form-signin').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateIds(['si-username', 'si-password'])) return;
    _session = {
      name: 'Current user',
      email: ($('si-username') as HTMLInputElement).value.trim(),
      address: '',
    };
    gotoStep('review');
  });

  // Sign Up submit
  $('form-signup').addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = ['su-name', 'su-phone', 'su-email', 'su-password', 'su-street', 'su-city', 'su-state', 'su-zip'];
    if (!validateIds(fields)) return;
    const street = ($('su-street') as HTMLInputElement).value.trim();
    const city   = ($('su-city')   as HTMLInputElement).value.trim();
    const state  = ($('su-state')  as HTMLInputElement).value.trim();
    const zip    = ($('su-zip')    as HTMLInputElement).value.trim();
    _session = {
      name: firstNameOf(($('su-name') as HTMLInputElement).value),
      email: ($('su-email') as HTMLInputElement).value.trim(),
      address: `${street}, ${city}, ${state} ${zip}`,
    };
    gotoStep('review');
  });

  // Place Order
  $('place-order-btn').addEventListener('click', placeOrder);
}
