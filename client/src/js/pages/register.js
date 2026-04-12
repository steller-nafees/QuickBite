document.addEventListener("DOMContentLoaded", function () {
    // Check if user is already logged in
    try {
        const user = JSON.parse(localStorage.getItem("quickbite-auth-user"));
        if (user && user.email) {
            // Already logged in, redirect to appropriate dashboard
            const role = String(user.role || "customer").toLowerCase();
            if (role === "vendor") {
                window.location.replace("vendor-dashboard.html");
            } else if (role === "admin") {
                window.location.replace("admin-dashboard.html");
            } else {
                window.location.replace("customer-dashboard.html");
            }
            return;
        }
    } catch (error) {
        // ignore
    }

    const AUTH_API_BASE = window.QUICKBITE_AUTH_API || "http://localhost:5000/api/auth";

    const form = document.getElementById("registerForm");
    const progress = document.getElementById("registerProgress");
    const backBtn = document.getElementById("backBtn");
    const nextBtn = document.getElementById("nextBtn");
    const createBtn = document.getElementById("createBtn");

    const steps = Array.from(document.querySelectorAll(".register-step"));
    const step1 = document.querySelector('[data-step="1"]');
    const customerStep = document.querySelector('[data-step="2"][data-role="customer"]');
    const vendorStep = document.querySelector('[data-step="2"][data-role="vendor"]');
    const roleError = document.querySelector('[data-error-for="role"]');

    let selectedRole = "";
    const stagedEmail = (sessionStorage.getItem("quickbite-register-email") || "").trim().toLowerCase();

    document.getElementById("emailNoteCustomer").textContent = stagedEmail
        ? "Email: " + stagedEmail
        : "No email found. Please restart registration from modal.";

    document.getElementById("emailNoteVendor").textContent = stagedEmail
        ? "Email: " + stagedEmail
        : "No email found. Please restart registration from modal.";

    function redirectToAuthApp(redirectPath) {
        try {
            const origin = new URL(AUTH_API_BASE).origin;
            const pathPart = redirectPath.startsWith("/") ? redirectPath : "/" + redirectPath;
            window.location.assign(origin + pathPart);
        } catch (error) {
            window.location.href = redirectPath;
        }
    }

    function setToast(message, isError) {
        const old = document.querySelector(".register-toast");
        if (old) old.remove();

        const toast = document.createElement("div");
        toast.className = "register-toast" + (isError ? " error" : "");
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(function () {
            if (toast.parentNode) toast.remove();
        }, 2600);
    }

    function setStep(stepNumber) {
        steps.forEach(function (step) {
            step.classList.remove("is-active");
        });

        if (stepNumber === 1) {
            step1.classList.add("is-active");
        } else if (selectedRole === "vendor") {
            vendorStep.classList.add("is-active");
        } else {
            customerStep.classList.add("is-active");
        }

        const percent = stepNumber === 1 ? 50 : 100;
        progress.innerHTML = `
            <div class="progress-header">
                <div class="progress-label">Step ${stepNumber} of 2</div>
                <div class="progress-steps">
                    <span class="progress-chip ${stepNumber === 1 ? "is-active" : ""}">Role</span>
                    <span class="progress-chip ${stepNumber === 2 ? "is-active" : ""}">Details</span>
                </div>
            </div>
            <div class="progress-track"><span style="width:${percent}%"></span></div>
        `;

        backBtn.style.display = stepNumber === 1 ? "none" : "inline-flex";
        nextBtn.style.display = stepNumber === 1 ? "inline-flex" : "none";
        createBtn.style.display = stepNumber === 2 ? "inline-flex" : "none";
    }

    function getPasswordChecks(password) {
        return {
            length: password.length >= 8,
            mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };
    }

    // Returns Weak/Medium/Strong + suggestions using required rule checks.
    function getPasswordStrength(password) {
        const checks = getPasswordChecks(password);
        const passed = Object.values(checks).filter(Boolean).length;

        let level = "Weak";
        let color = "#dc2626";
        if (passed >= 4) {
            level = "Strong";
            color = "#16a34a";
        } else if (passed >= 2) {
            level = "Medium";
            color = "#ca8a04";
        }

        const suggestions = [];
        if (!checks.length) suggestions.push("Use at least 8 characters");
        if (!checks.mixedCase) suggestions.push("Add uppercase and lowercase letters");
        if (!checks.number) suggestions.push("Add at least one number");
        if (!checks.special) suggestions.push("Add at least one special character");

        return {
            checks,
            level,
            color,
            percent: (passed / 4) * 100,
            suggestionText: suggestions.length ? "Tip: " + suggestions.join("; ") : "Great password."
        };
    }

    function updateChecklist(checklistId, checks) {
        const root = document.getElementById(checklistId);
        if (!root) return;

        root.querySelectorAll("li[data-rule]").forEach(function (item) {
            const rule = item.getAttribute("data-rule");
            item.classList.toggle("is-met", !!checks[rule]);
        });
    }

    function attachStrengthMeter(config) {
        const passwordInput = document.getElementById(config.passwordId);
        const strengthText = document.getElementById(config.textId);
        const strengthBar = document.getElementById(config.barId);
        const suggestionText = document.getElementById(config.suggestionId);
        const track = strengthBar ? strengthBar.parentElement : null;

        if (!passwordInput || !strengthText || !strengthBar || !suggestionText || !track) {
            return;
        }

        passwordInput.addEventListener("input", function () {
            const result = getPasswordStrength(passwordInput.value);

            strengthText.textContent = "Strength: " + result.level;
            strengthText.style.color = result.color;

            strengthBar.style.width = result.percent + "%";
            strengthBar.style.background = result.color;

            suggestionText.textContent = result.suggestionText;
            suggestionText.style.color = result.color;

            track.setAttribute("aria-valuenow", String(Math.round(result.percent)));
            updateChecklist(config.checklistId, result.checks);
        });
    }

    async function postJson(url, payload) {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok || !data.ok) {
            throw new Error(data.message || "Request failed");
        }

        return data;
    }

    function clearErrors(scope) {
        scope.querySelectorAll(".input-error").forEach(function (el) {
            el.classList.remove("input-error");
        });
    }

    function readRole() {
        const selected = form.querySelector('input[name="role"]:checked');
        return selected ? selected.value : "";
    }

    nextBtn.addEventListener("click", function () {
        selectedRole = readRole();
        roleError.textContent = "";

        if (!selectedRole) {
            roleError.textContent = "Please select a role to continue.";
            return;
        }

        setStep(2);
    });

    backBtn.addEventListener("click", function () {
        setStep(1);
    });

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!stagedEmail) {
            setToast("Missing email. Please start from registration modal.", true);
            return;
        }

        selectedRole = readRole();
        if (!selectedRole) {
            setToast("Please select a role first.", true);
            setStep(1);
            return;
        }

        const scope = selectedRole === "vendor" ? vendorStep : customerStep;
        clearErrors(scope);

        let fullName = "";
        let phone = "";
        let password = "";
        let confirmPassword = "";

        if (selectedRole === "vendor") {
            const vendorBusiness = scope.querySelector('[name="vendorBusiness"]');
            const phoneField = scope.querySelector('[name="phoneVendor"]');
            const passwordField = scope.querySelector('[name="passwordVendor"]');
            const confirmField = scope.querySelector('[name="confirmPasswordVendor"]');

            fullName = vendorBusiness.value.trim();
            phone = phoneField.value.trim();
            password = passwordField.value;
            confirmPassword = confirmField.value;

            if (!fullName) vendorBusiness.classList.add("input-error");
            if (!phone) phoneField.classList.add("input-error");
            if (!password) passwordField.classList.add("input-error");
            if (!confirmPassword) confirmField.classList.add("input-error");
        } else {
            const fullNameField = scope.querySelector('[name="fullNameCustomer"]');
            const phoneField = scope.querySelector('[name="phoneCustomer"]');
            const passwordField = scope.querySelector('[name="passwordCustomer"]');
            const confirmField = scope.querySelector('[name="confirmPasswordCustomer"]');

            fullName = fullNameField.value.trim();
            phone = phoneField.value.trim();
            password = passwordField.value;
            confirmPassword = confirmField.value;

            if (!fullName) fullNameField.classList.add("input-error");
            if (!phone) phoneField.classList.add("input-error");
            if (!password) passwordField.classList.add("input-error");
            if (!confirmPassword) confirmField.classList.add("input-error");
        }

        if (scope.querySelector(".input-error")) {
            setToast("Please fill all required fields.", true);
            return;
        }

        if (password !== confirmPassword) {
            setToast("Passwords do not match.", true);
            return;
        }

        const strength = getPasswordStrength(password);
        if (strength.level === "Weak") {
            setToast("Password is weak. Improve it before continuing.", true);
            return;
        }

        try {
            const check = await postJson(AUTH_API_BASE + "/check-email", { email: stagedEmail });
            if (!check.available) {
                setToast("Email already exists. Please login.", true);
                return;
            }

            const result = await postJson(AUTH_API_BASE + "/register", {
                email: stagedEmail,
                fullName,
                phone,
                password,
                role: selectedRole
            });

            localStorage.setItem("quickbite-auth-user", JSON.stringify(result.user));
            try {
                const prev = JSON.parse(localStorage.getItem("quickbite-profile") || "null");
                const merged = Object.assign({}, prev || {}, {
                    fullName: result.user.fullName,
                    email: result.user.email,
                    role: result.user.role
                });
                localStorage.setItem("quickbite-profile", JSON.stringify(merged));
            } catch (error) {
                /* ignore */
            }
            sessionStorage.removeItem("quickbite-register-email");
            redirectToAuthApp(result.redirectTo);
        } catch (error) {
            setToast(error.message, true);
        }
    });

    attachStrengthMeter({
        passwordId: "passwordCustomer",
        textId: "strengthCustomer",
        barId: "strengthBarCustomer",
        suggestionId: "suggestionCustomer",
        checklistId: "checklistCustomer"
    });

    attachStrengthMeter({
        passwordId: "passwordVendor",
        textId: "strengthVendor",
        barId: "strengthBarVendor",
        suggestionId: "suggestionVendor",
        checklistId: "checklistVendor"
    });

    setStep(1);
});
