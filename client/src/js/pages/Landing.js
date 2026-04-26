let vendors = [];
let menuItems = [];

window.menuItems = menuItems;

document.addEventListener("DOMContentLoaded", async function () {
    initializeNavigation();
    initializeBackToTop();

    try {
        const data = await window.QuickBiteApi.getCatalog();
        vendors = data.vendors || [];
        menuItems = (data.foods || []).filter(function (item) {
            return item.is_available;
        });
        window.menuItems = menuItems;
    } catch (error) {
        vendors = [];
        menuItems = [];
        window.menuItems = menuItems;
    }

    initializeSearch();
    renderVendors();
    renderTrendingItems();
    initializeFoodPreviewModal();
    initializeAnimations();
    updateCartCount();
});

/* ─── BACK TO TOP ─── */
function initializeBackToTop() {
    const backToTopButton = document.createElement("button");
    backToTopButton.type = "button";
    backToTopButton.className = "back-to-top";
    backToTopButton.setAttribute("aria-label", "Back to top");
    backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(backToTopButton);

    function syncBackToTopVisibility() {
        backToTopButton.classList.toggle("is-visible", window.scrollY > 320);
    }

    backToTopButton.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", syncBackToTopVisibility, { passive: true });
    syncBackToTopVisibility();
}

/* ─── NAV ─── */
function initializeNavigation() {
    const navToggle = document.getElementById("navToggle");
    const navMenu = document.getElementById("navMenu");

    if (navToggle && navMenu) {
        navToggle.addEventListener("click", function () {
            navMenu.classList.toggle("active");
        });

        document.addEventListener("click", function (event) {
            if (!navToggle.contains(event.target) && !navMenu.contains(event.target)) {
                navMenu.classList.remove("active");
            }
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener("click", function (e) {
            const target = this.getAttribute("href");
            if (!target || target === "#" || target.includes("?")) return;
            const targetElement = document.querySelector(target);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
                if (navMenu) navMenu.classList.remove("active");
            }
        });
    });
}

/* ─── SEARCH ─── */
function initializeSearch() {
    const searchForm = document.getElementById("heroSearch");
    const searchInput = document.getElementById("searchInput");
    const inputContainer = searchInput ? searchInput.closest(".search-input-container") : null;
    const maxSuggestions = 6;
    let activeIndex = -1;
    let currentSuggestions = [];

    if (!searchForm || !searchInput || !inputContainer) return;

    const suggestionBox = document.createElement("div");
    suggestionBox.className = "search-suggestions";
    suggestionBox.setAttribute("aria-live", "polite");
    inputContainer.appendChild(suggestionBox);

    function renderSuggestions() {
        if (currentSuggestions.length === 0) {
            suggestionBox.classList.remove("is-visible");
            suggestionBox.innerHTML = "";
            activeIndex = -1;
            return;
        }

        suggestionBox.classList.add("is-visible");
        suggestionBox.innerHTML = currentSuggestions
            .map(function (item, index) {
                const isActive = index === activeIndex ? " is-active" : "";
                return `
                    <button type="button" class="search-suggestion-item${isActive}" data-item-id="${item.id}">
                        <img src="${item.image}" alt="${item.name}" class="search-suggestion-image">
                        <div class="search-suggestion-main">
                            <span class="search-suggestion-name">${item.name}</span>
                            <span class="search-suggestion-vendor">${item.vendor}</span>
                        </div>
                        <span class="search-suggestion-price">${formatCurrency(item.price)}</span>
                    </button>
                `;
            })
            .join("");
    }

    function updateSuggestions(query) {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) {
            currentSuggestions = [];
            renderSuggestions();
            return;
        }

        currentSuggestions = menuItems
            .filter(function (item) {
                return (
                    item.name.toLowerCase().includes(normalizedQuery) ||
                    item.vendor.toLowerCase().includes(normalizedQuery)
                );
            })
            .slice(0, maxSuggestions);
        activeIndex = -1;
        renderSuggestions();
    }

    function chooseSuggestion(item) {
        searchInput.value = item.name;
        currentSuggestions = [];
        renderSuggestions();
        showNotification(item.name + " by " + item.vendor + " selected");
    }

    searchInput.addEventListener("input", function () {
        updateSuggestions(searchInput.value);
    });

    searchInput.addEventListener("focus", function () {
        if (searchInput.value.trim()) updateSuggestions(searchInput.value);
    });

    searchInput.addEventListener("keydown", function (event) {
        if (!currentSuggestions.length) return;

        if (event.key === "ArrowDown") {
            event.preventDefault();
            activeIndex = (activeIndex + 1) % currentSuggestions.length;
            renderSuggestions();
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            activeIndex = (activeIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
            renderSuggestions();
        } else if (event.key === "Enter" && activeIndex >= 0) {
            event.preventDefault();
            chooseSuggestion(currentSuggestions[activeIndex]);
        } else if (event.key === "Escape") {
            currentSuggestions = [];
            renderSuggestions();
        }
    });

    suggestionBox.addEventListener("click", function (event) {
        const itemElement = event.target.closest(".search-suggestion-item");
        if (!itemElement) return;

        const itemId = itemElement.getAttribute("data-item-id");
        const selectedItem = menuItems.find(function (item) {
            return String(item.id) === String(itemId);
        });

        if (selectedItem) chooseSuggestion(selectedItem);
    });

    document.addEventListener("click", function (event) {
        if (!searchForm.contains(event.target)) {
            currentSuggestions = [];
            renderSuggestions();
        }
    });

    searchForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            showNotification('Showing results for "' + searchTerm + '"');
            searchInput.value = "";
        }
    });
}

/* ─── ORDER PILL ─── */
const orderShell = document.getElementById("orderShell");
const pill = document.getElementById("orderPill");
const statusText = document.getElementById("statusText");
const timeEl = document.getElementById("timeLeft");
let minutes = 10;

// The global layout script owns the real order pill.
if (!window.__qbOrderPillManaged && orderShell && pill && timeEl && statusText) {
    syncOrderPillState();

    pill.addEventListener("click", function () {
        if (pill.classList.contains("is-ready")) return;
        const isExpanded = pill.classList.toggle("expanded");
        pill.setAttribute("aria-expanded", String(isExpanded));
    });

    window.addEventListener("scroll", syncOrderPillState, { passive: true });

    setInterval(function () {
        if (minutes > 0) {
            minutes--;
            if (minutes === 0) {
                statusText.textContent = "Order is ready";
                timeEl.textContent = "Ready now";
                pill.classList.remove("expanded");
                pill.classList.add("is-ready");
                pill.setAttribute("aria-expanded", "false");
            } else {
                timeEl.textContent = minutes + " mins left";
            }
        }
    }, 60000);
}

function syncOrderPillState() {
    if (!orderShell || !pill) return;
    orderShell.classList.toggle("is-docked", window.scrollY > 50);
}

/* ─── VENDORS ─── */
function renderVendors() {
    const track = document.getElementById("vendorsGrid");
    const dotsWrap = document.getElementById("vendorsCarouselDots");
    const prevBtn = document.getElementById("vendorPrev");
    const nextBtn = document.getElementById("vendorNext");
    if (!track) return;

    const topVendors = vendors
        .slice()
        .sort((a, b) => b.totalOrders - a.totalOrders);

    if (topVendors.length === 0) {
        track.parentElement.innerHTML = `
            <div class="vslider-empty">
                <i class="fas fa-store" style="font-size:2rem;opacity:0.3;"></i>
                <span>No vendors available right now</span>
            </div>`;
        return;
    }

    let current = 0;
    let autoTimer = null;
    let dragStartX = 0;
    let dragStarted = false;
    let isDragging = false;

    // Render cards
    track.innerHTML = topVendors.map((v, i) => `
        <div class="vslider-card" data-index="${i}">
            <div class="vslider-img-panel">
                <img src="${v.image}" alt="${v.name}" class="vslider-img" loading="${i === 0 ? 'eager' : 'lazy'}">
                <div class="vslider-img-overlay"></div>
                <div class="vslider-rank">#${i + 1}</div>
                <div class="vslider-progress" id="vsliderProgress${i}" style="width:0%"></div>
            </div>
            <div class="vslider-content">
                <div>
                    <div class="vslider-meta">
                        <span class="vslider-tag"><i class="fas fa-store"></i> ${v.cuisine}</span>
                        <span class="vslider-tag"><i class="fas fa-clock"></i> ${v.eta}</span>
                        <span class="vslider-tag"><i class="fas fa-bolt"></i> ${v.badge}</span>
                    </div>
                    <h3 class="vslider-name" style="margin-top:0.7rem;">${v.name}</h3>
                    <p class="vslider-desc" style="margin-top:0.6rem;">High-energy meals with reliable prep and crowd-loved flavor.</p>
                </div>
                <div class="vslider-stats">
                    <div class="vslider-stat">
                        <span class="vslider-stat-val">★ ${v.rating}</span>
                        <span class="vslider-stat-label">Rating</span>
                    </div>
                    <div class="vslider-stat">
                        <span class="vslider-stat-val">${v.totalOrders}+</span>
                        <span class="vslider-stat-label">Orders</span>
                    </div>
                </div>
                <a
                    class="vendors-link-btn vslider-cta"
                    href="vendor.html?vendorId=${encodeURIComponent(v.id)}"
                    data-vendor-id="${String(v.id)}"
                >View vendor</a>
            </div>
        </div>
    `).join("");

    // Render dots
    if (dotsWrap) {
        dotsWrap.innerHTML = topVendors.map((_, i) =>
            `<button class="vslider-dot${i === 0 ? " is-active" : ""}" aria-label="Go to vendor ${i + 1}" data-dot="${i}"></button>`
        ).join("");
        dotsWrap.querySelectorAll(".vslider-dot").forEach(dot => {
            dot.addEventListener("click", () => goTo(parseInt(dot.dataset.dot)));
        });
    }

    function goTo(index, skipAutoReset = false) {
        current = (index + topVendors.length) % topVendors.length;
        track.style.transform = `translateX(-${current * 100}%)`;

        // Dots
        dotsWrap && dotsWrap.querySelectorAll(".vslider-dot").forEach((d, i) => {
            d.classList.toggle("is-active", i === current);
        });

        // Arrows
        if (prevBtn) prevBtn.disabled = false;
        if (nextBtn) nextBtn.disabled = false;

        // Progress bar restart on active card
        document.querySelectorAll(".vslider-progress").forEach((bar, i) => {
            bar.style.transition = "none";
            bar.style.width = "0%";
            if (i === current) {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        bar.style.transition = "width 3.8s linear";
                        bar.style.width = "100%";
                    });
                });
            }
        });

        if (!skipAutoReset) resetAutoplay();
    }

    function resetAutoplay() {
        clearInterval(autoTimer);
        autoTimer = setInterval(() => goTo(current + 1, true), 3800);
    }

    // Arrows
    prevBtn && prevBtn.addEventListener("click", () => goTo(current - 1));
    nextBtn && nextBtn.addEventListener("click", () => goTo(current + 1));

    // Keyboard
    document.addEventListener("keydown", e => {
        const root = document.getElementById("vendorsSliderRoot");
        if (!root) return;
        if (e.key === "ArrowLeft") goTo(current - 1);
        if (e.key === "ArrowRight") goTo(current + 1);
    });

    // Drag / swipe
    track.addEventListener("pointerdown", e => {
        if (e.button !== 0) return;
        if (e.target.closest("a, button")) return;
        dragStartX = e.clientX;
        dragStarted = true;
        isDragging = false;
        track.classList.add("is-dragging");
        track.setPointerCapture(e.pointerId);
        clearInterval(autoTimer);
    });

    track.addEventListener("pointermove", e => {
        if (!dragStarted) return;
        if (Math.abs(e.clientX - dragStartX) > 8) isDragging = true;
    });

    track.addEventListener("pointerup", e => {
        if (!dragStarted) return;
        dragStarted = false;
        track.classList.remove("is-dragging");
        if (track.hasPointerCapture(e.pointerId)) {
            track.releasePointerCapture(e.pointerId);
        }
        const delta = e.clientX - dragStartX;
        if (Math.abs(delta) > 50) {
            goTo(delta < 0 ? current + 1 : current - 1);
        } else {
            resetAutoplay();
        }
        setTimeout(() => { isDragging = false; }, 80);
    });

    track.addEventListener("pointercancel", e => {
        dragStarted = false;
        track.classList.remove("is-dragging");
        if (track.hasPointerCapture(e.pointerId)) {
            track.releasePointerCapture(e.pointerId);
        }
        resetAutoplay();
    });

    // CTA click
    track.addEventListener("click", e => {
        if (isDragging) return;
        const btn = e.target.closest(".vslider-cta");
        if (btn) {
            e.stopPropagation();
            window.location.href = "vendor.html?vendorId=" + encodeURIComponent(btn.dataset.vendorId);
        }
    });

    // Pause on hover
    const root = document.getElementById("vendorsSliderRoot");
    root && root.addEventListener("mouseenter", () => clearInterval(autoTimer));
    root && root.addEventListener("mouseleave", resetAutoplay);

    goTo(0);
}

/* ─── TRENDING ITEMS + INDUSTRY CAROUSEL ─── */
function renderTrendingItems() {
    const trendingGrid = document.getElementById("trendingGrid");
    const carouselLeft = document.getElementById("carouselLeft");
    const carouselRight = document.getElementById("carouselRight");
    const carouselWrapper = trendingGrid ? trendingGrid.closest(".carousel-wrapper") : null;

    if (!trendingGrid) return;

    const bestSellerItems = menuItems.slice(0, 6);

    function setCarouselVisibility(showButtons) {
        if (carouselLeft) carouselLeft.style.display = showButtons ? "" : "none";
        if (carouselRight) carouselRight.style.display = showButtons ? "" : "none";
    }

    if (bestSellerItems.length === 0) {
        trendingGrid.classList.add("carousel-track-empty");
        setCarouselVisibility(false);
        trendingGrid.innerHTML = `
            <article class="food-card food-card-empty">
                <div class="food-info">
                    <h3 class="food-name">No menu available</h3>
                    <p class="food-description">No food items are available right now.</p>
                </div>
            </article>
        `;
        return;
    }

    trendingGrid.classList.remove("carousel-track-empty");
    setCarouselVisibility(true);

    trendingGrid.innerHTML = bestSellerItems
        .map(function (item, index) {
            return `
                <article class="food-card animate-fade-in-up" data-item-id="${item.id}" style="animation-delay: ${index * 0.08}s" role="button" tabindex="0" aria-label="View ${item.name}">
                    <div class="food-image-wrap">
                        <img src="${item.image}" alt="${item.name}" class="food-image" loading="lazy">
                        <span class="food-badge"><i class="fas fa-fire"></i> Hot</span>
                    </div>
                    <div class="food-info">
                        <h3 class="food-name">${item.name}</h3>
                        <div class="food-price">${formatCurrency(item.price)}</div>
                        <p class="food-description">${item.description}</p>
                        <div class="food-footer">
                            <div class="food-meta">
                                <span class="food-rating"><i class="fas fa-star" style="color:#e8a020;font-size:0.72rem;"></i> ${item.rating}</span>
                                <span class="food-vendor">${item.vendor}</span>
                            </div>
                            <div class="food-actions">
                                <button class="preview-btn" data-item-id="${item.id}" aria-label="Preview ${item.name}" title="Quick preview">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="add-to-cart" data-item-id="${item.id}" aria-label="Add ${item.name} to cart">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </article>
            `;
        })
        .join("");

    /* --- Dot indicators --- */
    const dotsContainer = document.getElementById("carouselDots");
    const visibleCount = getVisibleCardCount();
    const totalDots = Math.ceil(bestSellerItems.length / visibleCount);

    if (dotsContainer) {
        dotsContainer.innerHTML = Array.from({ length: totalDots }, function (_, i) {
            return `<button class="carousel-dot${i === 0 ? " is-active" : ""}" aria-label="Go to slide ${i + 1}" data-dot="${i}"></button>`;
        }).join("");

        dotsContainer.querySelectorAll(".carousel-dot").forEach(function (dot) {
            dot.addEventListener("click", function () {
                const dotIndex = parseInt(dot.getAttribute("data-dot"), 10);
                const cardWidth = getCardWidth();
                trendingGrid.scrollTo({ left: dotIndex * cardWidth * visibleCount, behavior: "smooth" });
            });
        });
    }

    /* --- Scroll sync: dots + edge fades + btn states --- */
    function getCardWidth() {
        const firstCard = trendingGrid.querySelector(".food-card");
        if (!firstCard) return 320;
        const gap = parseFloat(getComputedStyle(trendingGrid).gap) || 20;
        return firstCard.offsetWidth + gap;
    }

    function getVisibleCardCount() {
        if (window.innerWidth <= 820) return 1;
        if (window.innerWidth <= 1080) return 2;
        return 3;
    }

    function syncCarouselState() {
        const scrollLeft = trendingGrid.scrollLeft;
        const maxScroll = trendingGrid.scrollWidth - trendingGrid.clientWidth;
        const atStart = scrollLeft <= 4;
        const atEnd = scrollLeft >= maxScroll - 4;

        if (carouselWrapper) {
            carouselWrapper.classList.toggle("at-start", atStart);
            carouselWrapper.classList.toggle("at-end", atEnd);
        }

        if (carouselLeft) carouselLeft.classList.toggle("is-disabled", atStart);
        if (carouselRight) carouselRight.classList.toggle("is-disabled", atEnd);

        /* update active dot */
        if (dotsContainer) {
            const activeIndex = Math.round(scrollLeft / (getCardWidth() * getVisibleCardCount()));
            dotsContainer.querySelectorAll(".carousel-dot").forEach(function (dot, i) {
                dot.classList.toggle("is-active", i === activeIndex);
            });
        }
    }

    trendingGrid.addEventListener("scroll", syncCarouselState, { passive: true });
    syncCarouselState();

    /* --- Arrow buttons --- */
    if (carouselLeft && carouselRight) {
        carouselLeft.addEventListener("click", function () {
            trendingGrid.scrollBy({ left: -getCardWidth() * getVisibleCardCount(), behavior: "smooth" });
        });

        carouselRight.addEventListener("click", function () {
            trendingGrid.scrollBy({ left: getCardWidth() * getVisibleCardCount(), behavior: "smooth" });
        });
    }

    /* --- Add to cart buttons --- */
    trendingGrid.querySelectorAll(".add-to-cart").forEach(function (button) {
        button.addEventListener("click", function (e) {
            e.stopPropagation();
            const itemId = button.getAttribute("data-item-id");
            const item = bestSellerItems.find(function (mi) { return String(mi.id) === String(itemId); });
            if (item) addToCart(item);
        });
    });

    /* --- Preview buttons --- */
    trendingGrid.querySelectorAll(".preview-btn").forEach(function (button) {
        button.addEventListener("click", function (e) {
            e.stopPropagation();
            const itemId = button.getAttribute("data-item-id");
            const item = bestSellerItems.find(function (mi) { return String(mi.id) === String(itemId); });
            if (item) openFoodPreview(item);
        });
    });

    /* --- Keyboard accessibility on cards --- */
    trendingGrid.querySelectorAll(".food-card").forEach(function (card) {
        card.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                const itemId = card.getAttribute("data-item-id");
                const item = bestSellerItems.find(function (mi) { return String(mi.id) === String(itemId); });
                if (item) openFoodPreview(item);
            }
        });
    });
}

/* ─── FOOD PREVIEW MODAL ─── */
function initializeFoodPreviewModal() {
    /* Build overlay + modal if not already in HTML */
    if (document.getElementById("foodPreviewOverlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "foodPreviewOverlay";
    overlay.className = "food-preview-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "modalFoodName");

    overlay.innerHTML = `
        <div class="food-preview-modal" id="foodPreviewModal">
            <div class="modal-handle"><span></span></div>
            <button class="modal-close" id="modalClose" aria-label="Close preview">
                <i class="fas fa-times"></i>
            </button>
            <div class="modal-image-wrap">
                <img src="" alt="" class="modal-image" id="modalImage">
                <div class="modal-badge" id="modalBadge">
                    <i class="fas fa-fire"></i> <span>Bestseller</span>
                </div>
            </div>
            <div class="modal-body">
                <div class="modal-header-row">
                    <h2 class="modal-name" id="modalFoodName">—</h2>
                    <div class="modal-price" id="modalPrice">—</div>
                </div>
                <div class="modal-vendor-chip" id="modalVendorChip">
                    <i class="fas fa-store"></i>
                    <span id="modalVendorName">—</span>
                </div>
                <div class="modal-meta-row" id="modalMetaRow">
                    <span class="modal-meta-pill" id="modalRating"><i class="fas fa-star"></i> 4.5</span>
                    <span class="modal-meta-pill" id="modalEta"><i class="fas fa-clock"></i> 15–20 min</span>
                    <span class="modal-meta-pill" id="modalCal"><i class="fas fa-fire-alt"></i> ~450 kcal</span>
                </div>
                <div class="modal-divider"></div>
                <p class="modal-section-label">About this dish</p>
                <p class="modal-description" id="modalDescription">—</p>
            </div>
            <div class="modal-footer">
                <div class="qty-stepper" aria-label="Quantity">
                    <button class="qty-btn" id="qtyMinus" aria-label="Decrease quantity">−</button>
                    <span class="qty-value" id="qtyValue">1</span>
                    <button class="qty-btn" id="qtyPlus" aria-label="Increase quantity">+</button>
                </div>
                <button class="modal-add-btn" id="modalAddBtn">
                    <i class="fas fa-shopping-bag"></i>
                    <span id="modalAddLabel">Add to cart</span>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    let currentItem = null;
    let qty = 1;

    const modal = overlay.querySelector("#foodPreviewModal");
    const closeBtn = overlay.querySelector("#modalClose");
    const qtyMinus = overlay.querySelector("#qtyMinus");
    const qtyPlus = overlay.querySelector("#qtyPlus");
    const qtyValueEl = overlay.querySelector("#qtyValue");
    const modalAddBtn = overlay.querySelector("#modalAddBtn");
    const modalAddLabel = overlay.querySelector("#modalAddLabel");

    function updateQty(newQty) {
        qty = Math.max(1, Math.min(20, newQty));
        qtyValueEl.textContent = qty;
        qtyMinus.disabled = qty <= 1;
        if (currentItem) {
            modalAddLabel.textContent = "Add " + qty + " — " + formatCurrency(currentItem.price * qty);
        }
    }

    qtyMinus.addEventListener("click", function () { updateQty(qty - 1); });
    qtyPlus.addEventListener("click", function () { updateQty(qty + 1); });

    modalAddBtn.addEventListener("click", function () {
        if (!currentItem) return;
        for (let i = 0; i < qty; i++) addToCart(currentItem);
        showNotification(qty + "× " + currentItem.name + " added to cart");
        closeFoodPreview();
    });

    closeBtn.addEventListener("click", closeFoodPreview);

    overlay.addEventListener("click", function (e) {
        if (!modal.contains(e.target)) closeFoodPreview();
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && overlay.classList.contains("is-open")) closeFoodPreview();
    });

    window._openFoodPreview = function (item) {
        currentItem = item;
        qty = 1;

        overlay.querySelector("#modalImage").src = item.image;
        overlay.querySelector("#modalImage").alt = item.name;
        overlay.querySelector("#modalFoodName").textContent = item.name;
        overlay.querySelector("#modalPrice").textContent = formatCurrency(item.price);
        overlay.querySelector("#modalVendorName").textContent = item.vendor;
        overlay.querySelector("#modalRating").innerHTML = '<i class="fas fa-star" style="color:#e8a020"></i> ' + (item.rating || "—");
        overlay.querySelector("#modalEta").innerHTML = '<i class="fas fa-clock"></i> ' + (item.eta || "15–20 min");
        overlay.querySelector("#modalDescription").textContent = item.description || "No description available.";
        updateQty(1);

        overlay.classList.add("is-open");
        document.body.style.overflow = "hidden";

        /* Focus trap: first focusable element */
        setTimeout(function () { closeBtn.focus(); }, 80);
    };

    window._closeFoodPreview = function () {
        overlay.classList.remove("is-open");
        document.body.style.overflow = "";
        currentItem = null;
    };
}

function openFoodPreview(item) {
    if (typeof window._openFoodPreview === "function") {
        window._openFoodPreview(item);
    }
}

function closeFoodPreview() {
    if (typeof window._closeFoodPreview === "function") {
        window._closeFoodPreview();
    }
}

/* ─── CART ─── */
function addToCart(item) {
    window.QuickBiteCart.add(item);
    updateCartCount();
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("quickbite-cart")) || [];
    const cartCount = cart.reduce(function (total, item) { return total + item.quantity; }, 0);

    document.querySelectorAll(".cart-icon").forEach(function (cartIcon) {
        cartIcon.setAttribute("data-count", cartCount);
    });
}

/* ─── NOTIFICATIONS ─── */
function showNotification(message) {
    if (typeof window.showToast === "function") {
        window.showToast(message, "info");
        return;
    }
    window.alert(message);
}

/* ─── ANIMATIONS ─── */
function initializeAnimations() {
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("animate-fade-in-up");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(
        ".experience-card, .step, .vendor-card, .food-card, .testimonial-card, .stat-item, .category-item"
    ).forEach(function (element) {
        observer.observe(element);
    });
}

/* ─── NAVBAR SHADOW ON SCROLL ─── */
window.addEventListener("scroll", function () {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;
    navbar.style.boxShadow = window.scrollY > 24 ? "0 14px 28px rgba(78, 44, 25, 0.08)" : "none";
});

/* ─── CATEGORY CLICK ─── */
document.addEventListener("click", function (e) {
    if (e.target.closest(".category-item")) {
        e.preventDefault();
        const categoryItem = e.target.closest(".category-item");
        const label = categoryItem.querySelector(".category-label");
        if (label) showNotification(label.textContent + " collection coming up");
    }
});

/* ─── FOOTER LINKS ─── */
document.addEventListener("click", function (e) {
    const anchor = e.target.closest(".footer-links a");
    if (anchor) {
        const href = String(anchor.getAttribute('href') || '').trim();

        // If the link points to a real page (contains .html or is an absolute/relative path), allow navigation
        if (href.includes('.html') || href.startsWith('/') || href.startsWith('./') || href.startsWith('http')) {
            return; // allow default navigation
        }

        e.preventDefault();
        const link = anchor.textContent.trim();
        //showNotification(link + " page is not connected yet");
    }
});

/* ─── CTA BUTTONS ─── */
document.addEventListener("click", function (e) {
    if (e.target.closest("#headerCartBtn")) return;

    if (e.target.closest(".cta .btn-primary") || e.target.closest(".nav-cta")) {
        e.preventDefault();
        showNotification("Student onboarding flow starts here");
    } else if (e.target.closest(".cta .btn-outline-light")) {
        e.preventDefault();
        showNotification("Vendor section opened");
        const vendorsSection = document.querySelector("#vendors");
        if (vendorsSection) vendorsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
});

/* ─── CURRENCY HELPER ─── */
function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "BDT"
    }).format(amount);
}
