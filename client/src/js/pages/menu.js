let vendors = [];
let menuItems = [];

window.menuItems = menuItems;

document.addEventListener("DOMContentLoaded", function () {
    if (window.QuickBiteLayout && typeof window.QuickBiteLayout.updateCartCount === "function") {
        window.QuickBiteLayout.updateCartCount();
    }

    initializeFoodPreviewModal();
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
                <h3 class="menu-card-name">No Vendors Found.</h3>
            </article>
        `;
        return;
    }

    if (vendors.length === 0) {
        menuGrid.innerHTML = `
            <article class="menu-empty">
                <h3 class="menu-card-name">No Vendors Found.</h3>
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
            .map(function (item, index) {
                const chip = index === 0 ? "Popular" : index === 1 ? "Top rated" : "Fresh";

                return `
                    <article class="menu-card" data-item-id="${item.id}" role="button" tabindex="0" aria-label="View details for ${item.name}">
                        <div class="menu-card-media">
                            <img src="${item.image}" alt="${item.name}" class="menu-card-image">
                            <span class="menu-card-badge">${chip}</span>
                        </div>
                        <div class="menu-card-body">
                            <h3 class="menu-card-name">${item.name}</h3>
                            <div class="menu-card-price">${formatCurrency(item.price)}</div>
                            <div class="menu-card-meta">
                                <span><i class="fas fa-star"></i> ${formatRating(item.rating)}</span>
                                <span><i class="fas fa-store"></i> ${item.vendor}</span>
                            </div>
                            <div class="menu-card-actions">
                                <button class="add-to-cart" data-item-id="${item.id}">
                                    <i class="fas fa-plus"></i> Add
                                </button>
                            </div>
                        </div>
                    </article>
                `;
            })
            .join("");

        menuGrid.querySelectorAll(".menu-card").forEach(function (card) {
            const itemId = card.getAttribute("data-item-id");
            const item = menuItems.find(function (entry) {
                return String(entry.id) === String(itemId);
            });

            if (!item) {
                return;
            }

            card.addEventListener("click", function (event) {
                if (event.target.closest(".add-to-cart")) {
                    return;
                }

                openFoodPreview(item);
            });

            card.addEventListener("keydown", function (event) {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openFoodPreview(item);
                }
            });
        });

        menuGrid.querySelectorAll(".add-to-cart").forEach(function (button) {
            button.addEventListener("click", function () {
                button.closest(".menu-card")?.focus();
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

function formatRating(value) {
    const numericValue = Number(value || 0);
    return numericValue ? numericValue.toFixed(1) : "4.5";
}

function initializeFoodPreviewModal() {
    if (document.getElementById("foodPreviewOverlay")) {
        return;
    }

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
            <div class="menu-modal-layout">
                <div class="modal-image-wrap">
                    <img src="" alt="" class="modal-image" id="modalImage">
                    <div class="modal-badge" id="modalBadge">
                        <i class="fas fa-fire"></i> <span>Popular pick</span>
                    </div>
                </div>
                <div class="menu-modal-content">
                    <div class="modal-body">
                        <div class="modal-header-row">
                            <h2 class="modal-name" id="modalFoodName">-</h2>
                            <div class="modal-price" id="modalPrice">-</div>
                        </div>
                        <a class="modal-vendor-chip modal-vendor-link" id="modalVendorLink" href="#">
                            <i class="fas fa-store"></i>
                            <span id="modalVendorName">-</span>
                        </a>
                        <div class="modal-meta-row">
                            <span class="modal-meta-pill" id="modalRating"><i class="fas fa-star"></i> 4.5</span>
                            <span class="modal-meta-pill" id="modalEta"><i class="fas fa-clock"></i> 15-20 min</span>
                        </div>
                        <div class="modal-divider"></div>
                        <p class="modal-section-label">About this dish</p>
                        <p class="modal-description" id="modalDescription">-</p>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-add-btn" id="modalAddBtn">
                            <i class="fas fa-shopping-bag"></i>
                            <span>Add to cart</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    let currentItem = null;
    const modal = document.getElementById("foodPreviewModal");
    const closeBtn = document.getElementById("modalClose");
    const addBtn = document.getElementById("modalAddBtn");

    closeBtn.addEventListener("click", closeFoodPreview);
    addBtn.addEventListener("click", function () {
        if (!currentItem) {
            return;
        }

        window.QuickBiteCart.add(currentItem);
        closeFoodPreview();
    });

    overlay.addEventListener("click", function (event) {
        if (!modal.contains(event.target)) {
            closeFoodPreview();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && overlay.classList.contains("is-open")) {
            closeFoodPreview();
        }
    });

    window._openMenuFoodPreview = function (item) {
        currentItem = item;
        document.getElementById("modalImage").src = item.image;
        document.getElementById("modalImage").alt = item.name;
        document.getElementById("modalFoodName").textContent = item.name;
        document.getElementById("modalPrice").textContent = formatCurrency(item.price);
        document.getElementById("modalVendorName").textContent = item.vendor || "Campus vendor";
        document.getElementById("modalVendorLink").href = "vendor.html?vendorId=" + encodeURIComponent(item.vendor_id);
        document.getElementById("modalRating").innerHTML = '<i class="fas fa-star" style="color:#e8a020"></i> ' + formatRating(item.rating);
        document.getElementById("modalEta").innerHTML = '<i class="fas fa-clock"></i> ' + (item.eta || "15-20 min");
        document.getElementById("modalDescription").textContent = item.description || "No description available.";
        overlay.classList.add("is-open");
        document.body.style.overflow = "hidden";
    };

    window._closeMenuFoodPreview = function () {
        overlay.classList.remove("is-open");
        document.body.style.overflow = "";
        currentItem = null;
    };
}

function openFoodPreview(item) {
    if (typeof window._openMenuFoodPreview === "function") {
        window._openMenuFoodPreview(item);
    }
}

function closeFoodPreview() {
    if (typeof window._closeMenuFoodPreview === "function") {
        window._closeMenuFoodPreview();
    }
}
