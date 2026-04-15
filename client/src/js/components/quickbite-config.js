/**
 * API runs on npm (default port 5000). Go Live / other dev servers use another port — still call :5000.
 */
(function () {
    var loc = window.location;
    var origin;
    if (!loc.protocol || loc.protocol === "file:") {
        origin = "http://localhost:5000";
    } else if (loc.port === "5000") {
        origin = loc.origin;
    } else {
        origin = loc.protocol + "//" + loc.hostname + ":5000";
    }
    window.QUICKBITE_API_ORIGIN = origin;
    window.QUICKBITE_AUTH_API = origin + "/api/auth";
})();
