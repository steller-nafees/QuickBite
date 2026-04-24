let vendors = [];
let menuItems = [];
let currentVendor = null;
let featuredItemId = null;

window.menuItems = menuItems;

document.addEventListener("DOMContentLoaded", async function () {
    if (window.QuickBiteLayout && typeof window.QuickBiteLayout.updateCartCount === "function") {
        window.QuickBiteLayout.updateCartCount();
    }

    const vendorId = getVendorId();
    if (!vendorId) {
        showError();
        return;
    }

    showLoadingSkeleton();

    try {
        const data = await window.QuickBiteApi.getVendor(vendorId);
        const vendor = data.vendor;

        vendors = [vendor];
        currentVendor = vendor;
        menuItems = (data.foods || []).filter(function (item) {
            return item.is_available !== false;
        });
        window.menuItems = menuItems;

        hideLoadingSkeleton();

        renderVendorInfo(vendor);
        renderVendorMenu(vendor.name);
        renderFeaturedDish();
        renderReviews(vendor);
        bindHeroActions();

        const pill = document.getElementById("globalOrderPill");
        if (pill && typeof getGlobalOrderPillMarkup === "function") {
            if (!pill.innerHTML || !pill.innerHTML.trim()) {
                pill.innerHTML = getGlobalOrderPillMarkup();
                if (typeof initializeSharedOrderPill === "function") {
                    try {
                        initializeSharedOrderPill();
                    } catch (e) {
                        console.warn('initializeSharedOrderPill failed to run', e);
                    }
                }
            }
        }
    } catch (error) {
        hideLoadingSkeleton();
        showError(error.message);
    }
});

/* ─── Loading Skeleton ──────────────────────────────────────────────────── */

function showLoadingSkeleton() {
    const vendorPage = document.querySelector(".vendor-page");
    if (!vendorPage) return;

    vendorPage.innerHTML = `
        <section class="vendor-hero vendor-hero--skeleton">
            <div class="container">
                <div class="vendor-back-link">
                    <span class="sk-pill sk-back"></span>
                </div>
                <div class="vendor-hero-grid">
                    <div class="vendor-hero-copy">
                        <span class="sk-block sk-kicker"></span>
                        <span class="sk-block sk-title"></span>
                        <span class="sk-block sk-line sk-line--80"></span>
                        <span class="sk-block sk-line sk-line--60"></span>
                        <div class="sk-tags">
                            <span class="sk-block sk-tag"></span>
                            <span class="sk-block sk-tag sk-tag--lg"></span>
                            <span class="sk-block sk-tag sk-tag--sm"></span>
                        </div>
                        <div class="sk-stats">
                            <span class="sk-block sk-stat"></span>
                            <span class="sk-block sk-stat"></span>
                            <span class="sk-block sk-stat"></span>
                        </div>
                        <div class="sk-actions">
                            <span class="sk-block sk-btn"></span>
                            <span class="sk-block sk-btn sk-btn--sm"></span>
                        </div>
                    </div>
                    <div class="vendor-showcase-card">
                        <div class="vendor-showcase-media sk-block"></div>
                        <div class="vendor-showcase-content">
                            <div>
                                <span class="sk-block sk-line sk-line--55"></span>
                                <span class="sk-block sk-showcase-title"></span>
                            </div>
                            <div class="sk-meta-pills">
                                <span class="sk-block sk-meta-pill"></span>
                                <span class="sk-block sk-meta-pill"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="vendor-feature-strip">
            <div class="container vendor-feature-layout">
                <div class="vendor-feature-card vendor-feature-card--skeleton">
                    <span class="sk-block sk-line sk-line--40"></span>
                    <span class="sk-block sk-feature-title"></span>
                    <span class="sk-block sk-line sk-line--90"></span>
                    <span class="sk-block sk-line sk-line--70"></span>
                    <div class="sk-actions">
                        <span class="sk-block sk-price"></span>
                        <span class="sk-block sk-btn"></span>
                    </div>
                </div>
                <div class="vendor-insight-panel">
                    <span class="sk-block sk-line sk-line--50"></span>
                    <div class="sk-insight-list">
                        <span class="sk-block sk-insight-item"></span>
                        <span class="sk-block sk-insight-item"></span>
                        <span class="sk-block sk-insight-item"></span>
                    </div>
                </div>
            </div>
        </section>

        <section class="vendor-menu-section">
            <div class="container">
                <div class="vendor-section-heading">
                    <div>
                        <span class="sk-block sk-line sk-line--30"></span>
                        <span class="sk-block sk-section-title"></span>
                        <span class="sk-block sk-line sk-line--45"></span>
                    </div>
                </div>
                <div class="vendor-menu-grid">
                    ${[0, 1, 2].map(function () {
                        return `
                        <div class="vendor-menu-card">
                            <div class="vendor-menu-media sk-block"></div>
                            <div class="vendor-menu-body">
                                <div class="sk-card-topline">
                                    <span class="sk-block sk-card-name"></span>
                                    <span class="sk-block sk-card-price"></span>
                                </div>
                                <span class="sk-block sk-line sk-line--100"></span>
                                <span class="sk-block sk-line sk-line--80"></span>
                                <div class="sk-actions sk-card-actions">
                                    <span class="sk-block sk-btn"></span>
                                    <span class="sk-block sk-btn"></span>
                                </div>
                            </div>
                        </div>`;
                    }).join("")}
                </div>
            </div>
        </section>
    `;
}

function hideLoadingSkeleton() {
    const vendorPage = document.querySelector(".vendor-page");
    if (!vendorPage) return;

    vendorPage.innerHTML = `
        <section class="vendor-hero">
            <div class="container">
                <a href="index.html" class="vendor-back-link">
                    <i class="fas fa-arrow-left"></i>
                    Back to Home
                </a>
                <div class="vendor-hero-grid">
                    <div class="vendor-hero-copy">
                        <span class="vendor-kicker">
                            <i class="fas fa-store"></i>
                            Campus Vendor
                        </span>
                        <h1 class="vendor-hero-title" id="vendorName"></h1>
                        <p class="vendor-hero-description" id="vendorCuisine"></p>
                        <div class="vendor-tags" id="vendorTags"></div>
                        <div class="vendor-stats-grid">
                            <article class="vendor-stat-card">
                                <span class="vendor-stat-label">Rating</span>
                                <strong id="vendorRating">--</strong>
                            </article>
                            <article class="vendor-stat-card">
                                <span class="vendor-stat-label">Orders served</span>
                                <strong id="vendorOrders">--</strong>
                            </article>
                            <article class="vendor-stat-card">
                                <span class="vendor-stat-label">Pickup time</span>
                                <strong id="vendorETA">--</strong>
                            </article>
                        </div>
                        <div class="vendor-hero-actions">
                            <button class="order-best" id="orderNow">
                                <i class="fas fa-bowl-food"></i>
                                Order Best Seller
                            </button>
                            <button class="view-stall" id="visitStall">
                                <i class="fas fa-location-dot"></i>
                                View Stall Info
                            </button>
                        </div>
                    </div>
                    <div class="vendor-hero-visual">
                        <article class="vendor-showcase-card">
                            <div class="vendor-showcase-media">
                                <img id="vendorImage" src="" alt="Vendor Image">
                                <span class="vendor-photo-badge" id="vendorBadgeText">Open now</span>
                            </div>
                            <div class="vendor-showcase-content">
                                <div>
                                    <p class="vendor-showcase-label">QuickBite Spotlight</p>
                                    <h2 class="vendor-showcase-title">Fresh dishes, fast pickup, zero guesswork.</h2>
                                </div>
                                <div class="vendor-quick-meta">
                                    <span id="vendorLocationText">
                                        <i class="fas fa-location-dot"></i>
                                        Campus pickup
                                    </span>
                                    <span id="vendorStatusText">
                                        <i class="fas fa-bolt"></i>
                                        Ready for your next order
                                    </span>
                                </div>
                            </div>
                        </article>
                    </div>
                </div>
            </div>
        </section>

        <section class="vendor-feature-strip">
            <div class="container vendor-feature-layout">
                <article class="vendor-feature-card" id="newDishCard">
                    <div class="vendor-feature-copy">
                        <span class="vendor-section-kicker-f">Featured dish</span>
                        <h2 class="vendor-feature-title" id="newDishName">Loading...</h2>
                        <p class="vendor-feature-description" id="newDishDesc">Delicious new item from this vendor.</p>
                        <div class="vendor-feature-meta">
                            <span class="vendor-feature-price" id="newDishPrice">--</span>
                            <button class="btn btn-primary" id="featuredDishAction">Add to cart</button>
                        </div>
                    </div>
                    <div class="vendor-feature-media">
                        <img alt="Featured dish" id="newDishImage">
                    </div>
                </article>
                <aside class="vendor-insight-panel">
                    <span class="vendor-section-kicker-f">Why students return</span>
                    <div class="vendor-insight-list">
                        <article class="vendor-insight-item">
                            <strong>Fast pickup flow</strong>
                            <p>Designed for short campus breaks and easy pre-orders.</p>
                        </article>
                        <article class="vendor-insight-item">
                            <strong>Reliable favorites</strong>
                            <p>Top dishes stay easy to spot and reorder from one clean page.</p>
                        </article>
                        <article class="vendor-insight-item">
                            <strong>Clear menu choices</strong>
                            <p>Ratings, pricing, and descriptions are visible before you commit.</p>
                        </article>
                    </div>
                </aside>
            </div>
        </section>

        <section class="vendor-menu-section">
            <div class="container">
                <div class="vendor-section-heading">
                    <div>
                        <span class="vendor-section-kicker" id="menu">Menu</span>
                        <h2 class="vendor-section-title">Popular picks from this kitchen</h2>
                        <p class="vendor-section-subtitle" id="vendorMenuSummary">Fresh meals prepared by this vendor.</p>
                    </div>
                </div>
                <div class="vendor-menu-grid" id="vendorMenuGrid"></div>
            </div>
        </section>

        <section class="vendor-reviews">
            <div class="container">
                <div class="vendor-section-heading vendor-section-heading-center">
                    <div>
                        <span class="vendor-section-kicker">Reviews</span>
                        <h2 class="vendor-section-title">What students are saying</h2>
                        <p class="vendor-section-subtitle">A quick snapshot of how this vendor is performing right now.</p>
                    </div>
                </div>
                <div class="reviews-grid">
                    <aside class="reviews-summary">
                        <div class="rating-big">
                            <div class="avg" id="avgRating">--</div>
                            <div class="stars" id="avgStars">★★★★★</div>
                            <div class="count" id="reviewsCount">-- reviews</div>
                        </div>
                        <div class="rating-breakdown" id="ratingBreakdown"></div>
                    </aside>
                    <div class="reviews-list" id="reviewsList"></div>
                </div>
            </div>
        </section>
    `;
}

/* ─── Error / Not-found state ───────────────────────────────────────────── */

function showError(message) {
    const vendorPage = document.querySelector(".vendor-page");
    const target = vendorPage || document.body;

    const isNoId = !message;
    const heading = isNoId ? "No vendor selected" : "This stall seems to have packed up";
    const description = isNoId
        ? "Please select a vendor. Head back to the home page and tap a vendor to view their menu."
        : "The vendor you're looking for may have moved, closed, or the link might be incorrect. Try browsing our active vendors instead.";

    target.innerHTML = `
        <div class="vendor-error-shell">
            <div class="vendor-error-card">
                <div class="vendor-error-icon">
                    <i class="fas fa-store-slash"></i>
                </div>
                <span class="vendor-error-kicker">Vendor not found</span>
                <h2 class="vendor-error-title">${heading}</h2>
                <p class="vendor-error-desc">${description}</p>
                <div class="vendor-error-actions">
                    <a href="vendors.html" class="vendor-error-btn-primary">
                        <i class="fas fa-house"></i>
                        Browse all vendors
                    </a>
                    <button class="vendor-error-btn-secondary" onclick="history.back()">
                        <i class="fas fa-arrow-left"></i>
                        Go back
                    </button>
                </div>
            </div>
        </div>
    `;
}

/* ─── Vendor info ───────────────────────────────────────────────────────── */

function getVendorId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("vendorId");
}

function renderVendorInfo(vendor) {
    const cuisineLabel = vendor.cuisine || "Fresh campus meals";

    document.getElementById("vendorName").textContent = vendor.name;
    document.getElementById("vendorCuisine").textContent = cuisineLabel + " made for fast campus pickup.";
    document.getElementById("vendorRating").textContent = "★ " + formatRating(vendor.rating);
    document.getElementById("vendorOrders").textContent = (vendor.totalOrders || 0) + "+";
    document.getElementById("vendorETA").textContent = vendor.eta || "15-20 min";

    const vendorImage = document.getElementById("vendorImage");
    vendorImage.src = vendor.image;
    vendorImage.alt = vendor.name + " showcase";

    document.getElementById("vendorBadgeText").textContent = vendor.badge || "Open now";
    document.getElementById("vendorLocationText").innerHTML =
        '<i class="fas fa-location-dot"></i> ' + (vendor.location || "Campus pickup");
    document.getElementById("vendorStatusText").innerHTML =
        '<i class="fas fa-bolt"></i> ' + (vendor.badge || "Ready for your next order");

    const vendorTags = document.getElementById("vendorTags");
    if (vendorTags) {
        const tags = [
            vendor.location || "Campus pickup",
            vendor.badge || "Open now",
            (vendor.totalOrders || 0) + "+ orders fulfilled"
        ];

        vendorTags.innerHTML = tags.map(function (tag) {
            return '<span class="vendor-tag"><i class="fas fa-check-circle"></i>' + tag + "</span>";
        }).join("");
    }
}

/* ─── Menu ──────────────────────────────────────────────────────────────── */

function renderVendorMenu(vendorName) {
    const grid = document.getElementById("vendorMenuGrid");
    const summary = document.getElementById("vendorMenuSummary");
    const items = menuItems
        .filter(function (item) {
            return item.vendor === vendorName;
        })
        .sort(function (itemA, itemB) {
            return Number(itemB.rating || 0) - Number(itemA.rating || 0);
        });

    if (summary) {
        summary.textContent = items.length + " dish" + (items.length === 1 ? "" : "es") + " available today from " + vendorName + ".";
    }

    if (items.length === 0) {
        grid.innerHTML = `
            <div class="empty-menu">
                <div class="empty-menu-icon">
                    <i class="fas fa-bowl-food"></i>
                </div>
                <strong class="empty-menu-title">No menu items yet</strong>
                <p>This vendor hasn't published any dishes today. Check back soon — good things are coming.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = items.map(function (item, index) {
        const chip = index === 0 ? "Best seller" : index === 1 ? "Top rated" : "Fresh pick";

        return `
            <article class="vendor-menu-card">
                <div class="vendor-menu-media">
                    <img src="${item.image}" alt="${item.name}">
                    <span class="vendor-card-chip">${chip}</span>
                </div>
                <div class="vendor-menu-body">
                    <div class="vendor-menu-topline">
                        <h3 class="vendor-menu-name">${item.name}</h3>
                        <span class="vendor-menu-price">${formatCurrency(item.price)}</span>
                    </div>
                    <p class="vendor-menu-description">${item.description}</p>
                    <div class="vendor-menu-meta">
                        <span><i class="fas fa-star"></i> ${formatRating(item.rating)}</span>
                        <span><i class="fas fa-bowl-food"></i> Ready for pickup</span>
                    </div>
                    <div class="vendor-card-actions">
                        <button class="add-to-cart" data-item-id="${item.id}">
                            <i class="fas fa-plus"></i>
                            Add to cart
                        </button>
                        <button class="btn vendor-link-btn eat-now" data-item-id="${item.id}">
                            <i class="fas fa-utensils"></i>
                            Eat now
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");

    grid.querySelectorAll(".add-to-cart").forEach(function (button) {
        button.addEventListener("click", function () {
            addToCart(button.getAttribute("data-item-id"));
        });
    });

    grid.querySelectorAll(".eat-now").forEach(function (button) {
        button.addEventListener("click", function () {
            eatNow(button.getAttribute("data-item-id"));
        });
    });
}

/* ─── Featured dish ─────────────────────────────────────────────────────── */

function renderFeaturedDish() {
    const featuredItem = menuItems
        .slice()
        .sort(function (itemA, itemB) {
            return Number(itemB.rating || 0) - Number(itemA.rating || 0);
        })[0];

    if (!featuredItem) {
        featuredItemId = null;
        document.getElementById("newDishName").textContent = "No featured dish yet";
        document.getElementById("newDishDesc").textContent = "This vendor has not published any available items yet.";
        document.getElementById("newDishPrice").textContent = "--";
        return;
    }

    featuredItemId = featuredItem.id;
    document.getElementById("newDishName").textContent = featuredItem.name;
    document.getElementById("newDishDesc").textContent = featuredItem.description;
    document.getElementById("newDishPrice").textContent = formatCurrency(featuredItem.price);

    const image = document.getElementById("newDishImage");
    image.src = featuredItem.image;
    image.alt = featuredItem.name;

    const action = document.getElementById("featuredDishAction");
    action.onclick = function () {
        addToCart(featuredItem.id);
    };
}

/* ─── Reviews ───────────────────────────────────────────────────────────── */

function renderReviews(vendor) {
    const avgRating = Number(vendor.rating || 4.6);
    const reviewCountValue = Math.max(12, Math.round(Number(vendor.totalOrders || 24) * 0.18));
    const reviews = buildReviews(vendor, avgRating);
    const breakdown = buildRatingBreakdown(avgRating);

    document.getElementById("avgRating").textContent = avgRating.toFixed(1);
    document.getElementById("avgStars").textContent = getStarString(avgRating);
    document.getElementById("reviewsCount").textContent = reviewCountValue + " reviews";

    document.getElementById("ratingBreakdown").innerHTML = breakdown.map(function (row) {
        return `
            <div class="rating-breakdown-row">
                <span class="rating-breakdown-label">${row.label}</span>
                <div class="rating-breakdown-bar"><span style="width:${row.width}%;"></span></div>
                <span>${row.share}%</span>
            </div>
        `;
    }).join("");

    document.getElementById("reviewsList").innerHTML = reviews.map(function (review) {
        return `
            <article class="review-card">
                <div class="review-head">
                    <strong class="review-author">${review.author}</strong>
                    <span class="review-date">${review.date}</span>
                </div>
                <div class="review-body">${review.body}</div>
            </article>
        `;
    }).join("");
}

function buildReviews(vendor, rating) {
    const vendorName = vendor.name || "This vendor";
    const cuisine = vendor.cuisine || "Campus meals";

    return [
        {
            author: "Nafisa Rahman",
            date: "2 hours ago",
            body: vendorName + " keeps the pickup line moving, and the " + cuisine.toLowerCase() + " always tastes freshly made."
        },
        {
            author: "Arif Hasan",
            date: "Today",
            body: "The menu is easy to scan, portions feel worth the price, and my order was ready right inside the promised time."
        },
        {
            author: "Maliha Sultana",
            date: rating >= 4.5 ? "Yesterday" : "This week",
            body: "Best part is the consistency. Even during a rush, the food quality and quick service still hold up."
        }
    ];
}

function buildRatingBreakdown(rating) {
    const five = clamp(Math.round(rating * 18), 55, 86);
    const four = clamp(100 - five - 12, 10, 28);
    const three = clamp(10 - Math.round((rating - 4) * 6), 3, 10);
    const two = clamp(4 - Math.round((rating - 4) * 2), 1, 4);
    const one = Math.max(1, 100 - five - four - three - two);

    return [
        { label: "5 star", share: five, width: five },
        { label: "4 star", share: four, width: four },
        { label: "3 star", share: three, width: three },
        { label: "2 star", share: two, width: two },
        { label: "1 star", share: one, width: one }
    ];
}

/* ─── Hero actions ──────────────────────────────────────────────────────── */

function bindHeroActions() {
    const orderNowButton = document.getElementById("orderNow");
    const visitStallButton = document.getElementById("visitStall");

    if (orderNowButton) {
        orderNowButton.addEventListener("click", function () {
            const itemToOrder = featuredItemId ? menuItems.find(function (entry) {
                return String(entry.id) === String(featuredItemId);
            }) : null;

            if (!itemToOrder) {
                showNotification("No dishes are available to order right now.");
                return;
            }

            addToCart(itemToOrder.id);
        });
    }

    if (visitStallButton) {
        visitStallButton.addEventListener("click", function () {
            const location = currentVendor && currentVendor.location ? currentVendor.location : "Campus pickup point";
            showNotification("Pickup spot: " + location);
        });
    }
}

/* ─── Cart helpers ──────────────────────────────────────────────────────── */

function addToCart(itemId) {
    const item = menuItems.find(function (entry) {
        return String(entry.id) === String(itemId);
    });

    if (item) {
        window.QuickBiteCart.add(item);
    }
}

function eatNow(itemId) {
    const item = menuItems.find(function (entry) {
        return String(entry.id) === String(itemId);
    });

    if (item) {
        addToCart(itemId);
        showNotification(item.name + " is in your platter. Eat Now selected.");
    }
}

/* ─── Utilities ─────────────────────────────────────────────────────────── */

function showNotification(message) {
    if (typeof window.showToast === "function") {
        window.showToast(message, "info");
        return;
    }
    window.alert(message);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "BDT"
    }).format(amount);
}

function formatRating(value) {
    const numericValue = Number(value || 0);
    return numericValue ? numericValue.toFixed(1) : "4.5";
}

function getStarString(rating) {
    const filledStars = Math.round(Number(rating || 0));
    return "★★★★★".slice(0, filledStars).padEnd(5, "☆");
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}