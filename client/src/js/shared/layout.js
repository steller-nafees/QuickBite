function getHomeLink(path) {
    return document.body.dataset.page === "home" ? path : "index.html" + path;
}

const QUICKBITE_LOCATION_KEY = "quickbite-selected-location";
const QUICKBITE_LOCATIONS = [
    "NSU Main Canteen",
    "NSU Annex Canteen",
    "NSU Business Canteen"
];

function getSelectedLocation() {
    const savedLocation = localStorage.getItem(QUICKBITE_LOCATION_KEY);
    if (savedLocation && QUICKBITE_LOCATIONS.includes(savedLocation)) {
        return savedLocation;
    }

    return QUICKBITE_LOCATIONS[0];
}

function getAuthUserFromStorage() {
    try {
        return JSON.parse(localStorage.getItem("quickbite-auth-user")) || null;
    } catch (error) {
        return null;
    }
}

function isAppShellPage() {
    const page = document.body.dataset.page;
    return page === "customer-dashboard" || page === "vendor-dashboard" || page === "register";
}

function getAuthNavClusterHtml() {
    const user = getAuthUserFromStorage();
    const hasSession = Boolean(user && (user.email || user.fullName || user.name));
    if (!hasSession) {
        return "";
    }

    const page = document.body.dataset.page;
    const role = String(user.role || "customer").toLowerCase();
    const dashboardHref = role === "vendor" ? "vendor-dashboard.html" : "customer-dashboard.html";
    const onMatchingDashboard =
        (role === "vendor" && page === "vendor-dashboard") ||
        (role !== "vendor" && page === "customer-dashboard");

    let html = "<span class=\"nav-auth-cluster\">";
    html += "<a href=\"profile.html\" class=\"nav-link\">Account</a>";
    if (!onMatchingDashboard || page === "register") {
        html += "<a href=\"" + dashboardHref + "\" class=\"nav-link nav-link-muted\">Dashboard</a>";
    }
    html += "<a href=\"#\" class=\"nav-link nav-link-muted\" data-auth-signout=\"true\">Sign out</a>";
    html += "</span>";
    return html;
}

function updateHeaderUserState() {
    const user = getAuthUserFromStorage();
    const btn = document.getElementById("headerUserBtn");
    if (!btn) return;
    if (user && (user.fullName || user.name || user.email)) {
        const fullName = user.fullName || user.name || user.email.split("@")[0];
        const firstName = fullName.split(' ')[0];
        const initial = firstName.charAt(0).toUpperCase();
        
        btn.className = "btn user-btn signed-in btn-user-signed";
        btn.setAttribute("aria-label", `${fullName}`);
        btn.innerHTML = `
            <div class="user-avatar">${initial}</div>
            <span class="user-greeting">Hi, <strong>${firstName}</strong></span>
            <i class="fas fa-chevron-down user-dropdown-icon"></i>
            <div class="user-dropdown" id="userDropdown">
                <a href="customer-dashboard.html" class="dropdown-item"><i class="fas fa-chart-pie"></i> Dashboard</a>
                <a href="#" class="dropdown-item" id="dropdownNotif"><i class="fas fa-bell"></i> Notifications</a>
                <a href="#" class="dropdown-item" id="dropdownLogout"><i class="fas fa-sign-out-alt"></i> Log Out</a>
            </div>
        `;
        
        // Add click handler for dropdown toggle
        btn.onclick = function (e) {
            e.stopPropagation();
            const dropdown = document.getElementById("userDropdown");
            if (dropdown) {
                dropdown.classList.toggle("show");
            }
        };
        
        // Add click handler for Notifications in dropdown
        const notifLink = document.getElementById("dropdownNotif");
        if (notifLink) {
            notifLink.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                toggleNotifications();
                // Close the dropdown
                const dropdown = document.getElementById("userDropdown");
                if (dropdown) {
                    dropdown.classList.remove("show");
                }
            };
        }
        
        // Add click handler for Logout in dropdown
        const logoutLink = document.getElementById("dropdownLogout");
        if (logoutLink) {
            logoutLink.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                // Clear authentication data
                localStorage.removeItem("quickbite-auth-user");
                localStorage.removeItem("quickbite-profile");
                // Redirect to home page
                window.location.href = "index.html";
            };
        }
    } else {
        // show a clear Sign In button when logged out
        btn.className = "btn btn-signin";
        btn.setAttribute("aria-label", "Sign in");
        btn.textContent = "Sign In";
        btn.onclick = function (e) {
            e.preventDefault();
            // Prefer a hidden dedicated login opener (won't trigger page-level CTA click handlers)
            const loginOpener = document.getElementById('authLoginOpener') || document.querySelector('[data-auth-open="login"]');
            if (loginOpener) {
                loginOpener.click();
                return;
            }

            // Fallback: choose an opener that is not inside the CTA area to avoid the onboarding notification
            const openers = Array.from(document.querySelectorAll('[data-auth-open]'));
            const safeOpener = openers.find(o => !o.closest('.cta') && !o.closest('.hero') && !o.closest('.nav-utilities'));
            if (safeOpener) {
                safeOpener.click();
                return;
            }

            // Last resort: click the first opener
            document.querySelector('[data-auth-open]')?.click();
        };
    }
}

function getGlobalHeaderMarkup() {
    const selectedLocation = getSelectedLocation();
    const locationOptions = QUICKBITE_LOCATIONS
        .map(function (location) {
            const isActive = location === selectedLocation ? " is-active" : "";
            return `<button type="button" class="location-option${isActive}" data-location="${location}">${location}</button>`;
        })
        .join("");

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
                <div class="location-picker-wrap" id="locationPicker">
                    <button type="button" id="locationSelector" class="location-selector" aria-label="Select canteen location" aria-expanded="false" aria-controls="locationOptions">
                        <span class="location-selector-main">
                            <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                            <span id="locationSelectorLabel">${selectedLocation}</span>
                        </span>
                        <i class="fas fa-chevron-down location-selector-chevron" aria-hidden="true"></i>
                    </button>
                    <div id="locationOptions" class="location-options" role="listbox" aria-label="Available canteen locations">
                        ${locationOptions}
                    </div>
                </div>
                <div class="nav-menu" id="navMenu">
                    <a href="${getHomeLink("#vendors")}" class="nav-link">Vendors</a>
                    <a href="${getHomeLink("#menu")}" class="nav-link">Our Menu</a>
                    <a href="${getHomeLink("#menu")}" class="nav-link">Best Picks</a>
                    <a href="${getHomeLink("#experience")}" class="nav-link">About Us</a>
                    <a href="${getHomeLink("#pricing")}" class="nav-link">Plans</a>
                </div>

                <div class="nav-utilities">
                    <button class="nav-cta cart-icon" data-count="0" aria-label="Cart" id="headerCartBtn">
                        <i class="fas fa-shopping-cart"></i>
                    </button>

                    <button class="btn user-btn" id="headerUserBtn" aria-label="Sign in">
                        <i class="fas fa-user-circle"></i>
                        <span class="user-label">Sign In</span>
                    </button>
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
                    © 2026 QuickBite. Developed By H M Nafees N Islam & Hasan Md. Turabi Rahman.
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
    // Ensure header shows correct user state after rendering
    updateHeaderUserState();
}

function initializeLocationSelector() {
    const locationPicker = document.getElementById("locationPicker");
    const locationSelector = document.getElementById("locationSelector");
    const locationSelectorLabel = document.getElementById("locationSelectorLabel");
    const locationOptions = document.getElementById("locationOptions");

    if (!locationPicker || !locationSelector || !locationSelectorLabel || !locationOptions) {
        return;
    }

    function closeDropdown() {
        locationPicker.classList.remove("is-open");
        locationSelector.setAttribute("aria-expanded", "false");
    }

    function openDropdown() {
        locationPicker.classList.add("is-open");
        locationSelector.setAttribute("aria-expanded", "true");
    }

    function selectLocation(selectedLocation) {
        localStorage.setItem(QUICKBITE_LOCATION_KEY, selectedLocation);
        locationSelectorLabel.textContent = selectedLocation;

        locationOptions.querySelectorAll(".location-option").forEach(function (option) {
            option.classList.toggle("is-active", option.getAttribute("data-location") === selectedLocation);
        });

        closeDropdown();
        document.dispatchEvent(
            new CustomEvent("quickbite:location-changed", {
                detail: {
                    location: selectedLocation
                }
            })
        );
    }

    locationSelector.addEventListener("click", function () {
        const isOpen = locationPicker.classList.contains("is-open");
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    });

    locationOptions.addEventListener("click", function (event) {
        const option = event.target.closest(".location-option");
        if (!option) {
            return;
        }

        const selectedLocation = option.getAttribute("data-location");
        if (selectedLocation) {
            selectLocation(selectedLocation);
        }
    });

    document.addEventListener("click", function (event) {
        if (!locationPicker.contains(event.target)) {
            closeDropdown();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeDropdown();
        }
    });
}

function initializeAuthSignOut() {
    document.addEventListener("click", function (event) {
        const trigger = event.target.closest("[data-auth-signout]");
        if (!trigger) {
            return;
        }
        event.preventDefault();
        localStorage.removeItem("quickbite-auth-user");
        localStorage.removeItem("quickbite-profile");
        window.location.href = "index.html";
    });
}

function initializeUserDropdown() {
    // Close user dropdown when clicking outside
    document.addEventListener("click", function (event) {
        const userBtn = document.getElementById("headerUserBtn");
        const dropdown = document.getElementById("userDropdown");
        if (dropdown && userBtn && !userBtn.contains(event.target)) {
            dropdown.classList.remove("show");
        }
    });
}

/* ============================================================
   NOTIFICATIONS
   ============================================================ */
function initializeNotifications() {
    var notifications = [
        { id: 1, type: 'success', title: 'Welcome to QuickBite', desc: 'Your account has been created successfully', time: Date.now() - 300000, read: false },
        { id: 2, type: 'order', title: 'Browse Menu', desc: 'Check out our trending items and place your first order', time: Date.now() - 900000, read: false },
        { id: 3, type: 'warning', title: 'Campus Hours', desc: 'All vendors are open from 10 AM to 8 PM', time: Date.now() - 1800000, read: true }
    ];

    function timeAgo(ms) {
        var d = Date.now() - ms;
        if (d < 60000) return "just now";
        if (d < 3600000) return Math.floor(d / 60000) + "m ago";
        if (d < 86400000) return Math.floor(d / 3600000) + "h ago";
        return Math.floor(d / 86400000) + "d ago";
    }

    function renderNotifications() {
        var list = document.getElementById('notifList');
        
        if (!notifications.length) {
            list.innerHTML = '<div class="notif-empty"><i class="fas fa-bell-slash"></i>No notifications yet</div>';
            return;
        }

        list.innerHTML = notifications.map(function(n) {
            var iconClass = n.type === 'order' ? 'receipt' : n.type === 'success' ? 'check' : 'exclamation-triangle';
            return '<div class="notif-item ' + (n.read ? '' : 'unread') + '" data-notif-id="' + n.id + '">' +
                '<div class="notif-icon ' + n.type + '">' +
                '<i class="fas fa-' + iconClass + '"></i>' +
                '</div>' +
                '<div class="notif-content">' +
                '<div class="notif-title">' + escapeHtml(n.title) + '</div>' +
                '<div class="notif-desc">' + escapeHtml(n.desc) + '</div>' +
                '<div class="notif-time">' + timeAgo(n.time) + '</div>' +
                '</div>' +
                '</div>';
        }).join('');
    }

    function toggleNotifications() {
        var panel = document.getElementById('notifPanel');
        if (!panel) return;
        
        panel.classList.toggle('open');
        
        // Mark all as read when opened
        if (panel.classList.contains('open')) {
            notifications.forEach(function(n) { n.read = true; });
            renderNotifications();
        }
    }

    function clearAllNotifications() {
        notifications = [];
        renderNotifications();
    }

    var notifBtn = document.getElementById('notifBtn');
    if (notifBtn) {
        notifBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleNotifications();
        });
    }

    var clearBtn = document.getElementById('notifClearAll');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllNotifications);
    }

    // Close notifications when clicking outside
    document.addEventListener('click', function(e) {
        var panel = document.getElementById('notifPanel');
        if (panel && !panel.contains(e.target)) {
            panel.classList.remove('open');
        }
    });

    // Make toggleNotifications available globally for dropdown link
    window.toggleNotifications = toggleNotifications;

    // Initial render
    renderNotifications();
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
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
initializeLocationSelector();
initializeAuthSignOut();
initializeNotifications();
initializeUserDropdown();

if (document.body.dataset.page !== "home") {
    initializeSharedNavigation();
    initializeSharedOrderPill();
}

window.QuickBiteLayout = {
    renderGlobalLayout: renderGlobalLayout,
    updateCartCount: updateGlobalCartCount,
    getSelectedLocation: getSelectedLocation
};





