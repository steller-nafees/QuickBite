(function () {
  const React = window.React;
  const ReactDOM = window.ReactDOM;

  if (!React || !ReactDOM) {
    const root = document.getElementById("customerDashboardRoot");
    if (root) root.textContent = "React is required to render this dashboard.";
    return;
  }

  const { useEffect, useMemo, useState } = React;

  function formatMoney(amount) {
    const n = Number(amount || 0);
    return "৳" + n.toFixed(2);
  }

  function formatDate(dateString) {
    try {
      const d = new Date(dateString);
      if (Number.isNaN(d.getTime())) return String(dateString || "");
      return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
    } catch (e) {
      return String(dateString || "");
    }
  }

  function getInitials(name) {
    const text = String(name || "").trim();
    if (!text) return "C";
    const parts = text.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "C";
    const second = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + second).toUpperCase();
  }

  function readAuthUser() {
    try {
      const raw = localStorage.getItem("quickbite-auth-user");
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && parsed.email ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function writeAuthUser(user) {
    try {
      localStorage.setItem("quickbite-auth-user", JSON.stringify(user));
    } catch (e) {
      // ignore
    }
  }

  function signOut() {
    try {
      localStorage.removeItem("quickbite-auth-user");
      localStorage.removeItem("quickbite-profile");
    } catch (e) {
      // ignore
    }
    window.location.href = "index.html";
  }

  function ghostButtonStyle() {
    return {
      background: "transparent",
      color: "var(--color-white)",
      border: "1px solid currentColor",
      borderRadius: 10,
      padding: "10px 14px",
      fontFamily: "var(--font-label)",
      fontWeight: 700,
      cursor: "pointer",
    };
  }

  function primaryButtonStyle() {
    return {
      background: "var(--gradient-button-primary)",
      color: "var(--color-white)",
      border: "0",
      borderRadius: 10,
      padding: "10px 14px",
      fontFamily: "var(--font-label)",
      fontWeight: 700,
      cursor: "pointer",
    };
  }

  function textButtonStyle() {
    return {
      background: "transparent",
      border: "0",
      padding: 0,
      color: "var(--color-red)",
      fontFamily: "var(--font-label)",
      fontWeight: 700,
      cursor: "pointer",
    };
  }

  function StatusPill({ status }) {
    const s = String(status || "").toLowerCase();
    const config =
      s === "pending"
        ? { bg: "var(--color-cream)", color: "var(--color-red)" }
        : s === "preparing"
          ? { bg: "var(--color-cream-muted)", color: "var(--color-black)" }
          : s === "ready"
            ? { bg: "var(--color-cream-light)", color: "var(--color-black)" }
            : s === "delivered"
              ? { bg: "var(--color-red-dark)", color: "var(--color-cream-light)" }
              : { bg: "var(--color-red)", color: "var(--color-white)" };

    return React.createElement(
      "span",
      {
        className: "qb-pill",
        style: {
          background: config.bg,
          color: config.color,
        },
      },
      s ? s.charAt(0).toUpperCase() + s.slice(1) : "—"
    );
  }

  function deriveMostOrderedItem(pastOrders) {
    const counts = new Map();
    (pastOrders || []).forEach((order) => {
      (order.items || []).forEach((it) => {
        const key = String(it.item_name || "").trim();
        if (!key) return;
        const prev = counts.get(key) || 0;
        counts.set(key, prev + Number(it.quantity || 0));
      });
    });

    let top = null;
    counts.forEach((qty, name) => {
      if (!top || qty > top.quantity) {
        top = { item_name: name, quantity: qty };
      }
    });

    return top;
  }

  function buildMockData() {
    const currentOrders = [
      {
        order_id: "QB-10421",
        created_at: "2026-04-13T08:42:00.000Z",
        pickup_time: "12:20 PM",
        status: "pending",
        total_amount: 280,
        items: [
          { item_name: "Chicken Burger", quantity: 1, unit_price: 160 },
          { item_name: "Fries", quantity: 1, unit_price: 60 },
          { item_name: "Cola", quantity: 1, unit_price: 60 },
        ],
        payment: { method: "Bkash", status: "paid" },
      },
      {
        order_id: "QB-10411",
        created_at: "2026-04-13T07:55:00.000Z",
        pickup_time: "12:05 PM",
        status: "preparing",
        total_amount: 430,
        items: [
          { item_name: "Beef Burger", quantity: 1, unit_price: 220 },
          { item_name: "Fries", quantity: 2, unit_price: 60 },
          { item_name: "Iced Tea", quantity: 1, unit_price: 90 },
        ],
        payment: { method: "Cash", status: "unpaid" },
      },
      {
        order_id: "QB-10398",
        created_at: "2026-04-13T06:31:00.000Z",
        pickup_time: "11:40 AM",
        status: "ready",
        total_amount: 320,
        items: [
          { item_name: "Chicken Wrap", quantity: 2, unit_price: 140 },
          { item_name: "Mineral Water", quantity: 1, unit_price: 40 },
        ],
        payment: { method: "Nagad", status: "paid" },
      },
    ];

    const pastOrders = [
      {
        order_id: "QB-10365",
        created_at: "2026-04-10T10:12:00.000Z",
        pickup_time: "01:10 PM",
        status: "delivered",
        total_amount: 360,
        items: [
          { item_name: "Chicken Burger", quantity: 2, unit_price: 160 },
          { item_name: "Cola", quantity: 1, unit_price: 40 },
        ],
        payment: { method: "Bkash", status: "paid" },
      },
      {
        order_id: "QB-10312",
        created_at: "2026-04-06T09:42:00.000Z",
        pickup_time: "12:30 PM",
        status: "completed",
        total_amount: 540,
        items: [
          { item_name: "Beef Burger", quantity: 2, unit_price: 220 },
          { item_name: "Fries", quantity: 1, unit_price: 60 },
          { item_name: "Cola", quantity: 1, unit_price: 40 },
        ],
        payment: { method: "Card", status: "paid" },
      },
      {
        order_id: "QB-10288",
        created_at: "2026-04-02T11:05:00.000Z",
        pickup_time: "01:00 PM",
        status: "delivered",
        total_amount: 420,
        items: [
          { item_name: "Chicken Burger", quantity: 1, unit_price: 160 },
          { item_name: "Chicken Wrap", quantity: 1, unit_price: 140 },
          { item_name: "Fries", quantity: 1, unit_price: 60 },
          { item_name: "Iced Tea", quantity: 1, unit_price: 60 },
        ],
        payment: { method: "Bkash", status: "paid" },
      },
      {
        order_id: "QB-10231",
        created_at: "2026-03-29T08:36:00.000Z",
        pickup_time: "12:10 PM",
        status: "completed",
        total_amount: 300,
        items: [
          { item_name: "Fries", quantity: 2, unit_price: 60 },
          { item_name: "Chicken Burger", quantity: 1, unit_price: 160 },
        ],
        payment: { method: "Cash", status: "paid" },
      },
      {
        order_id: "QB-10192",
        created_at: "2026-03-24T09:18:00.000Z",
        pickup_time: "12:40 PM",
        status: "delivered",
        total_amount: 280,
        items: [
          { item_name: "Chicken Burger", quantity: 1, unit_price: 160 },
          { item_name: "Cola", quantity: 2, unit_price: 60 },
        ],
        payment: { method: "Nagad", status: "paid" },
      },
      {
        order_id: "QB-10110",
        created_at: "2026-03-18T10:52:00.000Z",
        pickup_time: "01:15 PM",
        status: "completed",
        total_amount: 410,
        items: [
          { item_name: "Chicken Wrap", quantity: 2, unit_price: 140 },
          { item_name: "Fries", quantity: 1, unit_price: 60 },
          { item_name: "Mineral Water", quantity: 1, unit_price: 70 },
        ],
        payment: { method: "Bkash", status: "paid" },
      },
      {
        order_id: "QB-10071",
        created_at: "2026-03-12T09:05:00.000Z",
        pickup_time: "12:20 PM",
        status: "delivered",
        total_amount: 480,
        items: [
          { item_name: "Beef Burger", quantity: 1, unit_price: 220 },
          { item_name: "Chicken Burger", quantity: 1, unit_price: 160 },
          { item_name: "Iced Tea", quantity: 1, unit_price: 100 },
        ],
        payment: { method: "Card", status: "paid" },
      },
    ];

    return { currentOrders, pastOrders };
  }

  function OrdersTab({ currentOrders, pastOrders, mostOrderedItem }) {
    const [tab, setTab] = useState("current");
    const [pastLimit, setPastLimit] = useState(6);

    const sortedPast = useMemo(() => {
      return [...pastOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [pastOrders]);

    const shownPast = useMemo(() => sortedPast.slice(0, pastLimit), [sortedPast, pastLimit]);

    const heroTitle = mostOrderedItem?.item_name || "Your Favourite Item";
    const heroSub = mostOrderedItem
      ? `Ordered ${mostOrderedItem.quantity} times across your past orders.`
      : "We’ll highlight the item you order most.";

    return React.createElement(
      "div",
      { className: "qb-stack" },
      React.createElement(
        "section",
        { className: "qb-hero-card" },
        React.createElement(
          "div",
          { className: "qb-hero-left" },
          React.createElement(
            "div",
            { className: "qb-badge" },
            React.createElement("i", { className: "fa-solid fa-heart" }),
            React.createElement("span", null, "Your Favourite")
          ),
          React.createElement("h2", { className: "qb-hero-title" }, heroTitle),
          React.createElement("p", { className: "qb-hero-sub" }, heroSub),
          React.createElement(
            "button",
            {
              type: "button",
              className: "qb-btn qb-btn-ghost",
              onClick: function () {
                window.alert("Reorder added (mock).");
              },
            },
            "Reorder"
          )
        ),
        React.createElement(
          "div",
          { className: "qb-hero-right" },
          React.createElement("div", { className: "qb-hero-img", role: "img", "aria-label": "Food placeholder image" })
        )
      ),
      React.createElement(
        "div",
        { className: "qb-tabs" },
        React.createElement(
          "button",
          { type: "button", className: "qb-tab" + (tab === "current" ? " is-active" : ""), onClick: () => setTab("current") },
          "Current Orders"
        ),
        React.createElement(
          "button",
          { type: "button", className: "qb-tab" + (tab === "past" ? " is-active" : ""), onClick: () => setTab("past") },
          "Past Orders"
        )
      ),
      tab === "current"
        ? React.createElement(
            "section",
            { className: "qb-section" },
            React.createElement("h3", { className: "qb-section-title" }, "Current Orders"),
            currentOrders.length === 0
              ? React.createElement("p", { className: "qb-empty" }, "No active orders right now. Place an order and it will show up here.")
              : React.createElement(
                  "div",
                  { className: "qb-card-row" },
                  currentOrders.map((order) =>
                    React.createElement(
                      "article",
                      { className: "qb-card", key: order.order_id },
                      React.createElement(
                        "div",
                        { className: "qb-card-top" },
                        React.createElement("div", { className: "qb-card-id" }, order.order_id),
                        React.createElement(StatusPill, { status: order.status })
                      ),
                      React.createElement(
                        "ul",
                        { className: "qb-items" },
                        (order.items || []).map((it, idx) =>
                          React.createElement(
                            "li",
                            { className: "qb-item", key: order.order_id + ":" + idx },
                            React.createElement("span", { className: "qb-item-name" }, it.item_name),
                            React.createElement("span", { className: "qb-item-meta" }, "× " + it.quantity)
                          )
                        )
                      ),
                      React.createElement(
                        "div",
                        { className: "qb-card-meta" },
                        React.createElement("div", null, React.createElement("span", { className: "qb-meta-k" }, "Total"), React.createElement("span", { className: "qb-meta-v" }, formatMoney(order.total_amount))),
                        React.createElement("div", null, React.createElement("span", { className: "qb-meta-k" }, "Pickup"), React.createElement("span", { className: "qb-meta-v" }, String(order.pickup_time || "—")))
                      )
                    )
                  )
                )
          )
        : React.createElement(
            "section",
            { className: "qb-section" },
            React.createElement("h3", { className: "qb-section-title" }, "Past Orders"),
            React.createElement(
              "div",
              { className: "qb-table-wrap" },
              React.createElement(
                "table",
                { className: "qb-table" },
                React.createElement(
                  "thead",
                  null,
                  React.createElement(
                    "tr",
                    null,
                    React.createElement("th", null, "Order ID"),
                    React.createElement("th", null, "Date"),
                    React.createElement("th", null, "Items"),
                    React.createElement("th", null, "Total"),
                    React.createElement("th", null, "Payment"),
                    React.createElement("th", null, "Status"),
                    React.createElement("th", { style: { width: 90 } }, "")
                  )
                ),
                React.createElement(
                  "tbody",
                  null,
                  shownPast.map((order) =>
                    React.createElement(
                      "tr",
                      { key: order.order_id },
                      React.createElement("td", { className: "qb-td-strong" }, order.order_id),
                      React.createElement("td", null, formatDate(order.created_at)),
                      React.createElement(
                        "td",
                        null,
                        (order.items || [])
                          .slice(0, 2)
                          .map((it) => `${it.item_name} × ${it.quantity}`)
                          .join(", ") + ((order.items || []).length > 2 ? "…" : "")
                      ),
                      React.createElement("td", null, formatMoney(order.total_amount)),
                      React.createElement("td", null, `${order.payment?.method || "—"} • ${order.payment?.status || "—"}`),
                      React.createElement(
                        "td",
                        null,
                        React.createElement(StatusPill, { status: order.status === "completed" ? "completed" : "delivered" })
                      ),
                      React.createElement(
                        "td",
                        { style: { textAlign: "right" } },
                        React.createElement(
                          "button",
                          {
                            type: "button",
                            className: "qb-link",
                            onClick: function () {
                              window.alert("Reorder added (mock).");
                            },
                          },
                          "Reorder"
                        )
                      )
                    )
                  )
                )
              )
            ),
            sortedPast.length > shownPast.length
              ? React.createElement(
                  "div",
                  { className: "qb-view-more" },
                  React.createElement(
                    "button",
                    { type: "button", className: "qb-btn qb-btn-primary", onClick: () => setPastLimit((n) => Math.min(n + 4, sortedPast.length)) },
                    "View More"
                  )
                )
              : null
          )
    );
  }

  function SettingsSection({ user, onSaveUser }) {
    const [fullName, setFullName] = useState(user?.fullName || user?.name || "");
    const [email] = useState(user?.email || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [toast, setToast] = useState(null);

    function showToast(message, type) {
      setToast({ message, type: type || "ok" });
      window.setTimeout(() => setToast(null), 2200);
    }

    function saveProfile() {
      const next = Object.assign({}, user || {}, { fullName: fullName.trim(), phone: phone.trim() });
      onSaveUser(next);
      showToast("Profile saved.", "ok");
    }

    function changePassword() {
      if (!currentPw || !newPw) {
        showToast("Please fill current and new password.", "err");
        return;
      }
      if (newPw.length < 8) {
        showToast("New password must be at least 8 characters.", "err");
        return;
      }
      if (newPw !== confirmPw) {
        showToast("Passwords do not match.", "err");
        return;
      }
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      showToast("Password updated (mock).", "ok");
    }

    return React.createElement(
      "section",
      { className: "qb-section" },
      React.createElement("h3", { className: "qb-section-title" }, "Basic Settings"),
      toast
        ? React.createElement(
            "div",
            { className: "qb-toast" + (toast.type === "err" ? " is-error" : "") },
            React.createElement("i", { className: toast.type === "err" ? "fa-solid fa-triangle-exclamation" : "fa-solid fa-circle-check" }),
            React.createElement("span", null, toast.message)
          )
        : null,
      React.createElement(
        "div",
        { className: "qb-settings-grid" },
        React.createElement(
          "div",
          { className: "qb-card qb-card-pad" },
          React.createElement("div", { className: "qb-card-head" }, React.createElement("span", { className: "qb-card-title" }, "Profile"), React.createElement("button", { type: "button", className: "qb-link", onClick: saveProfile }, "Save")),
          React.createElement(
            "div",
            { className: "qb-form" },
            React.createElement(
              "label",
              { className: "qb-field" },
              React.createElement("span", { className: "qb-label" }, "Name"),
              React.createElement("input", { className: "qb-input", value: fullName, onChange: (e) => setFullName(e.target.value), placeholder: "Your full name" })
            ),
            React.createElement(
              "label",
              { className: "qb-field" },
              React.createElement("span", { className: "qb-label" }, "Email"),
              React.createElement("input", { className: "qb-input", value: email, disabled: true })
            ),
            React.createElement(
              "label",
              { className: "qb-field" },
              React.createElement("span", { className: "qb-label" }, "Phone Number"),
              React.createElement("input", { className: "qb-input", value: phone, onChange: (e) => setPhone(e.target.value), placeholder: "+8801XXXXXXXXX" })
            )
          )
        ),
        React.createElement(
          "div",
          { className: "qb-card qb-card-pad" },
          React.createElement("div", { className: "qb-card-head" }, React.createElement("span", { className: "qb-card-title" }, "Password Change"), React.createElement("button", { type: "button", className: "qb-link", onClick: changePassword }, "Update")),
          React.createElement(
            "div",
            { className: "qb-form" },
            React.createElement(
              "label",
              { className: "qb-field" },
              React.createElement("span", { className: "qb-label" }, "Current Password"),
              React.createElement("input", { className: "qb-input", type: "password", value: currentPw, onChange: (e) => setCurrentPw(e.target.value), placeholder: "••••••••" })
            ),
            React.createElement(
              "label",
              { className: "qb-field" },
              React.createElement("span", { className: "qb-label" }, "New Password"),
              React.createElement("input", { className: "qb-input", type: "password", value: newPw, onChange: (e) => setNewPw(e.target.value), placeholder: "At least 8 characters" })
            ),
            React.createElement(
              "label",
              { className: "qb-field" },
              React.createElement("span", { className: "qb-label" }, "Confirm Password"),
              React.createElement("input", { className: "qb-input", type: "password", value: confirmPw, onChange: (e) => setConfirmPw(e.target.value), placeholder: "Repeat new password" })
            )
          )
        )
      )
    );
  }

  function CustomerDashboardApp() {
    const [user, setUser] = useState(readAuthUser());

    useEffect(() => {
      const u = readAuthUser();
      if (!u) {
        window.location.replace("index.html");
        return;
      }
      const role = String(u.role || "customer").toLowerCase();
      if (role === "vendor" || role === "admin") {
        window.location.replace("admin-dashboard.html");
        return;
      }
      setUser(u);
    }, []);

    const data = useMemo(() => buildMockData(), []);
    const mostOrderedItem = useMemo(() => deriveMostOrderedItem(data.pastOrders), [data.pastOrders]);

    const displayName = user?.fullName || user?.name || (user?.email ? user.email.split("@")[0] : "Customer");
    const initials = getInitials(displayName);

    function onSaveUser(nextUser) {
      writeAuthUser(nextUser);
      setUser(nextUser);
      try {
        const prev = JSON.parse(localStorage.getItem("quickbite-profile") || "null");
        const merged = Object.assign({}, prev || {}, { fullName: nextUser.fullName, email: nextUser.email, phone: nextUser.phone, role: nextUser.role });
        localStorage.setItem("quickbite-profile", JSON.stringify(merged));
      } catch (e) {
        // ignore
      }
    }

    return React.createElement(
      "div",
      { className: "qb-page" },
      React.createElement(
        "header",
        { className: "qb-navbar" },
        React.createElement(
          "div",
          { className: "qb-nav-inner" },
          React.createElement(
            "a",
            { className: "qb-brand", href: "index.html", "aria-label": "QuickBite Home" },
            React.createElement("span", { className: "qb-brand-name" }, "QuickBite")
          ),
          React.createElement(
            "div",
            { className: "qb-nav-right" },
            React.createElement("div", { className: "qb-user-name" }, displayName),
            React.createElement("div", { className: "qb-avatar", "aria-hidden": "true" }, initials),
            React.createElement(
              "button",
              { type: "button", className: "qb-btn qb-btn-ghost qb-signout", onClick: signOut, style: ghostButtonStyle() },
              "Sign out"
            )
          )
        )
      ),
      React.createElement(
        "main",
        { className: "qb-main" },
        React.createElement(
          "div",
          { className: "qb-container" },
          React.createElement(OrdersTab, { currentOrders: data.currentOrders, pastOrders: data.pastOrders, mostOrderedItem }),
          React.createElement(SettingsSection, { user, onSaveUser })
        )
      )
    );
  }

  const rootEl = document.getElementById("customerDashboardRoot");
  if (!rootEl) return;

  const root = ReactDOM.createRoot(rootEl);
  root.render(React.createElement(CustomerDashboardApp));
})();
