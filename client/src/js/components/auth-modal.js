document.addEventListener('DOMContentLoaded', function () {
    function storeSession(data) {
        if (window.QuickBiteApi && typeof window.QuickBiteApi.setToken === "function") {
            window.QuickBiteApi.setToken(data.token || "");
        } else {
            try {
                if (data.token) {
                    localStorage.setItem("quickbite-auth-token", data.token);
                }
            } catch (error) {
                // ignore
            }
        }
    }

    const AUTH_API_BASE = window.QUICKBITE_AUTH_API || "http://localhost:5000/api/auth";
    const modal = document.getElementById('authModal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const openers = document.querySelectorAll('[data-auth-open]');
    const closers = document.querySelectorAll('[data-auth-close]');
    const switchers = document.querySelectorAll('[data-auth-switch]');
    const topBack = document.querySelector('[data-auth-back]');

    /* ── Greeting ── */
    function setGreeting() {
        const el = document.getElementById('greetingText');
        if (!el) return;
        const h = new Date().getHours();
        const word = h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';
        el.innerHTML = `<span style="color:var(--color-red)">${word}</span>, Welcome To QuickBite.`;
    }
    setGreeting();
    setInterval(setGreeting, 60000);

    function notify(message, type = 'error') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
            return;
        }

        window.alert(message);
    }

    function showFormError(form, message) {
        form.querySelectorAll('.auth-form-error').forEach(e => e.remove());
        notify(message, 'error');
    }

    function clearFormError(form) {
        form.querySelectorAll('.auth-form-error').forEach(e => e.remove());
    }

    function redirectToAuthApp(redirectPath) {
        const fallback = redirectPath || '/customer-dashboard.html';
        try {
            const origin = new URL(AUTH_API_BASE).origin;
            const pathPart = fallback.startsWith('/') ? fallback : '/' + fallback;
            window.location.assign(origin + pathPart);
        } catch (error) {
            window.location.href = fallback;
        }
    }

    function stayOnHomeAfterAuth() {
        const page = String(document.body?.dataset?.page || '').toLowerCase();
        const path = String(window.location.pathname || '').toLowerCase();
        const isHome = page === 'home' || path.endsWith('/index.html') || path === '/' || path.endsWith('\\index.html');

        if (isHome) {
            if (typeof window.updateHeaderUserState === 'function') {
                try { window.updateHeaderUserState(); } catch (e) { /* ignore */ }
            }
            return;
        }

        window.location.href = 'index.html';
    }

    /* ── Invalid field highlight ── */
    function markInvalid(input) {
        input.classList.add('field-invalid');
    }
    function clearInvalid(input) {
        input.classList.remove('field-invalid');
    }
    function clearAll(container) {
        container.querySelectorAll('.field-invalid').forEach(i => i.classList.remove('field-invalid'));
        container.querySelectorAll('.auth-form-error').forEach(e => e.remove());
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
    }

    // Clear red border as user types
    modal.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('input', () => clearInvalid(inp));
    });

    const registerEmailInput = document.getElementById('regEmail');
    let emailCheckTimer = null;
    let emailCheckRequestId = 0;
    let checkedEmailValue = '';
    let checkedEmailAvailable = null;

    function resetRegisterEmailCheck() {
        checkedEmailValue = '';
        checkedEmailAvailable = null;
    }

    async function checkRegisterEmailAvailability(options = {}) {
        if (!registerEmailInput) return true;

        const silent = !!options.silent;
        const showTakenToast = !!options.showTakenToast;
        const showNetworkToast = !!options.showNetworkToast;
        const email = registerEmailInput.value.trim().toLowerCase();

        if (!email) {
            resetRegisterEmailCheck();
            return false;
        }

        if (!isValidEmail(email)) {
            checkedEmailValue = email;
            checkedEmailAvailable = false;
            return false;
        }

        if (checkedEmailValue === email && checkedEmailAvailable !== null) {
            if (!checkedEmailAvailable) {
                markInvalid(registerEmailInput);
                if (showTakenToast) {
                    notify('Email already exists. Please login.', 'error');
                }
            }
            return checkedEmailAvailable;
        }

        const requestId = ++emailCheckRequestId;
        checkedEmailValue = email;
        checkedEmailAvailable = null;

        try {
            const response = await fetch(AUTH_API_BASE + '/check-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            if (requestId !== emailCheckRequestId) return false;

            if (!response.ok || !data.ok) {
                throw new Error(data.message || 'Email check failed');
            }

            checkedEmailAvailable = !!data.available;

            if (checkedEmailAvailable) {
                clearInvalid(registerEmailInput);
            } else {
                markInvalid(registerEmailInput);
                if (showTakenToast) {
                    notify('Email already exists. Please login.', 'error');
                }
            }

            return checkedEmailAvailable;
        } catch (error) {
            if (requestId !== emailCheckRequestId) return false;

            checkedEmailAvailable = null;
            if (!silent && showNetworkToast) {
                notify(error.message, 'error');
            }
            return false;
        }
    }

    if (registerEmailInput) {
        registerEmailInput.addEventListener('input', () => {
            checkedEmailValue = '';
            checkedEmailAvailable = null;

            const email = registerEmailInput.value.trim();
            if (!email || !isValidEmail(email)) {
                return;
            }

            if (emailCheckTimer) clearTimeout(emailCheckTimer);
            emailCheckTimer = setTimeout(() => {
                checkRegisterEmailAvailability();
            }, 450);
        });

        registerEmailInput.addEventListener('blur', () => {
            if (emailCheckTimer) clearTimeout(emailCheckTimer);
            if (registerEmailInput.value.trim()) {
                checkRegisterEmailAvailability({ showTakenToast: true });
            }
        });
    }

    /* ── Required asterisks ── */
    ['loginEmail', 'loginPassword', 'regEmail', 'regName', 'regPhone', 'regPassword', 'regPasswordConfirm']
        .forEach(id => {
            const label = modal.querySelector(`label[for="${id}"]`);
            if (!label || label.querySelector('.req-star')) return;
            const star = document.createElement('span');
            star.className = 'req-star';
            star.setAttribute('aria-hidden', 'true');
            star.textContent = ' *';
            label.appendChild(star);
        });

    /* ── Modal open / close ── */
    function openModal(type) {
        modal.setAttribute('aria-hidden', 'false');
        type === 'register' ? showRegister() : showLogin();
    }
    function closeModal() {
        modal.setAttribute('aria-hidden', 'true');
        modal.querySelectorAll('.pw-toggle').forEach(btn => {
            const inp = document.getElementById(btn.getAttribute('data-target'));
            if (!inp) return;
            inp.type = 'password';
            btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
            btn.setAttribute('aria-label', 'Show password');
        });
        clearAll(modal);
        resetRegSteps();
    }
    function showLogin() {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        if (topBack) topBack.style.visibility = 'hidden';
        clearAll(modal);
    }
    function showRegister() {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        clearAll(modal);
        resetRegisterEmailCheck();
        resetRegSteps();
    }

    openers.forEach(o => o.addEventListener('click', e => {
        e.preventDefault();
        openModal(o.getAttribute('data-auth-open') || 'login');
    }));
    closers.forEach(c => c.addEventListener('click', e => { e.preventDefault(); closeModal(); }));
    switchers.forEach(s => s.addEventListener('click', e => {
        e.preventDefault();
        s.getAttribute('data-auth-switch') === 'register' ? showRegister() : showLogin();
    }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    /* ── Password toggles ── */
    modal.querySelectorAll('.pw-toggle').forEach(btn => {
        const inp = document.getElementById(btn.getAttribute('data-target'));
        if (!inp) return;
        inp.type = 'password';
        btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
        btn.setAttribute('aria-label', 'Show password');
        btn.addEventListener('click', () => {
            const showing = inp.type === 'text';
            inp.type = showing ? 'password' : 'text';
            btn.innerHTML = showing ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
            btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
        });
    });

    /* ── Login validation ── */
    function validateLogin() {
        clearAll(loginForm);
        const email = document.getElementById('loginEmail');
        const pw = document.getElementById('loginPassword');
        let firstError = null;

        if (!email.value.trim()) {
            markInvalid(email);
            firstError = firstError || 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
            markInvalid(email);
            firstError = firstError || 'Please enter a valid email address.';
        }
        if (!pw.value) {
            markInvalid(pw);
            firstError = firstError || 'Password is required.';
        } else if (pw.value.length < 6) {
            markInvalid(pw);
            firstError = firstError || 'Password must be at least 6 characters.';
        }

        if (firstError) { showFormError(loginForm, firstError); return false; }
        return true;
    }

    const loginBtn = loginForm.querySelector('.auth-login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            if (!validateLogin()) return;

            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await fetch(AUTH_API_BASE + '/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok || !data.ok) {
                    throw new Error(data.message || 'Login failed');
                }

                storeSession(data);
                // Store user data in localStorage
                localStorage.setItem('quickbite-auth-user', JSON.stringify(data.user));

                // Update profile data
                try {
                    const prev = JSON.parse(localStorage.getItem('quickbite-profile') || 'null');
                    const merged = Object.assign({}, prev || {}, {
                        fullName: data.user.fullName,
                        email: data.user.email,
                        role: data.user.role
                    });
                    localStorage.setItem('quickbite-profile', JSON.stringify(merged));
                } catch (error) {
                    // ignore
                }

                closeModal();

                // Stay on home after auth
                setTimeout(() => {
                    stayOnHomeAfterAuth();
                }, 800);

            } catch (error) {
                showFormError(loginForm, error.message);
            }
        });
    }

    /* ── Registration — 2-step ── */
    const regContainer = registerForm.querySelector('.reg-steps');
    if (!regContainer) return;

    const steps = Array.from(regContainer.querySelectorAll('.reg-step'));
    const nextBtn = regContainer.querySelector('[data-reg-next]');
    const backBtn = regContainer.querySelector('[data-reg-back]');
    const registerBtn = regContainer.querySelector('.reg-controls .btn');
    const roleInput = document.getElementById('regRole');
    const roleButtons = Array.from(regContainer.querySelectorAll('[data-reg-role]'));

    let currentStep = 0;

    function getSelectedRole() {
        const role = String(roleInput?.value || 'customer').toLowerCase();
        return role === 'vendor' ? 'vendor' : 'customer';
    }

    function setSelectedRole(role) {
        const normalized = String(role || '').toLowerCase() === 'vendor' ? 'vendor' : 'customer';
        if (roleInput) roleInput.value = normalized;
        roleButtons.forEach((btn) => {
            btn.classList.toggle('is-selected', String(btn.getAttribute('data-reg-role') || '').toLowerCase() === normalized);
        });
    }

    function resetRegSteps() {
        currentStep = 0;
        renderStep();
        clearAll(regContainer);
        resetRegisterEmailCheck();
        renderStrength('');
        const pwConf = document.getElementById('regPasswordConfirm');
        if (pwConf) pwConf.classList.remove('mismatch');
        setSelectedRole('customer');
    }

    function renderStep() {
        steps.forEach((s, i) => s.classList.toggle('hidden', i !== currentStep));
        const showBack = currentStep > 0;
        if (backBtn) backBtn.style.visibility = showBack ? 'visible' : 'hidden';
        if (topBack) topBack.style.visibility = showBack ? 'visible' : 'hidden';
    }

    function validateStep0() {
        const step0 = steps[0];
        clearAll(step0);
        const email = document.getElementById('regEmail');
        const name = document.getElementById('regName');
        const phone = document.getElementById('regPhone');
        let firstError = null;

        if (!email.value.trim()) {
            markInvalid(email);
            firstError = firstError || 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
            markInvalid(email);
            firstError = firstError || 'Please enter a valid email address.';
        }
        if (!name.value.trim() || name.value.trim().length < 2) {
            markInvalid(name);
            firstError = firstError || 'Please enter your full name.';
        }
        if (!phone.value.trim() || !/^[\d\s\+\-\(\)]{7,15}$/.test(phone.value.trim())) {
            markInvalid(phone);
            firstError = firstError || 'Please enter a valid phone number.';
        }

        if (firstError) { showFormError(step0, firstError); return false; }
        return true;
    }

    function validateStep1() {
        const step1 = steps[1];
        clearAll(step1);
        const pw = document.getElementById('regPassword');
        const conf = document.getElementById('regPasswordConfirm');
        let firstError = null;

        if (!pw.value) {
            markInvalid(pw);
            firstError = 'Password is required.';
        } else if (pw.value.length < 8) {
            markInvalid(pw);
            firstError = 'Password must be at least 8 characters.';
        } else if (scorePassword(pw.value) < 2) {
            markInvalid(pw);
            firstError = 'Password is too weak — add uppercase letters, numbers, or symbols.';
        }

        if (!conf.value) {
            markInvalid(conf);
            firstError = firstError || 'Please confirm your password.';
        } else if (conf.value !== pw.value) {
            markInvalid(conf);
            firstError = firstError || 'Passwords do not match.';
        }

        if (firstError) { showFormError(step1, firstError); return false; }
        return true;
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', async () => {
            if (!validateStep0()) return;
            const isEmailAvailable = await checkRegisterEmailAvailability({ showTakenToast: true, showNetworkToast: true });
            if (!isEmailAvailable) {
                showFormError(steps[0], 'Please use an email address that is not already registered.');
                return;
            }
            currentStep = 1;
            renderStep();
        });
    }
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (currentStep > 0) { currentStep--; renderStep(); }
        });
    }
    if (topBack) {
        topBack.addEventListener('click', () => {
            if (currentStep > 0) { currentStep--; renderStep(); }
            else closeModal();
        });
    }
    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            if (!validateStep1()) return;

            // Require acceptance of Terms & Conditions
            const acceptEl = document.getElementById('regAcceptTos');
            if (acceptEl && !acceptEl.checked) {
                markInvalid(acceptEl);
                showFormError(steps[1], 'You must accept the Terms & Conditions to register.');
                return;
            }

            const isEmailAvailable = await checkRegisterEmailAvailability({ silent: true, showTakenToast: true });
            if (!isEmailAvailable) {
                markInvalid(registerEmailInput);
                currentStep = 0;
                renderStep();
                showFormError(steps[0], 'Please use an email address that is not already registered.');
                return;
            }

            const email = document.getElementById('regEmail').value.trim();
            const name = document.getElementById('regName').value.trim();
            const phone = document.getElementById('regPhone').value.trim();
            const password = document.getElementById('regPassword').value;
            const passwordConfirm = document.getElementById('regPasswordConfirm').value;
            const role = getSelectedRole();

            try {
                // Register the user
                const response = await fetch(AUTH_API_BASE + '/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        fullName: name,
                        phone,
                        password,
                        passwordConfirm,
                        role
                    })
                });

                const data = await response.json();

                if (!response.ok || !data.ok) {
                    throw new Error(data.message || 'Registration failed');
                }

                storeSession(data);
                // Store user data
                localStorage.setItem('quickbite-auth-user', JSON.stringify(data.user));

                try {
                    const prev = JSON.parse(localStorage.getItem('quickbite-profile') || 'null');
                    const merged = Object.assign({}, prev || {}, {
                        fullName: data.user.fullName,
                        email: data.user.email,
                        role: data.user.role
                    });
                    localStorage.setItem('quickbite-profile', JSON.stringify(merged));
                } catch (error) {
                    // ignore
                }

                closeModal();

                // Stay on home after auth
                setTimeout(() => {
                    stayOnHomeAfterAuth();
                }, 800);

            } catch (error) {
                showFormError(steps[1], error.message);
            }
        });
    }

    // Role selection buttons
    roleButtons.forEach((btn) => {
        btn.addEventListener('click', () => setSelectedRole(btn.getAttribute('data-reg-role')));
    });

    /* ── Password strength ── */
    const pwFieldWrap = document.getElementById('regPassword')?.closest('.field-wrap');
    if (pwFieldWrap && !document.getElementById('strengthBar')) {
        const ui = document.createElement('div');
        ui.className = 'pw-strength';
        ui.innerHTML = `
            <div class="strength-bar" id="strengthBar">
                <span class="seg"></span><span class="seg"></span>
                <span class="seg"></span><span class="seg"></span>
            </div>
            <p class="strength-label" id="strengthLabel" aria-live="polite"></p>
            <ul class="pw-criteria">
                <li data-crit="length">At least 8 characters</li>
                <li data-crit="upper">One uppercase letter</li>
                <li data-crit="number">One number</li>
                <li data-crit="special">One special character</li>
            </ul>`;
        pwFieldWrap.insertAdjacentElement('afterend', ui);
    }

    const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const STRENGTH_COLORS = ['', '#d64545', '#f0a500', '#57b846', '#16a34a'];

    function scorePassword(pw) {
        let s = 0;
        if (pw.length >= 8) s++;
        if (/[A-Z]/.test(pw)) s++;
        if (/[0-9]/.test(pw)) s++;
        if (/[^A-Za-z0-9]/.test(pw)) s++;
        return s;
    }

    function renderStrength(pw) {
        const bar = document.getElementById('strengthBar');
        const label = document.getElementById('strengthLabel');
        if (!bar || !label) return;
        const score = pw.length ? scorePassword(pw) : 0;
        bar.querySelectorAll('.seg').forEach((seg, i) => seg.classList.toggle('on', i < score));
        bar.className = 'strength-bar strength-' + score;
        label.textContent = pw.length ? (STRENGTH_LABELS[score] || '') : '';
        label.style.color = pw.length ? (STRENGTH_COLORS[score] || '') : '';
        document.querySelectorAll('.pw-criteria [data-crit]').forEach(li => {
            const c = li.getAttribute('data-crit');
            const met =
                c === 'length' ? pw.length >= 8 :
                    c === 'upper' ? /[A-Z]/.test(pw) :
                        c === 'number' ? /[0-9]/.test(pw) :
                            c === 'special' ? /[^A-Za-z0-9]/.test(pw) : false;
            li.classList.toggle('met', met);
        });
    }

    const pwInput = document.getElementById('regPassword');
    const pwConfirm = document.getElementById('regPasswordConfirm');
    if (pwInput) pwInput.addEventListener('input', () => { renderStrength(pwInput.value); clearInvalid(pwInput); });
    if (pwConfirm) pwConfirm.addEventListener('input', () => {
        pwConfirm.classList.toggle('mismatch', pwConfirm.value.length > 0 && pwConfirm.value !== pwInput?.value);
        clearInvalid(pwConfirm);
    });

    renderStep();
    renderStrength('');
});
