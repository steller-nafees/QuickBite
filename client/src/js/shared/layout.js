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
    return page === "customer-dashboard" || page === "admin-dashboard" || page === "register";
}

function getAuthNavClusterHtml() {
    const user = getAuthUserFromStorage();
    const hasSession = Boolean(user && (user.email || user.fullName || user.name));
    if (!hasSession) {
        return "";
    }

    const page = document.body.dataset.page;
    const role = String(user.role || "customer").toLowerCase();
    const dashboardHref = role === "vendor" ? "admin-dashboard.html" : "customer-dashboard.html";
    const onMatchingDashboard =
        (role === "vendor" && page === "admin-dashboard") ||
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

    function setUserDropdownOpenState(isOpen) {
        const dropdown = document.getElementById("userDropdown");
        if (!dropdown || !btn.classList.contains("signed-in")) {
            return;
        }

        dropdown.classList.toggle("show", isOpen);
        btn.classList.toggle("is-open", isOpen);
        btn.setAttribute("aria-expanded", String(isOpen));
    }

    if (user && (user.fullName || user.name || user.email)) {
        const role = String(user.role || "customer").toLowerCase();
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
                <a href="${role === "vendor" ? "admin-dashboard.html" : "customer-dashboard.html"}" class="dropdown-item"><i class="fas fa-chart-pie"></i> Dashboard</a>
                <a href="#" class="dropdown-item" id="dropdownNotif"><i class="fas fa-bell"></i> Notifications</a>
                <a href="#" class="dropdown-item" id="dropdownLogout"><i class="fas fa-sign-out-alt"></i> Log Out</a>
            </div>
        `;

        // Add click handler for dropdown toggle
        btn.onclick = function (e) {
            e.stopPropagation();
            const dropdown = document.getElementById("userDropdown");
            if (dropdown) {
                const shouldOpen = !dropdown.classList.contains("show");
                setUserDropdownOpenState(shouldOpen);
            }
        };

        setUserDropdownOpenState(false);

        // Add click handler for Notifications in dropdown
        const notifLink = document.getElementById("dropdownNotif");
        if (notifLink) {
            notifLink.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                toggleNotifications();
                setUserDropdownOpenState(false);
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
                localStorage.removeItem("quickbite-auth-token");
                localStorage.removeItem("quickbite-cart");
                // Redirect to home page
                window.location.href = "index.html";
            };
        }
    } else {
        // show a clear Sign In button when logged out
        btn.className = "btn btn-signin";
        btn.setAttribute("aria-label", "Sign in");
        btn.setAttribute("aria-expanded", "false");
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

            // Last resort: directly open the modal if present (works even if auth-modal.js hasn't bound click handlers)
            if (typeof window.QuickBiteAuthOpen === "function") {
                window.QuickBiteAuthOpen("login");
                return;
            }

            document.querySelector('[data-auth-open]')?.click();
        };
    }
}

function openAuthModalFallback(type) {
    const modal = document.getElementById("authModal");
    if (!modal) return false;

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    modal.setAttribute("aria-hidden", "false");

    if (loginForm && registerForm) {
        if (type === "register") {
            registerForm.classList.add("active");
            loginForm.classList.remove("active");
        } else {
            loginForm.classList.add("active");
            registerForm.classList.remove("active");
        }
    }

    return true;
}

// Expose a tiny safe API so header Sign In can always open the modal.
window.QuickBiteAuthOpen = function (type) {
    const t = String(type || "login").toLowerCase();
    return openAuthModalFallback(t);
};

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
                        <small>Pre-Order. Pick Up. Bite.</small>
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
                    <a href="vendors.html" class="nav-link">Vendors</a>
                    <a href="menu.html" class="nav-link">Menu</a>
                    <a href="${getHomeLink("#menu")}" class="nav-link">Best Picks</a>
                    <a href="${getHomeLink("#experience")}" class="nav-link">About QuickBite</a>
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
    const user = getAuthUserFromStorage();
    const hasSession = Boolean(user && (user.email || user.fullName || user.name));
    if (!hasSession) {
        return "";
    }

    return `
        <section class="order-shell" id="orderShell">
            <div class="order-pill" id="orderPill" aria-expanded="false">
                <div class="order-main">
                    <span class="dot"></span>
                    <div class="summary">
                        <strong id="statusText">Preparing</strong>
                        <span class="token">Token QB-—</span>
                        <span class="time" id="timeLeft">—</span>
                    </div>
                    <span class="chevron" aria-hidden="true">
                        <i class="fas fa-chevron-down chevron-open"></i>
                        <i class="fas fa-xmark chevron-close"></i>
                    </span>
                </div>
                <div class="order-details" id="orderDetails">
                    <div><span>Vendor:</span> —</div>
                    <div><span>Items:</span> —</div>
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
                            <a href="vendors.html">Vendors</a>
                            <a href="${getHomeLink("#menu")}">Top Picks</a>
                            <a href="#" data-auth-open="register">Launch</a>
                        </div>
                    </div>
                    <div class="footer-column">
                        <h4 class="footer-title">Support</h4>
                        <div class="footer-links">
                            <a href="#help">Help Center</a>
                            <a href="./contact.html">Contact Us</a>
                            <a href="#privacy">Privacy Policy</a>
                            <a href="#terms">Terms of Service</a>
                        </div>
                    </div>
                    <div class="footer-column">
                        <h4 class="footer-title">Built For</h4>
                        <div class="footer-links">
                            <a href="${getHomeLink("#experience")}">Students</a>
                            <a href="vendors.html">Campus Vendors</a>
                            <a href="${getHomeLink("#pricing")}">Universities</a>
                        </div>
                    </div>
                </div>
                <div class="footer-bottom">
                    © 2026 QuickBite. Developed By&nbsp <a href="https://github.com/steller-nafees" target="_blank"> H M Nafees N Islam</a>&nbsp & &nbsp <a href="https://github.com/TurabiRahman" target="_blank" >Hasan Md. Turabi Rahman</a>.
                </div>
                <style>
                    .footer-bottom {
                        display: flex;
                        justify-content: center;
                    }
                    .footer-bottom a {
                        color: var(--color-cream-light);
                        text-decoration: None;
                    }
                </style>
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

function refreshAuthUi() {
    const orderPillMount = document.getElementById("globalOrderPill");

    updateHeaderUserState();

    if (orderPillMount) {
        orderPillMount.innerHTML = getGlobalOrderPillMarkup();
    }

    initializeSharedOrderPill();
}

// Move location picker into nav menu for smaller screens and restore on larger screens
function relocateLocationPicker() {
    var threshold = 1080;
    var locationPicker = document.getElementById('locationPicker');
    var navMenu = document.getElementById('navMenu');
    var navContainer = document.querySelector('.nav-container');
    var headerUserBtn = document.getElementById('headerUserBtn');
    var navUtilities = document.querySelector('.nav-utilities');
    var headerCartBtn = document.getElementById('headerCartBtn');
    var navToggle = document.getElementById('navToggle');

    if (!locationPicker || !navMenu || !navContainer) return;

    var alreadyMoved = locationPicker.classList.contains('moved-to-nav');

    if (window.innerWidth < threshold) {
        if (!alreadyMoved) {
            // move into navMenu as the first child
            navMenu.insertAdjacentElement('afterbegin', locationPicker);
            locationPicker.classList.add('moved-to-nav');
        }
        // move sign-in button into navMenu as well
        if (headerUserBtn && !headerUserBtn.classList.contains('moved-to-nav-user')) {
            navMenu.appendChild(headerUserBtn);
            headerUserBtn.classList.add('moved-to-nav-user');
        }
        // move cart next to the hamburger toggle (keep visible)
        if (headerCartBtn && navToggle && !headerCartBtn.classList.contains('moved-to-toggle')) {
            // insert cart before the toggle so it's visually next to it
            navContainer.insertBefore(headerCartBtn, navToggle);
            headerCartBtn.classList.add('moved-to-toggle');
        }
    } else {
        if (alreadyMoved) {
            // move back to nav-container before nav-menu
            // find insertion point: place before navMenu inside navContainer
            navContainer.insertBefore(locationPicker, navMenu);
            locationPicker.classList.remove('moved-to-nav');
        }
        // restore sign-in button to nav-utilities
        if (headerUserBtn && headerUserBtn.classList.contains('moved-to-nav-user') && navUtilities) {
            navUtilities.appendChild(headerUserBtn);
            headerUserBtn.classList.remove('moved-to-nav-user');
        }
        // restore cart to nav-utilities
        if (headerCartBtn && headerCartBtn.classList.contains('moved-to-toggle') && navUtilities) {
            // put cart at the start of nav-utilities
            navUtilities.insertBefore(headerCartBtn, navUtilities.firstChild);
            headerCartBtn.classList.remove('moved-to-toggle');
        }
    }
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
        localStorage.removeItem("quickbite-auth-token");
        localStorage.removeItem("quickbite-cart");
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
            userBtn.classList.remove("is-open");
            userBtn.setAttribute("aria-expanded", "false");
        }
    });
}

/* ============================================================
   NOTIFICATIONS
   ============================================================ */
var QUICKBITE_NOTIFICATION_KEY = "quickbite-panel-notifications";

function readStoredNotifications() {
    try {
        var raw = localStorage.getItem(QUICKBITE_NOTIFICATION_KEY);
        var parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function writeStoredNotifications(notifications) {
    try {
        localStorage.setItem(QUICKBITE_NOTIFICATION_KEY, JSON.stringify(Array.isArray(notifications) ? notifications : []));
    } catch (error) {
        // ignore
    }
}

function createNotificationCenter() {
    function isVisibleToCurrentUser(notification) {
        var user = getAuthUserFromStorage();
        if (!user) return false;

        var role = String(user.role || "customer").toLowerCase();
        var userId = String(user.user_id || user.userId || user.id || "");
        var audience = notification && notification.audience ? notification.audience : null;
        if (!audience) return true;

        if (Array.isArray(audience.userIds) && audience.userIds.map(String).includes(userId)) {
            return true;
        }

        if (Array.isArray(audience.roles) && audience.roles.map(function (item) { return String(item).toLowerCase(); }).includes(role)) {
            return true;
        }

        return false;
    }

    function list() {
        return readStoredNotifications().filter(isVisibleToCurrentUser).sort(function (a, b) {
            return Number(b.time || 0) - Number(a.time || 0);
        });
    }

    function update(nextNotifications) {
        writeStoredNotifications(nextNotifications);
        document.dispatchEvent(new CustomEvent("quickbite:notifications-updated"));
    }

    return {
        list: list,
        add: function (notification) {
            var entry = Object.assign({
                id: "notif_" + Date.now() + "_" + Math.random().toString(16).slice(2),
                type: "info",
                title: "Notification",
                desc: "",
                time: Date.now(),
                read: false,
            }, notification || {});

            var notifications = list();
            notifications.unshift(entry);
            update(notifications.slice(0, 50));
            return entry;
        },
        clear: function () {
            update([]);
        },
        markAllRead: function () {
            var notifications = list().map(function (item) {
                return Object.assign({}, item, { read: true });
            });
            update(notifications);
        },
        replaceAll: function (notifications) {
            update(Array.isArray(notifications) ? notifications : []);
        }
    };
}

function initializeNotifications() {
    var center = window.QuickBiteNotificationCenter || (window.QuickBiteNotificationCenter = createNotificationCenter());

    function timeAgo(ms) {
        var d = Date.now() - ms;
        if (d < 60000) return "just now";
        if (d < 3600000) return Math.floor(d / 60000) + "m ago";
        if (d < 86400000) return Math.floor(d / 3600000) + "h ago";
        return Math.floor(d / 86400000) + "d ago";
    }

    function renderNotifications() {
        var list = document.getElementById('notifList');
        if (!list) return; // guard: some pages don't include the notification panel

        var notifications = center.list();
        if (!notifications.length) {
            list.innerHTML = '<div class="notif-empty"><i class="fas fa-bell-slash"></i>No notifications yet</div>';
            return;
        }

        list.innerHTML = notifications.map(function (n) {
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

        var willOpen = !panel.classList.contains('open');
        panel.classList.toggle('open', willOpen);

        // Mark all as read when opened
        if (willOpen) {
            center.markAllRead();
            renderNotifications();
        }
    }

    function clearAllNotifications() {
        center.clear();
    }

    var notifBtn = document.getElementById('notifBtn');
    if (notifBtn) {
        notifBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleNotifications();
        });
    }

    var clearBtn = document.getElementById('notifClearAll');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllNotifications);
    }

    // Close notifications when clicking outside
    document.addEventListener('click', function (e) {
        var panel = document.getElementById('notifPanel');
        var notifBtn = document.getElementById('notifBtn');
        var dropdownNotif = document.getElementById('dropdownNotif');
        if (
            panel &&
            panel.classList.contains('open') &&
            !panel.contains(e.target) &&
            !(notifBtn && notifBtn.contains(e.target)) &&
            !(dropdownNotif && dropdownNotif.contains(e.target))
        ) {
            panel.classList.remove('open');
        }
    });

    // Make toggleNotifications available globally for dropdown link
    window.toggleNotifications = toggleNotifications;
    document.addEventListener("quickbite:notifications-updated", renderNotifications);

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

    window.__qbOrderPillManaged = true;

    syncOrderPillState();

    pill.addEventListener("click", function () {
        if (pill.classList.contains("is-ready")) {
            return;
        }

        const isExpanded = pill.classList.toggle("expanded");
        pill.setAttribute("aria-expanded", String(isExpanded));
    });

    window.addEventListener("scroll", syncOrderPillState, { passive: true });

    function setShellVisible(isVisible) {
        orderShell.style.display = isVisible ? "" : "none";
    }

    function getTokenText(orderToken) {
        const token = String(orderToken || "").trim();
        return token ? "Token " + token : "Token QB-—";
    }

    function formatItems(items) {
        const list = Array.isArray(items) ? items : [];
        if (!list.length) return "—";
        return list
            .map(function (it) {
                const name = String(it.item_name || "").trim();
                const qty = Number(it.quantity || 0);
                if (!name) return null;
                return name + " x" + (qty > 0 ? qty : 1);
            })
            .filter(Boolean)
            .join(", ");
    }

    function capitalizeStatus(status) {
        const s = String(status || "").trim();
        if (!s) return "—";
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function parseDateLike(value) {
        if (!value) return null;
        if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
        const raw = String(value).trim();
        if (!raw) return null;

        // MySQL timestamps often come as "YYYY-MM-DD HH:MM:SS"
        const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
        const d = new Date(normalized);
        if (!Number.isNaN(d.getTime())) return d;

        const d2 = new Date(raw);
        return Number.isNaN(d2.getTime()) ? null : d2;
    }

    function formatTimeLeft(order) {
        const status = String(order?.status || "").toLowerCase();
        if (status === "ready") return "Now";
        if (status === "completed" || status === "delivered") return "Done";

        const pickup = parseDateLike(order?.pickup_time);
        if (!pickup) return "ASAP";

        const diffMs = pickup.getTime() - Date.now();
        const diffMins = Math.round(diffMs / 60000);
        if (diffMins <= 0) return "Now";
        if (diffMins === 1) return "1 min";
        return diffMins + " mins";
    }

    function setDetailRowValue(container, index, value) {
        const rows = container ? Array.from(container.children || []) : [];
        const row = rows[index];
        if (!row) return;
        const span = row.querySelector("span");
        if (!span) {
            row.textContent = String(value || "—");
            return;
        }
        row.innerHTML = span.outerHTML + " " + String(value || "—");
    }

    function renderOrderIntoPill(order) {
        const tokenEl = pill.querySelector(".token");
        const details = document.getElementById("orderDetails");

        const vendorName = String(order?.vendor_name || "").trim() || "—";
        const itemsText = formatItems(order?.items);
        const status = String(order?.status || "").toLowerCase();

        statusText.textContent = capitalizeStatus(order?.status);
        timeEl.textContent = formatTimeLeft(order);
        if (tokenEl) tokenEl.textContent = getTokenText(order?.token);

        setDetailRowValue(details, 0, vendorName);
        setDetailRowValue(details, 1, itemsText);

        pill.classList.toggle("is-ready", status === "ready");
    }

    function shouldHideForStatus(status) {
        const s = String(status || "").toLowerCase();
        return s === "completed" || s === "delivered";
    }

    let activeOrderId = null;
    let pollTimer = null;
    let refreshTimer = null;

    function stopPolling() {
        if (pollTimer) window.clearInterval(pollTimer);
        if (refreshTimer) window.clearInterval(refreshTimer);
        pollTimer = null;
        refreshTimer = null;
        activeOrderId = null;
    }

    async function refreshActiveOrder() {
        const hasApi = window.QuickBiteApi && typeof window.QuickBiteApi.getMyOrders === "function";
        const token = window.QuickBiteApi && typeof window.QuickBiteApi.getToken === "function" ? window.QuickBiteApi.getToken() : "";
        if (!hasApi || !token) {
            setShellVisible(false);
            stopPolling();
            return;
        }

        try {
            const result = await window.QuickBiteApi.getMyOrders();
            const currentOrders = Array.isArray(result?.currentOrders) ? result.currentOrders : [];
            const active = currentOrders[0] || null;
            if (!active || !active.order_id) {
                setShellVisible(false);
                stopPolling();
                return;
            }

            setShellVisible(true);
            renderOrderIntoPill(active);

            if (String(active.order_id) !== String(activeOrderId)) {
                activeOrderId = String(active.order_id);
            }
        } catch (error) {
            // If request fails, keep the pill hidden to avoid showing stale demo content.
            setShellVisible(false);
            stopPolling();
        }
    }

    async function pollHeartbeat() {
        const orderId = activeOrderId;
        if (!orderId) return;

        try {
            const result = await window.QuickBiteApi.getOrderHeartbeat(orderId);
            const payload = result?.data || result?.order || result;
            if (!payload || !payload.order_id) return;

            renderOrderIntoPill(payload);

            if (shouldHideForStatus(payload.status)) {
                pill.classList.remove("expanded");
                pill.setAttribute("aria-expanded", "false");
                stopPolling();
                setTimeout(function () {
                    setShellVisible(false);
                }, 1200);
            }
        } catch (error) {
            const msg = String(error?.message || "");
            if (msg.toLowerCase().includes("not found")) {
                setShellVisible(false);
                stopPolling();
            }
        }
    }

    // Start hidden until we have a real active order.
    setShellVisible(false);

    // Initial fetch + polling loops.
    refreshActiveOrder().then(function () {
        if (!activeOrderId) return;

        pollHeartbeat();
        pollTimer = window.setInterval(pollHeartbeat, 15000);
        refreshTimer = window.setInterval(refreshActiveOrder, 60000);
    });
}

renderGlobalLayout();
initializeLocationSelector();
initializeAuthSignOut();
initializeNotifications();
initializeUserDropdown();

// Place the location picker appropriately on load and when resizing
relocateLocationPicker();
window.addEventListener('resize', function () {
    relocateLocationPicker();
});

if (document.body.dataset.page !== "home") {
    initializeSharedNavigation();
}

initializeSharedOrderPill();

window.QuickBiteLayout = {
    renderGlobalLayout: renderGlobalLayout,
    refreshAuthUi: refreshAuthUi,
    updateCartCount: updateGlobalCartCount,
    getSelectedLocation: getSelectedLocation
};
