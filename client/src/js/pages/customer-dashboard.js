(function () {
  const React = window.React;
  const ReactDOM = window.ReactDOM;

  if (!React || !ReactDOM) {
    const root = document.getElementById("customerDashboardRoot");
    if (root) root.textContent = "React is required to render this dashboard.";
    return;
  }

  const { useEffect, useMemo, useState } = React;

  function notify(message, type) {
    if (typeof window.showToast === "function") {
      window.showToast(message, type === "err" ? "error" : type === "success" ? "success" : "info");
      return;
    }
    window.alert(message);
  }

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
    } catch (e) {}
  }

  function signOut() {
    try {
      localStorage.removeItem("quickbite-auth-user");
      localStorage.removeItem("quickbite-profile");
    } catch (e) {}
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
        style: { background: config.bg, color: config.color },
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
        vendor_name: "Burger Haus",
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
        vendor_name: "Grill Station",
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
        vendor_name: "Wrap & Roll",
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
        vendor_name: "Burger Haus",
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
        vendor_name: "Grill Station",
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
        vendor_name: "Wrap & Roll",
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
        vendor_name: "Burger Haus",
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
        vendor_name: "Sip & Bite",
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
        vendor_name: "Wrap & Roll",
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
        vendor_name: "Grill Station",
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

  /* ─── Expandable Past Order Row ─── */
  function PastOrderRow({ order }) {
    const [expanded, setExpanded] = useState(false);

    return React.createElement(
      "div",
      { className: "qb-past-order-group" },

      /* ── Summary row (always visible) ── */
      React.createElement(
        "div",
        {
          className: "qb-row qb-row-summary" + (expanded ? " is-open" : ""),
          onClick: () => setExpanded((v) => !v),
          role: "button",
          "aria-expanded": expanded,
          tabIndex: 0,
          onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded((v) => !v); } },
        },

        /* Order ID */
        React.createElement(
          "div",
          { className: "qb-col qb-strong" },
          order.order_id
        ),

        /* Date */
        React.createElement(
          "div",
          { className: "qb-col" },
          formatDate(order.created_at)
        ),

        /* Vendor */
        React.createElement(
          "div",
          { className: "qb-col qb-vendor-col" },
          React.createElement("span", { className: "qb-vendor-pill" }, order.vendor_name || "—")
        ),

        /* Total */
        React.createElement(
          "div",
          { className: "qb-col qb-total-col" },
          formatMoney(order.total_amount)
        ),

        /* Status */
        React.createElement(
          "div",
          { className: "qb-col" },
          React.createElement(StatusPill, {
            status: order.status === "completed" ? "completed" : "delivered",
          })
        ),

        /* Expand chevron */
        React.createElement(
          "div",
          { className: "qb-col qb-expand-col" },
          React.createElement(
            "span",
            { className: "qb-chevron" + (expanded ? " is-up" : "") },
            "▾"
          )
        )
      ),

      /* ── Expanded detail panel ── */
      expanded
        ? React.createElement(
          "div",
          { className: "qb-row-detail" },

          /* Items list */
          React.createElement(
            "div",
            { className: "qb-detail-section" },
            React.createElement("div", { className: "qb-detail-label" }, "Items"),
            React.createElement(
              "ul",
              { className: "qb-detail-items" },
              (order.items || []).map((it, idx) =>
                React.createElement(
                  "li",
                  { className: "qb-detail-item", key: idx },
                  React.createElement(
                    "span",
                    { className: "qb-detail-item-name" },
                    it.item_name,
                    React.createElement("span", { className: "qb-detail-item-qty" }, " × " + it.quantity)
                  ),
                  React.createElement(
                    "span",
                    { className: "qb-detail-item-price" },
                    formatMoney((it.unit_price || 0) * (it.quantity || 0))
                  )
                )
              )
            )
          ),

          /* Meta info */
          React.createElement(
            "div",
            { className: "qb-detail-meta" },

            React.createElement(
              "div",
              { className: "qb-detail-meta-block" },
              React.createElement("span", { className: "qb-detail-meta-label" }, "Vendor"),
              React.createElement("span", { className: "qb-detail-meta-value" }, order.vendor_name || "—")
            ),

            React.createElement(
              "div",
              { className: "qb-detail-meta-block" },
              React.createElement("span", { className: "qb-detail-meta-label" }, "Pickup time"),
              React.createElement("span", { className: "qb-detail-meta-value" }, order.pickup_time || "—")
            ),

            React.createElement(
              "div",
              { className: "qb-detail-meta-block" },
              React.createElement("span", { className: "qb-detail-meta-label" }, "Payment"),
              React.createElement(
                "span",
                { className: "qb-detail-meta-value" },
                (order.payment?.method || "—") + " · " + (order.payment?.status || "—")
              )
            ),

            React.createElement(
              "div",
              { className: "qb-detail-meta-block" },
              React.createElement("span", { className: "qb-detail-meta-label" }, "Total"),
              React.createElement("span", { className: "qb-detail-meta-value qb-detail-total" }, formatMoney(order.total_amount))
            )
          ),

          /* Reorder button */
          React.createElement(
            "div",
            { className: "qb-detail-actions" },
            React.createElement(
              "button",
              {
                type: "button",
                className: "qb-btn qb-btn-primary",
                onClick: (e) => { e.stopPropagation(); notify("Reorder added (mock).", "success"); },
              },
              "Reorder"
            )
          )
        )
        : null
    );
  }

  function OrdersTab({ currentOrders, pastOrders, mostOrderedItem, user, onSaveUser }) {
    const [tab, setTab] = useState("current");
    const [pastLimit, setPastLimit] = useState(6);

    const sortedPast = useMemo(() => {
      return [...pastOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [pastOrders]);

    const shownPast = useMemo(() => sortedPast.slice(0, pastLimit), [sortedPast, pastLimit]);

    return React.createElement(
      "div",
      { className: "qb-stack" },
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
        ),
        React.createElement(
          "button",
          { type: "button", className: "qb-tab" + (tab === "settings" ? " is-active" : ""), onClick: () => setTab("settings") },
          "Settings"
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
                    React.createElement(
                      "div",
                      { className: "qb-card-heading" },
                      React.createElement("div", { className: "qb-card-eyebrow" }, order.vendor_name || "Active Order"),
                      React.createElement("div", { className: "qb-card-id" }, order.order_id)
                    ),
                    React.createElement(StatusPill, { status: order.status })
                  ),
                  React.createElement(
                    "div",
                    { className: "qb-card-summary" },
                    React.createElement(
                      "div",
                      { className: "qb-summary-block" },
                      React.createElement("span", { className: "qb-summary-label" }, "Pickup"),
                      React.createElement("strong", { className: "qb-summary-value" }, String(order.pickup_time || "—"))
                    ),
                    React.createElement(
                      "div",
                      { className: "qb-summary-block" },
                      React.createElement("span", { className: "qb-summary-label" }, "Items"),
                      React.createElement("strong", { className: "qb-summary-value" }, String((order.items || []).length))
                    )
                  ),
                  React.createElement(
                    "ul",
                    { className: "qb-items" },
                    (order.items || []).map((it, idx) =>
                      React.createElement(
                        "li",
                        { className: "qb-item", key: order.order_id + ":" + idx },
                        React.createElement(
                          "div",
                          { className: "qb-item-main" },
                          React.createElement("span", { className: "qb-item-dot", "aria-hidden": "true" }),
                          React.createElement(
                            "div",
                            { className: "qb-item-copy" },
                            React.createElement("span", { className: "qb-item-name" }, it.item_name),
                            React.createElement("span", { className: "qb-item-price" }, formatMoney((it.unit_price || 0) * (it.quantity || 0)))
                          )
                        ),
                        React.createElement("span", { className: "qb-item-meta" }, "x " + it.quantity)
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
        : tab === "past"
          ? React.createElement(
            "section",
            { className: "qb-section" },
            React.createElement("h3", { className: "qb-section-title" }, "Past Orders"),

            /* Column header row */
            React.createElement(
              "div",
              { className: "qb-row qb-row-header" },
              React.createElement("div", { className: "qb-col qb-col-header" }, "Order ID"),
              React.createElement("div", { className: "qb-col qb-col-header" }, "Date"),
              React.createElement("div", { className: "qb-col qb-col-header" }, "Vendor"),
              React.createElement("div", { className: "qb-col qb-col-header" }, "Total"),
              React.createElement("div", { className: "qb-col qb-col-header" }, "Status"),
              React.createElement("div", { className: "qb-col" })
            ),

            React.createElement(
              "div",
              { className: "qb-table-modern" },
              shownPast.map((order) =>
                React.createElement(PastOrderRow, { key: order.order_id, order })
              )
            ),

            sortedPast.length > shownPast.length
              ? React.createElement(
                "div",
                { className: "qb-view-more" },
                React.createElement(
                  "button",
                  {
                    type: "button",
                    className: "qb-btn qb-btn-primary",
                    onClick: () => setPastLimit((n) => Math.min(n + 4, sortedPast.length)),
                  },
                  "View More"
                )
              )
              : null
          )
          : React.createElement(SettingsSection, { user, onSaveUser })
    );
  }

  function SettingsSection({ user, onSaveUser }) {
    const [fullName, setFullName] = useState(user?.fullName || user?.name || "");
    const [email] = useState(user?.email || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");

    function saveProfile() {
      const next = Object.assign({}, user || {}, { fullName: fullName.trim(), phone: phone.trim() });
      onSaveUser(next);
      notify("Profile saved.", "success");
    }

    function changePassword() {
      if (!currentPw || !newPw) { notify("Please fill current and new password.", "err"); return; }
      if (newPw.length < 8) { notify("New password must be at least 8 characters.", "err"); return; }
      if (newPw !== confirmPw) { notify("Passwords do not match.", "err"); return; }
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      notify("Password updated (mock).", "success");
    }

    return React.createElement(
      "section",
      { className: "qb-section" },
      React.createElement("h3", { className: "qb-section-title" }, "Basic Settings"),
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
            React.createElement("label", { className: "qb-field" }, React.createElement("span", { className: "qb-label" }, "Name"), React.createElement("input", { className: "qb-input", value: fullName, onChange: (e) => setFullName(e.target.value), placeholder: "Your full name" })),
            React.createElement("label", { className: "qb-field" }, React.createElement("span", { className: "qb-label" }, "Email"), React.createElement("input", { className: "qb-input", value: email, disabled: true })),
            React.createElement("label", { className: "qb-field" }, React.createElement("span", { className: "qb-label" }, "Phone Number"), React.createElement("input", { className: "qb-input", value: phone, onChange: (e) => setPhone(e.target.value), placeholder: "+8801XXXXXXXXX" }))
          )
        ),
        React.createElement(
          "div",
          { className: "qb-card qb-card-pad" },
          React.createElement("div", { className: "qb-card-head" }, React.createElement("span", { className: "qb-card-title" }, "Password Change"), React.createElement("button", { type: "button", className: "qb-link", onClick: changePassword }, "Update")),
          React.createElement(
            "div",
            { className: "qb-form" },
            React.createElement("label", { className: "qb-field" }, React.createElement("span", { className: "qb-label" }, "Current Password"), React.createElement("input", { className: "qb-input", type: "password", value: currentPw, onChange: (e) => setCurrentPw(e.target.value), placeholder: "••••••••" })),
            React.createElement("label", { className: "qb-field" }, React.createElement("span", { className: "qb-label" }, "New Password"), React.createElement("input", { className: "qb-input", type: "password", value: newPw, onChange: (e) => setNewPw(e.target.value), placeholder: "At least 8 characters" })),
            React.createElement("label", { className: "qb-field" }, React.createElement("span", { className: "qb-label" }, "Confirm Password"), React.createElement("input", { className: "qb-input", type: "password", value: confirmPw, onChange: (e) => setConfirmPw(e.target.value), placeholder: "Repeat new password" }))
          )
        )
      )
    );
  }

  function CustomerDashboardApp() {
    const [user, setUser] = useState(readAuthUser());

    useEffect(() => {
      const u = readAuthUser();
      if (!u) { window.location.replace("index.html"); return; }
      const role = String(u.role || "customer").toLowerCase();
      if (role === "vendor" || role === "admin") { window.location.replace("admin-dashboard.html"); return; }
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
      } catch (e) {}
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
          React.createElement("a", { className: "qb-brand", href: "index.html", "aria-label": "QuickBite Home" }, React.createElement("span", { className: "qb-brand-name" }, "QuickBite")),
          React.createElement(
            "div",
            { className: "qb-nav-right" },
            React.createElement("div", { className: "qb-user-name" }, displayName),
            React.createElement("div", { className: "qb-avatar", "aria-hidden": "true" }, initials),
            React.createElement("button", { type: "button", className: "qb-btn qb-btn-ghost qb-signout", onClick: signOut, style: ghostButtonStyle() }, "Sign out")
          )
        )
      ),
      React.createElement(
        "main",
        { className: "qb-main" },
        React.createElement(
          "div",
          { className: "qb-container" },
          React.createElement(OrdersTab, { currentOrders: data.currentOrders, pastOrders: data.pastOrders, mostOrderedItem, user, onSaveUser })
        )
      )
    );
  }

  const rootEl = document.getElementById("customerDashboardRoot");
  if (!rootEl) return;
  const root = ReactDOM.createRoot(rootEl);
  root.render(React.createElement(CustomerDashboardApp));
})();