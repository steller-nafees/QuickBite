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

  function parseDateLike(value) {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

    const raw = String(value).trim();
    if (!raw) return null;

    const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
    const direct = new Date(normalized);
    if (!Number.isNaN(direct.getTime())) return direct;

    const fallback = new Date(raw);
    if (!Number.isNaN(fallback.getTime())) return fallback;

    const timeMatch = raw.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
    if (!timeMatch) return null;

    let hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const meridiem = timeMatch[3].toUpperCase();

    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;

    const today = new Date();
    const parsed = new Date(today);
    parsed.setHours(hours, minutes, 0, 0);
    return parsed;
  }

  function formatPickupTime(value) {
    const parsed = parseDateLike(value);
    if (!parsed) return String(value || "—");

    return parsed.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function formatPickupDate(value) {
    const parsed = parseDateLike(value);
    if (!parsed) return "Today";

    return parsed.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  }

  function getCountdownParts(value, nowTs) {
    const parsed = parseDateLike(value);
    if (!parsed) {
      return { label: "Pickup time unavailable", tone: "muted", short: "—" };
    }

    const diffMs = parsed.getTime() - nowTs;
    if (diffMs <= 0) {
      return { label: "Ready for pickup", tone: "ready", short: "Now" };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return {
        label: `${hours}h ${String(minutes).padStart(2, "0")}m left`,
        tone: "normal",
        short: `${hours}h ${minutes}m`,
      };
    }

    if (minutes > 0) {
      return {
        label: `${minutes}m ${String(seconds).padStart(2, "0")}s left`,
        tone: minutes <= 5 ? "urgent" : "normal",
        short: `${minutes}m`,
      };
    }

    return {
      label: `${seconds}s left`,
      tone: "urgent",
      short: `${seconds}s`,
    };
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
      localStorage.removeItem("quickbite-auth-token");
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

  function OrdersEmptyState({ icon, title, message, hint, actionLabel, actionHref, className }) {
    return React.createElement(
      "article",
      { className: "qb-orders-empty" + (className ? " " + className : "") },
      React.createElement(
        "div",
        { className: "qb-orders-empty-icon", "aria-hidden": "true" },
        React.createElement("i", { className: icon })
      ),
      React.createElement(
        "div",
        { className: "qb-orders-empty-copy" },
        React.createElement("h4", { className: "qb-orders-empty-title" }, title),
        React.createElement("p", { className: "qb-orders-empty-message" }, message),
        hint ? React.createElement("span", { className: "qb-orders-empty-hint" }, hint) : null
      ),
      actionLabel && actionHref
        ? React.createElement(
          "a",
          { className: "qb-orders-empty-action", href: actionHref },
          actionLabel
        )
        : null
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
                className: "reorder-btn",
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
    const [nowTs, setNowTs] = useState(Date.now());

    useEffect(() => {
      if (tab !== "current" || !currentOrders.length) return undefined;

      const timer = window.setInterval(() => {
        setNowTs(Date.now());
      }, 1000);

      return () => window.clearInterval(timer);
    }, [tab, currentOrders.length]);

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
            ? React.createElement(OrdersEmptyState, {
              icon: "fas fa-burger",
              title: "No active orders on the grill",
              message: "Your snack mission is currently on standby.",
              hint: "Place an order and we will start the campus food drama immediately.",
              actionLabel: "Browse Menu",
              actionHref: "menu.html",
            })
            : React.createElement(
              "div",
              { className: "qb-card-row" },
              currentOrders.map((order) => {
                const countdown = getCountdownParts(order.pickup_time, nowTs);
                const pickupTime = formatPickupTime(order.pickup_time);
                const pickupDate = formatPickupDate(order.pickup_time);
                const itemCount = (order.items || []).reduce((sum, it) => sum + Number(it.quantity || 0), 0);

                return React.createElement(
                  "article",
                  { className: "qb-card qb-current-order", key: order.order_id },
                  React.createElement(
                    "div",
                    { className: "qb-card-top qb-current-order-top" },
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
                    { className: "qb-pickup-hero" },
                    React.createElement(
                      "div",
                      { className: "qb-pickup-main" },
                      React.createElement("span", { className: "qb-pickup-label" }, "Pickup time"),
                      React.createElement("strong", { className: "qb-pickup-time" }, pickupTime),
                      React.createElement("span", { className: "qb-pickup-date" }, pickupDate)
                    ),
                    React.createElement(
                      "div",
                      {
                        className: "qb-countdown-badge qb-countdown-" + countdown.tone,
                        "aria-live": "polite",
                      },
                      React.createElement("span", { className: "qb-countdown-mini" }, "Remaining"),
                      React.createElement("strong", { className: "qb-countdown-value" }, countdown.short),
                      React.createElement("span", { className: "qb-countdown-text" }, countdown.label)
                    )
                  ),
                  React.createElement(
                    "div",
                    { className: "qb-card-summary qb-current-summary" },
                    React.createElement(
                      "div",
                      { className: "qb-summary-block" },
                      React.createElement("span", { className: "qb-summary-label" }, "Items"),
                      React.createElement("strong", { className: "qb-summary-value" }, String(itemCount))
                    ),
                    React.createElement(
                      "div",
                      { className: "qb-summary-block" },
                      React.createElement("span", { className: "qb-summary-label" }, "Payment"),
                      React.createElement("strong", { className: "qb-summary-value" }, order.payment?.method || "—")
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
                    React.createElement("div", null, React.createElement("span", { className: "qb-meta-k" }, "Placed"), React.createElement("span", { className: "qb-meta-v" }, formatPickupTime(order.created_at) + " " + String(formatPickupDate(order.created_at))))
                  )
                );
              })
            )
        )
        : tab === "past"
          ? React.createElement(
            "section",
            { className: "qb-section" },
            React.createElement("h3", { className: "qb-section-title" }, "Past Orders"),
            sortedPast.length === 0
              ? React.createElement(OrdersEmptyState, {
                icon: "fas fa-utensils",
                title: "No past orders yet",
                message: "You haven't eaten anything from QuickBite yet... suspicious behavior for a hungry student.",
                hint: "Order once and your snack history will start living here.",
                actionLabel: "Find Something Tasty",
                actionHref: "menu.html",
              })
              : React.createElement(
                React.Fragment,
                null,
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

    async function saveProfile() {
      try {
        const result = await window.QuickBiteApi.updateProfile({
          fullName: fullName.trim(),
          phone: phone.trim()
        });
        onSaveUser(result.user);
        notify("Profile saved.", "success");
      } catch (error) {
        notify(error.message, "err");
      }
    }

    async function changePassword() {
      if (!currentPw || !newPw) { notify("Please fill current and new password.", "err"); return; }
      if (newPw.length < 8) { notify("New password must be at least 8 characters.", "err"); return; }
      if (newPw !== confirmPw) { notify("Passwords do not match.", "err"); return; }
      try {
        await window.QuickBiteApi.updatePassword({
          currentPassword: currentPw,
          newPassword: newPw,
          confirmPassword: confirmPw
        });
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
        notify("Password updated.", "success");
      } catch (error) {
        notify(error.message, "err");
      }
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
    const [data, setData] = useState({ currentOrders: [], pastOrders: [] });

    useEffect(() => {
      const u = readAuthUser();
      if (!u) { window.location.replace("index.html"); return; }
      const role = String(u.role || "customer").toLowerCase();
      if (role === "vendor" || role === "admin") { window.location.replace("admin-dashboard.html"); return; }
      setUser(u);

      window.QuickBiteApi.getMyOrders()
        .then(function (result) {
          setData({
            currentOrders: result.currentOrders || [],
            pastOrders: result.pastOrders || []
          });
        })
        .catch(function (error) {
          setData({ currentOrders: [], pastOrders: [] });
          notify(error.message, "err");
        });
    }, []);

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
