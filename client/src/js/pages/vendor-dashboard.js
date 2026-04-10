document.addEventListener("DOMContentLoaded", function () {
    const session = resolveSessionRole();
    const user = session.user;
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
    hydrateTopbar(profile);
    renderTopSelling();
    initializeTabs();
    initializeFilters(function (nextFilter) {
        activeFilter = nextFilter;
        renderQueue(queue, activeFilter);
    });
    initializeForms(user);

    showSkeletonLoading();
    setTimeout(function () {
        updateMetrics(queue);
        renderQueue(queue, activeFilter);
        showToast("Live queue synced.");
    }, 550);
});

function hydrateTopbar(profile) {
    const name = profile.fullName || "Your stall";
    const safeName = name.length > 36 ? name.slice(0, 33) + "…" : name;
    const initial = name.trim().charAt(0).toUpperCase() || "V";
    const nameEl = document.getElementById("vendorTopbarName");
    const avatarEl = document.getElementById("vendorTopbarAvatar");
    if (nameEl) {
        nameEl.textContent = safeName;
    }
    if (avatarEl) {
        avatarEl.textContent = initial;
    }
    const roleEl = document.getElementById("vendorTopbarRole");
    if (roleEl) {
        roleEl.textContent = "Vendor · QuickBite partner";
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
    document.getElementById("vendorName").textContent = profile.fullName || "Kitchen Dashboard";
    document.getElementById("vendorBusiness").value = profile.fullName || "";
    document.getElementById("vendorEmail").value = profile.email || "";
    document.getElementById("vendorPhone").value = profile.phone || "";
    document.getElementById("vendorPrepTime").value = settings.prepTime || "15 min";
    document.getElementById("vendorStatus").value = settings.status || "open";
    document.getElementById("vendorNotice").value = settings.notice || "";
    document.getElementById("autoAcceptToggle").checked = Boolean(settings.autoAccept);
}

function initializeTabs() {
    document.querySelectorAll(".vendor-nav-btn").forEach(function (button) {
        button.addEventListener("click", function () {
            const tab = button.getAttribute("data-tab");
            document.querySelectorAll(".vendor-nav-btn").forEach(function (btn) {
                btn.classList.toggle("is-active", btn === button);
            });
            document.querySelectorAll(".tab-panel").forEach(function (panel) {
                panel.classList.toggle("is-active", panel.getAttribute("data-panel") === tab);
            });
        });
    });
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
        document.getElementById("vendorName").textContent = nextProfile.fullName || "Kitchen Dashboard";
        hydrateTopbar(nextProfile);
        document.getElementById("avgPrepTime").textContent = nextSettings.prepTime || "15 min";
        showToast("Vendor settings saved.");
    });
}

function showSkeletonLoading() {
    const queueEl = document.getElementById("vendorQueue");
    queueEl.innerHTML = "<div class=\"skeleton\"></div><div class=\"skeleton\"></div><div class=\"skeleton\"></div>";
}

function renderQueue(queue, filter) {
    const container = document.getElementById("vendorQueue");
    const filtered = queue.filter(function (order) {
        if (!filter || filter === "all") {
            return true;
        }
        return normalizeStatus(order.status) === filter;
    });

    const pendingCount = queue.filter(function (order) {
        const status = normalizeStatus(order.status);
        return status === "queued" || status === "preparing";
    }).length;
    document.getElementById("pendingCount").textContent = pendingCount + " pending";

    if (!filtered.length) {
        container.innerHTML = "<div class=\"empty-state\">No orders in this status right now.</div>";
        return;
    }

    container.innerHTML = filtered.map(function (order, idx) {
        const status = normalizeStatus(order.status);
        const statusClass = "status-" + status;
        const eta = order.eta || "N/A";
        const delay = idx * 45;
        return "<div class=\"order-row\" style=\"animation-delay:" + delay + "ms\">" +
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
