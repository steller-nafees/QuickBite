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
    
    if (role !== "vendor") {
        window.location.replace("customer-dashboard.html");
        return;
    }

    const profile = getVendorProfile(user);
    const settings = parseLocalStorageJson("quickbite-vendor-settings") || {};
    const queue = parseLocalStorageJson("quickbite-vendor-queue") || getFallbackQueue();
    let activeFilter = "all";

    hydrateProfile(profile, settings);
    hydrateSidebar(profile);
    startClock();
    initializeNotifications();

    initializeNavigation();
    initializeFilters(function (nextFilter) {
        activeFilter = nextFilter;
        renderQueue(queue, activeFilter);
    });
    initializeForms(user);

    updateMetrics(queue);
    renderRecentOrders(queue);
    renderQueue(queue, activeFilter);

    initializeSearch(queue);
    initializeLogout();

    showToast("Dashboard loaded.");
});

function hydrateSidebar(profile) {
    const name = profile.fullName || "Your stall";
    const safeName = name.length > 36 ? name.slice(0, 33) + "…" : name;
    const initial = name.trim().charAt(0).toUpperCase() || "V";
    const nameEl = document.getElementById("vendorSidebarName");
    const avatarEl = document.getElementById("vendorSidebarAvatar");
    if (nameEl) {
        nameEl.textContent = safeName;
    }
    if (avatarEl) {
        avatarEl.textContent = initial;
    }
}

function renderTopSelling() {
    const list = document.getElementById("vendorTopSelling");
    if (!list) {
        return;
    }
    const items = [
        { name: "Chicken Biriyani", sub: "NSU Main Canteen", price: "৳220", emoji: "🍛" },
        { name: "Beef Tehari", sub: "Campus favorite", price: "৳200", emoji: "🍚" },
        { name: "Fried Rice Combo", sub: "Student meal", price: "৳180", emoji: "🍜" },
        { name: "Cold Coffee", sub: "Beverages", price: "৳90", emoji: "☕" }
    ];
    list.innerHTML = items.map(function (item) {
        return "<li class=\"vendor-selling-item\">" +
            "<span class=\"vendor-selling-thumb\" aria-hidden=\"true\">" + item.emoji + "</span>" +
            "<div class=\"vendor-selling-meta\">" +
            "<strong>" + escapeHtml(item.name) + "</strong>" +
            "<span>" + escapeHtml(item.sub) + "</span>" +
            "</div>" +
            "<span class=\"vendor-selling-price\">" + escapeHtml(item.price) + "</span>" +
            "</li>";
    }).join("");
}

function hydrateProfile(profile, settings) {
    document.getElementById("vendorWelcome").textContent = profile.fullName || "Kitchen Dashboard";
    document.getElementById("vendorBusiness").value = profile.fullName || "";
    document.getElementById("vendorEmail").value = profile.email || "";
    document.getElementById("vendorPhone").value = profile.phone || "";
    document.getElementById("vendorPrepTime").value = settings.prepTime || "15 min";
    document.getElementById("vendorStatus").value = settings.status || "open";
    document.getElementById("vendorNotice").value = settings.notice || "";
    document.getElementById("autoAcceptToggle").checked = Boolean(settings.autoAccept);
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
        overview: "Dashboard",
        orders: "Orders",
        settings: "Settings"
    };

    const topbarTitle = document.getElementById("topbarTitle");
    if (topbarTitle) {
        topbarTitle.textContent = titles[pageName] || "Dashboard";
    }

    window.location.hash = pageName === "overview" ? "" : pageName;
}

function initializeFilters(onChange) {
    const strip = document.getElementById("vendorOrderFilters");
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
    document.getElementById("vendorProfileForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const nextProfile = {
            fullName: document.getElementById("vendorBusiness").value.trim(),
            email: document.getElementById("vendorEmail").value.trim(),
            phone: document.getElementById("vendorPhone").value.trim(),
            role: "vendor"
        };

        const nextSettings = {
            prepTime: document.getElementById("vendorPrepTime").value.trim(),
            status: document.getElementById("vendorStatus").value,
            notice: document.getElementById("vendorNotice").value.trim(),
            autoAccept: document.getElementById("autoAcceptToggle").checked
        };

        localStorage.setItem("quickbite-profile", JSON.stringify(nextProfile));
        localStorage.setItem("quickbite-auth-user", JSON.stringify({ ...user, ...nextProfile }));
        localStorage.setItem("quickbite-vendor-settings", JSON.stringify(nextSettings));
        document.getElementById("vendorWelcome").textContent = nextProfile.fullName || "Kitchen Dashboard";
        hydrateSidebar(nextProfile);
        showToast("Vendor settings saved.");
    });
}

function initializeSearch(queue) {
    const searchInput = document.getElementById("orderSearch");
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            renderQueue(queue, activeFilter, searchInput.value);
        });
    }
}

function renderRecentOrders(queue) {
    const container = document.getElementById("vendorRecentOrders");
    if (!container) return;

    const recent = queue.slice(0, 4);
    if (!recent.length) {
        container.innerHTML = "<div class=\"empty-state\">No orders yet.</div>";
        return;
    }

    container.innerHTML = recent.map(function (order) {
        const status = normalizeStatus(order.status);
        const statusClass = "status-" + status;
        const eta = order.eta || "N/A";

        return "<div class=\"order-row\">" +
            "<div class=\"order-row-body\">" +
            "<div class=\"order-main\">" +
            "<strong>" + escapeHtml(String(order.orderId)) + "</strong>" +
            "<span class=\"order-kicker\">" + escapeHtml(String(eta)) + "</span>" +
            "</div>" +
            "<small class=\"order-items-line\">" + escapeHtml(String(order.items)) + "</small>" +
            "</div>" +
            "<div class=\"order-row-aside\">" +
            "<span class=\"status-badge " + statusClass + "\">" + capitalize(status) + "</span>" +
            "</div>" +
            "</div>";
    }).join("");
}

function showSkeletonLoading() {
    const queueEl = document.getElementById("vendorQueue");
    queueEl.innerHTML = "<div class=\"skeleton\"></div><div class=\"skeleton\"></div><div class=\"skeleton\"></div>";
}

function renderQueue(queue, filter, searchTerm) {
    const container = document.getElementById("vendorQueue");
    const query = String(searchTerm || "").trim().toLowerCase();
    
    const filtered = queue.filter(function (order) {
        const status = normalizeStatus(order.status);
        const matchesFilter = !filter || filter === "all" ? true : status === filter;
        if (!matchesFilter) return false;

        if (!query) return true;

        const joined = [order.orderId, order.items, status].join(" ").toLowerCase();
        return joined.indexOf(query) !== -1;
    });

    const pendingCount = queue.filter(function (order) {
        const status = normalizeStatus(order.status);
        return status === "queued" || status === "preparing";
    }).length;
    
    const badgeEl = document.getElementById("pendingBadge");
    if (badgeEl) badgeEl.textContent = pendingCount;
    
    const countEl = document.getElementById("pendingCount");
    if (countEl) countEl.textContent = pendingCount + " pending";

    if (!filtered.length) {
        container.innerHTML = "<div class=\"empty-state\">No orders in this status right now.</div>";
        return;
    }

    container.innerHTML = filtered.map(function (order) {
        const status = normalizeStatus(order.status);
        const statusClass = "status-" + status;
        const eta = order.eta || "N/A";
        return "<div class=\"order-row\">" +
            "<div class=\"order-row-body\">" +
            "<div class=\"order-main\">" +
            "<strong>" + escapeHtml(String(order.orderId)) + "</strong>" +
            "<span class=\"order-kicker\">" + escapeHtml(String(eta)) + "</span>" +
            "</div>" +
            "<small class=\"order-items-line\">" + escapeHtml(String(order.items)) + "</small>" +
            "</div>" +
            "<div class=\"order-row-aside\">" +
            "<span class=\"status-badge " + statusClass + "\">" + capitalize(status) + "</span>" +
            "</div>" +
            "</div>";
    }).join("");
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function updateMetrics(queue) {
    const total = queue.length;
    const preparing = queue.filter(function (order) {
        return normalizeStatus(order.status) === "preparing";
    }).length;
    const ready = queue.filter(function (order) {
        return normalizeStatus(order.status) === "ready";
    }).length;
    const completed = queue.filter(function (order) {
        return normalizeStatus(order.status) === "completed";
    }).length;

    animateCounter("vendorMetricTotal", total);
    animateCounter("vendorMetricPreparing", preparing);
    animateCounter("vendorMetricReady", ready);
    animateCounter("vendorMetricCompleted", completed);
}

function animateCounter(id, target) {
    const element = document.getElementById(id);
    const start = 0;
    const duration = 700;
    const startTime = performance.now();

    function frame(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const value = Math.floor(start + (target - start) * progress);
        element.textContent = String(value);
        if (progress < 1) {
            requestAnimationFrame(frame);
        } else {
            element.textContent = String(target);
        }
    }

    requestAnimationFrame(frame);
}

function getFallbackQueue() {
    return [
        { orderId: "QB-1821", items: "2x Pasta Alfredo, 1x Cola", status: "Preparing", eta: "8 min" },
        { orderId: "QB-1822", items: "1x Chicken Bowl", status: "Queued", eta: "12 min" },
        { orderId: "QB-1823", items: "3x Club Sandwich", status: "Ready", eta: "Now" },
        { orderId: "QB-1820", items: "1x Thai Soup, 1x Salad", status: "Completed", eta: "Picked up" }
    ];
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem("quickbite-auth-user")) || {};
    } catch (error) {
        return {};
    }
}

function initializeLogout() {
    const logoutBtn = document.getElementById("vendorLogoutBtn");
    if (!logoutBtn) return;
    
    logoutBtn.addEventListener("click", function() {
        // Clear authentication data
        localStorage.removeItem("quickbite-auth-user");
        localStorage.removeItem("quickbite-profile");
        
        // Redirect to home page
        window.location.href = "index.html";
    });
}

/**
 * Prefer role on quickbite-auth-user; if missing, recover from quickbite-profile
 * and write back so the session matches server-side role after login/register.
 */
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

function getVendorProfile(user) {
    const saved = parseLocalStorageJson("quickbite-profile");
    if (saved && (saved.role || "") === "vendor") {
        return saved;
    }
    return {
        fullName: user.fullName || user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: "vendor"
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
    const value = String(status || "").toLowerCase();
    if (value.indexOf("queue") !== -1 || value.indexOf("pend") !== -1) {
        return "queued";
    }
    if (value.indexOf("prep") !== -1 || value.indexOf("cook") !== -1) {
        return "preparing";
    }
    if (value.indexOf("ready") !== -1) {
        return "ready";
    }
    return "completed";
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
        { id: 1, type: 'order', title: 'New Order Received', desc: 'Order #QB-1825 - 2x Pasta Alfredo, 1x Cola', time: Date.now() - 300000, read: false },
        { id: 2, type: 'order', title: 'New Order Received', desc: 'Order #QB-1824 - 1x Chicken Bowl', time: Date.now() - 900000, read: false },
        { id: 3, type: 'success', title: 'Order Completed', desc: 'Order #QB-1823 has been picked up', time: Date.now() - 1800000, read: true }
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
