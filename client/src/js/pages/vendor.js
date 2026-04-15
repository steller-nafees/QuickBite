let vendors = [];
let menuItems = [];

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
        menuItems = data.foods || [];
        window.menuItems = menuItems;

        renderVendorInfo(vendor);
        renderVendorMenu(vendor.name);
    } catch (error) {
        showError(error.message);
    }
});

function getVendorId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("vendorId");
}

function renderVendorInfo(vendor) {
    document.getElementById("vendorName").textContent = vendor.name;
    document.getElementById("vendorCuisine").textContent = vendor.cuisine;
    document.getElementById("vendorRating").textContent = "★ " + vendor.rating;
    document.getElementById("vendorOrders").textContent = vendor.totalOrders + "+";
    document.getElementById("vendorETA").textContent = vendor.eta;
    document.getElementById("vendorImage").src = vendor.image;

    const vendorTags = document.getElementById("vendorTags");
    if (vendorTags) {
        vendorTags.innerHTML = `
            <span class="vendor-tag">${vendor.location || "Campus pickup"}</span>
            <span class="vendor-tag">${vendor.badge || "Open now"}</span>
        `;
    }
}

function renderVendorMenu(vendorName) {
    const grid = document.getElementById("vendorMenuGrid");
    const items = menuItems.filter(function (item) {
        return item.vendor === vendorName;
    });

    if (items.length === 0) {
        grid.innerHTML = `<div class="empty-menu">No items available</div>`;
        return;
    }

    grid.innerHTML = items.map(function (item) {
        return `
        <article class="food-card">
            <div class="food-image-wrap">
                <img src="${item.image}" class="food-image">
            </div>

            <div class="food-info">
                <h3 class="food-name">${item.name}</h3>
                <div class="food-price">${formatCurrency(item.price)}</div>
                <p class="food-description">${item.description}</p>

                <div class="food-footer">
                    <div class="food-meta">
                        <span>★ ${item.rating}</span>
                    </div>

                    <div class="food-actions">
                        <button class="add-to-cart" onclick="addToCart('${item.id}')">
                            <i class="fas fa-plus"></i> Add To Platter
                        </button>
                        <button class="eat-now" onclick="eatNow('${item.id}')">
                            <i class="fas fa-utensils"></i> Eat Now
                        </button>
                    </div>
                </div>
            </div>
        </article>
    `;
    }).join("");
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

function showError(message) {
    document.body.innerHTML = "<h2 style='text-align:center;margin-top:2rem;'>" + (message || "Vendor not found") + "</h2>";
}
