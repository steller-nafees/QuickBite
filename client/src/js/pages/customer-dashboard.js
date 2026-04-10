document.addEventListener("DOMContentLoaded", function () {
    const session = resolveSessionRole();
    const user = session.user;
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
    hydrateTopbar(profile);

    initializeTabs();
    initializeFilters(function (filter) {
        activeFilter = filter;
        renderHistory(history, activeFilter, "customerOrderHistory", 100);
    });

    updateCustomerMetrics(history);
    renderHistory(history, "all", "customerRecentOrders", 4);
    renderHistory(history, activeFilter, "customerOrderHistory", 100);

    initializeQuickActions();
    initializeForms(user);

    const searchInput = document.getElementById("customerSearch");
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            renderHistory(history, activeFilter, "customerOrderHistory", 100, searchInput.value);
        });
    }

    const hashTab = (window.location.hash || "").replace(/^#/, "").toLowerCase();
    if (hashTab === "orders" || hashTab === "settings" || hashTab === "overview") {
        activateTab(hashTab);
    }
});

function hydrateProfile(profile, prefs) {
    document.getElementById("customerName").textContent = "Welcome back, " + (profile.fullName || "Customer");
    document.getElementById("customerHeroEmail").textContent = profile.email || "Add your email and preferences to complete your setup.";

    document.getElementById("customerFullName").value = profile.fullName || "";
    document.getElementById("customerEmail").value = profile.email || "";
    document.getElementById("customerPhone").value = profile.phone || "";

    document.getElementById("customerPickup").value = prefs.pickupLocation || "NSU Main Canteen";
    document.getElementById("customerDiet").value = prefs.dietaryPreference || "";
    document.getElementById("customerNotes").value = prefs.notes || "";
}

function hydrateTopbar(profile) {
    const name = profile.fullName || "Customer";
    const safeName = name.length > 30 ? name.slice(0, 27) + "…" : name;
    const initial = getInitials(name);

    const nameEl = document.getElementById("customerTopbarName");
    const avatarEl = document.getElementById("customerTopbarAvatar");

    if (nameEl) {
        nameEl.textContent = safeName;
    }

    if (avatarEl) {
        avatarEl.textContent = initial;
    }
}

function initializeQuickActions() {
    const jumpOrders = document.getElementById("heroJumpOrders");
    if (jumpOrders) {
        jumpOrders.addEventListener("click", function () {
            activateTab("orders");
            history.replaceState(null, "", "customer-dashboard.html#orders");
        });
    }

    document.querySelectorAll("[data-tab-jump]").forEach(function (button) {
        button.addEventListener("click", function () {
            const tab = button.getAttribute("data-tab-jump");
            if (tab) {
                activateTab(tab);
                history.replaceState(null, "", "customer-dashboard.html#" + tab);
            }
        });
    });
}

function initializeTabs() {
    document.querySelectorAll(".vendor-nav-btn").forEach(function (button) {
        button.addEventListener("click", function () {
            const tab = button.getAttribute("data-tab");
            if (!tab) {
                return;
            }
            activateTab(tab);
            history.replaceState(null, "", "customer-dashboard.html#" + tab);
        });
    });
}

function activateTab(tabName) {
    document.querySelectorAll(".vendor-nav-btn").forEach(function (btn) {
        btn.classList.toggle("is-active", btn.getAttribute("data-tab") === tabName);
    });

    document.querySelectorAll(".tab-panel").forEach(function (panel) {
        panel.classList.toggle("is-active", panel.getAttribute("data-panel") === tabName);
    });
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

        document.getElementById("customerName").textContent = "Welcome back, " + (nextProfile.fullName || "Customer");
        document.getElementById("customerHeroEmail").textContent = nextProfile.email || "Add your email and preferences to complete your setup.";
        hydrateTopbar(nextProfile);

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
        const delay = idx * 35;

        return "<div class=\"order-row\" style=\"animation-delay:" + delay + "ms\">" +
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
    const existing = document.querySelector(".notification");
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(function () {
        notification.style.transform = "translateX(0)";
    }, 30);

    setTimeout(function () {
        notification.style.transform = "translateX(120%)";
        setTimeout(function () {
            notification.remove();
        }, 260);
    }, 2200);
}
