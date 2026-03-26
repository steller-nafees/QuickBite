function getHomeLink(path) {
    return document.body.dataset.page === "home" ? path : "index.html" + path;
}

function getGlobalHeaderMarkup() {
    return `
        <nav class="navbar">
            <div class="nav-container">
                <a href="index.html" class="nav-brand" aria-label="QuickBite home">
                    <span class="brand-mark">
                        <img src="./assets/icons/app_icon_transparent.png" alt="QuickBite Logo" style="width: auto;">
                    </span>
                    <span class="brand-copy">
                        <strong>QuickBite</strong>
                        <small>Pre-Order. Pick Up. Bite .</small>
                    </span>
                </a>
                <div>
                    <strong class="location">NSU Main Canteen</strong><i class="fas fa-map-marker-alt"></i>
                </div>
                <div class="nav-menu" id="navMenu">
                    <a href="${getHomeLink("#discover")}" class="nav-link">Discover</a>
                    <a href="${getHomeLink("#vendors")}" class="nav-link">Vendors</a>
                    <a href="${getHomeLink("#menu")}" class="nav-link">Top Picks</a>
                    <a href="${getHomeLink("#experience")}" class="nav-link">Why Us</a>
                    <a href="${getHomeLink("#pricing")}" class="nav-link">Plans</a>
                    <a href="${getHomeLink("#auth")}" class="nav-link nav-link-muted">Sign In</a>
                    <a href="${getHomeLink("#auth")}" class="nav-cta">Start Ordering</a>
                </div>
                <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </nav>
    `;
}

function getGlobalOrderPillMarkup() {
    return `
        <section class="order-shell" id="orderShell">
            <div class="order-pill" id="orderPill" aria-expanded="false">
                <div class="order-main">
                    <span class="dot"></span>
                    <div class="summary">
                        <strong id="statusText">Preparing</strong>
                        <span class="token">Token 12</span>
                        <span class="time" id="timeLeft">10 mins</span>
                    </div>
                    <span class="chevron" aria-hidden="true">
                        <i class="fas fa-chevron-down chevron-open"></i>
                        <i class="fas fa-xmark chevron-close"></i>
                    </span>
                </div>
                <div class="order-details" id="orderDetails">
                    <div><span>Vendor:</span> Pizza Hub</div>
                    <div><span>Items:</span> Burger x1, Fries x2</div>
                </div>
            </div>
        </section>
    `;
}

function getGlobalFooterMarkup() {
    return `
        <footer class="footer">
            <div class="container">
                <div class="footer-grid">
                    <div class="footer-column">
                        <div class="footer-brand">
                            <span class="brand-mark">
                                <img src="./assets/icons/app_icon_transparent_dark.png" alt="QuickBite Logo" style="width: auto;">
                            </span>
                            <span class="brand-copy-footer">
                                <strong>QuickBite</strong>
                                <small>Pre-Order. Pick Up. Bite .</small>
                            </span>
                        </div>
                        <p class="footer-description">
                            A polished food-ordering experience for campus communities that want less waiting and better meals.
                        </p>
                    </div>
                    <div class="footer-column">
                        <h4 class="footer-title">Platform</h4>
                        <div class="footer-links">
                            <a href="${getHomeLink("#discover")}">Discover</a>
                            <a href="${getHomeLink("#vendors")}">Vendors</a>
                            <a href="${getHomeLink("#menu")}">Top Picks</a>
                            <a href="${getHomeLink("#pricing")}">Launch</a>
                        </div>
                    </div>
                    <div class="footer-column">
                        <h4 class="footer-title">Support</h4>
                        <div class="footer-links">
                            <a href="#help">Help Center</a>
                            <a href="#contact">Contact Us</a>
                            <a href="#privacy">Privacy Policy</a>
                            <a href="#terms">Terms of Service</a>
                        </div>
                    </div>
                    <div class="footer-column">
                        <h4 class="footer-title">Built For</h4>
                        <div class="footer-links">
                            <a href="${getHomeLink("#experience")}">Students</a>
                            <a href="${getHomeLink("#vendors")}">Campus Vendors</a>
                            <a href="${getHomeLink("#pricing")}">Universities</a>
                        </div>
                    </div>
                </div>
                <div class="footer-bottom">
                    © 2026 QuickBite. Crafted for faster campus food ordering.
                </div>
            </div>
        </footer>
    `;
}

function updateGlobalCartCount() {
    const cart = JSON.parse(localStorage.getItem("quickbite-cart")) || [];
    const cartCount = cart.reduce(function (total, item) {
        return total + item.quantity;
    }, 0);

    document.querySelectorAll(".cart-icon").forEach(function (cartIcon) {
        cartIcon.setAttribute("data-count", cartCount);
    });
}

function renderGlobalLayout() {
    const headerMount = document.getElementById("globalHeader");
    const orderPillMount = document.getElementById("globalOrderPill");
    const footerMount = document.getElementById("globalFooter");

    if (headerMount) {
        headerMount.innerHTML = getGlobalHeaderMarkup();
    }

    if (orderPillMount) {
        orderPillMount.innerHTML = getGlobalOrderPillMarkup();
    }

    if (footerMount) {
        footerMount.innerHTML = getGlobalFooterMarkup();
    }

    updateGlobalCartCount();
}

function initializeSharedNavigation() {
    const navToggle = document.getElementById("navToggle");
    const navMenu = document.getElementById("navMenu");
    const navbar = document.querySelector(".navbar");

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

    if (navbar) {
        window.addEventListener("scroll", function () {
            if (window.scrollY > 8) {
                navbar.style.boxShadow = "0 14px 28px rgba(78, 44, 25, 0.08)";
            } else {
                navbar.style.boxShadow = "none";
            }
        }, { passive: true });
    }
}

function initializeSharedOrderPill() {
    const orderShell = document.getElementById("orderShell");
    const pill = document.getElementById("orderPill");
    const statusText = document.getElementById("statusText");
    const timeEl = document.getElementById("timeLeft");
    let minutes = 10;

    function syncOrderPillState() {
        if (!orderShell || !pill) {
            return;
        }

        const shouldDock = window.scrollY > 50;
        orderShell.classList.toggle("is-docked", shouldDock);
    }

    if (!orderShell || !pill || !statusText || !timeEl) {
        return;
    }

    syncOrderPillState();

    pill.addEventListener("click", function () {
        if (pill.classList.contains("is-ready")) {
            return;
        }

        const isExpanded = pill.classList.toggle("expanded");
        pill.setAttribute("aria-expanded", String(isExpanded));
    });

    window.addEventListener("scroll", syncOrderPillState, { passive: true });

    window.setInterval(function () {
        if (minutes > 0) {
            minutes--;

            if (minutes === 0) {
                statusText.textContent = "Ready for pickup";
                timeEl.textContent = "Now";
                pill.classList.add("is-ready");
                pill.classList.remove("expanded");
                pill.setAttribute("aria-expanded", "false");
            } else {
                timeEl.textContent = minutes + " mins";
            }
        }
    }, 60000);
}

renderGlobalLayout();

if (document.body.dataset.page !== "home") {
    initializeSharedNavigation();
    initializeSharedOrderPill();
}

window.QuickBiteLayout = {
    renderGlobalLayout: renderGlobalLayout,
    updateCartCount: updateGlobalCartCount
};
