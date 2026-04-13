const vendors = [
    {
        id: 1,
        name: "The Pasta Corner",
        cuisine: "Italian Comfort",
        rating: 4.8,
        totalOrders: 1250,
        eta: "12 min pickup",
        badge: "Fastest pickup",
        image: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=900&h=700&fit=crop",
        location: "NSU Main Canteen"
    },
    {
        id: 2,
        name: "Burger Hub",
        cuisine: "Gourmet Burgers",
        rating: 4.7,
        totalOrders: 1480,
        eta: "10 min pickup",
        badge: "Most ordered",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&h=700&fit=crop",
        location: "NSU Annex Canteen"
    },
    {
        id: 3,
        name: "Sushi Express",
        cuisine: "Japanese Fresh",
        rating: 4.9,
        totalOrders: 920,
        eta: "15 min pickup",
        badge: "Top rated",
        image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=900&h=700&fit=crop",
        location: "NSU Business Canteen"
    },
    {
        id: 4,
        name: "Taco Fiesta",
        cuisine: "Mexican Street",
        rating: 4.6,
        totalOrders: 860,
        eta: "11 min pickup",
        badge: "Student favorite",
        image: "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=900&h=700&fit=crop",
        location: "NSU Main Canteen"
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
        delivery: "Ready in 13 min",
        category: "Best seller",
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
        delivery: "Ready in 10 min",
        category: "Best seller",
        badge: "2",
        description: "Double beef patty with crispy bacon, sweet BBQ sauce, and cheddar in a soft bun.",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&h=700&fit=crop"
    },
    {
        id: 3,
        name: "Twin Beef Slam",
        vendor: "Grill Station",
        vendor_id: 5,
        price: 6.99,
        rating: 4.9,
        delivery: "Ready in 15 min",
        category: "Best seller",
        badge: "3",
        description: "Two beef patties with double cheddar, fresh vegies, pickles, and smoky sauce.",
        image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=900&h=700&fit=crop"
    },
    {
        id: 4,
        name: "The Royal Tower",
        vendor: "Burger Lab",
        vendor_id: 6,
        price: 12.99,
        rating: 4.8,
        delivery: "Ready in 14 min",
        category: "Best seller",
        badge: "4",
        description: "Four layers of premium beef, blue cheese, smoked bacon, truffle sauce, and tomatoes.",
        image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=900&h=700&fit=crop"
    },
    {
        id: 5,
        name: "The Deluxe Wagyu",
        vendor: "Burger Lab",
        vendor_id: 6,
        price: 9.99,
        rating: 4.9,
        delivery: "Ready in 16 min",
        category: "Best seller",
        badge: "5",
        description: "Juicy wagyu patty with brie cheese, truffle mayo, arugula, and caramelized onion.",
        image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=900&h=700&fit=crop"
    },
    {
        id: 6,
        name: "The Triple Burger",
        vendor: "Smash Point",
        vendor_id: 7,
        price: 8.49,
        rating: 4.7,
        delivery: "Ready in 11 min",
        category: "Best seller",
        badge: "6",
        description: "Three layers of premium beef patty with mixed cheese, bacon, and spicy jalapenos.",
        image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=900&h=700&fit=crop"
    }
];

// Expose menuItems globally for cart integration
window.menuItems = menuItems;
document.addEventListener("DOMContentLoaded", function () {
    initializeNavigation();
    initializeSearch();
    initializeBackToTop();
    renderVendors();
    renderTrendingItems();
    initializeAnimations();
    updateCartCount();
});

function initializeBackToTop() {
    const backToTopButton = document.createElement("button");
    backToTopButton.type = "button";
    backToTopButton.className = "back-to-top";
    backToTopButton.setAttribute("aria-label", "Back to top");
    backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(backToTopButton);

    function syncBackToTopVisibility() {
        const shouldShow = window.scrollY > 320;
        backToTopButton.classList.toggle("is-visible", shouldShow);
    }

    backToTopButton.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", syncBackToTopVisibility, { passive: true });
    syncBackToTopVisibility();
}
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
            if (!target || target === "#" || target.includes("?")) {
                return;
            }

            const targetElement = document.querySelector(target);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
                if (navMenu) {
                    navMenu.classList.remove("active");
                }
            }
        });
    });
}

function initializeSearch() {
    const searchForm = document.getElementById("heroSearch");
    const searchInput = document.getElementById("searchInput");
    const inputContainer = searchInput ? searchInput.closest(".search-input-container") : null;
    const maxSuggestions = 6;
    let activeIndex = -1;
    let currentSuggestions = [];

    if (!searchForm || !searchInput || !inputContainer) {
        return;
    }

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
                return item.name.toLowerCase().includes(normalizedQuery) || item.vendor.toLowerCase().includes(normalizedQuery);
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
        if (searchInput.value.trim()) {
            updateSuggestions(searchInput.value);
        }
    });

    searchInput.addEventListener("keydown", function (event) {
        if (!currentSuggestions.length) {
            return;
        }

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
        if (!itemElement) {
            return;
        }

        const itemId = Number(itemElement.getAttribute("data-item-id"));
        const selectedItem = menuItems.find(function (item) {
            return item.id === itemId;
        });

        if (selectedItem) {
            chooseSuggestion(selectedItem);
        }
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
            console.log("Searching for:", searchTerm);
            searchInput.value = "";
        }
    });
}

const orderShell = document.getElementById("orderShell");
const pill = document.getElementById("orderPill");
const statusText = document.getElementById("statusText");
const timeEl = document.getElementById("timeLeft");

let minutes = 10;

if (orderShell && pill && timeEl && statusText) {
    syncOrderPillState();

    pill.addEventListener("click", function () {
        if (pill.classList.contains("is-ready")) {
            return;
        }

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
    if (!orderShell || !pill) {
        return;
    }

    const shouldDock = window.scrollY > 50;
    orderShell.classList.toggle("is-docked", shouldDock);
}

function renderVendors() {
    const vendorsGrid = document.getElementById("vendorsGrid");
    if (!vendorsGrid) {
        return;
    }

    const topVendors = vendors
        .slice()
        .sort(function (a, b) {
            return b.totalOrders - a.totalOrders;
        })
        .slice(0, 4);

    if (topVendors.length === 0) {
        vendorsGrid.innerHTML = `
            <article class="vendor-card">
                <div class="vendor-info">
                    <h3 class="vendor-name">No vendors available</h3>
                    <p class="vendor-cuisine">No active vendors found.</p>
                </div>
            </article>
        `;
        return;
    }

    vendorsGrid.innerHTML = topVendors
        .map(function (vendor, index) {
            return `
                <article class="vendor-card animate-fade-in-up" style="animation-delay: ${index * 0.1}s">
                    <div class="vendor-image-wrap">
                        <img src="${vendor.image}" alt="${vendor.name}" class="vendor-image">
                        <span class="vendor-badge"><i class="fas fa-bolt"></i> ${vendor.badge}</span>
                    </div>
                    <div class="vendor-info">
                        <div class="vendor-meta">
                            <span><i class="fas fa-store"></i> ${vendor.cuisine}</span>
                            <span><i class="fas fa-clock"></i> ${vendor.eta}</span>
                        </div>
                        <h3 class="vendor-name">${vendor.name}</h3>
                        <p class="vendor-cuisine">High-energy meals with reliable prep and crowd-loved flavor.</p>
                        <div class="vendor-stats">
                            <span class="vendor-rating">★ ${vendor.rating}</span>
                            <span class="vendor-orders">${vendor.totalOrders}+ orders</span>
                        </div>
                    </div>
                </article>
            `;
        })
        .join("");

    vendorsGrid.querySelectorAll(".vendor-card").forEach(function (card, index) {
        card.addEventListener("click", function () {
            const vendor = topVendors[index];
            window.location.href = `vendor.html?vendorId=${vendor.id}`;
            console.log("Clicked vendor:", vendor);
        });
    });
}
function renderTrendingItems() {
    const trendingGrid = document.getElementById("trendingGrid");
    const carouselLeft = document.getElementById("carouselLeft");
    const carouselRight = document.getElementById("carouselRight");
    if (!trendingGrid) {
        return;
    }

    const bestSellerItems = menuItems.slice(0, 6);

    if (bestSellerItems.length === 0) {
        trendingGrid.innerHTML = `
            <article class="food-card">
                <div class="food-info">
                    <h3 class="food-name">No menu available</h3>
                    <p class="food-description">No food items are available right now.</p>
                </div>
            </article>
        `;
        return;
    }

    trendingGrid.innerHTML = bestSellerItems
        .map(function (item, index) {
            return `
                <article class="food-card animate-fade-in-up" style="animation-delay: ${index * 0.1}s">
                    <div class="food-image-wrap">
                        <img src="${item.image}" alt="${item.name}" class="food-image">
                        <span class="food-badge">${item.badge}</span>
                    </div>
                    <div class="food-info">
                        <h3 class="food-name">${item.name}</h3>
                        <div class="food-price">${formatCurrency(item.price)}</div>
                        <p class="food-description">${item.description}</p>
                        <div class="food-footer">
                            <div class="food-meta">
                                <span class="food-rating">★ ${item.rating}</span>
                                <span class="food-vendor">${item.vendor}</span>
                            </div>
                            <button class="add-to-cart" data-item-id="${item.id}">
                                <i class="fas fa-plus"></i> Add
                            </button>
                        </div>
                    </div>
                </article>
            `;
        })
        .join("");

    trendingGrid.querySelectorAll(".add-to-cart").forEach(function (button) {
        button.addEventListener("click", function (e) {
            e.stopPropagation();
            const itemId = Number(this.getAttribute("data-item-id"));
            const item = bestSellerItems.find(function (menuItem) {
                return menuItem.id === itemId;
            });

            if (item) {
                addToCart(item);
            }
        });
    });

    trendingGrid.querySelectorAll(".food-card").forEach(function (card, index) {
        card.addEventListener("click", function () {
            const item = bestSellerItems[index];
            showNotification(item.name + " details previewed");
            console.log("Clicked food item:", item);
        });
    });

    if (carouselLeft && carouselRight) {
        const scrollAmount = function () {
            const firstCard = trendingGrid.querySelector(".food-card");
            return firstCard ? firstCard.offsetWidth + 24 : 320;
        };

        carouselLeft.addEventListener("click", function () {
            trendingGrid.scrollBy({
                left: -scrollAmount(),
                behavior: "smooth"
            });
        });

        carouselRight.addEventListener("click", function () {
            trendingGrid.scrollBy({
                left: scrollAmount(),
                behavior: "smooth"
            });
        });
    }
}

function addToCart(item) {
    window.QuickBiteCart.add(item);
}

function showNotification(message) {
    const existing = document.querySelector(".notification");
    if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
    }

    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(function () {
        notification.style.transform = "translateX(0)";
    }, 50);

    setTimeout(function () {
        notification.style.transform = "translateX(120%)";
        setTimeout(function () {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 2500);
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("quickbite-cart")) || [];
    const cartCount = cart.reduce(function (total, item) {
        return total + item.quantity;
    }, 0);

    document.querySelectorAll(".cart-icon").forEach(function (cartIcon) {
        cartIcon.setAttribute("data-count", cartCount);
    });
}

function initializeAnimations() {
    if (!("IntersectionObserver" in window)) {
        return;
    }

    const observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("animate-fade-in-up");
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.12,
            rootMargin: "0px 0px -40px 0px"
        }
    );

    document.querySelectorAll(".experience-card, .step, .vendor-card, .food-card, .testimonial-card, .stat-item, .category-item").forEach(function (element) {
        observer.observe(element);
    });
}

window.addEventListener("scroll", function () {
    const navbar = document.querySelector(".navbar");
    if (!navbar) {
        return;
    }

    if (window.scrollY > 24) {
        navbar.style.boxShadow = "0 14px 28px rgba(78, 44, 25, 0.08)";
    } else {
        navbar.style.boxShadow = "none";
    }
});

document.addEventListener("click", function (e) {
    if (e.target.closest(".category-item")) {
        e.preventDefault();
        const categoryItem = e.target.closest(".category-item");
        const category = categoryItem.querySelector(".category-label").textContent;
        showNotification(category + " collection coming up");
        console.log("Selected category:", category);
    }
});

document.addEventListener("click", function (e) {
    if (e.target.closest(".footer-links a")) {
        e.preventDefault();
        const link = e.target.textContent.trim();
        showNotification(link + " page is not connected yet");
        console.log("Footer link clicked:", link);
    }
});

document.addEventListener("click", function (e) {
    // Don't trigger onboarding notification for cart button
    if (e.target.closest('#headerCartBtn')) {
        return;
    }
    
    if (e.target.closest(".cta .btn-primary") || e.target.closest(".nav-cta")) {
        e.preventDefault();
        showNotification("Student onboarding flow starts here");
    } else if (e.target.closest(".cta .btn-outline-light")) {
        e.preventDefault();
        showNotification("Vendor section opened");
        const vendorsSection = document.querySelector("#vendors");
        if (vendorsSection) {
            vendorsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }
});

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "BDT"
    }).format(amount);
}

console.log("QuickBite landing page loaded");

