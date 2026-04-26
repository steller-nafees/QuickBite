/**
 * QuickBite Cart System
 * Handles: Cart drawer · Checkout modal · Order status modal
 * Schema: USER → ORDER → ORDER_ITEM → PAYMENT
 */

(function () {
    'use strict';

    /* ─────────────────────────────────────────
       CONSTANTS & STATE
    ───────────────────────────────────────── */
    const CART_KEY = 'quickbite-cart';
    const ORDERS_KEY = 'quickbite-orders';
    const AUTH_KEY = 'quickbite-auth-user';

    let checkoutPaymentMethod = null; // 'bkash' | 'nagad' | 'card'
    let selectedPickupTime = "";

    /* ─────────────────────────────────────────
       CART STORAGE HELPERS
    ───────────────────────────────────────── */
    function getCart() {
        try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
        catch { return []; }
    }

    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        syncCartBadge();
        if (document.getElementById('cartDrawer')?.classList.contains('is-open')) {
            renderCartDrawer();
        }
    }

    function clearCart() {
        localStorage.removeItem(CART_KEY);
        syncCartBadge();
    }

    function addToCartGlobal(item, options = {}) {
        const { openCartAfterAdd = true } = options;
        const cart = getCart();
        const existing = cart.find(c => c.id === item.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image || '',
                vendor: item.vendor || item.managed_by || '',
                vendor_id: item.vendor_id || null,
                quantity: 1,
            });
        }
        saveCart(cart);
        if (openCartAfterAdd) {
            openCart();
        }
    }

    function updateQty(itemId, delta) {
        const cart = getCart();
        const normalizedId = String(itemId);
        const idx = cart.findIndex(c => String(c.id) === normalizedId);
        if (idx === -1) return;
        cart[idx].quantity += delta;
        if (cart[idx].quantity <= 0) cart.splice(idx, 1);
        saveCart(cart);
    }

    function removeFromCart(itemId) {
        const normalizedId = String(itemId);
        const cart = getCart().filter(c => String(c.id) !== normalizedId);
        saveCart(cart);
    }

    function cartTotal(cart) {
        return cart.reduce((s, i) => s + i.price * i.quantity, 0);
    }

    function cartItemCount(cart) {
        return cart.reduce((s, i) => s + i.quantity, 0);
    }

    /* ─────────────────────────────────────────
       SYNC BADGE ON NAV ICON
    ───────────────────────────────────────── */
    function syncCartBadge() {
        const count = cartItemCount(getCart());
        document.querySelectorAll('.cart-icon').forEach(el => {
            el.setAttribute('data-count', count);
        });
        // Also update drawer badge
        const badge = document.getElementById('cartCountBadge');
        if (badge) badge.textContent = count;
    }

    /* ─────────────────────────────────────────
       BUILD CART DRAWER HTML
    ───────────────────────────────────────── */
    function buildDrawerHTML() {
        return `
        <div class="cart-overlay" id="cartOverlay"></div>
        <div class="cart-drawer" id="cartDrawer" role="dialog" aria-modal="true" aria-label="Your cart">
            <div class="cart-header">
                <div class="cart-header-left">
                    <h2>Your Platter</h2>
                    <span class="cart-count-badge" id="cartCountBadge">0</span>
                </div>
                <button class="cart-close-btn" id="cartCloseBtn" aria-label="Close cart">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div id="cartBody" class="cart-items"></div>
            <div class="cart-footer" id="cartFooter" style="display:none">
                <div class="cart-summary-row">
                    <span class="cart-summary-label">Subtotal</span>
                    <span class="cart-summary-value" id="cartSubtotal">BDT 0</span>
                </div>
                <div class="cart-total-row">
                    <span class="cart-total-label">Total</span>
                    <span class="cart-total-value" id="cartTotal">BDT 0</span>
                </div>
                <button class="cart-checkout-btn" id="cartCheckoutBtn">
                    <i class="fas fa-bolt"></i> Proceed to Checkout
                </button>
                <button class="cart-clear-btn" id="cartClearBtn">Clear platter</button>
            </div>
        </div>`;
    }

    /* ─────────────────────────────────────────
       RENDER CART DRAWER CONTENTS
    ───────────────────────────────────────── */
    function renderCartDrawer() {
        const cart = getCart();
        const body = document.getElementById('cartBody');
        const footer = document.getElementById('cartFooter');
        const badge = document.getElementById('cartCountBadge');
        if (!body) return;

        const count = cartItemCount(cart);
        if (badge) badge.textContent = count;

        if (cart.length === 0) {
            body.innerHTML = `
                <div class="cart-empty">
                    <i class="fas fa-bowl-food"></i>
                    <p>Your platter is empty</p>
                    <small>Add items from the menu to get started</small>
                    <div class="view-menu" onclick="window.location.href='menu.html'">View Menu</div>
                </div>`;
            if (footer) footer.style.display = 'none';
            return;
        }

        // Group by vendor
        const groups = {};
        cart.forEach(item => {
            const v = item.vendor || 'Other';
            if (!groups[v]) groups[v] = [];
            groups[v].push(item);
        });

        let html = '';
        Object.entries(groups).forEach(([vendor, items]) => {
            html += `<div class="cart-vendor-group">
                        <span class="cart-vendor-label"><i class="fas fa-store"></i> ${vendor}</span>
                     </div>`;
            items.forEach(item => {
                const lineTotal = formatCurrency(item.price * item.quantity);
                html += `
                <div class="cart-item" data-item-id="${item.id}">
                    <img src="${item.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&h=120&fit=crop'}"
                         alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${lineTotal}</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="qty-btn qty-minus" data-id="${item.id}" aria-label="Decrease quantity">−</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn qty-plus" data-id="${item.id}" aria-label="Increase quantity">+</button>
                    </div>
                    <button class="cart-item-remove" data-id="${item.id}" aria-label="Remove item">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>`;
            });
        });

        body.innerHTML = html;

        const total = cartTotal(cart);
        document.getElementById('cartSubtotal').textContent = formatCurrency(total);
        document.getElementById('cartTotal').textContent = formatCurrency(total);
        if (footer) footer.style.display = 'block';

        // Qty controls
        body.querySelectorAll('.qty-minus').forEach(btn => {
            btn.addEventListener('click', () => { updateQty(btn.dataset.id, -1); });
        });
        body.querySelectorAll('.qty-plus').forEach(btn => {
            btn.addEventListener('click', () => { updateQty(btn.dataset.id, +1); });
        });
        body.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', () => { removeFromCart(btn.dataset.id); });
        });
    }

    /* ─────────────────────────────────────────
       OPEN / CLOSE CART
    ───────────────────────────────────────── */
    function openCart() {
        renderCartDrawer();
        document.getElementById('cartDrawer')?.classList.add('is-open');
        document.getElementById('cartOverlay')?.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    function closeCart() {
        document.getElementById('cartDrawer')?.classList.remove('is-open');
        document.getElementById('cartOverlay')?.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    function createPickupTimeSelector(mountId) {
        const slots = [
            "9:35 AM",
            "11:15 AM",
            "12:55 PM",
            "2:35 PM",
            "4:15 PM",
            "5:55 PM"
        ];

        function pad(value) {
            return String(value).padStart(2, "0");
        }

        function formatForInput(date) {
            return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
        }

        function formatForDatabase(date) {
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
        }

        function getMinimumPickupDate() {
            const minDate = new Date(Date.now() + 10 * 60 * 1000);
            minDate.setSeconds(0, 0);
            return minDate;
        }

        function parseSlotDate(label) {
            const [time, mod] = label.split(" ");
            let [hours, minutes] = time.split(":").map(Number);
            if (mod === "PM" && hours !== 12) hours += 12;
            if (mod === "AM" && hours === 12) hours = 0;

            const slotDate = new Date();
            slotDate.setHours(hours, minutes, 0, 0);
            return slotDate;
        }

        function getDefaultPickupDate() {
            const defaultDate = new Date(Date.now() + 30 * 60 * 1000);
            defaultDate.setSeconds(0, 0);
            return defaultDate;
        }

        const mount = document.getElementById(mountId);
        if (!mount) return;

        mount.innerHTML = "";

        const wrap = document.createElement("div");
        wrap.className = "pickup-time-picker";

        const header = document.createElement("div");
        header.className = "pickup-time-picker__header";

        const eyebrow = document.createElement("span");
        eyebrow.className = "pickup-time-picker__eyebrow";
        eyebrow.innerHTML = `<i class="fas fa-clock"></i> Suggested slots`;

        const title = document.createElement("h3");
        title.className = "pickup-time-picker__title";
        title.textContent = "Choose a pickup time";

        const helper = document.createElement("p");
        helper.className = "pickup-time-picker__helper";
        helper.textContent = "Simple pickup slots for today. Earlier times are unavailable.";

        header.appendChild(eyebrow);
        header.appendChild(title);
        header.appendChild(helper);

        const preview = document.createElement("div");
        preview.className = "pickup-time-picker__preview";
        preview.innerHTML = `
            <div>
                <div class="pickup-time-picker__preview-label">Selected</div>
                <div class="pickup-time-picker__preview-value" id="pickupTimePreviewValue">—</div>
            </div>
            <div class="pickup-time-picker__preview-note" id="pickupTimePreviewNote">Choose a slot below</div>
        `;

        const slotGrid = document.createElement("div");
        slotGrid.className = "pickup-time-picker__grid";

        const previewValueEl = preview.querySelector("#pickupTimePreviewValue");
        const previewNoteEl = preview.querySelector("#pickupTimePreviewNote");
        const minPickupDate = getMinimumPickupDate();

        function setSelection(date, activeButton) {
            if (!(date instanceof Date) || Number.isNaN(date.getTime()) || date.getTime() < minPickupDate.getTime()) {
                return false;
            }

            selectedPickupTime = formatForDatabase(date);

            if (previewValueEl) {
                previewValueEl.textContent = formatForInput(date);
            }

            if (previewNoteEl) {
                previewNoteEl.textContent = activeButton ? "Slot selected" : "Choose a slot below";
            }

            wrap.querySelectorAll(".time-slot")
                .forEach(button => {
                    const isActive = button === activeButton;
                    button.classList.toggle("active", isActive);
                    const meta = button.querySelector(".premium-time-slot__meta");
                    if (meta) meta.textContent = isActive ? "Selected" : "Tap to select";
                });

            return true;
        }

        slots.forEach(t => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "time-slot premium-time-slot";
            btn.innerHTML = `
                <span class="premium-time-slot__label">${t}</span>
                <span class="premium-time-slot__meta">Tap to select</span>
            `;

            const slotDate = parseSlotDate(t);
            const isUnavailable = slotDate.getTime() < minPickupDate.getTime();

            if (isUnavailable) {
                btn.disabled = true;
                const meta = btn.querySelector(".premium-time-slot__meta");
                if (meta) meta.textContent = "Unavailable";
            } else {
                btn.onclick = () => {
                    setSelection(slotDate, btn);
                };
            }

            slotGrid.appendChild(btn);
        });

        wrap.appendChild(header);
        wrap.appendChild(preview);
        wrap.appendChild(slotGrid);

        mount.appendChild(wrap);

        const firstAvailableSlot = slots
            .map(parseSlotDate)
            .find(date => date.getTime() >= minPickupDate.getTime());
        setSelection(firstAvailableSlot || getDefaultPickupDate(), null);

        window.getPickupTime = () => selectedPickupTime;
    }
    /* ─────────────────────────────────────────
       BUILD CHECKOUT MODAL HTML
    ───────────────────────────────────────── */
    function buildCheckoutHTML() {
        const cart = getCart();
        const total = cartTotal(cart);

        const itemRows = cart.map(item => `
            <div class="checkout-order-item">
                <div class="checkout-order-item-name">
                    <span class="checkout-order-item-qty">${item.quantity}</span>
                    ${item.name}
                </div>
                <span class="checkout-order-item-price">${formatCurrency(item.price * item.quantity)}</span>
            </div>`).join('');

        return `
        <div class="checkout-backdrop" id="checkoutBackdrop"></div>
        <div class="checkout-panel" role="dialog" aria-modal="true" aria-label="Checkout">
            <div class="checkout-panel-header">
                <h2><i class="fas fa-receipt" style="color:var(--color-cream-soft);margin-right:8px;font-size:16px;"></i>Checkout</h2>
                <button class="checkout-close-btn" id="checkoutCloseBtn" aria-label="Close checkout">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="checkout-body">

                <!-- Order summary -->
                <p class="checkout-section-title">Order Summary</p>
                <div class="checkout-order-summary">${itemRows}</div>

                <!-- Pickup time -->
                <div class="checkout-pickup-section">
                    <p class="checkout-section-title">Pickup Time</p>
                    <div id="pickupTimeMount"></div>
                </div>

                <!-- Payment method -->
                <div class="checkout-payment-section">
                    <p class="checkout-section-title">Payment Method</p>
                    <div class="payment-methods">
                        <button class="payment-method-btn" data-method="bkash" type="button">
                            <span class="payment-selected-tick"><i class="fas fa-check"></i></span>
                            <img src="assets/icons/BKash_Logo_icon-700x662.png" alt="Bkash" class="payment-method-icon">
                            <span class="method-label">Bkash</span>
                        </button>
                        <button class="payment-method-btn" data-method="nagad" type="button">
                            <span class="payment-selected-tick"><i class="fas fa-check"></i></span>
                            <img src="assets/icons/Nagad-Logo.wine.svg" alt="Nagad" class="payment-method-icon">
                            <span class="method-label">Nagad</span>
                        </button>
                        <button class="payment-method-btn" data-method="card" type="button">
                            <span class="payment-selected-tick"><i class="fas fa-check"></i></span>
                            <span class="method-icon">💳</span>
                            <span class="method-label">Card</span>
                            <span class="method-sub">Debit · Credit</span>
                        </button>
                    </div>

                    <!-- Bkash/Nagad sub-form -->
                    <div class="wallet-input-wrap" id="walletInputWrap">
                        <label class="checkout-field-label" for="walletNumber">Mobile number</label>
                        <div class="checkout-field-wrap">
                            <input type="text" id="walletNumber" placeholder="01XXXXXXXXX" maxlength="14">
                        </div>
                    </div>

                    <!-- Card sub-form -->
                    <div class="card-input-wrap" id="cardInputWrap">
                        <div class="checkout-field-wrap">
                            <label class="checkout-field-label" for="cardNumber">Card number</label>
                            <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456" maxlength="19">
                        </div>
                        <div class="card-row">
                            <div class="checkout-field-wrap">
                                <label class="checkout-field-label" for="cardExpiry">Expiry</label>
                                <input type="text" id="cardExpiry" placeholder="MM/YY" maxlength="5">
                            </div>
                            <div class="checkout-field-wrap">
                                <label class="checkout-field-label" for="cardCvv">CVV</label>
                                <input type="text" id="cardCvv" placeholder="123" maxlength="4">
                            </div>
                        </div>
                        <div class="checkout-field-wrap">
                            <label class="checkout-field-label" for="cardName">Name on card</label>
                            <input type="text" id="cardName" placeholder="Full name">
                        </div>
                    </div>
                </div>

                <!-- Total -->
                <div class="checkout-total-box">
                    <div class="checkout-total-row">
                        <span>Subtotal</span>
                        <span>${formatCurrency(total)}</span>
                    </div>
                    <div class="checkout-total-row is-total">
                        <span>Total</span>
                        <span>${formatCurrency(total)}</span>
                    </div>
                </div>

                <button class="checkout-place-btn" id="checkoutPlaceBtn" disabled>
                    <i class="fas fa-bolt"></i> Place Order · ${formatCurrency(total)}
                </button>
            </div>
        </div>`;
    }

    /* ─────────────────────────────────────────
       OPEN / CLOSE CHECKOUT
    ───────────────────────────────────────── */
    function openCheckout() {
        closeCart();
        selectedPickupTime = "";
        let modal = document.getElementById('checkoutModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'checkout-modal';
            modal.id = 'checkoutModal';
            document.body.appendChild(modal);
        }
        modal.innerHTML = buildCheckoutHTML();
        setTimeout(() => {
            createPickupTimeSelector("pickupTimeMount");
        }, 0);
        checkoutPaymentMethod = null;

        requestAnimationFrame(() => modal.classList.add('is-open'));
        document.body.style.overflow = 'hidden';

        // Bind events
        document.getElementById('checkoutCloseBtn')?.addEventListener('click', closeCheckout);
        document.getElementById('checkoutBackdrop')?.addEventListener('click', closeCheckout);

        modal.querySelectorAll('.payment-method-btn').forEach(btn => {
            btn.addEventListener('click', () => selectPaymentMethod(btn.dataset.method));
        });

        document.getElementById('cardNumber')?.addEventListener('input', formatCardNumber);
        document.getElementById('cardExpiry')?.addEventListener('input', formatExpiry);

        document.getElementById('checkoutPlaceBtn')?.addEventListener('click', placeOrder);
    }

    function closeCheckout() {
        const modal = document.getElementById('checkoutModal');
        if (!modal) return;
        modal.classList.remove('is-open');
        setTimeout(() => modal.remove(), 300);
        document.body.style.overflow = '';
    }

    /* ─────────────────────────────────────────
       PAYMENT METHOD SELECTION
    ───────────────────────────────────────── */
    function selectPaymentMethod(method) {
        checkoutPaymentMethod = method;

        document.querySelectorAll('.payment-method-btn').forEach(btn => {
            btn.classList.toggle('is-selected', btn.dataset.method === method);
        });

        const walletWrap = document.getElementById('walletInputWrap');
        const cardWrap = document.getElementById('cardInputWrap');

        // Show wallet form for bkash/nagad, card form for card
        const isWallet = (method === 'bkash' || method === 'nagad');
        if (walletWrap) walletWrap.classList.toggle('is-visible', isWallet);
        if (cardWrap) cardWrap.classList.toggle('is-visible', method === 'card');

        // Update wallet label based on selected provider
        if (isWallet) {
            const walletLabel = document.querySelector('#walletInputWrap .checkout-field-label');
            if (walletLabel) {
                walletLabel.textContent = method === 'bkash' ? 'bKash number' : 'Nagad number';
            }
        }

        document.getElementById('checkoutPlaceBtn')?.removeAttribute('disabled');
    }

    /* ─────────────────────────────────────────
       CARD INPUT FORMATTERS
    ───────────────────────────────────────── */
    function formatCardNumber(e) {
        let v = e.target.value.replace(/\D/g, '').slice(0, 16);
        e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
    }

    function formatExpiry(e) {
        let v = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
        e.target.value = v;
    }

    /* ─────────────────────────────────────────
       PLACE ORDER — wired to schema
    ───────────────────────────────────────── */
    async function placeOrder() {
        const cart = getCart();
        if (cart.length === 0) return;

        // Validate payment fields
        let paymentAccount = '';
        if (checkoutPaymentMethod === 'bkash' || checkoutPaymentMethod === 'nagad') {
            const num = document.getElementById('walletNumber')?.value.trim();
            if (!num || num.length < 11) {
                shakeField('walletNumber', 'Enter a valid mobile number');
                return;
            }
            paymentAccount = num;
        } else if (checkoutPaymentMethod === 'card') {
            const cardNum = document.getElementById('cardNumber')?.value.replace(/\s/g, '');
            const expiry = document.getElementById('cardExpiry')?.value;
            const cvv = document.getElementById('cardCvv')?.value;
            const cardName = document.getElementById('cardName')?.value.trim();
            if (!cardNum || cardNum.length < 16) { shakeField('cardNumber', 'Enter a valid card number'); return; }
            if (!expiry || expiry.length < 5) { shakeField('cardExpiry', 'Enter expiry'); return; }
            if (!cvv || cvv.length < 3) { shakeField('cardCvv', 'Enter CVV'); return; }
            if (!cardName) { shakeField('cardName', 'Enter name on card'); return; }
            paymentAccount = cardNum;
        } else {
            showCartToast('Please select a payment method.');
            return;
        }

        const user = getAuthUser();
        if (!user || !user.email) {
            showCartToast('Please sign in before placing an order.');
            return;
        }

        try {
            const pickupTime = window.getPickupTime?.() || "";
            if (!pickupTime) {
                showCartToast('Please choose a pickup time.');
                return;
            }

            const response = await window.QuickBiteApi.placeOrder({
                pickup_time: pickupTime,
                payment_method: checkoutPaymentMethod,
                payment_account: paymentAccount,
                items: cart.map(function (item) {
                    return {
                        food_id: item.id,
                        quantity: item.quantity
                    };
                })
            });

            const order = response.order;
            const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
            orders.unshift(order);
            localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

            clearCart();
            closeCheckout();
            openPaymentSuccess(order);
        } catch (error) {
            showCartToast(error.message || 'Failed to place order');
        }
    }

    function shakeField(id, message) {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.borderColor = 'var(--color-red-mid)';
        el.style.boxShadow = '0 0 0 3px var(--red-12)';
        el.setAttribute('placeholder', message);
        el.classList.add('field-shake');
        setTimeout(() => {
            el.style.borderColor = '';
            el.style.boxShadow = '';
            el.classList.remove('field-shake');
        }, 1800);
    }

    /* ─────────────────────────────────────────
       PAYMENT PROCESSING SIMULATION
    ───────────────────────────────────────── */
    function openPaymentProcessing(order) {
        let modal = document.getElementById('paymentProcessingModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'payment-processing-modal';
            modal.id = 'paymentProcessingModal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = buildPaymentProcessingHTML(order);
        requestAnimationFrame(() => modal.classList.add('is-open'));
        document.body.style.overflow = 'hidden';

        // Simulate payment processing
        simulatePaymentVerification(order);
    }

    function buildPaymentProcessingHTML(order) {
        const method = String(order.payment?.method || '');
        const normalizedMethod = method.toLowerCase();
        const methodIcon = normalizedMethod === 'card' ? 'fa-credit-card' : 'fa-mobile-screen-button';
        const methodLabel = normalizedMethod === 'card' ? 'Card Payment' :
            normalizedMethod === 'bkash' ? 'bKash Payment' :
                normalizedMethod === 'nagad' ? 'Nagad Payment' : 'Payment';

        return `
        <div class="payment-processing-backdrop" id="paymentProcessingBackdrop"></div>
        <div class="payment-processing-panel">
            <div class="payment-spinner-wrap">
                <div class="payment-spinner">
                    <i class="fas ${methodIcon}"></i>
                </div>
            </div>
            
            <h2 class="payment-processing-title">Processing Payment</h2>
            <p class="payment-processing-sub">Please wait while we verify your ${methodLabel}</p>

            <div class="payment-progress-bar">
                <div class="payment-progress-fill" id="paymentProgressFill"></div>
            </div>

            <div class="payment-steps">
                <div class="payment-step is-active" id="payStep1">
                    <div class="payment-step-icon"><i class="fas fa-lock"></i></div>
                    <span>Securing connection</span>
                </div>
                <div class="payment-step" id="payStep2">
                    <div class="payment-step-icon"><i class="fas fa-check-double"></i></div>
                    <span>Verifying details</span>
                </div>
                <div class="payment-step" id="payStep3">
                    <div class="payment-step-icon"><i class="fas fa-receipt"></i></div>
                    <span>Generating receipt</span>
                </div>
            </div>

            <div class="payment-amount-display">
                <span class="payment-amount-label">Amount</span>
                <span class="payment-amount-value">${formatCurrency(order.total_amount)}</span>
            </div>
        </div>`;
    }

    function simulatePaymentVerification(order) {
        const backdrop = document.getElementById('paymentProcessingBackdrop');
        backdrop?.addEventListener('click', () => {
            // Prevent closing during processing
            showCartToast('Payment is being processed. Please wait...');
        });

        const progressFill = document.getElementById('paymentProgressFill');

        // Step 1: Securing connection (0-33%)
        setTimeout(() => {
            if (progressFill) progressFill.style.width = '33%';
            document.getElementById('payStep1')?.classList.add('is-active');
        }, 500);

        // Step 2: Verifying details (33-66%)
        setTimeout(() => {
            if (progressFill) progressFill.style.width = '66%';
            document.getElementById('payStep1')?.classList.remove('is-active');
            document.getElementById('payStep1')?.classList.add('is-done');
            document.getElementById('payStep2')?.classList.add('is-active');
        }, 1500);

        // Step 3: Generating receipt (66-100%)
        setTimeout(() => {
            if (progressFill) progressFill.style.width = '100%';
            document.getElementById('payStep2')?.classList.remove('is-active');
            document.getElementById('payStep2')?.classList.add('is-done');
            document.getElementById('payStep3')?.classList.add('is-active');
        }, 2500);

        // Payment success
        setTimeout(() => {
            document.getElementById('payStep3')?.classList.remove('is-active');
            document.getElementById('payStep3')?.classList.add('is-done');

            // Generate transaction ID
            const transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
            order.payment.transaction_id = transactionId;
            order.payment.status = 'success';
            order.payment.paid_at = new Date().toISOString();

            // Update order in localStorage
            const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
            const orderIdx = orders.findIndex(o => o.order_id === order.order_id);
            if (orderIdx !== -1) {
                orders[orderIdx] = order;
                localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
            }

            // Close processing modal and show success
            closePaymentProcessing();
            openPaymentSuccess(order);
        }, 3500);
    }

    function closePaymentProcessing() {
        const modal = document.getElementById('paymentProcessingModal');
        if (!modal) return;
        modal.classList.remove('is-open');
        setTimeout(() => modal.remove(), 300);
    }

    /* ─────────────────────────────────────────
       PAYMENT SUCCESS MODAL
    ───────────────────────────────────────── */
    function openPaymentSuccess(order) {
        let modal = document.getElementById('paymentSuccessModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'payment-success-modal';
            modal.id = 'paymentSuccessModal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = buildPaymentSuccessHTML(order);
        requestAnimationFrame(() => modal.classList.add('is-open'));

        document.getElementById('paymentSuccessCloseBtn')?.addEventListener('click', () => {
            closePaymentSuccess();
        });
        document.getElementById('paymentSuccessBackdrop')?.addEventListener('click', () => {
            closePaymentSuccess();
        });
    }

    function buildPaymentSuccessHTML(order) {
        const transactionId = order.payment?.transaction_id || 'N/A';
        const payMethod = order.payment?.method || 'Bkash';
        const paidAt = order.payment?.paid_at
            ? new Date(order.payment.paid_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
        <div class="payment-success-backdrop" id="paymentSuccessBackdrop"></div>
        <div class="payment-success-panel">
            <div class="payment-success-icon">
                <div class="success-checkmark">
                    <i class="fas fa-check"></i>
                </div>
            </div>
            
            <h2 class="payment-success-title">Payment Successful!</h2>
            <p class="payment-success-sub">Your transaction has been completed</p>

            <div class="payment-receipt-card">
                <div class="receipt-header">
                    <i class="fas fa-receipt"></i>
                    <span>Payment Receipt</span>
                </div>
                
                <div class="receipt-row">
                    <span class="receipt-label">Transaction ID</span>
                    <span class="receipt-value receipt-mono">${transactionId}</span>
                </div>
                
                <div class="receipt-row">
                    <span class="receipt-label">Amount Paid</span>
                    <span class="receipt-value receipt-amount">${formatCurrency(order.total_amount)}</span>
                </div>
                
                <div class="receipt-row">
                    <span class="receipt-label">Payment Method</span>
                    <span class="receipt-value">${payMethod}</span>
                </div>
                
                <div class="receipt-row">
                    <span class="receipt-label">Order Placed Time</span>
                    <span class="receipt-value">${paidAt}</span>
                </div>
                
                <div class="receipt-row">
                    <span class="receipt-label">Status</span>
                    <span class="receipt-value receipt-status">✓ Success</span>
                </div>
            </div>

            <button class="payment-success-btn" id="paymentSuccessCloseBtn" onclick="window.location.href='customer-dashboard.html'">
                <i class="fas fa-check"></i> Track Your Order
            </button>
        </div>`;
    }

    function closePaymentSuccess() {
        const modal = document.getElementById('paymentSuccessModal');
        if (!modal) return;
        modal.classList.remove('is-open');
        setTimeout(() => modal.remove(), 300);
        document.body.style.overflow = '';
    }

    /* ─────────────────────────────────────────
       TOAST NOTIFICATION
    ───────────────────────────────────────── */
    function showCartToast(message) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, 'info');
            return;
        }

        window.alert(message);
    }

    /* ─────────────────────────────────────────
       HELPERS
    ───────────────────────────────────────── */
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(amount);
    }

    function generateOrderId() {
        return Date.now() + Math.floor(Math.random() * 10000);
    }

    function getAuthUser() {
        try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || null; }
        catch { return null; }
    }

    /* ─────────────────────────────────────────
       INIT — mount drawer and bind global events
    ───────────────────────────────────────── */
    function init() {
        // Mount drawer
        const mount = document.createElement('div');
        mount.id = 'cartMount';
        mount.innerHTML = buildDrawerHTML();
        document.body.appendChild(mount);

        syncCartBadge();

        // Open cart on cart icon click
        document.addEventListener('click', e => {
            if (e.target.closest('#headerCartBtn') || e.target.closest('.cart-icon')) {
                e.preventDefault();
                openCart();
            }
        });

        // Close on overlay click (using event delegation for reliability)
        document.addEventListener('click', e => {
            if (e.target.id === 'cartOverlay') closeCart();
            if (e.target.closest('#cartCloseBtn')) closeCart();
        });

        // Checkout button
        document.addEventListener('click', e => {
            if (e.target.closest('#cartCheckoutBtn')) openCheckout();
        });

        // Clear cart button
        document.addEventListener('click', e => {
            if (e.target.closest('#cartClearBtn')) {
                clearCart();
                renderCartDrawer();
            }
        });

        // ESC to close
        document.addEventListener('keydown', e => {
            if (e.key !== 'Escape') return;
            closePaymentSuccess();
            closeCheckout();
            closeCart();
        });

        // Intercept all add-to-cart buttons (works for dynamically rendered items)
        document.addEventListener('click', e => {
            const btn = e.target.closest('.add-to-cart[data-item-id]');
            if (!btn) return;
            e.stopPropagation();

            // Try to find item in global data sources
            const itemId = Number(btn.getAttribute('data-item-id'));
            const item = findItemGlobally(itemId);
            if (item) addToCartGlobal(item);
        });
    }

    // Look up an item across any globally available data arrays
    function findItemGlobally(id) {
        if (window.menuItems) {
            const found = window.menuItems.find(i => i.id === id);
            if (found) return found;
        }
        // Fallback: read from cart (already added)
        return getCart().find(i => i.id === id) || null;
    }

    /* ─────────────────────────────────────────
       EXPOSE PUBLIC API
    ───────────────────────────────────────── */
    window.QuickBiteCart = {
        add: addToCartGlobal,
        addAndCheckout(item) {
            addToCartGlobal(item, { openCartAfterAdd: false });
            openCheckout();
        },
        open: openCart,
        openCheckout: openCheckout,
        close: closeCart,
        getCart: getCart,
        clearCart: clearCart,
        syncBadge: syncCartBadge,
    };

    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
