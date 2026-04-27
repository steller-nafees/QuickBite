(function () {
  const React = window.React;
  const ReactDOM = window.ReactDOM;

  if (!React || !ReactDOM) {
    const root = document.getElementById("customerDashboardRoot");
    if (root) root.textContent = "React is required to render this dashboard.";
    return;
  }

  const { useEffect, useMemo, useRef, useState } = React;

  const CUSTOMER_ORDER_POLL_MS = 15000;
  const CUSTOMER_ORDER_CACHE_KEY = "quickbite-customer-order-cache";

  function notify(message, type) {
    if (typeof window.showToast === "function") {
      window.showToast(message, type === "err" ? "error" : type === "success" ? "success" : "info");
      return;
    }
    window.alert(message);
  }

  function readStoredOrderCache() {
    try {
      const raw = localStorage.getItem(CUSTOMER_ORDER_CACHE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function writeStoredOrderCache(cache) {
    try {
      localStorage.setItem(CUSTOMER_ORDER_CACHE_KEY, JSON.stringify(cache || {}));
    } catch (error) {
      // ignore
    }
  }

  function toOrderSnapshotMap(orders) {
    return (orders || []).reduce(function (map, order) {
      if (!order || !order.order_id) return map;
      map[order.order_id] = {
        order_id: order.order_id,
        status: String(order.status || "").toLowerCase(),
        vendor_name: order.vendor_name || "",
      };
      return map;
    }, {});
  }

  function statusMessageForCustomer(order, nextStatus) {
    const vendorName = order.vendor_name ? " from " + order.vendor_name : "";
    const orderLabel = order.token || order.order_id || "your order";

    if (nextStatus === "preparing") return orderLabel + vendorName + " is now being prepared.";
    if (nextStatus === "ready") return orderLabel + vendorName + " is ready for pickup.";
    if (nextStatus === "completed" || nextStatus === "delivered") return orderLabel + vendorName + " has been completed.";
    if (nextStatus === "pending") return orderLabel + vendorName + " has been received.";
    return orderLabel + vendorName + " was updated to " + nextStatus + ".";
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
      localStorage.removeItem("quickbite-cart");
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

  const PASSWORD_STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
  const PASSWORD_STRENGTH_COLORS = ["", "#d64545", "#f0a500", "#57b846", "#16a34a"];

  function scorePassword(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }

  function DangerModal({ title, message, busy, onCancel, onConfirm, confirmLabel }) {
    useEffect(() => {
      function onKeyDown(event) {
        if (event.key === "Escape" && !busy) {
          onCancel();
        }
      }

      document.addEventListener("keydown", onKeyDown);
      return function cleanup() {
        document.removeEventListener("keydown", onKeyDown);
      };
    }, [busy, onCancel]);

    return React.createElement(
      "div",
      {
        style: {
          position: "fixed",
          inset: 0,
          background: "rgba(16, 18, 27, 0.62)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          zIndex: 1000,
        },
        onClick: busy ? undefined : onCancel,
      },
      React.createElement(
        "div",
        {
          role: "dialog",
          "aria-modal": "true",
          "aria-label": title,
          style: {
            width: "100%",
            maxWidth: 460,
            background: "var(--color-white)",
            color: "var(--color-black)",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 24px 80px rgba(0, 0, 0, 0.24)",
          },
          onClick: function (event) { event.stopPropagation(); },
        },
        React.createElement("div", { style: { display: "grid", gap: 12 } },
          React.createElement("span", {
            style: {
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 999,
              background: "rgba(198, 40, 40, 0.12)",
              color: "#b42318",
              fontSize: 22,
              fontWeight: 700,
            }
          }, "!"),
          React.createElement("h3", { style: { margin: 0, fontSize: 24, lineHeight: 1.2 } }, title),
          React.createElement("p", { style: { margin: 0, color: "rgba(17, 24, 39, 0.78)", lineHeight: 1.6 } }, message)
        ),
        React.createElement(
          "div",
          { style: { display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 22, flexWrap: "wrap" } },
          React.createElement(
            "button",
            {
              type: "button",
              onClick: onCancel,
              disabled: busy,
              style: {
                border: "1px solid rgba(17, 24, 39, 0.14)",
                background: "transparent",
                color: "var(--color-black)",
                borderRadius: 12,
                padding: "10px 16px",
                fontWeight: 700,
                cursor: busy ? "not-allowed" : "pointer",
              },
            },
            "Cancel"
          ),
          React.createElement(
            "button",
            {
              type: "button",
              onClick: onConfirm,
              disabled: busy,
              style: {
                border: "none",
                background: "#b42318",
                color: "var(--color-white)",
                borderRadius: 12,
                padding: "10px 16px",
                fontWeight: 700,
                cursor: busy ? "progress" : "pointer",
              },
            },
            busy ? "Deleting..." : (confirmLabel || "Delete")
          )
        )
      )
    );
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
  function PastOrderRow({ order, onDeleteRequest }) {
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
              React.createElement("span", { className: "qb-detail-meta-value" }, order.pickup_time ? 
                new Date(order.pickup_time).toLocaleString("en-US" , {
                  day : "2-digit",
                  month : "short",
                  year : "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12 : true
                }) : "—")
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
                className: "qb-delete-order-btn",
                onClick: (e) => {
                  e.stopPropagation();
                  if (typeof onDeleteRequest === "function") onDeleteRequest(order);
                },
                "aria-label": "Delete past order " + order.order_id,
              },
              React.createElement("i", { className: "fas fa-trash-alt", "aria-hidden": "true" }),
              React.createElement("span", null, "Delete")
            ),
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

  function OrdersTab({ currentOrders, pastOrders, mostOrderedItem, user, onSaveUser, onDeletePastOrder }) {
    const [tab, setTab] = useState(function () {
      const hash = String((window.location.hash || "").replace("#", "") || "").toLowerCase();
      return hash === "past" || hash === "settings" ? hash : "current";
    });
    const [pastLimit, setPastLimit] = useState(6);
    const [nowTs, setNowTs] = useState(Date.now());
    const [pendingDeleteOrder, setPendingDeleteOrder] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

    function switchTab(nextTab) {
      setTab(nextTab);
      try {
        window.location.hash = nextTab === "current" ? "overview" : nextTab;
      } catch (error) {
        // ignore
      }
    }

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

    useEffect(() => {
      if (pastLimit > sortedPast.length && sortedPast.length > 0) {
        setPastLimit((n) => Math.min(n, sortedPast.length));
      }
      if (sortedPast.length === 0) {
        setPendingDeleteOrder(null);
        setPastLimit(6);
      }
    }, [pastLimit, sortedPast.length]);

    function requestDeletePastOrder(order) {
      setPendingDeleteOrder(order);
    }

    function cancelDeletePastOrder() {
      if (deleteBusy) return;
      setPendingDeleteOrder(null);
    }

    async function confirmDeletePastOrder() {
      if (!pendingDeleteOrder || typeof onDeletePastOrder !== "function") return;
      setDeleteBusy(true);
      try {
        onDeletePastOrder(pendingDeleteOrder.order_id);
        notify("Past order removed from this dashboard view.", "success");
        setPendingDeleteOrder(null);
      } finally {
        setDeleteBusy(false);
      }
    }

    return React.createElement(
      "div",
      { className: "qb-stack" },
      React.createElement(
        "div",
        { className: "qb-tabs" },
        React.createElement(
          "button",
          { type: "button", className: "qb-tab" + (tab === "current" ? " is-active" : ""), onClick: () => switchTab("current") },
          "Current Orders"
        ),
        React.createElement(
          "button",
          { type: "button", className: "qb-tab" + (tab === "past" ? " is-active" : ""), onClick: () => switchTab("past") },
          "Past Orders"
        ),
        React.createElement(
          "button",
          { type: "button", className: "qb-tab" + (tab === "settings" ? " is-active" : ""), onClick: () => switchTab("settings") },
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
                    React.createElement(PastOrderRow, { key: order.order_id, order, onDeleteRequest: requestDeletePastOrder })
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
          : React.createElement(SettingsSection, { user, onSaveUser }),
      pendingDeleteOrder
        ? React.createElement(DangerModal, {
          title: "Delete this past order from your view?",
          message: "Are you sure you want to remove order " + pendingDeleteOrder.order_id + " from your past orders list? This is a UI-only change for now and will not delete anything from the database.",
          busy: deleteBusy,
          confirmLabel: "Delete Order",
          onCancel: cancelDeletePastOrder,
          onConfirm: confirmDeletePastOrder,
        })
        : null
    );
  }

  function SettingsSection({ user, onSaveUser }) {
    const [fullName, setFullName] = useState(user?.fullName || user?.name || "");
    const [email] = useState(user?.email || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const passwordScore = newPw ? scorePassword(newPw) : 0;
    const passwordLabel = newPw ? PASSWORD_STRENGTH_LABELS[passwordScore] : "";
    const passwordColor = newPw ? PASSWORD_STRENGTH_COLORS[passwordScore] : "";

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

    async function deleteAccount() {
      setDeleteBusy(true);
      try {
        await window.QuickBiteApi.deleteProfile();
        notify("Your account has been deleted.", "success");
        signOut();
      } catch (error) {
        notify(error.message, "err");
      } finally {
        setDeleteBusy(false);
        setDeleteModalOpen(false);
      }
    }

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
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
              React.createElement(
                "label",
                { className: "qb-field" },
                React.createElement("span", { className: "qb-label" }, "New Password"),
                React.createElement("input", { className: "qb-input", type: "password", value: newPw, onChange: (e) => setNewPw(e.target.value), placeholder: "At least 8 characters" }),
                React.createElement(
                  "div",
                  { className: "pw-strength" },
                  React.createElement(
                    "div",
                    { className: "strength-bar strength-" + passwordScore },
                    React.createElement("span", { className: "seg" }),
                    React.createElement("span", { className: "seg" }),
                    React.createElement("span", { className: "seg" }),
                    React.createElement("span", { className: "seg" })
                  ),
                  React.createElement("p", { className: "strength-label", style: { color: passwordColor } }, passwordLabel),
                  React.createElement(
                    "ul",
                    { className: "pw-criteria" },
                    React.createElement("li", { className: newPw.length >= 8 ? "met" : "" }, "At least 8 characters"),
                    React.createElement("li", { className: /[A-Z]/.test(newPw) ? "met" : "" }, "One uppercase letter"),
                    React.createElement("li", { className: /[0-9]/.test(newPw) ? "met" : "" }, "One number"),
                    React.createElement("li", { className: /[^A-Za-z0-9]/.test(newPw) ? "met" : "" }, "One special character")
                  )
                )
              ),
              React.createElement("label", { className: "qb-field" }, React.createElement("span", { className: "qb-label" }, "Confirm Password"), React.createElement("input", { className: "qb-input", type: "password", value: confirmPw, onChange: (e) => setConfirmPw(e.target.value), placeholder: "Repeat new password" }))
            )
          ),
          React.createElement(
            "div",
            {
              className: "qb-card qb-card-pad",
              style: {
                border: "1px solid  #8B0F08",
                background: "#F2E8D5"
              },
            },
            React.createElement(
              "div",
              { className: "delete-account" },
              React.createElement("span", { className: "del-acc-title", }, "Delete Your Account")
            ),
            React.createElement(
              "div",
              { className: "qb-form" },
              React.createElement(
                "p",
                { style: { margin: 0, color: "rgba(17, 24, 39, 0.78)", lineHeight: 1.6 } },
                "This will permanently remove your profile and sign you out of QuickBite."
              ),
              React.createElement(
                "button",
                {
                  type: "button",
                  onClick: function () { setDeleteModalOpen(true); },
                  style: {
                    width: "fit-content",
                    border: "none",
                    background: " #8B0F08",
                    color: "var(--color-white)",
                    borderRadius: 12,
                    padding: "12px 18px",
                    fontWeight: 700,
                    cursor: "pointer",
                  },
                },
                "Delete Your Account"
              )
            )
          )
        )
      ),
      deleteModalOpen
        ? React.createElement(DangerModal, {
          
          title: "Delete your account?",
          message: "This action cannot be undone. Please confirm that you want to permanently delete your QuickBite profile.",
          busy: deleteBusy,
          confirmLabel: "Delete Account",
          onCancel: function () { setDeleteModalOpen(false); },
          onConfirm: deleteAccount,
        })
        : null
    );
  }

  function CustomerDashboardApp() {
    const [user, setUser] = useState(readAuthUser());
    const [data, setData] = useState({ currentOrders: [], pastOrders: [] });
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const hasLoadedOrdersRef = useRef(false);
    const pollTimerRef = useRef(null);
    const profileMenuRef = useRef(null);

    function applyOrders(result, options) {
      const nextCurrentOrders = result.currentOrders || [];
      const nextPastOrders = result.pastOrders || [];
      const nextOrders = nextCurrentOrders.concat(nextPastOrders);
      const nextSnapshot = toOrderSnapshotMap(nextOrders);
      const previousSnapshot = readStoredOrderCache();
      const shouldNotify = Boolean(options && options.notifyChanges && hasLoadedOrdersRef.current);

      if (shouldNotify) {
        nextOrders.forEach(function (order) {
          const previous = previousSnapshot[order.order_id];
          const nextStatus = String(order.status || "").toLowerCase();
          if (!previous || !previous.status || previous.status === nextStatus) return;
          notify(statusMessageForCustomer(order, nextStatus), nextStatus === "ready" || nextStatus === "completed" || nextStatus === "delivered" ? "success" : "info");
        });
      }

      writeStoredOrderCache(nextSnapshot);
      hasLoadedOrdersRef.current = true;
      setData({
        currentOrders: nextCurrentOrders,
        pastOrders: nextPastOrders
      });
    }

    useEffect(() => {
      function onDocumentClick(event) {
        if (!profileMenuRef.current || profileMenuRef.current.contains(event.target)) return;
        setProfileMenuOpen(false);
      }

      document.addEventListener("click", onDocumentClick);
      return function cleanup() {
        document.removeEventListener("click", onDocumentClick);
      };
    }, []);

    useEffect(() => {
      const u = readAuthUser();
      if (!u) { window.location.replace("index.html"); return; }
      const role = String(u.role || "customer").toLowerCase();
      if (role === "vendor" || role === "admin") { window.location.replace("admin-dashboard.html"); return; }
      setUser(u);

      let cancelled = false;

      function loadOrders(notifyChanges) {
        return window.QuickBiteApi.getMyOrders()
          .then(function (result) {
            if (cancelled) return;
            applyOrders(result, { notifyChanges: notifyChanges });
          })
          .catch(function (error) {
            if (cancelled) return;
            if (!hasLoadedOrdersRef.current) {
              setData({ currentOrders: [], pastOrders: [] });
            }
            notify(error.message, "err");
          });
      }

      loadOrders(false);
      pollTimerRef.current = window.setInterval(function () {
        loadOrders(true);
      }, CUSTOMER_ORDER_POLL_MS);

      return function cleanup() {
        cancelled = true;
        if (pollTimerRef.current) {
          window.clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
      };
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

    function onDeletePastOrder(orderId) {
      setData(function (prev) {
        return {
          currentOrders: prev.currentOrders,
          pastOrders: (prev.pastOrders || []).filter(function (order) {
            return order.order_id !== orderId;
          }),
        };
      });
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
            React.createElement(
              "div",
              { className: "qb-profile-menu", ref: profileMenuRef },
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "btn user-btn signed-in btn-user-signed",
                  onClick: function (event) {
                    event.stopPropagation();
                    setProfileMenuOpen(function (open) { return !open; });
                  },
                  "aria-expanded": profileMenuOpen ? "true" : "false",
                  "aria-label": displayName,
                },
                React.createElement("div", { className: "user-avatar" }, initials.charAt(0)),
                React.createElement("span", { className: "user-greeting" }, "Hi, ", React.createElement("strong", null, displayName.split(" ")[0] || displayName)),
                React.createElement("i", { className: "fas fa-chevron-down user-dropdown-icon" }),
                React.createElement(
                  "div",
                  { className: "user-dropdown" + (profileMenuOpen ? " show" : "") },
                  React.createElement("a", { href: "#settings", className: "dropdown-item", onClick: function () { setProfileMenuOpen(false); } }, React.createElement("i", { className: "fas fa-user-gear" }), " Profile"),
                  React.createElement("a", {
                    href: "#",
                    className: "dropdown-item",
                    onClick: function (event) {
                      event.preventDefault();
                      event.stopPropagation();
                      if (typeof window.toggleNotifications === "function") window.toggleNotifications();
                      setProfileMenuOpen(false);
                    }
                  }, React.createElement("i", { className: "fas fa-bell" }), " Notifications"),
                  React.createElement("a", { href: "#", className: "dropdown-item", onClick: function (event) { event.preventDefault(); signOut(); } }, React.createElement("i", { className: "fas fa-sign-out-alt" }), " Log Out")
                )
              )
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
          React.createElement(OrdersTab, { currentOrders: data.currentOrders, pastOrders: data.pastOrders, mostOrderedItem, user, onSaveUser, onDeletePastOrder })
        )
      )
    );
  }

  const rootEl = document.getElementById("customerDashboardRoot");
  if (!rootEl) return;
  const root = ReactDOM.createRoot(rootEl);
  root.render(React.createElement(CustomerDashboardApp));
})();
