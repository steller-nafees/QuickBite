/* ============================================================
   QuickBite Admin Dashboard — admin-dashboard.js
   ============================================================ */

"use strict";

/* ============================================================
   HELPERS
   ============================================================ */
const $ = (id) => document.getElementById(id);
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const fmt = (n) => "৳" + Math.round(n).toLocaleString("en-IN");
const fmtDate = (ms) => new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const fmtDateTime = (ms) => new Date(ms).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

function timeAgo(ms) {
  const d = Date.now() - ms;
  if (d < 60000) return "just now";
  if (d < 3600000) return Math.floor(d / 60000) + "m ago";
  if (d < 86400000) return Math.floor(d / 3600000) + "h ago";
  return Math.floor(d / 86400000) + "d ago";
}

/* ============================================================
   SEED DATA  (mirrors schema)
   ============================================================ */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUSES = ["pending", "preparing", "ready", "completed", "delivered"];
const METHODS  = ["cash", "card", "wallet"];

const VENDOR_NAMES   = ["Pizza Hub", "Burger Station", "Rice Bowl", "Snack Corner", "Desi Bites", "Noodle Bar"];
const CUSTOMER_NAMES = ["Rahim Islam", "Tanvir Ahmed", "Nusrat Jahan", "Farhan Hossain", "Sadia Akter",
                        "Mehdi Hasan", "Tania Begum", "Rafiq Uddin", "Lamia Sultana", "Omar Faruk",
                        "Razia Khatun", "Imran Khan", "Sumaiya Parvin", "Bashir Mia", "Farhana Nasrin"];
const FOOD_NAMES = ["Chicken Burger", "Beef Pizza", "Kacchi Biryani", "Cheese Fries", "Grilled Sandwich",
                    "Veggie Roll", "Chicken Shawarma", "Dal Rice Bowl", "Egg Chowmein", "Fruit Juice",
                    "Mutton Rezala", "Pasta Arrabiata", "Paneer Tikka", "Beef Steak", "Lemon Sharbat"];

const DB = { users: [], food: [], orders: [], payments: [], editId: null };

function seedDB() {
  /* Vendors */
  for (let i = 0; i < VENDOR_NAMES.length; i++) {
    DB.users.push({
      user_id: i + 1,
      full_name: VENDOR_NAMES[i],
      email: "vendor" + (i + 1) + "@nsu.edu",
      phone: "017" + rnd(10000000, 99999999),
      role: "vendor",
      created_at: Date.now() - rnd(10, 300) * 86400000
    });
  }

  /* Customers */
  for (let i = 0; i < CUSTOMER_NAMES.length; i++) {
    DB.users.push({
      user_id: VENDOR_NAMES.length + i + 1,
      full_name: CUSTOMER_NAMES[i],
      email: CUSTOMER_NAMES[i].split(" ")[0].toLowerCase() + (i + 1) + "@nsu.edu",
      phone: "018" + rnd(10000000, 99999999),
      role: "customer",
      created_at: Date.now() - rnd(1, 120) * 86400000
    });
  }

  const vendors   = DB.users.filter(u => u.role === "vendor");
  const customers = DB.users.filter(u => u.role === "customer");

  /* Food items */
  for (let i = 0; i < FOOD_NAMES.length; i++) {
    const v = vendors[rnd(0, vendors.length - 1)];
    DB.food.push({
      food_id: i + 1,
      item_name: FOOD_NAMES[i],
      description: "Freshly prepared " + FOOD_NAMES[i].toLowerCase() + " from our campus kitchen.",
      price: rnd(60, 380),
      is_available: Math.random() > 0.2 ? 1 : 0,
      managed_by: v.user_id,
      vendor_name: v.full_name,
      created_at: Date.now() - rnd(5, 60) * 86400000,
      updated_at: Date.now() - rnd(0, 5) * 86400000
    });
  }

  /* Orders & Payments */
  for (let i = 1; i <= 35; i++) {
    const c   = customers[rnd(0, customers.length - 1)];
    const v   = vendors[rnd(0, vendors.length - 1)];
    const st  = STATUSES[rnd(0, STATUSES.length - 1)];
    const amt = rnd(120, 980);
    const ts  = Date.now() - rnd(0, 7) * 86400000 - rnd(0, 86400000);

    DB.orders.push({
      order_id: i,
      customer_id: c.user_id,
      customer_name: c.full_name,
      vendor_id: v.user_id,
      vendor_name: v.full_name,
      total_amount: amt,
      status: st,
      created_at: ts,
      items_count: rnd(1, 4)
    });

    const ps = (st === "completed" || st === "delivered") ? "completed"
             : (st === "pending") ? "pending" : "completed";

    DB.payments.push({
      payment_id: i,
      order_id: i,
      method: METHODS[rnd(0, METHODS.length - 1)],
      amount: amt,
      status: ps,
      paid_at: ts + rnd(0, 1800000)
    });
  }
}

seedDB();

/* ============================================================
   CLOCK
   ============================================================ */
function updateClock() {
  const now = new Date();
  $("clockEl").textContent = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
setInterval(updateClock, 1000);
updateClock();

/* ============================================================
   NOTIFICATIONS
   ============================================================ */
let notifications = [
  { id: 1, type: 'order', title: 'New Order Received', desc: 'Order #ORD-035 from Rahim Islam - ৳450', time: Date.now() - 300000, read: false },
  { id: 2, type: 'success', title: 'Payment Completed', desc: 'Payment for Order #ORD-034 successful', time: Date.now() - 900000, read: false },
  { id: 3, type: 'warning', title: 'Low Stock Alert', desc: 'Chicken Burger is running low at Pizza Hub', time: Date.now() - 1800000, read: true },
  { id: 4, type: 'order', title: 'New Order Received', desc: 'Order #ORD-033 from Nusrat Jahan - ৳320', time: Date.now() - 3600000, read: true }
];

function renderNotifications() {
  const list = $('notifList');
  const dot = $('notifDot');
  
  if (!notifications.length) {
    list.innerHTML = '<div class="notif-empty"><i class="fas fa-bell-slash"></i>No notifications yet</div>';
    if (dot) dot.style.display = 'none';
    return;
  }

  const unreadCount = notifications.filter(n => !n.read).length;
  if (dot) dot.style.display = unreadCount > 0 ? 'block' : 'none';

  list.innerHTML = notifications.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" data-notif-id="${n.id}">
      <div class="notif-icon ${n.type}">
        <i class="fas fa-${n.type === 'order' ? 'receipt' : n.type === 'success' ? 'check' : 'exclamation-triangle'}"></i>
      </div>
      <div class="notif-content">
        <div class="notif-title">${n.title}</div>
        <div class="notif-desc">${n.desc}</div>
        <div class="notif-time">${timeAgo(n.time)}</div>
      </div>
    </div>
  `).join('');
}

function toggleNotifications() {
  const panel = $('notifPanel');
  panel.classList.toggle('open');
  
  // Mark all as read when opened
  if (panel.classList.contains('open')) {
    notifications.forEach(n => n.read = true);
    renderNotifications();
  }
}

function clearAllNotifications() {
  notifications = [];
  renderNotifications();
  showToast('All notifications cleared');
}

$('notifBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  toggleNotifications();
});

$('notifClearAll').addEventListener('click', clearAllNotifications);

// Close notifications when clicking outside
document.addEventListener('click', (e) => {
  const panel = $('notifPanel');
  const btn = $('notifBtn');
  if (panel && !panel.contains(e.target) && !btn.contains(e.target)) {
    panel.classList.remove('open');
  }
});

// Initial render
renderNotifications();

/* ============================================================
   NAVIGATION
   ============================================================ */
const PAGE_TITLES = {
  overview: "Overview",
  orders:   "Order Management",
  menu:     "Menu Items",
  sales:    "Sales Records",
  users:    "Users"
};

function navigateTo(pageId) {
  document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".page").forEach(p  => p.classList.remove("active"));

  const navEl = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  const pageEl = $("page-" + pageId);

  if (navEl)  navEl.classList.add("active");
  if (pageEl) pageEl.classList.add("active");

  $("topbarTitle").textContent = PAGE_TITLES[pageId] || pageId;

  const renderers = {
    overview: renderOverview,
    orders:   renderOrders,
    menu:     renderMenu,
    sales:    renderSales,
    users:    renderUsers
  };
  if (renderers[pageId]) renderers[pageId]();
}

document.querySelectorAll(".nav-item").forEach(el => {
  el.addEventListener("click", () => navigateTo(el.dataset.page));
});

/* "View all" link-buttons */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-goto]");
  if (btn) navigateTo(btn.dataset.goto);
});

/* Sidebar toggle (mobile) */
$("sidebarToggle").addEventListener("click", () => {
  $("sidebar").classList.toggle("mobile-open");
});

/* ============================================================
   OVERVIEW
   ============================================================ */
function renderOverview() {
  const today     = new Date().setHours(0, 0, 0, 0);
  const todayOrders = DB.orders.filter(o => o.created_at >= today);
  const todayRev  = todayOrders.reduce((s, o) => s + o.total_amount, 0)
                  || DB.orders.slice(0, 6).reduce((s, o) => s + o.total_amount, 0);
  const avail     = DB.food.filter(f => f.is_available).length;
  const pending   = DB.orders.filter(o => o.status === "pending").length;

  $("s-orders").textContent     = DB.orders.length;
  $("s-orders-sub").textContent = todayOrders.length + " today";
  $("s-revenue").textContent    = fmt(todayRev);
  $("s-items").textContent      = avail + "/" + DB.food.length;
  $("s-items-sub").textContent  = (DB.food.length - avail) + " unavailable";
  $("s-users").textContent      = DB.users.length;
  $("pendingBadge").textContent = pending;

  /* Recent orders */
  const recent = DB.orders.slice().sort((a, b) => b.created_at - a.created_at).slice(0, 8);
  $("recent-orders-list").innerHTML = recent.map(o => `
    <div class="order-row">
      <div>
        <div class="order-id">#ORD-${String(o.order_id).padStart(3, "0")}</div>
        <div class="order-meta">${o.customer_name} · ${o.vendor_name}</div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:600;color:var(--text-accent);font-size:12px;font-family:var(--font-secondary)">${fmt(o.total_amount)}</div>
        <span class="badge badge-${o.status}">${o.status}</span>
      </div>
    </div>`).join("");

  /* Status breakdown */
  const counts = {};
  STATUSES.forEach(s => counts[s] = 0);
  DB.orders.forEach(o => counts[o.status] = (counts[o.status] || 0) + 1);
  $("statusBreakdown").innerHTML = STATUSES.map(s => `
    <div class="status-chip">
      <span class="status-dot dot-${s}"></span>
      <div>
        <div class="chip-label">${s}</div>
        <div class="chip-val">${counts[s]}</div>
      </div>
    </div>`).join("");
}

renderOverview();

/* ============================================================
   ORDERS
   ============================================================ */
function renderOrders() {
  const q = $("orderSearch").value.toLowerCase().trim();
  const f = $("orderFilter").value;

  const rows = DB.orders.filter(o => {
    const m = !q
      || String(o.order_id).includes(q)
      || o.customer_name.toLowerCase().includes(q)
      || o.vendor_name.toLowerCase().includes(q);
    return m && (!f || o.status === f);
  }).sort((a, b) => b.created_at - a.created_at);

  $("orderCount").textContent = rows.length + " order" + (rows.length !== 1 ? "s" : "");

  $("ordersBody").innerHTML = rows.length
    ? rows.map(o => `
      <tr>
        <td class="td-id">#ORD-${String(o.order_id).padStart(3, "0")}</td>
        <td class="td-strong">${o.customer_name}</td>
        <td>${o.vendor_name}</td>
        <td class="td-muted">${o.items_count} item${o.items_count > 1 ? "s" : ""}</td>
        <td class="td-amount">${fmt(o.total_amount)}</td>
        <td><span class="badge badge-${o.status}">${o.status}</span></td>
        <td class="td-muted">${timeAgo(o.created_at)}</td>
        <td>
          <select class="status-sel" data-order-id="${o.order_id}">
            ${STATUSES.map(s => `<option value="${s}"${o.status === s ? " selected" : ""}>${s}</option>`).join("")}
          </select>
        </td>
      </tr>`).join("")
    : `<tr><td colspan="8" class="table-empty"><i class="fas fa-inbox"></i>No orders found</td></tr>`;
}

$("orderSearch").addEventListener("input", renderOrders);
$("orderFilter").addEventListener("change", renderOrders);

/* Delegated change for status selects */
$("ordersBody").addEventListener("change", (e) => {
  const sel = e.target.closest(".status-sel");
  if (!sel) return;
  const id = parseInt(sel.dataset.orderId);
  const o  = DB.orders.find(x => x.order_id === id);
  if (o) {
    o.status = sel.value;
    showToast("Order #ORD-" + String(id).padStart(3, "0") + " → " + sel.value);
    renderOverview();
  }
});

/* ============================================================
   MENU
   ============================================================ */
function renderMenu() {
  const q = $("menuSearch").value.toLowerCase().trim();
  const rows = DB.food.filter(f =>
    !q || f.item_name.toLowerCase().includes(q) || f.vendor_name.toLowerCase().includes(q)
  );

  $("menuBody").innerHTML = rows.length
    ? rows.map(f => `
      <tr>
        <td class="td-id">#${f.food_id}</td>
        <td class="td-strong">${f.item_name}</td>
        <td class="td-desc">${f.description}</td>
        <td class="td-amount">${fmt(f.price)}</td>
        <td>${f.vendor_name}</td>
        <td><span class="badge badge-${f.is_available ? "available" : "unavailable"}">${f.is_available ? "Available" : "Unavailable"}</span></td>
        <td class="td-muted">${fmtDate(f.updated_at)}</td>
        <td style="white-space:nowrap">
          <button class="btn-icon-sm" data-edit="${f.food_id}" title="Edit"><i class="fas fa-pen"></i></button>
          <button class="btn-icon-sm" data-toggle="${f.food_id}" title="${f.is_available ? "Mark unavailable" : "Mark available"}">
            <i class="fas fa-${f.is_available ? "eye-slash" : "eye"}"></i>
          </button>
          <button class="btn-icon-sm danger" data-delete="${f.food_id}" title="Delete"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`).join("")
    : `<tr><td colspan="8" class="table-empty"><i class="fas fa-utensils"></i>No items found</td></tr>`;
}

$("menuSearch").addEventListener("input", renderMenu);

$("menuBody").addEventListener("click", (e) => {
  const edit   = e.target.closest("[data-edit]");
  const toggle = e.target.closest("[data-toggle]");
  const del    = e.target.closest("[data-delete]");

  if (edit)   openEditItem(parseInt(edit.dataset.edit));
  if (toggle) toggleAvailability(parseInt(toggle.dataset.toggle));
  if (del)    deleteItem(parseInt(del.dataset.delete));
});

function toggleAvailability(id) {
  const f = DB.food.find(x => x.food_id === id);
  if (!f) return;
  f.is_available = f.is_available ? 0 : 1;
  f.updated_at = Date.now();
  renderMenu();
  renderOverview();
  showToast(f.item_name + " marked as " + (f.is_available ? "available" : "unavailable"));
}

function deleteItem(id) {
  if (!confirm("Delete this menu item? This cannot be undone.")) return;
  DB.food = DB.food.filter(x => x.food_id !== id);
  renderMenu();
  renderOverview();
  showToast("Item deleted");
}

/* ---- Modal ---- */
function populateVendorDropdown(selectedVendorId) {
  const vendors = DB.users.filter(u => u.role === "vendor");
  $("fi-vendor").innerHTML = `<option value="">Select vendor</option>`
    + vendors.map(v => `<option value="${v.user_id}"${v.user_id === selectedVendorId ? " selected" : ""}>${v.full_name}</option>`).join("");
}

function openAddItem() {
  DB.editId = null;
  $("modalTitle").textContent = "Add Menu Item";
  $("fi-name").value  = "";
  $("fi-price").value = "";
  $("fi-desc").value  = "";
  $("fi-avail").value = "1";
  populateVendorDropdown(null);
  $("itemModal").classList.add("open");
}

function openEditItem(id) {
  const f = DB.food.find(x => x.food_id === id);
  if (!f) return;
  DB.editId = id;
  $("modalTitle").textContent = "Edit Menu Item";
  $("fi-name").value  = f.item_name;
  $("fi-price").value = f.price;
  $("fi-desc").value  = f.description;
  $("fi-avail").value = f.is_available ? "1" : "0";
  populateVendorDropdown(f.managed_by);
  $("itemModal").classList.add("open");
}

function closeModal() {
  $("itemModal").classList.remove("open");
}

function saveItem() {
  const name  = $("fi-name").value.trim();
  const price = parseFloat($("fi-price").value);
  const desc  = $("fi-desc").value.trim();
  const vid   = parseInt($("fi-vendor").value);
  const avail = $("fi-avail").value === "1" ? 1 : 0;

  if (!name || isNaN(price) || !vid) {
    showToast("Please fill all required fields");
    return;
  }

  const vendor = DB.users.find(u => u.user_id === vid);

  if (DB.editId) {
    const f = DB.food.find(x => x.food_id === DB.editId);
    if (f) {
      Object.assign(f, {
        item_name: name, price, description: desc,
        managed_by: vid, vendor_name: vendor.full_name,
        is_available: avail, updated_at: Date.now()
      });
      showToast("Item updated successfully");
    }
  } else {
    const newId = Math.max(0, ...DB.food.map(x => x.food_id)) + 1;
    DB.food.push({
      food_id: newId, item_name: name, description: desc,
      price, is_available: avail, managed_by: vid,
      vendor_name: vendor.full_name,
      created_at: Date.now(), updated_at: Date.now()
    });
    showToast("Item added successfully");
  }

  closeModal();
  renderMenu();
  renderOverview();
}

$("addItemBtn").addEventListener("click", openAddItem);
$("modalClose").addEventListener("click", closeModal);
$("modalCancel").addEventListener("click", closeModal);
$("modalSave").addEventListener("click", saveItem);

$("itemModal").addEventListener("click", (e) => {
  if (e.target === $("itemModal")) closeModal();
});

/* ============================================================
   SALES
   ============================================================ */
function renderSales() {
  const completed = DB.payments.filter(p => p.status === "completed");
  const total     = completed.reduce((s, p) => s + p.amount, 0);
  const compOrds  = DB.orders.filter(o => o.status === "completed" || o.status === "delivered").length;
  const avg       = compOrds ? Math.round(total / compOrds) : 0;

  $("sr-total").textContent     = fmt(total);
  $("sr-completed").textContent = compOrds;
  $("sr-avg").textContent       = fmt(avg);

  /* Payment log */
  $("paymentsBody").innerHTML = DB.payments
    .slice().sort((a, b) => b.paid_at - a.paid_at)
    .map(p => `
      <tr>
        <td class="td-id">#PAY-${String(p.payment_id).padStart(3, "0")}</td>
        <td class="td-id">#ORD-${String(p.order_id).padStart(3, "0")}</td>
        <td style="text-transform:capitalize">${p.method}</td>
        <td class="td-amount">${fmt(p.amount)}</td>
        <td><span class="badge badge-${p.status === "completed" ? "paid" : p.status}">${p.status}</span></td>
        <td class="td-muted">${fmtDateTime(p.paid_at)}</td>
      </tr>`).join("");
}

/* ============================================================
   USERS
   ============================================================ */
function renderUsers() {
  const q  = $("userSearch").value.toLowerCase().trim();
  const rf = $("userRoleFilter").value;

  const rows = DB.users.filter(u => {
    const m  = !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const r  = !rf || u.role === rf;
    return m && r;
  });

  $("userCount").textContent = rows.length + " user" + (rows.length !== 1 ? "s" : "");

  $("usersBody").innerHTML = rows.length
    ? rows.map(u => `
      <tr>
        <td class="td-id">#${u.user_id}</td>
        <td class="td-strong">${u.full_name}</td>
        <td style="color:var(--text-secondary)">${u.email}</td>
        <td style="color:var(--text-secondary)">${u.phone}</td>
        <td><span class="badge badge-${u.role}">${u.role}</span></td>
        <td class="td-muted">${fmtDate(u.created_at)}</td>
      </tr>`).join("")
    : `<tr><td colspan="6" class="table-empty"><i class="fas fa-users"></i>No users found</td></tr>`;
}

$("userSearch").addEventListener("input", renderUsers);
$("userRoleFilter").addEventListener("change", renderUsers);

/* ============================================================
   TOAST
   ============================================================ */
let toastTimer = null;

function showToast(msg) {
  $("toastMsg").textContent = msg;
  const toast = $("toast");
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

/* ============================================================
   LOGOUT
   ============================================================ */
function initializeLogout() {
  const logoutBtn = document.getElementById("adminLogoutBtn");
  if (!logoutBtn) return;
  
  logoutBtn.addEventListener("click", function() {
    // Clear authentication data
    localStorage.removeItem("quickbite-auth-user");
    localStorage.removeItem("quickbite-profile");
    
    // Redirect to home page
    window.location.href = "index.html";
  });
}

/* ============================================================
   INIT
   ============================================================ */
(function init() {
  // Auth guard - check if user is logged in and is admin
  try {
    const user = JSON.parse(localStorage.getItem("quickbite-auth-user"));
    if (!user || !user.email) {
      // Not logged in, redirect to home page
      window.location.replace("index.html");
      return;
    }
    
    if (user.role !== "admin") {
      // Not an admin, redirect to appropriate dashboard
      if (user.role === "vendor") {
        window.location.replace("vendor-dashboard.html");
      } else {
        window.location.replace("customer-dashboard.html");
      }
      return;
    }
  } catch (error) {
    window.location.replace("index.html");
    return;
  }
  
  renderOverview();
  /* Pre-render other pages in background so data is ready */
  renderOrders();
  renderMenu();
  renderUsers();
  /* Sales uses random data so render on demand */
  
  // Initialize logout button
  initializeLogout();
})();
