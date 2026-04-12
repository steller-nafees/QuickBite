document.addEventListener("DOMContentLoaded", function () {
    // Auth guard - check if user is logged in
    const user = getUser();
    if (!user || !user.email) {
        // Not logged in, redirect to home page
        window.location.replace("index.html");
        return;
    }

    const session = resolveSessionRole();
    const role = session.role;

    if (role === "vendor") {
        window.location.replace("vendor-dashboard.html");
        return;
    }

    const profile = getCustomerProfile(user);
    const prefs = parseLocalStorageJson("quickbite-saved-info") || {};
    const history = parseLocalStorageJson("quickbite-order-history") || [];
    let activeFilter = "all";

    hydrateProfile(profile, prefs);
    hydrateSidebar(profile);
    startClock();
    initializeNotifications();

    initializeNavigation();
    initializeFilters(function (filter) {
        activeFilter = filter;
        renderHistory(history, activeFilter, "customerOrderHistory", 100);
    });

    updateCustomerMetrics(history);
    renderRecentOrders(history);
    renderHistory(history, activeFilter, "customerOrderHistory", 100);

    initializeForms(user);
    initializeSearch(history);
    initializeLogout();

    const hashPage = (window.location.hash || "").replace(/^#/, "").toLowerCase();
    if (hashPage === "orders" || hashPage === "settings") {
        navigateTo(hashPage);
    }
});

function hydrateProfile(profile, prefs) {
    document.getElementById("customerWelcome").textContent = "Welcome back, " + (profile.fullName || "Customer");
    document.getElementById("customerSubtitle").textContent = profile.email || "Track recent orders, review status, and keep your profile details updated.";

    document.getElementById("customerFullName").value = profile.fullName || "";
    document.getElementById("customerEmail").value = profile.email || "";
    document.getElementById("customerPhone").value = profile.phone || "";

    document.getElementById("customerPickup").value = prefs.pickupLocation || "NSU Main Canteen";
    document.getElementById("customerDiet").value = prefs.dietaryPreference || "";
    document.getElementById("customerNotes").value = prefs.notes || "";
}

function hydrateSidebar(profile) {
    const name = profile.fullName || "Customer";
    const safeName = name.length > 30 ? name.slice(0, 27) + "…" : name;
    const initial = getInitials(name);

    const nameEl = document.getElementById("customerSidebarName");
    const avatarEl = document.getElementById("customerSidebarAvatar");

    if (nameEl) {
        nameEl.textContent = safeName;
    }

    if (avatarEl) {
        avatarEl.textContent = initial;
    }
}

function initializeNavigation() {
    document.querySelectorAll(".nav-item").forEach(function (navItem) {
        navItem.addEventListener("click", function () {
            const page = navItem.getAttribute("data-page");
            if (!page) return;
            navigateTo(page);
        });
    });

    document.querySelectorAll("[data-nav]").forEach(function (btn) {
        btn.addEventListener("click", function () {
            const page = btn.getAttribute("data-nav");
            if (page) navigateTo(page);
        });
    });

    const sidebarToggle = document.getElementById("sidebarToggle");
    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", function () {
            document.getElementById("sidebar").classList.toggle("mobile-open");
        });
    }
}

function navigateTo(pageName) {
    document.querySelectorAll(".nav-item").forEach(function (navItem) {
        navItem.classList.toggle("active", navItem.getAttribute("data-page") === pageName);
    });

    document.querySelectorAll(".page").forEach(function (page) {
        page.classList.toggle("active", page.getAttribute("id") === "page-" + pageName);
    });

    const titles = {
        overview: "Overview",
        orders: "My Orders",
        settings: "Settings"
    };

    const topbarTitle = document.getElementById("topbarTitle");
    if (topbarTitle) {
        topbarTitle.textContent = titles[pageName] || "Overview";
    }

    window.location.hash = pageName === "overview" ? "" : pageName;
}

function initializeFilters(onChange) {
    const strip = document.getElementById("customerOrderFilters");
    if (!strip) {
        return;
    }

    strip.addEventListener("click", function (event) {
        const button = event.target.closest(".filter-btn");
        if (!button) {
            return;
        }

        strip.querySelectorAll(".filter-btn").forEach(function (btn) {
            btn.classList.toggle("is-active", btn === button);
        });

        onChange(button.getAttribute("data-filter") || "all");
    });
}

function initializeForms(user) {
    document.getElementById("customerProfileForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const nextProfile = {
            fullName: document.getElementById("customerFullName").value.trim(),
            email: document.getElementById("customerEmail").value.trim(),
            phone: document.getElementById("customerPhone").value.trim(),
            role: "customer"
        };

        localStorage.setItem("quickbite-profile", JSON.stringify(nextProfile));
        localStorage.setItem("quickbite-auth-user", JSON.stringify({ ...user, ...nextProfile }));

        document.getElementById("customerWelcome").textContent = "Welcome back, " + (nextProfile.fullName || "Customer");
        document.getElementById("customerSubtitle").textContent = nextProfile.email || "Track recent orders, review status, and keep your profile details updated.";
        hydrateSidebar(nextProfile);

        showToast("Customer profile updated.");
    });

    document.getElementById("customerPrefsForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const nextPrefs = {
            pickupLocation: document.getElementById("customerPickup").value,
            dietaryPreference: document.getElementById("customerDiet").value.trim(),
            notes: document.getElementById("customerNotes").value.trim()
        };

        localStorage.setItem("quickbite-saved-info", JSON.stringify(nextPrefs));
        showToast("Preferences saved.");
    });
}

function initializeSearch(history) {
    const searchInput = document.getElementById("orderSearch");
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            renderHistory(history, activeFilter, "customerOrderHistory", 100, searchInput.value);
        });
    }
}

function renderRecentOrders(history) {
    const container = document.getElementById("customerRecentOrders");
    if (!container) return;

    const recent = history.slice(0, 4);
    if (!recent.length) {
        container.innerHTML = "<div class=\"empty-state\">No orders yet. Browse the menu to place your first order!</div>";
        return;
    }

    container.innerHTML = recent.map(function (order, idx) {
        const id = order.id || order.orderId || "N/A";
        const vendor = order.vendor || "QuickBite Vendor";
        const date = order.date || "Date unavailable";
        const items = order.items || "Item details unavailable";
        const total = typeof order.total === "number" ? formatCurrency(order.total) : "N/A";
        const status = normalizeStatus(order.status);
        const statusClass = "status-" + status;

        return "<div class=\"order-row\">" +
            "<div class=\"order-row-body\">" +
            "<div class=\"order-main\">" +
            "<strong>#" + escapeHtml(String(id)) + " · " + escapeHtml(String(vendor)) + "</strong>" +
            "<span class=\"order-kicker\">" + escapeHtml(String(date)) + "</span>" +
            "</div>" +
            "<small class=\"order-items-line\">" + escapeHtml(String(items)) + "</small>" +
            "</div>" +
            "<div class=\"order-row-aside\">" +
            "<span class=\"status-badge " + statusClass + "\">" + escapeHtml(capitalize(status)) + "</span>" +
            "<strong class=\"customer-order-total\">" + escapeHtml(String(total)) + "</strong>" +
            "</div>" +
            "</div>";
    }).join("");
}

function renderHistory(history, filter, containerId, limit, searchTerm) {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    const query = String(searchTerm || "").trim().toLowerCase();
    const filtered = history.filter(function (order) {
        const status = normalizeStatus(order.status);
        const matchesFilter = !filter || filter === "all" ? true : status === filter;
        if (!matchesFilter) {
            return false;
        }

        if (!query) {
            return true;
        }

        const joined = [
            order.id,
            order.orderId,
            order.vendor,
            order.date,
            order.items,
            status
        ].join(" ").toLowerCase();

        return joined.indexOf(query) !== -1;
    });

    const visible = filtered.slice(0, Math.max(1, limit || 8));
    if (!visible.length) {
        container.innerHTML = "<div class=\"empty-state\">No orders found for this view.</div>";
        return;
    }

    container.innerHTML = visible.map(function (order, idx) {
        const id = order.id || order.orderId || "N/A";
        const vendor = order.vendor || "QuickBite Vendor";
        const date = order.date || "Date unavailable";
        const items = order.items || "Item details unavailable";
        const total = typeof order.total === "number" ? formatCurrency(order.total) : "N/A";
        const status = normalizeStatus(order.status);
        const statusClass = "status-" + status;

        return "<div class=\"order-row\">" +
            "<div class=\"order-row-body\">" +
            "<div class=\"order-main\">" +
            "<strong>#" + escapeHtml(String(id)) + " · " + escapeHtml(String(vendor)) + "</strong>" +
            "<span class=\"order-kicker\">" + escapeHtml(String(date)) + "</span>" +
            "</div>" +
            "<small class=\"order-items-line\">" + escapeHtml(String(items)) + "</small>" +
            "</div>" +
            "<div class=\"order-row-aside\">" +
            "<span class=\"status-badge " + statusClass + "\">" + escapeHtml(capitalize(status)) + "</span>" +
            "<strong class=\"customer-order-total\">" + escapeHtml(String(total)) + "</strong>" +
            "</div>" +
            "</div>";
    }).join("");
}

function updateCustomerMetrics(history) {
    const total = history.length;
    const completed = history.filter(function (order) {
        return normalizeStatus(order.status) === "completed";
    }).length;
    const pending = history.filter(function (order) {
        const status = normalizeStatus(order.status);
        return status === "pending" || status === "preparing";
    }).length;

    animateCounter("customerMetricOrders", total);
    animateCounter("customerMetricCompleted", completed);
    animateCounter("customerMetricPending", pending);
}

function animateCounter(id, target) {
    const element = document.getElementById(id);
    if (!element) {
        return;
    }

    const duration = 700;
    const startTime = performance.now();

    function frame(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const value = Math.floor(target * progress);
        element.textContent = String(value);
        if (progress < 1) {
            requestAnimationFrame(frame);
        } else {
            element.textContent = String(target);
        }
    }

    requestAnimationFrame(frame);
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem("quickbite-auth-user")) || {};
    } catch (error) {
        return {};
    }
}

function initializeLogout() {
    const logoutBtn = document.getElementById("customerLogoutBtn");
    if (!logoutBtn) return;
    
    logoutBtn.addEventListener("click", function() {
        // Clear authentication data
        localStorage.removeItem("quickbite-auth-user");
        localStorage.removeItem("quickbite-profile");
        
        // Redirect to home page
        window.location.href = "index.html";
    });
}

function resolveSessionRole() {
    const user = getUser();
    let role = String(user.role || "").toLowerCase();
    if (role === "vendor" || role === "customer") {
        return { user: user, role: role };
    }

    const profile = parseLocalStorageJson("quickbite-profile");
    const fromProfile = profile && String(profile.role || "").toLowerCase();
    if (fromProfile === "vendor" || fromProfile === "customer") {
        const merged = { ...user, ...profile, role: fromProfile };
        localStorage.setItem("quickbite-auth-user", JSON.stringify(merged));
        return { user: merged, role: fromProfile };
    }

    return { user: user, role: "customer" };
}

function getCustomerProfile(user) {
    const saved = parseLocalStorageJson("quickbite-profile");
    if (saved && (saved.role || "customer") === "customer") {
        return saved;
    }

    return {
        fullName: user.fullName || user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: "customer"
    };
}

function parseLocalStorageJson(key) {
    try {
        return JSON.parse(localStorage.getItem(key));
    } catch (error) {
        return null;
    }
}

function normalizeStatus(status) {
    const value = String(status || "completed").toLowerCase();
    if (value.indexOf("pend") !== -1 || value.indexOf("queue") !== -1) {
        return "pending";
    }
    if (value.indexOf("prep") !== -1) {
        return "preparing";
    }
    if (value.indexOf("cancel") !== -1) {
        return "cancelled";
    }
    if (value.indexOf("complete") !== -1 || value.indexOf("delivered") !== -1 || value.indexOf("ready") !== -1) {
        return "completed";
    }
    return "pending";
}

function getInitials(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) {
        return "C";
    }
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-BD", {
        style: "currency",
        currency: "BDT",
        maximumFractionDigits: 0
    }).format(amount);
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function capitalize(value) {
    if (!value) {
        return "";
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function showToast(message) {
    const toast = document.getElementById("toast");
    const toastMsg = document.getElementById("toastMsg");
    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    toast.classList.add("show");

    setTimeout(function () {
        toast.classList.remove("show");
    }, 2400);
}

function startClock() {
    const clockEl = document.getElementById("clockEl");
    if (!clockEl) return;

    function updateClock() {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    }

    updateClock();
    setInterval(updateClock, 1000);
}

/* ============================================================
   NOTIFICATIONS
   ============================================================ */
function initializeNotifications() {
    var notifications = [
        { id: 1, type: 'success', title: 'Order Confirmed', desc: 'Your order #QB-1825 has been confirmed', time: Date.now() - 300000, read: false },
        { id: 2, type: 'order', title: 'Order Preparing', desc: 'Order #QB-1824 is being prepared', time: Date.now() - 900000, read: false },
        { id: 3, type: 'warning', title: 'Delivery Update', desc: 'Your order #QB-1823 will arrive in 10 minutes', time: Date.now() - 1800000, read: true }
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
        var dot = document.getElementById('notifDot');
        
        if (!notifications.length) {
            list.innerHTML = '<div class="notif-empty"><i class="fas fa-bell-slash"></i>No notifications yet</div>';
            if (dot) dot.style.display = 'none';
            return;
        }

        var unreadCount = notifications.filter(function(n) { return !n.read; }).length;
        if (dot) dot.style.display = unreadCount > 0 ? 'block' : 'none';

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
        showToast('All notifications cleared');
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
        var btn = document.getElementById('notifBtn');
        if (panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) {
            panel.classList.remove('open');
        }
    });

    // Initial render
    renderNotifications();
}
