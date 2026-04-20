let vendors = [];
let menuItems = [];

document.addEventListener("DOMContentLoaded", function () {
    if (window.QuickBiteLayout && typeof window.QuickBiteLayout.updateCartCount === "function") {
        window.QuickBiteLayout.updateCartCount();
    }

    initializeVendorsPage();
});

async function initializeVendorsPage() {
    const state = {
        query: "",
        cuisine: "all"
    };

    const vendorsGrid = document.getElementById("vendorsGrid");
    const resultsSummary = document.getElementById("vendorsResultsSummary");
    const cuisineFilters = document.getElementById("vendorsCuisineFilters");
    const searchForm = document.getElementById("vendorsSearchForm");
    const searchInput = document.getElementById("vendorsSearchInput");

    try {
        const data = await window.QuickBiteApi.getCatalog();
        vendors = data.vendors || [];
        menuItems = (data.foods || []).filter(function (item) {
            return item.is_available;
        });
    } catch (error) {
        vendorsGrid.innerHTML = `
            <article class="vendors-empty">
                <h3>Vendor directory unavailable</h3>
                <p>We could not load campus vendors right now. Please try again in a moment.</p>
            </article>
        `;
        resultsSummary.textContent = "We could not load the vendor directory right now.";
        return;
    }

    renderCuisineFilters();
    renderVendorCards();
    updateHeroStats();

    // Ensure the global order pill exists without overwriting layout-rendered markup.
    const globalPill = document.getElementById("globalOrderPill");
    if (globalPill && typeof getGlobalOrderPillMarkup === "function") {
        if (!globalPill.innerHTML || !globalPill.innerHTML.trim()) {
            globalPill.innerHTML = getGlobalOrderPillMarkup();
            if (typeof initializeSharedOrderPill === "function") {
                try {
                    initializeSharedOrderPill();
                } catch (e) {
                    console.warn('initializeSharedOrderPill failed', e);
                }
            }
        }
    }

    searchInput.addEventListener("input", function () {
        state.query = searchInput.value.trim().toLowerCase();
        renderVendorCards();
    });

    searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        renderVendorCards();
    });

    cuisineFilters.addEventListener("click", function (event) {
        const button = event.target.closest(".vendors-filter-chip");
        if (!button) {
            return;
        }

        state.cuisine = button.getAttribute("data-cuisine") || "all";
        renderCuisineFilters();
        renderVendorCards();
    });

    window.addEventListener("quickbite:location-changed", function () {
        updateHeroStats();
        renderVendorCards();
    });

    function renderCuisineFilters() {
        const cuisineCounts = vendors.reduce(function (counts, vendor) {
            const cuisine = vendor.cuisine || "Campus favorites";
            counts[cuisine] = (counts[cuisine] || 0) + 1;
            return counts;
        }, {});

        const chips = [{ key: "all", label: "All vendors", count: vendors.length }]
            .concat(
                Object.keys(cuisineCounts)
                    .sort()
                    .map(function (cuisine) {
                        return {
                            key: cuisine,
                            label: cuisine,
                            count: cuisineCounts[cuisine]
                        };
                    })
            );

        cuisineFilters.innerHTML = chips.map(function (chip) {
            const activeClass = state.cuisine === chip.key ? " is-active" : "";
            return `
                <button type="button" class="vendors-filter-chip${activeClass}" data-cuisine="${chip.key}">
                    <span>${chip.label}</span>
                    <small>${chip.count}</small>
                </button>
            `;
        }).join("");
    }

    function renderVendorCards() {
        const selectedLocation = getSelectedLocationLabel();
        const filteredVendors = vendors
            .filter(function (vendor) {
                const matchesCuisine = state.cuisine === "all" || (vendor.cuisine || "") === state.cuisine;
                const matchesQuery = !state.query || matchesSearch(vendor, state.query);
                return matchesCuisine && matchesQuery;
            })
            .sort(function (vendorA, vendorB) {
                return Number(vendorB.totalOrders || 0) - Number(vendorA.totalOrders || 0);
            });

        resultsSummary.textContent = getSummaryText(filteredVendors.length, selectedLocation);

        if (filteredVendors.length === 0) {
            vendorsGrid.innerHTML = `
                <article class="vendors-empty">
                    <h3>No vendors matched</h3>
                    <p>Try another vendor name, cuisine, or clear the current filter to see more kitchens.</p>
                </article>
            `;
            return;
        }

        vendorsGrid.innerHTML = filteredVendors.map(function (vendor) {
            const vendorItems = menuItems.filter(function (item) {
                return String(item.vendor_id) === String(vendor.id);
            });
            const featuredItem = vendorItems[0];
            const locationLabel = vendor.location || selectedLocation;
            const description = buildVendorDescription(vendor, vendorItems.length);

            return `
                <article class="vendors-card">
                    <div class="vendors-card-media">
                        <img src="${vendor.image}" alt="${vendor.name}">
                        <span class="vendors-card-badge"><i class="fas fa-bolt"></i> ${vendor.badge || "Open now"}</span>
                        <span class="vendors-card-tag">${vendorItems.length} dishes live</span>
                    </div>
                    <div class="vendors-card-body">
                        <div class="vendors-card-topline">
                            <h3 class="vendors-card-name">${vendor.name}</h3>
                            <span class="vendors-card-rating">★ ${formatRating(vendor.rating)}</span>
                        </div>

                        <p class="vendors-card-desc">${description}</p>

                        <div class="vendors-card-meta">
                            <span><i class="fas fa-store"></i> ${vendor.cuisine || "Campus favorites"}</span>
                            <span><i class="fas fa-clock"></i> ${vendor.eta || "15-20 min"}</span>
                            <span><i class="fas fa-bag-shopping"></i> ${Number(vendor.totalOrders || 0)}+ orders</span>
                        </div>

                        <div class="vendors-card-footer">
                            <span><i class="fas fa-location-dot"></i> ${locationLabel}</span>
                            <span><i class="fas fa-utensils"></i> ${featuredItem ? featuredItem.name : "Menu updating"}</span>
                        </div>

                        <div class="vendors-card-actions">
                            <a class="vendors-link-btn" href="vendor.html?vendorId=${encodeURIComponent(vendor.id)}">View vendor</a>
                            <a class="btn btn-primary" href="menu.html">Browse menu</a>
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }

    function updateHeroStats() {
        const selectedLocation = getSelectedLocationLabel();
        document.getElementById("vendorsCount").textContent = String(vendors.length);
        document.getElementById("vendorsFoodCount").textContent = String(menuItems.length);
        document.getElementById("vendorsLocationLabel").textContent = selectedLocation;
    }
}

function matchesSearch(vendor, query) {
    const haystacks = [
        vendor.name,
        vendor.cuisine,
        vendor.badge,
        vendor.location
    ];

    return haystacks.some(function (value) {
        return String(value || "").toLowerCase().includes(query);
    });
}

function getSummaryText(count, locationLabel) {
    const vendorLabel = count === 1 ? "vendor" : "vendors";
    return count + " " + vendorLabel + " ready for pickup around " + locationLabel + ".";
}

function buildVendorDescription(vendor, itemCount) {
    const cuisine = vendor.cuisine || "Campus meals";
    const orders = Number(vendor.totalOrders || 0);

    if (orders > 150) {
        return cuisine + " with strong repeat orders, reliable prep, and enough variety to keep short breaks interesting.";
    }

    if (itemCount >= 6) {
        return cuisine + " with a wider menu spread, easy comparison, and solid choices for quick campus pickups.";
    }

    return cuisine + " built for fast ordering, familiar favorites, and no unnecessary friction before pickup.";
}

function formatRating(value) {
    const rating = Number(value || 0);
    return rating ? rating.toFixed(1) : "4.7";
}

function getSelectedLocationLabel() {
    try {
        return localStorage.getItem("quickbite-selected-location") || "NSU Main Canteen";
    } catch (error) {
        return "NSU Main Canteen";
    }
}
