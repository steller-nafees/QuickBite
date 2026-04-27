/* ============================================================
   QuickBite Admin Dashboard — admin-dashboard.js
   Vanilla JS (no external UI libs)
   ============================================================ */

"use strict";

const $ = (id) => document.getElementById(id);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const ORDER_STATUSES = ["pending", "preparing", "completed"];
const PAYMENT_METHODS = ["card", "wallet", "cash"];
const PAYMENT_STATUSES = ["pending", "completed", "failed"];
const DASHBOARD_POLL_MS = 15000;
const VENDOR_ORDER_CACHE_KEY = "quickbite-vendor-order-cache";

function notify(message, type) {
  if (typeof window.showToast === "function") {
    window.showToast(message, type === "err" ? "error" : type === "success" ? "success" : "info");
    return;
  }
  window.alert(message);
}

function addPanelNotification(notification) {
  if (window.QuickBiteNotificationCenter && typeof window.QuickBiteNotificationCenter.add === "function") {
    window.QuickBiteNotificationCenter.add(notification);
  }
}

function uid(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function money(amount) {
  const n = Number(amount || 0);
  return "৳" + n.toFixed(0);
}

function fmt(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function todayKey(d) {
  const x = new Date(d);
  const p = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function readStoredVendorOrderCache() {
  try {
    const raw = localStorage.getItem(VENDOR_ORDER_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function writeStoredVendorOrderCache(cache) {
  try {
    localStorage.setItem(VENDOR_ORDER_CACHE_KEY, JSON.stringify(cache || {}));
  } catch (error) {
    // ignore
  }
}

function getVendorCacheScope() {
  return state.isVendorSession && state.sessionVendorId ? String(state.sessionVendorId) : "admin";
}

function toScopedOrderSnapshot(orders) {
  return (orders || []).reduce((map, order) => {
    if (!order || !order.order_id) return map;
    map[order.order_id] = {
      order_id: order.order_id,
      vendor_id: order.vendor_id || "",
      customer_name: order.customer_name || "",
      total_amount: Number(order.total_amount || 0),
      status: String(order.status || "").toLowerCase(),
    };
    return map;
  }, {});
}

function formatNewOrderMessage(order) {
  const customerLabel = order.customer_name ? ` from ${order.customer_name}` : "";
  return `New order ${order.order_id}${customerLabel} for ${money(order.total_amount)}.`;
}

function formatCustomerStatusMessage(order, status) {
  const orderLabel = order.token || order.order_id || "Your order";
  const vendorName = order.vendor_name ? ` from ${order.vendor_name}` : "";
  if (status === "preparing") return `${orderLabel}${vendorName} is now being prepared.`;
  if (status === "completed") return `${orderLabel}${vendorName} has been completed.`;
  if (status === "pending") return `${orderLabel}${vendorName} has been received.`;
  return `${orderLabel}${vendorName} was updated to ${status}.`;
}

function normalizeOrderStatus(status) {
  const normalized = String(status || "pending").toLowerCase();
  if (normalized === "ready" || normalized === "delivered") return "completed";
  const all = [...ORDER_STATUSES, "cancelled"];
  return all.includes(normalized) ? normalized : "pending";
}

function updateAdminProfileMenu() {
  const user = state.sessionUser || {};
  const fullName = String(user.fullName || user.name || (state.isVendorSession ? userName(state.sessionVendorId) : "Admin") || "Admin").trim();
  const firstName = fullName.split(/\s+/)[0] || fullName;
  const avatar = fullName.charAt(0).toUpperCase() || "A";
  if ($("adminProfileFirstName")) $("adminProfileFirstName").textContent = firstName;
  if ($("adminProfileAvatar")) $("adminProfileAvatar").textContent = avatar;
  if ($("adminProfileBtn")) $("adminProfileBtn").setAttribute("aria-label", fullName);
}

function seedData() {
  const users = [
    { user_id: "u_admin_01", name: "Admin", role: "admin" },
    { user_id: "u_cus_01", name: "Ayesha Rahman", role: "customer" },
    { user_id: "u_cus_02", name: "Tanvir Hasan", role: "customer" },
    { user_id: "u_cus_03", name: "Nusrat Jahan", role: "customer" },
    { user_id: "u_ven_01", name: "Burger Hub", role: "vendor" },
    { user_id: "u_ven_02", name: "The Pasta Corner", role: "vendor" },
    { user_id: "u_ven_03", name: "Sushi Express", role: "vendor" },
  ];

  const foods = [
    { food_id: "f_101", vendor_id: "u_ven_01", name: "Classic Chicken Burger", category: "Burger", price: 180, is_available: true, description: "Juicy chicken patty, lettuce, and house sauce.", image: "" },
    { food_id: "f_102", vendor_id: "u_ven_01", name: "Spicy Beef Burger", category: "Burger", price: 220, is_available: true, description: "Beef patty with a spicy kick.", image: "" },
    { food_id: "f_201", vendor_id: "u_ven_02", name: "Creamy Alfredo Pasta", category: "Pasta", price: 250, is_available: true, description: "Creamy sauce, garlic, parmesan.", image: "" },
    { food_id: "f_202", vendor_id: "u_ven_02", name: "Arrabbiata Pasta", category: "Pasta", price: 230, is_available: false, description: "Tomato chili sauce, basil.", image: "" },
    { food_id: "f_301", vendor_id: "u_ven_03", name: "Salmon Sushi Set", category: "Sushi", price: 320, is_available: true, description: "Fresh salmon nigiri set.", image: "" },
    { food_id: "f_302", vendor_id: "u_ven_03", name: "Chicken Katsu Roll", category: "Sushi", price: 280, is_available: true, description: "Crispy katsu, mayo, sesame.", image: "" },
  ];

  const now = Date.now();
  const orders = [
    { order_id: "o_9001", customer_id: "u_cus_01", vendor_id: "u_ven_01", total_amount: 400, status: "pending", created_at: new Date(now - 12 * 60e3).toISOString(), pickup_time: new Date(now + 18 * 60e3).toISOString() },
    { order_id: "o_9002", customer_id: "u_cus_02", vendor_id: "u_ven_02", total_amount: 250, status: "preparing", created_at: new Date(now - 30 * 60e3).toISOString(), pickup_time: new Date(now + 10 * 60e3).toISOString() },
    { order_id: "o_9003", customer_id: "u_cus_03", vendor_id: "u_ven_03", total_amount: 600, status: "preparing", created_at: new Date(now - 45 * 60e3).toISOString(), pickup_time: new Date(now + 5 * 60e3).toISOString() },
    { order_id: "o_9004", customer_id: "u_cus_01", vendor_id: "u_ven_03", total_amount: 280, status: "completed", created_at: new Date(now - 2.8 * 3600e3).toISOString(), pickup_time: new Date(now - 2.2 * 3600e3).toISOString() },
    { order_id: "o_9005", customer_id: "u_cus_02", vendor_id: "u_ven_01", total_amount: 220, status: "completed", created_at: new Date(now - 5.5 * 3600e3).toISOString(), pickup_time: new Date(now - 5.0 * 3600e3).toISOString() },
  ];

  const orderItems = [
    { order_item_id: "oi_1", order_id: "o_9001", food_id: "f_101", item_name: "Classic Chicken Burger", quantity: 1, unit_price: 180, total_price: 180 },
    { order_item_id: "oi_2", order_id: "o_9001", food_id: "f_102", item_name: "Spicy Beef Burger", quantity: 1, unit_price: 220, total_price: 220 },
    { order_item_id: "oi_3", order_id: "o_9002", food_id: "f_201", item_name: "Creamy Alfredo Pasta", quantity: 1, unit_price: 250, total_price: 250 },
    { order_item_id: "oi_4", order_id: "o_9003", food_id: "f_301", item_name: "Salmon Sushi Set", quantity: 1, unit_price: 320, total_price: 320 },
    { order_item_id: "oi_5", order_id: "o_9003", food_id: "f_302", item_name: "Chicken Katsu Roll", quantity: 1, unit_price: 280, total_price: 280 },
    { order_item_id: "oi_6", order_id: "o_9004", food_id: "f_302", item_name: "Chicken Katsu Roll", quantity: 1, unit_price: 280, total_price: 280 },
    { order_item_id: "oi_7", order_id: "o_9005", food_id: "f_102", item_name: "Spicy Beef Burger", quantity: 1, unit_price: 220, total_price: 220 },
  ];

  const payments = [
    { payment_id: "p_7001", order_id: "o_9001", method: "wallet", status: "pending", amount: 400, paid_at: null },
    { payment_id: "p_7002", order_id: "o_9002", method: "card", status: "completed", amount: 250, paid_at: new Date(now - 28 * 60e3).toISOString() },
    { payment_id: "p_7003", order_id: "o_9003", method: "cash", status: "pending", amount: 600, paid_at: null },
    { payment_id: "p_7004", order_id: "o_9004", method: "wallet", status: "completed", amount: 280, paid_at: new Date(now - 2.7 * 3600e3).toISOString() },
    { payment_id: "p_7005", order_id: "o_9005", method: "card", status: "completed", amount: 220, paid_at: new Date(now - 5.4 * 3600e3).toISOString() },
  ];

  return { users, foods, orders, orderItems, payments };
}

const state = {
  view: "overview",
  search: "",
  orderTab: "All",
  expandedRecentOrderId: null,
  menuQuery: "",
  menuVendor: "",
  menuCategory: "",
  editingFoodId: null,
  sessionUser: null,
  sessionVendorId: null,
  isVendorSession: false,
  liveTimer: null,
  profileDeleteBusy: false,
  ...seedData(),
};

function getSessionUser() {
  try {
    return JSON.parse(localStorage.getItem("quickbite-auth-user") || "null");
  } catch {
    return null;
  }
}

function normalizeId(id) {
  if (id === null || id === undefined) return "";
  return String(id);
}

function userName(id) {
  const u = state.users.find((x) => x.user_id === id);
  return u ? u.name : id;
}

function getOrderItems(order) {
  if (order && Array.isArray(order.items) && order.items.length) {
    return order.items;
  }
  return state.orderItems.filter((it) => it.order_id === order.order_id);
}

function signOut() {
  try {
    localStorage.removeItem("quickbite-auth-user");
    localStorage.removeItem("quickbite-profile");
    localStorage.removeItem("quickbite-auth-token");
    localStorage.removeItem("quickbite-cart");
  } catch (error) {
    // ignore
  }
  window.location.href = "index.html";
}

function vendorOptionsHtml() {
  const vendors = state.users.filter((u) => u.role === "vendor");
  return vendors.map((v) => `<option value="${escapeHtml(v.user_id)}">${escapeHtml(v.name)}</option>`).join("");
}

function categoryOptionsHtml(extraFirstLabel) {
  const cats = Array.from(new Set(state.foods.map((f) => f.category))).sort((a, b) => a.localeCompare(b));
  const opts = cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  if (!extraFirstLabel) return opts;
  return `<option value="">${escapeHtml(extraFirstLabel)}</option>${opts}`;
}

function renderHeader() {
  const titles = {
    overview: ["Dashboard Overview", "Monitor today’s performance, see recent orders, and keep the platform flowing."],
    menu: ["Menu Management", "Add, edit, remove, and control availability across all vendors."],
    orders: ["Orders", "Live order monitoring with in-place status updates and quick filters."],
    sales: ["Sales Records", "Revenue summary, daily trends, and payment breakdown across orders."],
    profile: ["Profile Settings", "Manage your profile details, password, and account access."],
  };
  const [t, s] = titles[state.view] || titles.overview;
  $("pageTitle").textContent = t;
  $("pageSubtitle").textContent = s;
  $("globalSearch").value = state.search;
}

function setView(view) {
  state.view = view;
  state.search = "";
  renderHeader();
  try {
    window.location.hash = view;
  } catch (error) {
    // ignore
  }

  $$(".nav-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.view === view));
  $$(".view").forEach((v) => v.classList.toggle("is-active", v.dataset.view === view));

  renderAll();
}

function statCalc() {
  const scopedOrders = state.isVendorSession && state.sessionVendorId
    ? state.orders.filter((o) => o.vendor_id === state.sessionVendorId)
    : state.orders;
  const scopedFoods = state.isVendorSession && state.sessionVendorId
    ? state.foods.filter((f) => f.vendor_id === state.sessionVendorId)
    : state.foods;

  const ordersToday = scopedOrders.filter((o) => todayKey(o.created_at) === todayKey(Date.now()));
  const pending = scopedOrders.filter((o) => o.status === "pending").length;
  const activeFoods = scopedFoods.filter((f) => f.is_available).length;
  const ids = new Set(ordersToday.map((o) => o.order_id));
  const revenueToday = state.payments
    .filter((p) => ids.has(p.order_id) && p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  return { ordersToday, pending, activeFoods, revenueToday, scopedOrders, scopedFoods };
}

function statusBadgeHtml(status) {
  const s = normalizeOrderStatus(status);
  const t = s.charAt(0).toUpperCase() + s.slice(1);
  return `<span class="badge ${escapeHtml(s)}"><span class="dot"></span>${escapeHtml(t)}</span>`;
}

function statusPillsHtml(orderId, status) {
  const currentStatus = normalizeOrderStatus(status);
  const o = state.orders.find((x) => x.order_id === orderId);
  const its = o ? getOrderItems(o) : [];
  const itemCount = its.length;
  const customer = o ? userName(o.customer_id) : "—";

  return `
    <div class="ad-overview-actions">
      <div class="ad-overview-actions__label">Update order status</div>
      <div class="ad-status-actions" role="group" aria-label="Update order status">
        ${ORDER_STATUSES.map((nextStatus) => {
          const label = nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1);
          const activeClass = nextStatus === currentStatus ? " is-active" : "";
          return `<button class="ad-status-pill${activeClass}" type="button" data-action="setOrderStatus" data-id="${escapeHtml(orderId)}" data-status="${escapeHtml(nextStatus)}">${escapeHtml(label)}</button>`;
        }).join("")}
        <div class="ad-status-divider"></div>
        <button class="ad-status-pill ad-status-pill--cancel" type="button" data-action="setOrderStatus" data-id="${escapeHtml(orderId)}" data-status="cancelled">Cancelled</button>
      </div>
      <div class="ad-overview-actions__footer">
        <span class="ad-overview-actions__meta">
          Order contains <strong>${escapeHtml(String(itemCount))}</strong> item${itemCount !== 1 ? "s" : ""} · customer <strong>${escapeHtml(customer)}</strong>
        </span>
        <div class="ad-overview-actions__btns">
          <button class="ad-action-btn" type="button" data-jump="orders"><i class="fa-solid fa-eye"></i> View details</button>
          <button class="ad-action-btn ad-action-btn--danger" type="button" data-action="setOrderStatus" data-id="${escapeHtml(orderId)}" data-status="cancelled"><i class="fa-solid fa-xmark"></i> Cancel order</button>
        </div>
      </div>
    </div>
  `;
}

function renderOverview() {
  const { ordersToday, pending, activeFoods, revenueToday, scopedOrders, scopedFoods } = statCalc();

  $("statOrdersToday").textContent = String(ordersToday.length);
  $("statOrdersTodayMeta").textContent = `${scopedOrders.length} tracked in live list`;
  $("statPending").textContent = String(pending);
  $("statRevenueToday").textContent = money(revenueToday);
  $("statActiveFoods").textContent = String(activeFoods);
  $("statActiveFoodsMeta").textContent = `${scopedFoods.length} total items`;

  const rows = scopedOrders.slice(0, 8).map((o) => {
    const pay = state.payments.find((p) => p.order_id === o.order_id);
    const payText = pay ? `${pay.method} • ${pay.status}` : "—";
    const normalizedStatus = normalizeOrderStatus(o.status);
    const isExpanded = state.expandedRecentOrderId === o.order_id;
    return `
      <div class="ad-overview-order${isExpanded ? " is-expanded" : ""}" data-overview-order="${escapeHtml(o.order_id)}">
        <button class="ad-row ad-row-summary ad-row--overview ad-overview-order__summary" type="button" data-action="toggleRecentOrder" data-id="${escapeHtml(o.order_id)}" aria-expanded="${isExpanded ? "true" : "false"}">
          <div class="ad-col ad-strong">${escapeHtml(o.order_id)}</div>
          <div class="ad-col">${escapeHtml(userName(o.customer_id))}</div>
          <div class="ad-col">
            <span class="ad-vendor-pill">${escapeHtml(userName(o.vendor_id))}</span>
          </div>
          <div class="ad-col ad-total-col">${escapeHtml(money(o.total_amount))}</div>
          <div class="ad-col">${statusBadgeHtml(normalizedStatus)}</div>
          <div class="ad-col">${escapeHtml(fmt(o.pickup_time))}</div>
          <div class="ad-col">${escapeHtml(payText)}</div>
        </button>
        <div class="ad-overview-order__actions"${isExpanded ? "" : " hidden"}>
          ${statusPillsHtml(o.order_id, normalizedStatus)}
        </div>
      </div>
    `;
  }).join("");

  $("recentOrdersBody").innerHTML = rows || `<p class="ad-empty">No orders found.</p>`;
}

function renderMenuFilters() {
  $("menuVendorFilter").innerHTML = `<option value="">All Vendors</option>${vendorOptionsHtml()}`;
  $("menuCategoryFilter").innerHTML = categoryOptionsHtml("All Categories");
  $("menuVendorFilter").value = state.menuVendor;
  $("menuCategoryFilter").value = state.menuCategory;
  $("menuSearch").value = state.menuQuery;

  if (state.isVendorSession) {
    $("menuVendorFilter").value = state.sessionVendorId || "";
    $("menuVendorFilter").disabled = true;
  } else {
    $("menuVendorFilter").disabled = false;
  }
}

function matchesFoodFilter(f) {
  if (state.menuVendor && f.vendor_id !== state.menuVendor) return false;
  if (state.menuCategory && f.category !== state.menuCategory) return false;
  const q = (state.search || state.menuQuery).trim().toLowerCase();
  if (!q) return true;
  const hay = [f.name, f.category, userName(f.vendor_id)].join(" ").toLowerCase();
  return hay.includes(q);
}

function renderMenu() {
  renderMenuFilters();
  const rows = state.foods.filter(matchesFoodFilter).map((f) => {
    const toggleClass = f.is_available ? "toggle on" : "toggle";
    const ariaPressed = f.is_available ? "true" : "false";
    const availLabel = f.is_available ? "Available" : "Unavailable";
    return `
      <div class="ad-row ad-row-summary ad-row--menu">
        <div class="ad-col ad-strong">${escapeHtml(f.name)}</div>
        <div class="ad-col">${escapeHtml(f.category)}</div>
        <div class="ad-col ad-total-col">${escapeHtml(money(f.price))}</div>
        <div class="ad-col"><span class="ad-vendor-pill">${escapeHtml(userName(f.vendor_id))}</span></div>
        <div class="ad-col">
          <button class="${toggleClass}" type="button" data-action="toggleFood" data-id="${escapeHtml(f.food_id)}" aria-pressed="${ariaPressed}" aria-label="Availability toggle">
            <span class="knob"></span>
          </button>
          <span class="muted" style="margin-left:8px">${escapeHtml(availLabel)}</span>
        </div>
        <div class="ad-col">
          <button class="btn ghost sm" type="button" data-action="editFood" data-id="${escapeHtml(f.food_id)}"><i class="fa-solid fa-pen"></i>Edit</button>
          <button class="btn ghost sm" type="button" data-action="deleteFood" data-id="${escapeHtml(f.food_id)}"><i class="fa-solid fa-trash"></i>Delete</button>
        </div>
      </div>
    `;
  }).join("");

  $("foodBody").innerHTML = rows || `<p class="ad-empty">No items match your filters.</p>`;
}

function renderOrderTabs() {
  const tabs = ["All", "Pending", "Preparing", "Completed"];
  $("orderTabs").innerHTML = tabs.map((t) => {
    const cls = "tab" + (state.orderTab === t ? " is-active" : "");
    return `<button class="${cls}" type="button" data-tab="${escapeHtml(t)}">${escapeHtml(t)}</button>`;
  }).join("");
}

function matchesOrderFilter(o) {
  if (state.isVendorSession && state.sessionVendorId && o.vendor_id !== state.sessionVendorId) return false;
  if (state.orderTab !== "All" && normalizeOrderStatus(o.status) !== state.orderTab.toLowerCase()) return false;
  const q = (state.search || "").trim().toLowerCase();
  if (!q) return true;
  const items = getOrderItems(o).map((it) => it.item_name).join(", ");
  const hay = [o.order_id, userName(o.customer_id), userName(o.vendor_id), o.status, String(o.total_amount), items].join(" ").toLowerCase();
  return hay.includes(q);
}

function renderOrders() {
  renderOrderTabs();
  const rows = state.orders.filter(matchesOrderFilter).map((o) => {
    const its = getOrderItems(o);
    const itemsLabel = its.length ? its.map((i) => `${i.item_name} ×${i.quantity}`).join(", ") : "—";
    const pay = state.payments.find((p) => p.order_id === o.order_id);
    const normalizedStatus = normalizeOrderStatus(o.status);
    const payStatus = pay ? pay.status : "pending";
    const payLabel = pay ? `${pay.method} • ${payStatus}` : "—";
    return `
      <div class="ad-row ad-row-summary ad-row--orders">
        <div class="ad-col ad-strong">${escapeHtml(o.order_id)}</div>
        <div class="ad-col">${escapeHtml(userName(o.customer_id))}</div>
        <div class="ad-col"><span class="ad-vendor-pill">${escapeHtml(userName(o.vendor_id))}</span></div>
        <div class="ad-col">${escapeHtml(itemsLabel)}</div>
        <div class="ad-col ad-total-col">${escapeHtml(money(o.total_amount))}</div>
        <div class="ad-col">${statusBadgeHtml(normalizedStatus)}</div>
        <div class="ad-col">${escapeHtml(fmt(o.pickup_time))}</div>
        <div class="ad-col">${escapeHtml(payLabel)}</div>
      </div>
    `;
  }).join("");

  $("ordersBody").innerHTML = rows || `<p class="ad-empty">No orders match your filters.</p>`;
}

function renderSales() {
  const visibleOrderIds = state.isVendorSession && state.sessionVendorId
    ? new Set(state.orders.filter((o) => o.vendor_id === state.sessionVendorId).map((o) => o.order_id))
    : null;

  const scopedPayments = visibleOrderIds ? state.payments.filter((p) => visibleOrderIds.has(p.order_id)) : state.payments;
  const completed = scopedPayments.filter((p) => p.status === "completed");
  const totalRevenue = completed.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const uniqueOrders = new Set(completed.map((p) => p.order_id)).size;
  const avg = uniqueOrders ? totalRevenue / uniqueOrders : 0;

  $("salesTotalRevenue").textContent = money(totalRevenue);
  $("salesOrdersCompleted").textContent = String(uniqueOrders);
  $("salesAvgOrder").textContent = money(avg);
  $("salesPaymentsCount").textContent = String(scopedPayments.length);
  $("paymentCountLabel").textContent = `${scopedPayments.length} payments`;

  // Daily revenue (last 7 days)
  const byDay = new Map();
  completed.filter((p) => p.paid_at).forEach((p) => {
    const key = todayKey(p.paid_at);
    byDay.set(key, (byDay.get(key) || 0) + Number(p.amount || 0));
  });
  const rows = Array.from(byDay.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-7);
  const max = rows.reduce((m, r) => Math.max(m, r[1]), 0) || 1;

  $("dailyRevenue").innerHTML = rows.length
    ? rows.map(([day, amt]) => {
      const pct = Math.max(4, Math.round((amt / max) * 100));
      return `
        <div class="barrow">
          <div class="muted">${escapeHtml(day)}</div>
          <div class="bar"><div style="width:${pct}%"></div></div>
          <div class="baramt">${escapeHtml(money(amt))}</div>
        </div>
      `;
    }).join("")
    : `<div class="muted">No completed payments yet.</div>`;

  // Payments table
  const payRows = scopedPayments.slice(0, 30).map((p) => `
    <div class="ad-row ad-row-summary ad-row--payments">
      <div class="ad-col ad-strong">${escapeHtml(p.payment_id)}</div>
      <div class="ad-col">${escapeHtml(p.order_id)}</div>
      <div class="ad-col">${escapeHtml(p.method)}</div>
      <div class="ad-col ad-total-col">${escapeHtml(money(p.amount))}</div>
      <div class="ad-col">${escapeHtml(p.status)}</div>
      <div class="ad-col">${escapeHtml(p.paid_at ? fmt(p.paid_at) : "—")}</div>
    </div>
  `).join("");
  $("paymentsBody").innerHTML = payRows || `<p class="ad-empty">No payments found.</p>`;
}

function renderProfile() {
  const user = state.sessionUser || {};
  const fullName = String(user.fullName || user.name || "").trim();
  const email = String(user.email || "").trim();
  const phone = String(user.phone || "").trim();

  if ($("profileFullName")) $("profileFullName").value = fullName;
  if ($("profileEmail")) $("profileEmail").value = email;
  if ($("profilePhone")) $("profilePhone").value = phone;
}

function syncDashboardData(result, options) {
  const nextUsers = result.users || [];
  const nextFoods = result.foods || [];
  const nextOrders = (result.orders || []).map((order) => ({
    ...order,
    status: normalizeOrderStatus(order.status),
  }));
  const nextOrderItems = result.orderItems || nextOrders.flatMap((order) =>
    Array.isArray(order.items)
      ? order.items.map((item) => ({ ...item, order_id: item.order_id || order.order_id }))
      : []
  );
  const nextPayments = result.payments || [];
  const shouldNotify = Boolean(options && options.notifyChanges && state.isVendorSession);
  const scopeKey = getVendorCacheScope();
  const cache = readStoredVendorOrderCache();
  const previousSnapshot = cache[scopeKey] || {};
  const nextSnapshot = toScopedOrderSnapshot(nextOrders);

  if (shouldNotify) {
    nextOrders
      .filter((order) => !previousSnapshot[order.order_id])
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .forEach((order) => {
        const message = formatNewOrderMessage(order);
        addPanelNotification({
          type: "order",
          title: "New order received",
          desc: message,
          time: Date.now(),
          read: false,
        });
        notify(message, "info");
      });
  }

  cache[scopeKey] = nextSnapshot;
  writeStoredVendorOrderCache(cache);

  state.users = nextUsers;
  state.foods = nextFoods;
  state.orders = nextOrders;
  state.orderItems = nextOrderItems;
  state.payments = nextPayments;
}

function renderAll() {
  renderOverview();
  renderMenu();
  renderOrders();
  renderSales();
  renderProfile();
}

/* ===========================
   Modal (Food)
   =========================== */

function openFoodModal(mode, foodId) {
  state.editingFoodId = mode === "edit" ? foodId : null;
  const isEdit = !!state.editingFoodId;
  $("foodModalTitle").textContent = isEdit ? "Edit Food Item" : "Add New Food Item";
  $("foodModalSave").textContent = isEdit ? "Save Changes" : "Save Item";

  $("fiVendor").innerHTML = vendorOptionsHtml();
  const firstVendor = state.users.find((u) => u.role === "vendor");

  if (!isEdit) {
    $("fiName").value = "";
    $("fiDesc").value = "";
    $("fiCategory").value = "";
    $("fiPrice").value = "0";
    $("fiVendor").value = state.isVendorSession ? (state.sessionVendorId || "") : (firstVendor ? firstVendor.user_id : "");
    setAvail(true);
    $("fiImage").value = "";
    $("fiImageName").textContent = "No file selected";
  } else {
    const f = state.foods.find((x) => x.food_id === foodId);
    if (!f) return;
    $("fiName").value = f.name;
    $("fiDesc").value = f.description || "";
    $("fiCategory").value = f.category;
    $("fiPrice").value = String(f.price);
    $("fiVendor").value = f.vendor_id;
    setAvail(!!f.is_available);
    $("fiImage").value = "";
    $("fiImageName").textContent = f.image ? f.image : "No file selected";
  }

  if (state.isVendorSession) {
    $("fiVendor").disabled = true;
  } else {
    $("fiVendor").disabled = false;
  }

  $("foodModal").hidden = false;
}

function closeFoodModal() {
  $("foodModal").hidden = true;
  state.editingFoodId = null;
}

function setAvail(on) {
  const toggleEl = $("fiAvail");
  const card     = $("fiAvailCard");
  const label    = $("fiAvailLabel");
 
  toggleEl.classList.toggle("on", !!on);
  toggleEl.setAttribute("aria-pressed", on ? "true" : "false");
  if (label) label.textContent = on ? "Available" : "Unavailable";
 
  // avail-row subtle border highlight
  if (card) {
    card.style.borderColor = on
      ? "rgba(122,12,6,0.32)"
      : "rgba(122,12,6,0.16)";
  }
}

async function saveFoodFromModal() {
  const name = $("fiName").value.trim();
  const description = $("fiDesc").value.trim();
  const category = $("fiCategory").value.trim();
  const vendor_id = $("fiVendor").value;
  const price = Number($("fiPrice").value || 0);
  const is_available = $("fiAvail").classList.contains("on");
  const imageFile = $("fiImage").files && $("fiImage").files[0] ? $("fiImage").files[0] : null;

  if (!name || !category || !vendor_id || !(price >= 0)) return;

  try {
    const image_data = imageFile ? await readFileAsDataUrl(imageFile) : "";

    if (!state.editingFoodId) {
      const result = await window.QuickBiteApi.createFood({ vendor_id, name, category, price, is_available, description, image_data });
      state.foods.unshift(result.food);
    } else {
      const result = await window.QuickBiteApi.updateFood(state.editingFoodId, { vendor_id, name, category, price, is_available, description, image_data });
      const idx = state.foods.findIndex((f) => f.food_id === state.editingFoodId);
      if (idx >= 0) {
        state.foods[idx] = { ...state.foods[idx], ...result.food, category };
      }
    }

    closeFoodModal();
    renderAll();
  } catch (error) {
    alert(error.message);
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Failed to read the selected image"));
    reader.readAsDataURL(file);
  });
}

async function saveProfile() {
  const fullName = $("profileFullName").value.trim();
  const phone = $("profilePhone").value.trim();

  try {
    const result = await window.QuickBiteApi.updateProfile({ fullName, phone });
    const nextUser = result.user || {};
    state.sessionUser = {
      ...(state.sessionUser || {}),
      ...nextUser,
      name: nextUser.fullName || nextUser.name || fullName,
    };
    localStorage.setItem("quickbite-auth-user", JSON.stringify(state.sessionUser));

    const userIdx = state.users.findIndex((u) => normalizeId(u.user_id) === normalizeId(nextUser.userId || nextUser.id || state.sessionUser.user_id));
    if (userIdx >= 0) {
      state.users[userIdx] = {
        ...state.users[userIdx],
        name: nextUser.fullName || state.users[userIdx].name,
        email: nextUser.email || state.users[userIdx].email,
        phone: nextUser.phone || phone,
      };
    }

    const sidebarUserName = $("sidebarUserName");
    const sidebarSubline = $("sidebarSubline");
    if (sidebarUserName) sidebarUserName.textContent = nextUser.fullName || state.sessionUser.name || "Vendor";
    if (sidebarSubline && state.isVendorSession) sidebarSubline.textContent = nextUser.fullName || state.sessionUser.name || "Vendor";

    renderProfile();
    alert("Profile saved.");
  } catch (error) {
    alert(error.message);
  }
}

async function updatePasswordFromProfile() {
  const currentPassword = $("profileCurrentPw").value;
  const newPassword = $("profileNewPw").value;
  const confirmPassword = $("profileConfirmPw").value;

  if (!currentPassword || !newPassword) {
    alert("Please fill current and new password.");
    return;
  }
  if (newPassword.length < 8) {
    alert("New password must be at least 8 characters.");
    return;
  }
  if (newPassword !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  try {
    await window.QuickBiteApi.updatePassword({ currentPassword, newPassword, confirmPassword });
    $("profileCurrentPw").value = "";
    $("profileNewPw").value = "";
    $("profileConfirmPw").value = "";
    alert("Password updated.");
  } catch (error) {
    alert(error.message);
  }
}

function openDeleteModal() {
  if ($("confirmDeleteModal")) $("confirmDeleteModal").hidden = false;
}

function closeDeleteModal() {
  if ($("confirmDeleteModal")) $("confirmDeleteModal").hidden = true;
}

async function deleteCurrentAccount() {
  if (state.profileDeleteBusy) return;
  state.profileDeleteBusy = true;
  const actionBtn = $("confirmDeleteAction");
  if (actionBtn) actionBtn.disabled = true;

  try {
    await window.QuickBiteApi.deleteProfile();
    alert("Your account has been deleted.");
    signOut();
  } catch (error) {
    alert(error.message);
  } finally {
    state.profileDeleteBusy = false;
    if (actionBtn) actionBtn.disabled = false;
    closeDeleteModal();
  }
}

/* ===========================
   Events
   =========================== */

function wireEvents() {
  // Navigation
  $$(".nav-btn").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));

  // Jump button
  $$("[data-jump]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.jump)));

  // Global search
  $("globalSearch").addEventListener("input", (e) => {
    state.search = e.target.value || "";
    renderAll();
  });

  // Menu filters
  $("menuSearch").addEventListener("input", (e) => { state.menuQuery = e.target.value || ""; renderMenu(); });
  $("menuVendorFilter").addEventListener("change", (e) => { state.menuVendor = e.target.value || ""; renderMenu(); });
  $("menuCategoryFilter").addEventListener("change", (e) => { state.menuCategory = e.target.value || ""; renderMenu(); });

  $("addFoodBtn").addEventListener("click", () => openFoodModal("add"));

  // Orders tabs (delegated)
  $("orderTabs").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tab]");
    if (!btn) return;
    state.orderTab = btn.dataset.tab || "All";
    renderOrders();
  });

  // Table actions (delegated)
  $("foodBody").addEventListener("click", async (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    const id = el.dataset.id;
    if (action === "toggleFood") {
      const f = state.foods.find((x) => x.food_id === id);
      if (!f) return;
      try {
        await window.QuickBiteApi.updateFood(id, { ...f, is_available: !f.is_available });
        f.is_available = !f.is_available;
        renderMenu();
        renderOverview();
      } catch (error) {
        alert(error.message);
      }
      return;
    }
    if (action === "editFood") return openFoodModal("edit", id);
    if (action === "deleteFood") {
      try {
        await window.QuickBiteApi.deleteFood(id);
        state.foods = state.foods.filter((x) => x.food_id !== id);
        renderAll();
      } catch (error) {
        alert(error.message);
      }
    }
  });

  function handleOrderStatusUpdate(button) {
    if (!button) return;
    const orderId = button.dataset.id;
    const status = button.dataset.status;
    if (!ORDER_STATUSES.includes(status)) return;
    const o = state.orders.find((x) => x.order_id === orderId);
    if (!o) return;
    if (state.isVendorSession && state.sessionVendorId && o.vendor_id !== state.sessionVendorId) return;
    if (normalizeOrderStatus(o.status) === status) return;
    window.QuickBiteApi.updateOrderStatus(orderId, { status })
      .then(() => {
        o.status = status;
        addPanelNotification({
          type: status === "completed" ? "success" : "order",
          title: "Order update",
          desc: formatCustomerStatusMessage(o, status),
          time: Date.now(),
          read: false,
          audience: {
            userIds: [String(o.customer_id || "")]
          }
        });
        if (status === "completed") {
          const pay = state.payments.find((p) => p.order_id === orderId);
          if (pay && pay.status !== "completed") {
            pay.status = "completed";
            pay.paid_at = new Date().toISOString();
          }
        }
        renderAll();
      })
      .catch((error) => {
        alert(error.message);
      });
  }

  $("recentOrdersBody").addEventListener("click", (e) => {
    const statusButton = e.target.closest("[data-action='setOrderStatus']");
    if (statusButton) {
      handleOrderStatusUpdate(statusButton);
      return;
    }
    const toggleButton = e.target.closest("[data-action='toggleRecentOrder']");
    if (!toggleButton) return;
    const orderId = toggleButton.dataset.id || "";
    state.expandedRecentOrderId = state.expandedRecentOrderId === orderId ? null : orderId;
    renderOverview();
  });

  // Modal
  $("foodModalClose").addEventListener("click", closeFoodModal);
  $("foodModalCancel").addEventListener("click", closeFoodModal);
  $("foodModalSave").addEventListener("click", saveFoodFromModal);
  $("foodModal").addEventListener("mousedown", (e) => { if (e.target === e.currentTarget) closeFoodModal(); });
  $("fiAvailCard").addEventListener("click", () => setAvail(!$("fiAvail").classList.contains("on")));
  $("fiAvailCard").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setAvail(!$("fiAvail").classList.contains("on")); } });
  $("fiImage").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    $("fiImageName").textContent = file ? file.name : "No file selected";
  });

  $("profileSaveBtn").addEventListener("click", saveProfile);
  $("profilePasswordBtn").addEventListener("click", updatePasswordFromProfile);
  $("profileLogoutBtn").addEventListener("click", signOut);
  $("profileDeleteBtn").addEventListener("click", openDeleteModal);
  $("confirmDeleteClose").addEventListener("click", closeDeleteModal);
  $("confirmDeleteCancel").addEventListener("click", closeDeleteModal);
  $("confirmDeleteAction").addEventListener("click", deleteCurrentAccount);
  $("confirmDeleteModal").addEventListener("mousedown", (e) => { if (e.target === e.currentTarget) closeDeleteModal(); });

  const profileBtn = $("adminProfileBtn");
  const profileMenu = $("adminUserDropdown");
  if (profileBtn && profileMenu) {
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const shouldOpen = !profileMenu.classList.contains("show");
      profileMenu.classList.toggle("show", shouldOpen);
      profileBtn.classList.toggle("is-open", shouldOpen);
      profileBtn.setAttribute("aria-expanded", String(shouldOpen));
    });

    document.addEventListener("click", (e) => {
      if (!profileMenu.contains(e.target) && !profileBtn.contains(e.target)) {
        profileMenu.classList.remove("show");
        profileBtn.classList.remove("is-open");
        profileBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  const notifLink = $("adminDropdownNotif");
  if (notifLink) {
    notifLink.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof window.toggleNotifications === "function") window.toggleNotifications();
      if (profileMenu) profileMenu.classList.remove("show");
      if (profileBtn) {
        profileBtn.classList.remove("is-open");
        profileBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  const logoutLink = $("adminDropdownLogout");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      signOut();
    });
  }

  $$("[data-view-link]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const nextView = link.getAttribute("data-view-link");
      if (nextView) setView(nextView);
      if (profileMenu) profileMenu.classList.remove("show");
      if (profileBtn) {
        profileBtn.classList.remove("is-open");
        profileBtn.setAttribute("aria-expanded", "false");
      }
    });
  });
}

function startLiveFeed() {
  if (state.liveTimer) clearInterval(state.liveTimer);
  state.liveTimer = setInterval(() => {
    if (state.isVendorSession && state.sessionVendorId) {
      // For vendor sessions, keep data stable and scoped (no random global feed).
      return;
    }
    // Add a new pending order sometimes
    if (Math.random() < 0.45) {
      const customers = state.users.filter((u) => u.role === "customer");
      const vendors = state.users.filter((u) => u.role === "vendor");
      if (!customers.length || !vendors.length) return;
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const vendor = vendors[Math.floor(Math.random() * vendors.length)];
      const order_id = "o_" + String(9000 + Math.floor(Math.random() * 900)).padStart(4, "0");
      const total_amount = 120 + Math.floor(Math.random() * 540);
      const now = Date.now();
      const order = {
        order_id,
        customer_id: customer.user_id,
        vendor_id: vendor.user_id,
        total_amount,
        status: "pending",
        created_at: new Date(now).toISOString(),
        pickup_time: new Date(now + (10 + Math.floor(Math.random() * 20)) * 60e3).toISOString(),
      };
      state.orders.unshift(order);
      state.payments.unshift({
        payment_id: uid("p"),
        order_id,
        method: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)],
        status: "pending",
        amount: total_amount,
        paid_at: null,
      });
    }

    // Move one order forward
    const idx = state.orders.findIndex((o) => o.status === "pending" || o.status === "preparing");
    if (idx >= 0 && Math.random() < 0.55) {
      const s = state.orders[idx].status;
      state.orders[idx] = { ...state.orders[idx], status: s === "pending" ? "preparing" : "completed" };
    }

    state.orders = state.orders.slice(0, 28);
    renderAll();
  }, 6500);
}

function startDashboardPolling() {
  if (state.liveTimer) clearInterval(state.liveTimer);
  state.liveTimer = setInterval(() => {
    window.QuickBiteApi.getAdminDashboard()
      .then((result) => {
        syncDashboardData(result, { notifyChanges: true });
        renderAll();
      })
      .catch((error) => {
        if (!state.isVendorSession) {
          startLiveFeed();
        } else {
          notify(error.message, "err");
        }
      });
  }, DASHBOARD_POLL_MS);
}

function init() {
  state.sessionUser = getSessionUser();
  const role = String((state.sessionUser && state.sessionUser.role) || "").toLowerCase();
  state.isVendorSession = role === "vendor";

  if (state.isVendorSession) {
    const storedId = normalizeId(state.sessionUser.user_id || state.sessionUser.id || state.sessionUser.vendor_id);
    const storedName = String(state.sessionUser.fullName || state.sessionUser.name || "").trim();

    // Prefer ID match if present.
    let vendor = storedId ? state.users.find((u) => normalizeId(u.user_id) === storedId && u.role === "vendor") : null;
    if (!vendor && storedName) {
      vendor = state.users.find((u) => u.role === "vendor" && String(u.name || "").toLowerCase() === storedName.toLowerCase());
    }
    if (!vendor) {
      vendor = { user_id: storedId || uid("u_ven"), name: storedName || "Vendor", role: "vendor" };
      state.users.push(vendor);
    }
    state.sessionVendorId = vendor.user_id;

    // Scope the menu vendor filter to this vendor by default.
    state.menuVendor = state.sessionVendorId;
  }

  const sidebarSubline = $("sidebarSubline");
  const sidebarUserName = $("sidebarUserName");
  updateAdminProfileMenu();
  if (state.isVendorSession && state.sessionVendorId) {
    const vendorName = userName(state.sessionVendorId);
    if (sidebarSubline) sidebarSubline.textContent = vendorName;
    if (sidebarUserName) sidebarUserName.textContent = vendorName;
    const avatar = document.querySelector(".avatar");
    if (avatar) avatar.textContent = String(vendorName || "V").charAt(0).toUpperCase();
  } else {
    if (sidebarSubline) sidebarSubline.textContent = "Admin Console";
    if (sidebarUserName) sidebarUserName.textContent = "Admin";
    const avatar = document.querySelector(".avatar");
    if (avatar) avatar.textContent = "A";
  }

  wireEvents();
  window.QuickBiteApi.getAdminDashboard()
    .then((result) => {
      syncDashboardData(result, { notifyChanges: false });

      if (state.isVendorSession && state.sessionVendorId) {
        state.menuVendor = state.sessionVendorId;
      } else if (!state.isVendorSession && state.users.length) {
        state.menuVendor = "";
      }

      const sidebarSubline = $("sidebarSubline");
      const sidebarUserName = $("sidebarUserName");
      if (state.isVendorSession && state.sessionVendorId) {
        const vendorName = userName(state.sessionVendorId);
        if (sidebarSubline) sidebarSubline.textContent = vendorName;
        if (sidebarUserName) sidebarUserName.textContent = vendorName;
        const avatar = document.querySelector(".avatar");
        if (avatar) avatar.textContent = String(vendorName || "V").charAt(0).toUpperCase();
      }
      updateAdminProfileMenu();

      const hashView = String((window.location.hash || "").replace("#", "") || "").toLowerCase();
      if (hashView && ["overview", "menu", "orders", "sales", "profile"].includes(hashView)) {
        state.view = hashView;
      }
      renderHeader();
      renderAll();
      setView(state.view);
      startDashboardPolling();
    })
    .catch((error) => {
      const hashView = String((window.location.hash || "").replace("#", "") || "").toLowerCase();
      if (hashView && ["overview", "menu", "orders", "sales", "profile"].includes(hashView)) {
        state.view = hashView;
      }
      renderHeader();
      renderAll();
      setView(state.view);
      notify(error.message, "err");
      startLiveFeed();
    });
}

document.addEventListener("DOMContentLoaded", init);
