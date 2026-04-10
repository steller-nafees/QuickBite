// 🔁 COPY SAME DATA (for now)
// Later we can move to shared file

const vendors = [
    {
        id: 1,
        name: "The Pasta Corner",
        cuisine: "Italian Comfort",
        rating: 4.8,
        totalOrders: 1250,
        eta: "12 min pickup",
        image: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=900&h=700&fit=crop"
    },
    {
        id: 2,
        name: "Burger Hub",
        cuisine: "Gourmet Burgers",
        rating: 4.7,
        totalOrders: 1480,
        eta: "10 min pickup",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&h=700&fit=crop"
    },
    {
        id: 3,
        name: "Sushi Express",
        cuisine: "Japanese Fresh",
        rating: 4.9,
        totalOrders: 920,
        eta: "15 min pickup",
        image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=900&h=700&fit=crop"
    },
    {
        id: 4,
        name: "Taco Fiesta",
        cuisine: "Mexican Street",
        rating: 4.6,
        totalOrders: 860,
        eta: "11 min pickup",
        image: "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=900&h=700&fit=crop"
    }
];

const menuItems = [
    {
        id: 1,
        name: "Classic Burger",
        vendor: "Burger Hub",
        price: 5.49,
        rating: 4.8,
        description: "Two layers of premium beef with melted cheddar cheese.",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&h=700&fit=crop"
    },
    {
        id: 2,
        name: "The Big Stack",
        vendor: "Burger Hub",
        price: 7.99,
        rating: 4.7,
        description: "Double beef patty with crispy bacon and BBQ sauce.",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&h=700&fit=crop"
    },
    {
        id: 3,
        name: "Pasta Alfredo",
        vendor: "The Pasta Corner",
        price: 6.99,
        rating: 4.8,
        description: "Creamy alfredo pasta with parmesan cheese.",
        image: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=900&h=700&fit=crop"
    }
];

// 🚀 MAIN
document.addEventListener("DOMContentLoaded", function () {
    if (window.QuickBiteLayout && typeof window.QuickBiteLayout.updateCartCount === "function") {
        window.QuickBiteLayout.updateCartCount();
    }

    const vendorId = getVendorId();
    const vendor = getVendor(vendorId);

    if (!vendor) {
        showError();
        return;
    }

    renderVendorInfo(vendor);
    renderVendorMenu(vendor.name);
});

// ✅ Get ID from URL
function getVendorId() {
    const params = new URLSearchParams(window.location.search);
    return Number(params.get("vendorId"));
}

// ✅ Find vendor
function getVendor(id) {
    return vendors.find(v => v.id === id);
}

// ✅ Render vendor info
function renderVendorInfo(vendor) {
    document.getElementById("vendorName").textContent = vendor.name;
    document.getElementById("vendorCuisine").textContent = vendor.cuisine;
    document.getElementById("vendorRating").textContent = "★ " + vendor.rating;
    document.getElementById("vendorOrders").textContent = vendor.totalOrders + "+";
    document.getElementById("vendorETA").textContent = vendor.eta;
    document.getElementById("vendorImage").src = vendor.image;
}

// ✅ Render menu
function renderVendorMenu(vendorName) {
    const grid = document.getElementById("vendorMenuGrid");

    const items = menuItems.filter(item => item.vendor === vendorName);

    if (items.length === 0) {
        grid.innerHTML = `<div class="empty-menu">No items available</div>`;
        return;
    }

    grid.innerHTML = items.map(item => `
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
                        <button class="add-to-cart" onclick="addToCart(${item.id})">
                            <i class="fas fa-plus"></i> Add To Platter
                        </button>
                        <button class="eat-now" onclick="eatNow(${item.id})">
                            <i class="fas fa-utensils"></i> Eat Now
                        </button>
                    </div>
                </div>
            </div>
        </article>
    `).join("");
}

// ✅ Cart
function addToCart(itemId, options) {
    const item = menuItems.find(i => i.id === itemId);
    let cart = JSON.parse(localStorage.getItem("quickbite-cart")) || [];

    const existing = cart.find(c => c.id === item.id);

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...item, quantity: 1 });
    }

    localStorage.setItem("quickbite-cart", JSON.stringify(cart));
    if (!options || !options.silent) {
        showNotification(item.name + " added to platter");
    }

    if (window.QuickBiteLayout && typeof window.QuickBiteLayout.updateCartCount === "function") {
        window.QuickBiteLayout.updateCartCount();
    }
}

function eatNow(itemId) {
    addToCart(itemId, { silent: true });
    const item = menuItems.find(i => i.id === itemId);
    if (item) {
        showNotification(item.name + " is in your platter. Eat Now selected.");
    }
}
// ✅ Notification (same style)
function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = "translateX(0)";
    }, 50);

    setTimeout(() => {
        notification.remove();
    }, 2500);
}

// ✅ Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "BDT"
    }).format(amount);
}

// ❌ Error
function showError() {
    document.body.innerHTML = "<h2 style='text-align:center;margin-top:2rem;'>Vendor not found</h2>";
}







