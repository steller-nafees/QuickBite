document.addEventListener("DOMContentLoaded", function () {
    initCharCount();
    initForm();
    initFaqAnimations();
});

/* ─── Character counter ─────────────────────────────────────────────────── */

function initCharCount() {
    const textarea = document.getElementById("contactMessage");
    const counter  = document.getElementById("charCount");
    if (!textarea || !counter) return;

    textarea.addEventListener("input", function () {
        const len = textarea.value.length;
        counter.textContent = len + " / 500";
        counter.style.color = len > 450 ? "#c0392b" : "rgba(30,30,30,0.45)";
    });
}

/* ─── Form validation & submit ──────────────────────────────────────────── */

function initForm() {
    const form       = document.getElementById("contactForm");
    const submitBtn  = document.getElementById("submitBtn");
    const successEl  = document.getElementById("contactSuccess");
    const resetBtn   = document.getElementById("resetForm");

    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);

        // Simulate network request — replace with real fetch() call
        await delay(1800);

        setLoading(false);
        showSuccess();
    });

    if (resetBtn) {
        resetBtn.addEventListener("click", function () {
            form.reset();
            document.getElementById("charCount").textContent = "0 / 500";
            clearErrors();
            successEl.classList.remove("is-visible");
            form.style.display = "";
        });
    }

    // Live validation on blur
    ["contactName", "contactEmail", "contactSubject", "contactMessage"].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("blur", function () { validateField(id); });
            el.addEventListener("input", function () {
                if (el.classList.contains("is-invalid")) validateField(id);
            });
        }
    });

    function setLoading(state) {
        submitBtn.disabled = state;
        submitBtn.classList.toggle("is-loading", state);
    }

    function showSuccess() {
        form.style.display = "none";
        successEl.classList.add("is-visible");
    }
}

/* ─── Validation helpers ────────────────────────────────────────────────── */

function validateForm() {
    const fields = ["contactName", "contactEmail", "contactSubject", "contactMessage"];
    let valid = true;
    fields.forEach(function (id) {
        if (!validateField(id)) valid = false;
    });
    return valid;
}

function validateField(id) {
    const el = document.getElementById(id);
    if (!el) return true;

    const value = el.value.trim();
    let error   = "";

    if (id === "contactName") {
        if (!value) error = "Please enter your name.";
        else if (value.length < 2) error = "Name is too short.";
    }

    if (id === "contactEmail") {
        if (!value) error = "Please enter your email.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Enter a valid email address.";
    }

    if (id === "contactSubject") {
        if (!value) error = "Please choose a topic.";
    }

    if (id === "contactMessage") {
        if (!value) error = "Please write a message.";
        else if (value.length < 10) error = "Message is too short (min 10 characters).";
    }

    const errorEl = document.getElementById(id.replace("contact", "").toLowerCase() + "Error");

    if (error) {
        el.classList.add("is-invalid");
        if (errorEl) errorEl.textContent = error;
        return false;
    } else {
        el.classList.remove("is-invalid");
        if (errorEl) errorEl.textContent = "";
        return true;
    }
}

function clearErrors() {
    ["contactName", "contactEmail", "contactSubject", "contactMessage"].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove("is-invalid");
    });
    ["nameError", "emailError", "subjectError", "messageError"].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.textContent = "";
    });
}

/* ─── FAQ entrance animations ───────────────────────────────────────────── */

function initFaqAnimations() {
    const items = document.querySelectorAll(".faq-item");
    if (!items.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry, i) {
            if (entry.isIntersecting) {
                entry.target.style.animationDelay = (i * 0.07) + "s";
                entry.target.classList.add("faq-animate-in");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    items.forEach(function (item) {
        item.style.opacity = "0";
        item.style.transform = "translateY(16px)";
        observer.observe(item);
    });

    // Inject animation class styles once
    if (!document.getElementById("faq-anim-style")) {
        const style = document.createElement("style");
        style.id = "faq-anim-style";
        style.textContent = `
            .faq-animate-in {
                animation: faq-fade-in 0.45s ease forwards;
            }
            @keyframes faq-fade-in {
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
}

/* ─── Utility ───────────────────────────────────────────────────────────── */

function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
}