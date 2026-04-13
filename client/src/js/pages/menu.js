const vendors = [
    {
        id: 1,
        name: "The Pasta Corner",
        cuisine: "Italian Comfort",
        rating: 4.8,
        totalOrders: 1250,
        eta: "12 min pickup"
    },
    {
        id: 2,
        name: "Burger Hub",
        cuisine: "Gourmet Burgers",
        rating: 4.7,
        totalOrders: 1480,
        eta: "10 min pickup"
    },
    {
        id: 3,
        name: "Sushi Express",
        cuisine: "Japanese Fresh",
        rating: 4.9,
        totalOrders: 920,
        eta: "15 min pickup"
    },
    {
        id: 4,
        name: "Taco Fiesta",
        cuisine: "Mexican Street",
        rating: 4.6,
        totalOrders: 860,
        eta: "11 min pickup"
    }
];

const menuItems = [
    {
        id: 1,
        name: "Classic Burger",
        vendor: "Burger Hub",
        vendor_id: 2,
        price: 5.49,
        rating: 4.8,
        badge: "1",
        description: "Two layers of premium beef with melted cheddar cheese, tomato, and pickles.",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&h=700&fit=crop"
    },
    {
        id: 2,
        name: "The Big Stack",
        vendor: "Burger Hub",
        vendor_id: 2,
        price: 7.99,
        rating: 4.7,
        badge: "2",
        description: "Double beef patty with crispy bacon, sweet BBQ sauce, and cheddar in a soft bun.",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&h=700&fit=crop"
    },
    {
        id: 3,
        name: "Twin Beef Slam",
        vendor: "Burger Hub",
        vendor_id: 2,
        price: 6.99,
        rating: 4.9,
        badge: "3",
        description: "Two beef patties with double cheddar, fresh vegies, pickles, and smoky sauce.",
        image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=900&h=700&fit=crop"
    },
    {
        id: 4,
        name: "Pasta Alfredo",
        vendor: "The Pasta Corner",
        vendor_id: 1,
        price: 6.49,
        rating: 4.8,
        badge: "4",
        description: "Creamy alfredo pasta with parmesan, cracked pepper, and a buttery finish.",
        image: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=900&h=700&fit=crop"
    },
    {
        id: 5,
        name: "Arrabbiata Bowl",
        vendor: "The Pasta Corner",
        vendor_id: 1,
        price: 6.89,
        rating: 4.7,
        badge: "5",
        description: "Spicy tomato pasta bowl with herbs, garlic, and a clean chili kick.",
        image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=900&h=700&fit=crop"
    },
    {
        id: 6,
        name: "Salmon Sushi Box",
        vendor: "Sushi Express",
        vendor_id: 3,
        price: 8.99,
        rating: 4.9,
        badge: "6",
        description: "Fresh salmon rolls with wasabi, soy, and a light campus-lunch portion.",
        image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=900&h=700&fit=crop"
    },
    {
        id: 7,
        name: "Crispy Shrimp Roll",
        vendor: "Sushi Express",
        vendor_id: 3,
        price: 8.49,
        rating: 4.8,
        badge: "7",
        description: "Crunchy shrimp roll finished with sesame and a creamy spicy drizzle.",
        image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=900&h=700&fit=crop"
    },
    {
        id: 8,
        name: "Street Taco Trio",
        vendor: "Taco Fiesta",
        vendor_id: 4,
        price: 5.99,
        rating: 4.6,
        badge: "8",
        description: "Three soft tacos loaded with seasoned meat, salsa, and crunchy onions.",
        image: "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=900&h=700&fit=crop"
    },
    {
        id: 9,
        name: "Loaded Nacho Box",
        vendor: "Taco Fiesta",
        vendor_id: 4,
        price: 5.79,
        rating: 4.7,
        badge: "9",
        description: "Crisp nachos layered with cheese, jalapenos, salsa, and smoky sauce.",
        image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=900&h=700&fit=crop"
    }
];

window.menuItems = menuItems;

document.addEventListener("DOMContentLoaded", function () {
    if (window.QuickBiteLayout && typeof window.QuickBiteLayout.updateCartCount === "function") {
        window.QuickBiteLayout.updateCartCount();
    }

    initializeMenuPage();
});

function initializeMenuPage() {
    const state = {
        selectedVendor: "all",
        query: ""
    };

    const vendorFilterList = document.getElementById("vendorFilterList");
    const menuGrid = document.getElementById("menuGrid");
    const menuSearchInput = document.getElementById("menuSearchInput");
    const menuSearchForm = document.getElementById("menuSearchForm");
    const resultsSummary = document.getElementById("resultsSummary");

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
                    return item.vendor_id === vendor.id;
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
                            <span class="menu-card-badge">${item.badge}</span>
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
                                <a class="btn menu-link-btn" href="vendor.html?vendorId=${item.vendor_id}">
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
                const itemId = Number(button.getAttribute("data-item-id"));
                const item = menuItems.find(function (entry) {
                    return entry.id === itemId;
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
