(function () {
    function ensureContainer() {
        let c = document.getElementById('qb-toast-container');
        if (!c) {
            c = document.createElement('div');
            c.id = 'qb-toast-container';
            document.body.appendChild(c);
        }
        return c;
    }

    const errorSVG = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10" cy="10" r="8"/><line x1="10" y1="6" x2="10" y2="10"/><line x1="10" y1="13.5" x2="10" y2="14"/></svg>`;
    const successSVG = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10" cy="10" r="8"/><polyline points="6,10 9,13 14,7"/></svg>`;

    window.showToast = function (message, type = 'error') {
        const titles = { error: 'Something went wrong', success: 'All done!', info: 'Heads up' };
        const container = ensureContainer();

        const toast = document.createElement('div');
        toast.className = 'qb-toast' + (type === 'success' ? ' success' : type === 'info' ? ' info' : '');
        toast.innerHTML = `
            <div class="qb-toast-icon">${type === 'success' ? successSVG : errorSVG}</div>
            <div class="qb-toast-body">
                <p class="qb-toast-title">${titles[type] || titles.error}</p>
                <p class="qb-toast-msg">${message}</p>
            </div>
            <button class="qb-toast-close" aria-label="Dismiss">&#x2715;</button>
            <div class="qb-toast-progress"></div>`;

        container.appendChild(toast);

        const dismiss = () => {
            toast.classList.add('dismissing');
            toast.addEventListener('animationend', () => toast.remove(), { once: true });
        };

        toast.querySelector('.qb-toast-close').addEventListener('click', dismiss);
        setTimeout(dismiss, 5000);
    };
})();