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

    try {
        const data = await window.QuickBiteApi.getVendor(vendorId);
        const vendor = data.vendor;

        vendors = [vendor];
        currentVendor = vendor;
        menuItems = (data.foods || []).filter(function (item) {
            return item.is_available !== false;
        });
        window.menuItems = menuItems;

        renderVendorInfo(vendor);
        renderVendorMenu(vendor.name);
        renderFeaturedDish();
        renderReviews(vendor);
        bindHeroActions();

        const pill = document.getElementById("globalOrderPill");
        if (pill && typeof getGlobalOrderPillMarkup === "function") {
            pill.innerHTML = getGlobalOrderPillMarkup();
        }
    } catch (error) {
        showError(error.message);
    }
});

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
        grid.innerHTML = '<div class="empty-menu">No items available right now. Check back soon for the next fresh batch.</div>';
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

function showError(message) {
    document.body.innerHTML = "<h2 style='text-align:center;margin-top:2rem;'>" + (message || "Vendor not found") + "</h2>";
}
