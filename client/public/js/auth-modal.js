document.addEventListener('DOMContentLoaded',function(){
    const modal = document.getElementById('authModal');
    const openers = document.querySelectorAll('[data-auth-open]');
    const closers = document.querySelectorAll('[data-auth-close]');
    const switchers = document.querySelectorAll('[data-auth-switch]');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    function open(type){
        modal.setAttribute('aria-hidden','false');
        if(type==='register') showRegister(); else showLogin();
    }
    function close(){
        modal.setAttribute('aria-hidden','true');
        // reset any password toggles back to hidden for accessibility
        const pwToggles = document.querySelectorAll('.pw-toggle');
        pwToggles.forEach(btn=>{
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if(!input) return;
            input.type = 'password';
            btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
            btn.setAttribute('aria-label','Show password');
        });
    }
    function showLogin(){
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        // hide top back on login
        const topBack = document.querySelector('[data-auth-back]');
        if(topBack) topBack.style.visibility = 'hidden';
    }
    function showRegister(){
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    }

    openers.forEach(o=>o.addEventListener('click',e=>{
        e.preventDefault();
        const t = o.getAttribute('data-auth-open') || 'login';
        open(t);
    }));
    closers.forEach(c=>c.addEventListener('click',e=>{e.preventDefault();close()}));

    switchers.forEach(s=>s.addEventListener('click',e=>{
        e.preventDefault();
        const t = s.getAttribute('data-auth-switch');
        if(t==='register') showRegister(); else showLogin();
    }));

    // password show/hide toggles
    const pwToggles = document.querySelectorAll('.pw-toggle');
    pwToggles.forEach(btn=>{
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if(!input) return;
        btn.addEventListener('click',()=>{
            if(input.type === 'password'){
                input.type = 'text';
                btn.innerHTML = '<i class="fas fa-eye"></i>';
                btn.setAttribute('aria-label','Hide password');
            } else {
                input.type = 'password';
                btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
                btn.setAttribute('aria-label','Show password');
            }
        });
    });

    // registration step handling (email -> role -> details)
    const regContainer = registerForm.querySelector('.reg-steps');
    if(regContainer){
        let step = 0;
        const steps = Array.from(regContainer.querySelectorAll('.step'));
        const btnNext = regContainer.querySelector('[data-reg-next]');
        const btnBack = regContainer.querySelector('[data-reg-back]');
        const roleBtns = Array.from(regContainer.querySelectorAll('.role-btn'));
        const pwInput = document.getElementById('regPassword');
        const pwConfirm = document.getElementById('regPasswordConfirm');
        const topBack = document.querySelector('[data-auth-back]');

        function render(){
            steps.forEach((s,i)=>{
                s.classList.toggle('hidden', i!==step);
            });
            btnBack.style.visibility = step===0? 'hidden':'visible';
            if(topBack) topBack.style.visibility = step===0? 'hidden':'visible';
            btnNext.textContent = (step===steps.length-1)? 'Finish' : 'Next';
        }

        function validateStep(){
            // basic validations per step
            if(step===0){ // email
                const email = document.getElementById('regEmail').value.trim();
                return email.includes('@');
            }
            if(step===1){ // role
                return !!regContainer.getAttribute('data-role');
            }
            if(step===2){ // combined details: name/phone/password
                const name = document.getElementById('regName').value.trim();
                const phone = document.getElementById('regPhone').value.trim();
                const pw = pwInput ? pwInput.value : '';
                const conf = pwConfirm ? pwConfirm.value : '';
                const pwOk = pw.length>=8 && pw===conf;
                return name.length>1 && phone.length>=7 && pwOk;
            }
            return true;
        }

        btnNext.addEventListener('click',()=>{
            if(step < steps.length-1){
                if(!validateStep()){
                    alert('Please complete the step correctly before proceeding.');
                    return;
                }
                step++; render();
            } else {
                if(!validateStep()){
                    alert('Please fix password/confirmation.');
                    return;
                }
                // Collect data (stub)
                const payload = {
                    email: document.getElementById('regEmail').value.trim(),
                    role: regContainer.getAttribute('data-role'),
                    name: document.getElementById('regName').value.trim(),
                    phone: document.getElementById('regPhone').value.trim()
                };
                alert('Registration submitted (stub) — ' + JSON.stringify(payload));
                close();
            }
        });

        btnBack.addEventListener('click',()=>{ if(step>0){ step--; render(); }});
        if(topBack){
            topBack.addEventListener('click',()=>{ if(step>0){ step--; render(); } else { close(); } });
        }

        roleBtns.forEach(b=>{
            b.addEventListener('click',()=>{
                roleBtns.forEach(x=>x.classList.remove('is-selected'));
                b.classList.add('is-selected');
                regContainer.setAttribute('data-role', b.getAttribute('data-role'));
            });
        });

        // password strength
        if(pwInput){
            const strengthBar = regContainer.querySelector('.strength-bar');
            const criteria = Array.from(regContainer.querySelectorAll('.pw-criteria li'));
            function scorePassword(pw){
                let score=0;
                if(pw.length>=8) score++;
                if(/[A-Z]/.test(pw)) score++;
                if(/[0-9]/.test(pw)) score++;
                if(/[^A-Za-z0-9]/.test(pw)) score++;
                return score;
            }
            function renderStrength(){
                const pw = pwInput.value || '';
                const sc = scorePassword(pw);
                    // update bars + set strength class
                    strengthBar.querySelectorAll('.seg').forEach((seg,i)=>{
                        seg.classList.toggle('on', i < sc);
                    });
                    // normalize strength class
                    strengthBar.classList.remove('strength-0','strength-1','strength-2','strength-3','strength-4');
                    strengthBar.classList.add('strength-' + sc);
                // update criteria
                criteria.forEach(li=>{
                    const crit = li.getAttribute('data-crit');
                    let ok=false;
                    if(crit==='length') ok = pw.length>=8;
                    if(crit==='upper') ok = /[A-Z]/.test(pw);
                    if(crit==='number') ok = /[0-9]/.test(pw);
                    if(crit==='special') ok = /[^A-Za-z0-9]/.test(pw);
                    li.classList.toggle('met', ok);
                });
            }
            pwInput.addEventListener('input', renderStrength);
            pwConfirm && pwConfirm.addEventListener('input', ()=>{
                // optional: visual for match
                pwConfirm.classList.toggle('mismatch', pwConfirm.value && pwConfirm.value !== pwInput.value);
            });
        }

        render();
    }

    // close on ESC
    document.addEventListener('keydown',e=>{ if(e.key==='Escape') close(); });
});
