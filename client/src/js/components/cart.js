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
    const CART_KEY    = 'quickbite-cart';
    const ORDERS_KEY  = 'quickbite-orders';
    const AUTH_KEY    = 'quickbite-auth-user';

    let checkoutPaymentMethod = null; // 'bkash' | 'nagad' | 'card'

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

    function addToCartGlobal(item) {
        const cart = getCart();
        const existing = cart.find(c => c.id === item.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                id        : item.id,
                name      : item.name,
                price     : item.price,
                image     : item.image || '',
                vendor    : item.vendor || item.managed_by || '',
                vendor_id : item.vendor_id || null,
                quantity  : 1,
            });
        }
        saveCart(cart);
        // Auto-open cart after adding item
        openCart();
    }

    function updateQty(itemId, delta) {
        const cart = getCart();
        const idx  = cart.findIndex(c => c.id === itemId);
        if (idx === -1) return;
        cart[idx].quantity += delta;
        if (cart[idx].quantity <= 0) cart.splice(idx, 1);
        saveCart(cart);
    }

    function removeFromCart(itemId) {
        const cart = getCart().filter(c => c.id !== itemId);
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
        const cart   = getCart();
        const body   = document.getElementById('cartBody');
        const footer = document.getElementById('cartFooter');
        const badge  = document.getElementById('cartCountBadge');
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
        document.getElementById('cartTotal').textContent    = formatCurrency(total);
        if (footer) footer.style.display = 'block';

        // Qty controls
        body.querySelectorAll('.qty-minus').forEach(btn => {
            btn.addEventListener('click', () => { updateQty(Number(btn.dataset.id), -1); });
        });
        body.querySelectorAll('.qty-plus').forEach(btn => {
            btn.addEventListener('click', () => { updateQty(Number(btn.dataset.id), +1); });
        });
        body.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', () => { removeFromCart(Number(btn.dataset.id)); });
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

    /* ─────────────────────────────────────────
       BUILD CHECKOUT MODAL HTML
    ───────────────────────────────────────── */
    function buildCheckoutHTML() {
        const cart  = getCart();
        const total = cartTotal(cart);

        const itemRows = cart.map(item => `
            <div class="checkout-order-item">
                <div class="checkout-order-item-name">
                    <span class="checkout-order-item-qty">${item.quantity}</span>
                    ${item.name}
                </div>
                <span class="checkout-order-item-price">${formatCurrency(item.price * item.quantity)}</span>
            </div>`).join('');

        // Default pickup = 30 minutes from now
        const pickupDefault = new Date(Date.now() + 30 * 60 * 1000);
        const pickupStr     = pickupDefault.toISOString().slice(0, 16);

        return `
        <div class="checkout-backdrop" id="checkoutBackdrop"></div>
        <div class="checkout-panel" role="dialog" aria-modal="true" aria-label="Checkout">
            <div class="checkout-panel-header">
                <h2><i class="fas fa-receipt" style="color:var(--color-red);margin-right:8px;font-size:16px;"></i>Checkout</h2>
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
                    <div class="checkout-field-wrap">
                        <label class="checkout-field-label" for="checkoutPickupTime">Preferred pickup time</label>
                        <input type="datetime-local" id="checkoutPickupTime" value="${pickupStr}" min="${pickupStr}">
                    </div>
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
        let modal = document.getElementById('checkoutModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'checkout-modal';
            modal.id        = 'checkoutModal';
            document.body.appendChild(modal);
        }
        modal.innerHTML = buildCheckoutHTML();
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
        const cardWrap   = document.getElementById('cardInputWrap');

        // Show wallet form for bkash/nagad, card form for card
        const isWallet = (method === 'bkash' || method === 'nagad');
        if (walletWrap) walletWrap.classList.toggle('is-visible', isWallet);
        if (cardWrap)   cardWrap.classList.toggle('is-visible',   method === 'card');

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
    function placeOrder() {
        const cart = getCart();
        if (cart.length === 0) return;

        // Validate payment fields
        if (checkoutPaymentMethod === 'bkash' || checkoutPaymentMethod === 'nagad') {
            const num = document.getElementById('walletNumber')?.value.trim();
            if (!num || num.length < 11) {
                shakeField('walletNumber', 'Enter a valid mobile number');
                return;
            }
        } else if (checkoutPaymentMethod === 'card') {
            const cardNum  = document.getElementById('cardNumber')?.value.replace(/\s/g, '');
            const expiry   = document.getElementById('cardExpiry')?.value;
            const cvv      = document.getElementById('cardCvv')?.value;
            const cardName = document.getElementById('cardName')?.value.trim();
            if (!cardNum || cardNum.length < 16) { shakeField('cardNumber', 'Enter a valid card number'); return; }
            if (!expiry || expiry.length < 5)    { shakeField('cardExpiry', 'Enter expiry');              return; }
            if (!cvv   || cvv.length < 3)        { shakeField('cardCvv',    'Enter CVV');                 return; }
            if (!cardName)                        { shakeField('cardName',   'Enter name on card');        return; }
        }

        const pickupTime = document.getElementById('checkoutPickupTime')?.value || '';
        const user       = getAuthUser();
        const orderId    = generateOrderId();
        const total      = cartTotal(cart);

        // Build ORDER object (matches schema)
        const order = {
            order_id     : orderId,
            customer_id  : user?.user_id || null,
            vendor_id    : cart[0]?.vendor_id || null,
            vendor       : cart[0]?.vendor || "QuickBite Vendor",
            total_amount : total,
            status       : 'pending',
            created_at   : new Date().toISOString(),
            pickup_time  : pickupTime,
            items        : cart.map(item => ({
                order_item_id : generateOrderId(),
                order_id      : orderId,
                food_id       : item.id,
                item_name     : item.name,
                quantity      : item.quantity,
                unit_price    : item.price,
                total_price   : item.price * item.quantity,
            })),
            payment: {
                payment_id : generateOrderId(),
                order_id   : orderId,
                method     : checkoutPaymentMethod,
                status     : 'pending',
                amount     : total,
                paid_at    : null,
                transaction_id: null,
            }
        };

        // Save order to localStorage (replace with API call)
        const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
        orders.unshift(order);
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

        clearCart();
        closeCheckout();
        
        // Show payment processing simulation
        openPaymentProcessing(order);

        console.log('Order placed:', order);
    }

    function shakeField(id, message) {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.borderColor = 'var(--color-red-mid)';
        el.style.boxShadow   = '0 0 0 3px var(--red-12)';
        el.setAttribute('placeholder', message);
        el.classList.add('field-shake');
        setTimeout(() => {
            el.style.borderColor = '';
            el.style.boxShadow   = '';
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
            modal.id        = 'paymentProcessingModal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = buildPaymentProcessingHTML(order);
        requestAnimationFrame(() => modal.classList.add('is-open'));
        document.body.style.overflow = 'hidden';

        // Simulate payment processing
        simulatePaymentVerification(order);
    }

    function buildPaymentProcessingHTML(order) {
        const method = order.payment?.method || 'wallet';
        const methodIcon = method === 'card' ? 'fa-credit-card' : 'fa-mobile-screen-button';
        const methodLabel = method === 'card' ? 'Card Payment' : 
                           method === 'bkash' ? 'bKash Payment' : 
                           method === 'nagad' ? 'Nagad Payment' : 'Wallet Payment';

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
            modal.id        = 'paymentSuccessModal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = buildPaymentSuccessHTML(order);
        requestAnimationFrame(() => modal.classList.add('is-open'));

        document.getElementById('paymentSuccessCloseBtn')?.addEventListener('click', () => {
            closePaymentSuccess();
            openOrderStatus(order);
        });
        document.getElementById('paymentSuccessBackdrop')?.addEventListener('click', () => {
            closePaymentSuccess();
            openOrderStatus(order);
        });
    }

    function buildPaymentSuccessHTML(order) {
        const transactionId = order.payment?.transaction_id || 'N/A';
        const payMethod = order.payment?.method?.toUpperCase() || 'WALLET';
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
                    <span class="receipt-label">Paid At</span>
                    <span class="receipt-value">${paidAt}</span>
                </div>
                
                <div class="receipt-row">
                    <span class="receipt-label">Status</span>
                    <span class="receipt-value receipt-status">✓ Success</span>
                </div>
            </div>

            <button class="payment-success-btn" id="paymentSuccessCloseBtn">
                <i class="fas fa-arrow-right"></i> Continue to Order Tracking
            </button>
        </div>`;
    }

    function closePaymentSuccess() {
        const modal = document.getElementById('paymentSuccessModal');
        if (!modal) return;
        modal.classList.remove('is-open');
        setTimeout(() => modal.remove(), 300);
    }

    /* ─────────────────────────────────────────
       ORDER STATUS MODAL
    ───────────────────────────────────────── */
    const ORDER_STEPS = ['pending', 'preparing', 'ready', 'completed'];
    const STEP_LABELS = ['Placed', 'Preparing', 'Ready', 'Done'];
    const STEP_ICONS  = ['fa-check', 'fa-fire', 'fa-bell', 'fa-bag-shopping'];

    function openOrderStatus(order) {
        let modal = document.getElementById('orderStatusModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'order-status-modal';
            modal.id        = 'orderStatusModal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = buildOrderStatusHTML(order);
        requestAnimationFrame(() => modal.classList.add('is-open'));
        document.body.style.overflow = 'hidden';

        document.getElementById('orderDismissBtn')?.addEventListener('click', closeOrderStatus);
        document.getElementById('orderStatusBackdrop')?.addEventListener('click', closeOrderStatus);

        // Simulate status progression
        simulateOrderProgress(order.order_id);
    }

    function buildOrderStatusHTML(order) {
        const tokenNum   = String(order.order_id).slice(-4);
        const activeIdx  = ORDER_STEPS.indexOf(order.status);

        // Build stepper
        let stepperHTML = '';
        ORDER_STEPS.forEach((step, i) => {
            const isDone   = i < activeIdx;
            const isActive = i === activeIdx;
            const cls      = isDone ? 'is-done' : isActive ? 'is-active' : '';
            stepperHTML += `<div class="order-step ${cls}">
                <div class="order-step-dot"><i class="fas ${STEP_ICONS[i]}"></i></div>
                <span class="order-step-label">${STEP_LABELS[i]}</span>
            </div>`;
            if (i < ORDER_STEPS.length - 1) {
                stepperHTML += `<div class="order-step-line ${isDone ? 'is-done' : ''}"></div>`;
            }
        });

        const pickupDisplay = order.pickup_time
            ? new Date(order.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'ASAP';

        const payMethod = order.payment?.method?.toUpperCase() || '—';
        const paymentStatus = order.payment?.status === 'success' ? '✓ Paid' : 'Pending';

        return `
        <div class="order-status-backdrop" id="orderStatusBackdrop"></div>
        <div class="order-status-panel">
            <div class="order-status-icon">
                <i class="fas fa-check"></i>
            </div>
            <h2 class="order-status-title">Order Placed!</h2>
            <p class="order-status-sub">Your platter is being prepared. Show your token at pickup.</p>

            <div class="order-token-pill">
                <span class="order-token-label">Token</span>
                <span class="order-token-value" id="orderTokenDisplay">#${tokenNum}</span>
            </div>

            <div class="order-stepper" id="orderStepper">${stepperHTML}</div>

            <div class="order-detail-rows">
                <div class="order-detail-row">
                    <span>Pickup time</span>
                    <span>${pickupDisplay}</span>
                </div>
                <div class="order-detail-row">
                    <span>Payment</span>
                    <span>${payMethod}</span>
                </div>
                <div class="order-detail-row">
                    <span>Payment Status</span>
                    <span style="color:${order.payment?.status === 'success' ? '#10b981' : 'var(--color-red)'};font-weight:700;">${paymentStatus}</span>
                </div>
                <div class="order-detail-row">
                    <span>Total</span>
                    <span style="color:var(--color-red);font-family:var(--font-secondary);">${formatCurrency(order.total_amount)}</span>
                </div>
                <div class="order-detail-row">
                    <span>Status</span>
                    <span id="orderStatusText" style="color:var(--color-red);font-weight:700;text-transform:capitalize;">${order.status}</span>
                </div>
            </div>

            <button class="order-dismiss-btn" id="orderDismissBtn">
                Got it — Track my order
            </button>
        </div>`;
    }

    function simulateOrderProgress(orderId) {
        let currentIdx = 0;
        const interval = setInterval(() => {
            currentIdx++;
            if (currentIdx >= ORDER_STEPS.length) {
                clearInterval(interval);
                return;
            }

            const newStatus = ORDER_STEPS[currentIdx];

            // Update saved order
            const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
            const order  = orders.find(o => o.order_id === orderId);
            if (order) {
                order.status = newStatus;
                localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
            }

            // Update status text live
            const statusText = document.getElementById('orderStatusText');
            if (statusText) statusText.textContent = newStatus;

            // Rebuild stepper
            const stepper = document.getElementById('orderStepper');
            if (!stepper) { clearInterval(interval); return; }

            let stepperHTML = '';
            ORDER_STEPS.forEach((step, i) => {
                const isDone   = i < currentIdx;
                const isActive = i === currentIdx;
                const cls      = isDone ? 'is-done' : isActive ? 'is-active' : '';
                stepperHTML += `<div class="order-step ${cls}">
                    <div class="order-step-dot"><i class="fas ${STEP_ICONS[i]}"></i></div>
                    <span class="order-step-label">${STEP_LABELS[i]}</span>
                </div>`;
                if (i < ORDER_STEPS.length - 1) {
                    stepperHTML += `<div class="order-step-line ${isDone ? 'is-done' : ''}"></div>`;
                }
            });
            stepper.innerHTML = stepperHTML;

        }, 8000); // advance every 8 seconds (demo — replace with real polling)
    }

    function closeOrderStatus() {
        const modal = document.getElementById('orderStatusModal');
        if (!modal) return;
        modal.classList.remove('is-open');
        setTimeout(() => modal.remove(), 300);
        document.body.style.overflow = '';
    }

    /* ─────────────────────────────────────────
       TOAST NOTIFICATION
    ───────────────────────────────────────── */
    function showCartToast(message) {
        document.querySelectorAll('.cart-toast').forEach(t => t.remove());
        const toast = document.createElement('div');
        toast.className = 'notification cart-toast';
        toast.innerHTML = `<i class="fas fa-cart-plus" style="color:var(--color-red);margin-right:8px;"></i>${message}`;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.transform = 'translateX(0)'; }, 30);
        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
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
        mount.id    = 'cartMount';
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
            closeOrderStatus();
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
            const item   = findItemGlobally(itemId);
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
        add        : addToCartGlobal,
        open       : openCart,
        close      : closeCart,
        getCart    : getCart,
        clearCart  : clearCart,
        syncBadge  : syncCartBadge,
    };

    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
