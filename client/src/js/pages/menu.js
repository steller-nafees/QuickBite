let vendors = [];
let menuItems = [];

window.menuItems = menuItems;

document.addEventListener("DOMContentLoaded", function () {
    if (window.QuickBiteLayout && typeof window.QuickBiteLayout.updateCartCount === "function") {
        window.QuickBiteLayout.updateCartCount();
    }

    initializeMenuPage();
});

async function initializeMenuPage() {
    const state = {
        selectedVendor: "all",
        query: ""
    };

    const vendorFilterList = document.getElementById("vendorFilterList");
    const menuGrid = document.getElementById("menuGrid");
    const menuSearchInput = document.getElementById("menuSearchInput");
    const menuSearchForm = document.getElementById("menuSearchForm");
    const resultsSummary = document.getElementById("resultsSummary");

    try {
        const data = await window.QuickBiteApi.getCatalog();
        vendors = data.vendors || [];
        menuItems = (data.foods || []).filter(function (item) {
            return item.is_available;
        });
        window.menuItems = menuItems;
    } catch (error) {
        menuGrid.innerHTML = `
            <article class="menu-empty">
                <h3 class="menu-card-name">Unable to load menu</h3>
                <p class="menu-card-desc">${error.message}</p>
            </article>
        `;
        return;
    }

    renderVendorFilters();
    renderMenuItems();

    menuSearchInput.addEventListener("input", function () {
        state.query = menuSearchInput.value.trim().toLowerCase();
        renderMenuItems();
    });

    menuSearchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        renderMenuItems();
    });

    vendorFilterList.addEventListener("click", function (event) {
        const button = event.target.closest(".vendor-filter-btn");
        if (!button) {
            return;
        }

        state.selectedVendor = button.getAttribute("data-vendor") || "all";
        renderVendorFilters();
        renderMenuItems();
    });

    function renderVendorFilters() {
        const buttons = [
            {
                key: "all",
                name: "All Vendors",
                meta: menuItems.length + " dishes across campus"
            }
        ].concat(
            vendors.map(function (vendor) {
                const count = menuItems.filter(function (item) {
                    return String(item.vendor_id) === String(vendor.id);
                }).length;

                return {
                    key: String(vendor.id),
                    name: vendor.name,
                    meta: vendor.cuisine + " • " + count + " items"
                };
            })
        );

        vendorFilterList.innerHTML = buttons
            .map(function (button) {
                const isActive = state.selectedVendor === button.key ? " is-active" : "";
                return `
                    <button type="button" class="vendor-filter-btn${isActive}" data-vendor="${button.key}">
                        <span class="vendor-filter-name">${button.name}</span>
                        <span class="vendor-filter-meta">${button.meta}</span>
                    </button>
                `;
            })
            .join("");
    }

    function renderMenuItems() {
        const filteredItems = menuItems.filter(function (item) {
            const matchesVendor = state.selectedVendor === "all" || String(item.vendor_id) === state.selectedVendor;
            const matchesQuery = !state.query || matchesSearch(item, state.query);

            return matchesVendor && matchesQuery;
        }).sort(function (itemA, itemB) {
            return getSearchPriority(itemA, state.query) - getSearchPriority(itemB, state.query);
        });

        resultsSummary.textContent = getSummaryText(filteredItems.length);

        if (filteredItems.length === 0) {
            menuGrid.innerHTML = `
                <article class="menu-empty">
                    <h3 class="menu-card-name">No dishes found</h3>
                    <p class="menu-card-desc">Try another search term or switch to a different vendor.</p>
                </article>
            `;
            return;
        }

        menuGrid.innerHTML = filteredItems
            .map(function (item) {
                return `
                    <article class="menu-card">
                        <div class="menu-card-media">
                            <img src="${item.image}" alt="${item.name}" class="menu-card-image">
                            
                        </div>
                        <div class="menu-card-body">
                            <h3 class="menu-card-name">${item.name}</h3>
                            <div class="menu-card-price">${formatCurrency(item.price)}</div>
                            <p class="menu-card-desc">${item.description}</p>
                            <div class="menu-card-meta">
                                <span>★ ${item.rating}</span>
                                <span>${item.vendor}</span>
                            </div>
                            <div class="menu-card-actions">
                                <button class="add-to-cart" data-item-id="${item.id}">
                                    <i class="fas fa-plus"></i> Add
                                </button>
                                <a class="btn menu-link-btn" href="vendor.html?vendorId=${encodeURIComponent(item.vendor_id)}">
                                    View Vendor
                                </a>
                            </div>
                        </div>
                    </article>
                `;
            })
            .join("");

        menuGrid.querySelectorAll(".add-to-cart").forEach(function (button) {
            button.addEventListener("click", function () {
                const itemId = button.getAttribute("data-item-id");
                const item = menuItems.find(function (entry) {
                    return String(entry.id) === String(itemId);
                });

                if (item) {
                    window.QuickBiteCart.add(item);
                }
            });
        });
    }

    function getSummaryText(count) {
        const vendorName =
            state.selectedVendor === "all"
                ? "all vendors"
                : vendors.find(function (vendor) {
                    return String(vendor.id) === state.selectedVendor;
                })?.name || "selected vendor";

        return count + " item" + (count === 1 ? "" : "s") + " from " + vendorName;
    }
}

function matchesSearch(item, query) {
    const searchableGroups = [item.name, item.vendor, item.description];

    return searchableGroups.some(function (value) {
        return String(value)
            .toLowerCase()
            .split(/[\s,.-]+/)
            .some(function (part) {
                return part.startsWith(query);
            });
    });
}

function getSearchPriority(item, query) {
    if (!query) {
        return 0;
    }

    const namePriority = getFieldPriority(item.name, query);
    if (namePriority < Number.MAX_SAFE_INTEGER) {
        return namePriority;
    }

    const vendorPriority = getFieldPriority(item.vendor, query);
    if (vendorPriority < Number.MAX_SAFE_INTEGER) {
        return 100 + vendorPriority;
    }

    const descriptionPriority = getFieldPriority(item.description, query);
    if (descriptionPriority < Number.MAX_SAFE_INTEGER) {
        return 200 + descriptionPriority;
    }

    return 300;
}

function getFieldPriority(value, query) {
    const parts = String(value).toLowerCase().split(/[\s,.-]+/);
    const exactStartIndex = parts.findIndex(function (part) {
        return part.startsWith(query);
    });

    return exactStartIndex === -1 ? Number.MAX_SAFE_INTEGER : exactStartIndex;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "BDT"
    }).format(amount);
}
