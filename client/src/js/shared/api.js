(function () {
    var origin = window.QUICKBITE_API_ORIGIN || "http://localhost:5000";
    var APP_API_BASE = origin + "/api/app";
    var TOKEN_KEY = "quickbite-auth-token";

    function getToken() {
        try {
            return localStorage.getItem(TOKEN_KEY) || "";
        } catch (error) {
            return "";
        }
    }

    function setToken(token) {
        try {
            if (token) {
                localStorage.setItem(TOKEN_KEY, token);
            } else {
                localStorage.removeItem(TOKEN_KEY);
            }
        } catch (error) {
            // ignore
        }
    }

    async function request(path, options) {
        var config = options || {};
        var headers = Object.assign({}, config.headers || {});
        var token = getToken();

        if (token) {
            headers.Authorization = "Bearer " + token;
        }

        if (config.body && !headers["Content-Type"]) {
            headers["Content-Type"] = "application/json";
        }

        var response = await fetch(APP_API_BASE + path, Object.assign({}, config, { headers: headers }));
        var data = await response.json().catch(function () { return {}; });

        if (!response.ok || data.ok === false) {
            throw new Error(data.message || "Request failed");
        }

        return data;
    }

    window.QuickBiteApi = {
        getToken: getToken,
        setToken: setToken,
        request: request,
        getCatalog: function () {
            return request("/catalog", { method: "GET" });
        },
        getVendor: function (vendorId) {
            return request("/vendors/" + encodeURIComponent(vendorId), { method: "GET" });
        },
        getMyOrders: function () {
            return request("/me/orders", { method: "GET" });
        },
        getOrderHeartbeat: function (orderId) {
            return request("/orders/heartbeat/" + encodeURIComponent(orderId), { method: "GET" });
        },
        updateProfile: function (payload) {
            return request("/me/profile", {
                method: "PATCH",
                body: JSON.stringify(payload)
            });
        },
        deleteProfile: function () {
            return request("/me/profile", {
                method: "DELETE"
            });
        },
        updatePassword: function (payload) {
            return request("/me/password", {
                method: "PATCH",
                body: JSON.stringify(payload)
            });
        },
        placeOrder: function (payload) {
            return request("/orders", {
                method: "POST",
                body: JSON.stringify(payload)
            });
        },
        getAdminDashboard: function () {
            return request("/admin/dashboard", { method: "GET" });
        },
        createFood: function (payload) {
            return request("/admin/foods", {
                method: "POST",
                body: JSON.stringify(payload)
            });
        },
        updateFood: function (id, payload) {
            return request("/admin/foods/" + encodeURIComponent(id), {
                method: "PATCH",
                body: JSON.stringify(payload)
            });
        },
        deleteFood: function (id) {
            return request("/admin/foods/" + encodeURIComponent(id), {
                method: "DELETE"
            });
        },
        updateOrderStatus: function (id, payload) {
            return request("/admin/orders/" + encodeURIComponent(id) + "/status", {
                method: "PATCH",
                body: JSON.stringify(payload)
            });
        }
    };
})();
